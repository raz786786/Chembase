import React, { useState, useMemo } from 'react';
import { RefreshCw, PlayCircle, Settings } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { SteamEngine } from '../engines/SteamEngine';

export default function CycleAnalyzer() {
  const [cycleType, setCycleType] = useState('rankine');
  const [pHigh, setPHigh] = useState('8.0'); // MPa
  const [pLow, setPLow] = useState('0.01'); // MPa
  const [tHigh, setTHigh] = useState('500'); // C
  
  // Calculate Ideal Rankine Cycle States
  const states = useMemo(() => {
    if (cycleType !== 'rankine') return [];
    
    const P1 = parseFloat(pLow); // Condenser pressure (MPa)
    const P2 = parseFloat(pHigh); // Boiler pressure (MPa)
    const T3 = parseFloat(tHigh); // Turbine inlet temp (C)
    
    if (isNaN(P1) || isNaN(P2) || isNaN(T3) || P1 >= P2) return [];

    try {
      // State 1: Saturated liquid at condenser pressure
      const T1 = SteamEngine.getSatPropByP(P1, 'T');
      const h1 = SteamEngine.getSatPropByP(P1, 'hf');
      const s1 = SteamEngine.getSatPropByP(P1, 'sf');
      const v1 = SteamEngine.getSatPropByP(P1, 'vf');

      // State 2: Pump exit (Isentropic)
      // w_pump = v1 * (P2 - P1) * 1000 (kPa conversion)
      const wPump = v1 * (P2 - P1) * 1000;
      const h2 = h1 + wPump;
      const s2 = s1; // isentropic
      const T2 = T1 + 2; // Approx slight temp increase

      // State 3: Turbine Inlet (Superheated)
      // Since our simple steam engine currently handles Saturation primarily, 
      // we'll approximate superheated properties for the demo or use saturation if T3 <= Tsat
      const Tsat2 = SteamEngine.getSatPropByP(P2, 'T');
      // For a real app, you'd use a superheated table here. We'll use a constant Cp approximation for demo
      const Cp_steam = 2.1; // kJ/kgK
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

      // State 4: Turbine Exit (Isentropic to P1)
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
        { state: '1 (Pump In)', T: T1, P: P1, h: h1, s: s1, label: 'Sat Liquid' } // Close loop
      ];
    } catch (e) {
      return [];
    }
  }, [cycleType, pHigh, pLow, tHigh]);

  const performance = useMemo(() => {
    if (states.length < 4) return null;
    const q_in = states[2].h - states[1].h;
    const q_out = states[3].h - states[0].h;
    const w_turb = states[2].h - states[3].h;
    const w_pump = states[1].h - states[0].h;
    const w_net = w_turb - w_pump;
    const eff = (w_net / q_in) * 100;
    
    return { q_in, q_out, w_turb, w_pump, w_net, eff };
  }, [states]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-surface-800 rounded-3xl p-6 border border-surface-200 dark:border-surface-700 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
            <RefreshCw className="w-7 h-7 text-orange-500" /> Interactive Cycle Analyzer
          </h2>
          <p className="text-surface-500 mt-1">Design, evaluate, and visualize power and refrigeration cycles.</p>
        </div>
        <select 
          value={cycleType} 
          onChange={(e) => setCycleType(e.target.value)}
          className="px-4 py-2 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl font-bold text-surface-900 dark:text-white"
        >
          <option value="rankine">Ideal Rankine Cycle</option>
          <option value="brayton" disabled>Brayton Cycle (Coming Soon)</option>
          <option value="otto" disabled>Otto Cycle (Coming Soon)</option>
          <option value="refrigeration" disabled>Vapor Compression (Coming Soon)</option>
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
              
              <div>
                <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-1">Turbine Inlet Temp (T_high)</label>
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
                <div className="flex justify-between items-baseline border-b border-orange-200/50 dark:border-orange-800/50 pb-2">
                  <span className="text-sm font-semibold text-orange-700/70 dark:text-orange-300/70">Turbine Work (W_out)</span>
                  <span className="text-base font-bold text-orange-900 dark:text-orange-100">{performance.w_turb.toFixed(1)} kJ/kg</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-orange-700/70 dark:text-orange-300/70">Pump Work (W_in)</span>
                  <span className="text-base font-bold text-orange-900 dark:text-orange-100">{performance.w_pump.toFixed(2)} kJ/kg</span>
                </div>
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
                  <XAxis dataKey="s" type="number" domain={['auto', 'auto']} name="Entropy" unit=" kJ/kgK" stroke="#94a3b8" />
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
                    <th className="px-6 py-4">Phase Description</th>
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
