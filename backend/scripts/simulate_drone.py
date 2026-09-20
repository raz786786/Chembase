#!/usr/bin/env python3
"""
Fake drone simulator — POSTs realistic telemetry to the backend.

Usage:
  python scripts/simulate_drone.py                        # default: 1 device, every 3s
  python scripts/simulate_drone.py --devices Drone_01 Drone_02 --interval 2
  python scripts/simulate_drone.py --url https://chembase-api-uvel.onrender.com

Device secrets must match DEVICE_CREDENTIALS on the backend (or the seeded dev secrets).
Press Ctrl+C to stop. --once sends a single burst (useful in CI).
"""
from __future__ import annotations

import argparse
import io
import math
import random
import sys
import time
from datetime import datetime, timezone

import httpx

# Windows consoles often default to cp1252 — force UTF-8-safe output
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ("utf-8", "utf8"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

THREATS = [
    # (name, base confidence when detected, hazard weight)
    ("Ammonia", 90, 0.10),
    ("Chlorine", 88, 0.08),
    ("Hydrogen Sulfide", 92, 0.07),
    ("Sulfur Dioxide", 85, 0.10),
    ("Benzene Vapor", 83, 0.10),
    ("VOC Complex", 78, 0.35),
    (None, 0, 0.20),  # no threat — clean air reading
]

DEVICE_SECRETS = {
    "Drone_01": "dev-secret-drone-01",
    "Drone_02": "dev-secret-drone-02",
}


def utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class Drone:
    def __init__(self, device_id: str):
        self.device_id = device_id
        self.secret = DEVICE_SECRETS.get(device_id, "dev-secret-drone-01")
        # Start near Islamabad and wander
        self.lat = 33.68 + random.uniform(-0.02, 0.02)
        self.lng = 73.04 + random.uniform(-0.02, 0.02)
        self.heading = random.uniform(0, 2 * math.pi)

    def move(self) -> None:
        self.heading += random.uniform(-0.4, 0.4)
        step = random.uniform(0.0005, 0.002)
        self.lat += step * math.cos(self.heading)
        self.lng += step * math.sin(self.heading)

    def reading(self) -> dict:
        # Weighted pick — mostly clean air, occasional detections
        weights = [t[2] for t in THREATS]
        threat, base_conf, _ = random.choices(THREATS, weights=weights, k=1)[0]

        confidence = 0.0
        if threat:
            confidence = round(min(99.0, base_conf + random.uniform(-6, 8)), 1)

        return {
            "device_id": self.device_id,
            "threat": threat,
            "confidence": confidence,
            "lat": round(self.lat, 6),
            "lng": round(self.lng, 6),
            "device_ts": utc_iso(),
        }


def send(client: httpx.Client, base_url: str, drone: Drone, verbose: bool) -> bool:
    payload = drone.reading()
    headers = {"X-Device-Id": drone.device_id, "X-Device-Secret": drone.secret}
    try:
        r = client.post(f"{base_url}/api/telemetry", json=payload, headers=headers, timeout=15)
        if r.status_code == 200:
            if verbose:
                flag = f"⚠ {payload['threat']} {payload['confidence']}%" if payload["threat"] else "· clean"
                print(f"[{utc_iso()}] {drone.device_id}: {flag} @ {payload['lat']},{payload['lng']}")
            return True
        print(f"ERROR {r.status_code}: {r.text[:200]}", file=sys.stderr)
        return False
    except httpx.HTTPError as e:
        print(f"NETWORK ERROR: {e}", file=sys.stderr)
        return False


def main() -> None:
    ap = argparse.ArgumentParser(description="ChemBase fake drone telemetry simulator")
    ap.add_argument("--url", default="http://localhost:8000", help="Backend base URL")
    ap.add_argument("--devices", nargs="+", default=["Drone_01", "Drone_02"])
    ap.add_argument("--interval", type=float, default=3.0, help="Seconds between sends")
    ap.add_argument("--once", action="store_true", help="Send one burst and exit")
    args = ap.parse_args()

    drones = [Drone(d) for d in args.devices]
    print(f"Simulating {len(drones)} device(s) → {args.url}/api/telemetry every {args.interval}s")
    print("Secrets: use the seeded dev secrets or set them in DEVICE_SECRETS above.\n")

    with httpx.Client() as client:
        while True:
            for drone in drones:
                drone.move()
                send(client, args.url, drone, verbose=True)
            if args.once:
                break
            time.sleep(args.interval)


if __name__ == "__main__":
    main()
