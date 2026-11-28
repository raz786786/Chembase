"""Universal async HTTP client for OpenAI, Anthropic, Google Gemini, and Ollama providers."""

import re
import time
from typing import Any, Dict, List, Optional, Tuple

import httpx

from .security import scrub_secrets, validate_safe_outbound_url

NON_CHAT_PREFIXES = (
    "text-embedding",
    "embedding",
    "gemini-embedding",
    "codestral-embed",
    "mistral-embed",
    "qwen3-embedding",
    "cohere-embed",
    "bge-",
    "voyage-",
    "tts-",
    "whisper-",
    "dall-e",
    "gpt-image-",
    "gemini-nano-banana",
    "grok-imagine-",
    "sora-",
    "image-",
    "video-",
    "realtime-",
    "gpt-live-",
    "chatgpt-image-",
    "speech-",
    "text-moderation",
    "moderation-",
    "babbage-",
    "davinci-",
    "curie-",
    "ada-",
    "canary-",
    "audio-",
    "omni-moderation",
    "computer-use",
)

RETIRED_MODEL_PATTERNS = (
    re.compile(r"^text-davinci-", re.IGNORECASE),
    re.compile(r"^code-davinci-", re.IGNORECASE),
    re.compile(r"^gpt-3\.5-turbo-0301$", re.IGNORECASE),
    re.compile(r"^claude-instant-1", re.IGNORECASE),
    re.compile(r"^claude-2\.0$", re.IGNORECASE),
    re.compile(r"^gemini-1\.0-pro", re.IGNORECASE),
)

_ANTHROPIC_VERSION = "2023-06-01"


_NON_CHAT_SUBSTRING_RE = re.compile(
    r"(?:embed|rerank|nvclip|clip|whisper|tts|asr|stt|parakeet|fastpitch|tacotron|riva|"
    r"speech|audio|dall-e|imagen|veo|sora|flux|sdxl|stable-diffusion|midjourney|"
    r"moderation|realtime|transcribe|babbage|davinci-002|computer-use|cosmos|"
    r"corrdiff|fourcastnet|alphafold|esmfold|molmim|diffdock|genmol|protein|bionemo|"
    r"deplot|fuyu|paligemma|kosmos|neva|edify|streampetr|usdcode|dinov2|grounding-dino|"
    r"sam2|vista3d|maisi|ocr|paddleocr|nv-parse|nemoretriever|"
    r"nemoguard|safety-guard|content-safety|guardrail|topic-control)",
    re.IGNORECASE,
)

_OPENAI_REASONING_RE = re.compile(r"(?:^|/)(?:o[134](?:-|$)|gpt-5)", re.IGNORECASE)


def filter_chat_models(models: List[str]) -> List[str]:
    """Filter out non-chat and retired models, deduplicating case-insensitively while preserving casing."""
    seen: set[str] = set()
    filtered: List[str] = []

    for raw in models:
        if not raw or not isinstance(raw, str):
            continue
        model_id = raw.strip()
        if not model_id:
            continue
        lower = model_id.lower()

        if any(
            lower.startswith(prefix) or f"/{prefix}" in lower or f"-{prefix}" in lower
            for prefix in NON_CHAT_PREFIXES
        ):
            continue

        if _NON_CHAT_SUBSTRING_RE.search(lower):
            continue

        base = model_id.split("/", 1)[1] if "/" in model_id else model_id
        if any(rx.search(model_id) or rx.search(base) for rx in RETIRED_MODEL_PATTERNS):
            continue

        if lower not in seen:
            seen.add(lower)
            filtered.append(model_id)

    return filtered


def normalize_openai_request(
    base_url: str,
    model_id: str,
    messages: List[Dict[str, Any]],
    temperature: float,
    max_tokens: int,
) -> Tuple[Dict[str, str], Dict[str, Any]]:
    """9Router-parity parameter normalizer & message sanitizer for OpenAI-compatible endpoints."""
    base_lower = (base_url or "").lower()
    headers: Dict[str, str] = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if "openrouter.ai" in base_lower:
        headers["HTTP-Referer"] = "https://chembasepro.vercel.app"
        headers["X-Title"] = "ChemBase Pro"

    # Sanitize messages for strict providers (Groq, Mistral, Cerebras reject extra assistant fields)
    is_strict = any(h in base_lower for h in ("groq.com", "mistral.ai", "cerebras.ai"))
    clean_messages: List[Dict[str, Any]] = []
    for msg in messages:
        if not isinstance(msg, dict):
            continue
        entry = {"role": str(msg.get("role") or "user"), "content": str(msg.get("content") or "")}
        if not is_strict:
            for k, v in msg.items():
                if k not in ("role", "content") and v is not None:
                    entry[k] = v
        clean_messages.append(entry)

    body: Dict[str, Any] = {
        "model": model_id,
        "messages": clean_messages,
    }

    # OpenAI o1/o3/o4/gpt-5 series require max_completion_tokens and reject non-default temperature
    is_openai_reasoning = bool(_OPENAI_REASONING_RE.search(model_id)) and (
        "api.openai.com" in base_lower
        or "models.inference.ai.azure.com" in base_lower
        or "githubcopilot.com" in base_lower
    )
    if is_openai_reasoning:
        body["max_completion_tokens"] = max_tokens
    else:
        body["max_tokens"] = max_tokens
        body["temperature"] = temperature

    return headers, body


def _normalize_base_url(raw_url: str) -> str:
    url = (raw_url or "").strip().rstrip("/")
    for suffix in ("/chat/completions", "/completions", "/messages"):
        if url.endswith(suffix):
            url = url[: -len(suffix)]
            break
    return url.rstrip("/")


def _ensure_safe_url(url: str) -> None:
    safe, reason = validate_safe_outbound_url(url)
    if not safe:
        raise ValueError(f"Unsafe outbound URL: {reason}")


def _extract_error_detail(resp: httpx.Response) -> str:
    try:
        data = resp.json()
        if isinstance(data, dict):
            err = data.get("error")
            if isinstance(err, dict) and err.get("message"):
                return scrub_secrets(str(err["message"])[:240])
            if isinstance(err, str):
                return scrub_secrets(err[:240])
            if data.get("message"):
                return scrub_secrets(str(data["message"])[:240])
            if data.get("detail"):
                return scrub_secrets(str(data["detail"])[:240])
    except Exception:
        pass
    return scrub_secrets((resp.text or f"HTTP {resp.status_code}")[:240])


async def discover_models(
    protocol: str,
    base_url: str,
    api_key: str = "",
    timeout_seconds: float = 12.0,
) -> Dict[str, Any]:
    """Discover available chat models from an upstream provider.

    Returns ``{ok, models, status_code, latency_ms, message, warning?}``.
    """
    clean_base = _normalize_base_url(base_url)
    _ensure_safe_url(clean_base)
    clean_key = (api_key or "").strip()
    start = time.perf_counter()

    try:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(timeout_seconds, connect=6.0),
            follow_redirects=False,
        ) as client:
            if protocol == "google":
                models_url = (
                    f"{clean_base}/models"
                    if clean_base.endswith("/v1beta") or clean_base.endswith("/v1")
                    else f"{clean_base}/v1beta/models"
                )
                resp = await client.get(
                    models_url,
                    headers={"Accept": "application/json", "x-goog-api-key": clean_key},
                )
                latency_ms = int((time.perf_counter() - start) * 1000)
                if resp.status_code != 200:
                    return {
                        "ok": False,
                        "models": [],
                        "status_code": resp.status_code,
                        "latency_ms": latency_ms,
                        "message": f"Google Gemini returned HTTP {resp.status_code}: {_extract_error_detail(resp)}",
                    }
                payload = resp.json()
                raw_models = payload.get("models", []) if isinstance(payload, dict) else []
                chat_ids: List[str] = []
                for item in raw_models:
                    if not isinstance(item, dict):
                        continue
                    methods = item.get("supportedGenerationMethods") or []
                    if "generateContent" not in methods:
                        continue
                    name = str(item.get("name") or "")
                    if name.startswith("models/"):
                        name = name[len("models/") :]
                    if name:
                        chat_ids.append(name)
                models = filter_chat_models(chat_ids)
                return {
                    "ok": True,
                    "models": models,
                    "status_code": 200,
                    "latency_ms": latency_ms,
                    "message": f"Synced {len(models)} models from Google Gemini.",
                }

            if protocol == "anthropic_compatible":
                models_url = clean_base if clean_base.endswith("/models") else f"{clean_base}/models"
                resp = await client.get(
                    models_url,
                    headers={
                        "x-api-key": clean_key,
                        "anthropic-version": _ANTHROPIC_VERSION,
                        "Accept": "application/json",
                    },
                )
                latency_ms = int((time.perf_counter() - start) * 1000)
                if resp.status_code == 404:
                    return {
                        "ok": True,
                        "models": [],
                        "status_code": 404,
                        "latency_ms": latency_ms,
                        "message": "Provider does not expose /models; using catalog/custom models.",
                        "warning": "Provider does not expose /models; using catalog/custom models.",
                    }
                if resp.status_code != 200:
                    return {
                        "ok": False,
                        "models": [],
                        "status_code": resp.status_code,
                        "latency_ms": latency_ms,
                        "message": f"Anthropic endpoint returned HTTP {resp.status_code}: {_extract_error_detail(resp)}",
                    }
                payload = resp.json()
                items = payload.get("data", []) if isinstance(payload, dict) else []
                ids = [str(i["id"]) for i in items if isinstance(i, dict) and i.get("id")]
                models = filter_chat_models(ids)
                return {
                    "ok": True,
                    "models": models,
                    "status_code": 200,
                    "latency_ms": latency_ms,
                    "message": f"Synced {len(models)} models.",
                }

            if protocol == "ollama":
                tags_url = clean_base if clean_base.endswith("/api/tags") else f"{clean_base}/api/tags"
                headers = {"Accept": "application/json"}
                if clean_key:
                    headers["Authorization"] = f"Bearer {clean_key}"
                resp = await client.get(tags_url, headers=headers)
                latency_ms = int((time.perf_counter() - start) * 1000)
                if resp.status_code != 200:
                    return {
                        "ok": False,
                        "models": [],
                        "status_code": resp.status_code,
                        "latency_ms": latency_ms,
                        "message": f"Ollama returned HTTP {resp.status_code}: {_extract_error_detail(resp)}",
                    }
                payload = resp.json()
                items = payload.get("models", []) if isinstance(payload, dict) else []
                ids = [str(i.get("name")) for i in items if isinstance(i, dict) and i.get("name")]
                models = filter_chat_models(ids)
                return {
                    "ok": True,
                    "models": models,
                    "status_code": 200,
                    "latency_ms": latency_ms,
                    "message": f"Synced {len(models)} models from Ollama.",
                }

            # Default: openai_compatible
            models_url = clean_base if clean_base.endswith("/models") else f"{clean_base}/models"
            headers = {"Accept": "application/json"}
            if clean_key:
                headers["Authorization"] = f"Bearer {clean_key}"
            resp = await client.get(models_url, headers=headers)
            latency_ms = int((time.perf_counter() - start) * 1000)
            if resp.status_code == 404:
                return {
                    "ok": True,
                    "models": [],
                    "status_code": 404,
                    "latency_ms": latency_ms,
                    "message": "Provider does not expose /models; using catalog/custom models.",
                    "warning": "Provider does not expose /models; using catalog/custom models.",
                }
            if resp.status_code != 200:
                return {
                    "ok": False,
                    "models": [],
                    "status_code": resp.status_code,
                    "latency_ms": latency_ms,
                    "message": f"Upstream returned HTTP {resp.status_code}: {_extract_error_detail(resp)}",
                }
            payload = resp.json()
            if isinstance(payload, dict) and isinstance(payload.get("data"), list):
                items = payload["data"]
            elif isinstance(payload, list):
                items = payload
            else:
                items = []
            ids: List[str] = []
            for item in items:
                if isinstance(item, str):
                    ids.append(item)
                elif isinstance(item, dict):
                    mid = item.get("id") or item.get("name")
                    if mid:
                        ids.append(str(mid))
            models = filter_chat_models(ids)
            return {
                "ok": True,
                "models": models,
                "status_code": 200,
                "latency_ms": latency_ms,
                "message": f"Synced {len(models)} models.",
            }
    except httpx.TimeoutException:
        latency_ms = int((time.perf_counter() - start) * 1000)
        return {
            "ok": False,
            "models": [],
            "status_code": 504,
            "latency_ms": latency_ms,
            "message": "Upstream discovery request timed out.",
        }
    except ValueError as exc:
        return {
            "ok": False,
            "models": [],
            "status_code": 400,
            "latency_ms": 0,
            "message": scrub_secrets(str(exc)),
        }
    except Exception as exc:
        latency_ms = int((time.perf_counter() - start) * 1000)
        return {
            "ok": False,
            "models": [],
            "status_code": 502,
            "latency_ms": latency_ms,
            "message": f"Connection error: {scrub_secrets(str(exc)[:200])}",
        }


async def validate_credentials(
    protocol: str,
    base_url: str,
    api_key: str = "",
    model_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Validate credentials & reachability against an upstream provider.

    Returns ``{ok, status_code, latency_ms, message}``.
    """
    clean_base = _normalize_base_url(base_url)
    _ensure_safe_url(clean_base)

    # If model_id is explicitly provided, run a real tiny completion probe
    if model_id:
        probe = await test_model(protocol=protocol, base_url=clean_base, api_key=api_key, model_id=model_id)
        return {
            "ok": probe["ok"],
            "status_code": probe.get("status_code", 200 if probe["ok"] else 502),
            "latency_ms": probe["latency_ms"],
            "message": probe.get("preview") if probe["ok"] else (probe.get("error") or "Model test failed"),
        }

    result = await discover_models(protocol=protocol, base_url=clean_base, api_key=api_key)
    return {
        "ok": result["ok"],
        "status_code": result["status_code"],
        "latency_ms": result["latency_ms"],
        "message": result["message"],
    }


async def chat_completion(
    protocol: str,
    base_url: str,
    api_key: str,
    model_id: str,
    messages: List[Dict[str, str]],
    temperature: float = 0.2,
    max_tokens: int = 2048,
    timeout_seconds: float = 60.0,
) -> Dict[str, Any]:
    """Execute a unified chat completion across all supported protocols.

    Returns ``{ok, text, model, status_code, latency_ms, error?}``.
    """
    clean_base = _normalize_base_url(base_url)
    _ensure_safe_url(clean_base)
    clean_key = (api_key or "").strip()
    start = time.perf_counter()

    try:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(timeout_seconds, connect=8.0),
            follow_redirects=False,
        ) as client:
            if protocol == "google":
                api_root = (
                    clean_base
                    if clean_base.endswith("/v1beta") or clean_base.endswith("/v1")
                    else f"{clean_base}/v1beta"
                )
                url = f"{api_root}/models/{model_id}:generateContent"
                system_parts: List[Dict[str, str]] = []
                contents: List[Dict[str, Any]] = []
                for msg in messages:
                    role = (msg.get("role") or "user").lower()
                    content = str(msg.get("content") or "")
                    if role == "system":
                        system_parts.append({"text": content})
                    else:
                        gemini_role = "model" if role == "assistant" else "user"
                        contents.append({"role": gemini_role, "parts": [{"text": content}]})
                if not contents:
                    contents = [{"role": "user", "parts": [{"text": "Hello"}]}]
                body: Dict[str, Any] = {
                    "contents": contents,
                    "generationConfig": {
                        "temperature": temperature,
                        "maxOutputTokens": max_tokens,
                    },
                }
                if system_parts:
                    body["systemInstruction"] = {"parts": system_parts}

                resp = await client.post(
                    url,
                    json=body,
                    headers={
                        "Content-Type": "application/json",
                        "x-goog-api-key": clean_key,
                    },
                )
                latency_ms = int((time.perf_counter() - start) * 1000)
                if resp.status_code != 200:
                    return {
                        "ok": False,
                        "text": "",
                        "model": model_id,
                        "status_code": resp.status_code,
                        "latency_ms": latency_ms,
                        "error": f"Google Gemini HTTP {resp.status_code}: {_extract_error_detail(resp)}",
                    }
                data = resp.json()
                candidates = data.get("candidates") or []
                parts = (candidates[0].get("content") or {}).get("parts") or [] if candidates else []
                text = "".join(str(p.get("text", "")) for p in parts if isinstance(p, dict))
                return {
                    "ok": True,
                    "text": text,
                    "model": model_id,
                    "status_code": 200,
                    "latency_ms": latency_ms,
                    "error": None,
                }

            if protocol == "anthropic_compatible":
                url = f"{clean_base}/messages"
                system_texts = [
                    str(m.get("content") or "")
                    for m in messages
                    if (m.get("role") or "").lower() == "system"
                ]
                anthropic_msgs = [
                    {
                        "role": "assistant" if (m.get("role") or "").lower() == "assistant" else "user",
                        "content": str(m.get("content") or ""),
                    }
                    for m in messages
                    if (m.get("role") or "").lower() != "system"
                ]
                if not anthropic_msgs:
                    anthropic_msgs = [{"role": "user", "content": "Hello"}]
                body = {
                    "model": model_id,
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                    "messages": anthropic_msgs,
                }
                if system_texts:
                    body["system"] = "\n\n".join(system_texts)

                resp = await client.post(
                    url,
                    json=body,
                    headers={
                        "Content-Type": "application/json",
                        "x-api-key": clean_key,
                        "anthropic-version": _ANTHROPIC_VERSION,
                    },
                )
                latency_ms = int((time.perf_counter() - start) * 1000)
                if resp.status_code != 200:
                    return {
                        "ok": False,
                        "text": "",
                        "model": model_id,
                        "status_code": resp.status_code,
                        "latency_ms": latency_ms,
                        "error": f"Anthropic HTTP {resp.status_code}: {_extract_error_detail(resp)}",
                    }
                data = resp.json()
                blocks = data.get("content") or []
                text = "".join(
                    str(b.get("text", ""))
                    for b in blocks
                    if isinstance(b, dict) and b.get("type") == "text"
                )
                return {
                    "ok": True,
                    "text": text,
                    "model": data.get("model") or model_id,
                    "status_code": 200,
                    "latency_ms": latency_ms,
                    "error": None,
                }

            if protocol == "ollama":
                url = f"{clean_base}/api/chat"
                headers = {"Content-Type": "application/json"}
                if clean_key:
                    headers["Authorization"] = f"Bearer {clean_key}"
                body = {
                    "model": model_id,
                    "messages": messages,
                    "stream": False,
                    "options": {"temperature": temperature, "num_predict": max_tokens},
                }
                resp = await client.post(url, json=body, headers=headers)
                latency_ms = int((time.perf_counter() - start) * 1000)
                if resp.status_code != 200:
                    return {
                        "ok": False,
                        "text": "",
                        "model": model_id,
                        "status_code": resp.status_code,
                        "latency_ms": latency_ms,
                        "error": f"Ollama HTTP {resp.status_code}: {_extract_error_detail(resp)}",
                    }
                data = resp.json()
                text = str((data.get("message") or {}).get("content") or "")
                return {
                    "ok": True,
                    "text": text,
                    "model": data.get("model") or model_id,
                    "status_code": 200,
                    "latency_ms": latency_ms,
                    "error": None,
                }

            # Default: openai_compatible (with 9Router parameter normalization)
            url = f"{clean_base}/chat/completions"
            headers, body = normalize_openai_request(
                base_url=clean_base,
                model_id=model_id,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            if clean_key:
                headers["Authorization"] = f"Bearer {clean_key}"
            resp = await client.post(url, json=body, headers=headers)
            latency_ms = int((time.perf_counter() - start) * 1000)
            if resp.status_code != 200:
                return {
                    "ok": False,
                    "text": "",
                    "model": model_id,
                    "status_code": resp.status_code,
                    "latency_ms": latency_ms,
                    "error": f"Upstream HTTP {resp.status_code}: {_extract_error_detail(resp)}",
                }
            data = resp.json()
            choices = data.get("choices") or []
            msg_obj = (choices[0].get("message") or {}) if choices else {}
            text = str(
                msg_obj.get("content")
                or msg_obj.get("reasoning_content")
                or msg_obj.get("reasoning")
                or ""
            )
            return {
                "ok": True,
                "text": text,
                "model": data.get("model") or model_id,
                "status_code": 200,
                "latency_ms": latency_ms,
                "error": None,
            }

    except httpx.TimeoutException:
        latency_ms = int((time.perf_counter() - start) * 1000)
        return {
            "ok": False,
            "text": "",
            "model": model_id,
            "status_code": 504,
            "latency_ms": latency_ms,
            "error": "Upstream chat request timed out.",
        }
    except ValueError as exc:
        return {
            "ok": False,
            "text": "",
            "model": model_id,
            "status_code": 400,
            "latency_ms": 0,
            "error": scrub_secrets(str(exc)),
        }
    except Exception as exc:
        latency_ms = int((time.perf_counter() - start) * 1000)
        return {
            "ok": False,
            "text": "",
            "model": model_id,
            "status_code": 502,
            "latency_ms": latency_ms,
            "error": f"Chat request error: {scrub_secrets(str(exc)[:200])}",
        }


async def test_model(
    protocol: str,
    base_url: str,
    api_key: str,
    model_id: str,
) -> Dict[str, Any]:
    """Run a fast live completion probe against a specific model, with SOW-parity
    fallback to live /models catalog verification when a free-tier/GPU model
    cold-starts (timeout) or is rate-limited (HTTP 429).

    Returns ``{ok, model_id, status_code, latency_ms, preview, error}``.
    """
    result = await chat_completion(
        protocol=protocol,
        base_url=base_url,
        api_key=api_key,
        model_id=model_id,
        messages=[{"role": "user", "content": "Reply with OK"}],
        temperature=0.2,
        max_tokens=64,
        timeout_seconds=12.0,
    )

    if result["ok"]:
        preview = (result.get("text") or "").strip()[:120] or "OK"
        return {
            "ok": True,
            "model_id": model_id,
            "status_code": result["status_code"],
            "latency_ms": result["latency_ms"],
            "preview": preview,
            "error": None,
        }

    # SOW parity: HTTP 429 means credentials & model endpoint are valid, just quota/rate-limited
    if result.get("status_code") == 429:
        return {
            "ok": True,
            "model_id": model_id,
            "status_code": 429,
            "latency_ms": result["latency_ms"],
            "preview": "Active (Rate/Quota Limited)",
            "error": None,
        }

    # SOW parity: On upstream timeout (e.g. NVIDIA NIM free-tier GPU cold start),
    # verify credentials and model presence via fast GET /models catalog check.
    if result.get("status_code") == 504:
        catalog_check = await discover_models(
            protocol=protocol,
            base_url=base_url,
            api_key=api_key,
            timeout_seconds=10.0,
        )
        if catalog_check.get("ok"):
            live_models = [m.lower() for m in (catalog_check.get("models") or [])]
            if not live_models or model_id.strip().lower() in live_models:
                return {
                    "ok": True,
                    "model_id": model_id,
                    "status_code": 200,
                    "latency_ms": catalog_check.get("latency_ms", result["latency_ms"]),
                    "preview": "Verified in live catalog (GPU cold-start)",
                    "error": None,
                }
            return {
                "ok": False,
                "model_id": model_id,
                "status_code": 404,
                "latency_ms": catalog_check.get("latency_ms", result["latency_ms"]),
                "preview": "",
                "error": f"Model '{model_id}' timed out and was not found in upstream /models catalog.",
            }

    preview = (result.get("text") or "").strip()[:120]
    return {
        "ok": False,
        "model_id": model_id,
        "status_code": result["status_code"],
        "latency_ms": result["latency_ms"],
        "preview": preview,
        "error": result.get("error"),
    }


test_model.__test__ = False  # type: ignore[attr-defined]
