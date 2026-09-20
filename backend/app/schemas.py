from pydantic import BaseModel, ConfigDict
from typing import Optional, List


# --- Substance Schemas ---
class SubstanceBase(BaseModel):
    name: str
    formula: str
    type: str
    cas_number: Optional[str] = None
    molar_mass: Optional[float] = None
    description: Optional[str] = None
    state_at_room_temp: Optional[str] = None
    color: Optional[str] = None
    density: Optional[float] = None
    melting_point: Optional[float] = None
    boiling_point: Optional[float] = None
    electronegativity: Optional[float] = None
    atomic_number: Optional[int] = None
    symbol: Optional[str] = None
    group_number: Optional[int] = None
    period: Optional[int] = None
    category: Optional[str] = None
    electron_configuration: Optional[str] = None
    block: Optional[str] = None
    oxidation_states: Optional[List[int]] = None
    year_discovered: Optional[str] = None
    is_radioactive: Optional[bool] = False
    atomic_radius: Optional[float] = None


class SubstanceCreate(SubstanceBase):
    pass


class HazardDataOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    ghs_pictograms: Optional[List[str]] = None
    ghs_signal_word: Optional[str] = None
    h_statements: Optional[List[str]] = None
    p_statements: Optional[List[str]] = None
    nfpa_health: Optional[int] = None
    nfpa_flammability: Optional[int] = None
    nfpa_instability: Optional[int] = None
    nfpa_special: Optional[str] = None


class SubstanceOut(SubstanceBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    hazard_data: Optional[HazardDataOut] = None


class SubstanceSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    formula: str
    type: str
    symbol: Optional[str] = None
    atomic_number: Optional[int] = None
    category: Optional[str] = None
    molar_mass: Optional[float] = None
    state_at_room_temp: Optional[str] = None
    period: Optional[int] = None
    group_number: Optional[int] = None
    block: Optional[str] = None


# --- Reaction Schemas ---
class ReactionBase(BaseModel):
    name: str
    equation: str
    reaction_type: Optional[str] = None
    conditions: Optional[str] = None
    enthalpy_change: Optional[float] = None
    is_reversible: bool = False
    description: Optional[str] = None
    balanced: bool = True
    industrial_value_tier: Optional[int] = None
    verification_status: Optional[str] = "verified"
    safety_notes: Optional[str] = None


class ReactionCreate(ReactionBase):
    reactant_ids: List[str]
    product_ids: List[str]


class ReactionOut(ReactionBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    reactants: List[SubstanceSummary] = []
    products: List[SubstanceSummary] = []


# --- Search Schema ---
class SearchResult(BaseModel):
    substances: List[SubstanceSummary] = []
    reactions: List[ReactionOut] = []
    total: int = 0


# --- DEFTECH Schemas ---
class TelemetryIn(BaseModel):
    """Payload from an ESP32 device (or the simulator)."""
    device_id: str
    threat: Optional[str] = None
    confidence: float
    lat: Optional[float] = None
    lng: Optional[float] = None
    device_ts: Optional[str] = None  # ISO 8601; defaults to server time


class TelemetryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    device_ts: str
    received_at: str
    device_id: str
    threat_detected: Optional[str] = None
    confidence_score: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class FleetDeviceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    device_id: str
    status: str
    assigned_model: Optional[str] = None
    mode: str
    last_seen_at: Optional[str] = None
    firmware_version: Optional[str] = None
    model_version: Optional[str] = None


class ChemicalProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    substance_id: Optional[str] = None
    name: str
    toxicity_level: str
    hazard_radius_m: int
    exposure_limits: Optional[dict] = None
    detection_threshold_ppm: Optional[float] = None


class ModelArtifactOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    version: str
    storage_path: str
    sha256: str
    size_bytes: Optional[int] = None
    target_arch: str
    status: str


# --- Stats Schema ---
class StatsOut(BaseModel):
    elements: int
    compounds: int
    reactions: int
    total_substances: int
