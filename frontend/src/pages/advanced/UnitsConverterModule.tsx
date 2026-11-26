import { useState, useEffect } from 'react';
import { ArrowRightLeft, Search, Copy, Check, AlertTriangle } from 'lucide-react';

interface UnitCategory { name: string; units: { id: string; label: string; toBase: (v: number) => number; fromBase: (v: number) => number }[]; baseUnit: string }

const TORR_PA = 101325 / 760; // 133.32236842105263 Pa (exact standard atmosphere / 760)
const PSI_PA = 6894.757293168; // NIST exact lb_f/in^2
const INHG_PA = 3386.388640341; // NIST conventional inHg at 0 °C
const LB_KG = 0.45359237; // NIST exact avoirdupois pound
const OZ_KG = 0.028349523125; // exact lb / 16
const MI_M = 1609.344; // exact international mile
const GAL_L = 3.785411784; // exact US liquid gallon (231 in^3)
const FT3_L = 28.316846592; // exact (0.3048 m)^3 * 1000
const BBL_L = 158.987294928; // exact 42 US gal
const BTU_J = 1055.05585262; // NIST IT BTU
const EV_J = 1.602176634e-19; // SI exact 2019 redefinition
const GPM_M3S = 3.785411784e-3 / 60; // 6.30901964e-5 m^3/s
const FT3S_M3S = 0.028316846592; // exact
const BPD_M3S = 158.987294928e-3 / 86400; // 1.8401307283333333e-6 m^3/s

const CATEGORIES: UnitCategory[] = [
  { name: 'Temperature', baseUnit: 'K', units: [
    { id: 'K', label: 'Kelvin (K)', toBase: v => v, fromBase: v => v },
    { id: 'C', label: 'Celsius (°C)', toBase: v => v + 273.15, fromBase: v => v - 273.15 },
    { id: 'F', label: 'Fahrenheit (°F)', toBase: v => (v - 32) * 5/9 + 273.15, fromBase: v => (v - 273.15) * 9/5 + 32 },
    { id: 'R', label: 'Rankine (°R)', toBase: v => v * 5/9, fromBase: v => v * 9/5 },
  ]},
  { name: 'Pressure', baseUnit: 'Pa', units: [
    { id: 'Pa', label: 'Pascal (Pa)', toBase: v => v, fromBase: v => v },
    { id: 'kPa', label: 'Kilopascal (kPa)', toBase: v => v * 1e3, fromBase: v => v / 1e3 },
    { id: 'MPa', label: 'Megapascal (MPa)', toBase: v => v * 1e6, fromBase: v => v / 1e6 },
    { id: 'bar', label: 'Bar', toBase: v => v * 1e5, fromBase: v => v / 1e5 },
    { id: 'atm', label: 'Atmosphere (atm)', toBase: v => v * 101325, fromBase: v => v / 101325 },
    { id: 'psi', label: 'psi', toBase: v => v * PSI_PA, fromBase: v => v / PSI_PA },
    { id: 'mmHg', label: 'mmHg (Torr)', toBase: v => v * TORR_PA, fromBase: v => v / TORR_PA },
    { id: 'inHg', label: 'inHg', toBase: v => v * INHG_PA, fromBase: v => v / INHG_PA },
  ]},
  { name: 'Mass', baseUnit: 'kg', units: [
    { id: 'kg', label: 'Kilogram (kg)', toBase: v => v, fromBase: v => v },
    { id: 'g', label: 'Gram (g)', toBase: v => v / 1e3, fromBase: v => v * 1e3 },
    { id: 'mg', label: 'Milligram (mg)', toBase: v => v / 1e6, fromBase: v => v * 1e6 },
    { id: 'lb', label: 'Pound (lb)', toBase: v => v * LB_KG, fromBase: v => v / LB_KG },
    { id: 'oz', label: 'Ounce (oz)', toBase: v => v * OZ_KG, fromBase: v => v / OZ_KG },
    { id: 'ton', label: 'Metric Ton', toBase: v => v * 1000, fromBase: v => v / 1000 },
  ]},
  { name: 'Length', baseUnit: 'm', units: [
    { id: 'm', label: 'Meter (m)', toBase: v => v, fromBase: v => v },
    { id: 'cm', label: 'Centimeter (cm)', toBase: v => v / 100, fromBase: v => v * 100 },
    { id: 'mm', label: 'Millimeter (mm)', toBase: v => v / 1000, fromBase: v => v * 1000 },
    { id: 'km', label: 'Kilometer (km)', toBase: v => v * 1000, fromBase: v => v / 1000 },
    { id: 'in', label: 'Inch (in)', toBase: v => v * 0.0254, fromBase: v => v / 0.0254 },
    { id: 'ft', label: 'Foot (ft)', toBase: v => v * 0.3048, fromBase: v => v / 0.3048 },
    { id: 'mi', label: 'Mile', toBase: v => v * MI_M, fromBase: v => v / MI_M },
  ]},
  { name: 'Volume', baseUnit: 'L', units: [
    { id: 'L', label: 'Liter (L)', toBase: v => v, fromBase: v => v },
    { id: 'mL', label: 'Milliliter (mL)', toBase: v => v / 1e3, fromBase: v => v * 1e3 },
    { id: 'm3', label: 'Cubic Meter (m³)', toBase: v => v * 1e3, fromBase: v => v / 1e3 },
    { id: 'gal', label: 'US Gallon', toBase: v => v * GAL_L, fromBase: v => v / GAL_L },
    { id: 'ft3', label: 'Cubic Foot (ft³)', toBase: v => v * FT3_L, fromBase: v => v / FT3_L },
    { id: 'bbl', label: 'Barrel (bbl)', toBase: v => v * BBL_L, fromBase: v => v / BBL_L },
  ]},
  { name: 'Energy', baseUnit: 'J', units: [
    { id: 'J', label: 'Joule (J)', toBase: v => v, fromBase: v => v },
    { id: 'kJ', label: 'Kilojoule (kJ)', toBase: v => v * 1e3, fromBase: v => v / 1e3 },
    { id: 'MJ', label: 'Megajoule (MJ)', toBase: v => v * 1e6, fromBase: v => v / 1e6 },
    { id: 'cal', label: 'Calorie', toBase: v => v * 4.184, fromBase: v => v / 4.184 },
    { id: 'kcal', label: 'Kilocalorie', toBase: v => v * 4184, fromBase: v => v / 4184 },
    { id: 'BTU', label: 'BTU (IT)', toBase: v => v * BTU_J, fromBase: v => v / BTU_J },
    { id: 'kWh', label: 'Kilowatt-hour', toBase: v => v * 3.6e6, fromBase: v => v / 3.6e6 },
    { id: 'eV', label: 'Electron-volt', toBase: v => v * EV_J, fromBase: v => v / EV_J },
  ]},
  { name: 'Flow Rate', baseUnit: 'm3/s', units: [
    { id: 'm3s', label: 'm³/s', toBase: v => v, fromBase: v => v },
    { id: 'm3h', label: 'm³/h', toBase: v => v / 3600, fromBase: v => v * 3600 },
    { id: 'Ls', label: 'L/s', toBase: v => v / 1e3, fromBase: v => v * 1e3 },
    { id: 'Lmin', label: 'L/min', toBase: v => v / 6e4, fromBase: v => v * 6e4 },
    { id: 'GPM', label: 'US GPM', toBase: v => v * GPM_M3S, fromBase: v => v / GPM_M3S },
    { id: 'ft3s', label: 'ft³/s (CFS)', toBase: v => v * FT3S_M3S, fromBase: v => v / FT3S_M3S },
    { id: 'bpd', label: 'Barrels/day', toBase: v => v * BPD_M3S, fromBase: v => v / BPD_M3S },
  ]},
  { name: 'Viscosity', baseUnit: 'Pa·s', units: [
    { id: 'Pas', label: 'Pa·s', toBase: v => v, fromBase: v => v },
    { id: 'mPas', label: 'mPa·s (cP)', toBase: v => v / 1e3, fromBase: v => v * 1e3 },
    { id: 'P', label: 'Poise (P)', toBase: v => v * 0.1, fromBase: v => v / 0.1 },
  ]},
];

export default function UnitsConverterModule() {
  const [catIdx, setCatIdx] = useState(0);
  const [fromUnit, setFromUnit] = useState(CATEGORIES[0].units[0].id);
  const [toUnit, setToUnit] = useState(CATEGORIES[0].units[1].id);
  const [inputVal, setInputVal] = useState('1');
  const [search, setSearch] = useState('');
  const [precision, setPrecision] = useState<number>(6);
  const [copied, setCopied] = useState(false);

  const filteredCats = search.trim()
    ? CATEGORIES.filter(
        c =>
          c.name.toLowerCase().includes(search.trim().toLowerCase()) ||
          c.units.some(u => u.label.toLowerCase().includes(search.trim().toLowerCase()) || u.id.toLowerCase().includes(search.trim().toLowerCase()))
      )
    : CATEGORIES;

  // Auto-switch active category when search narrows results and current category is filtered out
  useEffect(() => {
    if (filteredCats.length > 0 && !filteredCats.includes(CATEGORIES[catIdx])) {
      const nextIdx = CATEGORIES.indexOf(filteredCats[0]);
      setCatIdx(nextIdx);
      setFromUnit(CATEGORIES[nextIdx].units[0].id);
      setToUnit(CATEGORIES[nextIdx].units[1].id);
    }
  }, [search, filteredCats.length, catIdx]);

  const cat = CATEGORIES[catIdx];
  const from = cat.units.find(u => u.id === fromUnit) || cat.units[0];
  const to = cat.units.find(u => u.id === toUnit) || cat.units[1];
  const trimmed = inputVal.trim();
  const numVal = trimmed === '' ? NaN : Number(trimmed);
  const hasValidInput = Number.isFinite(numVal);
  const baseVal = hasValidInput ? from.toBase(numVal) : NaN;
  const result = hasValidInput ? to.fromBase(baseVal) : NaN;
  const belowAbsoluteZero = cat.name === 'Temperature' && hasValidInput && baseVal < 0;

  const formattedResult = hasValidInput && Number.isFinite(result)
    ? Number(result.toPrecision(precision)).toString()
    : '—';

  const swap = () => { setFromUnit(toUnit); setToUnit(fromUnit); };
  const changeCat = (i: number) => { setCatIdx(i); setFromUnit(CATEGORIES[i].units[0].id); setToUnit(CATEGORIES[i].units[1].id); };

  const copyResult = () => {
    if (!hasValidInput || formattedResult === '—') return;
    navigator.clipboard?.writeText(`${formattedResult} ${to.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
          <ArrowRightLeft className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-surface-900 dark:text-surface-50">Units Converter</h1>
          <p className="text-sm text-surface-500">NIST high-precision engineering unit conversions — {CATEGORIES.reduce((a, c) => a + c.units.length, 0)} units across {CATEGORIES.length} categories</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-3.5 w-4 h-4 text-surface-400" />
        <input type="text" placeholder="Search categories or units (e.g., psi, BTU, GPM, Kelvin)..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-surface-50 dark:bg-surface-900 border-2 border-surface-200 dark:border-surface-700 rounded-2xl pl-11 pr-4 py-3 text-sm font-medium" />
      </div>

      {filteredCats.length === 0 ? (
        <div className="glass rounded-3xl border border-surface-200 dark:border-surface-800 p-10 text-center">
          <p className="text-sm font-bold text-surface-600 dark:text-surface-300 mb-2">No matching unit categories for "{search}"</p>
          <button onClick={() => setSearch('')} className="px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition-colors">
            Reset Search
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-3 mb-8 overflow-x-auto scrollbar-hide">
            {filteredCats.map((c) => {
              const origIdx = CATEGORIES.indexOf(c);
              return (
                <button key={c.name} onClick={() => changeCat(origIdx)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    catIdx === origIdx ? 'bg-primary-600 text-surface-50 shadow-lg shadow-primary-500/20' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'
                  }`}>{c.name}</button>
              );
            })}
          </div>

          <div className="glass rounded-3xl border border-surface-200 dark:border-surface-800 p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-surface-100 dark:border-surface-800">
              <span className="text-xs font-bold uppercase tracking-wider text-surface-400">Significant Digits / Precision</span>
              <div className="flex items-center gap-1.5">
                {[2, 4, 6, 8].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPrecision(p)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      precision === p
                        ? 'bg-primary-600 text-white'
                        : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'
                    }`}
                  >
                    {p} sig figs
                  </button>
                ))}
              </div>
            </div>

            {belowAbsoluteZero && (
              <div className="mb-6 flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Physical Warning: {numVal} {from.label} equals {baseVal.toFixed(2)} K, which is below absolute zero (0 K / −273.15 °C).</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-end">
              <div>
                <label className="text-[10px] font-black uppercase text-surface-400 tracking-widest mb-2 block">From</label>
                <select value={fromUnit} onChange={e => setFromUnit(e.target.value)}
                  className="w-full bg-surface-50 dark:bg-surface-900 border-2 border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm font-bold mb-3">
                  {cat.units.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
                </select>
                <input type="number" step="any" value={inputVal} onChange={e => setInputVal(e.target.value)}
                  placeholder="Enter value..."
                  className="w-full bg-surface-50 dark:bg-surface-950 border-2 border-primary-300 dark:border-primary-700 rounded-xl px-4 py-4 text-2xl font-black text-center" />
              </div>

              <button onClick={swap}
                title="Swap units"
                className="w-12 h-12 rounded-full bg-primary-600 text-surface-50 flex items-center justify-center hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20 self-center">
                <ArrowRightLeft className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-black uppercase text-surface-400 tracking-widest block">To</label>
                  <button
                    type="button"
                    disabled={!hasValidInput}
                    onClick={copyResult}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-primary-50 text-[10px] font-bold text-surface-600 dark:text-surface-300 hover:text-primary-600 disabled:opacity-40 transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied!' : 'Copy Result'}
                  </button>
                </div>
                <select value={toUnit} onChange={e => setToUnit(e.target.value)}
                  className="w-full bg-surface-50 dark:bg-surface-900 border-2 border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm font-bold mb-3">
                  {cat.units.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
                </select>
                <div className="w-full bg-accent-50 dark:bg-accent-900/20 border-2 border-accent-300 dark:border-accent-700 rounded-xl px-4 py-4 text-2xl font-black text-center text-accent-700 dark:text-accent-300">
                  {formattedResult}
                </div>
              </div>
            </div>

            <div className="mt-8 bg-surface-50 dark:bg-surface-900/50 rounded-2xl p-4 border border-surface-100 dark:border-surface-800">
              <h4 className="text-[10px] font-black uppercase text-surface-400 mb-3">
                All conversions from {hasValidInput ? numVal : '—'} {from.label}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {cat.units.filter(u => u.id !== fromUnit).map(u => (
                  <div key={u.id} className="flex justify-between items-center p-2 bg-surface-50 dark:bg-surface-900 rounded-lg border border-surface-100 dark:border-surface-800">
                    <span className="text-[10px] font-bold text-surface-400">{u.label.split('(')[0].trim()}</span>
                    <span className="text-xs font-black text-surface-700 dark:text-surface-300">
                      {hasValidInput ? Number(u.fromBase(baseVal).toPrecision(precision)).toString() : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
