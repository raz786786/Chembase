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


# --- Stats Schema ---
class StatsOut(BaseModel):
    elements: int
    compounds: int
    reactions: int
    total_substances: int
