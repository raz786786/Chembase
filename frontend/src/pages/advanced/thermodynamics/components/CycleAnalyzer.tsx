import React, { useState, useMemo } from 'react';
import { RefreshCw, PlayCircle, Settings } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { SteamEngine } from '../engines/SteamEngine';

export default function CycleAnalyzer() {
  const [cycleType, setCycleType] = useState('rankine');
  
  // Shared / General Inputs
  const [pHigh, setPHigh] = useState('8.0'); // MPa
  const [pLow, setPLow] = useState('0.01'); // MPa
  const [tHigh, setTHigh] = useState('500'); // C (Turbine Inlet or Max Temp)
  
  // Additional specific inputs
  const [compRatio, setCompRatio] = useState('8'); // Otto / Brayton
  const [tLow, setTLow] = useState('20'); // C

  // Calculate Cycle States
  const states = useMemo(() => {
    try {
      if (cycleType === 'rankine') {
        const P1 = parseFloat(pLow); 
        const P2 = parseFloat(pHigh); 
        const T3 = parseFloat(tHigh); 
        
        if (isNaN(P1) || isNaN(P2) || isNaN(T3) || P1 >= P2) return [];

        const T1 = SteamEngine.getSatPropByP(P1, 'T');
        const h1 = SteamEngine.getSatPropByP(P1, 'hf');
        const s1 = SteamEngine.getSatPropByP(P1, 'sf');
        const v1 = SteamEngine.getSatPropByP(P1, 'vf');

        const wPump = v1 * (P2 - P1) * 1000;
        const h2 = h1 + wPump;
        const s2 = s1; 
        const T2 = T1 + 2; 

        const Tsat2 = SteamEngine.getSatPropByP(P2, 'T');
        const Cp_steam = 2.1; 
        const h_g2 = SteamEngine.getSatPropByP(P2, 'hg');
        const s_g2 = SteamEngine.getSatPropByP(P2, 'sg');
        
        let h3, s3;
        if (T3 > Tsat2) {
          h3 = h_g2 + Cp_steam * (T3 - Tsat2);
          s3 = s_g2 + Cp_steam * Math.log((T3 + 273.15) / (Tsat2 + 273.15));
        } else {
          h3 = h_g2;
          s3 = s_g2;
        }

        const s4 = s3;
        const sf1 = SteamEngine.getSatPropByP(P1, 'sf');
        const sg1 = SteamEngine.getSatPropByP(P1, 'sg');
        
        let x4 = (s4 - sf1) / (sg1 - sf1);
        if (x4 > 1) x4 = 1;
        
        const hf1 = SteamEngine.getSatPropByP(P1, 'hf');
        const hfg1 = SteamEngine.getSatPropByP(P1, 'hfg');
        const h4 = hf1 + x4 * hfg1;
        const T4 = T1;

        return [
          { state: '1 (Pump In)', T: T1, P: P1, h: h1, s: s1, label: 'Sat Liquid' },
          { state: '2 (Boiler In)', T: T2, P: P2, h: h2, s: s2, label: 'Comp Liquid' },
          { state: '3 (Turbine In)', T: T3, P: P2, h: h3, s: s3, label: 'Superheated' },
          { state: '4 (Condenser In)', T: T4, P: P1, h: h4, s: s4, label: `Wet (x=${x4.toFixed(2)})` },
          { state: '1 (Pump In)', T: T1, P: P1, h: h1, s: s1, label: 'Sat Liquid' }
        ];
      }

      if (cycleType === 'brayton') {
        const rp = parseFloat(compRatio);
        const Tmin = parseFloat(tLow) + 273.15; // K
        const Tmax = parseFloat(tHigh) + 273.15; // K
        const k = 1.4;
        const Cp = 1.005;

        // 1: Compressor Inlet
        const T1 = Tmin;
        const P1 = 0.1; // MPa
        
        // 2: Compressor Exit
        const P2 = P1 * rp;
        const T2 = T1 * Math.pow(rp, (k-1)/k);
        
        // 3: Turbine Inlet
        const T3 = Tmax;
        const P3 = P2;
        
        // 4: Turbine Exit
        const P4 = P1;
        const T4 = T3 * Math.pow(1/rp, (k-1)/k);

        // Calculate s (relative)
        const s1 = 0;
        const s2 = s1; // Isentropic
        const s3 = s2 + Cp * Math.log(T3/T2); 
        const s4 = s3; // Isentropic

        return [
          { state: '1 (Comp In)', T: T1-273.15, P: P1, h: Cp*T1, s: s1, label: 'Gas' },
          { state: '2 (Comb In)', T: T2-273.15, P: P2, h: Cp*T2, s: s2, label: 'Comp Gas' },
          { state: '3 (Turb In)', T: T3-273.15, P: P3, h: Cp*T3, s: s3, label: 'Hot Gas' },
          { state: '4 (Turb Out)', T: T4-273.15, P: P4, h: Cp*T4, s: s4, label: 'Exhaust' },
          { state: '1 (Comp In)', T: T1-273.15, P: P1, h: Cp*T1, s: s1, label: 'Gas' }
        ];
      }

      if (cycleType === 'otto') {
        const rv = parseFloat(compRatio);
        const Tmin = parseFloat(tLow) + 273.15;
        const Tmax = parseFloat(tHigh) + 273.15;
        const k = 1.4;
        const Cv = 0.718;

        const T1 = Tmin;
        const T2 = T1 * Math.pow(rv, k-1);
        const T3 = Tmax;
        const T4 = T3 * Math.pow(1/rv, k-1);

        const s1 = 0;
        const s2 = s1;
        const s3 = s2 + Cv * Math.log(T3/T2);
        const s4 = s3;

        return [
          { state: '1 (Comp In)', T: T1-273.15, P: 0.1, h: Cv*T1, s: s1, label: 'Gas' },
          { state: '2 (Heat In)', T: T2-273.15, P: 0.1*Math.pow(rv, k), h: Cv*T2, s: s2, label: 'Comp Gas' },
          { state: '3 (Exp In)', T: T3-273.15, P: (T3/T2)*(0.1*Math.pow(rv, k)), h: Cv*T3, s: s3, label: 'Hot Gas' },
          { state: '4 (Heat Out)', T: T4-273.15, P: 0.1*(T4/T1), h: Cv*T4, s: s4, label: 'Exhaust' },
          { state: '1 (Comp In)', T: T1-273.15, P: 0.1, h: Cv*T1, s: s1, label: 'Gas' }
        ];
      }

      if (cycleType === 'refrigeration') {
        // Simple ideal Vapor Compression (using R134a dummy approximation)
        const T_evap = parseFloat(tLow);
        const T_cond = parseFloat(tHigh);

        // Dummy R134a properties approximation for demo
        const Cp_l = 1.4;
        const Cp_v = 1.1;
        const hfg = 200; 
        
        const h1 = 250 + Cp_v * (T_evap + 20); // Sat vapor approx
        const s1 = 1.0;
        const P1 = 0.2; // MPa approx
        
        const P2 = 1.0; // MPa approx
        const T2 = T_cond + 20; 
        const h2 = h1 + 30; // Isentropic comp approx
        const s2 = s1;

        const T3 = T_cond;
        const P3 = P2;
        const h3 = 100 + Cp_l * T3; // Sat liquid approx
        const s3 = 0.4;

        const h4 = h3; // Isenthalpic expansion
        const T4 = T_evap;
        const P4 = P1;
        const s4 = 0.45; // Wet mixture

        return [
          { state: '1 (Comp In)', T: T_evap, P: P1, h: h1, s: s1, label: 'Sat Vapor' },
          { state: '2 (Cond In)', T: T2, P: P2, h: h2, s: s2, label: 'Superheated' },
          { state: '3 (Valve In)', T: T3, P: P3, h: h3, s: s3, label: 'Sat Liquid' },
          { state: '4 (Evap In)', T: T4, P: P4, h: h4, s: s4, label: 'Wet Mixture' },
          { state: '1 (Comp In)', T: T_evap, P: P1, h: h1, s: s1, label: 'Sat Vapor' }
        ];
      }
      return [];
    } catch (e) {
      return [];
    }
  }, [cycleType, pHigh, pLow, tHigh, compRatio, tLow]);

  const performance = useMemo(() => {
    if (states.length < 4) return null;
    
    if (cycleType === 'rankine' || cycleType === 'brayton' || cycleType === 'otto') {
      const q_in = states[2].h - states[1].h;
      const w_turb = states[2].h - states[3].h;
      let w_pump = states[1].h - states[0].h;
      if (cycleType === 'otto') w_pump = states[1].h - states[0].h; // work of compression
      const w_net = w_turb - w_pump;
      const eff = (w_net / q_in) * 100;
      return { q_in, w_turb, w_pump, w_net, eff, type: 'power' };
    } else {
      // Refrigeration
      const w_comp = states[1].h - states[0].h;
      const q_in = states[0].h - states[3].h; // Cooling load
      const cop = q_in / w_comp;
      return { q_in, w_pump: w_comp, w_turb: 0, w_net: w_comp, eff: cop, type: 'refrigeration' };
    }
  }, [states, cycleType]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-surface-800 rounded-3xl p-6 border border-surface-200 dark:border-surface-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
            <RefreshCw className="w-7 h-7 text-orange-500" /> Interactive Cycle Analyzer
          </h2>
          <p className="text-surface-500 mt-1">Design, evaluate, and visualize power and refrigeration cycles.</p>
        </div>
        <select 
          value={cycleType} 
          onChange={(e) => setCycleType(e.target.value)}
          className="w-full md:w-auto px-4 py-3 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl font-bold text-surface-900 dark:text-white outline-none focus:border-orange-500 transition-colors"
        >
          <option value="rankine">Ideal Rankine Cycle</option>
          <option value="brayton">Ideal Brayton Cycle</option>
          <option value="otto">Ideal Otto Cycle</option>
          <option value="refrigeration">Ideal Vapor Compression</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-surface-800 rounded-3xl p-6 border border-surface-200 dark:border-surface-700 shadow-sm">
            <h3 className="font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-surface-400" /> Operating Parameters
            </h3>
            
            <div className="space-y-4">
              {cycleType === 'rankine' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-1">Boiler Pressure (P_high)</label>
                    <div className="flex bg-surface-50 dark:bg-surface-900 rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700">
                      <input type="number" value={pHigh} onChange={e => setPHigh(e.target.value)} className="w-full bg-transparent px-4 py-2 font-bold outline-none" />
                      <span className="px-4 py-2 bg-surface-100 dark:bg-surface-800 text-surface-500 font-bold border-l border-surface-200 dark:border-surface-700">MPa</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-1">Condenser Pressure (P_low)</label>
                    <div className="flex bg-surface-50 dark:bg-surface-900 rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700">
                      <input type="number" value={pLow} onChange={e => setPLow(e.target.value)} className="w-full bg-transparent px-4 py-2 font-bold outline-none" />
                      <span className="px-4 py-2 bg-surface-100 dark:bg-surface-800 text-surface-500 font-bold border-l border-surface-200 dark:border-surface-700">MPa</span>
                    </div>
                  </div>
                </>
              )}
              
              {(cycleType === 'brayton' || cycleType === 'otto') && (
                <div>
                  <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-1">
                    {cycleType === 'brayton' ? 'Pressure Ratio (rp)' : 'Compression Ratio (r)'}
                  </label>
                  <div className="flex bg-surface-50 dark:bg-surface-900 rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700">
                    <input type="number" value={compRatio} onChange={e => setCompRatio(e.target.value)} className="w-full bg-transparent px-4 py-2 font-bold outline-none" />
                  </div>
                </div>
              )}

              {(cycleType === 'brayton' || cycleType === 'otto' || cycleType === 'refrigeration') && (
                <div>
                  <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-1">
                    {cycleType === 'refrigeration' ? 'Evaporator Temp' : 'Min Temp (T1)'}
                  </label>
                  <div className="flex bg-surface-50 dark:bg-surface-900 rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700">
                    <input type="number" value={tLow} onChange={e => setTLow(e.target.value)} className="w-full bg-transparent px-4 py-2 font-bold outline-none" />
                    <span className="px-4 py-2 bg-surface-100 dark:bg-surface-800 text-surface-500 font-bold border-l border-surface-200 dark:border-surface-700">°C</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-1">
                  {cycleType === 'refrigeration' ? 'Condenser Temp' : 'Max Temp (T3)'}
                </label>
                <div className="flex bg-surface-50 dark:bg-surface-900 rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700">
                  <input type="number" value={tHigh} onChange={e => setTHigh(e.target.value)} className="w-full bg-transparent px-4 py-2 font-bold outline-none" />
                  <span className="px-4 py-2 bg-surface-100 dark:bg-surface-800 text-surface-500 font-bold border-l border-surface-200 dark:border-surface-700">°C</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Results */}
          {performance && (
            <div className="bg-orange-50 dark:bg-orange-900/10 rounded-3xl p-6 border border-orange-100 dark:border-orange-900/30">
              <h3 className="font-bold text-orange-900 dark:text-orange-100 mb-4 flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-orange-500" /> Cycle Performance
              </h3>
              <div className="space-y-3">
                {performance.type === 'power' ? (
                  <>
                    <div className="flex justify-between items-baseline border-b border-orange-200/50 dark:border-orange-800/50 pb-2">
                      <span className="text-sm font-semibold text-orange-700/70 dark:text-orange-300/70">Thermal Efficiency (η)</span>
                      <span className="text-lg font-black text-orange-600 dark:text-orange-400">{performance.eff.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-baseline border-b border-orange-200/50 dark:border-orange-800/50 pb-2">
                      <span className="text-sm font-semibold text-orange-700/70 dark:text-orange-300/70">Net Work (W_net)</span>
                      <span className="text-base font-bold text-orange-900 dark:text-orange-100">{performance.w_net.toFixed(1)} kJ/kg</span>
                    </div>
                    <div className="flex justify-between items-baseline border-b border-orange-200/50 dark:border-orange-800/50 pb-2">
                      <span className="text-sm font-semibold text-orange-700/70 dark:text-orange-300/70">Heat Input (Q_in)</span>
                      <span className="text-base font-bold text-orange-900 dark:text-orange-100">{performance.q_in.toFixed(1)} kJ/kg</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-baseline border-b border-orange-200/50 dark:border-orange-800/50 pb-2">
                      <span className="text-sm font-semibold text-orange-700/70 dark:text-orange-300/70">Coefficient of Performance (COP)</span>
                      <span className="text-lg font-black text-orange-600 dark:text-orange-400">{performance.eff.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-baseline border-b border-orange-200/50 dark:border-orange-800/50 pb-2">
                      <span className="text-sm font-semibold text-orange-700/70 dark:text-orange-300/70">Cooling Load (Q_in)</span>
                      <span className="text-base font-bold text-orange-900 dark:text-orange-100">{performance.q_in.toFixed(1)} kJ/kg</span>
                    </div>
                    <div className="flex justify-between items-baseline border-b border-orange-200/50 dark:border-orange-800/50 pb-2">
                      <span className="text-sm font-semibold text-orange-700/70 dark:text-orange-300/70">Compressor Work (W_in)</span>
                      <span className="text-base font-bold text-orange-900 dark:text-orange-100">{performance.w_pump.toFixed(1)} kJ/kg</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Diagram & Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-surface-800 rounded-3xl p-6 border border-surface-200 dark:border-surface-700 shadow-sm h-[400px] flex flex-col">
            <h3 className="font-bold text-surface-900 dark:text-white mb-4 text-center">T-s Diagram (Temperature vs. Entropy)</h3>
            <div className="flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={states} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="s" type="number" domain={['auto', 'auto']} name="Entropy" stroke="#94a3b8" />
                  <YAxis dataKey="T" type="number" domain={['auto', 'auto']} name="Temperature" unit="°C" stroke="#94a3b8" />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                    labelFormatter={() => ''}
                  />
                  <Line type="monotone" dataKey="T" stroke="#f97316" strokeWidth={3} dot={{ r: 6, fill: '#f97316' }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-800 rounded-3xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-50 dark:bg-surface-900 text-xs uppercase font-bold text-surface-500 border-b border-surface-200 dark:border-surface-700">
                  <tr>
                    <th className="px-6 py-4">State Point</th>
                    <th className="px-6 py-4 text-right">T (°C)</th>
                    <th className="px-6 py-4 text-right">P (MPa)</th>
                    <th className="px-6 py-4 text-right">h (kJ/kg)</th>
                    <th className="px-6 py-4 text-right">s (kJ/kg·K)</th>
                    <th className="px-6 py-4">Phase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  {states.slice(0, 4).map((state, i) => (
                    <tr key={i} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/50 transition-colors">
                      <td className="px-6 py-3 font-bold text-surface-900 dark:text-white">{state.state}</td>
                      <td className="px-6 py-3 text-right font-medium text-surface-600 dark:text-surface-300">{state.T.toFixed(1)}</td>
                      <td className="px-6 py-3 text-right font-medium text-surface-600 dark:text-surface-300">{state.P.toFixed(4)}</td>
                      <td className="px-6 py-3 text-right font-medium text-surface-600 dark:text-surface-300">{state.h.toFixed(1)}</td>
                      <td className="px-6 py-3 text-right font-medium text-surface-600 dark:text-surface-300">{state.s.toFixed(4)}</td>
                      <td className="px-6 py-3 font-medium text-primary-600 dark:text-primary-400">{state.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
