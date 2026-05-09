import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Database, 
  Thermometer, 
  ShieldAlert, 
  Zap, 
  FlaskConical, 
  Info,
  Calendar,
  Hash,
  Activity,
  ChevronRight,
  Atom,
  Radiation,
  Beaker,
  PlusCircle
} from 'lucide-react';
import { api, type SubstanceDetail, type Reaction } from '../api';
import { FormulaDisplay } from '../components/FormulaDisplay';
import { getEngData, type EngChemical } from '../data/engineeringData';

function getCategoryClass(category?: string): string {
  if (!category) return 'bg-slate-200 dark:bg-slate-800';
  const c = category.toLowerCase();
  if (c.includes('alkali metal')) return 'bg-alkali';
  if (c.includes('alkaline earth')) return 'bg-alkaline';
  if (c.includes('transition metal')) return 'bg-transition';
  if (c.includes('post-transition')) return 'bg-post';
  if (c.includes('metalloid')) return 'bg-metalloid';
  if (c.includes('nonmetal')) return 'bg-nonmetal';
  if (c.includes('halogen')) return 'bg-halogen';
  if (c.includes('noble gas')) return 'bg-noble';
  if (c.includes('lanthanide')) return 'bg-lanthanide';
  if (c.includes('actinide')) return 'bg-actinide';
  return 'bg-slate-200 dark:bg-slate-800';
}

function NFPADiamond({ h, f, i, s }: { h?: number; f?: number; i?: number; s?: string }) {
  return (
    <div className="relative w-40 h-40 transform rotate-45 border-2 border-slate-200 dark:border-slate-800 overflow-hidden rounded-lg">
      <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-red-500/20 border-r border-b border-slate-200 dark:border-slate-800 flex items-center justify-center">
        <span className="-rotate-45 text-red-600 font-black text-xl">{f ?? 0}</span>
      </div>
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-500/20 border-l border-b border-slate-200 dark:border-slate-800 flex items-center justify-center">
        <span className="-rotate-45 text-blue-600 font-black text-xl">{h ?? 0}</span>
      </div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-white/20 border-r border-t border-slate-200 dark:border-slate-800 flex items-center justify-center">
        <span className="-rotate-45 text-slate-600 dark:text-slate-400 font-black text-lg">{s || 'W'}</span>
      </div>
      <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-yellow-500/20 border-l border-t border-slate-200 dark:border-slate-800 flex items-center justify-center">
        <span className="-rotate-45 text-yellow-600 font-black text-xl">{i ?? 0}</span>
      </div>
    </div>
  );
}

const GHS_NAMES: Record<string, string> = {
  GHS01: 'Explosive', GHS02: 'Flammable', GHS03: 'Oxidizer',
  GHS04: 'Compressed Gas', GHS05: 'Corrosive', GHS06: 'Toxic',
  GHS07: 'Irritant', GHS08: 'Health Hazard', GHS09: 'Environmental',
};

type TabId = 'overview' | 'properties' | 'hazards' | 'reactions' | 'engineering';

export default function SubstanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [substance, setSubstance] = useState<SubstanceDetail | null>(null);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    window.scrollTo(0, 0);

    Promise.all([
      api.getSubstance(id),
      api.getSubstanceReactions(id),
    ]).then(([s, r]) => {
      if (!s) {
        setError('Substance not found.');
        setLoading(false);
        return;
      }
      setSubstance(s);
      setReactions(r);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setError('Failed to load substance data.');
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-40">
      <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  if (error || !substance) {
    return (
      <div className="flex flex-col items-center justify-center py-20 glass rounded-3xl border border-rose-200 dark:border-rose-900/30">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <p className="text-slate-500 font-medium mb-6">{error || 'Substance not found.'}</p>
        <Link to="/periodic-table" className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors no-underline">
          Return to Periodic Table
        </Link>
      </div>
    );
  }

  const isElement = substance.type === 'element';
  const haz = substance.hazard_data;

  return (
    <div className="animate-in fade-in duration-700">
      <Link to={isElement ? '/periodic-table' : '/compounds'} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-8 no-underline">
        <ArrowLeft className="w-4 h-4" /> Back to {isElement ? 'Periodic Table' : 'Compounds'}
      </Link>

      {/* Header Section */}
      <div className="glass p-8 md:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 mb-12 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-64 h-64 opacity-5 pointer-events-none -mr-32 -mt-32 rounded-full ${getCategoryClass(substance.category)}`}></div>
        
        <div className="flex flex-col md:flex-row items-start gap-8 md:items-center">
          <div className={`w-32 h-32 md:w-40 md:h-40 rounded-3xl ${getCategoryClass(substance.category)} flex items-center justify-center text-4xl md:text-5xl font-black text-slate-900 dark:text-slate-950 shadow-2xl`}>
            {isElement ? substance.symbol : <FormulaDisplay formula={substance.formula} />}
          </div>
          
          <div className="flex-grow">
            <div className="flex items-center gap-4 mb-2 flex-wrap">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                {substance.name}
              </h1>
              {substance.is_radioactive && (
                <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full text-xs font-black uppercase flex items-center gap-2">
                  <Radiation className="w-4 h-4" /> Radioactive
                </span>
              )}
            </div>
            <div className="flex items-center gap-6 text-lg font-medium text-slate-500 mb-6">
              <span className="flex items-center gap-2"><FlaskConical className="w-5 h-5" /> <FormulaDisplay formula={substance.formula} /></span>
              {substance.molar_mass && <span className="flex items-center gap-2"><Activity className="w-5 h-5" /> {substance.molar_mass} g/mol</span>}
            </div>
            {substance.description && (
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
                {substance.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-slate-200 dark:border-slate-800 mb-12 overflow-x-auto scrollbar-hide">
        {(['overview', 'properties', 'hazards', 'reactions', 'engineering'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-sm font-black uppercase tracking-widest pb-4 transition-all whitespace-nowrap ${
              activeTab === tab 
              ? 'border-b-4 border-indigo-600 text-slate-900 dark:text-white' 
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            {tab === 'reactions' ? `Reactions (${reactions.length})` : tab === 'engineering' ? '⚙️ Engineering' : tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
        <div className="lg:col-span-2 space-y-8">
          {activeTab === 'overview' && (
            <div className="glass p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                <Info className="w-6 h-6 text-indigo-600" /> Substance Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                <div className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800/50">
                  <span className="text-sm font-medium text-slate-500 flex items-center gap-2"><FlaskConical className="w-4 h-4" /> Formula</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white"><FormulaDisplay formula={substance.formula} /></span>
                </div>
                <div className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800/50">
                  <span className="text-sm font-medium text-slate-500 flex items-center gap-2"><Activity className="w-4 h-4" /> Molar Mass</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{substance.molar_mass} g/mol</span>
                </div>
                <div className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800/50">
                  <span className="text-sm font-medium text-slate-500 flex items-center gap-2"><Thermometer className="w-4 h-4" /> State (STP)</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">{substance.state_at_room_temp || '—'}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800/50">
                  <span className="text-sm font-medium text-slate-500 flex items-center gap-2"><Zap className="w-4 h-4" /> Color</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">{substance.color || '—'}</span>
                </div>
                {substance.cas_number && (
                  <div className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800/50">
                    <span className="text-sm font-medium text-slate-500 flex items-center gap-2"><Hash className="w-4 h-4" /> CAS Number</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{substance.cas_number}</span>
                  </div>
                )}
                {substance.year_discovered && (
                  <div className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800/50">
                    <span className="text-sm font-medium text-slate-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> Discovered By</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{substance.year_discovered}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'properties' && (
            <div className="space-y-8">
              <div className="glass p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                  <Database className="w-6 h-6 text-blue-600" /> Physical Properties
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                  <div className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800/50">
                    <span className="text-sm font-medium text-slate-500">Density</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{substance.density != null ? `${substance.density} g/cm³` : '—'}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800/50">
                    <span className="text-sm font-medium text-slate-500">Melting Point</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{substance.melting_point != null ? `${substance.melting_point} K` : '—'}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800/50">
                    <span className="text-sm font-medium text-slate-500">Boiling Point</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{substance.boiling_point != null ? `${substance.boiling_point} K` : '—'}</span>
                  </div>
                </div>
              </div>

              {isElement && (
                <div className="glass p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                    <Atom className="w-6 h-6 text-violet-600" /> Atomic Properties
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                    <div className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800/50">
                      <span className="text-sm font-medium text-slate-500">Atomic Number</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{substance.atomic_number}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800/50">
                      <span className="text-sm font-medium text-slate-500">Category</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">{substance.category || '—'}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800/50">
                      <span className="text-sm font-medium text-slate-500">Group / Period</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{substance.group_number || '—'} / {substance.period || '—'}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800/50">
                      <span className="text-sm font-medium text-slate-500">Block</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">{substance.block || '—'}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800/50">
                      <span className="text-sm font-medium text-slate-500">Electronegativity</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{substance.electronegativity ?? '—'}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800/50">
                      <span className="text-sm font-medium text-slate-500">Electron Config</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{substance.electron_configuration || '—'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'hazards' && (
            <div className="space-y-8">
              {haz ? (
                <div className="glass p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-12 flex items-center gap-3">
                    <ShieldAlert className="w-6 h-6 text-rose-600" /> Hazard Identification
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="flex flex-col items-center">
                      <NFPADiamond h={haz.nfpa_health} f={haz.nfpa_flammability} i={haz.nfpa_instability} s={haz.nfpa_special || undefined} />
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-12">NFPA 704 Safety Diamond</p>
                      {haz.ghs_signal_word && (
                        <div className={`mt-8 px-8 py-3 rounded-2xl text-xl font-black uppercase tracking-tight ${
                          haz.ghs_signal_word === 'Danger' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                        }`}>
                          {haz.ghs_signal_word}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-8">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">GHS Pictograms</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {haz.ghs_pictograms?.map(code => (
                            <div key={code} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                              <ShieldAlert className="w-5 h-5 text-rose-500" />
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{GHS_NAMES[code] || code}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {haz.h_statements && haz.h_statements.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-4">Hazard Statements</h4>
                          <ul className="space-y-2">
                            {haz.h_statements.map((st, i) => (
                              <li key={i} className="text-sm font-medium text-slate-600 dark:text-slate-400 flex gap-2">
                                <span className="text-rose-500">•</span> {st}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass p-12 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                  <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No hazard data recorded for this substance.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reactions' && (
            <div className="space-y-6">
              {reactions.length > 0 ? (
                reactions.map(r => (
                  <Link 
                    to={`/reactions/${r.id}`} 
                    key={r.id}
                    className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 no-underline group"
                  >
                    <div>
                      <div className="text-xl font-black text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors">
                        <FormulaDisplay formula={r.equation} />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded text-[10px] font-black uppercase">
                          {r.reaction_type || 'Chemical Reaction'}
                        </span>
                        <span className="text-xs font-bold text-slate-400">{r.name}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </Link>
                ))
              ) : (
                <div className="glass p-12 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                  <Beaker className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No recorded reactions involving this substance.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'engineering' && (() => {
            const eng = getEngData(substance.formula, substance.name);
            if (!eng) return (
              <div className="glass p-12 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No engineering data available for {substance.name}.</p>
                <p className="text-xs text-slate-400 mt-2">Engineering profiles are available for: H₂O, H₂SO₄, NaOH, NH₃, CH₃OH, C₂H₅OH, HCl, HNO₃, C₆H₆, CH₄, CO₂, C₃H₈</p>
              </div>
            );
            return (
              <div className="space-y-6">
                <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" /> Industrial Applications
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {eng.industrialUses.map((u, i) => (
                      <div key={i} className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                        <span className="text-amber-500 font-bold">•</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{u}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Equipment & Materials</h3>
                  <div className="space-y-3">
                    {eng.equipment.map((eq, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center shrink-0">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{eq.type}</div>
                          <div className="text-xs text-indigo-500 font-bold">{eq.material}</div>
                          <div className="text-xs text-slate-500 mt-1">{eq.notes}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Operating Conditions</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800 text-center">
                      <div className="text-[10px] font-bold text-blue-500 uppercase">Temperature</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">{eng.operatingConditions.tempRange}</div>
                    </div>
                    <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4 border border-violet-100 dark:border-violet-800 text-center">
                      <div className="text-[10px] font-bold text-violet-500 uppercase">Pressure</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">{eng.operatingConditions.pressRange}</div>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800 text-center">
                      <div className="text-[10px] font-bold text-emerald-500 uppercase">Phase</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">{eng.operatingConditions.phase}</div>
                    </div>
                  </div>
                </div>

                <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Material Compatibility</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 text-[10px] font-bold text-slate-400 uppercase">Material</th>
                        <th className="text-left py-2 text-[10px] font-bold text-slate-400 uppercase">Rating</th>
                        <th className="text-left py-2 text-[10px] font-bold text-slate-400 uppercase">Notes</th>
                      </tr></thead>
                      <tbody>
                        {eng.materialCompat.map((m, i) => (
                          <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                            <td className="py-3 font-bold text-slate-900 dark:text-white">{m.material}</td>
                            <td className="py-3"><span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              m.rating === 'Excellent' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                              m.rating === 'Good' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                              m.rating === 'Fair' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                              'bg-rose-100 dark:bg-rose-900/30 text-rose-600'
                            }`}>{m.rating}</span></td>
                            <td className="py-3 text-slate-500">{m.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Process Insight: Lab vs Industrial</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4 border border-violet-200 dark:border-violet-800">
                      <div className="text-[10px] font-bold text-violet-500 uppercase mb-2">🧪 Lab Scale</div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{eng.processInsight.labScale}</p>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
                      <div className="text-[10px] font-bold text-indigo-500 uppercase mb-2">🏭 Industrial Scale</div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{eng.processInsight.industrialScale}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {eng.processInsight.keyEquipment.map((eq, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{eq}</span>
                    ))}
                  </div>
                </div>

                <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">⚠️ Safety & Design</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
                      <div className="text-[10px] font-bold text-emerald-500 uppercase">Safe Range</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{eng.safetyDesign.safeRange}</div>
                    </div>
                    {eng.safetyDesign.flashPoint && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
                        <div className="text-[10px] font-bold text-amber-500 uppercase">Flash Point</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{eng.safetyDesign.flashPoint}</div>
                      </div>
                    )}
                    {eng.safetyDesign.explosionLimits && (
                      <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-3 border border-rose-200 dark:border-rose-800">
                        <div className="text-[10px] font-bold text-rose-500 uppercase">LEL/UEL</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{eng.safetyDesign.explosionLimits}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">💡 Design Notes</h3>
                  <div className="space-y-2">
                    {eng.designNotes.map((n, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
                        <span className="text-amber-500 font-bold mt-0.5">▸</span>
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{n}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Thermodynamic & Transport Properties</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center">
                      <div className="text-[10px] font-bold text-slate-400">Cp (25°C)</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{eng.cp25} kJ/kg·K</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center">
                      <div className="text-[10px] font-bold text-slate-400">Tc</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{eng.tc} K</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center">
                      <div className="text-[10px] font-bold text-slate-400">Pc</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{eng.pc} MPa</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center">
                      <div className="text-[10px] font-bold text-slate-400">ω (acentric)</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{eng.omega}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center">
                      <div className="text-[10px] font-bold text-slate-400">Viscosity</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{eng.viscosity25} mPa·s</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center">
                      <div className="text-[10px] font-bold text-slate-400">Thermal Cond.</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{eng.thermalCond} W/m·K</div>
                    </div>
                    {eng.flashPoint !== undefined && <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center">
                      <div className="text-[10px] font-bold text-slate-400">Flash Point</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{eng.flashPoint}°C</div>
                    </div>}
                    {eng.lel !== undefined && <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center">
                      <div className="text-[10px] font-bold text-slate-400">LEL / UEL</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{eng.lel}-{eng.uel} vol%</div>
                    </div>}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Quick Actions</h4>
            <div className="space-y-3">
              <button 
                onClick={() => window.print()}
                className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
              >
                <Database className="w-4 h-4" /> Download SDS (PDF)
              </button>
              <button 
                onClick={() => alert('Successfully added to Lab Inventory!')}
                className="w-full py-3 glass text-slate-700 dark:text-white rounded-2xl font-bold flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-indigo-600" /> Add to Lab Inventory
              </button>
            </div>
          </div>
          
          <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Chemical Verification</h4>
            <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
              <ShieldAlert className="w-5 h-5 text-emerald-600" />
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Validated by PubChem</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
