"""ChemBase Pro - Main FastAPI Application"""
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional, List
from contextlib import asynccontextmanager

from .database import get_db, engine, Base
from .models import Substance, Reaction, HazardData
from .schemas import (
    SubstanceOut, SubstanceSummary, SubstanceCreate,
    ReactionOut, SearchResult, HazardDataOut, StatsOut
)
from .seed_data import seed_database
import csv
import io
from fastapi.responses import StreamingResponse
import json
import httpx
import asyncio


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed data
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield


app = FastAPI(
    title="ChemBase Pro API",
    description="Chemical Reaction Database Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


# ──────────────────────────────────────────────
# Health
# ──────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "ChemBase Pro"}


# ──────────────────────────────────────────────
# Substances
# ──────────────────────────────────────────────
@app.get("/api/substances", response_model=List[SubstanceSummary])
def list_substances(
    type: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    q = db.query(Substance)
    if type:
        q = q.filter(Substance.type == type)
    if category:
        q = q.filter(Substance.category == category)
    return q.order_by(Substance.atomic_number.asc().nullslast(), Substance.name).offset(offset).limit(limit).all()


@app.get("/api/substances/{substance_id}", response_model=SubstanceOut)
def get_substance(substance_id: str, db: Session = Depends(get_db)):
    s = db.query(Substance).options(joinedload(Substance.hazard_data)).filter(Substance.id == substance_id).first()
    if not s:
        raise HTTPException(404, "Substance not found")
    return s


@app.get("/api/substances/{substance_id}/reactions", response_model=List[ReactionOut])
def get_substance_reactions(substance_id: str, db: Session = Depends(get_db)):
    rxns = db.query(Reaction).options(
        joinedload(Reaction.reactants), joinedload(Reaction.products)
    ).filter(
        or_(
            Reaction.reactants.any(Substance.id == substance_id),
            Reaction.products.any(Substance.id == substance_id)
        )
    ).all()
    return rxns


@app.get("/api/elements", response_model=List[SubstanceSummary])
def list_elements(db: Session = Depends(get_db)):
    return db.query(Substance).filter(Substance.type == "element").order_by(Substance.atomic_number).all()


@app.get("/api/elements/by-symbol/{symbol}", response_model=SubstanceOut)
def get_element_by_symbol(symbol: str, db: Session = Depends(get_db)):
    s = db.query(Substance).options(joinedload(Substance.hazard_data)).filter(
        Substance.symbol == symbol, Substance.type == "element"
    ).first()
    if not s:
        raise HTTPException(404, "Element not found")
    return s


@app.get("/api/compounds", response_model=List[SubstanceSummary])
def list_compounds(db: Session = Depends(get_db)):
    return db.query(Substance).filter(Substance.type == "compound").order_by(Substance.name).all()


@app.get("/api/compounds/by-elements")
def get_compounds_by_elements(
    elements: str = Query(..., description="Comma-separated list of element symbols or names"),
    db: Session = Depends(get_db)
):
    import re
    # 1. Resolve elements to symbols
    items = [e.strip() for e in elements.split(",") if e.strip()]
    provided_symbols = set()
    for item in items:
        s = db.query(Substance).filter(Substance.type == "element").filter(
            or_(
                Substance.symbol.ilike(item),
                Substance.name.ilike(item)
            )
        ).first()
        if s and s.symbol:
            provided_symbols.add(s.symbol)
    
    if not provided_symbols:
        return {"compounds": [], "reactions": []}

    # 2. Find matching compounds whose elements are a subset of provided elements
    all_compounds = db.query(Substance).options(joinedload(Substance.hazard_data)).filter(Substance.type == "compound").all()
    matched_compounds = []
    matched_compound_ids = set()
    
    for c in all_compounds:
        if not c.formula or c.formula == "?":
            continue
        c_elements = set(re.findall(r'[A-Z][a-z]?', c.formula))
        # strictly subset AND not empty
        if c_elements and c_elements.issubset(provided_symbols):
            matched_compounds.append(SubstanceOut.model_validate(c))
            matched_compound_ids.add(c.id)

    # 3. Find related reactions
    matched_reactions = []
    if matched_compound_ids:
        rxns = db.query(Reaction).options(
            joinedload(Reaction.reactants), joinedload(Reaction.products)
        ).filter(
            or_(
                Reaction.reactants.any(Substance.id.in_(list(matched_compound_ids))),
                Reaction.products.any(Substance.id.in_(list(matched_compound_ids)))
            )
        ).all()
        matched_reactions = [ReactionOut.model_validate(r) for r in rxns]

    return {
        "compounds": matched_compounds,
        "reactions": matched_reactions
    }


# ──────────────────────────────────────────────
# Reactions
# ──────────────────────────────────────────────
@app.get("/api/reactions", response_model=List[ReactionOut])
def list_reactions(
    reaction_type: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    q = db.query(Reaction).options(
        joinedload(Reaction.reactants), joinedload(Reaction.products)
    )
    if reaction_type:
        q = q.filter(Reaction.reaction_type == reaction_type)
    return q.limit(limit).all()


@app.get("/api/reactions/{reaction_id}", response_model=ReactionOut)
def get_reaction(reaction_id: str, db: Session = Depends(get_db)):
    r = db.query(Reaction).options(
        joinedload(Reaction.reactants), joinedload(Reaction.products)
    ).filter(Reaction.id == reaction_id).first()
    if not r:
        raise HTTPException(404, "Reaction not found")
    return r


@app.get("/api/reactions/query/pair", response_model=List[ReactionOut])
def query_reactions_by_pair(
    reactant1: str = Query(..., description="Name or formula of first reactant"),
    reactant2: Optional[str] = Query(None, description="Name or formula of second reactant"),
    db: Session = Depends(get_db),
):
    """Find reactions involving the given reactants."""
    q = db.query(Reaction).options(
        joinedload(Reaction.reactants), joinedload(Reaction.products)
    )

    # Filter for reactions that have reactant1
    q = q.filter(
        Reaction.reactants.any(
            or_(
                Substance.name.ilike(f"%{reactant1}%"),
                Substance.formula.ilike(f"%{reactant1}%"),
            )
        )
    )

    if reactant2:
        q = q.filter(
            Reaction.reactants.any(
                or_(
                    Substance.name.ilike(f"%{reactant2}%"),
                    Substance.formula.ilike(f"%{reactant2}%"),
                )
            )
        )

    return q.all()


@app.get("/api/reactions/predict", response_model=List[ReactionOut])
def predict_reaction(
    reactant_ids: List[str] = Query(..., description="List of reactant IDs"),
    db: Session = Depends(get_db),
):
    """Accurately find reactions that strictly contain all provided substance IDs as reactants."""
    q = db.query(Reaction).options(
        joinedload(Reaction.reactants), joinedload(Reaction.products)
    )
    for r_id in reactant_ids:
        q = q.filter(Reaction.reactants.any(Substance.id == r_id))

    return q.all()


# ──────────────────────────────────────────────
# Search
# ──────────────────────────────────────────────
import urllib.request
import urllib.parse
import urllib.error
from fastapi import BackgroundTasks

# ──────────────────────────────────────────────
# CORS Proxies
# ──────────────────────────────────────────────
@app.get("/api/proxy/materialsproject")
def proxy_mp(chemsys: str, api_key: str = Query(...)):
    url = f"https://api.materialsproject.org/materials/summary/?chemsys={chemsys}&_fields=formula_pretty,density,is_stable&_limit=500"
    req = urllib.request.Request(url, headers={
        'X-API-KEY': api_key,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'application/json'
    })
    try:
        response = urllib.request.urlopen(req, timeout=15)
        return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        raise HTTPException(status_code=e.code, detail=f"MP API Error: {err_body}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def fetch_and_store_pubchem(q: str, db: Session):
    try:
        url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{urllib.parse.quote(q)}/property/MolecularFormula,MolecularWeight,IUPACName,Title/JSON"
        req = urllib.request.Request(url, headers={'User-Agent': 'ChemBasePro/1.0'})
        response = urllib.request.urlopen(req, timeout=5)
        data = json.loads(response.read().decode('utf-8'))
        
        props = data.get("PropertyTable", {}).get("Properties", [])
        if not props:
            return None
        
        comp_data = props[0]
        # Check if we already added it under a slightly different name
        existing = db.query(Substance).filter(Substance.name.ilike(comp_data.get('Title', ''))).first()
        if existing:
            return existing

        s = Substance(
            name=comp_data.get("Title", q.capitalize()),
            formula=comp_data.get("MolecularFormula", "?"),
            type="compound",
            molar_mass=comp_data.get("MolecularWeight", 0.0),
            description=f"Auto-imported from PubChem. IUPAC Name: {comp_data.get('IUPACName', 'Unknown')}",
            state_at_room_temp="unknown"
        )
        db.add(s)
        db.commit()
        db.refresh(s)
        return s
    except Exception as e:
        print(f"PubChem fetch failed for {q}: {e}")
        return None

async def fetch_pubchem_batch(names: List[str], db: Session):
    """Fetch multiple compounds from PubChem in a single batch request."""
    if not names: return []
    
    # PubChem allows comma-separated names (limit ~20 per request for safety)
    batch_size = 20
    new_substances = []
    
    async with httpx.AsyncClient() as client:
        for i in range(0, len(names), batch_size):
            chunk = names[i:i+batch_size]
            q = ",".join([urllib.parse.quote(n) for n in chunk])
            url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{q}/property/MolecularFormula,MolecularWeight,IUPACName,Title/JSON"
            
            try:
                resp = await client.get(url, timeout=10)
                if resp.status_code == 200:
                    data = resp.json()
                    props = data.get("PropertyTable", {}).get("Properties", [])
                    for comp_data in props:
                        # Check if already in DB (to avoid duplicates from concurrent requests)
                        title = comp_data.get('Title', '')
                        existing = db.query(Substance).filter(Substance.name.ilike(title)).first()
                        if not existing:
                            s = Substance(
                                name=title,
                                formula=comp_data.get("MolecularFormula", "?"),
                                type="compound",
                                molar_mass=comp_data.get("MolecularWeight", 0.0),
                                description=f"Auto-imported from PubChem. IUPAC Name: {comp_data.get('IUPACName', 'Unknown')}",
                                state_at_room_temp="unknown"
                            )
                            db.add(s)
                            new_substances.append(s)
                    db.commit()
                await asyncio.sleep(0.2) # Throttling for PubChem
            except Exception as e:
                print(f"PubChem batch fetch error: {e}")
                
    return new_substances

@app.post("/api/substances/bulk-resolve")
async def bulk_resolve(items: List[str], db: Session = Depends(get_db)):
    """Resolve a list of chemical names/formulas. Uses local DB first, then fetches missing ones from PubChem in batches."""
    resolved = []
    missing = []
    
    # 1. Check local
    for item in items:
        s = db.query(Substance).filter(
            or_(
                Substance.name.ilike(item),
                Substance.formula.ilike(item),
                Substance.symbol.ilike(item)
            )
        ).first()
        if s:
            resolved.append(SubstanceSummary.model_validate(s))
        else:
            missing.append(item)
            
    # 2. Fetch missing from PubChem in batch
    if missing:
        new_items = await fetch_pubchem_batch(missing, db)
        for s in new_items:
            resolved.append(SubstanceSummary.model_validate(s))
            
    return resolved

@app.post("/api/ai/proxy")
async def ai_proxy(payload: dict):
    """Proxy requests to AI providers. Supports: gemini, groq, openrouter, nova.
    Returns { text, model, error? } so frontend can track provider health."""
    provider = payload.get("provider")
    api_key = payload.get("api_key")
    prompt = payload.get("prompt")
    model_override = payload.get("model")  # optional model override
    
    if not api_key:
        return {"text": "", "model": "", "error": "API Key is missing"}

    async with httpx.AsyncClient() as client:
        try:
            # ── GEMINI ──────────────────────────────────────
            if provider == "gemini":
                model = model_override or "gemini-2.5-flash"
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
                data = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.2,
                        "maxOutputTokens": 8192
                    }
                }
                resp = await client.post(url, json=data, timeout=120)
                if resp.status_code != 200:
                    err_text = resp.text[:300]
                    return {"text": "", "model": model, "error": f"Gemini {resp.status_code}: {err_text}"}
                result = resp.json()
                try:
                    text = result['candidates'][0]['content']['parts'][0]['text']
                    return {"text": text, "model": model}
                except (KeyError, IndexError):
                    # Check for blocked content
                    block_reason = result.get('promptFeedback', {}).get('blockReason', '')
                    if block_reason:
                        return {"text": "", "model": model, "error": f"Content blocked: {block_reason}"}
                    return {"text": "", "model": model, "error": "Failed to parse Gemini response"}

            # ── GROQ (OpenAI-compatible) ────────────────────
            elif provider == "groq":
                model = model_override or "llama-3.3-70b-versatile"
                url = "https://api.groq.com/openai/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
                data = {
                    "model": model,
                    "messages": [
                        {"role": "user", "content": f"You are a chemistry expert. Output ONLY a valid JSON object. No markdown, no explanations, no thinking.\n\n{prompt}"}
                    ],
                    "temperature": 0.2,
                    "max_tokens": 4096,
                    "response_format": {"type": "json_object"}
                }
                resp = await client.post(url, json=data, headers=headers, timeout=150)
                if resp.status_code != 200:
                    err_text = resp.text[:300]
                    return {"text": "", "model": model, "error": f"Groq {resp.status_code}: {err_text}"}
                result = resp.json()
                try:
                    text = result['choices'][0]['message']['content']
                    return {"text": text, "model": model}
                except (KeyError, IndexError):
                    return {"text": "", "model": model, "error": "Failed to parse Groq response"}

            # ── OPENROUTER (OpenAI-compatible) ──────────────
            elif provider == "openrouter":
                model = model_override or "meta-llama/llama-3.1-8b-instruct:free"
                url = "https://openrouter.ai/api/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "ChemBase Pro"
                }
                data = {
                    "model": model,
                    "messages": [
                        {"role": "user", "content": f"You are a chemistry expert. Output ONLY a valid JSON object. No markdown, no explanations, no thinking.\n\n{prompt}"}
                    ],
                    "temperature": 0.2,
                    "max_tokens": 4096
                }
                resp = await client.post(url, json=data, headers=headers, timeout=120)
                # Auto-retry up to 5 times on 429 rate limit with staggered delays
                for _retry in range(5):
                    if resp.status_code != 429:
                        break
                    await asyncio.sleep(8 + _retry * 5)  # 8s, 13s, 18s, 23s, 28s
                    resp = await client.post(url, json=data, headers=headers, timeout=120)
                if resp.status_code != 200:
                    err_text = resp.text[:300]
                    return {"text": "", "model": model, "error": f"OpenRouter {resp.status_code}: {err_text}"}
                result = resp.json()
                try:
                    text = result['choices'][0]['message']['content']
                    used_model = result.get('model', model)
                    return {"text": text, "model": used_model}
                except (KeyError, IndexError):
                    # OpenRouter sometimes returns errors in a different format
                    error_msg = result.get('error', {}).get('message', 'Failed to parse OpenRouter response')
                    return {"text": "", "model": model, "error": error_msg}

            # ── NVIDIA NIM (OpenAI-compatible) ──────────────
            elif provider == "nvidia":
                model = model_override or "meta/llama-3.3-70b-instruct"
                url = "https://integrate.api.nvidia.com/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
                data = {
                    "model": model,
                    "messages": [
                        {"role": "user", "content": f"You are a chemistry expert. Output ONLY a valid JSON object. No markdown, no explanations, no thinking.\n\n{prompt}"}
                    ],
                    "temperature": 0.2,
                    "max_tokens": 4096
                }
                resp = await client.post(url, json=data, headers=headers, timeout=180)
                if resp.status_code != 200:
                    err_text = resp.text[:300]
                    return {"text": "", "model": model, "error": f"Nvidia {resp.status_code}: {err_text}"}
                result = resp.json()
                try:
                    text = result['choices'][0]['message']['content']
                    return {"text": text, "model": model}
                except (KeyError, IndexError):
                    return {"text": "", "model": model, "error": "Failed to parse Nvidia response"}

            # ── AMAZON NOVA ── (REMOVED: API requires browser session token, not a real API key)

            else:
                return {"text": "", "model": "", "error": f"Unknown provider: {provider}"}

        except httpx.TimeoutException:
            return {"text": "", "model": model_override or "", "error": f"{provider} request timed out (180s)"}
        except Exception as e:
            return {"text": "", "model": model_override or "", "error": f"{provider} error: {str(e)[:200]}"}


@app.post("/api/pubchem/enrich")
async def pubchem_enrich(compounds: List[dict]):
    """Enrich compounds with PubChem data (molar mass, IUPAC, GHS hazards)."""
    enriched = []
    async with httpx.AsyncClient() as client:
        batch_size = 10
        all_names = [c.get("name", c.get("formula", "")) for c in compounds if c.get("name") or c.get("formula")]
        for i in range(0, len(all_names), batch_size):
            chunk = all_names[i:i+batch_size]
            for name in chunk:
                try:
                    encoded = urllib.parse.quote(name)
                    prop_url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{encoded}/property/MolecularFormula,MolecularWeight,IUPACName,Title/JSON"
                    prop_resp = await client.get(prop_url, timeout=8, headers={"User-Agent": "ChemBasePro/2.0"})
                    if prop_resp.status_code != 200:
                        continue
                    prop_data = prop_resp.json()
                    props = prop_data.get("PropertyTable", {}).get("Properties", [])
                    if not props:
                        continue
                    p = props[0]
                    cid = p.get("CID")
                    result = {
                        "name": p.get("Title", name),
                        "formula": p.get("MolecularFormula", ""),
                        "molarMass": p.get("MolecularWeight"),
                        "iupacName": p.get("IUPACName"),
                        "pubchemCid": cid,
                        "source": "PubChem"
                    }
                    if cid:
                        try:
                            ghs_url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/{cid}/JSON?heading=GHS+Classification"
                            ghs_resp = await client.get(ghs_url, timeout=5, headers={"User-Agent": "ChemBasePro/2.0"})
                            if ghs_resp.status_code == 200:
                                ghs_data = ghs_resp.json()
                                pictograms = []
                                try:
                                    sections = ghs_data.get("Record", {}).get("Section", [])
                                    for sec in sections:
                                        for subsec in sec.get("Section", []):
                                            for info in subsec.get("Information", []):
                                                val = info.get("Value", {})
                                                for sv in val.get("StringWithMarkup", []):
                                                    text = sv.get("String", "").lower()
                                                    if "flammable" in text: pictograms.append("flammable")
                                                    if "toxic" in text: pictograms.append("toxic")
                                                    if "corrosive" in text: pictograms.append("corrosive")
                                                    if "oxidiz" in text: pictograms.append("oxidizer")
                                                    if "irritant" in text: pictograms.append("irritant")
                                except Exception:
                                    pass
                                result["ghsPictograms"] = list(set(pictograms))
                        except Exception:
                            pass
                    enriched.append(result)
                except Exception as e:
                    print(f"PubChem enrich error for {name}: {e}")
                    continue
            if i + batch_size < len(all_names):
                await asyncio.sleep(0.3)
    return enriched


@app.get("/api/search", response_model=SearchResult)
def search(
    q: str = Query(..., min_length=1, description="Search query"),
    db: Session = Depends(get_db),
):
    """Global search across substances and reactions. Supports smart queries like 'high boiling', 'corrosive', 'gases'."""
    pattern = f"%{q}%"
    ql = q.lower().strip()

    # Smart property-based filters
    smart_filter = None
    if any(k in ql for k in ['high boiling', 'high bp', 'boiling above']):
        smart_filter = Substance.boiling_point > 373  # >100°C in K
    elif any(k in ql for k in ['low boiling', 'volatile', 'low bp']):
        smart_filter = Substance.boiling_point < 373
    elif ql in ('gas', 'gases', 'gaseous'):
        smart_filter = Substance.state_at_room_temp == 'gas'
    elif ql in ('liquid', 'liquids'):
        smart_filter = Substance.state_at_room_temp == 'liquid'
    elif ql in ('solid', 'solids'):
        smart_filter = Substance.state_at_room_temp == 'solid'
    elif any(k in ql for k in ['radioactive', 'unstable']):
        smart_filter = Substance.is_radioactive == True
    elif any(k in ql for k in ['metal', 'metals']):
        smart_filter = Substance.category.ilike('%metal%')
    elif any(k in ql for k in ['noble', 'inert']):
        smart_filter = Substance.category.ilike('%noble%')
    elif any(k in ql for k in ['halogen', 'halogens']):
        smart_filter = Substance.category.ilike('%halogen%')

    if smart_filter is not None:
        substances = db.query(Substance).filter(smart_filter).limit(30).all()
    else:
        substances = db.query(Substance).filter(
            or_(
                Substance.name.ilike(pattern),
                Substance.formula.ilike(pattern),
                Substance.symbol.ilike(pattern),
                Substance.cas_number.ilike(pattern),
                Substance.description.ilike(pattern),
            )
        ).limit(20).all()

    # If no local substances are found, try PubChem live retrieval to expand database!
    if not substances and smart_filter is None:
        new_sub = fetch_and_store_pubchem(q, db)
        if new_sub:
            substances.append(new_sub)

    reactions = db.query(Reaction).options(
        joinedload(Reaction.reactants), joinedload(Reaction.products)
    ).filter(
        or_(
            Reaction.name.ilike(pattern),
            Reaction.equation.ilike(pattern),
            Reaction.description.ilike(pattern),
        )
    ).limit(10).all()

    return SearchResult(
        substances=[SubstanceSummary.model_validate(s) for s in substances],
        reactions=[ReactionOut.model_validate(r) for r in reactions],
        total=len(substances) + len(reactions),
    )


# ──────────────────────────────────────────────
# Substance Reactions lookup
# ──────────────────────────────────────────────
@app.get("/api/substances/{substance_id}/reactions", response_model=List[ReactionOut])
def get_substance_reactions(substance_id: str, db: Session = Depends(get_db)):
    """Get all reactions involving a given substance."""
    s = db.query(Substance).filter(Substance.id == substance_id).first()
    if not s:
        raise HTTPException(404, "Substance not found")

    reactions = db.query(Reaction).options(
        joinedload(Reaction.reactants), joinedload(Reaction.products)
    ).filter(
        or_(
            Reaction.reactants.any(Substance.id == substance_id),
            Reaction.products.any(Substance.id == substance_id),
        )
    ).all()

    return reactions


# ──────────────────────────────────────────────
# Stats & Export
# ──────────────────────────────────────────────
@app.get("/api/stats", response_model=StatsOut)
def get_stats(db: Session = Depends(get_db)):
    """Get basic counts for the application dashboard."""
    elements = db.query(Substance).filter(Substance.type == "element").count()
    compounds = db.query(Substance).filter(Substance.type == "compound").count()
    reactions = db.query(Reaction).count()
    total = elements + compounds
    return StatsOut(
        elements=elements,
        compounds=compounds,
        reactions=reactions,
        total_substances=total
    )

@app.get("/api/export")
def export_data(format: str = Query("csv", description="Format to export: csv or json"), db: Session = Depends(get_db)):
    """Export substance and reaction data."""
    substances = db.query(Substance).all()
    reactions = db.query(Reaction).all()

    if format.lower() == "json":
        data = {
            "substances": [
                {
                    "id": s.id, "name": s.name, "formula": s.formula, "type": s.type, 
                    "cas_number": s.cas_number, "molar_mass": s.molar_mass
                } for s in substances
            ],
            "reactions": [
                {
                    "id": r.id, "name": r.name, "equation": r.equation, 
                    "reaction_type": r.reaction_type,
                    "industrial_tier": r.industrial_value_tier,
                    "verification": r.verification_status
                } for r in reactions
            ]
        }
        return data

    else:
        # CSV Export (Default to simple substances export for CSV)
        stream = io.StringIO()
        writer = csv.writer(stream)
        writer.writerow(["ID", "Name", "Formula", "Type", "CAS Number", "Molar Mass", "Description"])
        
        for s in substances:
            writer.writerow([s.id, s.name, s.formula, s.type, s.cas_number, s.molar_mass, s.description])
            
        stream.seek(0)
        return StreamingResponse(
            iter([stream.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=chembase_substances.csv"}
        )


# ═══════════════════════════════════════════════════════════
# PubChem Substance Profile — Comprehensive chemical datasheet
# ═══════════════════════════════════════════════════════════

@app.get("/api/pubchem/profile/{name}")
async def pubchem_substance_profile(name: str):
    """Fetch comprehensive chemical profile from PubChem PUG REST API."""
    async with httpx.AsyncClient(timeout=30) as client:
        profile = {
            "name": name, "formula": "", "casNumber": "", "molecularWeight": None,
            "density": None, "boilingPoint": None, "meltingPoint": None,
            "heatCapacity": None, "enthalpyOfFormation": None,
            "viscosity": None, "thermalConductivity": None,
            "reactivity": "", "roleInProcess": "", "typicalConditions": "",
            "industrialApplications": "", "commonProcesses": "",
            "hazardType": "", "handling": "", "storage": "",
            "pH": "", "flashPoint": None, "toxicityIndex": "",
            "cod": "", "engineeringNotes": "",
            "iupacName": "", "synonyms": [], "description": "",
            "ghsPictograms": [], "ghsSignalWord": "", "hStatements": [], "pStatements": [],
            "vaporPressure": None, "logP": None, "solubility": ""
        }

        # 1. Resolve compound name → CID
        try:
            r = await client.get(f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{name}/cids/JSON")
            if r.status_code != 200:
                return {"error": f"Compound '{name}' not found on PubChem.", "profile": profile}
            cid = r.json()["IdentifierList"]["CID"][0]
        except Exception:
            return {"error": f"Could not resolve '{name}' on PubChem.", "profile": profile}

        # 2. Fetch compound properties
        try:
            props_url = (
                f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid}/property/"
                "MolecularFormula,MolecularWeight,IUPACName,XLogP,ExactMass,Charge/JSON"
            )
            r = await client.get(props_url)
            if r.status_code == 200:
                p = r.json()["PropertyTable"]["Properties"][0]
                profile["formula"] = p.get("MolecularFormula", "")
                profile["molecularWeight"] = p.get("MolecularWeight")
                profile["iupacName"] = p.get("IUPACName", "")
                profile["logP"] = p.get("XLogP")
        except Exception:
            pass

        # 3. Fetch synonyms (for CAS number detection)
        try:
            r = await client.get(f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid}/synonyms/JSON")
            if r.status_code == 200:
                syns = r.json()["InformationList"]["Information"][0].get("Synonym", [])
                profile["synonyms"] = syns[:10]
                import re
                for syn in syns:
                    if re.match(r'^\d{2,7}-\d{2}-\d$', syn):
                        profile["casNumber"] = syn
                        break
        except Exception:
            pass

        # 4. Fetch experimental/computed properties from PUG-View
        try:
            r = await client.get(
                f"https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/{cid}/JSON",
                params={"heading": "Experimental Properties"}
            )
            if r.status_code == 200:
                data = r.json()
                sections = data.get("Record", {}).get("Section", [])
                for section in sections:
                    for sub in section.get("Section", []):
                        heading = sub.get("TOCHeading", "")
                        for inner in sub.get("Section", []):
                            ih = inner.get("TOCHeading", "")
                            info_list = inner.get("Information", [])
                            for info in info_list:
                                val = info.get("Value", {})
                                strs = val.get("StringWithMarkup", [])
                                nums = val.get("Number", [])
                                text = strs[0]["String"] if strs else (str(nums[0]) if nums else "")

                                if "Boiling Point" in ih and profile["boilingPoint"] is None:
                                    try: profile["boilingPoint"] = float(text.split()[0].replace("°C","").replace(",",""))
                                    except: profile["boilingPoint"] = text
                                elif "Melting Point" in ih and profile["meltingPoint"] is None:
                                    try: profile["meltingPoint"] = float(text.split()[0].replace("°C","").replace(",",""))
                                    except: profile["meltingPoint"] = text
                                elif "Density" in ih and profile["density"] is None:
                                    try: profile["density"] = float(text.split()[0])
                                    except: profile["density"] = text
                                elif "Flash Point" in ih and profile["flashPoint"] is None:
                                    try: profile["flashPoint"] = float(text.split()[0].replace("°C","").replace(",",""))
                                    except: profile["flashPoint"] = text
                                elif "Viscosity" in ih and not profile["viscosity"]:
                                    profile["viscosity"] = text
                                elif "Solubility" in ih and not profile["solubility"]:
                                    profile["solubility"] = text
                                elif "Vapor Pressure" in ih and profile["vaporPressure"] is None:
                                    profile["vaporPressure"] = text
                                elif "pH" == ih and not profile["pH"]:
                                    profile["pH"] = text
        except Exception:
            pass

        # 5. Fetch GHS hazard data
        try:
            r = await client.get(
                f"https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/{cid}/JSON",
                params={"heading": "GHS Classification"}
            )
            if r.status_code == 200:
                data = r.json()
                sections = data.get("Record", {}).get("Section", [])
                for section in sections:
                    for sub in section.get("Section", []):
                        for inner in sub.get("Section", []):
                            ih = inner.get("TOCHeading", "")
                            info_list = inner.get("Information", [])
                            for info in info_list:
                                val = info.get("Value", {})
                                strs = val.get("StringWithMarkup", [])
                                text = strs[0]["String"] if strs else ""
                                if "Signal" in ih:
                                    profile["ghsSignalWord"] = text
                                elif "Pictogram" in ih:
                                    urls = [m.get("URL","") for s in strs for m in s.get("Markup", []) if m.get("URL")]
                                    profile["ghsPictograms"] = urls
                                elif "Hazard Statement" in ih:
                                    profile["hStatements"].append(text)
                                elif "Precautionary" in ih:
                                    profile["pStatements"].append(text)
        except Exception:
            pass

        # 6. Build hazard summary
        hazard_types = []
        for h in profile["hStatements"][:5]:
            hl = h.lower()
            if "flammab" in hl: hazard_types.append("Flammable")
            if "toxic" in hl or "fatal" in hl: hazard_types.append("Toxic")
            if "corrosive" in hl or "burn" in hl: hazard_types.append("Corrosive")
            if "irritat" in hl: hazard_types.append("Irritant")
            if "carcino" in hl: hazard_types.append("Carcinogenic")
        profile["hazardType"] = ", ".join(list(dict.fromkeys(hazard_types))) if hazard_types else "Review SDS"

        # 7. Fetch description
        try:
            r = await client.get(f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid}/description/JSON")
            if r.status_code == 200:
                descs = r.json().get("InformationList", {}).get("Information", [])
                for d in descs:
                    desc_text = d.get("Description", "")
                    if len(desc_text) > 30:
                        profile["description"] = desc_text[:500]
                        break
        except Exception:
            pass

        return {"error": None, "profile": profile, "cid": cid}

