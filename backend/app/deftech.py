"""DEFTECH API — telemetry ingest, fleet, OTA manifest, chemical profiles."""
from __future__ import annotations

import hashlib
import os
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from .database import get_db, SessionLocal
from .models import ChemicalProfile, FleetDevice, ModelArtifact, TelemetryLog
from .schemas import (
    ChemicalProfileOut,
    FleetDeviceOut,
    ModelArtifactOut,
    TelemetryIn,
    TelemetryOut,
)

router = APIRouter(prefix="/api", tags=["deftech"])


def seed_deftech_data() -> None:
    """Seed dev devices + chemical profiles into an empty database.

    Runs on startup (SQLite dev path). On Supabase, seeding comes from
    supabase_schema.sql — the count checks make this a no-op there.
    """
    db = SessionLocal()
    try:
        if db.query(FleetDevice).count() == 0:
            for device_id, secret_hash in _load_credentials().items():
                db.add(FleetDevice(
                    device_id=device_id,
                    status="OFFLINE",
                    device_secret_hash=secret_hash,
                    firmware_version="v0.1.0",
                ))
        if db.query(ChemicalProfile).count() == 0:
            for name, tier, radius in [
                ("Ammonia", "HIGH", 500),
                ("Chlorine", "EXTREME", 800),
                ("Hydrogen Sulfide", "EXTREME", 700),
                ("Sulfur Dioxide", "HIGH", 400),
                ("Benzene Vapor", "HIGH", 350),
                ("VOC Complex", "MODERATE", 300),
            ]:
                db.add(ChemicalProfile(name=name, toxicity_level=tier, hazard_radius_m=radius))
        db.commit()
    finally:
        db.close()


def _utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ──────────────────────────────────────────────────────────
# Device authentication
# ──────────────────────────────────────────────────────────
def _load_credentials() -> dict[str, str]:
    """device_id → sha256(secret) from env: `id:hash,id:hash,...`

    Defaults to the seeded dev credentials so local testing works without setup.
    ALWAYS set DEVICE_CREDENTIALS in production.
    """
    raw = os.getenv("DEVICE_CREDENTIALS") or (
        "Drone_01:839d51042c3aee2de25d545f0449afe52b5080a3e0b24f01c9b7e5502e379b17,"
        "Drone_02:8791edc9620c99c2b4fc59c6fcb4eebb36c6136339534d3d93db1c325d754915"
    )
    creds: dict[str, str] = {}
    for pair in raw.split(","):
        if ":" in pair:
            device_id, hash_hex = pair.split(":", 1)
            if device_id.strip() and hash_hex.strip():
                creds[device_id.strip()] = hash_hex.strip().lower()
    return creds


def authenticate_device(
    x_device_id: str = Header(...),
    x_device_secret: str = Header(...),
) -> str:
    """Verify device_id + secret against env credentials (or DB-stored hashes)."""
    creds = _load_credentials()
    expected = creds.get(x_device_id)

    if expected is None:
        # Fallback: check fleet_devices table (hashes seeded via SQL)
        db = SessionLocal()
        try:
            row = db.get(FleetDevice, x_device_id)
            expected = row.device_secret_hash.lower() if row else None
        finally:
            db.close()

    if expected is None:
        raise HTTPException(401, "Unknown device")

    supplied = hashlib.sha256(x_device_secret.encode()).hexdigest()
    if supplied != expected:
        raise HTTPException(401, "Invalid device secret")

    return x_device_id


# ──────────────────────────────────────────────────────────
# Telemetry ingest — POST /api/telemetry
# ──────────────────────────────────────────────────────────
@router.post("/telemetry", response_model=TelemetryOut)
def ingest_telemetry(
    payload: TelemetryIn,
    device_id: str = Depends(authenticate_device),
    db: Session = Depends(get_db),
):
    if payload.device_id != device_id:
        raise HTTPException(403, "device_id mismatch with auth header")

    # Sanity validation — reject obvious garbage before it poisons the dashboard
    if not 0 <= payload.confidence <= 100:
        raise HTTPException(422, "confidence must be 0-100")
    if payload.lat is not None and not -90 <= payload.lat <= 90:
        raise HTTPException(422, "lat out of range")
    if payload.lng is not None and not -180 <= payload.lng <= 180:
        raise HTTPException(422, "lng out of range")

    device_ts = payload.device_ts or _utcnow_iso()
    row = TelemetryLog(
        device_ts=device_ts,
        received_at=_utcnow_iso(),
        device_id=device_id,
        threat_detected=payload.threat,
        confidence_score=float(payload.confidence),
        latitude=payload.lat,
        longitude=payload.lng,
        raw_payload=payload.model_dump(),
    )
    db.add(row)

    device = db.get(FleetDevice, device_id)
    if device:
        device.last_seen_at = _utcnow_iso()
        device.status = "ACTIVE"
    else:
        # Auto-register unknown-but-authenticated devices (env creds exist for them)
        db.add(FleetDevice(
            device_id=device_id,
            status="ACTIVE",
            device_secret_hash=hashlib.sha256(
                _load_credentials().get(device_id, "").encode()
            ).hexdigest(),
            last_seen_at=_utcnow_iso(),
        ))
    db.commit()
    db.refresh(row)
    return row


# ──────────────────────────────────────────────────────────
# Telemetry reads — GET /api/telemetry/latest, /api/telemetry
# ──────────────────────────────────────────────────────────
@router.get("/telemetry/latest", response_model=List[TelemetryOut])
def latest_telemetry(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Most recent telemetry rows across all devices (drives the live map)."""
    return (
        db.query(TelemetryLog)
        .order_by(TelemetryLog.device_ts.desc())
        .limit(limit)
        .all()
    )


@router.get("/telemetry", response_model=List[TelemetryOut])
def list_telemetry(
    device_id: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    q = db.query(TelemetryLog)
    if device_id:
        q = q.filter(TelemetryLog.device_id == device_id)
    return q.order_by(TelemetryLog.device_ts.desc()).limit(limit).all()


# ──────────────────────────────────────────────────────────
# Fleet — GET /api/fleet, POST /api/fleet/devices
# ──────────────────────────────────────────────────────────
@router.get("/fleet", response_model=List[FleetDeviceOut])
def list_fleet(db: Session = Depends(get_db)):
    return db.query(FleetDevice).order_by(FleetDevice.device_id).all()


@router.post("/fleet/devices", response_model=FleetDeviceOut)
def register_device(payload: dict, db: Session = Depends(get_db)):
    """Register a device. Body: {device_id, secret, mode?}."""
    device_id = (payload.get("device_id") or "").strip()
    secret = (payload.get("secret") or "").strip()
    if not device_id or not secret:
        raise HTTPException(422, "device_id and secret are required")

    if db.get(FleetDevice, device_id):
        raise HTTPException(409, "Device already exists")

    row = FleetDevice(
        device_id=device_id,
        status="OFFLINE",
        mode=payload.get("mode", "DEFENSE"),
        device_secret_hash=hashlib.sha256(secret.encode()).hexdigest(),
        firmware_version=payload.get("firmware_version", "v0.1.0"),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


# ──────────────────────────────────────────────────────────
# OTA — device-polling manifest pattern
# ──────────────────────────────────────────────────────────
@router.get("/firmware/latest")
def firmware_latest(
    arch: str = Query("esp32"),
    current: Optional[str] = Query(None, description="Device's current version"),
    db: Session = Depends(get_db),
):
    """Version manifest polled by ESP32 devices. Returns update info or 204-style no-update."""
    artifact = (
        db.query(ModelArtifact)
        .filter(ModelArtifact.target_arch == arch, ModelArtifact.status == "PUBLISHED")
        .order_by(ModelArtifact.created_at.desc())
        .first()
    )
    if not artifact:
        raise HTTPException(404, "No published artifact for this arch")

    result = {
        "version": artifact.version,
        "storage_path": artifact.storage_path,
        "sha256": artifact.sha256,
        "size_bytes": artifact.size_bytes,
        "target_arch": artifact.target_arch,
        # Signed URL placeholder: backend service key generates it, or frontend uses
        # supabase.storage.from_('tinyml-models').createSignedUrl(path, 3600)
        "download_url": None,
        "update_available": current is not None and current != artifact.version,
    }
    return result


@router.post("/update-fleet")
def update_fleet(payload: dict, db: Session = Depends(get_db)):
    """Mark a published artifact as the target for one device or the whole fleet."""
    version = (payload.get("version") or "").strip()
    device_ids = payload.get("device_ids")  # None = entire fleet
    if not version:
        raise HTTPException(422, "version is required")

    artifact = db.query(ModelArtifact).filter(ModelArtifact.version == version).first()
    if not artifact:
        raise HTTPException(404, f"Artifact version '{version}' not found")
    if artifact.status != "PUBLISHED":
        raise HTTPException(409, f"Version '{version}' is not PUBLISHED")

    q = db.query(FleetDevice)
    if device_ids:
        q = q.filter(FleetDevice.device_id.in_(device_ids))
    devices = q.all()
    if not devices:
        raise HTTPException(404, "No matching devices")

    for d in devices:
        d.assigned_model = version
    db.commit()

    return {
        "command": "OTA_POLL_NEW_VERSION",
        "version": version,
        "devices_updated": [d.device_id for d in devices],
        "note": "Devices fetch this on their next /api/firmware/latest poll",
    }


# ──────────────────────────────────────────────────────────
# Chemical profiles — GET /api/chemical-profiles
# ──────────────────────────────────────────────────────────
@router.get("/chemical-profiles", response_model=List[ChemicalProfileOut])
def list_chemical_profiles(
    name: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(ChemicalProfile)
    if name:
        q = q.filter(func.lower(ChemicalProfile.name) == name.lower())
        row = q.first()
        return [row] if row else []
    return q.order_by(ChemicalProfile.name).all()
