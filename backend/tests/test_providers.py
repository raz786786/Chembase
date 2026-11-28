"""Comprehensive unit and API tests for ChemBase Pro 9Router Multi-Provider AI Hub."""

import asyncio
import json
import os
import socket
import sys
from pathlib import Path
from typing import Any, Dict, List
from unittest.mock import AsyncMock, patch

import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure backend root is importable
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.database import Base, get_db  # noqa: E402
from app.main import _RATE_BUCKETS, app  # noqa: E402
from app.providers.admin_auth import clear_auth_cache  # noqa: E402
from app.providers.catalog import PROVIDER_CATALOG, get_catalog_item  # noqa: E402
from app.providers.crypto import (  # noqa: E402
    CryptoError,
    DecryptionError,
    decrypt_api_key,
    encrypt_api_key,
    mask_api_key,
)
from app.providers.security import scrub_secrets, validate_safe_outbound_url  # noqa: E402
from app.providers.universal_client import (  # noqa: E402
    chat_completion,
    discover_models,
    filter_chat_models,
    test_model as probe_model,
)


# ── Helpers & Fixtures ───────────────────────────────────────────────────────


class FakeAsyncClient:
    """Minimal httpx.AsyncClient drop-in for deterministic async unit tests."""

    def __init__(self, handler, **kwargs):
        self._handler = handler
        self.init_kwargs = kwargs

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def get(self, url: str, **kwargs):
        return self._handler("GET", url, kwargs)

    async def post(self, url: str, **kwargs):
        return self._handler("POST", url, kwargs)


def _make_response(status_code: int, json_body: Any = None, text: str = "") -> httpx.Response:
    req = httpx.Request("GET", "https://example.test")
    if json_body is not None:
        return httpx.Response(status_code=status_code, json=json_body, request=req)
    return httpx.Response(status_code=status_code, text=text, request=req)


@pytest.fixture()
def client():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def _override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _override_get_db
    _RATE_BUCKETS.clear()
    clear_auth_cache()

    with TestClient(app) as tc:
        yield tc

    app.dependency_overrides.clear()
    _RATE_BUCKETS.clear()
    clear_auth_cache()


# ── 1. Crypto Tests ──────────────────────────────────────────────────────────


def test_crypto_roundtrip_and_tamper_rejection(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "development")
    monkeypatch.setenv("CHEMBASE_MASTER_KEY", "test-master-secret-key-2026")

    raw = "sk-proj-supersecretkey1234567890abcd"
    enc = encrypt_api_key(raw)
    assert enc.startswith("v1:")
    assert raw not in enc
    assert decrypt_api_key(enc) == raw

    # Tamper with ciphertext
    parts = enc.split(":")
    tampered_ct = ("A" if parts[2][0] != "A" else "B") + parts[2][1:]
    tampered = f"{parts[0]}:{parts[1]}:{tampered_ct}"
    with pytest.raises(DecryptionError):
        decrypt_api_key(tampered)

    # Missing v1 prefix
    with pytest.raises(DecryptionError):
        decrypt_api_key("plaintext-legacy-key")


def test_crypto_fails_closed_in_production_without_master_key(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.delenv("CHEMBASE_MASTER_KEY", raising=False)
    with pytest.raises(CryptoError):
        encrypt_api_key("sk-test-1234567890")


def test_mask_api_key_variants():
    assert mask_api_key("sk-proj-abcdefgh1234") == "sk-proj-••••••••••••1234"
    assert mask_api_key("sk-ant-api03-xyz9876") == "sk-ant-••••••••••••9876"
    assert mask_api_key("gsk_abcdef1234567890") == "gsk_••••••••••••7890"
    assert mask_api_key("AIzaSyD1234567890abcd") == "AIza••••••••••••abcd"
    assert mask_api_key("nvapi-1234567890wxyz") == "nvapi-••••••••••••wxyz"
    assert mask_api_key("short") == "••••••••••••"
    assert mask_api_key("") == ""


# ── 2. Security (SSRF & Secret Scrubbing) Tests ──────────────────────────────


@pytest.mark.parametrize(
    "bad_url",
    [
        "http://127.0.0.1:8000/v1",
        "http://[::1]:8000/v1",
        "http://169.254.169.254/latest/meta-data/",
        "http://metadata.google.internal/computeMetadata/v1/",
        "http://localhost:11434",
        "file:///etc/passwd",
        "ftp://api.openai.com/v1",
        "http://10.0.0.5/v1",
        "http://192.168.1.10/v1",
        "http://172.16.0.2/v1",
        "https://service.local/v1",
        "https://db.internal/v1",
        "https://api.localhost/v1",
    ],
)
def test_ssrf_validator_blocks_unsafe_urls(bad_url):
    safe, reason = validate_safe_outbound_url(bad_url)
    assert safe is False
    assert reason


def test_ssrf_validator_blocks_dns_resolving_to_private_ip(monkeypatch):
    def fake_getaddrinfo(host, port, type=0):
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("127.0.0.1", port))]

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)
    safe, reason = validate_safe_outbound_url("https://rebind.evil.example/v1")
    assert safe is False
    assert "private" in reason.lower() or "loopback" in reason.lower()


def test_ssrf_validator_allows_public_https_url(monkeypatch):
    def fake_getaddrinfo(host, port, type=0):
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("104.18.7.192", port))]

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)
    safe, reason = validate_safe_outbound_url("https://api.openai.com/v1")
    assert safe is True
    assert reason == ""


def test_ssrf_validator_fails_closed_on_dns_error(monkeypatch):
    def failing_getaddrinfo(host, port, type=0):
        raise socket.gaierror("DNS resolution failed")

    monkeypatch.setattr(socket, "getaddrinfo", failing_getaddrinfo)
    safe, reason = validate_safe_outbound_url("https://unresolvable.example.invalid/v1")
    assert safe is False
    assert "resolved" in reason.lower()

    # Explicitly opting out of DNS resolution still allows syntax-valid public hostnames
    safe_no_dns, reason_no_dns = validate_safe_outbound_url(
        "https://unresolvable.example.invalid/v1", resolve_dns=False
    )
    assert safe_no_dns is True
    assert reason_no_dns == ""


def test_scrub_secrets_redacts_all_key_patterns():
    raw = (
        "Error with Bearer eyJhbGciOiJIUzI1NiJ9.abc.def and "
        "sk-1234567890abcdef gsk_9876543210fedcba AIzaSyA123456789012345 "
        "nvapi-abcdef1234567890"
    )
    scrubbed = scrub_secrets(raw)
    assert "eyJhbGciOiJIUzI1NiJ9" not in scrubbed
    assert "1234567890abcdef" not in scrubbed
    assert "9876543210fedcba" not in scrubbed
    assert "AIzaSyA123456789012345" not in scrubbed
    assert "abcdef1234567890" not in scrubbed
    assert "[REDACTED]" in scrubbed


# ── 3. Catalog & Chat Model Filter Tests ─────────────────────────────────────


def test_catalog_has_40_plus_unique_providers_across_all_tiers():
    assert len(PROVIDER_CATALOG) >= 40
    ids = [p.id for p in PROVIDER_CATALOG]
    assert len(ids) == len(set(ids))
    tiers = {p.tier for p in PROVIDER_CATALOG}
    assert {"frontier", "high_speed", "open_source", "aggregator"}.issubset(tiers)
    assert get_catalog_item("openai") is not None
    assert get_catalog_item("anthropic").protocol == "anthropic_compatible"
    assert get_catalog_item("google").protocol == "google"
    assert get_catalog_item("ollama").protocol == "ollama"


def test_filter_chat_models_removes_non_chat_and_deduplicates_preserving_case():
    raw = [
        "GPT-4o",
        "gpt-4o",
        "text-embedding-3-large",
        "tts-1-hd",
        "whisper-1",
        "dall-e-3",
        "omni-moderation-latest",
        "text-davinci-003",
        "gemini-1.0-pro",
        "claude-sonnet-4-20250514",
        "deepseek-reasoner",
        "  ",
    ]
    filtered = filter_chat_models(raw)
    assert filtered == ["GPT-4o", "claude-sonnet-4-20250514", "deepseek-reasoner"]


# ── 4. Universal Client Protocol Tests (Mocked httpx) ────────────────────────


def test_universal_client_google_uses_header_never_query_param(monkeypatch):
    captured: List[Dict[str, Any]] = []

    def fake_getaddrinfo(host, port, type=0):
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("142.250.190.10", port))]

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)

    def handler(method: str, url: str, kwargs: Dict[str, Any]):
        captured.append({"method": method, "url": url, "headers": kwargs.get("headers", {})})
        if method == "GET":
            return _make_response(
                200,
                {
                    "models": [
                        {"name": "models/gemini-2.5-flash", "supportedGenerationMethods": ["generateContent"]},
                        {"name": "models/text-embedding-004", "supportedGenerationMethods": ["embedContent"]},
                    ]
                },
            )
        return _make_response(
            200,
            {"candidates": [{"content": {"parts": [{"text": "OK"}]}}]},
        )

    with patch("app.providers.universal_client.httpx.AsyncClient", side_effect=lambda **kw: FakeAsyncClient(handler, **kw)):
        disc = asyncio.run(discover_models("google", "https://generativelanguage.googleapis.com", "AIzaTestKey1234567890"))
        assert disc["ok"] is True
        assert disc["models"] == ["gemini-2.5-flash"]

        probe = asyncio.run(probe_model("google", "https://generativelanguage.googleapis.com", "AIzaTestKey1234567890", "gemini-2.5-flash"))
        assert probe["ok"] is True
        assert probe["preview"] == "OK"

    for call in captured:
        assert "key=" not in call["url"]
        assert call["headers"].get("x-goog-api-key") == "AIzaTestKey1234567890"


def test_universal_client_openai_404_models_returns_non_fatal_warning(monkeypatch):
    def fake_getaddrinfo(host, port, type=0):
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", port))]

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)

    def handler(method: str, url: str, kwargs: Dict[str, Any]):
        return _make_response(404, {"error": "Not found"})

    with patch("app.providers.universal_client.httpx.AsyncClient", side_effect=lambda **kw: FakeAsyncClient(handler, **kw)):
        disc = asyncio.run(discover_models("openai_compatible", "https://proxy.example.com/v1", "sk-test-12345678"))
        assert disc["ok"] is True
        assert disc["status_code"] == 404
        assert disc["models"] == []
        assert disc.get("warning")


def test_universal_client_anthropic_chat_completion(monkeypatch):
    def fake_getaddrinfo(host, port, type=0):
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("104.18.32.47", port))]

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)

    def handler(method: str, url: str, kwargs: Dict[str, Any]):
        assert kwargs["headers"]["x-api-key"] == "sk-ant-test-12345678"
        assert kwargs["headers"]["anthropic-version"] == "2023-06-01"
        assert kwargs["json"]["system"] == "You are a chemist."
        return _make_response(200, {"model": "claude-sonnet-4-20250514", "content": [{"type": "text", "text": "H2O"}]})

    with patch("app.providers.universal_client.httpx.AsyncClient", side_effect=lambda **kw: FakeAsyncClient(handler, **kw)):
        res = asyncio.run(
            chat_completion(
                protocol="anthropic_compatible",
                base_url="https://api.anthropic.com/v1",
                api_key="sk-ant-test-12345678",
                model_id="claude-sonnet-4-20250514",
                messages=[
                    {"role": "system", "content": "You are a chemist."},
                    {"role": "user", "content": "Formula for water?"},
                ],
            )
        )
        assert res["ok"] is True
        assert res["text"] == "H2O"


# ── 5. Admin Auth Guard Tests ────────────────────────────────────────────────


def test_admin_auth_rejects_missing_and_non_admin_and_ignores_user_metadata(client, monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://proj.supabase.co")
    monkeypatch.setenv("SUPABASE_ANON_KEY", "anon-key")
    monkeypatch.delenv("CHEMBASE_ADMIN_SECRET", raising=False)

    # 1. Missing token -> 401
    r = client.get("/api/admin/providers/catalog")
    assert r.status_code == 401

    # 2. Invalid token -> 401
    def bad_token_handler(method, url, kwargs):
        return _make_response(401, {"error": "invalid"})

    with patch("app.providers.admin_auth.httpx.AsyncClient", side_effect=lambda **kw: FakeAsyncClient(bad_token_handler, **kw)):
        r = client.get("/api/admin/providers/catalog", headers={"Authorization": "Bearer bad-jwt"})
        assert r.status_code == 401

    # 3. Non-admin email with forged user_metadata.role == "admin" -> MUST BE 403!
    def forged_user_handler(method, url, kwargs):
        return _make_response(
            200,
            {
                "id": "user-2",
                "email": "attacker@example.com",
                "user_metadata": {"role": "admin"},
                "app_metadata": {"role": "student"},
            },
        )

    with patch("app.providers.admin_auth.httpx.AsyncClient", side_effect=lambda **kw: FakeAsyncClient(forged_user_handler, **kw)):
        r = client.get("/api/admin/providers/catalog", headers={"Authorization": "Bearer non-admin-jwt"})
        assert r.status_code == 403

    # 4. Legitimate admin email -> 200
    def admin_email_handler(method, url, kwargs):
        return _make_response(
            200,
            {
                "id": "admin-1",
                "email": "raoa87442@gmail.com",
                "app_metadata": {},
            },
        )

    with patch("app.providers.admin_auth.httpx.AsyncClient", side_effect=lambda **kw: FakeAsyncClient(admin_email_handler, **kw)):
        r = client.get("/api/admin/providers/catalog", headers={"Authorization": "Bearer valid-admin-jwt"})
        assert r.status_code == 200
        data = r.json()
        assert data["total_providers"] >= 40


def test_admin_auth_accepts_app_metadata_role_and_admin_secret(client, monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://proj.supabase.co")
    monkeypatch.setenv("CHEMBASE_ADMIN_SECRET", "super-admin-secret-xyz")

    # Via X-Admin-Secret
    r = client.get("/api/admin/providers/catalog", headers={"X-Admin-Secret": "super-admin-secret-xyz"})
    assert r.status_code == 200

    # Via app_metadata.role == "admin"
    def role_admin_handler(method, url, kwargs):
        return _make_response(
            200,
            {
                "id": "admin-2",
                "email": "other-admin@chembase.org",
                "app_metadata": {"role": "admin"},
            },
        )

    with patch("app.providers.admin_auth.httpx.AsyncClient", side_effect=lambda **kw: FakeAsyncClient(role_admin_handler, **kw)):
        r = client.get("/api/admin/providers/catalog", headers={"Authorization": "Bearer role-admin-jwt"})
        assert r.status_code == 200


# ── 6. Full Router CRUD, Sync, Test, Active Models & Chat Proxy Tests ────────


def test_provider_router_full_lifecycle(client, monkeypatch):
    monkeypatch.setenv("CHEMBASE_ADMIN_SECRET", "test-secret")
    monkeypatch.setenv("ENVIRONMENT", "development")
    headers = {"X-Admin-Secret": "test-secret"}

    def fake_getaddrinfo(host, port, type=0):
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("104.18.7.192", port))]

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)

    # 1. Reject SSRF base_url on create
    bad = client.post(
        "/api/admin/providers/connections",
        headers=headers,
        json={
            "provider_id": "custom-evil",
            "display_name": "Evil",
            "protocol": "openai_compatible",
            "base_url": "http://169.254.169.254/latest",
            "api_key": "sk-1234567890",
            "is_custom": True,
        },
    )
    assert bad.status_code == 400

    # 2. Create OpenAI connection
    raw_secret = "sk-proj-secretvalue9876543210"
    created = client.post(
        "/api/admin/providers/connections",
        headers=headers,
        json={"provider_id": "openai", "api_key": raw_secret},
    )
    assert created.status_code == 200
    body = created.json()
    assert raw_secret not in json.dumps(body)
    conn_id = body["connection"]["id"]
    assert body["connection"]["key_masked"] == "sk-proj-••••••••••••3210"

    # 3. Edit without api_key preserves stored key
    edited = client.post(
        "/api/admin/providers/connections",
        headers=headers,
        json={"provider_id": "openai", "display_name": "OpenAI Production"},
    )
    assert edited.status_code == 200
    assert edited.json()["connection"]["display_name"] == "OpenAI Production"
    assert edited.json()["connection"]["key_masked"] == "sk-proj-••••••••••••3210"

    # 4. Sync Models (mocked upstream)
    def sync_handler(method, url, kwargs):
        assert kwargs["headers"]["Authorization"] == f"Bearer {raw_secret}"
        return _make_response(
            200,
            {
                "data": [
                    {"id": "gpt-4o"},
                    {"id": "gpt-4.1"},
                    {"id": "text-embedding-3-small"},
                    {"id": "tts-1"},
                ]
            },
        )

    with patch("app.providers.universal_client.httpx.AsyncClient", side_effect=lambda **kw: FakeAsyncClient(sync_handler, **kw)):
        synced = client.post(f"/api/admin/providers/connections/{conn_id}/sync", headers=headers)
        assert synced.status_code == 200
        sdata = synced.json()
        assert sdata["ok"] is True
        assert sdata["synced_count"] == 2
        assert sdata["models"] == ["gpt-4o", "gpt-4.1"]

    # 5. Test Connection
    with patch("app.providers.universal_client.httpx.AsyncClient", side_effect=lambda **kw: FakeAsyncClient(sync_handler, **kw)):
        tested = client.post(f"/api/admin/providers/connections/{conn_id}/test", headers=headers)
        assert tested.status_code == 200
        assert tested.json()["ok"] is True

    # 6. Test Model & Chat Proxy
    def chat_handler(method, url, kwargs):
        assert kwargs["headers"]["Authorization"] == f"Bearer {raw_secret}"
        return _make_response(
            200,
            {"model": kwargs["json"]["model"], "choices": [{"message": {"content": "OK"}}]},
        )

    with patch("app.providers.universal_client.httpx.AsyncClient", side_effect=lambda **kw: FakeAsyncClient(chat_handler, **kw)):
        tm = client.post(
            f"/api/admin/providers/connections/{conn_id}/test-model",
            headers=headers,
            json={"model_id": "gpt-4o"},
        )
        assert tm.status_code == 200
        assert tm.json()["ok"] is True
        assert tm.json()["preview"] == "OK"

        # 7. Patch models: add custom model and disable gpt-4.1
        patched = client.patch(
            f"/api/admin/providers/connections/{conn_id}/models",
            headers=headers,
            json={"custom_models": ["gpt-4o-chem-ft"], "disabled_models": ["gpt-4.1"]},
        )
        assert patched.status_code == 200
        assert "gpt-4o-chem-ft" in patched.json()["connection"]["effective_models"]
        assert "gpt-4.1" not in patched.json()["connection"]["effective_models"]

        # 8. Active models endpoint (public, zero secrets)
        active = client.get("/api/ai/active-models")
        assert active.status_code == 200
        active_json = active.json()
        assert raw_secret not in json.dumps(active_json)
        model_ids = [m["model_id"] for m in active_json["models"]]
        assert "gpt-4o" in model_ids
        assert "gpt-4o-chem-ft" in model_ids
        assert "gpt-4.1" not in model_ids

        # 9. Universal chat proxy works for enabled model and blocks disabled model
        chat_ok = client.post(
            "/api/ai/chat",
            json={
                "provider_id": "openai",
                "model_id": "gpt-4o",
                "messages": [{"role": "user", "content": "Say OK"}],
            },
        )
        assert chat_ok.status_code == 200
        assert chat_ok.json()["text"] == "OK"

        chat_disabled = client.post(
            "/api/ai/chat",
            json={
                "provider_id": "openai",
                "model_id": "gpt-4.1",
                "messages": [{"role": "user", "content": "Say OK"}],
            },
        )
        assert chat_disabled.status_code == 403

        # Unlisted model not in effective_models must also be rejected with 403
        chat_unlisted = client.post(
            "/api/ai/chat",
            json={
                "provider_id": "openai",
                "model_id": "gpt-5-unauthorized",
                "messages": [{"role": "user", "content": "Say OK"}],
            },
        )
        assert chat_unlisted.status_code == 403
        assert "not enabled" in chat_unlisted.json()["detail"].lower()

    # 10. Test unsaved scrubs echoed secret and never saves
    def echo_err_handler(method, url, kwargs):
        return _make_response(401, text="Invalid key sk-unsavedsecret1234567890")

    with patch("app.providers.universal_client.httpx.AsyncClient", side_effect=lambda **kw: FakeAsyncClient(echo_err_handler, **kw)):
        unsaved = client.post(
            "/api/admin/providers/test-unsaved",
            headers=headers,
            json={
                "provider_id": "groq",
                "protocol": "openai_compatible",
                "api_key": "sk-unsavedsecret1234567890",
            },
        )
        assert unsaved.status_code == 200
        assert unsaved.json()["ok"] is False
        assert "sk-unsavedsecret1234567890" not in unsaved.text

    # 11. Delete connection
    deleted = client.delete(f"/api/admin/providers/connections/{conn_id}", headers=headers)
    assert deleted.status_code == 200
    assert deleted.json()["ok"] is True
    assert client.get("/api/ai/active-models").json()["count"] == 0


# ── 7. Security Hardening Regression Tests ───────────────────────────────────


def test_csv_safe_neutralizes_formula_injection():
    from app.main import _csv_safe

    assert _csv_safe("=CMD|' /C calc'!A0") == "'=CMD|' /C calc'!A0"
    assert _csv_safe("+1+1") == "'+1+1"
    assert _csv_safe("-2+3") == "'-2+3"
    assert _csv_safe("@SUM(1+1)") == "'@SUM(1+1)"
    assert _csv_safe("\tTabStart") == "'\tTabStart"
    assert _csv_safe("\rCarriageStart") == "'\rCarriageStart"
    assert _csv_safe("Water") == "Water"
    assert _csv_safe(18.015) == 18.015
    assert _csv_safe(None) == ""


def test_ai_chat_optional_require_ai_auth(client, monkeypatch):
    monkeypatch.setenv("REQUIRE_AI_AUTH", "true")
    resp = client.post(
        "/api/ai/chat",
        json={
            "provider_id": "openai",
            "model_id": "gpt-4o",
            "messages": [{"role": "user", "content": "Hello"}],
        },
    )
    assert resp.status_code == 401


def test_bulk_resolve_and_pubchem_enrich_caps_and_mp_validation(client):
    # bulk-resolve > 25 items -> 400
    r_bulk = client.post("/api/substances/bulk-resolve", json=[f"item{i}" for i in range(26)])
    assert r_bulk.status_code == 400

    # pubchem/enrich > 20 items -> 400
    r_enrich = client.post("/api/pubchem/enrich", json=[{"name": f"c{i}"} for i in range(21)])
    assert r_enrich.status_code == 400

    # materialsproject invalid chemsys -> 400
    r_mp = client.get("/api/proxy/materialsproject", params={"chemsys": "Fe-O&evil=1", "api_key": "test"})
    assert r_mp.status_code == 400


# ── 8. 9Router Parameter Normalization & NVIDIA NIM Regression Tests ─────────


def test_filter_chat_models_removes_nvidia_nim_non_chat_models():
    from app.providers.universal_client import filter_chat_models

    raw = [
        "nvidia/nemotron-3.5-embed-1b",
        "nvidia/nemotron-3.5-embed-8b",
        "nvidia/nv-embedqa-mistral-7b-v2",
        "nvidia/nvclip",
        "snowflake/arctic-embed-l",
        "nvidia/riva-translate-4b-instruct-v2",
        "nvidia/parakeet-ctc-1.1b-asr",
        "nvidia/fastpitch",
        "meta/llama-3.3-70b-instruct",
        "deepseek-ai/deepseek-r1",
        "z-ai/glm-5.3-flash",
    ]
    cleaned = filter_chat_models(raw)
    assert cleaned == [
        "meta/llama-3.3-70b-instruct",
        "deepseek-ai/deepseek-r1",
        "z-ai/glm-5.3-flash",
    ]


def test_9router_normalize_openai_request_reasoning_and_strict_providers():
    from app.providers.universal_client import normalize_openai_request

    # OpenAI o3 -> max_completion_tokens, no temperature
    hdrs, body = normalize_openai_request(
        "https://api.openai.com/v1",
        "o3-mini",
        [{"role": "user", "content": "Reply with OK"}],
        temperature=0.2,
        max_tokens=64,
    )
    assert body["max_completion_tokens"] == 64
    assert "max_tokens" not in body
    assert "temperature" not in body

    # Groq strict provider strips reasoning_content from assistant messages
    _, groq_body = normalize_openai_request(
        "https://api.groq.com/openai/v1",
        "llama-3.3-70b-versatile",
        [{"role": "assistant", "content": "Hi", "reasoning_content": "secret thought"}],
        temperature=0.2,
        max_tokens=64,
    )
    assert "reasoning_content" not in groq_body["messages"][0]

    # OpenRouter gets HTTP-Referer and X-Title headers
    or_hdrs, _ = normalize_openai_request(
        "https://openrouter.ai/api/v1",
        "google/gemini-2.5-flash",
        [{"role": "user", "content": "Hi"}],
        temperature=0.2,
        max_tokens=64,
    )
    assert or_hdrs["HTTP-Referer"] == "https://chembasepro.vercel.app"
    assert or_hdrs["X-Title"] == "ChemBase Pro"


def test_test_model_extracts_reasoning_content_for_nim_reasoning_models():
    from app.providers.universal_client import test_model

    def handler(method, url, kwargs):
        assert kwargs["json"]["max_tokens"] == 64
        return _make_response(
            200,
            {
                "model": "deepseek-ai/deepseek-r1",
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": "",
                            "reasoning_content": "The user wants OK.",
                        }
                    }
                ],
            },
        )

    with patch(
        "app.providers.universal_client.httpx.AsyncClient",
        side_effect=lambda **kw: FakeAsyncClient(handler, **kw),
    ):
        res = asyncio.run(
            test_model(
                protocol="openai_compatible",
                base_url="https://integrate.api.nvidia.com/v1",
                api_key="nvapi-testkey123456",
                model_id="deepseek-ai/deepseek-r1",
            )
        )
    assert res["ok"] is True
    assert res["preview"] == "The user wants OK."


def test_test_model_sow_parity_timeout_falls_back_to_live_catalog_and_429_is_active():
    import httpx
    from app.providers.universal_client import test_model

    # Case 1: NVIDIA NIM GPU cold start times out on /chat/completions, but model is live in GET /models
    def timeout_then_catalog(method, url, kwargs):
        if method == "POST" and url.endswith("/chat/completions"):
            raise httpx.ReadTimeout("timed out waiting for GPU")
        if method == "GET" and url.endswith("/models"):
            return _make_response(200, {"data": [{"id": "z-ai/glm-5.3-flash"}, {"id": "meta/llama-3.3-70b-instruct"}]})
        return _make_response(404, text="not found")

    with patch(
        "app.providers.universal_client.httpx.AsyncClient",
        side_effect=lambda **kw: FakeAsyncClient(timeout_then_catalog, **kw),
    ):
        res = asyncio.run(
            test_model(
                protocol="openai_compatible",
                base_url="https://integrate.api.nvidia.com/v1",
                api_key="nvapi-testkey123456",
                model_id="z-ai/glm-5.3-flash",
            )
        )
    assert res["ok"] is True
    assert "Verified in live catalog" in res["preview"]

    # Case 2: HTTP 429 rate-limit means credentials & model are active
    def rate_limit_handler(method, url, kwargs):
        return _make_response(429, {"error": {"message": "Too many requests"}})

    with patch(
        "app.providers.universal_client.httpx.AsyncClient",
        side_effect=lambda **kw: FakeAsyncClient(rate_limit_handler, **kw),
    ):
        res429 = asyncio.run(
            test_model(
                protocol="openai_compatible",
                base_url="https://integrate.api.nvidia.com/v1",
                api_key="nvapi-testkey123456",
                model_id="meta/llama-3.3-70b-instruct",
            )
        )
    assert res429["ok"] is True
    assert "Rate/Quota Limited" in res429["preview"]


def test_core_five_providers_present_and_sync_replaces_default_models():
    from app.providers.catalog import PROVIDER_CATALOG
    from app.providers.router import _effective_models_for_connection

    by_id = {item.id: item for item in PROVIDER_CATALOG}
    # All 5 former legacy providers must exist in the unified Multi-Provider Hub catalog
    for pid in ("google", "groq", "openrouter", "nvidia", "amazon-nova"):
        assert pid in by_id, f"Missing core provider '{pid}' in PROVIDER_CATALOG"

    # Once live API models are synced, stale default_models MUST NOT be included
    nvidia_spec = by_id["nvidia"]
    assert "nvidia/llama-3.1-nemotron-70b-instruct" not in nvidia_spec.default_models

    from types import SimpleNamespace
    conn = SimpleNamespace(
        provider_id="nvidia",
        synced_models=["z-ai/glm-5.3-flash", "meta/llama-3.3-70b-instruct"],
        custom_models=["my/custom-chem-model"],
        disabled_models=[],
    )
    effective = _effective_models_for_connection(conn)
    assert effective == [
        "z-ai/glm-5.3-flash",
        "meta/llama-3.3-70b-instruct",
        "my/custom-chem-model",
    ]
    # Unsynced default models (like deepseek-ai/deepseek-r1) must NOT leak when synced_models is populated
    assert "deepseek-ai/deepseek-r1" not in effective

