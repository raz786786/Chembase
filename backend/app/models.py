from sqlalchemy import Column, String, Integer, Float, Boolean, Text, ForeignKey, Table, JSON
from sqlalchemy.orm import relationship
from .database import Base
import uuid


def gen_uuid():
    return str(uuid.uuid4())


# --- Association Tables for Reaction ↔ Substance ---
reaction_reactants = Table(
    "reaction_reactants", Base.metadata,
    Column("reaction_id", String, ForeignKey("reactions.id"), primary_key=True),
    Column("substance_id", String, ForeignKey("substances.id"), primary_key=True),
    Column("coefficient", Integer, default=1),
)

reaction_products = Table(
    "reaction_products", Base.metadata,
    Column("reaction_id", String, ForeignKey("reactions.id"), primary_key=True),
    Column("substance_id", String, ForeignKey("substances.id"), primary_key=True),
    Column("coefficient", Integer, default=1),
)


class Substance(Base):
    __tablename__ = "substances"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String(255), nullable=False, index=True)
    formula = Column(String(100), nullable=False, index=True)
    type = Column(String(20), nullable=False)  # 'element' or 'compound'
    cas_number = Column(String(20), unique=True, nullable=True)
    molar_mass = Column(Float, nullable=True)
    description = Column(Text, nullable=True)
    state_at_room_temp = Column(String(20), nullable=True)  # solid, liquid, gas
    color = Column(String(50), nullable=True)
    density = Column(Float, nullable=True)
    melting_point = Column(Float, nullable=True)
    boiling_point = Column(Float, nullable=True)
    electronegativity = Column(Float, nullable=True)

    # Element-specific
    atomic_number = Column(Integer, nullable=True, unique=True)
    symbol = Column(String(3), nullable=True, unique=True)
    group_number = Column(Integer, nullable=True)
    period = Column(Integer, nullable=True)
    category = Column(String(50), nullable=True)  # alkali metal, noble gas, etc.
    electron_configuration = Column(String(100), nullable=True)
    block = Column(String(1), nullable=True)  # s, p, d, f
    oxidation_states = Column(JSON, nullable=True)  # e.g. [-1, 0, +1]
    year_discovered = Column(String(255), nullable=True)
    is_radioactive = Column(Boolean, default=False)
    atomic_radius = Column(Float, nullable=True)  # in pm

    # Relationships
    hazard_data = relationship("HazardData", back_populates="substance", uselist=False, cascade="all, delete-orphan")
    reactions_as_reactant = relationship("Reaction", secondary=reaction_reactants, back_populates="reactants")
    reactions_as_product = relationship("Reaction", secondary=reaction_products, back_populates="products")


class HazardData(Base):
    __tablename__ = "hazard_data"

    id = Column(String, primary_key=True, default=gen_uuid)
    substance_id = Column(String, ForeignKey("substances.id"), nullable=False, unique=True)
    ghs_pictograms = Column(JSON, nullable=True)
    ghs_signal_word = Column(String(20), nullable=True)
    h_statements = Column(JSON, nullable=True)
    p_statements = Column(JSON, nullable=True)
    nfpa_health = Column(Integer, nullable=True)
    nfpa_flammability = Column(Integer, nullable=True)
    nfpa_instability = Column(Integer, nullable=True)
    nfpa_special = Column(String(10), nullable=True)

    substance = relationship("Substance", back_populates="hazard_data")


class Reaction(Base):
    __tablename__ = "reactions"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String(255), nullable=False)
    equation = Column(String(500), nullable=False)
    reaction_type = Column(String(50), nullable=True)
    conditions = Column(Text, nullable=True)
    enthalpy_change = Column(Float, nullable=True)  # kJ/mol
    is_reversible = Column(Boolean, default=False)
    description = Column(Text, nullable=True)
    balanced = Column(Boolean, default=True)
    industrial_value_tier = Column(Integer, nullable=True)  # 1=High, 2=Medium, 3=Low, 4=None
    verification_status = Column(String(20), default="verified")  # verified, predicted, disputed, pending
    safety_notes = Column(Text, nullable=True)

    reactants = relationship("Substance", secondary=reaction_reactants, back_populates="reactions_as_reactant")
    products = relationship("Substance", secondary=reaction_products, back_populates="reactions_as_product")
