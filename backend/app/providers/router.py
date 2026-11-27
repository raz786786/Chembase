"""FastAPI router for 9Router-style Multi-Provider AI Hub and Universal Chat Proxy."""

from datetime import datetime, timezone
import os
import re
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import AIProviderConnection
from .admin_auth import _verify_supabase_token, require_admin
from .catalog import PROVIDER_CATALOG, get_catalog_item
from .crypto import CryptoError, DecryptionError, decrypt_api_key, encrypt_api_key, mask_api_key
from .security import scrub_secrets, validate_safe_outbound_url
from .universal_client import chat_completion, discover_models, test_model, validate_credentials

router = APIRouter(tags=["AI Providers"])

_VALID_PROTOCOLS = frozenset({"openai_compatible", "anthropic_compatible", "google", "ollama"})
_MODEL_ID_RE = re.compile(r"^[A-Za-z0-9._:/@\-]{1,160}$")


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _dedupe_str_list(items: Optional[List[str]]) -> List[str]:
    if not items:
        return []
    seen: set[str] = set()
    out: List[str] = []
    for raw in items:
        if not raw or not isinstance(raw, str):
            continue
        cleaned = raw.strip()
        if cleaned and cleaned.lower() not in seen:
            seen.add(cleaned.lower())
            out.append(cleaned)
    return out


def _effective_models_for_connection(conn: AIProviderConnection) -> List[str]:
    catalog_item = get_catalog_item(conn.provider_id)
    base_models = list(conn.synced_models or [])
    if not base_models and catalog_item:
        base_models = list(catalog_item.default_models)
    merged = _dedupe_str_list(base_models + list(conn.custom_models or []))
    disabled_lower = {m.lower() for m in (conn.disabled_models or []) if isinstance(m, str)}
    return [m for m in merged if m.lower() not in disabled_lower]


def _resolve_effective_base_url(conn: AIProviderConnection) -> str:
    if conn.base_url and conn.base_url.strip():
        return conn.base_url.strip()
    catalog_item = get_catalog_item(conn.provider_id)
    if catalog_item:
        return catalog_item.default_base_url
    return ""


def _serialize_connection(conn: AIProviderConnection) -> Dict[str, Any]:
    catalog_item = get_catalog_item(conn.provider_id)
    return {
        "id": conn.id,
        "provider_id": conn.provider_id,
        "display_name": conn.display_name,
        "protocol": conn.protocol,
        "base_url": conn.base_url or (catalog_item.default_base_url if catalog_item else ""),
        "key_masked": conn.key_masked or "",
        "has_key": bool(conn.encrypted_api_key),
        "is_custom": bool(conn.is_custom),
        "is_enabled": bool(conn.is_enabled),
        "is_valid": bool(conn.is_valid),
        "last_validated_at": conn.last_validated_at,
        "last_latency_ms": conn.last_latency_ms,
        "last_error": conn.last_error,
        "synced_models": list(conn.synced_models or []),
        "custom_models": list(conn.custom_models or []),
        "disabled_models": list(conn.disabled_models or []),
        "effective_models": _effective_models_for_connection(conn),
        "created_at": conn.created_at,
        "updated_at": conn.updated_at,
    }


def _get_connection_or_404(db: Session, connection_id: str) -> AIProviderConnection:
    conn = (
        db.query(AIProviderConnection)
        .filter(
            (AIProviderConnection.id == connection_id)
            | (AIProviderConnection.provider_id == connection_id)
        )
        .first()
    )
    if not conn:
        raise HTTPException(status_code=404, detail="Provider connection not found.")
    return conn


def _decrypt_connection_key(conn: AIProviderConnection) -> str:
    if not conn.encrypted_api_key:
        return ""
    try:
        return decrypt_api_key(conn.encrypted_api_key)
    except (DecryptionError, CryptoError) as exc:
        raise HTTPException(status_code=500, detail=f"Failed to decrypt stored provider key: {exc}")


# ── Pydantic Request Schemas ─────────────────────────────────────────────────


class ConnectionUpsertRequest(BaseModel):
    provider_id: Optional[str] = None
    display_name: Optional[str] = None
    protocol: Optional[str] = None
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    is_custom: bool = False
    is_enabled: bool = True
    custom_models: Optional[List[str]] = None


class TestModelRequest(BaseModel):
    model_id: str = Field(..., min_length=1, max_length=160)


class PatchModelsRequest(BaseModel):
    is_enabled: Optional[bool] = None
    custom_models: Optional[List[str]] = None
    disabled_models: Optional[List[str]] = None


class TestUnsavedRequest(BaseModel):
    provider_id: Optional[str] = None
    protocol: str = "openai_compatible"
    base_url: Optional[str] = None
    api_key: Optional[str] = ""
    model_id: Optional[str] = None


class ChatMessage(BaseModel):
    role: str = Field(..., min_length=1, max_length=32)
    content: str = Field(..., max_length=32000)


class UniversalChatRequest(BaseModel):
    provider_id: str = Field(..., min_length=1, max_length=80)
    model_id: str = Field(..., min_length=1, max_length=160)
    messages: List[ChatMessage] = Field(..., min_length=1, max_length=50)
    temperature: float = Field(default=0.2, ge=0.0, le=2.0)
    max_tokens: int = Field(default=2048, ge=1, le=8192)


# ── Admin Endpoints ──────────────────────────────────────────────────────────


@router.get("/api/admin/providers/catalog")
async def get_providers_catalog(
    db: Session = Depends(get_db),
    _admin: Dict[str, Any] = Depends(require_admin),
):
    """Return full 40+ provider catalog merged with stored connections (no plaintext secrets)."""
    connections = db.query(AIProviderConnection).all()
    conn_by_pid = {c.provider_id: c for c in connections}

    merged_providers: List[Dict[str, Any]] = []
    seen_pids: set[str] = set()

    for item in PROVIDER_CATALOG:
        seen_pids.add(item.id)
        conn = conn_by_pid.get(item.id)
        entry: Dict[str, Any] = {
            "id": item.id,
            "display_name": conn.display_name if conn else item.display_name,
            "tier": item.tier,
            "protocol": conn.protocol if conn else item.protocol,
            "default_base_url": item.default_base_url,
            "base_url": (conn.base_url or item.default_base_url) if conn else item.default_base_url,
            "description": item.description,
            "default_models": list(item.default_models),
            "api_key_docs_url": item.api_key_docs_url,
            "free_tier_available": item.free_tier_available,
            "requires_api_key": item.requires_api_key,
            "is_custom": False,
            "connected": conn is not None,
            "connection_id": conn.id if conn else None,
            "key_masked": conn.key_masked if conn else "",
            "has_key": bool(conn.encrypted_api_key) if conn else False,
            "is_enabled": bool(conn.is_enabled) if conn else False,
            "is_valid": bool(conn.is_valid) if conn else False,
            "last_validated_at": conn.last_validated_at if conn else None,
            "last_latency_ms": conn.last_latency_ms if conn else None,
            "last_error": conn.last_error if conn else None,
            "synced_models": list(conn.synced_models or []) if conn else [],
            "custom_models": list(conn.custom_models or []) if conn else [],
            "disabled_models": list(conn.disabled_models or []) if conn else [],
            "effective_models": _effective_models_for_connection(conn) if conn else list(item.default_models),
        }
        merged_providers.append(entry)

    # Append custom connections not in built-in catalog
    for conn in connections:
        if conn.provider_id in seen_pids:
            continue
        merged_providers.append(
            {
                "id": conn.provider_id,
                "display_name": conn.display_name,
                "tier": "custom",
                "protocol": conn.protocol,
                "default_base_url": conn.base_url or "",
                "base_url": conn.base_url or "",
                "description": f"Custom {conn.protocol.replace('_', ' ')} endpoint.",
                "default_models": [],
                "api_key_docs_url": "",
                "free_tier_available": False,
                "requires_api_key": conn.protocol != "ollama",
                "is_custom": True,
                "connected": True,
                "connection_id": conn.id,
                "key_masked": conn.key_masked or "",
                "has_key": bool(conn.encrypted_api_key),
                "is_enabled": bool(conn.is_enabled),
                "is_valid": bool(conn.is_valid),
                "last_validated_at": conn.last_validated_at,
                "last_latency_ms": conn.last_latency_ms,
                "last_error": conn.last_error,
                "synced_models": list(conn.synced_models or []),
                "custom_models": list(conn.custom_models or []),
                "disabled_models": list(conn.disabled_models or []),
                "effective_models": _effective_models_for_connection(conn),
            }
        )

    return {
        "providers": merged_providers,
        "connections": [_serialize_connection(c) for c in connections],
        "total_providers": len(merged_providers),
        "connected_count": len(connections),
    }


@router.post("/api/admin/providers/connections")
async def upsert_provider_connection(
    body: ConnectionUpsertRequest,
    db: Session = Depends(get_db),
    _admin: Dict[str, Any] = Depends(require_admin),
):
    """Create or update a built-in or custom provider connection with encrypted key storage."""
    raw_pid = (body.provider_id or "").strip().lower()
    catalog_item = get_catalog_item(raw_pid) if raw_pid else None

    if not raw_pid:
        if not body.is_custom:
            raise HTTPException(status_code=400, detail="provider_id is required for non-custom providers.")
        slug = re.sub(r"[^a-z0-9]+", "-", (body.display_name or "custom").lower()).strip("-")[:24] or "custom"
        raw_pid = f"custom-{slug}-{uuid.uuid4().hex[:6]}"

    protocol = (body.protocol or (catalog_item.protocol if catalog_item else "openai_compatible")).strip().lower()
    if protocol not in _VALID_PROTOCOLS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported protocol '{protocol}'. Must be one of: {', '.join(sorted(_VALID_PROTOCOLS))}.",
        )

    effective_base_url = (body.base_url or "").strip() or (catalog_item.default_base_url if catalog_item else "")
    if not effective_base_url:
        raise HTTPException(status_code=400, detail="base_url is required for custom providers.")

    safe, reason = validate_safe_outbound_url(effective_base_url)
    if not safe:
        raise HTTPException(status_code=400, detail=f"Unsafe base_url: {reason}")

    now = _utc_now_iso()
    existing = db.query(AIProviderConnection).filter(AIProviderConnection.provider_id == raw_pid).first()
    clean_api_key = (body.api_key or "").strip()

    if existing:
        if body.display_name and body.display_name.strip():
            existing.display_name = body.display_name.strip()
        existing.protocol = protocol
        if body.base_url is not None:
            existing.base_url = body.base_url.strip() or None
        existing.is_enabled = body.is_enabled
        if body.custom_models is not None:
            existing.custom_models = _dedupe_str_list(body.custom_models)
        # Preserve existing encrypted key if api_key omitted on edit
        if clean_api_key:
            try:
                existing.encrypted_api_key = encrypt_api_key(clean_api_key)
                existing.key_masked = mask_api_key(clean_api_key)
            except CryptoError as exc:
                raise HTTPException(status_code=500, detail=str(exc))
        existing.updated_at = now
        db.commit()
        db.refresh(existing)
        return {"ok": True, "connection": _serialize_connection(existing)}

    # New connection
    requires_key = catalog_item.requires_api_key if catalog_item else (protocol != "ollama")
    if requires_key and not clean_api_key:
        raise HTTPException(status_code=400, detail="api_key is required when creating this provider connection.")

    encrypted_key: Optional[str] = None
    masked = ""
    if clean_api_key:
        try:
            encrypted_key = encrypt_api_key(clean_api_key)
            masked = mask_api_key(clean_api_key)
        except CryptoError as exc:
            raise HTTPException(status_code=500, detail=str(exc))

    conn = AIProviderConnection(
        provider_id=raw_pid,
        display_name=(body.display_name or "").strip()
        or (catalog_item.display_name if catalog_item else raw_pid),
        protocol=protocol,
        base_url=(body.base_url or "").strip() or (None if catalog_item else effective_base_url),
        encrypted_api_key=encrypted_key,
        key_masked=masked,
        is_custom=bool(body.is_custom or catalog_item is None),
        is_enabled=body.is_enabled,
        is_valid=False,
        synced_models=[],
        custom_models=_dedupe_str_list(body.custom_models),
        disabled_models=[],
        created_at=now,
        updated_at=now,
    )
    db.add(conn)
    db.commit()
    db.refresh(conn)
    return {"ok": True, "connection": _serialize_connection(conn)}


@router.delete("/api/admin/providers/connections/{connection_id}")
async def delete_provider_connection(
    connection_id: str,
    db: Session = Depends(get_db),
    _admin: Dict[str, Any] = Depends(require_admin),
):
    """Delete a stored provider connection."""
    conn = _get_connection_or_404(db, connection_id)
    deleted_id = conn.id
    deleted_pid = conn.provider_id
    db.delete(conn)
    db.commit()
    return {"ok": True, "deleted_id": deleted_id, "provider_id": deleted_pid}


@router.post("/api/admin/providers/connections/{connection_id}/test")
async def test_provider_connection(
    connection_id: str,
    db: Session = Depends(get_db),
    _admin: Dict[str, Any] = Depends(require_admin),
):
    """Execute a live credential & endpoint check against the upstream provider."""
    conn = _get_connection_or_404(db, connection_id)
    base_url = _resolve_effective_base_url(conn)
    safe, reason = validate_safe_outbound_url(base_url)
    if not safe:
        raise HTTPException(status_code=400, detail=f"Unsafe base_url: {reason}")

    api_key = _decrypt_connection_key(conn)
    result = await validate_credentials(protocol=conn.protocol, base_url=base_url, api_key=api_key)

    now = _utc_now_iso()
    conn.is_valid = bool(result["ok"])
    conn.last_validated_at = now
    conn.last_latency_ms = result.get("latency_ms")
    conn.last_error = None if result["ok"] else scrub_secrets(str(result.get("message") or "Validation failed"))
    conn.updated_at = now
    db.commit()
    db.refresh(conn)

    return {
        "ok": result["ok"],
        "connection_id": conn.id,
        "provider_id": conn.provider_id,
        "status_code": result.get("status_code"),
        "latency_ms": result.get("latency_ms"),
        "message": scrub_secrets(str(result.get("message") or "")),
        "last_validated_at": now,
    }


@router.post("/api/admin/providers/connections/{connection_id}/sync")
async def sync_provider_models(
    connection_id: str,
    db: Session = Depends(get_db),
    _admin: Dict[str, Any] = Depends(require_admin),
):
    """Query the live upstream models endpoint, filter non-chat models, and persist them."""
    conn = _get_connection_or_404(db, connection_id)
    base_url = _resolve_effective_base_url(conn)
    safe, reason = validate_safe_outbound_url(base_url)
    if not safe:
        raise HTTPException(status_code=400, detail=f"Unsafe base_url: {reason}")

    api_key = _decrypt_connection_key(conn)
    result = await discover_models(protocol=conn.protocol, base_url=base_url, api_key=api_key)

    now = _utc_now_iso()
    discovered = list(result.get("models") or [])
    if result["ok"]:
        if discovered:
            conn.synced_models = discovered
        conn.is_valid = True
        conn.last_error = None
    else:
        conn.last_error = scrub_secrets(str(result.get("message") or "Model sync failed"))

    conn.last_validated_at = now
    conn.last_latency_ms = result.get("latency_ms")
    conn.updated_at = now
    db.commit()
    db.refresh(conn)

    return {
        "ok": result["ok"],
        "synced_count": len(discovered),
        "models": discovered,
        "effective_models": _effective_models_for_connection(conn),
        "status_code": result.get("status_code"),
        "latency_ms": result.get("latency_ms"),
        "message": scrub_secrets(str(result.get("message") or "")),
        "warning": result.get("warning"),
    }


@router.post("/api/admin/providers/connections/{connection_id}/test-model")
async def test_provider_model(
    connection_id: str,
    body: TestModelRequest,
    db: Session = Depends(get_db),
    _admin: Dict[str, Any] = Depends(require_admin),
):
    """Run a minimal live completion probe (max_tokens=16) against a specific model."""
    if not _MODEL_ID_RE.match(body.model_id.strip()):
        raise HTTPException(status_code=400, detail="Invalid model_id format.")

    conn = _get_connection_or_404(db, connection_id)
    base_url = _resolve_effective_base_url(conn)
    safe, reason = validate_safe_outbound_url(base_url)
    if not safe:
        raise HTTPException(status_code=400, detail=f"Unsafe base_url: {reason}")

    api_key = _decrypt_connection_key(conn)
    result = await test_model(
        protocol=conn.protocol,
        base_url=base_url,
        api_key=api_key,
        model_id=body.model_id.strip(),
    )

    now = _utc_now_iso()
    conn.last_validated_at = now
    conn.last_latency_ms = result.get("latency_ms")
    if result["ok"]:
        conn.is_valid = True
        conn.last_error = None
    else:
        conn.last_error = scrub_secrets(str(result.get("error") or "Model test failed"))
    conn.updated_at = now
    db.commit()

    return {
        "ok": result["ok"],
        "model_id": result["model_id"],
        "status_code": result.get("status_code"),
        "latency_ms": result.get("latency_ms"),
        "preview": scrub_secrets(str(result.get("preview") or "")),
        "error": scrub_secrets(str(result["error"])) if result.get("error") else None,
    }


@router.patch("/api/admin/providers/connections/{connection_id}/models")
async def patch_provider_models(
    connection_id: str,
    body: PatchModelsRequest,
    db: Session = Depends(get_db),
    _admin: Dict[str, Any] = Depends(require_admin),
):
    """Update provider enablement, custom_models, and disabled_models governance."""
    conn = _get_connection_or_404(db, connection_id)
    if body.is_enabled is not None:
        conn.is_enabled = body.is_enabled
    if body.custom_models is not None:
        conn.custom_models = _dedupe_str_list(body.custom_models)
    if body.disabled_models is not None:
        conn.disabled_models = _dedupe_str_list(body.disabled_models)
    conn.updated_at = _utc_now_iso()
    db.commit()
    db.refresh(conn)
    return {"ok": True, "connection": _serialize_connection(conn)}


@router.post("/api/admin/providers/test-unsaved")
async def test_unsaved_provider(
    body: TestUnsavedRequest,
    _admin: Dict[str, Any] = Depends(require_admin),
):
    """Live credential/model test before saving (never persists the key)."""
    catalog_item = get_catalog_item(body.provider_id or "") if body.provider_id else None
    protocol = (body.protocol or (catalog_item.protocol if catalog_item else "openai_compatible")).strip().lower()
    if protocol not in _VALID_PROTOCOLS:
        raise HTTPException(status_code=400, detail=f"Unsupported protocol '{protocol}'.")

    base_url = (body.base_url or "").strip() or (catalog_item.default_base_url if catalog_item else "")
    if not base_url:
        raise HTTPException(status_code=400, detail="base_url is required.")

    safe, reason = validate_safe_outbound_url(base_url)
    if not safe:
        raise HTTPException(status_code=400, detail=f"Unsafe base_url: {reason}")

    result = await validate_credentials(
        protocol=protocol,
        base_url=base_url,
        api_key=(body.api_key or "").strip(),
        model_id=(body.model_id or "").strip() or None,
    )
    return {
        "ok": result["ok"],
        "status_code": result.get("status_code"),
        "latency_ms": result.get("latency_ms"),
        "message": scrub_secrets(str(result.get("message") or "")),
    }


# ── Public / Application AI Routing Endpoints ────────────────────────────────


@router.get("/api/ai/active-models")
async def get_active_ai_models(db: Session = Depends(get_db)):
    """List enabled providers and their active models (zero secrets)."""
    connections = (
        db.query(AIProviderConnection)
        .filter(AIProviderConnection.is_enabled == True)  # noqa: E712
        .all()
    )
    active_models: List[Dict[str, Any]] = []
    for conn in connections:
        for model_id in _effective_models_for_connection(conn):
            active_models.append(
                {
                    "provider_id": conn.provider_id,
                    "display_name": conn.display_name,
                    "model_id": model_id,
                    "protocol": conn.protocol,
                    "is_custom": bool(conn.is_custom),
                }
            )
    return {"models": active_models, "count": len(active_models)}


@router.post("/api/ai/chat")
async def universal_ai_chat(
    body: UniversalChatRequest,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
):
    """Rate-limited universal chat proxy using server-stored encrypted provider credentials."""
    if os.getenv("REQUIRE_AI_AUTH", "").lower() == "true":
        if not authorization or not authorization.lower().startswith("bearer "):
            raise HTTPException(status_code=401, detail="Authentication required for AI chat.")
        token = authorization[7:].strip()
        if not token:
            raise HTTPException(status_code=401, detail="Empty Bearer authentication token.")
        await _verify_supabase_token(token)

    requested_model = body.model_id.strip()
    if not _MODEL_ID_RE.match(requested_model):
        raise HTTPException(status_code=400, detail="Invalid model_id format.")

    conn = (
        db.query(AIProviderConnection)
        .filter(AIProviderConnection.provider_id == body.provider_id.strip().lower())
        .first()
    )
    if not conn or not conn.is_enabled:
        raise HTTPException(status_code=404, detail=f"Provider '{body.provider_id}' is not connected or enabled.")

    disabled_lower = {m.lower() for m in (conn.disabled_models or []) if isinstance(m, str)}
    if requested_model.lower() in disabled_lower:
        raise HTTPException(status_code=403, detail=f"Model '{body.model_id}' is disabled by admin.")

    effective_models = _effective_models_for_connection(conn)
    if requested_model not in effective_models:
        raise HTTPException(status_code=403, detail="Model is not enabled for this provider.")

    base_url = _resolve_effective_base_url(conn)
    safe, reason = validate_safe_outbound_url(base_url)
    if not safe:
        raise HTTPException(status_code=400, detail=f"Unsafe provider base_url: {reason}")

    api_key = _decrypt_connection_key(conn)
    messages = [{"role": m.role, "content": m.content} for m in body.messages]

    result = await chat_completion(
        protocol=conn.protocol,
        base_url=base_url,
        api_key=api_key,
        model_id=body.model_id.strip(),
        messages=messages,
        temperature=body.temperature,
        max_tokens=body.max_tokens,
    )
    if not result["ok"]:
        status_code = result.get("status_code") or 502
        if status_code < 400 or status_code > 599:
            status_code = 502
        raise HTTPException(
            status_code=status_code,
            detail=scrub_secrets(str(result.get("error") or "Upstream chat completion failed.")),
        )

    return {
        "ok": True,
        "provider_id": conn.provider_id,
        "model": result.get("model") or body.model_id.strip(),
        "text": result.get("text") or "",
        "latency_ms": result.get("latency_ms"),
    }
