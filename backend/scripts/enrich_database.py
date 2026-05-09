import os
import sys
import json
import time
import requests
from sqlalchemy.orm import Session

# Ensure we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models import Substance, HazardData, Reaction
from app.seed_data import seed_database

def get_nova_api_key():
# ... (rest of get_nova_api_key) ...
    key = os.getenv("NOVA_API_KEY")
    if not key:
        print("ERROR: NOVA_API_KEY environment variable not set.")
        print("Example usage:")
        print("  Windows: $env:NOVA_API_KEY='dc79b0...'; python enrich_database.py")
        sys.exit(1)
    return key


def prompt_nova(api_key, element_name):
    prompt = f"""
    You are an expert chemist. Provide comprehensive data for the chemical element: {element_name}.
    We need exactly 30 distinct, real chemical reactions involving {element_name} (as a reactant or product), 
    plus its hazard profile and missing physical properties.
    
    Return pure JSON with this exact structure:
    {{
        "physical": {{
            "color": "silvery",
            "atomic_radius": 120,
            "electronegativity": 2.2,
            "oxidation_states": [-1, 1]
        }},
        "hazard": {{
            "ghs_pictograms": ["Flame", "Health Hazard"],
            "ghs_signal_word": "Danger",
            "h_statements": ["H220", "H314"],
            "p_statements": ["P210", "P260"],
            "nfpa_health": 3, "nfpa_flammability": 4, "nfpa_instability": 2, "nfpa_special": "W"
        }},
        "reactions": [
            {{
                "name": "Combustion of {element_name}",
                "equation": "2H2 + O2 -> 2H2O",
                "reaction_type": "Combustion",
                "conditions": "Spark",
                "enthalpy_change": -286.0,
                "is_reversible": false,
                "description": "Short description of the reaction",
                "safety_notes": "Danger of explosion",
                "industrial_value_tier": 1
            }}
        ]
    }}
    
    CRITICAL INSTRUCTION: Output ONLY raw structurally perfect JSON. ABSOLUTELY NO '//' COMMENTS. Use "null" (lowercase) for missing values. No trailing commas.
    """

    print(f"[{element_name}] Calling Amazon Nova...")
    res = requests.post(
        "https://api.nova.amazon.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        json={
            "model": "nova-2-lite-v1",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2
        }
    )

    if not res.ok:
        print(f"[{element_name}] API Error {res.status_code}: {res.text}")
        return None

    data = res.json()
    try:
        content = data["choices"][0]["message"]["content"]
        if content.startswith("```json"):
            content = content.replace("```json", "").replace("```", "").strip()
        content = content.strip()
        import re
        content = re.sub(r',(\s*[}\]])', r'\1', content) # Remove trailing commas
        
        parsed = json.loads(content)
        return parsed
    except Exception as e:
        print(f"[{element_name}] Failed to parse JSON: {e}")
        return None


def enrich_element(db: Session, element_name: str, parsed_data: dict):
    element = db.query(Substance).filter(Substance.name == element_name, Substance.type == 'element').first()
    if not element:
        print(f"[{element_name}] Element not found in database.")
        return False

    # 1. Update Physical Properties
    phys = parsed_data.get("physical", {})
    if phys.get("color"): element.color = phys["color"]
    if phys.get("atomic_radius"): element.atomic_radius = phys["atomic_radius"]
    if phys.get("electronegativity"): element.electronegativity = phys["electronegativity"]
    if phys.get("oxidation_states"): element.oxidation_states = phys["oxidation_states"]

    # 2. Add/Update Hazard Data
    haz = parsed_data.get("hazard", {})
    if not element.hazard_data:
        element.hazard_data = HazardData(substance_id=element.id)
        db.add(element.hazard_data)
    
    hd = element.hazard_data
    hd.ghs_pictograms = haz.get("ghs_pictograms", [])
    hd.ghs_signal_word = haz.get("ghs_signal_word", "")
    hd.h_statements = haz.get("h_statements", [])
    hd.p_statements = haz.get("p_statements", [])
    hd.nfpa_health = haz.get("nfpa_health")
    hd.nfpa_flammability = haz.get("nfpa_flammability")
    hd.nfpa_instability = haz.get("nfpa_instability")
    hd.nfpa_special = haz.get("nfpa_special", "")

    # 3. Insert Reactions
    rxn_list = parsed_data.get("reactions", [])
    print(f"[{element_name}] Injecting {len(rxn_list)} reactions...")
    
    for r in rxn_list:
        new_rxn = Reaction(
            name=r.get("name", "Unknown Reaction"),
            equation=r.get("equation", ""),
            reaction_type=r.get("reaction_type", ""),
            conditions=r.get("conditions", ""),
            enthalpy_change=r.get("enthalpy_change"),
            is_reversible=r.get("is_reversible", False),
            description=r.get("description", ""),
            safety_notes=r.get("safety_notes", ""),
            industrial_value_tier=r.get("industrial_value_tier")
        )
        db.add(new_rxn)
        
        # We loosely associate the reaction to the element just so it appears in its tab
        new_rxn.reactants.append(element) 

    db.commit()
    print(f"[{element_name}] Successfully updated in database!")
    return True


if __name__ == "__main__":
    key = get_nova_api_key()
    
    # Initialize DB session
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    if db.query(Substance).count() == 0:
        print("Database is empty. Running initial seed...")
        seed_database()
        print("Initial seed complete.")

    if len(sys.argv) > 1:
        target_element = sys.argv[1].strip()
    else:
        print("Usage: python enrich_database.py [Element Name | ALL]")
        sys.exit(1)

    if target_element.upper() == "ALL":
        elements = db.query(Substance).filter(Substance.type == 'element').all()
        # Only target elements with fewer than 5 reactions (which means they failed)
        incomplete = [el for el in elements if len(el.reactions_as_reactant) < 5]
        
        print(f"Found {len(incomplete)} incomplete elements to process.")
        for el in incomplete:
            data = prompt_nova(key, el.name)
            if data:
                enrich_element(db, el.name, data)
            time.sleep(5)  # Pause to respect Rate Limits
    else:
        element = db.query(Substance).filter(Substance.name.ilike(target_element), Substance.type == 'element').first()
        if not element:
            print(f"Error: Element '{target_element}' not found in database.")
            sys.exit(1)
            
        data = prompt_nova(key, element.name)
        if data:
            enrich_element(db, element.name, data)
            
    db.close()
    print("\nEnrichment Complete!")
