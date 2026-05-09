import { useState } from 'react';
import { ArrowRightLeft, Search } from 'lucide-react';

interface UnitCategory { name: string; units: { id: string; label: string; toBase: (v: number) => number; fromBase: (v: number) => number }[]; baseUnit: string }

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
    { id: 'psi', label: 'psi', toBase: v => v * 6894.76, fromBase: v => v / 6894.76 },
    { id: 'mmHg', label: 'mmHg (Torr)', toBase: v => v * 133.322, fromBase: v => v / 133.322 },
    { id: 'inHg', label: 'inHg', toBase: v => v * 3386.39, fromBase: v => v / 3386.39 },
  ]},
  { name: 'Mass', baseUnit: 'kg', units: [
    { id: 'kg', label: 'Kilogram (kg)', toBase: v => v, fromBase: v => v },
    { id: 'g', label: 'Gram (g)', toBase: v => v / 1e3, fromBase: v => v * 1e3 },
    { id: 'mg', label: 'Milligram (mg)', toBase: v => v / 1e6, fromBase: v => v * 1e6 },
    { id: 'lb', label: 'Pound (lb)', toBase: v => v * 0.453592, fromBase: v => v / 0.453592 },
    { id: 'oz', label: 'Ounce (oz)', toBase: v => v * 0.0283495, fromBase: v => v / 0.0283495 },
    { id: 'ton', label: 'Metric Ton', toBase: v => v * 1000, fromBase: v => v / 1000 },
  ]},
  { name: 'Length', baseUnit: 'm', units: [
    { id: 'm', label: 'Meter (m)', toBase: v => v, fromBase: v => v },
    { id: 'cm', label: 'Centimeter (cm)', toBase: v => v / 100, fromBase: v => v * 100 },
    { id: 'mm', label: 'Millimeter (mm)', toBase: v => v / 1000, fromBase: v => v * 1000 },
    { id: 'km', label: 'Kilometer (km)', toBase: v => v * 1000, fromBase: v => v / 1000 },
    { id: 'in', label: 'Inch (in)', toBase: v => v * 0.0254, fromBase: v => v / 0.0254 },
    { id: 'ft', label: 'Foot (ft)', toBase: v => v * 0.3048, fromBase: v => v / 0.3048 },
    { id: 'mi', label: 'Mile', toBase: v => v * 1609.34, fromBase: v => v / 1609.34 },
  ]},
  { name: 'Volume', baseUnit: 'L', units: [
    { id: 'L', label: 'Liter (L)', toBase: v => v, fromBase: v => v },
    { id: 'mL', label: 'Milliliter (mL)', toBase: v => v / 1e3, fromBase: v => v * 1e3 },
    { id: 'm3', label: 'Cubic Meter (m³)', toBase: v => v * 1e3, fromBase: v => v / 1e3 },
    { id: 'gal', label: 'US Gallon', toBase: v => v * 3.78541, fromBase: v => v / 3.78541 },
    { id: 'ft3', label: 'Cubic Foot (ft³)', toBase: v => v * 28.3168, fromBase: v => v / 28.3168 },
    { id: 'bbl', label: 'Barrel (bbl)', toBase: v => v * 158.987, fromBase: v => v / 158.987 },
  ]},
  { name: 'Energy', baseUnit: 'J', units: [
    { id: 'J', label: 'Joule (J)', toBase: v => v, fromBase: v => v },
    { id: 'kJ', label: 'Kilojoule (kJ)', toBase: v => v * 1e3, fromBase: v => v / 1e3 },
    { id: 'MJ', label: 'Megajoule (MJ)', toBase: v => v * 1e6, fromBase: v => v / 1e6 },
    { id: 'cal', label: 'Calorie', toBase: v => v * 4.184, fromBase: v => v / 4.184 },
    { id: 'kcal', label: 'Kilocalorie', toBase: v => v * 4184, fromBase: v => v / 4184 },
    { id: 'BTU', label: 'BTU', toBase: v => v * 1055.06, fromBase: v => v / 1055.06 },
    { id: 'kWh', label: 'Kilowatt-hour', toBase: v => v * 3.6e6, fromBase: v => v / 3.6e6 },
    { id: 'eV', label: 'Electron-volt', toBase: v => v * 1.602e-19, fromBase: v => v / 1.602e-19 },
  ]},
  { name: 'Flow Rate', baseUnit: 'm3/s', units: [
    { id: 'm3s', label: 'm³/s', toBase: v => v, fromBase: v => v },
    { id: 'm3h', label: 'm³/h', toBase: v => v / 3600, fromBase: v => v * 3600 },
    { id: 'Ls', label: 'L/s', toBase: v => v / 1e3, fromBase: v => v * 1e3 },
    { id: 'Lmin', label: 'L/min', toBase: v => v / 6e4, fromBase: v => v * 6e4 },
    { id: 'GPM', label: 'US GPM', toBase: v => v * 6.309e-5, fromBase: v => v / 6.309e-5 },
    { id: 'ft3s', label: 'ft³/s (CFS)', toBase: v => v * 0.0283168, fromBase: v => v / 0.0283168 },
    { id: 'bpd', label: 'Barrels/day', toBase: v => v * 1.84e-6, fromBase: v => v / 1.84e-6 },
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

  const cat = CATEGORIES[catIdx];
  const from = cat.units.find(u => u.id === fromUnit) || cat.units[0];
  const to = cat.units.find(u => u.id === toUnit) || cat.units[1];
  const numVal = parseFloat(inputVal) || 0;
  const baseVal = from.toBase(numVal);
  const result = to.fromBase(baseVal);

  const swap = () => { setFromUnit(toUnit); setToUnit(fromUnit); };
  const changeCat = (i: number) => { setCatIdx(i); setFromUnit(CATEGORIES[i].units[0].id); setToUnit(CATEGORIES[i].units[1].id); };

  const filteredCats = search ? CATEGORIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.units.some(u => u.label.toLowerCase().includes(search.toLowerCase()))) : CATEGORIES;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
          <ArrowRightLeft className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Units Converter</h2>
          <p className="text-sm text-slate-500">Engineering unit conversions — {CATEGORIES.reduce((a, c) => a + c.units.length, 0)} units across {CATEGORIES.length} categories</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search categories or units..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-sm font-medium" />
      </div>

      <div className="flex gap-3 mb-8 overflow-x-auto scrollbar-hide">
        {filteredCats.map((c, i) => {
          const origIdx = CATEGORIES.indexOf(c);
          return (
            <button key={c.name} onClick={() => changeCat(origIdx)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                catIdx === origIdx ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>{c.name}</button>
          );
        })}
      </div>

      <div className="glass rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-end">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">From</label>
            <select value={fromUnit} onChange={e => setFromUnit(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold mb-3">
              {cat.units.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
            <input type="number" step="any" value={inputVal} onChange={e => setInputVal(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border-2 border-indigo-300 dark:border-indigo-700 rounded-xl px-4 py-4 text-2xl font-black text-center" />
          </div>

          <button onClick={swap}
            className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 self-center">
            <ArrowRightLeft className="w-5 h-5" />
          </button>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">To</label>
            <select value={toUnit} onChange={e => setToUnit(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold mb-3">
              {cat.units.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
            <div className="w-full bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl px-4 py-4 text-2xl font-black text-center text-emerald-700 dark:text-emerald-300">
              {result.toPrecision(6)}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
          <h4 className="text-[10px] font-black uppercase text-slate-400 mb-3">All conversions from {numVal} {from.label}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cat.units.filter(u => u.id !== fromUnit).map(u => (
              <div key={u.id} className="flex justify-between items-center p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400">{u.label.split('(')[0].trim()}</span>
                <span className="text-xs font-black text-slate-700 dark:text-slate-300">{u.fromBase(baseVal).toPrecision(4)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
