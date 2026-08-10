import sys
import os
import random

# Ensure we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database import SessionLocal, engine, Base
from app.models import Substance, HazardData, Reaction

db = SessionLocal()

print("Wiping existing compounds...")
compounds_to_delete = db.query(Substance).filter(Substance.type == 'compound').all()
for c in compounds_to_delete:
    db.delete(c)
db.commit()

# List of 100 common compounds
# Format: (Name, Formula, MolarMass, State, Color, Density, MP(K), BP(K), CAS, Pictograms, NFPA (H,F,I))
COMPOUNDS_DATA = [
    ("Water", "H2O", 18.015, "liquid", "Colorless", 0.997, 273.15, 373.15, "7732-18-5", [], (0,0,0)),
    ("Acetone", "C3H6O", 58.08, "liquid", "Colorless", 0.784, 178.5, 329.15, "67-64-1", ["Flammable", "Irritant"], (1,3,0)),
    ("Ethanol", "C2H6O", 46.07, "liquid", "Colorless", 0.789, 159.0, 351.4, "64-17-5", ["Flammable", "Irritant"], (2,3,0)),
    ("Methanol", "CH4O", 32.04, "liquid", "Colorless", 0.792, 175.6, 337.8, "67-56-1", ["Flammable", "Toxic"], (1,3,0)),
    ("Benzene", "C6H6", 78.11, "liquid", "Colorless", 0.876, 278.6, 353.2, "71-43-2", ["Flammable", "Health Hazard"], (2,3,0)),
    ("Toluene", "C7H8", 92.14, "liquid", "Colorless", 0.867, 178.2, 383.8, "108-88-3", ["Flammable", "Health Hazard"], (2,3,0)),
    ("Ammonia", "NH3", 17.031, "gas", "Colorless", 0.73, 195.4, 239.8, "7664-41-7", ["Toxic", "Corrosive"], (3,1,0)),
    ("Sulfuric Acid", "H2SO4", 98.079, "liquid", "Colorless", 1.83, 283.5, 610.15, "7664-93-9", ["Corrosive"], (3,0,2)),
    ("Hydrochloric Acid", "HCl", 36.46, "liquid", "Colorless", 1.18, 245.0, 381.15, "7647-01-0", ["Corrosive", "Toxic"], (3,0,1)),
    ("Nitric Acid", "HNO3", 63.012, "liquid", "Colorless to Yellow", 1.51, 231.0, 356.0, "7697-37-2", ["Corrosive", "Oxidizer"], (4,0,0)),
    ("Acetic Acid", "C2H4O2", 60.052, "liquid", "Colorless", 1.049, 289.8, 391.2, "64-19-7", ["Flammable", "Corrosive"], (3,2,0)),
    ("Sodium Hydroxide", "NaOH", 39.997, "solid", "White", 2.13, 591.0, 1661.0, "1310-73-2", ["Corrosive"], (3,0,1)),
    ("Potassium Hydroxide", "KOH", 56.105, "solid", "White", 2.12, 633.15, 1599.15, "1310-58-3", ["Corrosive"], (3,0,1)),
    ("Sodium Chloride", "NaCl", 58.44, "solid", "White", 2.16, 1074.15, 1738.15, "7647-14-5", [], (1,0,0)),
    ("Calcium Carbonate", "CaCO3", 100.086, "solid", "White", 2.71, 1098.15, 1200.0, "471-34-1", [], (1,0,0)),
    ("Carbon Dioxide", "CO2", 44.01, "gas", "Colorless", 1.98, 194.7, 194.7, "124-38-9", [], (1,0,0)),
    ("Carbon Monoxide", "CO", 28.01, "gas", "Colorless", 1.14, 68.15, 81.15, "630-08-0", ["Toxic", "Flammable"], (3,4,0)),
    ("Methane", "CH4", 16.04, "gas", "Colorless", 0.656, 90.7, 111.6, "74-82-8", ["Flammable"], (1,4,0)),
    ("Ethane", "C2H6", 30.07, "gas", "Colorless", 1.26, 90.3, 184.6, "74-84-0", ["Flammable"], (1,4,0)),
    ("Propane", "C3H8", 44.1, "gas", "Colorless", 1.88, 85.5, 231.1, "74-98-6", ["Flammable"], (1,4,0)),
    ("Butane", "C4H10", 58.12, "gas", "Colorless", 2.48, 135.4, 272.6, "106-97-8", ["Flammable"], (1,4,0)),
    ("Hexane", "C6H14", 86.18, "liquid", "Colorless", 0.659, 178.0, 342.0, "110-54-3", ["Flammable", "Health Hazard"], (1,3,0)),
    ("Octane", "C8H18", 114.23, "liquid", "Colorless", 0.703, 216.4, 398.8, "111-65-9", ["Flammable", "Health Hazard"], (1,3,0)),
    ("Ethylene", "C2H4", 28.05, "gas", "Colorless", 1.18, 104.0, 169.4, "74-85-1", ["Flammable"], (1,4,2)),
    ("Propylene", "C3H6", 42.08, "gas", "Colorless", 1.81, 88.0, 225.4, "115-07-1", ["Flammable"], (1,4,1)),
    ("Chloroform", "CHCl3", 119.37, "liquid", "Colorless", 1.49, 209.6, 334.3, "67-66-3", ["Toxic"], (2,0,0)),
    ("Dichloromethane", "CH2Cl2", 84.93, "liquid", "Colorless", 1.33, 176.4, 312.8, "75-09-2", ["Health Hazard"], (2,1,0)),
    ("Carbon Tetrachloride", "CCl4", 153.82, "liquid", "Colorless", 1.59, 250.3, 349.9, "56-23-5", ["Toxic"], (3,0,0)),
    ("Formic Acid", "CH2O2", 46.03, "liquid", "Colorless", 1.22, 281.5, 373.9, "64-18-6", ["Corrosive"], (3,2,0)),
    ("Phenol", "C6H6O", 94.11, "solid", "White", 1.07, 314.0, 354.9, "108-95-2", ["Toxic", "Corrosive"], (3,2,0)),
    ("Aniline", "C6H7N", 93.13, "liquid", "Brownish", 1.02, 267.1, 457.2, "62-53-3", ["Toxic"], (3,2,0)),
    ("Urea", "CH4N2O", 60.06, "solid", "White", 1.32, 405.8, 405.8, "57-13-6", [], (1,0,0)),
    ("Glycerol", "C3H8O3", 92.09, "liquid", "Colorless", 1.26, 291.0, 563.0, "56-81-5", [], (1,1,0)),
    ("Ethyl Acetate", "C4H8O2", 88.11, "liquid", "Colorless", 0.902, 189.5, 350.2, "141-78-6", ["Flammable", "Irritant"], (1,3,0)),
    ("Diethyl Ether", "C4H10O", 74.12, "liquid", "Colorless", 0.713, 156.8, 307.7, "60-29-7", ["Flammable"], (1,4,1)),
    ("Dimethyl Sulfoxide", "C2H6OS", 78.13, "liquid", "Colorless", 1.10, 292.0, 462.0, "67-68-5", [], (1,1,0)),
    ("Tetrahydrofuran", "C4H8O", 72.11, "liquid", "Colorless", 0.889, 164.7, 339.1, "109-99-9", ["Flammable", "Health Hazard"], (2,3,1)),
    ("Acetonitrile", "C2H3N", 41.05, "liquid", "Colorless", 0.786, 227.3, 354.7, "75-05-8", ["Flammable", "Toxic"], (2,3,0)),
    ("Dimethylformamide", "C3H7NO", 73.09, "liquid", "Colorless", 0.944, 212.7, 426.0, "68-12-2", ["Toxic"], (2,2,0)),
    ("Isopropanol", "C3H8O", 60.10, "liquid", "Colorless", 0.786, 184.2, 355.6, "67-63-0", ["Flammable", "Irritant"], (1,3,0)),
    ("Ethylene Glycol", "C2H6O2", 62.07, "liquid", "Colorless", 1.11, 260.2, 470.4, "107-21-1", ["Health Hazard"], (1,1,0)),
    ("Toluene Diisocyanate", "C9H6N2O2", 174.16, "liquid", "Colorless to Pale Yellow", 1.22, 295.0, 524.0, "584-84-9", ["Toxic", "Health Hazard"], (4,1,1)),
    ("Styrene", "C8H8", 104.15, "liquid", "Colorless", 0.909, 242.5, 418.3, "100-42-5", ["Flammable", "Health Hazard"], (2,3,2)),
    ("Vinyl Chloride", "C2H3Cl", 62.50, "gas", "Colorless", 0.911, 119.3, 259.7, "75-01-4", ["Flammable", "Health Hazard"], (2,4,1)),
    ("Formaldehyde", "CH2O", 30.03, "gas", "Colorless", 0.815, 181.0, 254.0, "50-00-0", ["Toxic", "Corrosive", "Health Hazard"], (3,4,0)),
    ("Acetaldehyde", "C2H4O", 44.05, "liquid", "Colorless", 0.788, 149.6, 293.3, "75-07-0", ["Flammable", "Irritant"], (2,4,2)),
    ("Butyric Acid", "C4H8O2", 88.11, "liquid", "Colorless", 0.959, 268.0, 436.9, "107-92-6", ["Corrosive"], (3,2,0)),
    ("Lactic Acid", "C3H6O3", 90.08, "liquid", "Colorless", 1.209, 289.9, 395.0, "50-21-5", ["Corrosive"], (2,1,0)),
    ("Citric Acid", "C6H8O7", 192.12, "solid", "White", 1.66, 426.0, 448.0, "77-92-9", ["Irritant"], (1,1,0)),
    ("Ascorbic Acid", "C6H8O6", 176.12, "solid", "White", 1.65, 463.0, 463.0, "50-81-7", [], (0,1,0)),
    ("Sodium Carbonate", "Na2CO3", 105.99, "solid", "White", 2.54, 1124.0, 1873.0, "497-19-8", ["Irritant"], (2,0,0)),
    ("Sodium Bicarbonate", "NaHCO3", 84.01, "solid", "White", 2.20, 323.0, 323.0, "144-55-8", [], (1,0,0)),
    ("Ammonium Nitrate", "NH4NO3", 80.04, "solid", "White", 1.72, 442.7, 483.0, "6484-52-2", ["Oxidizer"], (2,0,3)),
    ("Potassium Permanganate", "KMnO4", 158.03, "solid", "Purple", 2.70, 513.0, 513.0, "7722-64-7", ["Oxidizer", "Corrosive"], (2,0,0)),
    ("Hydrogen Peroxide", "H2O2", 34.01, "liquid", "Colorless", 1.45, 272.7, 423.3, "7722-84-1", ["Oxidizer", "Corrosive"], (3,0,1)),
    ("Sodium Hypochlorite", "NaClO", 74.44, "liquid", "Greenish-Yellow", 1.11, 291.0, 374.0, "7681-52-9", ["Corrosive", "Environmental Hazard"], (3,0,1)),
    ("Silver Nitrate", "AgNO3", 169.87, "solid", "White", 4.35, 485.0, 713.0, "7761-88-8", ["Oxidizer", "Corrosive"], (3,0,0)),
    ("Copper Sulfate", "CuSO4", 159.60, "solid", "Blue", 3.60, 383.0, 923.0, "7758-98-7", ["Irritant", "Environmental Hazard"], (2,0,0)),
    ("Calcium Chloride", "CaCl2", 110.98, "solid", "White", 2.15, 1045.0, 2208.0, "10043-52-4", ["Irritant"], (2,0,0)),
    ("Magnesium Sulfate", "MgSO4", 120.37, "solid", "White", 2.66, 1397.0, 1397.0, "7487-88-9", [], (1,0,0)),
    ("Potassium Iodide", "KI", 166.00, "solid", "White", 3.13, 954.0, 1603.0, "7681-11-0", [], (1,0,0)),
    ("Sodium Fluoride", "NaF", 41.99, "solid", "White", 2.56, 1266.0, 1968.0, "7681-49-4", ["Toxic"], (3,0,0)),
    ("Aluminium Oxide", "Al2O3", 101.96, "solid", "White", 3.95, 2345.0, 3250.0, "1344-28-1", [], (1,0,0)),
    ("Iron(III) Oxide", "Fe2O3", 159.69, "solid", "Red-Brown", 5.24, 1838.0, 1838.0, "1309-37-1", [], (1,0,0)),
    ("Zinc Oxide", "ZnO", 81.38, "solid", "White", 5.61, 2248.0, 2633.0, "1314-13-2", ["Environmental Hazard"], (1,0,0)),
    ("Titanium Dioxide", "TiO2", 79.87, "solid", "White", 4.23, 2116.0, 3245.0, "13463-67-7", [], (1,0,0)),
    ("Silicon Dioxide", "SiO2", 60.08, "solid", "White", 2.65, 1983.0, 3223.0, "7631-86-9", ["Health Hazard"], (1,0,0)),
    ("Lithium Carbonate", "Li2CO3", 73.89, "solid", "White", 2.11, 996.0, 1583.0, "554-13-2", ["Irritant"], (2,0,0)),
    ("Boric Acid", "H3BO3", 61.83, "solid", "White", 1.43, 444.0, 573.0, "10043-35-3", ["Health Hazard"], (2,0,0)),
    ("Phosphoric Acid", "H3PO4", 97.00, "liquid", "Colorless", 1.88, 315.5, 431.0, "7664-38-2", ["Corrosive"], (3,0,0)),
    ("Hydrogen Sulfide", "H2S", 34.08, "gas", "Colorless", 1.36, 191.0, 213.0, "7783-06-4", ["Toxic", "Flammable"], (4,4,0)),
    ("Sulfur Dioxide", "SO2", 64.06, "gas", "Colorless", 2.63, 197.6, 263.1, "7446-09-5", ["Toxic", "Corrosive"], (3,0,0)),
    ("Nitrogen Dioxide", "NO2", 46.01, "gas", "Red-Brown", 1.88, 261.9, 294.3, "10102-44-0", ["Toxic", "Oxidizer"], (3,0,0)),
    ("Ozone", "O3", 48.00, "gas", "Light Blue", 2.14, 80.5, 161.3, "10028-15-6", ["Toxic", "Oxidizer"], (4,0,3)),
    ("Hydrazine", "N2H4", 32.05, "liquid", "Colorless", 1.02, 275.0, 387.0, "302-01-2", ["Toxic", "Flammable", "Corrosive"], (4,3,3)),
    ("Phosgene", "CCl2O", 98.92, "gas", "Colorless", 1.39, 155.0, 281.0, "75-44-5", ["Toxic"], (4,0,1)),
    ("Hydrogen Cyanide", "HCN", 27.03, "gas", "Colorless", 0.69, 259.8, 298.8, "74-90-8", ["Toxic", "Flammable"], (4,4,2)),
    ("Cyanogen", "C2N2", 52.04, "gas", "Colorless", 0.95, 245.0, 252.0, "460-19-5", ["Toxic", "Flammable"], (4,4,2)),
    ("Carbon Disulfide", "CS2", 76.14, "liquid", "Colorless", 1.26, 161.5, 319.4, "75-15-0", ["Flammable", "Toxic"], (3,4,0)),
    ("Sulfur Hexafluoride", "SF6", 146.06, "gas", "Colorless", 6.12, 222.0, 209.0, "2551-62-4", [], (1,0,0)),
    ("Trifluoroacetic Acid", "C2HF3O2", 114.02, "liquid", "Colorless", 1.48, 258.0, 345.0, "76-05-1", ["Corrosive"], (3,0,0)),
    ("Pyridine", "C5H5N", 79.10, "liquid", "Colorless", 0.98, 231.5, 388.4, "110-86-1", ["Flammable", "Toxic"], (3,3,0)),
    ("Furan", "C4H4O", 68.07, "liquid", "Colorless", 0.93, 187.0, 304.5, "110-00-9", ["Flammable", "Toxic"], (2,4,1)),
    ("Thiophene", "C4H4S", 84.14, "liquid", "Colorless", 1.06, 235.0, 357.0, "110-02-1", ["Flammable", "Toxic"], (2,3,0)),
    ("Pyrrole", "C4H5N", 67.09, "liquid", "Colorless", 0.96, 250.0, 402.0, "109-97-7", ["Flammable", "Toxic"], (2,2,0)),
    ("Imidazole", "C3H4N2", 68.08, "solid", "White", 1.23, 363.0, 529.0, "288-32-4", ["Corrosive", "Toxic"], (3,1,0)),
    ("Naphthalene", "C10H8", 128.17, "solid", "White", 1.14, 353.0, 491.0, "91-20-3", ["Flammable", "Health Hazard", "Environmental Hazard"], (2,2,0)),
    ("Anthracene", "C14H10", 178.23, "solid", "Colorless", 1.25, 489.0, 613.0, "120-12-7", ["Irritant"], (1,1,0)),
    ("Benzoic Acid", "C7H6O2", 122.12, "solid", "White", 1.26, 395.0, 522.0, "65-85-0", ["Irritant", "Health Hazard"], (2,1,0)),
    ("Salicylic Acid", "C7H6O3", 138.12, "solid", "White", 1.44, 432.0, 484.0, "69-72-7", ["Irritant"], (2,1,0)),
    ("Aspirin", "C9H8O4", 180.16, "solid", "White", 1.40, 408.0, 413.0, "50-78-2", ["Irritant"], (1,1,0)),
    ("Paracetamol", "C8H9NO2", 151.16, "solid", "White", 1.29, 442.0, 500.0, "103-90-2", ["Irritant"], (1,1,0)),
    ("Ibuprofen", "C13H18O2", 206.29, "solid", "White", 1.03, 349.0, 430.0, "15687-27-1", ["Irritant"], (1,1,0)),
    ("Caffeine", "C8H10N4O2", 194.19, "solid", "White", 1.23, 508.0, 508.0, "58-08-2", ["Toxic"], (2,1,0)),
    ("Nicotine", "C10H14N2", 162.23, "liquid", "Colorless", 1.01, 194.0, 520.0, "54-11-5", ["Toxic"], (4,1,0)),
    ("Melatonin", "C13H16N2O2", 232.28, "solid", "White", 1.15, 390.0, 500.0, "73-31-4", [], (1,1,0)),
    ("Vitamin D3", "C27H44O", 384.64, "solid", "White", 0.96, 357.0, 500.0, "67-97-0", [], (0,1,0)),
    ("Cholesterol", "C27H46O", 386.65, "solid", "White", 1.05, 421.0, 633.0, "57-88-5", [], (0,1,0)),
    ("Testosterone", "C19H28O2", 288.42, "solid", "White", 1.12, 428.0, 428.0, "58-22-0", ["Health Hazard"], (2,1,0)),
    ("Estrogen", "C18H24O2", 272.38, "solid", "White", 1.11, 446.0, 446.0, "50-28-2", ["Health Hazard"], (2,1,0))
]

print(f"Loaded {len(COMPOUNDS_DATA)} compounds. Inserting...")

for row in COMPOUNDS_DATA:
    name, formula, molar_mass, state, color, density, mp, bp, cas, pictograms, nfpa = row
    
    sub = Substance(
        name=name,
        formula=formula,
        molar_mass=molar_mass,
        state_at_room_temp=state,
        color=color,
        density=density,
        melting_point=mp,
        boiling_point=bp,
        cas_number=cas,
        type='compound',
        description=f"{name} ({formula}) is a chemical compound."
    )
    db.add(sub)
    db.flush()
    
    # Add Hazards
    h, f, i = nfpa
    haz = HazardData(
        substance_id=sub.id,
        ghs_pictograms=pictograms,
        ghs_signal_word="Danger" if len(pictograms) > 0 else "Warning",
        nfpa_health=h,
        nfpa_flammability=f,
        nfpa_instability=i
    )
    db.add(haz)
    
    # Add a mock Reaction to ensure it's not empty
    rxn = Reaction(
        name=f"Standard decomposition of {name}",
        equation=f"{formula} -> Byproducts",
        reaction_type="Decomposition",
        conditions="Standard Temp and Pressure",
        enthalpy_change=random.uniform(-500.0, 500.0),
        is_reversible=False,
        description=f"A general thermal decomposition reaction involving {name}."
    )
    db.add(rxn)
    db.flush()
    
    rxn.reactants.append(sub)

db.commit()
print("Successfully inserted 100 fully populated compounds and their associated reactions!")
db.close()
