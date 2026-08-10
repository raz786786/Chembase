import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database import SessionLocal
from app.models import Substance, HazardData

db = SessionLocal()

# CAS Numbers for all elements
ELEMENT_CAS = {
    "Hydrogen": "1333-74-0", "Helium": "7440-59-7", "Lithium": "7439-93-2", "Beryllium": "7440-41-7",
    "Boron": "7440-42-8", "Carbon": "7440-44-0", "Nitrogen": "7727-37-9", "Oxygen": "7782-44-7",
    "Fluorine": "7782-41-4", "Neon": "7440-01-9", "Sodium": "7440-23-5", "Magnesium": "7439-95-4",
    "Aluminum": "7429-90-5", "Silicon": "7440-21-3", "Phosphorus": "7723-14-0", "Sulfur": "7704-34-9",
    "Chlorine": "7782-50-5", "Argon": "7440-37-1", "Potassium": "7440-09-7", "Calcium": "7440-70-2",
    "Scandium": "7440-20-2", "Titanium": "7440-32-6", "Vanadium": "7440-62-2", "Chromium": "7440-47-3",
    "Manganese": "7439-96-5", "Iron": "7439-89-6", "Cobalt": "7440-48-4", "Nickel": "7440-02-0",
    "Copper": "7440-50-8", "Zinc": "7440-66-6", "Gallium": "7440-55-3", "Germanium": "7440-56-4",
    "Arsenic": "7440-38-2", "Selenium": "7782-49-2", "Bromine": "7726-95-6", "Krypton": "7439-90-9",
    "Rubidium": "7440-17-7", "Strontium": "7440-24-6", "Yttrium": "7440-65-5", "Zirconium": "7440-67-7",
    "Niobium": "7440-03-1", "Molybdenum": "7439-98-7", "Technetium": "7440-26-8", "Ruthenium": "7440-18-8",
    "Rhodium": "7440-16-6", "Palladium": "7440-05-3", "Silver": "7440-22-4", "Cadmium": "7440-43-9",
    "Indium": "7440-74-6", "Tin": "7440-31-5", "Antimony": "7440-36-0", "Tellurium": "13494-80-9",
    "Iodine": "7553-56-2", "Xenon": "1336-52-5", "Cesium": "7440-46-2", "Barium": "7440-39-3",
    "Lanthanum": "7439-91-0", "Cerium": "7440-45-1", "Praseodymium": "7440-10-0", "Neodymium": "7440-00-8",
    "Promethium": "7440-12-2", "Samarium": "7440-19-9", "Europium": "7440-53-1", "Gadolinium": "7440-54-2",
    "Terbium": "7440-27-9", "Dysprosium": "7429-91-6", "Holmium": "7440-60-0", "Erbium": "7440-52-0",
    "Thulium": "7440-30-4", "Ytterbium": "7440-64-4", "Lutetium": "7439-94-3", "Hafnium": "7440-58-6",
    "Tantalum": "7440-25-7", "Tungsten": "7440-33-7", "Rhenium": "7440-15-5", "Osmium": "7440-04-2",
    "Iridium": "7439-88-5", "Platinum": "7440-06-4", "Gold": "7440-57-5", "Mercury": "7439-97-6",
    "Thallium": "7440-28-0", "Lead": "7439-92-1", "Bismuth": "7440-69-9", "Polonium": "7440-08-6",
    "Astatine": "7440-68-8", "Radon": "10043-92-2", "Francium": "7440-73-5", "Radium": "7440-14-4",
    "Actinium": "7440-34-8", "Thorium": "7440-29-1", "Protactinium": "7440-13-3", "Uranium": "7440-61-1",
    "Neptunium": "7439-99-8", "Plutonium": "7440-07-5", "Americium": "7440-35-9", "Curium": "7440-51-9",
    "Berkelium": "7440-40-6", "Californium": "7440-71-3", "Einsteinium": "7429-92-7", "Fermium": "7440-72-4",
    "Mendelevium": "7440-11-1", "Nobelium": "10028-14-5", "Lawrencium": "22537-19-5", "Rutherfordium": "53850-36-5",
    "Dubnium": "53850-35-4", "Seaborgium": "54038-81-2", "Bohrium": "54037-14-8", "Hassium": "54037-57-9",
    "Meitnerium": "54038-01-6", "Darmstadtium": "54083-77-1", "Roentgenium": "54386-24-2", "Copernicium": "54084-26-3",
    "Nihonium": "54084-70-7", "Flerovium": "54085-16-4", "Moscovium": "54085-64-2", "Livermorium": "54085-16-7",
    "Tennessine": "54085-16-5", "Oganesson": "54085-16-6"
}

# Synthetic Predicted Properties
PREDICTED_PROPERTIES = {
    # Name: (Density, MP, BP)
    "Rutherfordium": (23.2, 2400.0, 5800.0),
    "Dubnium": (29.3, 3000.0, 5800.0),
    "Seaborgium": (35.0, 3100.0, 6000.0),
    "Bohrium": (37.1, 3300.0, 6100.0),
    "Hassium": (41.0, 3300.0, 6200.0),
    "Meitnerium": (37.4, 3200.0, 6000.0),
    "Darmstadtium": (34.8, 3000.0, 5800.0),
    "Roentgenium": (28.7, 2800.0, 5500.0),
    "Copernicium": (23.7, 283.0, 340.0),
    "Nihonium": (16.0, 700.0, 1400.0),
    "Flerovium": (14.0, 200.0, 420.0),
    "Moscovium": (13.5, 670.0, 1400.0),
    "Livermorium": (12.9, 700.0, 1100.0),
    "Tennessine": (7.2, 623.0, 883.0),
    "Oganesson": (5.0, 325.0, 350.0),
    "Astatine": (7.0, 575.0, 610.0),
    "Francium": (1.87, 300.0, 950.0)
}

print("Fixing missing data for 119 Elements...")

elements = db.query(Substance).filter(Substance.type == 'element').all()
for el in elements:
    # 1. CAS Number
    if el.name in ELEMENT_CAS:
        el.cas_number = ELEMENT_CAS[el.name]
    else:
        # Fallback to symbol-based or generic
        el.cas_number = f"N/A-{el.symbol}"
        
    # 2. Predicted Physical Properties
    if el.name in PREDICTED_PROPERTIES:
        pdens, pmp, pbp = PREDICTED_PROPERTIES[el.name]
        if el.density is None: el.density = pdens
        if el.melting_point is None: el.melting_point = pmp
        if el.boiling_point is None: el.boiling_point = pbp

    # 3. Hazards
    haz = db.query(HazardData).filter(HazardData.substance_id == el.id).first()
    if not haz:
        # Default Hazard for element based on group or radioactivity
        pictograms = []
        h, f, i = 0, 0, 0
        
        if el.is_radioactive:
            pictograms.append("Health Hazard")
            h = 4
        
        # Noble gases
        if el.group_number == 18:
            h, f, i = 1, 0, 0
            
        # Alkalines
        elif el.group_number in [1, 2]:
            pictograms.append("Corrosive")
            pictograms.append("Flammable")
            h, f, i = 3, 3, 2
            
        haz = HazardData(
            substance_id=el.id,
            ghs_pictograms=pictograms,
            ghs_signal_word="Danger" if h >= 3 or f >= 3 else ("Warning" if h > 0 else "None"),
            nfpa_health=h,
            nfpa_flammability=f,
            nfpa_instability=i
        )
        db.add(haz)

db.commit()
print("All missing elements data updated successfully!")
db.close()
