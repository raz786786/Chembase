import { useState } from 'react';
import { 
  Search, 
  FileText, 
  AlertTriangle, 
  Beaker, 
  Thermometer, 
  Droplets,
  Factory,
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

function PropCard({ label, value, icon: Icon, color = '#6366f1' }: { label: string; value: string | number | null | undefined; icon: any; color?: string }) {
  const display = value === null || value === undefined || value === '' ? '—' : String(value);
  return (
    <div className="relative overflow-hidden p-5 rounded-[20px] border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:scale-[1.02] transition-all group">
      <div className="absolute top-0 right-0 w-20 h-20 blur-[30px] opacity-10 pointer-events-none -mr-10 -mt-10" style={{ backgroundColor: color }}></div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      </div>
      <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">{display}</p>
    </div>
  );
}

function HazardBadge({ type }: { type: string }) {
  const colorMap: Record<string, string> = {
    'Flammable': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'Toxic': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'Corrosive': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'Irritant': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'Carcinogenic': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  };
  return (
    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${colorMap[type] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
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
    const searchName = name || query.trim();
    if (!searchName) return;
    setLoading(true);
    setError(null);
    setProfile(null);
    setCid(null);
    try {
      const res = await fetch(`/api/pubchem/profile/${encodeURIComponent(searchName)}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setProfile(data.profile);
        setCid(data.cid);
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Substance Profile Engine</h1>
        <p className="text-slate-500 text-lg font-medium">Comprehensive chemical datasheets powered by PubChem — search any compound for full engineering data.</p>
      </div>

      {/* Search Bar */}
      <CalcCard title="Chemical Search" icon={Search}>
        <div className="flex gap-3 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search any chemical (e.g., Ethanol, Sulfuric Acid, H2O...)"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchSubstance()}
              className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all"
            />
          </div>
          <button
            onClick={() => searchSubstance()}
            disabled={loading || !query.trim()}
            className="px-8 py-4 rounded-2xl bg-cyan-600 text-white font-bold text-sm hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-600/20 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Quick access */}
        <div className="flex flex-wrap gap-2">
          {QUICK_CHEMICALS.map(c => (
            <button key={c} onClick={() => { setQuery(c); searchSubstance(c); }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all">
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
            <Loader2 className="w-10 h-10 text-cyan-600 animate-spin mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-400">Fetching data from PubChem...</p>
          </div>
        </div>
      )}

      {/* Profile Results */}
      {profile && !loading && (
        <div className="space-y-6">

          {/* Header */}
          <div className="glass p-8 rounded-[32px] border border-slate-200 dark:border-slate-800">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{profile.name}</h2>
                <div className="flex items-center gap-3 flex-wrap">
                  {profile.formula && <span className="text-lg font-mono font-bold text-cyan-600">{profile.formula}</span>}
                  {profile.casNumber && <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500">CAS: {profile.casNumber}</span>}
                  {profile.molecularWeight && <span className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-xs font-bold text-indigo-600">MW: {profile.molecularWeight} g/mol</span>}
                </div>
              </div>
              {cid && (
                <a href={`https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 text-xs font-bold hover:bg-cyan-100 transition-all no-underline">
                  <ExternalLink className="w-4 h-4" /> PubChem CID: {cid}
                </a>
              )}
            </div>
            {profile.description && <p className="text-sm text-slate-500 leading-relaxed">{profile.description}</p>}
            {profile.iupacName && <p className="text-xs font-mono text-slate-400 mt-3">IUPAC: {profile.iupacName}</p>}
          </div>

          {/* Hazard Banner */}
          {profile.hazardType && profile.hazardType !== 'Review SDS' && (
            <div className="glass p-6 rounded-3xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-900/10">
              <div className="flex items-center gap-3 mb-3">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-black uppercase tracking-widest text-amber-600">Safety Classification</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.hazardType.split(', ').map(t => <HazardBadge key={t} type={t} />)}
              </div>
              {profile.ghsSignalWord && (
                <p className="text-sm font-bold mt-3 text-amber-700 dark:text-amber-400">Signal: {profile.ghsSignalWord}</p>
              )}
            </div>
          )}

          {/* Property Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <PropCard label="Density" value={profile.density} icon={Droplets} color="#3b82f6" />
            <PropCard label="Boiling Point" value={profile.boilingPoint ? `${profile.boilingPoint} °C` : null} icon={Thermometer} color="#ef4444" />
            <PropCard label="Melting Point" value={profile.meltingPoint ? `${profile.meltingPoint} °C` : null} icon={Thermometer} color="#6366f1" />
            <PropCard label="Flash Point" value={profile.flashPoint ? `${profile.flashPoint} °C` : null} icon={Zap} color="#f59e0b" />
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
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{h}</span>
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
                  <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                    <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{p}</span>
                  </div>
                ))}
              </div>
            </CalcCard>
          )}

          {/* Synonyms */}
          {profile.synonyms.length > 0 && (
            <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Known Synonyms</span>
              <div className="flex flex-wrap gap-2">
                {profile.synonyms.map((s, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
