"""ChemBase Pro — AI model health checker.

Tests every model in the frontend catalog through the backend /api/ai/proxy
endpoint (the exact path the website uses), using keys from keys.json.
Usage: python test_models.py
"""
import json
import os
import sys
import time
import urllib.request
import urllib.error

BASE = os.environ.get("API_BASE", "http://127.0.0.1:9222")

# Mirror of the frontend PROVIDER_MODELS catalog (frontend/src/App.tsx)
CATALOG = {
    "gemini": ["gemini-2.5-flash", "gemini-2.5-flash-lite"],
    "groq": ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "qwen/qwen3-32b"],
    "openrouter": [
        "google/gemma-4-26b-a4b-it:free",
        "google/gemma-3-27b-it:free",
        "meta-llama/llama-3.2-3b-instruct:free",
    ],
    "nvidia": [
        "nvidia/nemotron-3-nano-30b-a3b",
        "meta/llama-3.3-70b-instruct",
        "meta/llama-3.1-70b-instruct",
        "meta/llama-3.1-8b-instruct",
        "deepseek-ai/deepseek-v4-flash",
        "mistralai/mixtral-8x22b-instruct-v0.1",
        "mistralai/mixtral-8x7b-instruct-v0.1",
    ],
    "nova": ["us.amazon.nova-lite-v1:0", "us.amazon.nova-micro-v1:0"],
}

PROMPT = "Reply with the single word: OK"


def load_keys():
    path = os.path.join(os.path.dirname(__file__), "keys.json")
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return {}


def test_one(provider, model, key):
    payload = json.dumps({
        "provider": provider,
        "api_key": key,
        "prompt": PROMPT,
        "model": model,
    }).encode()
    req = urllib.request.Request(
        f"{BASE}/api/ai/proxy",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=150) as resp:
            data = json.loads(resp.read().decode())
        elapsed = time.time() - t0
        if data.get("error"):
            return "FAIL", f"{data['error'][:110]}", elapsed
        text = (data.get("text") or "").strip()
        ok = bool(text)
        return ("OK  " if ok else "FAIL"), text[:40].replace("\n", " "), elapsed
    except urllib.error.HTTPError as e:
        return "FAIL", f"HTTP {e.code}: {e.read()[:80]!r}", time.time() - t0
    except Exception as e:
        return "FAIL", f"{type(e).__name__}: {str(e)[:90]}", time.time() - t0


def main():
    keys = load_keys()
    print("=" * 78)
    print("ChemBase Pro — AI model health report")
    print(f"Backend: {BASE}")
    print("=" * 78)
    summary = []
    for provider, models in CATALOG.items():
        key = keys.get(provider, "")
        status = "KEY PRESENT" if key else "NO KEY"
        print(f"\n[{provider.upper()}] — {status}")
        if not key:
            for m in models:
                print(f"   {m:45s} SKIP   (no key configured)")
            summary.append((provider, "SKIP", 0))
            continue
        for m in models:
            status, note, secs = test_one(provider, m, key)
            print(f"   {m:45s} {status}  ({secs:5.1f}s)  {note}")
            summary.append((provider + "/" + m, status, secs))
    print("\n" + "=" * 78)
    ok_n = sum(1 for _, s, _ in summary if s == "OK  ")
    fail_n = sum(1 for _, s, _ in summary if s == "FAIL")
    skip_n = sum(1 for _, s, _ in summary if s == "SKIP")
    print(f"RESULT: {ok_n} OK · {fail_n} FAIL · {skip_n} skipped (no key)")
    print("=" * 78)
    sys.exit(1 if fail_n else 0)


if __name__ == "__main__":
    main()
