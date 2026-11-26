import { useState } from 'react';
import {
  DollarSign,
  Info,
  Calendar,
  TrendingUp,
  Gauge
} from 'lucide-react';
import { CalcCard, InputRow, ResultBox } from './SharedComponents';

// ─── TAB 1: POWER LAW COST ESTIMATION ───
function PowerLawCost() {
  const [baseCost, setBaseCost] = useState('150000');
  const [baseCap, setBaseCap] = useState('100');
  const [newCap, setNewCap] = useState('250');
  const [exp, setExp] = useState('0.6');
  const [baseYear, setBaseYear] = useState('2010');
  const [newYear, setNewYear] = useState('2023');

  const cepciData: Record<string, number> = {
    '2000': 394, '2005': 468, '2010': 551, '2015': 557, '2018': 603, '2019': 607, '2020': 596, '2021': 708, '2022': 816, '2023': 798, '2024': 805
  };

  const bc = parseFloat(baseCost), bcap = parseFloat(baseCap), ncap = parseFloat(newCap), e = parseFloat(exp);
  const cepciBase = cepciData[baseYear] || 551;
  const cepciNew = cepciData[newYear] || 798;

  const valid = bc > 0 && bcap > 0 && ncap > 0 && isFinite(e);
  const costScale = valid ? Math.pow(ncap / bcap, e) : NaN;
  const costIndex = cepciNew / cepciBase;
  const cNew = valid ? bc * costScale * costIndex : NaN;

  return (
    <CalcCard title="Equipment Cost Scaling (Power Law)" icon={DollarSign}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">C₂ = C₁ × (Size₂/Size₁)ⁿ × (Index₂/Index₁) — Precise economic forecasting adjusted for CEPCI inflation.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 bg-surface-400 rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-surface-900 dark:text-surface-50">Reference Point (Base)</h4>
          </div>
          <InputRow label="Known Cost (C₁)" unit="$" value={baseCost} onChange={setBaseCost} />
          <InputRow label="Known Size (Size₁)" unit="Units" value={baseCap} onChange={setBaseCap} />

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-surface-400">Base Year (CEPCI)</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <select
                value={baseYear}
                onChange={e => setBaseYear(e.target.value)}
                className="w-full pl-12 pr-6 py-3 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50 text-surface-900 dark:text-surface-50 font-bold outline-none focus:border-surface-500 transition-all appearance-none text-sm"
              >
                {Object.keys(cepciData).map(y => <option key={y} value={y}>{y} (Index: {cepciData[y]})</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 bg-primary-600 rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-surface-900 dark:text-surface-50">Design Target</h4>
          </div>
          <InputRow label="Target Size (Size₂)" unit="Units" value={newCap} onChange={setNewCap} />
          <InputRow label="Scaling Exponent (n)" unit="" value={exp} onChange={setExp} />

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-surface-400">Target Year (CEPCI)</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <select
                value={newYear}
                onChange={e => setNewYear(e.target.value)}
                className="w-full pl-12 pr-6 py-3 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50 text-surface-900 dark:text-surface-50 font-bold outline-none focus:border-primary-500 transition-all appearance-none text-sm"
              >
                {Object.keys(cepciData).map(y => <option key={y} value={y}>{y} (Index: {cepciData[y]})</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <ResultBox label="Capacity Factor" value={isNaN(costScale) ? '--' : `${costScale.toFixed(2)}x`} unit="" />
        <ResultBox label="Inflation Multiplier" value={isNaN(costIndex) ? '--' : `${costIndex.toFixed(2)}x`} unit="" />
        <ResultBox label="Estimated Cost" value={isNaN(cNew) ? '--' : `$${cNew.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} unit="" color="#10b981" />
      </div>

      <div className="p-6 bg-surface-50 dark:bg-surface-900/50 rounded-3xl border border-surface-100 dark:border-surface-800 flex items-start gap-4">
        <Info className="w-5 h-5 text-surface-400 mt-1 flex-shrink-0" />
        <div className="space-y-2">
          <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">Common Exponents (n):</p>
          <div className="flex flex-wrap gap-4">
            {[
              { l: 'Centrifugal Pumps', v: '0.6' },
              { l: 'Shell/Tube HX', v: '0.68' },
              { l: 'Agitated Tanks', v: '0.5' },
              { l: 'Fermenters', v: '0.54' },
            ].map(item => (
              <div key={item.l} className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-surface-400">{item.l}:</span>
                <span className="text-[10px] font-black text-primary-600">{item.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CalcCard>
  );
}

// ─── TAB 2: BREAK-EVEN ANALYSIS & PROFITABILITY ───
function BreakEvenAnalysis() {
  const [fixedCost, setFixedCost] = useState('1200000'); // $/yr
  const [varCost, setVarCost] = useState('420');        // $/ton
  const [sellPrice, setSellPrice] = useState('680');    // $/ton
  const [capacity, setCapacity] = useState('10000');    // tons/yr

  const fc = parseFloat(fixedCost);
  const vc = parseFloat(varCost);
  const sp = parseFloat(sellPrice);
  const cap = parseFloat(capacity);

  const contribution = sp - vc;
  const valid = fc >= 0 && vc >= 0 && sp > 0 && cap > 0 && contribution > 0;
  const bepUnits = valid ? fc / contribution : NaN;
  const bepRevenue = valid ? bepUnits * sp : NaN;
  const bepPct = valid ? (bepUnits / cap) * 100 : NaN;
  const annualProfit = valid ? cap * contribution - fc : NaN;
  const marginOfSafety = valid ? ((cap - bepUnits) / cap) * 100 : NaN;

  // SVG chart coordinates
  const W = 560, H = 240, PL = 64, PR = 20, PT = 16, PB = 34;
  const maxQ = Math.max(cap || 1, isFinite(bepUnits) ? bepUnits * 1.25 : 1);
  const maxVal = Math.max(maxQ * (sp || 1), (fc || 0) + maxQ * (vc || 0), 1);
  const sx = (q: number) => PL + (q / maxQ) * (W - PL - PR);
  const sy = (v: number) => H - PB - (v / maxVal) * (H - PT - PB);

  return (
    <CalcCard title="Plant Break-Even & Profitability Analysis" icon={TrendingUp}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">
        Q_BEP = C_fixed / (P_sell − C_var) — Determines minimum production rate for profitability and margin of safety.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <InputRow label="Annual Fixed Cost (C_fixed)" unit="$/yr" value={fixedCost} onChange={setFixedCost} />
          <InputRow label="Variable Cost (C_var)" unit="$/t" value={varCost} onChange={setVarCost} />
        </div>
        <div className="space-y-4">
          <InputRow label="Selling Price (P_sell)" unit="$/t" value={sellPrice} onChange={setSellPrice} />
          <InputRow label="Design Capacity (Q_max)" unit="t/yr" value={capacity} onChange={setCapacity} />
        </div>
      </div>

      {!valid && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-600 dark:text-rose-300">
          Selling price must exceed variable cost per unit (positive contribution margin) for a valid break-even point.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <ResultBox label="Break-Even Rate" value={isNaN(bepUnits) ? '--' : bepUnits.toLocaleString(undefined, { maximumFractionDigits: 0 })} unit="t/yr" color="#3b82f6" />
        <ResultBox label="Break-Even Revenue" value={isNaN(bepRevenue) ? '--' : `$${(bepRevenue / 1e6).toFixed(2)}M`} unit="/yr" color="#6366f1" />
        <ResultBox label="Capacity Utilization" value={isNaN(bepPct) ? '--' : `${bepPct.toFixed(1)}%`} unit="at BEP" color={bepPct <= 70 ? '#10b981' : '#f59e0b'} />
        <ResultBox label="Annual Profit (at 100%)" value={isNaN(annualProfit) ? '--' : `$${(annualProfit / 1e6).toFixed(2)}M`} unit={`MoS ${isNaN(marginOfSafety) ? '--' : marginOfSafety.toFixed(0)}%`} color={annualProfit >= 0 ? '#10b981' : '#ef4444'} />
      </div>

      {valid && (
        <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-950/50 p-5">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3">Revenue vs Total Cost Curve</h4>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none">
            <line x1={PL} y1={H - PB} x2={W - PR} y2={H - PB} className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="1" />
            <line x1={PL} y1={PT} x2={PL} y2={H - PB} className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="1" />
            {/* Fixed cost line */}
            <line x1={sx(0)} y1={sy(fc)} x2={sx(maxQ)} y2={sy(fc)} stroke="#94a3b8" strokeWidth="1.4" strokeDasharray="4 4" />
            {/* Total cost line */}
            <line x1={sx(0)} y1={sy(fc)} x2={sx(maxQ)} y2={sy(fc + maxQ * vc)} stroke="#f59e0b" strokeWidth="2.5" />
            {/* Revenue line */}
            <line x1={sx(0)} y1={sy(0)} x2={sx(maxQ)} y2={sy(maxQ * sp)} stroke="#10b981" strokeWidth="2.5" />
            {/* BEP marker */}
            <line x1={sx(bepUnits)} y1={sy(bepRevenue)} x2={sx(bepUnits)} y2={H - PB} stroke="#3b82f6" strokeWidth="1.2" strokeDasharray="3 3" />
            <circle cx={sx(bepUnits)} cy={sy(bepRevenue)} r="5" fill="#3b82f6" />
            <text x={Math.min(sx(bepUnits) + 8, W - 120)} y={Math.max(sy(bepRevenue) - 8, PT + 12)} className="fill-primary-600 dark:fill-primary-400 text-[10px] font-bold">
              BEP ({bepUnits.toFixed(0)} t/yr)
            </text>
            <text x={W / 2} y={H - 6} textAnchor="middle" className="fill-slate-400 text-[10px] font-bold">Production Rate (t/yr)</text>
            <text x={14} y={H / 2} textAnchor="middle" transform={`rotate(-90 14 ${H / 2})`} className="fill-slate-400 text-[10px] font-bold">$/yr</text>
          </svg>
          <div className="flex flex-wrap gap-4 mt-3 text-[11px] font-bold text-surface-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500 inline-block" /> Total Revenue</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-amber-500 inline-block" /> Total Cost</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 border-t border-dashed border-slate-400 inline-block" /> Fixed Cost</span>
          </div>
        </div>
      )}
    </CalcCard>
  );
}

// ─── TAB 3: ECONOMIC PIPE SIZING (PETERS & TIMMERHAUS) ───
function EconomicPipeSizing() {
  const [massFlow, setMassFlow] = useState('15');     // kg/s
  const [density, setDensity] = useState('1000');     // kg/m3
  const [viscosity, setViscosity] = useState('0.001');// Pa·s
  const [pipeLen, setPipeLen] = useState('100');      // m
  const [elecCost, setElecCost] = useState('0.10');   // $/kWh
  const [opHours, setOpHours] = useState('8000');     // hr/yr

  const m = parseFloat(massFlow);
  const rho = parseFloat(density);
  const mu = parseFloat(viscosity);
  const L = parseFloat(pipeLen);
  const ce = parseFloat(elecCost);
  const hrs = parseFloat(opHours);

  const valid = m > 0 && rho > 0 && mu > 0 && L > 0 && ce > 0 && hrs > 0;
  // Volumetric flow Q (m3/s)
  const Q = valid ? m / rho : NaN;
  // Peters & Timmerhaus / Genereaux turbulent optimum diameter (SI):
  // D_opt (m) = 0.363 * Q^0.45 * rho^0.13 (turbulent carbon steel)
  const dOpt = valid ? 0.363 * Math.pow(Q, 0.45) * Math.pow(rho, 0.13) : NaN;
  const dOptMm = dOpt * 1000;

  // Standard nominal pipe diameters (mm)
  const STD_MM = [25, 40, 50, 65, 80, 100, 125, 150, 200, 250, 300, 350, 400, 500, 600];
  const stdMm = isFinite(dOptMm) ? (STD_MM.find(d => d >= dOptMm) ?? STD_MM[STD_MM.length - 1]) : NaN;
  const D = stdMm / 1000;

  const velocity = valid && D > 0 ? (4 * Q) / (Math.PI * D * D) : NaN;
  const Re = valid && D > 0 ? (rho * velocity * D) / mu : NaN;
  // Haaland friction factor (commercial steel e = 0.045 mm)
  const relRough = 0.000045 / (D || 1);
  const f = isFinite(Re) && Re > 0
    ? (Re < 2300 ? 64 / Re : 1 / Math.pow(-1.8 * Math.log10(Math.pow(relRough / 3.7, 1.11) + 6.9 / Re), 2))
    : NaN;
  const dP = valid && isFinite(f) ? f * (L / D) * (rho * velocity * velocity / 2) : NaN; // Pa
  const pumpKw = valid && isFinite(dP) ? (Q * dP) / (0.7 * 1000) : NaN; // assuming 70% pump eff
  const annualPowerCost = isFinite(pumpKw) ? pumpKw * hrs * ce : NaN;

  return (
    <CalcCard title="Economic Pipe Diameter Sizing" icon={Gauge}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">
        D_opt = 0.363 · Q⁰·⁴⁵ · ρ⁰·¹³ (Peters &amp; Timmerhaus turbulent correlation) — Balances annualized pipe capital cost against pumping energy.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <InputRow label="Mass Flow Rate (ṁ)" unit="kg/s" value={massFlow} onChange={setMassFlow} />
          <InputRow label="Fluid Density (ρ)" unit="kg/m³" value={density} onChange={setDensity} />
          <InputRow label="Dynamic Viscosity (μ)" unit="Pa·s" value={viscosity} onChange={setViscosity} />
        </div>
        <div className="space-y-4">
          <InputRow label="Pipe Length (L)" unit="m" value={pipeLen} onChange={setPipeLen} />
          <InputRow label="Electricity Cost" unit="$/kWh" value={elecCost} onChange={setElecCost} />
          <InputRow label="Operating Hours" unit="hr/yr" value={opHours} onChange={setOpHours} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <ResultBox label="Optimum ID (D_opt)" value={isNaN(dOptMm) ? '--' : dOptMm.toFixed(1)} unit="mm" color="#3b82f6" />
        <ResultBox label="Recommended NPS" value={isNaN(stdMm) ? '--' : `DN ${stdMm}`} unit={`(${(stdMm / 25.4).toFixed(1)} in)`} color="#10b981" />
        <ResultBox label="Fluid Velocity" value={isNaN(velocity) ? '--' : velocity.toFixed(2)} unit="m/s" color={velocity > 3.5 ? '#ef4444' : '#6366f1'} />
        <ResultBox label="Annual Pumping Cost" value={isNaN(annualPowerCost) ? '--' : `$${annualPowerCost.toFixed(0)}`} unit="/yr" color="#f59e0b" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <ResultBox label="Reynolds Number" value={isNaN(Re) ? '--' : Re.toExponential(2)} unit={Re >= 4000 ? 'Turbulent' : 'Laminar/Trans'} color="#8b5cf6" />
        <ResultBox label="Pressure Drop (ΔP)" value={isNaN(dP) ? '--' : (dP / 1000).toFixed(2)} unit="kPa" color="#0ea5e9" />
        <ResultBox label="Shaft Pumping Power" value={isNaN(pumpKw) ? '--' : pumpKw.toFixed(2)} unit="kW (η=70%)" color="#ec4899" />
      </div>

      <div className="p-5 bg-surface-50 dark:bg-surface-900/50 rounded-2xl border border-surface-100 dark:border-surface-800 flex items-start gap-3">
        <Info className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-surface-500 leading-relaxed">
          Typical liquid process pipe velocities are <strong>1.0–3.0 m/s</strong> (to minimize erosion and pressure drop), while gas lines typically operate at <strong>15–30 m/s</strong>. Selecting the next standard DN size above D_opt provides a practical safety margin.
        </p>
      </div>
    </CalcCard>
  );
}

// ─── MAIN MODULE ───
type DesignTab = 'cost' | 'breakeven' | 'pipe';

export default function ProcessDesignModule() {
  const [activeTab, setActiveTab] = useState<DesignTab>('cost');
  const tabs = [
    { id: 'cost', label: 'Power Scaling Law', icon: DollarSign },
    { id: 'breakeven', label: 'Break-Even Analysis', icon: TrendingUp },
    { id: 'pipe', label: 'Economic Pipe Sizing', icon: Gauge },
  ] as const;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-extrabold text-surface-900 dark:text-surface-50 mb-1">Process Design Console</h1>
        <p className="text-surface-500 text-xs">CEPCI cost scaling, plant break-even economics, and optimum pipe sizing.</p>
      </div>

      <div className="flex flex-wrap gap-3 border-b border-surface-200 dark:border-surface-800 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider pb-3 px-1 transition-all whitespace-nowrap ${
              activeTab === tab.id
              ? 'border-b-4 border-primary-600 text-surface-900 dark:text-surface-50'
              : 'text-surface-400 hover:text-surface-600 dark:hover:text-surface-200'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-5xl">
        {activeTab === 'cost' && <PowerLawCost />}
        {activeTab === 'breakeven' && <BreakEvenAnalysis />}
        {activeTab === 'pipe' && <EconomicPipeSizing />}
      </div>
    </div>
  );
}
