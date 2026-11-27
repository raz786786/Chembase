"""AES-256-GCM + HKDF-SHA256 encryption and masking for provider API keys."""

import base64
import os
from typing import Optional

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

_DEV_FALLBACK_MASTER_KEY = "chembase-pro-local-dev-master-key-change-in-production"
_AAD = b"chembase-provider-key"


class CryptoError(Exception):
    """Base exception for cryptographic failures."""


class DecryptionError(CryptoError):
    """Raised when decryption fails due to invalid key, tampered payload, or corrupt data."""


def _resolve_master_secret(master_secret: Optional[str] = None) -> str:
    if master_secret and master_secret.strip():
        return master_secret.strip()

    env_key = os.getenv("CHEMBASE_MASTER_KEY", "").strip()
    if env_key:
        return env_key

    environment = os.getenv("ENVIRONMENT", "development").strip().lower()
    if environment == "production":
        raise CryptoError("CHEMBASE_MASTER_KEY is not configured. Server fails closed in production.")

    return _DEV_FALLBACK_MASTER_KEY


def _derive_encryption_key(master_secret: Optional[str] = None) -> bytes:
    secret = _resolve_master_secret(master_secret)
    try:
        try:
            decoded = base64.b64decode(secret, validate=True)
            master_bytes = decoded if len(decoded) >= 16 else secret.encode("utf-8")
        except Exception:
            master_bytes = secret.encode("utf-8")

        salt = os.getenv("CHEMBASE_HKDF_SALT", "chembase-pro-v1-salt").encode("utf-8")
        hkdf = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            info=b"chembase-provider-credentials",
        )
        return hkdf.derive(master_bytes)
    except CryptoError:
        raise
    except Exception as exc:
        raise CryptoError(f"Failed to derive encryption key: {exc}") from exc


def encrypt_api_key(raw_key: str, master_secret: Optional[str] = None) -> str:
    """Encrypt a raw API key using AES-256-GCM.

    Envelope format: ``v1:<nonce_b64>:<ciphertext_with_tag_b64>``.
    """
    if not raw_key or not raw_key.strip():
        raise CryptoError("Cannot encrypt empty API key.")

    key_bytes = _derive_encryption_key(master_secret)
    aesgcm = AESGCM(key_bytes)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, raw_key.strip().encode("utf-8"), associated_data=_AAD)

    nonce_b64 = base64.b64encode(nonce).decode("ascii")
    ct_b64 = base64.b64encode(ciphertext).decode("ascii")
    return f"v1:{nonce_b64}:{ct_b64}"


def decrypt_api_key(encrypted_payload: str, master_secret: Optional[str] = None) -> str:
    """Decrypt an AES-256-GCM encrypted API key envelope."""
    if not encrypted_payload:
        return ""
    if not encrypted_payload.startswith("v1:"):
        raise DecryptionError("Ciphertext payload missing v1: prefix envelope.")

    parts = encrypted_payload.split(":")
    if len(parts) != 3:
        raise DecryptionError("Malformed ciphertext payload components.")

    _, nonce_b64, ct_b64 = parts
    try:
        nonce = base64.b64decode(nonce_b64, validate=True)
        ciphertext = base64.b64decode(ct_b64, validate=True)
    except Exception as exc:
        raise DecryptionError(f"Failed to decode base64 ciphertext: {exc}") from exc

    key_bytes = _derive_encryption_key(master_secret)
    aesgcm = AESGCM(key_bytes)
    try:
        plaintext = aesgcm.decrypt(nonce, ciphertext, associated_data=_AAD)
        return plaintext.decode("utf-8")
    except InvalidTag as exc:
        raise DecryptionError("Authentication tag verification failed. Ciphertext may be tampered.") from exc
    except Exception as exc:
        raise DecryptionError(f"Decryption failed: {exc}") from exc


def mask_api_key(raw_key: Optional[str]) -> str:
    """Return a safe display mask (prefix + •••••••••••• + last 4 chars)."""
    if not raw_key:
        return ""
    clean = raw_key.strip()
    if len(clean) < 8:
        return "••••••••••••"

    last4 = clean[-4:]
    for known_prefix in ("sk-or-v1-", "sk-ant-", "sk-proj-", "nvapi-", "gsk_", "AIza", "xai-", "hf_", "sk-"):
        if clean.startswith(known_prefix):
            return f"{known_prefix}••••••••••••{last4}"

    return f"{clean[:3]}••••••••••••{last4}"
