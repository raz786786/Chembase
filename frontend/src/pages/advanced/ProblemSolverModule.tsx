import { useState } from 'react';
import { BookOpen, Zap, Thermometer, Waves, Layers, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

interface Problem {
  id: string; title: string; category: string; difficulty: string;
  statement: string;
  inputs: { label: string; unit: string; default: number; key: string }[];
  solve: (vals: Record<string, number>) => { answer: string; steps: string[] };
}

const PROBLEMS: Problem[] = [
  {
    id: 'cstr1', title: 'CSTR Sizing for Liquid Phase Reaction', category: 'Reactor', difficulty: 'Medium',
    statement: 'A liquid-phase reaction A → B follows first-order kinetics (rate = kCA). Determine the CSTR volume required to achieve the target conversion.',
    inputs: [
      { label: 'Volumetric Flow Rate (v₀)', unit: 'L/min', default: 10, key: 'v0' },
      { label: 'Inlet Concentration (CA₀)', unit: 'mol/L', default: 2, key: 'ca0' },
      { label: 'Rate Constant (k)', unit: '1/min', default: 0.1, key: 'k' },
      { label: 'Target Conversion (X)', unit: '', default: 0.9, key: 'X' },
    ],
    solve: (v) => {
      const tau = v.X / (v.k * (1 - v.X));
      const V = v.v0 * tau;
      const ca_out = v.ca0 * (1 - v.X);
      return {
        answer: `V = ${V.toFixed(1)} L (τ = ${tau.toFixed(1)} min)`,
        steps: [
          `Step 1: Design equation for CSTR: V = FA₀·X / (-rA)`,
          `Step 2: For 1st order: -rA = k·CA = k·CA₀·(1-X)`,
          `Step 3: Space time τ = X / [k·(1-X)] = ${v.X} / [${v.k} × (1-${v.X})]`,
          `Step 4: τ = ${v.X} / ${(v.k * (1 - v.X)).toFixed(4)} = ${tau.toFixed(2)} min`,
          `Step 5: V = v₀ × τ = ${v.v0} × ${tau.toFixed(2)} = ${V.toFixed(1)} L`,
          `Step 6: Outlet concentration CA = CA₀(1-X) = ${v.ca0}×${1 - v.X} = ${ca_out.toFixed(3)} mol/L`,
        ]
      };
    }
  },
  {
    id: 'hx1', title: 'Shell & Tube Heat Exchanger Area', category: 'Heat Transfer', difficulty: 'Medium',
    statement: 'A counter-current shell & tube HX cools a hot stream. Find the required heat transfer area using the LMTD method.',
    inputs: [
      { label: 'Hot Inlet Temp (Thi)', unit: '°C', default: 120, key: 'thi' },
      { label: 'Hot Outlet Temp (Tho)', unit: '°C', default: 60, key: 'tho' },
      { label: 'Cold Inlet Temp (Tci)', unit: '°C', default: 25, key: 'tci' },
      { label: 'Cold Outlet Temp (Tco)', unit: '°C', default: 80, key: 'tco' },
      { label: 'Heat Duty (Q)', unit: 'kW', default: 500, key: 'Q' },
      { label: 'Overall U', unit: 'W/m²·K', default: 300, key: 'U' },
    ],
    solve: (v) => {
      const dt1 = v.thi - v.tco;
      const dt2 = v.tho - v.tci;
      const lmtd = (dt1 - dt2) / Math.log(dt1 / dt2);
      const A = (v.Q * 1000) / (v.U * lmtd);
      return {
        answer: `A = ${A.toFixed(1)} m² (LMTD = ${lmtd.toFixed(1)} °C)`,
        steps: [
          `Step 1: Counter-current ΔT₁ = Thi - Tco = ${v.thi} - ${v.tco} = ${dt1}°C`,
          `Step 2: ΔT₂ = Tho - Tci = ${v.tho} - ${v.tci} = ${dt2}°C`,
          `Step 3: LMTD = (ΔT₁ - ΔT₂) / ln(ΔT₁/ΔT₂) = (${dt1} - ${dt2}) / ln(${dt1}/${dt2})`,
          `Step 4: LMTD = ${(dt1 - dt2).toFixed(1)} / ${Math.log(dt1 / dt2).toFixed(4)} = ${lmtd.toFixed(2)}°C`,
          `Step 5: Q = U × A × LMTD → A = Q / (U × LMTD)`,
          `Step 6: A = ${v.Q * 1000} / (${v.U} × ${lmtd.toFixed(2)}) = ${A.toFixed(1)} m²`,
        ]
      };
    }
  },
  {
    id: 'pipe1', title: 'Pipe Pressure Drop (Darcy-Weisbach)', category: 'Fluid Mechanics', difficulty: 'Easy',
    statement: 'Calculate the frictional pressure drop in a straight horizontal pipe using the Darcy-Weisbach equation.',
    inputs: [
      { label: 'Pipe Length (L)', unit: 'm', default: 200, key: 'L' },
      { label: 'Pipe Diameter (D)', unit: 'm', default: 0.15, key: 'D' },
      { label: 'Flow Velocity (v)', unit: 'm/s', default: 3, key: 'v' },
      { label: 'Fluid Density (ρ)', unit: 'kg/m³', default: 1000, key: 'rho' },
      { label: 'Friction Factor (f)', unit: '', default: 0.02, key: 'f' },
    ],
    solve: (v) => {
      const dP = v.f * (v.L / v.D) * (v.rho * v.v ** 2 / 2);
      const dP_bar = dP / 1e5;
      const Re_approx = v.rho * v.v * v.D / 0.001;
      return {
        answer: `ΔP = ${dP.toFixed(0)} Pa (${dP_bar.toFixed(2)} bar)`,
        steps: [
          `Step 1: Darcy-Weisbach: ΔP = f × (L/D) × (ρv²/2)`,
          `Step 2: L/D = ${v.L} / ${v.D} = ${(v.L / v.D).toFixed(0)}`,
          `Step 3: ρv²/2 = ${v.rho} × ${v.v}² / 2 = ${(v.rho * v.v ** 2 / 2).toFixed(0)} Pa`,
          `Step 4: ΔP = ${v.f} × ${(v.L / v.D).toFixed(0)} × ${(v.rho * v.v ** 2 / 2).toFixed(0)}`,
          `Step 5: ΔP = ${dP.toFixed(0)} Pa = ${dP_bar.toFixed(2)} bar`,
          `Step 6: Approx. Re = ρvD/μ ≈ ${Re_approx.toFixed(0)} (${Re_approx > 4000 ? 'Turbulent' : Re_approx > 2300 ? 'Transitional' : 'Laminar'})`,
        ]
      };
    }
  },
  {
    id: 'abs1', title: 'Absorption Column Stages (Kremser)', category: 'Mass Transfer', difficulty: 'Hard',
    statement: 'Determine the number of theoretical stages needed for a gas absorption column using the Kremser equation.',
    inputs: [
      { label: 'Inlet Gas Mole Fraction (y₁)', unit: '', default: 0.05, key: 'y1' },
      { label: 'Outlet Gas Mole Fraction (y₂)', unit: '', default: 0.005, key: 'y2' },
      { label: 'Absorption Factor (A)', unit: '', default: 1.4, key: 'A' },
    ],
    solve: (v) => {
      const N = Math.log((v.y1 / v.y2) * (1 - 1 / v.A) + 1 / v.A) / Math.log(v.A);
      const recovery = ((v.y1 - v.y2) / v.y1) * 100;
      return {
        answer: `N = ${N.toFixed(1)} theoretical stages (${recovery.toFixed(1)}% recovery)`,
        steps: [
          `Step 1: Kremser equation: N = ln[(y₁/y₂)(1-1/A) + 1/A] / ln(A)`,
          `Step 2: y₁/y₂ = ${v.y1}/${v.y2} = ${(v.y1 / v.y2).toFixed(1)}`,
          `Step 3: 1 - 1/A = 1 - 1/${v.A} = ${(1 - 1 / v.A).toFixed(4)}`,
          `Step 4: Numerator = ln[(${(v.y1 / v.y2).toFixed(1)})(${(1 - 1 / v.A).toFixed(4)}) + ${(1 / v.A).toFixed(4)}]`,
          `Step 5: N = ${Math.log((v.y1 / v.y2) * (1 - 1 / v.A) + 1 / v.A).toFixed(4)} / ${Math.log(v.A).toFixed(4)} = ${N.toFixed(2)}`,
          `Step 6: Recovery = (y₁-y₂)/y₁ × 100 = ${recovery.toFixed(1)}%`,
        ]
      };
    }
  },
  {
    id: 'pfr1', title: 'PFR Volume for 1st Order Reaction', category: 'Reactor', difficulty: 'Easy',
    statement: 'Determine the volume of a PFR needed to achieve the desired conversion for a first-order liquid-phase reaction.',
    inputs: [
      { label: 'Volumetric Flow Rate (v₀)', unit: 'L/min', default: 15, key: 'v0' },
      { label: 'Rate Constant (k)', unit: '1/min', default: 0.2, key: 'k' },
      { label: 'Target Conversion (X)', unit: '', default: 0.95, key: 'X' },
    ],
    solve: (v) => {
      const tau = -Math.log(1 - v.X) / v.k;
      const V = v.v0 * tau;
      return {
        answer: `V = ${V.toFixed(1)} L (τ = ${tau.toFixed(2)} min)`,
        steps: [
          `Step 1: PFR design equation for 1st order: τ = -ln(1-X) / k`,
          `Step 2: τ = -ln(1-${v.X}) / ${v.k}`,
          `Step 3: τ = -ln(${(1 - v.X).toFixed(4)}) / ${v.k} = ${(-Math.log(1 - v.X)).toFixed(4)} / ${v.k}`,
          `Step 4: τ = ${tau.toFixed(2)} min`,
          `Step 5: V = v₀ × τ = ${v.v0} × ${tau.toFixed(2)} = ${V.toFixed(1)} L`,
          `Step 6: Compare: CSTR would need τ = ${(v.X / (v.k * (1 - v.X))).toFixed(1)} min → ${(v.v0 * v.X / (v.k * (1 - v.X))).toFixed(1)} L (${((v.v0 * v.X / (v.k * (1 - v.X))) / V).toFixed(1)}× larger)`,
        ]
      };
    }
  },
  {
    id: 'pump1', title: 'Centrifugal Pump Power Calculation', category: 'Fluid Mechanics', difficulty: 'Easy',
    statement: 'Calculate the shaft power required for a centrifugal pump given flow conditions and efficiency.',
    inputs: [
      { label: 'Flow Rate (Q)', unit: 'm³/s', default: 0.05, key: 'Q' },
      { label: 'Total Head (H)', unit: 'm', default: 30, key: 'H' },
      { label: 'Fluid Density (ρ)', unit: 'kg/m³', default: 1000, key: 'rho' },
      { label: 'Pump Efficiency (η)', unit: '', default: 0.75, key: 'eta' },
    ],
    solve: (v) => {
      const Phyd = v.rho * 9.81 * v.Q * v.H;
      const Pshaft = Phyd / v.eta;
      const Pmotor = Pshaft * 1.15;
      return {
        answer: `P_shaft = ${(Pshaft / 1000).toFixed(2)} kW (Motor: ${(Pmotor / 1000).toFixed(2)} kW)`,
        steps: [
          `Step 1: Hydraulic power: P_hyd = ρgQH`,
          `Step 2: P_hyd = ${v.rho} × 9.81 × ${v.Q} × ${v.H} = ${Phyd.toFixed(0)} W`,
          `Step 3: P_hyd = ${(Phyd / 1000).toFixed(2)} kW`,
          `Step 4: Shaft power: P_shaft = P_hyd / η = ${(Phyd / 1000).toFixed(2)} / ${v.eta}`,
          `Step 5: P_shaft = ${(Pshaft / 1000).toFixed(2)} kW`,
          `Step 6: Motor size (×1.15 safety): ${(Pmotor / 1000).toFixed(2)} kW → select next standard motor size`,
        ]
      };
    }
  },
];

const CATEGORIES = ['All', 'Reactor', 'Heat Transfer', 'Fluid Mechanics', 'Mass Transfer'];
const DIFF_COLORS: Record<string, string> = { Easy: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20', Medium: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20', Hard: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' };
const CAT_ICONS: Record<string, any> = { Reactor: Zap, 'Heat Transfer': Thermometer, 'Fluid Mechanics': Waves, 'Mass Transfer': Layers };

export default function ProblemSolverModule() {
  const [cat, setCat] = useState('All');
  const [openId, setOpenId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, Record<string, number>>>({});
  const [solutions, setSolutions] = useState<Record<string, { answer: string; steps: string[] }>>({});

  const filtered = cat === 'All' ? PROBLEMS : PROBLEMS.filter(p => p.category === cat);

  const getVal = (pid: string, key: string, def: number) => values[pid]?.[key] ?? def;
  const setVal = (pid: string, key: string, v: number) => setValues(prev => ({ ...prev, [pid]: { ...prev[pid], [key]: v } }));

  const solveProblem = (p: Problem) => {
    const vals: Record<string, number> = {};
    for (const inp of p.inputs) vals[inp.key] = getVal(p.id, inp.key, inp.default);
    setSolutions(prev => ({ ...prev, [p.id]: p.solve(vals) }));
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Problem Solver</h2>
          <p className="text-sm text-slate-500">Ready-to-use engineering problems with step-by-step solutions</p>
        </div>
      </div>

      <div className="flex gap-3 mb-8 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              cat === c ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>{c}</button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(p => {
          const Icon = CAT_ICONS[p.category] || Zap;
          const isOpen = openId === p.id;
          const sol = solutions[p.id];
          return (
            <div key={p.id} className="glass rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <button onClick={() => setOpenId(isOpen ? null : p.id)}
                className="w-full p-6 flex items-center gap-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-slate-900 dark:text-white">{p.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${DIFF_COLORS[p.difficulty]}`}>{p.difficulty}</span>
                  </div>
                  <p className="text-xs text-slate-500">{p.category}</p>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>

              {isOpen && (
                <div className="px-6 pb-6 animate-in fade-in duration-300">
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 mb-6 border border-slate-100 dark:border-slate-800">
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{p.statement}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {p.inputs.map(inp => (
                      <div key={inp.key}>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{inp.label}</label>
                        <div className="flex items-center gap-2">
                          <input type="number" step="any" value={getVal(p.id, inp.key, inp.default)}
                            onChange={e => setVal(p.id, inp.key, parseFloat(e.target.value) || 0)}
                            className="flex-grow bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold" />
                          {inp.unit && <span className="text-xs font-bold text-slate-400 w-16">{inp.unit}</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => solveProblem(p)}
                    className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 mb-6">
                    <Zap className="w-4 h-4" /> Solve Step-by-Step
                  </button>

                  {sol && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                          <span className="text-[10px] font-black uppercase text-emerald-600">Final Answer</span>
                        </div>
                        <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">{sol.answer}</p>
                      </div>
                      <div className="space-y-2">
                        {sol.steps.map((step, i) => (
                          <div key={i} className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                            <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-[10px] font-black shrink-0">{i + 1}</span>
                            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium font-mono">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
