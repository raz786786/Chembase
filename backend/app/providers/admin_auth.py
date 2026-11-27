"""Admin authentication dependency using Supabase JWT verification + optional X-Admin-Secret."""

import hashlib
import hmac
import os
import time
from typing import Any, Dict, Optional, Set, Tuple

import httpx
from fastapi import Header, HTTPException

_TOKEN_CACHE: Dict[str, Tuple[float, Dict[str, Any]]] = {}
_CACHE_TTL_SECONDS = 60.0
_MAX_TOKEN_CACHE_SIZE = 512
_DEFAULT_ADMIN_EMAILS = "raoa87442@gmail.com"


def _get_admin_emails() -> Set[str]:
    raw = os.getenv("ADMIN_EMAILS", _DEFAULT_ADMIN_EMAILS)
    return {e.strip().lower() for e in raw.split(",") if e.strip()}


def _get_supabase_config() -> Tuple[str, str]:
    url = (os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or "").strip().rstrip("/")
    anon_key = (os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY") or "").strip()
    return url, anon_key


def clear_auth_cache() -> None:
    """Clear the short-lived token verification cache (useful in tests)."""
    _TOKEN_CACHE.clear()


async def _verify_supabase_token(token: str) -> Dict[str, Any]:
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    now = time.monotonic()
    cached = _TOKEN_CACHE.get(token_hash)
    if cached and (now - cached[0]) < _CACHE_TTL_SECONDS:
        return cached[1]

    supabase_url, anon_key = _get_supabase_config()
    if not supabase_url:
        raise HTTPException(
            status_code=503,
            detail="Admin authentication is not configured (SUPABASE_URL missing).",
        )

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }
    if anon_key:
        headers["apikey"] = anon_key

    try:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(8.0, connect=4.0),
            follow_redirects=False,
        ) as client:
            resp = await client.get(f"{supabase_url}/auth/v1/user", headers=headers)
    except Exception:
        raise HTTPException(status_code=503, detail="Unable to verify authentication token with Supabase.")

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token.")

    try:
        user_data = resp.json()
    except Exception:
        raise HTTPException(status_code=401, detail="Malformed authentication response.")

    if not isinstance(user_data, dict) or not user_data.get("id"):
        raise HTTPException(status_code=401, detail="Invalid user payload from auth provider.")

    if len(_TOKEN_CACHE) >= _MAX_TOKEN_CACHE_SIZE:
        expired_keys = [k for k, (ts, _) in _TOKEN_CACHE.items() if (now - ts) >= _CACHE_TTL_SECONDS]
        for k in expired_keys:
            _TOKEN_CACHE.pop(k, None)
        while len(_TOKEN_CACHE) >= _MAX_TOKEN_CACHE_SIZE:
            _TOKEN_CACHE.pop(next(iter(_TOKEN_CACHE)), None)

    _TOKEN_CACHE[token_hash] = (now, user_data)
    return user_data


async def require_admin(
    authorization: Optional[str] = Header(default=None),
    x_admin_secret: Optional[str] = Header(default=None, alias="X-Admin-Secret"),
) -> Dict[str, Any]:
    """FastAPI dependency enforcing Admin access.

    Accepts either:
    1. ``X-Admin-Secret`` matching ``CHEMBASE_ADMIN_SECRET`` (constant-time comparison), when configured.
    2. ``Authorization: Bearer <supabase_jwt>`` verified via Supabase ``/auth/v1/user`` where
       ``email`` is in ``ADMIN_EMAILS`` OR ``app_metadata.role == "admin"``.
       Never trusts user-writable ``user_metadata``.
    """
    configured_secret = os.getenv("CHEMBASE_ADMIN_SECRET", "").strip()
    if configured_secret and x_admin_secret:
        if hmac.compare_digest(x_admin_secret.strip(), configured_secret):
            return {"email": "admin-secret", "role": "admin", "via": "secret"}

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer authentication token.")

    token = authorization[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Empty Bearer authentication token.")

    user = await _verify_supabase_token(token)
    email = str(user.get("email") or "").strip().lower()
    app_metadata = user.get("app_metadata") if isinstance(user.get("app_metadata"), dict) else {}
    app_role = str(app_metadata.get("role") or "").strip().lower()

    if email in _get_admin_emails() or app_role == "admin":
        return {"id": user.get("id"), "email": email, "role": "admin", "via": "supabase"}

    raise HTTPException(status_code=403, detail="Admin privileges required.")
