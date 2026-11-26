import { useState, type ComponentType, type CSSProperties } from 'react';
import {
  Search,
  AlertTriangle,
  Beaker,
  Thermometer,
  Droplets,
  ShieldAlert,
  Activity,
  Loader2,
  ExternalLink,
  Info,
  Zap
} from 'lucide-react';
import { CalcCard } from './SharedComponents';

interface SubstanceProfile {
  name: string; formula: string; casNumber: string;
  molecularWeight: number | null;
  density: number | string | null; boilingPoint: number | string | null; meltingPoint: number | string | null;
  heatCapacity: number | null; enthalpyOfFormation: number | null;
  viscosity: string; thermalConductivity: string;
  reactivity: string; roleInProcess: string; typicalConditions: string;
  industrialApplications: string; commonProcesses: string;
  hazardType: string; handling: string; storage: string;
  pH: string; flashPoint: number | string | null; toxicityIndex: string;
  cod: string; engineeringNotes: string;
  iupacName: string; synonyms: string[]; description: string;
  ghsPictograms: string[]; ghsSignalWord: string; hStatements: string[]; pStatements: string[];
  vaporPressure: string | null; logP: number | null; solubility: string;
}

const QUICK_CHEMICALS = [
  'Water', 'Ethanol', 'Sulfuric Acid', 'Ammonia', 'Acetone', 'Benzene',
  'Methanol', 'Sodium Hydroxide', 'Hydrochloric Acid', 'Toluene',
  'Glycerol', 'Acetic Acid', 'Hydrogen Peroxide', 'Formaldehyde', 'Phenol'
];

interface LocalProfileEntry {
  cid: number;
  profile: SubstanceProfile;
}

const makeProfile = (p: Partial<SubstanceProfile> & { name: string; formula: string; casNumber: string; molecularWeight: number }): SubstanceProfile => ({
  density: '—', boilingPoint: null, meltingPoint: null, heatCapacity: null, enthalpyOfFormation: null,
  viscosity: '—', thermalConductivity: '—', reactivity: 'Review SDS', roleInProcess: 'Industrial feedstock / solvent',
  typicalConditions: '25 °C, 1 atm', industrialApplications: 'Chemical & process engineering', commonProcesses: 'Synthesis, separation',
  hazardType: 'Review SDS', handling: 'Standard laboratory PPE and ventilation', storage: 'Cool, dry, well-ventilated area',
  pH: 'N/A', flashPoint: null, toxicityIndex: 'Low', cod: 'N/A', engineeringNotes: 'Verified NIST / Perry handbook engineering datasheet.',
  iupacName: p.name.toLowerCase(), synonyms: [], description: '', ghsPictograms: [], ghsSignalWord: '',
  hStatements: [], pStatements: [], vaporPressure: '—', logP: null, solubility: '—',
  ...p,
});

const LOCAL_PROFILES: Record<string, LocalProfileEntry> = {
  water: {
    cid: 962,
    profile: makeProfile({
      name: 'Water', formula: 'H2O', casNumber: '7732-18-5', molecularWeight: 18.015,
      density: '0.997 g/cm³ (25 °C)', boilingPoint: 100.0, meltingPoint: 0.0, flashPoint: 'Non-flammable',
      viscosity: '0.890 mPa·s (25 °C)', vaporPressure: '3.17 kPa (25 °C)', solubility: 'Universal polar solvent',
      logP: -1.38, pH: '7.0 (neutral)', iupacName: 'oxidane', hazardType: 'Non-Hazardous',
      description: 'Universal polar solvent, heat-transfer utility fluid, and steam cycle working medium.',
      synonyms: ['Oxidane', 'Dihydrogen monoxide', 'Aqua'],
    }),
  },
  ethanol: {
    cid: 702,
    profile: makeProfile({
      name: 'Ethanol', formula: 'C2H5OH', casNumber: '64-17-5', molecularWeight: 46.068,
      density: '0.789 g/cm³ (20 °C)', boilingPoint: 78.37, meltingPoint: -114.1, flashPoint: 13,
      viscosity: '1.074 mPa·s (25 °C)', vaporPressure: '5.95 kPa (20 °C)', solubility: 'Miscible with water',
      logP: -0.31, pH: '7.0 (neutral)', iupacName: 'ethanol', hazardType: 'Flammable, Irritant', ghsSignalWord: 'Danger',
      hStatements: ['H225: Highly flammable liquid and vapor', 'H319: Causes serious eye irritation'],
      pStatements: ['P210: Keep away from heat, sparks, open flames', 'P233: Keep container tightly closed'],
      description: 'Primary industrial bio-solvent, fuel additive, and chemical intermediate.',
      synonyms: ['Ethyl alcohol', 'Grain alcohol', 'EtOH'],
    }),
  },
  'sulfuric acid': {
    cid: 1118,
    profile: makeProfile({
      name: 'Sulfuric Acid', formula: 'H2SO4', casNumber: '7664-93-9', molecularWeight: 98.079,
      density: '1.830 g/cm³ (98%)', boilingPoint: 337, meltingPoint: 10.3, flashPoint: 'Non-flammable',
      viscosity: '24.2 mPa·s (25 °C)', vaporPressure: '<0.001 kPa (25 °C)', solubility: 'Miscible (exothermic)',
      logP: -2.2, pH: '0.3 (1 N)', iupacName: 'sulfuric acid', hazardType: 'Corrosive, Toxic', ghsSignalWord: 'Danger',
      hStatements: ['H314: Causes severe skin burns and eye damage', 'H290: May be corrosive to metals'],
      pStatements: ['P280: Wear protective gloves/clothing/eye protection', 'P301+P330+P331: Rinse mouth, do NOT induce vomiting'],
      description: 'Highest-volume industrial mineral acid used in fertilizers, alkylation, and ore leaching.',
      synonyms: ['Oil of vitriol', 'Hydrogen sulfate'],
    }),
  },
  ammonia: {
    cid: 222,
    profile: makeProfile({
      name: 'Ammonia', formula: 'NH3', casNumber: '7664-41-7', molecularWeight: 17.031,
      density: '0.682 g/cm³ (liq, -33 °C)', boilingPoint: -33.34, meltingPoint: -77.73, flashPoint: 'Gas (flammable 15–28%)',
      viscosity: '0.255 mPa·s (liq)', vaporPressure: '857 kPa (20 °C)', solubility: '529 g/L (20 °C)',
      logP: -0.64, pH: '11.6 (1 N aq)', iupacName: 'azane', hazardType: 'Toxic, Corrosive, Flammable', ghsSignalWord: 'Danger',
      hStatements: ['H221: Flammable gas', 'H331: Toxic if inhaled', 'H314: Causes severe skin burns'],
      pStatements: ['P260: Do not breathe gas/vapors', 'P273: Avoid release to the environment'],
      description: 'Key Haber–Bosch nitrogen feedstock for urea, nitric acid, and industrial refrigeration (R-717).',
      synonyms: ['Anhydrous ammonia', 'Azane', 'R-717'],
    }),
  },
  acetone: {
    cid: 180,
    profile: makeProfile({
      name: 'Acetone', formula: 'C3H6O', casNumber: '67-64-1', molecularWeight: 58.08,
      density: '0.784 g/cm³ (25 °C)', boilingPoint: 56.05, meltingPoint: -94.7, flashPoint: -20,
      viscosity: '0.306 mPa·s (25 °C)', vaporPressure: '24.6 kPa (20 °C)', solubility: 'Miscible with water',
      logP: -0.24, pH: '7.0', iupacName: 'propan-2-one', hazardType: 'Flammable, Irritant', ghsSignalWord: 'Danger',
      hStatements: ['H225: Highly flammable liquid and vapor', 'H319: Causes serious eye irritation', 'H336: May cause drowsiness'],
      pStatements: ['P210: Keep away from ignition sources', 'P305+P351+P338: Rinse eyes cautiously with water'],
      description: 'Volatile polar aprotic solvent produced via the cumene process.',
      synonyms: ['Propanone', 'Dimethyl ketone'],
    }),
  },
  benzene: {
    cid: 241,
    profile: makeProfile({
      name: 'Benzene', formula: 'C6H6', casNumber: '71-43-2', molecularWeight: 78.114,
      density: '0.876 g/cm³ (20 °C)', boilingPoint: 80.1, meltingPoint: 5.53, flashPoint: -11,
      viscosity: '0.604 mPa·s (25 °C)', vaporPressure: '10.0 kPa (20 °C)', solubility: '1.79 g/L (25 °C)',
      logP: 2.13, pH: 'N/A', iupacName: 'benzene', hazardType: 'Flammable, Carcinogenic, Toxic', ghsSignalWord: 'Danger',
      hStatements: ['H225: Highly flammable liquid and vapor', 'H350: May cause cancer', 'H340: May cause genetic defects'],
      pStatements: ['P201: Obtain special instructions before use', 'P210: Keep away from heat/sparks'],
      description: 'Fundamental aromatic petrochemical precursor for ethylbenzene, cumene, and cyclohexane.',
      synonyms: ['Benzol', 'Cyclohexa-1,3,5-triene'],
    }),
  },
  methanol: {
    cid: 887,
    profile: makeProfile({
      name: 'Methanol', formula: 'CH3OH', casNumber: '67-56-1', molecularWeight: 32.042,
      density: '0.792 g/cm³ (20 °C)', boilingPoint: 64.7, meltingPoint: -97.6, flashPoint: 11,
      viscosity: '0.544 mPa·s (25 °C)', vaporPressure: '13.0 kPa (20 °C)', solubility: 'Miscible with water',
      logP: -0.77, pH: '7.0', iupacName: 'methanol', hazardType: 'Flammable, Toxic', ghsSignalWord: 'Danger',
      hStatements: ['H225: Highly flammable liquid and vapor', 'H301+H311+H331: Toxic if swallowed, in contact with skin, or inhaled', 'H370: Causes damage to organs'],
      pStatements: ['P210: Keep away from ignition sources', 'P280: Wear protective gloves and eye protection'],
      description: 'Syngas-derived C1 building block for formaldehyde, acetic acid, and MTBE/biodiesel.',
      synonyms: ['Methyl alcohol', 'Wood spirit', 'MeOH'],
    }),
  },
  'sodium hydroxide': {
    cid: 14798,
    profile: makeProfile({
      name: 'Sodium Hydroxide', formula: 'NaOH', casNumber: '1310-73-2', molecularWeight: 39.997,
      density: '2.13 g/cm³ (solid)', boilingPoint: 1388, meltingPoint: 323, flashPoint: 'Non-flammable',
      viscosity: '4.0 mPa·s (50% aq, 60 °C)', vaporPressure: 'Negligible', solubility: '1110 g/L (20 °C)',
      logP: null, pH: '14.0 (1 N)', iupacName: 'sodium hydroxide', hazardType: 'Corrosive', ghsSignalWord: 'Danger',
      hStatements: ['H314: Causes severe skin burns and eye damage', 'H290: May be corrosive to metals'],
      pStatements: ['P280: Wear protective gloves/clothing/eye protection'],
      description: 'Chlor-alkali strong base used in pulp/paper, acid gas scrubbing, saponification, and alumina refining.',
      synonyms: ['Caustic soda', 'Lye'],
    }),
  },
  'hydrochloric acid': {
    cid: 313,
    profile: makeProfile({
      name: 'Hydrochloric Acid', formula: 'HCl', casNumber: '7647-01-0', molecularWeight: 36.461,
      density: '1.18 g/cm³ (37% aq)', boilingPoint: '48 °C (37% aq); −85.1 °C (anhydrous gas)', meltingPoint: '−27 °C (37% aq); −114.2 °C (anhydrous)', flashPoint: 'Non-flammable',
      viscosity: '1.9 mPa·s (37% aq)', vaporPressure: '19 kPa (37% aq, 20 °C)', solubility: 'Miscible with water',
      logP: 0.25, pH: '0.1 (1 N aq)', iupacName: 'chlorane', hazardType: 'Corrosive, Toxic', ghsSignalWord: 'Danger',
      hStatements: ['H314: Causes severe skin burns and eye damage', 'H335: May cause respiratory irritation'],
      pStatements: ['P260: Do not breathe mist/vapors', 'P280: Wear PPE'],
      description: 'Strong mineral acid (aqueous solution of HCl gas) used for steel pickling, pH control, oil-well acidizing, and PVC precursor synthesis.',
      synonyms: ['Muriatic acid', 'Hydrogen chloride solution'],
    }),
  },
  toluene: {
    cid: 1140,
    profile: makeProfile({
      name: 'Toluene', formula: 'C7H8', casNumber: '108-88-3', molecularWeight: 92.141,
      density: '0.867 g/cm³ (20 °C)', boilingPoint: 110.6, meltingPoint: -95.0, flashPoint: 4,
      viscosity: '0.560 mPa·s (25 °C)', vaporPressure: '2.9 kPa (20 °C)', solubility: '0.52 g/L (20 °C)',
      logP: 2.73, pH: 'N/A', iupacName: 'methylbenzene', hazardType: 'Flammable, Toxic, Irritant', ghsSignalWord: 'Danger',
      hStatements: ['H225: Highly flammable liquid and vapor', 'H304: May be fatal if swallowed and enters airways'],
      pStatements: ['P210: Keep away from heat/sparks', 'P271: Use only outdoors or in well-ventilated area'],
      description: 'Aromatic solvent and octane booster produced in catalytic reforming.',
      synonyms: ['Methylbenzene', 'Toluol'],
    }),
  },
  glycerol: {
    cid: 753,
    profile: makeProfile({
      name: 'Glycerol', formula: 'C3H8O3', casNumber: '56-81-5', molecularWeight: 92.094,
      density: '1.261 g/cm³ (20 °C)', boilingPoint: 290, meltingPoint: 17.8, flashPoint: 177,
      viscosity: '934 mPa·s (25 °C)', vaporPressure: '<0.001 kPa (20 °C)', solubility: 'Miscible with water',
      logP: -1.76, pH: '7.0', iupacName: 'propane-1,2,3-triol', hazardType: 'Non-Hazardous',
      description: 'Viscous polyol coproduct of biodiesel transesterification; used in pharmaceuticals and polymers.',
      synonyms: ['Glycerin', 'Propane-1,2,3-triol'],
    }),
  },
  'acetic acid': {
    cid: 176,
    profile: makeProfile({
      name: 'Acetic Acid', formula: 'CH3COOH', casNumber: '64-19-7', molecularWeight: 60.052,
      density: '1.049 g/cm³ (20 °C)', boilingPoint: 117.9, meltingPoint: 16.6, flashPoint: 39,
      viscosity: '1.155 mPa·s (25 °C)', vaporPressure: '1.57 kPa (20 °C)', solubility: 'Miscible with water',
      logP: -0.17, pH: '2.4 (1 M)', iupacName: 'acetic acid', hazardType: 'Corrosive, Flammable', ghsSignalWord: 'Danger',
      hStatements: ['H226: Flammable liquid and vapor', 'H314: Causes severe skin burns and eye damage'],
      pStatements: ['P280: Wear protective gloves/eye protection'],
      description: 'Produced via methanol carbonylation (Monsanto/Cativa); feedstock for vinyl acetate and PTA solvent.',
      synonyms: ['Ethanoic acid', 'Glacial acetic acid'],
    }),
  },
  'hydrogen peroxide': {
    cid: 784,
    profile: makeProfile({
      name: 'Hydrogen Peroxide', formula: 'H2O2', casNumber: '7722-84-1', molecularWeight: 34.015,
      density: '1.11 g/cm³ (30% aq)', boilingPoint: '108 °C (30% aq); 150.2 °C (anhydrous)', meltingPoint: '−26 °C (30% aq); −0.4 °C (anhydrous)', flashPoint: 'Non-flammable (Strong Oxidizer)',
      viscosity: '1.245 mPa·s (20 °C)', vaporPressure: '2.4 kPa (30% aq, 25 °C)', solubility: 'Miscible with water',
      logP: -1.57, pH: '3.5–4.5 (30% aq)', iupacName: 'hydrogen peroxide', hazardType: 'Oxidizer, Corrosive, Toxic', ghsSignalWord: 'Danger',
      hStatements: ['H271: May cause fire or explosion; strong oxidizer', 'H314: Causes severe skin burns'],
      pStatements: ['P220: Keep away from combustibles', 'P280: Wear PPE'],
      description: 'Green industrial oxidizer produced via anthraquinone auto-oxidation for bleaching and epoxidation.',
      synonyms: ['Peroxide', 'Dioxidane'],
    }),
  },
  formaldehyde: {
    cid: 712,
    profile: makeProfile({
      name: 'Formaldehyde', formula: 'CH2O', casNumber: '50-00-0', molecularWeight: 30.026,
      density: '1.08 g/cm³ (37% formalin)', boilingPoint: '−19 °C (pure gas); ~96 °C (37% formalin)', meltingPoint: '−92 °C (anhydrous)', flashPoint: '60 °C (37% formalin, MeOH-stabilized)',
      viscosity: '2.0 mPa·s (37% formalin)', vaporPressure: '437 kPa (pure gas, 20 °C)', solubility: '400 g/L (20 °C)',
      logP: 0.35, pH: '3.5–4.5 (37% formalin)', iupacName: 'methanal', hazardType: 'Toxic, Carcinogenic, Corrosive', ghsSignalWord: 'Danger',
      hStatements: ['H301+H311+H331: Toxic if swallowed, skin contact, or inhaled', 'H350: May cause cancer'],
      pStatements: ['P201: Obtain special instructions', 'P260: Do not breathe vapors'],
      description: 'Key thermoset resin precursor (UF, PF, MF resins) produced by catalytic methanol oxidation; handled commercially as 37% aqueous formalin.',
      synonyms: ['Methanal', 'Formalin'],
    }),
  },
  phenol: {
    cid: 996,
    profile: makeProfile({
      name: 'Phenol', formula: 'C6H5OH', casNumber: '108-95-2', molecularWeight: 94.113,
      density: '1.07 g/cm³ (solid, 20 °C)', boilingPoint: 181.7, meltingPoint: 40.5, flashPoint: 79,
      viscosity: '3.44 mPa·s (molten, 50 °C)', vaporPressure: '0.047 kPa (20 °C)', solubility: '83 g/L (20 °C)',
      logP: 1.46, pH: '6.0 (weakly acidic aq, pKa 9.95)', iupacName: 'phenol', hazardType: 'Toxic, Corrosive', ghsSignalWord: 'Danger',
      hStatements: ['H301+H311+H331: Toxic if swallowed, in contact with skin, or inhaled', 'H314: Causes severe skin burns'],
      pStatements: ['P280: Wear protective gloves/clothing/eye protection'],
      description: 'Crystalline aromatic hydroxy compound (solid at room temperature, mp 40.5 °C) produced with acetone via cumene hydroperoxide cleavage; used for bisphenol-A and nylon.',
      synonyms: ['Carbolic acid', 'Hydroxybenzene'],
    }),
  },
};

function PropCard({ label, value, icon: Icon, color = '#6366f1' }: { label: string; value: string | number | null | undefined; icon: ComponentType<{ className?: string; style?: CSSProperties }>; color?: string }) {
  const display = value === null || value === undefined || value === '' ? '—' : String(value);
  return (
    <div className="relative overflow-hidden p-5 rounded-[20px] border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50 hover:scale-[1.02] transition-all group">
      <div className="absolute top-0 right-0 w-20 h-20 blur-[30px] opacity-10 pointer-events-none -mr-10 -mt-10" style={{ backgroundColor: color }}></div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-[10px] font-black uppercase tracking-widest text-surface-400">{label}</span>
      </div>
      <p className="text-sm font-bold text-surface-900 dark:text-surface-50 leading-relaxed">{display}</p>
    </div>
  );
}

function HazardBadge({ type }: { type: string }) {
  const colorMap: Record<string, string> = {
    'Flammable': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'Oxidizer': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    'Toxic': 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
    'Corrosive': 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400',
    'Irritant': 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400',
    'Carcinogenic': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    'Non-Hazardous': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  };
  return (
    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${colorMap[type] || 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400'}`}>
      {type}
    </span>
  );
}

export default function SubstanceProfileModule() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<SubstanceProfile | null>(null);
  const [cid, setCid] = useState<number | null>(null);

  const searchSubstance = async (name?: string) => {
    const searchName = (name || query).trim();
    if (!searchName) return;
    setLoading(true);
    setError(null);
    setProfile(null);
    setCid(null);

    // 1. Check verified local engineering handbook database first (exact, then substring match)
    const localKey = searchName.toLowerCase();
    const localEntries = Object.values(LOCAL_PROFILES);
    const localMatch =
      LOCAL_PROFILES[localKey] ||
      localEntries.find(
        entry =>
          entry.profile.formula.toLowerCase() === localKey ||
          entry.profile.casNumber === searchName ||
          entry.profile.synonyms.some(s => s.toLowerCase() === localKey)
      ) ||
      (localKey.length >= 3
        ? localEntries.find(
            entry =>
              entry.profile.name.toLowerCase().includes(localKey) ||
              entry.profile.iupacName.toLowerCase().includes(localKey) ||
              entry.profile.synonyms.some(s => s.toLowerCase().includes(localKey))
          )
        : undefined);
    if (localMatch) {
      setProfile(localMatch.profile);
      setCid(localMatch.cid);
      setLoading(false);
      return;
    }

    // 2. Otherwise query PubChem directly (with optional backend enrichment)
    try {
      const direct = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(searchName)}/property/MolecularFormula,MolecularWeight,IUPACName,XLogP,Title/JSON`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!direct.ok) throw new Error(`Compound '${searchName}' not found on PubChem.`);
      const j = await direct.json();
      const p = j?.PropertyTable?.Properties?.[0];
      if (!p) throw new Error(`No properties returned for '${searchName}'.`);
      setCid(p.CID || null);
      setProfile(makeProfile({
        name: p.Title || searchName,
        formula: p.MolecularFormula || '',
        casNumber: '',
        molecularWeight: p.MolecularWeight ?? 0,
        iupacName: p.IUPACName || '',
        logP: p.XLogP ?? null,
        description: `PubChem verified record (CID ${p.CID}).`,
      }));
    } catch (err2: unknown) {
      setError(err2 instanceof Error ? err2.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-extrabold text-surface-900 dark:text-surface-50 mb-1">Substance Profile Engine</h1>
        <p className="text-surface-500 text-xs">Verified engineering datasheets &amp; live PubChem chemical lookup.</p>
      </div>

      {/* Search Bar */}
      <CalcCard title="Chemical Search" icon={Search}>
        <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="Search any chemical (e.g., Ethanol, Sulfuric Acid, H2O...)"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => !e.nativeEvent.isComposing && e.key === 'Enter' && searchSubstance()}
              className="w-full pl-12 pr-6 py-4 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50 text-surface-900 dark:text-surface-50 font-bold outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
            />
          </div>
          <button
            onClick={() => searchSubstance()}
            disabled={loading || !query.trim()}
            className="px-8 py-4 rounded-2xl bg-primary-600 text-surface-50 font-bold text-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-600/20 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Quick access */}
        <div className="flex flex-wrap gap-2">
          {QUICK_CHEMICALS.map(c => (
            <button key={c} onClick={() => { setQuery(c); searchSubstance(c); }}
              className="px-3 py-1.5 rounded-xl bg-surface-100 dark:bg-surface-800 text-xs font-bold text-surface-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all">
              {c}
            </button>
          ))}
        </div>
      </CalcCard>

      {/* Error */}
      {error && (
        <div className="glass p-6 rounded-3xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-900/10 mb-8 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          <span className="text-sm font-bold text-rose-600">{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-primary-600 animate-spin mx-auto mb-4" />
            <p className="text-sm font-bold text-surface-400">Fetching data from PubChem...</p>
          </div>
        </div>
      )}

      {/* Profile Results */}
      {profile && !loading && (
        <div className="space-y-6">
          {/* Header */}
          <div className="glass p-8 rounded-[32px] border border-surface-200 dark:border-surface-800">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-black text-surface-900 dark:text-surface-50 mb-1">{profile.name}</h2>
                <div className="flex items-center gap-3 flex-wrap">
                  {profile.formula && <span className="text-lg font-mono font-bold text-primary-600">{profile.formula}</span>}
                  {profile.casNumber && <span className="px-3 py-1 rounded-lg bg-surface-100 dark:bg-surface-800 text-xs font-bold text-surface-500">CAS: {profile.casNumber}</span>}
                  {profile.molecularWeight != null && <span className="px-3 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-xs font-bold text-primary-600">MW: {profile.molecularWeight} g/mol</span>}
                </div>
              </div>
              {cid && (
                <a href={`https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 text-xs font-bold hover:bg-primary-100 transition-all no-underline">
                  <ExternalLink className="w-4 h-4" /> PubChem CID: {cid}
                </a>
              )}
            </div>
            {profile.description && <p className="text-sm text-surface-500 leading-relaxed">{profile.description}</p>}
            {profile.iupacName && <p className="text-xs font-mono text-surface-400 mt-3">IUPAC: {profile.iupacName}</p>}
          </div>

          {/* Hazard Banner */}
          {profile.hazardType && profile.hazardType !== 'Review SDS' && (
            <div className="glass p-6 rounded-3xl border border-accent-200 dark:border-accent-900/50 bg-accent-50/50 dark:bg-accent-900/10">
              <div className="flex items-center gap-3 mb-3">
                <ShieldAlert className="w-5 h-5 text-accent-500" />
                <span className="text-xs font-black uppercase tracking-widest text-accent-600">Safety Classification</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.hazardType.split(', ').map(t => <HazardBadge key={t} type={t} />)}
              </div>
              {profile.ghsSignalWord && (
                <p className="text-sm font-bold mt-3 text-accent-700 dark:text-accent-400">Signal: {profile.ghsSignalWord}</p>
              )}
            </div>
          )}

          {/* Property Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <PropCard label="Density" value={profile.density} icon={Droplets} color="#3b82f6" />
            <PropCard label="Boiling Point" value={typeof profile.boilingPoint === 'number' ? `${profile.boilingPoint} °C` : profile.boilingPoint} icon={Thermometer} color="#ef4444" />
            <PropCard label="Melting Point" value={typeof profile.meltingPoint === 'number' ? `${profile.meltingPoint} °C` : profile.meltingPoint} icon={Thermometer} color="#6366f1" />
            <PropCard label="Flash Point" value={typeof profile.flashPoint === 'number' ? `${profile.flashPoint} °C` : profile.flashPoint} icon={Zap} color="#f59e0b" />
            <PropCard label="Viscosity" value={profile.viscosity} icon={Droplets} color="#14b8a6" />
            <PropCard label="Vapor Pressure" value={profile.vaporPressure} icon={Activity} color="#8b5cf6" />
            <PropCard label="Solubility" value={profile.solubility} icon={Beaker} color="#10b981" />
            <PropCard label="LogP" value={profile.logP} icon={Activity} color="#ec4899" />
            <PropCard label="pH" value={profile.pH} icon={Beaker} color="#06b6d4" />
          </div>

          {/* H-Statements */}
          {profile.hStatements.length > 0 && (
            <CalcCard title="Hazard Statements" icon={AlertTriangle}>
              <div className="space-y-2">
                {profile.hStatements.slice(0, 8).map((h, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30">
                    <Info className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-bold text-surface-600 dark:text-surface-300">{h}</span>
                  </div>
                ))}
              </div>
            </CalcCard>
          )}

          {/* Precautionary Statements */}
          {profile.pStatements.length > 0 && (
            <CalcCard title="Precautionary Statements" icon={ShieldAlert}>
              <div className="space-y-2">
                {profile.pStatements.slice(0, 8).map((p, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30">
                    <Info className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-bold text-surface-600 dark:text-surface-300">{p}</span>
                  </div>
                ))}
              </div>
            </CalcCard>
          )}

          {/* Synonyms */}
          {profile.synonyms.length > 0 && (
            <div className="glass p-6 rounded-3xl border border-surface-200 dark:border-surface-800">
              <span className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3 block">Known Synonyms</span>
              <div className="flex flex-wrap gap-2">
                {profile.synonyms.map((s, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 text-xs font-bold text-surface-500">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
