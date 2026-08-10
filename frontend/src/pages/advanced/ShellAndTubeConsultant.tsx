import { useState, useMemo } from 'react';
import { 
  ValidationInputRow, 
  StepByStepDisplay
} from './SharedComponents';
import { Network, Droplets, Maximize2, ToggleLeft, ToggleRight, Settings, AlertTriangle } from 'lucide-react';

const positiveRule = { rule: (v: number) => v > 0, message: 'Must be > 0' };

// ══════════════════════════════════════════════════════════
// Rigorous F-factor for 1-shell, 2N-tube-pass (TEMA formula)
// ══════════════════════════════════════════════════════════
function calcCorrectionF(R: number, P: number): number {
  if (P <= 0 || P >= 1 || R < 0 || isNaN(R) || isNaN(P)) return NaN;

  const sq = Math.sqrt(R * R + 1);

  if (Math.abs(R - 1) < 1e-6) {
    // ── Limiting form for R → 1 ──
    // F = (P√2) / [(1−P) × ln((2 − P(2−√2)) / (2 − P(2+√2)))]
    const sqrt2 = Math.SQRT2;
    const a1 = 2 - P * (2 - sqrt2);
    const a2 = 2 - P * (2 + sqrt2);
    if (a1 <= 0 || a2 <= 0) return NaN;
    const ratio = a1 / a2;
    if (ratio <= 0) return NaN;
    const den = (1 - P) * Math.log(ratio);
    if (Math.abs(den) < 1e-12) return NaN;
    const F = (P * sqrt2) / den;
    if (isNaN(F) || F < 0 || F > 1.05) return NaN;
    return Math.min(F, 1.0);
  }

  // ── General case: R ≠ 1 ──
  // F = [√(R²+1)/(R−1)] × ln[(1−P)/(1−RP)] / ln[(2−P(R+1−√(R²+1))) / (2−P(R+1+√(R²+1)))]
  const RP = R * P;
  if (Math.abs(1 - RP) < 1e-10) return NaN;

  const logNumArg = (1 - P) / (1 - RP);
  if (logNumArg <= 0) return NaN;

  const a1 = 2 - P * (R + 1 - sq);
  const a2 = 2 - P * (R + 1 + sq);
  if (a2 === 0) return NaN;
  const denomRatio = a1 / a2;
  if (denomRatio <= 0) return NaN;

  const logDen = Math.log(denomRatio);
  if (Math.abs(logDen) < 1e-12) return NaN;

  const F = (sq / (R - 1)) * Math.log(logNumArg) / logDen;
  if (isNaN(F) || F < 0 || F > 1.05) return NaN;
  return Math.min(F, 1.0);
}

// Safe display helpers
const sf = (v: number, d = 2) => (isNaN(v) || !isFinite(v)) ? '--' : v.toFixed(d);
const se = (v: number, d = 2) => (isNaN(v) || !isFinite(v)) ? '--' : v.toExponential(d);

export default function ShellAndTubeConsultant() {
  const [showSteps, setShowSteps] = useState(true);

  // ── Default values: Hot oil cooled by water (Kern's textbook example) ──
  // Temperatures
  const [Thi, setThi] = useState('120');
  const [Tho, setTho] = useState('60');
  const [Tci, setTci] = useState('30');
  const [Tco, setTco] = useState('45');
  
  // Flows (Shell = Hot, Tube = Cold)
  const [mh, setMh] = useState('20');    // kg/s
  const [mc] = useState('0');     // 0 = auto-calculate from energy balance
  
  // Fluid Properties
  const [cph, setCph] = useState('2100');   // J/kgK
  const [cpc, setCpc] = useState('4180');   // J/kgK
  const [muh, setMuh] = useState('0.0004'); // Pa·s
  const [muc, setMuc] = useState('0.0008'); // Pa·s
  const [kh, setKh] = useState('0.14');     // W/mK
  const [kc, setKc] = useState('0.61');     // W/mK
  const [rhoh, setRhoh] = useState('850');  // kg/m³
  const [rhoc, setRhoc] = useState('998');  // kg/m³

  // Geometry
  const [Ds, setDs] = useState('0.5');      // Shell ID, m
  const [do_t, setDo_t] = useState('0.025');// Tube OD, m
  const [di_t, setDi_t] = useState('0.021');// Tube ID, m
  const [L, setL] = useState('4.0');        // Tube length, m
  const [Pt, setPt] = useState('0.031');    // Pitch, m
  const [B, setB] = useState('0.25');       // Baffle spacing, m
  const [N, setN] = useState('150');        // Tube count
  const [np, setNp] = useState('2');        // Tube passes
  const [Rf, setRf] = useState('0.0003');   // Combined fouling, m²K/W
  const [kwall, setKwall] = useState('50'); // Tube wall conductivity (carbon steel), W/mK
  const [maxDPtStr, setMaxDPtStr] = useState('70');  // Max tube ΔP, kPa
  const [maxDPsStr, setMaxDPsStr] = useState('50');  // Max shell ΔP, kPa

  // ══════════════════════════════════════════════════════════
  // CALCULATION ENGINE — Memoized for performance
  // ══════════════════════════════════════════════════════════
  const results = useMemo(() => {
    const t_hi = parseFloat(Thi);
    const t_ho = parseFloat(Tho);
    const t_ci = parseFloat(Tci);
    const t_co = parseFloat(Tco);
    const m_h = parseFloat(mh);
    const cp_h = parseFloat(cph);
    const cp_c = parseFloat(cpc);
    const d_i = parseFloat(di_t);
    const d_o = parseFloat(do_t);
    const v_mu_c = parseFloat(muc);
    const v_k_c = parseFloat(kc);
    const v_rho_c = parseFloat(rhoc);
    const v_np = parseFloat(np);
    const v_N = parseFloat(N);
    const v_L = parseFloat(L);
    const v_Ds = parseFloat(Ds);
    const v_B = parseFloat(B);
    const v_Pt = parseFloat(Pt);
    const v_mu_h = parseFloat(muh);
    const v_k_h = parseFloat(kh);
    const v_rho_h = parseFloat(rhoh);
    const v_Rf = parseFloat(Rf);
    const v_kwall = parseFloat(kwall);
    const v_maxDPt = parseFloat(maxDPtStr) * 1000; // kPa → Pa
    const v_maxDPs = parseFloat(maxDPsStr) * 1000;

    // ────────── STEP 1: Energy Balance & LMTD ──────────
    const Q = m_h * cp_h * (t_hi - t_ho);
    let m_c = parseFloat(mc);
    if (m_c === 0 || isNaN(m_c)) {
      m_c = (t_co - t_ci) !== 0 ? Q / (cp_c * (t_co - t_ci)) : NaN;
    }

    const dT1 = t_hi - t_co; // Hot end
    const dT2 = t_ho - t_ci; // Cold end
    const tempCross = dT1 <= 0 || dT2 <= 0;

    const LMTD = tempCross ? NaN :
      Math.abs(dT1 - dT2) < 0.001 ? dT1 :
      (dT1 - dT2) / Math.log(dT1 / dT2);

    const R = (t_co - t_ci) !== 0 ? (t_hi - t_ho) / (t_co - t_ci) : NaN;
    const P = (t_hi - t_ci) !== 0 ? (t_co - t_ci) / (t_hi - t_ci) : NaN;
    const F = calcCorrectionF(R, P);
    const dT_true = F * LMTD;

    // ────────── STEP 2: Tube-Side h_t (Dittus-Boelter) ──────────
    const At = (v_N / v_np) * (Math.PI * Math.pow(d_i, 2) / 4);
    const vt = m_c / (v_rho_c * At);
    const Ret = (v_rho_c * vt * d_i) / v_mu_c;
    const Prt = (cp_c * v_mu_c) / v_k_c;
    // n = 0.4 for heating (tube-side fluid is cold, being heated)
    const Nut = 0.023 * Math.pow(Ret, 0.8) * Math.pow(Prt, 0.4);
    const ht = (Nut * v_k_c) / d_i;

    // ────────── STEP 3: Shell-Side h_s (Kern's Method) ──────────
    const As = v_Ds * v_B * (v_Pt - d_o) / v_Pt;
    const vs = m_h / (v_rho_h * As);
    // Square pitch equivalent diameter
    const De = 4 * (Math.pow(v_Pt, 2) - (Math.PI * Math.pow(d_o, 2) / 4)) / (Math.PI * d_o);
    const Res = (v_rho_h * vs * De) / v_mu_h;
    const Prs = (cp_h * v_mu_h) / v_k_h;
    const Nus = 0.36 * Math.pow(Res, 0.55) * Math.pow(Prs, 0.333);
    const hs = (Nus * v_k_h) / De;

    // ────────── STEP 4: Overall U (with wall resistance) ──────────
    const R_wall = (d_o * Math.log(d_o / d_i)) / (2 * v_kwall);
    const U_inv = (1 / hs) + R_wall + (d_o / d_i) * (1 / ht) + v_Rf;
    const U = 1 / U_inv;

    // ────────── STEP 5: Required Area & Overdesign ──────────
    const A_req = Q / (U * dT_true);
    const A_act = v_N * Math.PI * d_o * v_L;
    const overdesign = A_act / A_req;

    // ────────── STEP 6: Tube-Side Pressure Drop (with return losses) ──────────
    const ft = 0.079 * Math.pow(Ret, -0.25);
    // ΔP_t = n_p × (4f × L/d_i + 4) × ρ × v² / 2
    // The "+4" accounts for return/entry losses per pass (Kern's method)
    const dPt = v_np * (4 * ft * (v_L / d_i) + 4) * v_rho_c * Math.pow(vt, 2) / 2;
    const dPt_ok = dPt <= v_maxDPt;

    // ────────── STEP 7: Shell-Side Pressure Drop ──────────
    const fs = 0.14 * Math.pow(Res, -0.15);
    const Gs = v_rho_h * vs;
    const NB = Math.floor((v_L / v_B) - 1);
    const dPs = (fs * Math.pow(Gs, 2) * (NB + 1) * v_Ds) / (2 * v_rho_h * De);
    const dPs_ok = dPs <= v_maxDPs;

    return {
      // Step 1
      Q, m_c, dT1, dT2, tempCross, LMTD, R, P, F, dT_true,
      // Step 2
      At, vt, Ret, Prt, Nut, ht,
      // Step 3
      As, vs, De, Res, Prs, Nus, hs,
      // Step 4
      R_wall, U_inv, U,
      // Step 5
      A_req, A_act, overdesign,
      // Step 6
      ft, dPt, dPt_ok,
      // Step 7
      fs, Gs, NB, dPs, dPs_ok,
      // Parsed values for display
      m_h, cp_h, cp_c, t_hi, t_ho, t_ci, t_co,
      d_i, d_o, v_mu_c, v_k_c, v_rho_c, v_np, v_N, v_L,
      v_Ds, v_B, v_Pt, v_mu_h, v_k_h, v_rho_h, v_Rf, v_kwall,
      v_maxDPt, v_maxDPs
    };
  }, [Thi, Tho, Tci, Tco, mh, mc, cph, cpc, muh, muc, kh, kc, rhoh, rhoc,
      Ds, do_t, di_t, L, Pt, B, N, np, Rf, kwall, maxDPtStr, maxDPsStr]);

  const r = results;

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* ── Header ── */}
      <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>
        <div className="flex items-center gap-4 mb-4 relative z-10">
          <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
            <Network className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Shell & Tube Design Consultant</h2>
            <p className="text-indigo-300 font-medium text-sm mt-1">Kern's Method & Dittus-Boelter • 8-Step Industrial Methodology</p>
          </div>
        </div>
        {/* Temperature cross warning banner */}
        {r.tempCross && (
          <div className="mt-4 flex items-center gap-3 bg-red-900/40 border border-red-500/30 rounded-2xl p-4 relative z-10">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300 font-bold text-sm">Temperature Cross Detected: ΔT₁ = {sf(r.dT1,1)}°C, ΔT₂ = {sf(r.dT2,1)}°C. LMTD is undefined. Adjust temperatures.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ══════════ INPUT PANEL ══════════ */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <Droplets className="w-4 h-4" /> Temperatures & Flows
            </h3>
            <div className="space-y-1">
              <ValidationInputRow label="Shell T,in" unit="°C" value={Thi} onChange={setThi} allowNegative />
              <ValidationInputRow label="Shell T,out" unit="°C" value={Tho} onChange={setTho} allowNegative />
              <ValidationInputRow label="Shell Flow" unit="kg/s" value={mh} onChange={setMh} validationRules={[positiveRule]} />
              <div className="h-px w-full bg-slate-100 dark:bg-slate-800 my-4"></div>
              <ValidationInputRow label="Tube T,in" unit="°C" value={Tci} onChange={setTci} allowNegative />
              <ValidationInputRow label="Tube T,out" unit="°C" value={Tco} onChange={setTco} allowNegative />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <Settings className="w-4 h-4" /> Fluid Properties
            </h3>
            <div className="space-y-1">
              <ValidationInputRow label="Shell Cp" unit="J/kgK" value={cph} onChange={setCph} validationRules={[positiveRule]} />
              <ValidationInputRow label="Tube Cp" unit="J/kgK" value={cpc} onChange={setCpc} validationRules={[positiveRule]} />
              <ValidationInputRow label="Shell μ" unit="Pa·s" value={muh} onChange={setMuh} validationRules={[positiveRule]} />
              <ValidationInputRow label="Tube μ" unit="Pa·s" value={muc} onChange={setMuc} validationRules={[positiveRule]} />
              <ValidationInputRow label="Shell k" unit="W/mK" value={kh} onChange={setKh} validationRules={[positiveRule]} />
              <ValidationInputRow label="Tube k" unit="W/mK" value={kc} onChange={setKc} validationRules={[positiveRule]} />
              <ValidationInputRow label="Shell ρ" unit="kg/m³" value={rhoh} onChange={setRhoh} validationRules={[positiveRule]} />
              <ValidationInputRow label="Tube ρ" unit="kg/m³" value={rhoc} onChange={setRhoc} validationRules={[positiveRule]} />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <Maximize2 className="w-4 h-4" /> Exchanger Geometry
            </h3>
            <div className="space-y-1">
              <ValidationInputRow label="Shell ID" unit="m" value={Ds} onChange={setDs} validationRules={[positiveRule]} />
              <ValidationInputRow label="Tube OD" unit="m" value={do_t} onChange={setDo_t} validationRules={[positiveRule]} />
              <ValidationInputRow label="Tube ID" unit="m" value={di_t} onChange={setDi_t} validationRules={[positiveRule]} />
              <ValidationInputRow label="Length" unit="m" value={L} onChange={setL} validationRules={[positiveRule]} />
              <ValidationInputRow label="Pitch (Square)" unit="m" value={Pt} onChange={setPt} validationRules={[positiveRule]} />
              <ValidationInputRow label="Baffle Spacing" unit="m" value={B} onChange={setB} validationRules={[positiveRule]} />
              <ValidationInputRow label="Tube Count" unit="" value={N} onChange={setN} validationRules={[positiveRule]} />
              <ValidationInputRow label="Tube Passes" unit="" value={np} onChange={setNp} validationRules={[positiveRule]} />
              <ValidationInputRow label="Fouling R_f" unit="m²K/W" value={Rf} onChange={setRf} validationRules={[positiveRule]} />
              <ValidationInputRow label="Wall k (tube)" unit="W/mK" value={kwall} onChange={setKwall} validationRules={[positiveRule]} />
              <div className="h-px w-full bg-slate-100 dark:bg-slate-800 my-4"></div>
              <ValidationInputRow label="Max ΔP (tube)" unit="kPa" value={maxDPtStr} onChange={setMaxDPtStr} validationRules={[positiveRule]} />
              <ValidationInputRow label="Max ΔP (shell)" unit="kPa" value={maxDPsStr} onChange={setMaxDPsStr} validationRules={[positiveRule]} />
            </div>
          </div>
        </div>

        {/* ══════════ RESULTS PANEL ══════════ */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Consultant Output</h4>
            <button 
              onClick={() => setShowSteps(!showSteps)}
              className="flex items-center gap-2 text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            >
              {showSteps ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {showSteps ? 'Hide Steps' : 'Show Steps'}
            </button>
          </div>

          {/* ── Summary Result Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Heat Duty</p>
              <span className="text-xl font-black text-orange-600">{sf(r.Q / 1000, 1)}</span>
              <span className="text-xs font-bold text-slate-500 ml-1">kW</span>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Overall U</p>
              <span className="text-xl font-black text-indigo-600">{sf(r.U, 1)}</span>
              <span className="text-xs font-bold text-slate-500 ml-1">W/m²·K</span>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Overdesign</p>
              <span className={`text-xl font-black ${r.overdesign >= 1.0 ? 'text-emerald-600' : 'text-red-600'}`}>{sf(r.overdesign, 2)}×</span>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">F-Factor</p>
              <span className={`text-xl font-black ${isNaN(r.F) ? 'text-red-600' : r.F >= 0.75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isNaN(r.F) ? 'N/A' : sf(r.F, 3)}
              </span>
            </div>
          </div>

          {/* ── Step-by-Step Calculation Blocks ── */}
          <div className="space-y-6">
            {/* STEP 1: Energy Balance & LMTD */}
            <StepByStepDisplay 
              showSteps={showSteps}
              formula={
                "Step 1 — Energy Balance & LMTD\n" +
                "Q = ṁ_h × Cp_h × (T_h,in − T_h,out)\n" +
                "ṁ_c = Q / (Cp_c × (T_c,out − T_c,in))\n" +
                "ΔT_lm = (ΔT₁ − ΔT₂) / ln(ΔT₁/ΔT₂)\n" +
                "R = (T_h,in − T_h,out) / (T_c,out − T_c,in)\n" +
                "P = (T_c,out − T_c,in) / (T_h,in − T_c,in)\n" +
                "F = TEMA correction (1-shell, 2-tube pass)\n" +
                "ΔT_true = F × ΔT_lm"
              }
              substitution={
                `Q = ${r.m_h} × ${r.cp_h} × (${r.t_hi} − ${r.t_ho}) = ${se(r.Q)} W\n` +
                `ṁ_c = ${se(r.Q)} / (${r.cp_c} × (${r.t_co} − ${r.t_ci})) = ${sf(r.m_c)} kg/s\n` +
                `ΔT₁ = ${r.t_hi} − ${r.t_co} = ${sf(r.dT1, 1)}°C\n` +
                `ΔT₂ = ${r.t_ho} − ${r.t_ci} = ${sf(r.dT2, 1)}°C\n` +
                `ΔT_lm = (${sf(r.dT1,1)} − ${sf(r.dT2,1)}) / ln(${sf(r.dT1,1)} / ${sf(r.dT2,1)}) = ${sf(r.LMTD)}°C\n` +
                `R = ${sf(r.R, 3)}, P = ${sf(r.P, 4)}\n` +
                `F = ${sf(r.F, 4)}\n` +
                `ΔT_true = ${sf(r.F, 4)} × ${sf(r.LMTD)} = ${sf(r.dT_true)}°C`
              }
              result={`Q = ${sf(r.Q / 1000, 1)} kW\nṁ_c = ${sf(r.m_c)} kg/s\nΔT_true = ${sf(r.dT_true)} °C`}
              insight={
                r.tempCross
                  ? "CRITICAL: Temperature cross detected. ΔT₁ and/or ΔT₂ ≤ 0. The LMTD is undefined. Adjust temperatures or switch to a multi-shell arrangement."
                  : isNaN(r.F)
                    ? "WARNING: F-factor could not be computed. This temperature configuration may be physically unrealizable for a 1-shell, 2-tube-pass exchanger."
                    : r.F >= 0.75
                      ? `Acceptable: F = ${sf(r.F, 3)} ≥ 0.75. Design is thermally feasible.`
                      : `WARNING: F = ${sf(r.F, 3)} < 0.75. This indicates a severe temperature cross. Consider multiple shell passes or a different exchanger type.`
              }
            />

            {/* STEP 2: Tube-Side h_t */}
            <StepByStepDisplay 
              showSteps={showSteps}
              formula={
                "Step 2 — Tube-Side HTC (Dittus-Boelter)\n" +
                "A_t = (N/n_p) × (π d_i² / 4)\n" +
                "v_t = ṁ_c / (ρ_c × A_t)\n" +
                "Re = ρ_c × v_t × d_i / μ_c\n" +
                "Pr = Cp_c × μ_c / k_c\n" +
                "Nu = 0.023 × Re^0.8 × Pr^0.4\n" +
                "h_t = Nu × k_c / d_i"
              }
              substitution={
                `A_t = (${sf(r.v_N,0)} / ${sf(r.v_np,0)}) × (π × ${r.d_i}² / 4) = ${se(r.At)} m²\n` +
                `v_t = ${sf(r.m_c)} / (${r.v_rho_c} × ${se(r.At)}) = ${sf(r.vt, 3)} m/s\n` +
                `Re = ${r.v_rho_c} × ${sf(r.vt,3)} × ${r.d_i} / ${r.v_mu_c} = ${sf(r.Ret, 0)}\n` +
                `Pr = ${r.cp_c} × ${r.v_mu_c} / ${r.v_k_c} = ${sf(r.Prt, 3)}\n` +
                `Nu = 0.023 × ${sf(r.Ret,0)}^0.8 × ${sf(r.Prt,3)}^0.4 = ${sf(r.Nut, 1)}`
              }
              result={`h_t = ${sf(r.ht, 1)} W/m²·K`}
              insight={r.Ret > 10000 ? `Turbulent flow confirmed (Re = ${sf(r.Ret,0)} > 10,000). Dittus-Boelter correlation is valid.` : `WARNING: Re = ${sf(r.Ret,0)} < 10,000. Dittus-Boelter requires turbulent flow (Re > 10,000). Results may be inaccurate.`}
            />

            {/* STEP 3: Shell-Side h_s */}
            <StepByStepDisplay 
              showSteps={showSteps}
              formula={
                "Step 3 — Shell-Side HTC (Kern's Method)\n" +
                "A_s = D_s × B × (P_t − d_o) / P_t\n" +
                "v_s = ṁ_h / (ρ_h × A_s)\n" +
                "D_e = 4(P_t² − π d_o²/4) / (π d_o)   [Square Pitch]\n" +
                "Re_s = ρ_h × v_s × D_e / μ_h\n" +
                "Pr_s = Cp_h × μ_h / k_h\n" +
                "Nu_s = 0.36 × Re_s^0.55 × Pr_s^0.333\n" +
                "h_s = Nu_s × k_h / D_e"
              }
              substitution={
                `A_s = ${r.v_Ds} × ${r.v_B} × (${r.v_Pt} − ${r.d_o}) / ${r.v_Pt} = ${se(r.As)} m²\n` +
                `v_s = ${sf(r.m_h)} / (${r.v_rho_h} × ${se(r.As)}) = ${sf(r.vs, 3)} m/s\n` +
                `D_e = ${se(r.De, 4)} m\n` +
                `Re_s = ${r.v_rho_h} × ${sf(r.vs,3)} × ${se(r.De,4)} / ${r.v_mu_h} = ${sf(r.Res, 0)}\n` +
                `Pr_s = ${r.cp_h} × ${r.v_mu_h} / ${r.v_k_h} = ${sf(r.Prs, 3)}\n` +
                `Nu_s = 0.36 × ${sf(r.Res,0)}^0.55 × ${sf(r.Prs,3)}^0.333 = ${sf(r.Nus, 1)}`
              }
              result={`h_s = ${sf(r.hs, 1)} W/m²·K`}
            />

            {/* STEP 4: Overall U */}
            <StepByStepDisplay 
              showSteps={showSteps}
              formula={
                "Step 4 — Overall Heat Transfer Coefficient\n" +
                "R_wall = d_o × ln(d_o/d_i) / (2 × k_wall)\n" +
                "1/U = 1/h_s + R_wall + (d_o/d_i) × (1/h_t) + R_f"
              }
              substitution={
                `R_wall = ${r.d_o} × ln(${r.d_o}/${r.d_i}) / (2 × ${r.v_kwall}) = ${se(r.R_wall)} m²K/W\n` +
                `1/U = 1/${sf(r.hs,1)} + ${se(r.R_wall)} + (${r.d_o}/${r.d_i}) × (1/${sf(r.ht,1)}) + ${r.v_Rf}\n` +
                `1/U = ${sf(1/r.hs, 6)} + ${se(r.R_wall)} + ${sf((r.d_o/r.d_i)/r.ht, 6)} + ${r.v_Rf}\n` +
                `1/U = ${se(r.U_inv)}`
              }
              result={`U = ${sf(r.U, 1)} W/m²·K`}
              insight={`Wall resistance contributes ${sf(r.R_wall / r.U_inv * 100, 1)}% of total thermal resistance. Fouling contributes ${sf(r.v_Rf / r.U_inv * 100, 1)}%.`}
            />

            {/* STEP 5: Area & Overdesign */}
            <StepByStepDisplay 
              showSteps={showSteps}
              formula={
                "Step 5 — Required Area & Overdesign Factor\n" +
                "A_req = Q / (U × ΔT_true)\n" +
                "A_act = N × π × d_o × L\n" +
                "Overdesign = A_act / A_req"
              }
              substitution={
                `A_req = ${se(r.Q)} / (${sf(r.U,1)} × ${sf(r.dT_true)}) = ${sf(r.A_req, 2)} m²\n` +
                `A_act = ${sf(r.v_N,0)} × π × ${r.d_o} × ${r.v_L} = ${sf(r.A_act, 2)} m²`
              }
              result={
                `A_req = ${sf(r.A_req, 2)} m²\n` +
                `A_act = ${sf(r.A_act, 2)} m²\n` +
                `Overdesign = ${sf(r.overdesign, 3)}× (${r.overdesign >= 1.0 ? '+' : ''}${sf((r.overdesign - 1) * 100, 1)}% ${r.overdesign >= 1 ? 'excess' : 'deficit'})`
              }
              insight={
                r.overdesign >= 1.0
                  ? `Acceptable: Actual area exceeds required by ${sf((r.overdesign - 1) * 100, 1)}%. A 10–20% overdesign margin is typical for industrial applications.`
                  : `CRITICAL: Area is insufficient! The exchanger is undersized by ${sf((1 - r.overdesign) * 100, 1)}%. Increase tube count, length, or reduce fouling.`
              }
            />

            {/* STEP 6: Tube-Side Pressure Drop */}
            <StepByStepDisplay 
              showSteps={showSteps}
              formula={
                "Step 6 — Tube-Side Pressure Drop\n" +
                "f = 0.079 × Re^−0.25   (Blasius / Fanning)\n" +
                "ΔP_t = n_p × (4f × L/d_i + 4) × ρ_c × v_t² / 2\n" +
                "    [The '+4' accounts for entry/return losses per pass]"
              }
              substitution={
                `f = 0.079 × ${sf(r.Ret,0)}^−0.25 = ${sf(r.ft, 5)}\n` +
                `Friction term: 4 × ${sf(r.ft,5)} × ${r.v_L}/${r.d_i} = ${sf(4 * r.ft * r.v_L / r.d_i, 2)}\n` +
                `Return loss term: 4\n` +
                `ΔP_t = ${sf(r.v_np,0)} × (${sf(4 * r.ft * r.v_L / r.d_i, 2)} + 4) × ${r.v_rho_c} × ${sf(r.vt,3)}² / 2`
              }
              result={`ΔP_t = ${sf(r.dPt / 1000, 2)} kPa`}
              insight={
                r.dPt_ok
                  ? `Acceptable: ΔP_t = ${sf(r.dPt/1000, 2)} kPa ≤ ${sf(r.v_maxDPt/1000, 0)} kPa (max allowable).`
                  : `WARNING: ΔP_t = ${sf(r.dPt/1000, 2)} kPa EXCEEDS the maximum allowable ${sf(r.v_maxDPt/1000, 0)} kPa! Reduce tube passes, increase tube ID, or shorten tube length.`
              }
            />

            {/* STEP 7: Shell-Side Pressure Drop */}
            <StepByStepDisplay 
              showSteps={showSteps}
              formula={
                "Step 7 — Shell-Side Pressure Drop\n" +
                "f_s = 0.14 × Re_s^−0.15\n" +
                "N_B = L/B − 1\n" +
                "G_s = ρ_h × v_s\n" +
                "ΔP_s = f_s × G_s² × (N_B + 1) × D_s / (2 × ρ_h × D_e)"
              }
              substitution={
                `f_s = 0.14 × ${sf(r.Res,0)}^−0.15 = ${sf(r.fs, 5)}\n` +
                `N_B = ${r.v_L} / ${r.v_B} − 1 = ${sf(r.NB, 0)} baffles\n` +
                `G_s = ${r.v_rho_h} × ${sf(r.vs,3)} = ${sf(r.Gs, 1)} kg/m²·s\n` +
                `ΔP_s = ${sf(r.fs,5)} × ${sf(r.Gs,1)}² × ${sf(r.NB + 1,0)} × ${r.v_Ds} / (2 × ${r.v_rho_h} × ${se(r.De,4)})`
              }
              result={`ΔP_s = ${sf(r.dPs / 1000, 2)} kPa`}
              insight={
                r.dPs_ok
                  ? `Acceptable: ΔP_s = ${sf(r.dPs/1000, 2)} kPa ≤ ${sf(r.v_maxDPs/1000, 0)} kPa (max allowable).`
                  : `WARNING: ΔP_s = ${sf(r.dPs/1000, 2)} kPa EXCEEDS the maximum allowable ${sf(r.v_maxDPs/1000, 0)} kPa! Increase baffle spacing or shell diameter.`
              }
            />

            {/* STEP 8: Engineering Insights */}
            <StepByStepDisplay 
              showSteps={showSteps}
              formula={
                "Step 8 — Engineering Insights & PHE Alternative\n" +
                "A_PHE = Q / (U_PHE × ΔT_lm)   where U_PHE ≈ 3500 W/m²K"
              }
              substitution={
                `A_PHE = ${se(r.Q)} / (3500 × ${sf(r.LMTD)}) = ${sf(r.Q / (3500 * r.LMTD), 1)} m²\n` +
                `vs. A_req (S&T) = ${sf(r.A_req, 1)} m²`
              }
              result={`PHE would need ~${sf(r.Q / (3500 * r.LMTD), 1)} m² vs S&T's ${sf(r.A_req, 1)} m²`}
              insight={
                `Shell & Tube is preferred here due to higher allowable temperature differentials (ΔT = ${sf(r.t_hi - r.t_ci, 0)}°C), ` +
                `tolerance for higher pressures, easier mechanical cleaning, and suitability for process fluids like hydrocarbons. ` +
                `A Plate HE would need ${sf((1 - r.Q/(3500*r.LMTD)/r.A_req) * 100, 0)}% less area but cannot handle the thermal/mechanical conditions.`
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
