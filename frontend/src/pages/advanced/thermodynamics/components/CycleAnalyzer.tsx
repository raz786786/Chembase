import { useState, useMemo } from 'react';
import { RefreshCw, PlayCircle, Settings, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { SteamEngine } from '../engines/SteamEngine';

// NIST / Cengel Table A-11 Saturated R-134a Properties
const R134A_SAT_DATA = [
  { T: -40, P: 0.05125, hf: 0.00, hg: 225.86, sf: 0.00000, sg: 0.96866 },
  { T: -30, P: 0.08443, hf: 12.59, hg: 232.08, sf: 0.05288, sg: 0.95536 },
  { T: -20, P: 0.13282, hf: 25.49, hg: 238.41, sf: 0.10486, sg: 0.94629 },
  { T: -10, P: 0.20074, hf: 38.55, hg: 244.51, sf: 0.15504, sg: 0.93766 },
  { T: 0, P: 0.29293, hf: 51.86, hg: 250.45, sf: 0.20439, sg: 0.93139 },
  { T: 10, P: 0.41489, hf: 65.43, hg: 256.16, sf: 0.25286, sg: 0.92661 },
  { T: 20, P: 0.57207, hf: 79.32, hg: 261.59, sf: 0.30063, sg: 0.92244 },
  { T: 30, P: 0.77064, hf: 93.58, hg: 266.66, sf: 0.34789, sg: 0.91869 },
  { T: 40, P: 1.0170, hf: 108.28, hg: 271.25, sf: 0.39486, sg: 0.91497 },
  { T: 50, P: 1.3186, hf: 123.49, hg: 275.19, sf: 0.44175, sg: 0.91079 },
  { T: 60, P: 1.6828, hf: 139.31, hg: 278.23, sf: 0.48883, sg: 0.90562 },
  { T: 70, P: 2.1182, hf: 155.93, hg: 279.96, sf: 0.53655, sg: 0.89861 },
  { T: 80, P: 2.6352, hf: 173.68, hg: 279.72, sf: 0.58569, sg: 0.88844 },
  { T: 90, P: 3.2469, hf: 193.29, hg: 276.00, sf: 0.63801, sg: 0.87226 },
  { T: 101.06, P: 4.0593, hf: 241.50, hg: 241.50, sf: 0.76800, sg: 0.76800 }
];

type R134aProp = keyof typeof R134A_SAT_DATA[0];

function getR134aSatByT(T: number, prop: R134aProp): number {
  if (isNaN(T)) return NaN;
  const data = R134A_SAT_DATA;
  if (T <= data[0].T) return data[0][prop];
  if (T >= data[data.length - 1].T) return data[data.length - 1][prop];
  for (let i = 0; i < data.length - 1; i++) {
    if (T >= data[i].T && T <= data[i + 1].T) {
      const frac = (T - data[i].T) / (data[i + 1].T - data[i].T);
      return data[i][prop] + frac * (data[i + 1][prop] - data[i][prop]);
    }
  }
  return NaN;
}

interface CycleStatePoint {
  state: string;
  T: number;
  P: number;
  h: number;
  s: number;
  label: string;
}

export default function CycleAnalyzer() {
  const [cycleType, setCycleType] = useState('rankine');
  
  // Shared / General Inputs
  const [pHigh, setPHigh] = useState('8.0'); // MPa
  const [pLow, setPLow] = useState('0.01'); // MPa
  const [tHigh, setTHigh] = useState('500'); // C (Turbine Inlet or Max Temp)
  
  // Additional specific inputs
  const [compRatio, setCompRatio] = useState('8'); // Otto / Brayton
  const [tLow, setTLow] = useState('25'); // C

  const handleCycleTypeChange = (nextType: string) => {
    setCycleType(nextType);
    if (nextType === 'rankine') {
      setPLow('0.01');
      setPHigh('8');
      setTHigh('500');
    } else if (nextType === 'brayton' || nextType === 'otto') {
      setCompRatio('8');
      setTLow('25');
      setTHigh('1000');
    } else if (nextType === 'refrigeration') {
      setTLow('-10');
      setTHigh('40');
    }
  };

  // Calculate Cycle States
  const { tableStates, chartStates, error } = useMemo<{
    tableStates: CycleStatePoint[];
    chartStates: CycleStatePoint[];
    error: string | null;
  }>(() => {
    try {
      if (cycleType === 'rankine') {
        const P1 = parseFloat(pLow); 
        const P2 = parseFloat(pHigh); 
        const T3 = parseFloat(tHigh); 
        
        if (isNaN(P1) || isNaN(P2) || isNaN(T3)) {
          return { tableStates: [], chartStates: [], error: 'Enter valid numeric values for P_low, P_high, and T3.' };
        }
        if (P1 < 0.000611 || P2 > 22.064 || P1 >= P2) {
          return {
            tableStates: [],
            chartStates: [],
            error: 'Invalid Rankine pressures: requires 0.000611 MPa ≤ P_low < P_high ≤ 22.064 MPa.'
          };
        }

        const T1 = SteamEngine.getSatPropByP(P1, 'T');
        const h1 = SteamEngine.getSatPropByP(P1, 'hf');
        const s1 = SteamEngine.getSatPropByP(P1, 'sf');
        const v1 = SteamEngine.getSatPropByP(P1, 'vf');

        const wPump = v1 * (P2 - P1) * 1000;
        const h2 = h1 + wPump;
        const s2 = s1; 
        const T2 = T1 + 0.05 * (P2 - P1);

        const Tsat2 = SteamEngine.getSatPropByP(P2, 'T');
        const hf2 = SteamEngine.getSatPropByP(P2, 'hf');
        const sf2 = SteamEngine.getSatPropByP(P2, 'sf');
        const h_g2 = SteamEngine.getSatPropByP(P2, 'hg');
        const s_g2 = SteamEngine.getSatPropByP(P2, 'sg');
        const Cp_steam = 2.1;

        if (T3 < Tsat2) {
          return {
            tableStates: [],
            chartStates: [],
            error: `Turbine inlet temperature T3 (${T3.toFixed(1)}°C) must be ≥ saturation temperature at P_high (${Tsat2.toFixed(1)}°C).`
          };
        }

        let h3: number, s3: number;
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
        const hf1 = SteamEngine.getSatPropByP(P1, 'hf');
        const hg1 = SteamEngine.getSatPropByP(P1, 'hg');
        const hfg1 = SteamEngine.getSatPropByP(P1, 'hfg');

        let h4: number, T4: number, label4: string;
        if (s4 > sg1) {
          T4 = (T1 + 273.15) * Math.exp((s4 - sg1) / Cp_steam) - 273.15;
          h4 = hg1 + Cp_steam * (T4 - T1);
          label4 = 'Superheated';
        } else {
          const x4 = Math.max(0, Math.min(1, (s4 - sf1) / (sg1 - sf1)));
          h4 = hf1 + x4 * hfg1;
          T4 = T1;
          label4 = `Wet (x=${x4.toFixed(2)})`;
        }

        const st1: CycleStatePoint = { state: '1 (Pump In)', T: T1, P: P1, h: h1, s: s1, label: 'Sat Liquid' };
        const st2: CycleStatePoint = { state: '2 (Boiler In)', T: T2, P: P2, h: h2, s: s2, label: 'Comp Liquid' };
        const st2f: CycleStatePoint = { state: '2f (Boiler Sat L)', T: Tsat2, P: P2, h: hf2, s: sf2, label: 'Sat Liquid' };
        const st2g: CycleStatePoint = { state: '2g (Boiler Sat V)', T: Tsat2, P: P2, h: h_g2, s: s_g2, label: 'Sat Vapor' };
        const st3: CycleStatePoint = { state: '3 (Turbine In)', T: T3, P: P2, h: h3, s: s3, label: T3 > Tsat2 ? 'Superheated' : 'Sat Vapor' };
        const st4: CycleStatePoint = { state: '4 (Condenser In)', T: T4, P: P1, h: h4, s: s4, label: label4 };

        const table = [st1, st2, st3, st4];
        const chart = [st1, st2, st2f, st2g];
        if (T3 > Tsat2) chart.push(st3);
        chart.push(st4);
        if (s4 > sg1) {
          chart.push({ state: '4g (Cond Sat V)', T: T1, P: P1, h: hg1, s: sg1, label: 'Sat Vapor' });
        }
        chart.push(st1);

        return { tableStates: table, chartStates: chart, error: null };
      }

      if (cycleType === 'brayton') {
        const rp = parseFloat(compRatio);
        const Tmin = parseFloat(tLow) + 273.15; // K
        const Tmax = parseFloat(tHigh) + 273.15; // K
        const k = 1.4;
        const Cp = 1.005;

        if (isNaN(rp) || isNaN(Tmin) || isNaN(Tmax)) {
          return { tableStates: [], chartStates: [], error: 'Enter valid numeric values for pressure ratio and temperatures.' };
        }
        if (rp <= 1 || Tmin <= 0) {
          return { tableStates: [], chartStates: [], error: 'Requires pressure ratio rp > 1 and T1 > -273.15°C.' };
        }

        const T1 = Tmin;
        const P1 = 0.1; // MPa
        const P2 = P1 * rp;
        const T2 = T1 * Math.pow(rp, (k - 1) / k);
        const T3 = Tmax;

        if (T3 <= T2) {
          return {
            tableStates: [],
            chartStates: [],
            error: `Max temperature T3 (${(T3 - 273.15).toFixed(1)}°C) must exceed compressor exit T2 (${(T2 - 273.15).toFixed(1)}°C).`
          };
        }

        const P3 = P2;
        const P4 = P1;
        const T4 = T3 * Math.pow(1 / rp, (k - 1) / k);

        const s1 = 0;
        const s2 = s1;
        const s3 = s2 + Cp * Math.log(T3 / T2);
        const s4 = s3;

        const pts: CycleStatePoint[] = [
          { state: '1 (Comp In)', T: T1 - 273.15, P: P1, h: Cp * T1, s: s1, label: 'Gas' },
          { state: '2 (Comb In)', T: T2 - 273.15, P: P2, h: Cp * T2, s: s2, label: 'Comp Gas' },
          { state: '3 (Turb In)', T: T3 - 273.15, P: P3, h: Cp * T3, s: s3, label: 'Hot Gas' },
          { state: '4 (Turb Out)', T: T4 - 273.15, P: P4, h: Cp * T4, s: s4, label: 'Exhaust' }
        ];
        return { tableStates: pts, chartStates: [...pts, pts[0]], error: null };
      }

      if (cycleType === 'otto') {
        const rv = parseFloat(compRatio);
        const Tmin = parseFloat(tLow) + 273.15;
        const Tmax = parseFloat(tHigh) + 273.15;
        const k = 1.4;
        const Cv = 0.718;

        if (isNaN(rv) || isNaN(Tmin) || isNaN(Tmax)) {
          return { tableStates: [], chartStates: [], error: 'Enter valid numeric values for compression ratio and temperatures.' };
        }
        if (rv <= 1 || Tmin <= 0) {
          return { tableStates: [], chartStates: [], error: 'Requires compression ratio r > 1 and T1 > -273.15°C.' };
        }

        const T1 = Tmin;
        const T2 = T1 * Math.pow(rv, k - 1);
        const T3 = Tmax;

        if (T3 <= T2) {
          return {
            tableStates: [],
            chartStates: [],
            error: `Max temperature T3 (${(T3 - 273.15).toFixed(1)}°C) must exceed compression exit T2 (${(T2 - 273.15).toFixed(1)}°C).`
          };
        }

        const T4 = T3 * Math.pow(1 / rv, k - 1);

        const s1 = 0;
        const s2 = s1;
        const s3 = s2 + Cv * Math.log(T3 / T2);
        const s4 = s3;

        const pts: CycleStatePoint[] = [
          { state: '1 (Comp In)', T: T1 - 273.15, P: 0.1, h: Cv * T1, s: s1, label: 'Gas' },
          { state: '2 (Heat In)', T: T2 - 273.15, P: 0.1 * Math.pow(rv, k), h: Cv * T2, s: s2, label: 'Comp Gas' },
          { state: '3 (Exp In)', T: T3 - 273.15, P: (T3 / T2) * (0.1 * Math.pow(rv, k)), h: Cv * T3, s: s3, label: 'Hot Gas' },
          { state: '4 (Heat Out)', T: T4 - 273.15, P: 0.1 * (T4 / T1), h: Cv * T4, s: s4, label: 'Exhaust' }
        ];
        return { tableStates: pts, chartStates: [...pts, pts[0]], error: null };
      }

      if (cycleType === 'refrigeration') {
        const T_evap = parseFloat(tLow);
        const T_cond = parseFloat(tHigh);

        if (isNaN(T_evap) || isNaN(T_cond)) {
          return { tableStates: [], chartStates: [], error: 'Enter valid numeric evaporator and condenser temperatures.' };
        }
        if (T_evap < -40 || T_cond > 95 || T_evap >= T_cond) {
          return {
            tableStates: [],
            chartStates: [],
            error: 'Requires -40°C ≤ T_evap < T_cond ≤ 95°C for subcritical R-134a vapor compression.'
          };
        }

        // Real R-134a saturation interpolation + isentropic vapor compression
        const P1 = getR134aSatByT(T_evap, 'P');
        const hf1 = getR134aSatByT(T_evap, 'hf');
        const hg1 = getR134aSatByT(T_evap, 'hg');
        const sf1 = getR134aSatByT(T_evap, 'sf');
        const sg1 = getR134aSatByT(T_evap, 'sg');

        const P2 = getR134aSatByT(T_cond, 'P');
        const hf2 = getR134aSatByT(T_cond, 'hf');
        const hg2 = getR134aSatByT(T_cond, 'hg');
        const sf2 = getR134aSatByT(T_cond, 'sf');
        const sg2 = getR134aSatByT(T_cond, 'sg');

        // State 1: Saturated vapor leaving evaporator
        const h1 = hg1;
        const s1 = sg1;

        // State 2: Isentropic compression to P2 (s2 = s1)
        const s2 = s1;
        const Cp_v = 1.05; // kJ/kg·K superheated R-134a vapor average Cp
        let T2: number, h2: number, label2: string;
        if (s2 > sg2) {
          T2 = (T_cond + 273.15) * Math.exp((s2 - sg2) / Cp_v) - 273.15;
          h2 = hg2 + Cp_v * (T2 - T_cond);
          label2 = 'Superheated';
        } else {
          const x2 = Math.max(0, Math.min(1, (s2 - sf2) / (sg2 - sf2)));
          T2 = T_cond;
          h2 = hf2 + x2 * (hg2 - hf2);
          label2 = `Wet (x=${x2.toFixed(2)})`;
        }

        // State 3: Saturated liquid leaving condenser
        const T3 = T_cond;
        const P3 = P2;
        const h3 = hf2;
        const s3 = sf2;

        // State 4: Isenthalpic throttling to P1
        const h4 = h3;
        const T4 = T_evap;
        const P4 = P1;
        const x4 = Math.max(0, Math.min(1, (h4 - hf1) / (hg1 - hf1)));
        const s4 = sf1 + x4 * (sg1 - sf1);

        const st1: CycleStatePoint = { state: '1 (Comp In)', T: T_evap, P: P1, h: h1, s: s1, label: 'Sat Vapor' };
        const st2: CycleStatePoint = { state: '2 (Cond In)', T: T2, P: P2, h: h2, s: s2, label: label2 };
        const st2g: CycleStatePoint = { state: '2g (Cond Sat V)', T: T_cond, P: P2, h: hg2, s: sg2, label: 'Sat Vapor' };
        const st3: CycleStatePoint = { state: '3 (Valve In)', T: T3, P: P3, h: h3, s: s3, label: 'Sat Liquid' };
        const st4: CycleStatePoint = { state: '4 (Evap In)', T: T4, P: P4, h: h4, s: s4, label: `Wet (x=${x4.toFixed(2)})` };

        const table = [st1, st2, st3, st4];
        const chart = s2 > sg2 ? [st1, st2, st2g, st3, st4, st1] : [st1, st2, st3, st4, st1];

        return { tableStates: table, chartStates: chart, error: null };
      }
      return { tableStates: [], chartStates: [], error: null };
    } catch {
      return { tableStates: [], chartStates: [], error: 'Error evaluating thermodynamic cycle states.' };
    }
  }, [cycleType, pHigh, pLow, tHigh, compRatio, tLow]);

  const performance = useMemo(() => {
    if (tableStates.length < 4 || error) return null;
    
    if (cycleType === 'rankine' || cycleType === 'brayton' || cycleType === 'otto') {
      const q_in = tableStates[2].h - tableStates[1].h;
      const w_turb = tableStates[2].h - tableStates[3].h;
      const w_pump = tableStates[1].h - tableStates[0].h;
      const w_net = w_turb - w_pump;
      const eff = q_in !== 0 ? (w_net / q_in) * 100 : NaN;
      return { q_in, w_turb, w_pump, w_net, eff, type: 'power' };
    } else {
      // Refrigeration
      const w_comp = tableStates[1].h - tableStates[0].h;
      const q_in = tableStates[0].h - tableStates[3].h; // Cooling load
      const cop = w_comp > 0 ? q_in / w_comp : NaN;
      return { q_in, w_pump: w_comp, w_turb: 0, w_net: w_comp, eff: cop, type: 'refrigeration' };
    }
  }, [tableStates, cycleType, error]);

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
          onChange={(e) => handleCycleTypeChange(e.target.value)}
          className="w-full md:w-auto px-4 py-3 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl font-bold text-surface-900 dark:text-white outline-none focus:border-orange-500 transition-colors"
        >
          <option value="rankine">Ideal Rankine Cycle</option>
          <option value="brayton">Ideal Brayton Cycle</option>
          <option value="otto">Ideal Otto Cycle</option>
          <option value="refrigeration">Ideal Vapor Compression (R-134a)</option>
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-sm font-bold">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

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
                      <input type="number" step="any" value={pHigh} onChange={e => setPHigh(e.target.value)} className="w-full bg-transparent px-4 py-2 font-bold outline-none" />
                      <span className="px-4 py-2 bg-surface-100 dark:bg-surface-800 text-surface-500 font-bold border-l border-surface-200 dark:border-surface-700">MPa</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-1">Condenser Pressure (P_low)</label>
                    <div className="flex bg-surface-50 dark:bg-surface-900 rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700">
                      <input type="number" step="any" value={pLow} onChange={e => setPLow(e.target.value)} className="w-full bg-transparent px-4 py-2 font-bold outline-none" />
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
                    <input type="number" step="any" value={compRatio} onChange={e => setCompRatio(e.target.value)} className="w-full bg-transparent px-4 py-2 font-bold outline-none" />
                  </div>
                </div>
              )}

              {(cycleType === 'brayton' || cycleType === 'otto' || cycleType === 'refrigeration') && (
                <div>
                  <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-1">
                    {cycleType === 'refrigeration' ? 'Evaporator Temp' : 'Min Temp (T1)'}
                  </label>
                  <div className="flex bg-surface-50 dark:bg-surface-900 rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700">
                    <input type="number" step="any" value={tLow} onChange={e => setTLow(e.target.value)} className="w-full bg-transparent px-4 py-2 font-bold outline-none" />
                    <span className="px-4 py-2 bg-surface-100 dark:bg-surface-800 text-surface-500 font-bold border-l border-surface-200 dark:border-surface-700">°C</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-1">
                  {cycleType === 'refrigeration' ? 'Condenser Temp' : 'Max Temp (T3)'}
                </label>
                <div className="flex bg-surface-50 dark:bg-surface-900 rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700">
                  <input type="number" step="any" value={tHigh} onChange={e => setTHigh(e.target.value)} className="w-full bg-transparent px-4 py-2 font-bold outline-none" />
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
                      <span className="text-lg font-black text-orange-600 dark:text-orange-400">{Number.isFinite(performance.eff) ? `${performance.eff.toFixed(1)}%` : '--'}</span>
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
                      <span className="text-lg font-black text-orange-600 dark:text-orange-400">{Number.isFinite(performance.eff) ? performance.eff.toFixed(2) : '--'}</span>
                    </div>
                    <div className="flex justify-between items-baseline border-b border-orange-200/50 dark:border-orange-800/50 pb-2">
                      <span className="text-sm font-semibold text-orange-700/70 dark:text-orange-300/70">Cooling Load (q_L)</span>
                      <span className="text-base font-bold text-orange-900 dark:text-orange-100">{performance.q_in.toFixed(1)} kJ/kg</span>
                    </div>
                    <div className="flex justify-between items-baseline border-b border-orange-200/50 dark:border-orange-800/50 pb-2">
                      <span className="text-sm font-semibold text-orange-700/70 dark:text-orange-300/70">Compressor Work (w_in)</span>
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
                <LineChart data={chartStates} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="s" type="number" domain={['auto', 'auto']} name="Entropy" stroke="#94a3b8" />
                  <YAxis dataKey="T" type="number" domain={['auto', 'auto']} name="Temperature" unit="°C" stroke="#94a3b8" />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                    labelFormatter={() => ''}
                  />
                  <Line type="linear" dataKey="T" stroke="#f97316" strokeWidth={3} dot={{ r: 5, fill: '#f97316' }} isAnimationActive={false} />
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
                    <th className="px-6 py-4 text-right">{cycleType === 'otto' ? 'u (kJ/kg)' : 'h (kJ/kg)'}</th>
                    <th className="px-6 py-4 text-right">s (kJ/kg·K)</th>
                    <th className="px-6 py-4">Phase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  {tableStates.map((state, i) => (
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
