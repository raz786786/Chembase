import React, { useState } from 'react';
import { Database, Thermometer, Droplets, Download, Search } from 'lucide-react';
import { STEAM_SAT_DATA } from '../engines/SteamEngine';

export default function PropertyDatabase() {
  const [activeTab, setActiveTab] = useState('steam_sat');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSteam = STEAM_SAT_DATA.filter(row => 
    row.T.toString().includes(searchTerm) || 
    row.P.toString().includes(searchTerm)
  );

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
          <button className="flex items-center gap-2 px-4 py-2 bg-surface-100 dark:bg-surface-900 text-surface-600 dark:text-surface-300 font-bold rounded-xl hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 space-y-2">
          <div className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-4 ml-2">Water & Steam</div>
          <button 
            onClick={() => setActiveTab('steam_sat')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'steam_sat' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
            }`}
          >
            <Thermometer className="w-5 h-5" /> Saturated (Temp)
          </button>
          <button 
            disabled
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-surface-400 cursor-not-allowed"
          >
            <Droplets className="w-5 h-5" /> Saturated (Press)
          </button>
          <button 
            disabled
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-surface-400 cursor-not-allowed"
          >
            <Database className="w-5 h-5" /> Superheated
          </button>
          
          <div className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-4 mt-8 ml-2">Refrigerants</div>
          <button disabled className="w-full text-left px-4 py-2 rounded-xl font-bold text-surface-400 cursor-not-allowed">R-134a</button>
          <button disabled className="w-full text-left px-4 py-2 rounded-xl font-bold text-surface-400 cursor-not-allowed">R-410A</button>
          <button disabled className="w-full text-left px-4 py-2 rounded-xl font-bold text-surface-400 cursor-not-allowed">Ammonia (NH3)</button>

          <div className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-4 mt-8 ml-2">Ideal Gases</div>
          <button disabled className="w-full text-left px-4 py-2 rounded-xl font-bold text-surface-400 cursor-not-allowed">Air Properties</button>
        </div>

        {/* Data Table */}
        <div className="flex-grow bg-white dark:bg-surface-800 rounded-3xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden flex flex-col h-[600px]">
          
          <div className="p-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 flex justify-between items-center">
            <h3 className="font-bold text-surface-900 dark:text-white">Saturated Water (Temperature Table)</h3>
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
            <table className="w-full text-sm text-right relative">
              <thead className="bg-surface-100 dark:bg-surface-800 text-xs font-black uppercase tracking-wider text-surface-500 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-4 text-left border-r border-surface-200 dark:border-surface-700">T (°C)</th>
                  <th className="px-4 py-4 border-r border-surface-200 dark:border-surface-700">P (MPa)</th>
                  <th className="px-4 py-4" title="Specific Volume of Sat Liquid">v_f (m³/kg)</th>
                  <th className="px-4 py-4 border-r border-surface-200 dark:border-surface-700" title="Specific Volume of Sat Vapor">v_g (m³/kg)</th>
                  <th className="px-4 py-4" title="Enthalpy of Sat Liquid">h_f (kJ/kg)</th>
                  <th className="px-4 py-4" title="Enthalpy of Evaporation">h_fg (kJ/kg)</th>
                  <th className="px-4 py-4 border-r border-surface-200 dark:border-surface-700" title="Enthalpy of Sat Vapor">h_g (kJ/kg)</th>
                  <th className="px-4 py-4" title="Entropy of Sat Liquid">s_f (kJ/kgK)</th>
                  <th className="px-4 py-4" title="Entropy of Sat Vapor">s_g (kJ/kgK)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {filteredSteam.map((row, idx) => (
                  <tr key={idx} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors">
                    <td className="px-4 py-3 text-left font-bold text-surface-900 dark:text-white border-r border-surface-100 dark:border-surface-800">{row.T}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400 border-r border-surface-100 dark:border-surface-800">{row.P.toFixed(4)}</td>
                    <td className="px-4 py-3 text-surface-600 dark:text-surface-300">{row.vf.toFixed(6)}</td>
                    <td className="px-4 py-3 text-surface-600 dark:text-surface-300 border-r border-surface-100 dark:border-surface-800">{row.vg.toFixed(4)}</td>
                    <td className="px-4 py-3 text-surface-600 dark:text-surface-300">{row.hf.toFixed(1)}</td>
                    <td className="px-4 py-3 text-surface-600 dark:text-surface-300">{row.hfg.toFixed(1)}</td>
                    <td className="px-4 py-3 text-surface-600 dark:text-surface-300 border-r border-surface-100 dark:border-surface-800">{row.hg.toFixed(1)}</td>
                    <td className="px-4 py-3 text-surface-600 dark:text-surface-300">{row.sf.toFixed(4)}</td>
                    <td className="px-4 py-3 text-surface-600 dark:text-surface-300">{row.sg.toFixed(4)}</td>
                  </tr>
                ))}
                {filteredSteam.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-surface-500 font-medium">
                      No matching properties found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
