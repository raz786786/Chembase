import React, { useState } from 'react';
import { LineChart as ChartIcon, Settings, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Scatter, ScatterChart } from 'recharts';

export default function DiagramStudio() {
  const [diagramType, setDiagramType] = useState('T-s');
  const [substance, setSubstance] = useState('water');
  
  // Dummy vapor dome for Water T-s diagram (Simplified)
  const vaporDomeTs = [
    { s: 0.0, T: 0.01 }, { s: 0.3, T: 100 }, { s: 1.3, T: 200 }, { s: 2.3, T: 300 }, { s: 3.2, T: 374 }, // Sat Liquid
    { s: 4.4, T: 374 }, { s: 5.2, T: 300 }, { s: 6.4, T: 200 }, { s: 7.3, T: 100 }, { s: 9.1, T: 0.01 }  // Sat Vapor
  ];

  // Dummy vapor dome for P-v (log scale typical, but simplified linear here)
  const vaporDomePv = [
    { v: 0.001, P: 0.001 }, { v: 0.00104, P: 0.1 }, { v: 0.00115, P: 1.5 }, { v: 0.0031, P: 22.06 }, 
    { v: 0.05, P: 22.06 }, { v: 0.12, P: 1.5 }, { v: 1.67, P: 0.1 }, { v: 200, P: 0.001 }
  ];

  const domeData = diagramType === 'T-s' ? vaporDomeTs : vaporDomePv;
  const xKey = diagramType === 'T-s' ? 's' : 'v';
  const yKey = diagramType === 'T-s' ? 'T' : 'P';
  const xName = diagramType === 'T-s' ? 'Entropy (kJ/kgK)' : 'Specific Volume (m³/kg)';
  const yName = diagramType === 'T-s' ? 'Temperature (°C)' : 'Pressure (MPa)';

  // Process states
  const [states, setStates] = useState([
    { id: '1', s: 1.5, T: 150, v: 0.5, P: 0.5, label: 'State 1' },
    { id: '2', s: 3.5, T: 350, v: 0.1, P: 5.0, label: 'State 2' }
  ]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-surface-800 rounded-3xl p-6 border border-surface-200 dark:border-surface-700 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
            <ChartIcon className="w-7 h-7 text-violet-500" /> Thermodynamic Diagram Studio
          </h2>
          <p className="text-surface-500 mt-1">Plot and analyze thermodynamic state points and processes visually.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-surface-100 dark:bg-surface-900 text-surface-600 dark:text-surface-300 font-bold rounded-xl hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors">
          <Download className="w-4 h-4" /> Export Graph
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Controls */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-surface-800 rounded-3xl p-6 border border-surface-200 dark:border-surface-700 shadow-sm">
            <h3 className="font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-surface-400" /> Plot Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Diagram Type</label>
                <select 
                  value={diagramType} 
                  onChange={(e) => setDiagramType(e.target.value)}
                  className="w-full px-4 py-2 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl font-bold text-surface-900 dark:text-white"
                >
                  <option value="T-s">T-s Diagram (Temperature-Entropy)</option>
                  <option value="P-v">P-v Diagram (Pressure-Volume)</option>
                  <option value="P-h" disabled>P-h Diagram (Coming Soon)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Substance</label>
                <select 
                  value={substance} 
                  onChange={(e) => setSubstance(e.target.value)}
                  className="w-full px-4 py-2 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl font-bold text-surface-900 dark:text-white"
                >
                  <option value="water">Water / Steam</option>
                  <option value="r134a" disabled>R-134a</option>
                  <option value="air" disabled>Air (Ideal Gas)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-800 rounded-3xl p-6 border border-surface-200 dark:border-surface-700 shadow-sm">
            <h3 className="font-bold text-surface-900 dark:text-white mb-4">State Points</h3>
            <div className="space-y-3">
              {states.map((state, i) => (
                <div key={state.id} className="p-3 bg-surface-50 dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700">
                  <div className="font-bold text-sm text-surface-900 dark:text-white mb-2">{state.label}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-medium text-surface-500">
                    <div>{yKey}: {state[yKey as keyof typeof state]}</div>
                    <div>{xKey}: {state[xKey as keyof typeof state]}</div>
                  </div>
                </div>
              ))}
              <button 
                onClick={() => setStates([...states, { id: Date.now().toString(), s: 5, T: 250, v: 1.0, P: 2.0, label: `State ${states.length + 1}` }])}
                className="w-full py-2 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 font-bold rounded-xl hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
              >
                + Add State
              </button>
            </div>
          </div>
        </div>

        {/* Chart Area */}
        <div className="lg:col-span-3 bg-white dark:bg-surface-800 rounded-3xl p-6 border border-surface-200 dark:border-surface-700 shadow-sm min-h-[500px] flex flex-col">
          <h3 className="font-bold text-surface-900 dark:text-white mb-6 text-center text-xl">{diagramType} Diagram for {substance.toUpperCase()}</h3>
          
          <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey={xKey} type="number" domain={['auto', 'auto']} name={xName} stroke="#94a3b8" />
                <YAxis dataKey={yKey} type="number" domain={['auto', 'auto']} name={yName} stroke="#94a3b8" />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                />
                
                {/* Vapor Dome */}
                <Line 
                  data={domeData} 
                  type="monotone" 
                  dataKey={yKey} 
                  stroke="#94a3b8" 
                  strokeWidth={2} 
                  dot={false} 
                  isAnimationActive={false} 
                  name="Saturation Curve"
                />

                {/* Process Path */}
                <Line 
                  data={states} 
                  type="linear" 
                  dataKey={yKey} 
                  stroke="#8b5cf6" 
                  strokeWidth={3} 
                  dot={{ r: 6, fill: '#8b5cf6' }} 
                  isAnimationActive={false} 
                  name="Process Path"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
