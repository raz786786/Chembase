import { useState, useEffect } from 'react';
import { api, type SubstanceSummary, type Reaction, type SubstanceDetail } from '../api';
import { FormulaDisplay } from '../components/FormulaDisplay';
import { Link } from 'react-router-dom';

const DIATOMIC_ELEMENT_MAP: Record<string, string> = {
  h2: 'h',
  o2: 'o',
  n2: 'n',
  cl2: 'cl',
  f2: 'f',
  br2: 'br',
  i2: 'i',
};

export default function ReactionPredictorPage() {
  const [substances, setSubstances] = useState<SubstanceSummary[]>([]);
  const [bulkInput, setBulkInput] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Reaction[] | null>(null);
  const [unmatched, setUnmatched] = useState<string[]>([]);
  const [matched, setMatched] = useState<SubstanceSummary[]>([]);
  const [productDetails, setProductDetails] = useState<Record<string, SubstanceDetail>>({});

  useEffect(() => {
    // Load all substances so we can map pasted text strictly to known objects
    Promise.all([api.getElements(), api.getCompounds()])
      .then(([els, comps]) => {
        setSubstances([...els, ...comps].sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch(console.error);
  }, []);

  const handlePredict = async () => {
    if (!bulkInput.trim()) return;
    setLoading(true);
    setResults(null);
    setUnmatched([]);
    setMatched([]);
    setProductDetails({});
    
    try {
      // Parse by commas, plus signs, or newlines
      const parts = bulkInput.split(/[+,\n]+/).map(p => p.trim()).filter(Boolean);
      
      const localMatched: SubstanceSummary[] = [];
      const localUnmatched: string[] = [];

      for (const p of parts) {
        const lower = p.toLowerCase();
        let found = substances.find(s => 
          s.name.toLowerCase() === lower || 
          s.formula.toLowerCase() === lower ||
          s.symbol?.toLowerCase() === lower
        );
        // Support diatomic element formulas (H2, O2, N2, Cl2, F2, Br2, I2) when not stored as separate compounds
        if (!found && DIATOMIC_ELEMENT_MAP[lower]) {
          const baseSymbol = DIATOMIC_ELEMENT_MAP[lower];
          found = substances.find(s =>
            s.symbol?.toLowerCase() === baseSymbol ||
            s.formula.toLowerCase() === baseSymbol
          );
        }
        if (found) {
          if (!localMatched.some(m => m.id === found!.id)) {
            localMatched.push(found);
          }
        } else {
          localUnmatched.push(p);
        }
      }

      setMatched(localMatched);
      setUnmatched(localUnmatched);

      if (localMatched.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }
      
      // Predict by passing all matched IDs
      const res = await api.predictReaction(localMatched.map(m => m.id));
      
      if (res && res.length > 0) {
        // Collect unique product IDs to fetch full details
        const productIds = new Set<string>();
        for (const r of res) {
          for (const p of r.products) {
            productIds.add(p.id);
          }
        }
        
        try {
          const detailsPromises = Array.from(productIds).map(id => api.getSubstance(id));
          const details = await Promise.all(detailsPromises);
          
          const detailsMap: Record<string, SubstanceDetail> = {};
          for (const d of details) {
            detailsMap[d.id] = d;
          }
          setProductDetails(detailsMap);
        } catch (detailErr) {
          console.error("Failed to load product details", detailErr);
        }
      }
      
      setResults(res);
    } catch (err) {
      console.error(err);
      setResults([]);
    }
    setLoading(false);
  };

  const getTierBarClass = (tier?: number) => {
    if (tier === 1) return 'bg-rose-500';
    if (tier === 2) return 'bg-orange-500';
    if (tier === 3) return 'bg-amber-500';
    return 'bg-primary-500';
  };

  const getTierBadgeClass = (tier?: number) => {
    if (tier === 1) return 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-400';
    if (tier === 2) return 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-400';
    if (tier === 3) return 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400';
    return 'bg-primary-50 dark:bg-primary-950/40 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-400';
  };

  const getTierLabel = (tier?: number) => {
    if (tier === 1) return 'Tier 1: Vital Global Industry';
    if (tier === 2) return 'Tier 2: Major Commodity';
    if (tier === 3) return 'Tier 3: Niche Industrial';
    if (tier === 4) return 'Tier 4: Academic / Common';
    return 'Unrated Value';
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-surface-500 hover:text-primary-600 transition-colors no-underline">
        ← Back Home
      </Link>
      <div className="flex items-center justify-center gap-3 text-3xl sm:text-4xl font-black tracking-tight text-surface-900 dark:text-surface-50 mt-6 mb-3">
        <span>⚗️</span> Bulk Mixture Console
      </div>
      <p className="text-center text-sm text-surface-600 dark:text-surface-300 mb-8 max-w-2xl mx-auto">
        Paste any combination of elements or compounds (e.g.{' '}
        <code className="px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-primary-700 dark:text-primary-300 font-mono text-xs">Sodium + Chlorine</code> or{' '}
        <code className="px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-primary-700 dark:text-primary-300 font-mono text-xs">H2, O2</code>) to compute synthetic pathways and explore detailed product properties.
      </p>

      <div className="glass p-6 sm:p-8 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col gap-4">
        <label className="text-xs font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400">
          Combination Input
        </label>
        <textarea 
          className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl p-4 text-base sm:text-lg font-mono text-surface-900 dark:text-surface-50 placeholder:text-surface-400 outline-none focus:border-primary-500 transition-all resize-y"
          placeholder="Paste or type reactants separated by '+' or commas (e.g. Na + Cl2)"
          value={bulkInput}
          onChange={e => setBulkInput(e.target.value)}
          rows={3}
        />

        <button 
          className="px-8 py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-surface-50 font-bold text-base transition-all shadow-lg shadow-primary-600/20 disabled:opacity-50 disabled:shadow-none"
          onClick={handlePredict} 
          disabled={!bulkInput.trim() || loading || substances.length === 0}
        >
          {loading ? 'Synthesizing...' : 'Predict Reactions'}
        </button>
      </div>
      
      {/* Parsed Analysis Context */}
      {(matched.length > 0 || unmatched.length > 0) && (
        <div className="mt-4 flex gap-2 flex-wrap">
          {matched.map((m, i) => (
            <span key={i} className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-lg text-xs font-bold">
              ✓ {m.name} ({m.formula})
            </span>
          ))}
          {unmatched.map((um, i) => (
            <span key={i} className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 px-3 py-1.5 rounded-lg text-xs font-bold">
              ⚠ Unknown: &quot;{um}&quot;
            </span>
          ))}
        </div>
      )}

      <div className="mt-10">
        {results && results.length > 0 && (
          <div className="animate-in fade-in duration-300 space-y-6">
            <h3 className="text-xl font-extrabold text-center text-surface-900 dark:text-surface-50 mb-4">
              Predicted Pathways & Products
            </h3>
            {results.map(r => (
              <div key={r.id} className="glass p-6 sm:p-8 rounded-3xl border border-surface-200 dark:border-surface-800 relative overflow-hidden shadow-sm">
                <div className={`absolute top-0 left-0 w-1.5 h-full ${getTierBarClass(r.industrial_value_tier)}`} />
                
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    <div className="text-2xl font-black text-surface-900 dark:text-surface-50">
                      <FormulaDisplay formula={r.equation} />
                    </div>
                    <h2 className="text-lg font-extrabold text-surface-800 dark:text-surface-100 mt-1.5 mb-2">{r.name}</h2>
                    {r.description && <p className="text-sm text-surface-600 dark:text-surface-300 mb-3">{r.description}</p>}
                  </div>
                  
                  <div className="shrink-0">
                    <div className={`px-3.5 py-1.5 rounded-xl border text-xs font-extrabold ${getTierBadgeClass(r.industrial_value_tier)}`}>
                      {getTierLabel(r.industrial_value_tier)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5">
                  <div className="bg-surface-50 dark:bg-surface-900/60 border border-surface-200 dark:border-surface-800 p-4 rounded-2xl">
                    <div className="text-[10px] font-black uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-1">Thermodynamics</div>
                    <div className={`text-base font-bold ${
                      r.enthalpy_change == null
                        ? 'text-surface-700 dark:text-surface-300'
                        : r.enthalpy_change < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : r.enthalpy_change > 0
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-surface-700 dark:text-surface-300'
                    }`}>
                      {r.enthalpy_change != null ? `${r.enthalpy_change > 0 ? '+' : ''}${r.enthalpy_change} kJ/mol` : 'Unknown'}
                      {r.enthalpy_change != null && (
                        <span className="text-xs font-semibold opacity-75 ml-2">
                          ({r.enthalpy_change < 0 ? 'Exothermic' : r.enthalpy_change > 0 ? 'Endothermic' : 'Thermoneutral'})
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-surface-50 dark:bg-surface-900/60 border border-surface-200 dark:border-surface-800 p-4 rounded-2xl">
                    <div className="text-[10px] font-black uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-1">Kinetics / Conditions</div>
                    <div className="text-sm font-bold text-surface-800 dark:text-surface-200">{r.conditions || 'Standard Ambient Condition'}</div>
                  </div>
                </div>

                {/* Detailed Spec Injection for Products */}
                <h4 className="mt-6 pb-2 mb-4 border-b border-surface-200 dark:border-surface-800 text-xs font-black uppercase tracking-wider text-primary-600 dark:text-primary-400">
                  Synthesized Products Breakdown
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {r.products.map(prod => {
                    const detail = productDetails[prod.id];
                    return (
                      <div key={prod.id} className="bg-surface-50 dark:bg-surface-900/60 p-5 rounded-2xl border border-surface-200 dark:border-surface-800">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl font-black text-primary-600 dark:text-primary-400">
                            <FormulaDisplay formula={prod.formula} />
                          </span>
                          <span className="text-sm font-bold text-surface-700 dark:text-surface-300">— {prod.name}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">Molar Mass</div>
                            <div className="text-sm font-bold text-surface-900 dark:text-surface-100">
                              {prod.molar_mass != null ? `${prod.molar_mass} g/mol` : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">Classification</div>
                            <div className="text-sm font-bold text-surface-900 dark:text-surface-100 capitalize">{prod.type}</div>
                          </div>
                          {detail?.state_at_room_temp && (
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">Room Temp State</div>
                              <div className="text-sm font-bold text-surface-900 dark:text-surface-100 capitalize">{detail.state_at_room_temp}</div>
                            </div>
                          )}
                          {detail?.boiling_point != null && (
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">Boiling Point</div>
                              <div className="text-sm font-bold text-surface-900 dark:text-surface-100">{detail.boiling_point} K</div>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 pt-3 border-t border-surface-200 dark:border-surface-800">
                          <div className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1.5">Safety & Hazards</div>
                          {detail?.hazard_data ? (
                            <div className="space-y-2">
                              {detail.hazard_data.ghs_signal_word && (
                                <div className={`text-xs font-black uppercase ${
                                  detail.hazard_data.ghs_signal_word.toLowerCase() === 'danger'
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-amber-600 dark:text-amber-400'
                                }`}>
                                  {detail.hazard_data.ghs_signal_word}
                                </div>
                              )}
                              <div className="flex gap-3 flex-wrap text-xs text-surface-700 dark:text-surface-300">
                                {detail.hazard_data.nfpa_health !== undefined && (
                                  <div><strong>Health:</strong> {detail.hazard_data.nfpa_health}</div>
                                )}
                                {detail.hazard_data.nfpa_flammability !== undefined && (
                                  <div><strong>Fire:</strong> {detail.hazard_data.nfpa_flammability}</div>
                                )}
                                {detail.hazard_data.nfpa_instability !== undefined && (
                                  <div><strong>Instability:</strong> {detail.hazard_data.nfpa_instability}</div>
                                )}
                              </div>
                              {detail.hazard_data.h_statements && detail.hazard_data.h_statements.length > 0 && (
                                <ul className="list-disc pl-4 space-y-0.5 text-xs text-surface-600 dark:text-surface-300">
                                  {detail.hazard_data.h_statements.slice(0, 3).map((h, idx) => (
                                    <li key={idx}>{h}</li>
                                  ))}
                                  {detail.hazard_data.h_statements.length > 3 && <li>…</li>}
                                </ul>
                              )}
                              <div className="pt-1 text-xs">
                                <Link to={`/substances/${prod.id}`} className="font-bold text-primary-600 dark:text-primary-400 hover:underline">
                                  View Full Specs →
                                </Link>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-surface-600 dark:text-surface-300 leading-relaxed">
                              Please review the{' '}
                              <Link to={`/substances/${prod.id}`} className="font-bold text-primary-600 dark:text-primary-400 hover:underline">
                                detailed {prod.name} hazard sheet
                              </Link>{' '}
                              for complete toxicity, flammability, and handling protocols prior to industrial synthesis.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {results && results.length === 0 && (
          <div className="glass p-12 rounded-3xl border border-dashed border-surface-300 dark:border-surface-700 text-center">
            <div className="text-4xl mb-3">⚗️</div>
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 mb-1">No predicted pathways</h3>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              Our database currently contains no predicted or verified reactions for this exact combination under standard parameters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
