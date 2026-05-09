import { useState, useEffect } from 'react';
import { api, type SubstanceSummary, type Reaction, type SubstanceDetail } from '../api';
import { FormulaDisplay } from '../components/FormulaDisplay';
import { Link } from 'react-router-dom';

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
      const parts = bulkInput.split(/[\+,\n]+/).map(p => p.trim()).filter(Boolean);
      
      const localMatched: SubstanceSummary[] = [];
      const localUnmatched: string[] = [];

      for (const p of parts) {
        const found = substances.find(s => 
          s.name.toLowerCase() === p.toLowerCase() || 
          s.formula.toLowerCase() === p.toLowerCase() ||
          s.symbol?.toLowerCase() === p.toLowerCase()
        );
        if (found) {
          localMatched.push(found);
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

  const getTierColor = (tier?: number) => {
    if (tier === 1) return '#ef4444'; // Top Tier
    if (tier === 2) return '#f97316'; // High
    if (tier === 3) return '#eab308'; // Medium
    return '#3b82f6'; // Common
  };

  const getTierLabel = (tier?: number) => {
    if (tier === 1) return 'Tier 1: Vital Global Industry';
    if (tier === 2) return 'Tier 2: Major Commodity';
    if (tier === 3) return 'Tier 3: Niche Industrial';
    if (tier === 4) return 'Tier 4: Academic / Common';
    return 'Unrated Value';
  };

  return (
    <div className="fade-in main-content" style={{ maxWidth: '900px' }}>
      <Link to="/" className="back-link">← Back Home</Link>
      <div className="section-heading" style={{ justifyContent: 'center', fontSize: '2.5rem', marginBottom: '1rem', marginTop: '2rem' }}>
        <span className="icon">⚗️</span> Bulk Mixture Console
      </div>
      <p style={{ textAlign: 'center', color: 'var(--color-surface-200)', marginBottom: '3rem' }}>
        Paste any combination of elements or compounds (e.g. <code>Sodium + Chlorine</code> or <code>H2, O2</code>) to compute synthetic pathways and explore detailed product properties.
      </p>

      <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label className="form-label">Combination Input</label>
        <textarea 
          className="form-input" 
          placeholder="Paste or type reactants separated by '+' or commas (e.g. Na + Cl2)"
          value={bulkInput}
          onChange={e => setBulkInput(e.target.value)}
          rows={3}
          style={{ fontSize: '1.2rem', fontFamily: 'monospace', resize: 'vertical' }}
        />

        <button 
          className="btn btn-primary" 
          onClick={handlePredict} 
          disabled={!bulkInput.trim() || loading || substances.length === 0}
          style={{ padding: '1rem 2rem', fontSize: '1.1rem', marginTop: '1rem' }}
        >
          {loading ? 'Synthesizing...' : 'Predict Reactions'}
        </button>
      </div>
      
      {/* Parsed Analysis Context */}
      {(matched.length > 0 || unmatched.length > 0) && (
         <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {matched.map((m, i) => (
               <span key={i} style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 600 }}>
                  ✓ {m.name} ({m.formula})
               </span>
            ))}
            {unmatched.map((um, i) => (
               <span key={i} style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 600 }}>
                  ⚠ Unknown: "{um}"
               </span>
            ))}
         </div>
      )}

      <div style={{ marginTop: '3rem' }}>
        {results && results.length > 0 && (
          <div className="fade-in">
            <h3 className="section-heading" style={{ fontSize: '1.5rem', justifyContent: 'center', marginBottom: '2rem' }}>Predicted Pathways & Products</h3>
            {results.map(r => (
              <div key={r.id} className="card" style={{ marginBottom: '2.5rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', background: getTierColor(r.industrial_value_tier) }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="reaction-equation" style={{ fontSize: '1.8rem', background: 'transparent', padding: 0 }}>
                      <FormulaDisplay formula={r.equation} />
                    </div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.5rem 0' }}>{r.name}</h2>
                    {r.description && <p style={{ color: 'var(--color-surface-200)', marginBottom: '1rem' }}>{r.description}</p>}
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px', border: `1px solid ${getTierColor(r.industrial_value_tier)}`, color: getTierColor(r.industrial_value_tier), fontWeight: 800, fontSize: '0.85rem' }}>
                      {getTierLabel(r.industrial_value_tier)}
                    </div>
                  </div>
                </div>

                <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', margin: '1.5rem 0', gap: '1rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px' }}>
                    <div className="prop-label">Thermodynamics</div>
                    <div className="prop-value" style={{ fontSize: '1.1rem', color: r.enthalpy_change && r.enthalpy_change < 0 ? '#ef4444' : '#3b82f6' }}>
                      {r.enthalpy_change ? `${r.enthalpy_change > 0 ? '+' : ''}${r.enthalpy_change} kJ/mol` : 'Unknown'}
                      {r.enthalpy_change && <span style={{ fontSize: '0.75rem', opacity: 0.7, marginLeft: '0.5rem' }}>({r.enthalpy_change < 0 ? 'Exothermic' : 'Endothermic'})</span>}
                    </div>
                  </div>
                  
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px' }}>
                    <div className="prop-label">Kinetics / Conditions</div>
                    <div className="prop-value" style={{ fontSize: '0.95rem' }}>{r.conditions || 'Standard Ambient Condition'}</div>
                  </div>
                </div>

                {/* Detailed Spec Injection for Products */}
                <h4 style={{ marginTop: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--color-primary-300)' }}>
                   Synthesized Products Breakdown
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                   {r.products.map(prod => {
                      const detail = productDetails[prod.id];
                      return (
                      <div key={prod.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                           <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-secondary-400)' }}><FormulaDisplay formula={prod.formula} /></span>
                           <span style={{ fontSize: '1.1rem', opacity: 0.8 }}>- {prod.name}</span>
                         </div>
                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                            <div>
                               <div className="prop-label">Molar Mass</div>
                               <div className="prop-value">{prod.molar_mass ? `${prod.molar_mass} g/mol` : 'N/A'}</div>
                            </div>
                            <div>
                               <div className="prop-label">Classification</div>
                               <div className="prop-value" style={{ textTransform: 'capitalize' }}>{prod.type}</div>
                            </div>
                            {detail?.state_at_room_temp && (
                                <div>
                                   <div className="prop-label">Room Temp State</div>
                                   <div className="prop-value" style={{ textTransform: 'capitalize' }}>{detail.state_at_room_temp}</div>
                                </div>
                            )}
                            {detail?.boiling_point && (
                                <div>
                                   <div className="prop-label">Boiling Point</div>
                                   <div className="prop-value">{detail.boiling_point} K</div>
                                </div>
                            )}
                         </div>
                         <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <div className="prop-label" style={{ color: '#ef4444' }}>Safety & Hazards</div>
                            {detail?.hazard_data ? (
                              <div style={{ marginTop: '0.5rem' }}>
                                {detail.hazard_data.ghs_signal_word && (
                                  <div style={{ fontWeight: 'bold', color: detail.hazard_data.ghs_signal_word.toLowerCase() === 'danger' ? '#ef4444' : '#f59e0b', marginBottom: '0.5rem' }}>
                                    {detail.hazard_data.ghs_signal_word.toUpperCase()}
                                  </div>
                                )}
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                  {detail.hazard_data.nfpa_health !== undefined && (
                                    <div style={{ fontSize: '0.85rem' }}><strong>Health:</strong> {detail.hazard_data.nfpa_health}</div>
                                  )}
                                  {detail.hazard_data.nfpa_flammability !== undefined && (
                                    <div style={{ fontSize: '0.85rem' }}><strong>Fire:</strong> {detail.hazard_data.nfpa_flammability}</div>
                                  )}
                                  {detail.hazard_data.nfpa_instability !== undefined && (
                                    <div style={{ fontSize: '0.85rem' }}><strong>Instability:</strong> {detail.hazard_data.nfpa_instability}</div>
                                  )}
                                </div>
                                {detail.hazard_data.h_statements && detail.hazard_data.h_statements.length > 0 && (
                                  <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.85rem', color: 'var(--color-surface-200)' }}>
                                    {detail.hazard_data.h_statements.slice(0, 3).map((h, idx) => (
                                      <li key={idx} style={{ marginBottom: '0.2rem' }}>{h}</li>
                                    ))}
                                    {detail.hazard_data.h_statements.length > 3 && <li>...</li>}
                                  </ul>
                                )}
                                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                  <Link to={`/substances/${prod.id}`} style={{ color: 'var(--color-primary-400)', textDecoration: 'underline' }}>View Full Specs →</Link>
                                </div>
                              </div>
                            ) : (
                              <div className="prop-value" style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                                 Please review the <Link to={`/substances/${prod.id}`} style={{ color: 'var(--color-primary-400)', textDecoration: 'underline' }}>detailed {prod.name} hazard sheet</Link> for complete toxicity, flammability, and handling protocols prior to industrial synthesis.
                              </div>
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
          <div className="fade-in empty-state" style={{ padding: '3rem' }}>
            <div className="icon">⚗️</div>
            <h3>No predicted pathways</h3>
            <p>Our database currently contains no predicted or verified reactions for this exact combination under standard parameters.</p>
          </div>
        )}
      </div>

    </div>
  );
}
