"""Outbound SSRF protection and secret scrubbing utilities."""

import ipaddress
import re
import socket
from typing import Tuple
from urllib.parse import urlparse

_BLOCKED_HOSTS = frozenset(
    {
        "localhost",
        "127.0.0.1",
        "::1",
        "0.0.0.0",
        "169.254.169.254",
        "metadata.google.internal",
        "metadata",
    }
)

_BLOCKED_SUFFIXES = (".local", ".internal", ".localhost", ".localdomain")

_SECRET_PATTERNS = [
    (re.compile(r"(?i)(Bearer\s+)[A-Za-z0-9._\-~+/=]{6,}"), r"\1[REDACTED]"),
    (re.compile(r"sk-or-v1-[A-Za-z0-9_\-]{6,}"), "sk-or-v1-[REDACTED]"),
    (re.compile(r"sk-ant-[A-Za-z0-9_\-]{6,}"), "sk-ant-[REDACTED]"),
    (re.compile(r"sk-proj-[A-Za-z0-9_\-]{6,}"), "sk-proj-[REDACTED]"),
    (re.compile(r"sk-[A-Za-z0-9_\-]{8,}"), "sk-[REDACTED]"),
    (re.compile(r"gsk_[A-Za-z0-9_\-]{8,}"), "gsk_[REDACTED]"),
    (re.compile(r"AIza[A-Za-z0-9_\-]{12,}"), "AIza[REDACTED]"),
    (re.compile(r"nvapi-[A-Za-z0-9_\-]{8,}"), "nvapi-[REDACTED]"),
    (re.compile(r"xai-[A-Za-z0-9_\-]{8,}"), "xai-[REDACTED]"),
    (re.compile(r"hf_[A-Za-z0-9_\-]{8,}"), "hf_[REDACTED]"),
    (re.compile(r"(?i)(x-api-key|x-goog-api-key|api[_-]?key)(\s*[:=]\s*)[^\s&\"',;]+"), r"\1\2[REDACTED]"),
]


def _is_prohibited_ip(ip_obj: ipaddress._BaseAddress) -> bool:
    if (
        ip_obj.is_private
        or ip_obj.is_loopback
        or ip_obj.is_link_local
        or ip_obj.is_unspecified
        or ip_obj.is_reserved
        or ip_obj.is_multicast
    ):
        return True
    ipv4_mapped = getattr(ip_obj, "ipv4_mapped", None)
    if ipv4_mapped is not None:
        return _is_prohibited_ip(ipv4_mapped)
    return False


def validate_safe_outbound_url(url: str, resolve_dns: bool = True) -> Tuple[bool, str]:
    """Validate that an outbound provider URL is safe against SSRF.

    Blocks non-http(s) schemes, loopback/metadata hosts, internal suffixes,
    private/reserved/link-local literal IPs, and DNS-resolved private IPs.
    Fails closed when DNS resolution fails and ``resolve_dns`` is True.
    """
    if not url or not isinstance(url, str):
        return False, "URL is required."

    try:
        parsed = urlparse(url.strip())
    except Exception:
        return False, "Invalid URL format."

    if parsed.scheme not in ("http", "https"):
        return False, "Only http and https schemes are allowed."

    host = (parsed.hostname or "").strip().lower().strip("[]")
    if not host:
        return False, "URL must include a valid hostname."

    if host in _BLOCKED_HOSTS:
        return False, "Loopback and metadata addresses are prohibited."

    if any(host.endswith(suffix) for suffix in _BLOCKED_SUFFIXES):
        return False, "Internal domain zones (.local, .internal, .localhost) are prohibited."

    # 1. Check literal IP address
    try:
        ip_obj = ipaddress.ip_address(host)
        if _is_prohibited_ip(ip_obj):
            return False, "Private, loopback, link-local, or reserved IP addresses are prohibited."
        return True, ""
    except ValueError:
        pass

    # 2. Resolve DNS and verify all returned IPs are public (fail closed on lookup failure)
    if resolve_dns:
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        try:
            infos = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
            if not infos:
                return False, "Hostname could not be resolved safely."
            for info in infos:
                sockaddr = info[4]
                if not sockaddr:
                    continue
                resolved_ip_str = str(sockaddr[0]).split("%")[0]
                try:
                    resolved_ip = ipaddress.ip_address(resolved_ip_str)
                except ValueError:
                    continue
                if _is_prohibited_ip(resolved_ip):
                    return False, "Hostname resolves to a prohibited private, loopback, or reserved IP address."
        except (socket.gaierror, OSError):
            return False, "Hostname could not be resolved safely."

    return True, ""


def scrub_secrets(text: str) -> str:
    """Redact API keys and bearer tokens from error messages and logs."""
    if not text:
        return ""
    scrubbed = str(text)
    for pattern, replacement in _SECRET_PATTERNS:
        scrubbed = pattern.sub(replacement, scrubbed)
    return scrubbed
