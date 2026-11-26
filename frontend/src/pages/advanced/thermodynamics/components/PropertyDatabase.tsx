import { useState } from 'react';
import { Database, Thermometer, Droplets, Download, Search } from 'lucide-react';
import { STEAM_SAT_DATA } from '../engines/SteamEngine';

const TAB_TITLES: Record<string, string> = {
  steam_sat_t: 'Saturated Steam — Temperature Table',
  steam_sat_p: 'Saturated Steam — Pressure Table',
  steam_super: 'Superheated Steam Table',
  r134a: 'Refrigerant R-134a Saturated Table',
  r410a: 'Refrigerant R-410A Saturated Table',
  ammonia: 'Ammonia (NH₃) Saturated Table',
  air: 'Ideal Gas Air Properties',
};

export default function PropertyDatabase() {
  const [activeTab, setActiveTab] = useState('steam_sat_t');
  const [searchTerm, setSearchTerm] = useState('');

  const STEAM_SAT_P_DATA = STEAM_SAT_DATA.map(d => ({ ...d })).sort((a, b) => a.P - b.P).slice(0, 50);
  const STEAM_SUPERHEATED_DATA = [
    { T: 200, P: 0.1, v: 2.172, h: 2875.3, s: 7.8343 },
    { T: 300, P: 0.1, v: 2.639, h: 3074.3, s: 8.2158 },
    { T: 400, P: 0.1, v: 3.103, h: 3278.2, s: 8.5435 },
    { T: 200, P: 1.0, v: 0.206, h: 2827.9, s: 6.6940 },
    { T: 300, P: 1.0, v: 0.258, h: 3051.2, s: 7.1229 }
  ];

  const R134A_DATA = [
    { T: -40, P: 0.051, vf: 0.0007, vg: 0.360, hf: 0, hfg: 225.8, hg: 225.8, sf: 0, sg: 0.968 },
    { T: -20, P: 0.133, vf: 0.0007, vg: 0.147, hf: 25.4, hfg: 212.9, hg: 238.3, sf: 0.104, sg: 0.945 },
    { T: 0, P: 0.293, vf: 0.0007, vg: 0.069, hf: 51.8, hfg: 198.6, hg: 250.4, sf: 0.205, sg: 0.931 },
    { T: 20, P: 0.572, vf: 0.0008, vg: 0.036, hf: 79.3, hfg: 182.2, hg: 261.5, sf: 0.300, sg: 0.922 },
    { T: 40, P: 1.017, vf: 0.0008, vg: 0.020, hf: 108.2, hfg: 163.0, hg: 271.2, sf: 0.394, sg: 0.914 }
  ];

  const R410A_DATA = [
    { T: -40, P: 0.175, vf: 0.0007, vg: 0.140, hf: 1.2, hfg: 256.7, hg: 257.9, sf: 0.005, sg: 1.107 },
    { T: -20, P: 0.400, vf: 0.0008, vg: 0.065, hf: 28.2, hfg: 242.0, hg: 270.2, sf: 0.111, sg: 1.066 },
    { T: 0, P: 0.798, vf: 0.0008, vg: 0.033, hf: 56.4, hfg: 224.6, hg: 281.0, sf: 0.215, sg: 1.036 },
    { T: 20, P: 1.444, vf: 0.0009, vg: 0.017, hf: 86.1, hfg: 203.4, hg: 289.5, sf: 0.316, sg: 1.009 }
  ];

  const AMMONIA_DATA = [
    { T: -40, P: 0.071, vf: 0.0014, vg: 1.554, hf: 0, hfg: 1385, hg: 1385, sf: 0, sg: 5.94 },
    { T: -20, P: 0.190, vf: 0.0015, vg: 0.623, hf: 89.2, hfg: 1327, hg: 1416, sf: 0.36, sg: 5.60 },
    { T: 0, P: 0.429, vf: 0.0015, vg: 0.289, hf: 180.3, hfg: 1262, hg: 1442, sf: 0.70, sg: 5.32 },
    { T: 20, P: 0.857, vf: 0.0016, vg: 0.149, hf: 274.6, hfg: 1186, hg: 1461, sf: 1.03, sg: 5.08 }
  ];

  const AIR_DATA = [
    { T: 250, h: 250.05, pr: 0.7329, u: 178.28, vr: 979, s: 1.5191 },
    { T: 300, h: 300.19, pr: 1.3860, u: 214.07, vr: 621.2, s: 1.7020 },
    { T: 350, h: 350.49, pr: 2.379, u: 250.02, vr: 422.5, s: 1.8570 },
    { T: 400, h: 400.98, pr: 3.806, u: 286.16, vr: 301.6, s: 1.9919 },
    { T: 500, h: 503.02, pr: 8.411, u: 359.49, vr: 170.6, s: 2.2195 }
  ];

  const handleExportCsv = () => {
    let rows: Record<string, number | undefined>[] = STEAM_SAT_DATA as any;
    if (activeTab === 'steam_sat_p') rows = STEAM_SAT_P_DATA as any;
    else if (activeTab === 'steam_super') rows = STEAM_SUPERHEATED_DATA as any;
    else if (activeTab === 'r134a') rows = R134A_DATA as any;
    else if (activeTab === 'r410a') rows = R410A_DATA as any;
    else if (activeTab === 'ammonia') rows = AMMONIA_DATA as any;
    else if (activeTab === 'air') rows = AIR_DATA as any;
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => r[h] ?? '').join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_table.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderTable = () => {
    if (activeTab === 'steam_sat_t' || activeTab === 'steam_sat_p' || activeTab === 'r134a' || activeTab === 'r410a' || activeTab === 'ammonia') {
      let data = STEAM_SAT_DATA;
      if (activeTab === 'steam_sat_p') data = STEAM_SAT_P_DATA;
      else if (activeTab === 'r134a') data = R134A_DATA as any;
      else if (activeTab === 'r410a') data = R410A_DATA as any;
      else if (activeTab === 'ammonia') data = AMMONIA_DATA as any;

      const filtered = data.filter(row =>
        row.T.toString().includes(searchTerm) ||
        row.P.toString().includes(searchTerm)
      );

      return (
        <table className="w-full text-xs text-right relative">
          <thead className="bg-surface-100 dark:bg-surface-800 text-[11px] font-black uppercase tracking-wider text-surface-500 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-2.5 py-3 text-left border-r border-surface-200 dark:border-surface-700 whitespace-nowrap">T (°C)</th>
              <th className="px-2.5 py-3 border-r border-surface-200 dark:border-surface-700 whitespace-nowrap">P (MPa)</th>
              <th className="px-2.5 py-3 whitespace-nowrap">v_f</th>
              <th className="px-2.5 py-3 border-r border-surface-200 dark:border-surface-700 whitespace-nowrap">v_g</th>
              <th className="px-2.5 py-3 whitespace-nowrap">h_f</th>
              <th className="px-2.5 py-3 whitespace-nowrap">h_fg</th>
              <th className="px-2.5 py-3 border-r border-surface-200 dark:border-surface-700 whitespace-nowrap">h_g</th>
              <th className="px-2.5 py-3 whitespace-nowrap">s_f</th>
              <th className="px-2.5 py-3 whitespace-nowrap">s_g</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {filtered.map((row, idx) => (
              <tr key={idx} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors">
                <td className="px-2.5 py-2.5 text-left font-bold text-surface-900 dark:text-white border-r border-surface-100 dark:border-surface-800">{row.T}</td>
                <td className="px-2.5 py-2.5 font-semibold text-emerald-600 dark:text-emerald-400 border-r border-surface-100 dark:border-surface-800">{row.P.toFixed(4)}</td>
                <td className="px-2.5 py-2.5 text-surface-600 dark:text-surface-300">{row.vf?.toFixed(5) || '-'}</td>
                <td className="px-2.5 py-2.5 text-surface-600 dark:text-surface-300 border-r border-surface-100 dark:border-surface-800">{row.vg?.toFixed(4) || '-'}</td>
                <td className="px-2.5 py-2.5 text-surface-600 dark:text-surface-300">{row.hf?.toFixed(1) || '-'}</td>
                <td className="px-2.5 py-2.5 text-surface-600 dark:text-surface-300">{row.hfg?.toFixed(1) || '-'}</td>
                <td className="px-2.5 py-2.5 text-surface-600 dark:text-surface-300 border-r border-surface-100 dark:border-surface-800">{row.hg?.toFixed(1) || '-'}</td>
                <td className="px-2.5 py-2.5 text-surface-600 dark:text-surface-300">{row.sf?.toFixed(4) || '-'}</td>
                <td className="px-2.5 py-2.5 text-surface-600 dark:text-surface-300">{row.sg?.toFixed(4) || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else if (activeTab === 'steam_super') {
      const filtered = STEAM_SUPERHEATED_DATA.filter(row => row.T.toString().includes(searchTerm) || row.P.toString().includes(searchTerm));
      return (
        <table className="w-full text-xs text-right relative">
          <thead className="bg-surface-100 dark:bg-surface-800 text-[11px] font-black uppercase tracking-wider text-surface-500 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-3 py-3 text-left border-r border-surface-200 dark:border-surface-700">T (°C)</th>
              <th className="px-3 py-3 border-r border-surface-200 dark:border-surface-700">P (MPa)</th>
              <th className="px-3 py-3">v (m³/kg)</th>
              <th className="px-3 py-3 border-r border-surface-200 dark:border-surface-700">h (kJ/kg)</th>
              <th className="px-3 py-3">s (kJ/kg·K)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {filtered.map((row, idx) => (
              <tr key={idx} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors">
                <td className="px-3 py-2.5 text-left font-bold text-surface-900 dark:text-white border-r border-surface-100 dark:border-surface-800">{row.T}</td>
                <td className="px-3 py-2.5 font-semibold text-emerald-600 dark:text-emerald-400 border-r border-surface-100 dark:border-surface-800">{row.P.toFixed(4)}</td>
                <td className="px-3 py-2.5 text-surface-600 dark:text-surface-300">{row.v.toFixed(4)}</td>
                <td className="px-3 py-2.5 text-surface-600 dark:text-surface-300 border-r border-surface-100 dark:border-surface-800">{row.h.toFixed(1)}</td>
                <td className="px-3 py-2.5 text-surface-600 dark:text-surface-300">{row.s.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else if (activeTab === 'air') {
      const filtered = AIR_DATA.filter(row => row.T.toString().includes(searchTerm));
      return (
        <table className="w-full text-xs text-right relative">
          <thead className="bg-surface-100 dark:bg-surface-800 text-[11px] font-black uppercase tracking-wider text-surface-500 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-3 py-3 text-left border-r border-surface-200 dark:border-surface-700">T (K)</th>
              <th className="px-3 py-3">h (kJ/kg)</th>
              <th className="px-3 py-3">Pr</th>
              <th className="px-3 py-3 border-r border-surface-200 dark:border-surface-700">u (kJ/kg)</th>
              <th className="px-3 py-3">vr</th>
              <th className="px-3 py-3">s° (kJ/kg·K)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {filtered.map((row, idx) => (
              <tr key={idx} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors">
                <td className="px-3 py-2.5 text-left font-bold text-surface-900 dark:text-white border-r border-surface-100 dark:border-surface-800">{row.T}</td>
                <td className="px-3 py-2.5 text-surface-600 dark:text-surface-300">{row.h.toFixed(2)}</td>
                <td className="px-3 py-2.5 text-surface-600 dark:text-surface-300">{row.pr.toFixed(4)}</td>
                <td className="px-3 py-2.5 text-surface-600 dark:text-surface-300 border-r border-surface-100 dark:border-surface-800">{row.u.toFixed(2)}</td>
                <td className="px-3 py-2.5 text-surface-600 dark:text-surface-300">{row.vr.toFixed(1)}</td>
                <td className="px-3 py-2.5 text-surface-600 dark:text-surface-300">{row.s.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-surface-800 rounded-3xl p-6 border border-surface-200 dark:border-surface-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
            <Database className="w-7 h-7 text-emerald-500" /> Thermodynamic Property Database
          </h2>
          <p className="text-surface-500 mt-1">Centralized reference tables for steam, refrigerants, and ideal gases.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2 bg-surface-100 dark:bg-surface-900 text-surface-600 dark:text-surface-300 font-bold rounded-xl hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-56 shrink-0 space-y-2">
          <div className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3 ml-2">Water &amp; Steam</div>
          <button
            onClick={() => setActiveTab('steam_sat_t')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'steam_sat_t' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
            }`}
          >
            <Thermometer className="w-4 h-4" /> Saturated (Temp)
          </button>
          <button
            onClick={() => setActiveTab('steam_sat_p')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'steam_sat_p' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
            }`}
          >
            <Droplets className="w-4 h-4" /> Saturated (Press)
          </button>
          <button
            onClick={() => setActiveTab('steam_super')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'steam_super' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
            }`}
          >
            <Database className="w-4 h-4" /> Superheated
          </button>

          <div className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3 mt-6 ml-2">Refrigerants</div>
          {(['r134a', 'r410a', 'ammonia'] as const).map(id => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full text-left px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                activeTab === id ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
              }`}
            >
              {id === 'r134a' ? 'R-134a' : id === 'r410a' ? 'R-410A' : 'Ammonia (NH₃)'}
            </button>
          ))}

          <div className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3 mt-6 ml-2">Ideal Gases</div>
          <button
            onClick={() => setActiveTab('air')}
            className={`w-full text-left px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'air' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
            }`}
          >
            Air Properties
          </button>
        </div>

        {/* Data Table */}
        <div className="flex-grow min-w-0 bg-white dark:bg-surface-800 rounded-3xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 flex flex-wrap justify-between items-center gap-3">
            <h3 className="font-bold text-surface-900 dark:text-white tracking-wide text-sm">{TAB_TITLES[activeTab] || activeTab}</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="Search T or P..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex-grow overflow-auto relative">
            {renderTable()}
          </div>
        </div>
      </div>
    </div>
  );
}
