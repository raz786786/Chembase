import { useState, useRef, useMemo } from 'react';
import { LineChart as ChartIcon, Settings, Download, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { toPng } from 'html-to-image';
import { STEAM_SAT_DATA } from '../engines/SteamEngine';

// NIST / Cengel Table A-11 Saturated R-134a Properties (single critical point at 101.06°C)
const R134A_SAT_DOME_TABLE = [
  { T: -40, P: 0.05125, hf: 0.0, hg: 225.86, sf: 0.0000, sg: 0.9687, vf: 0.0007054, vg: 0.36081 },
  { T: -30, P: 0.08443, hf: 12.59, hg: 232.08, sf: 0.0529, sg: 0.9554, vf: 0.0007203, vg: 0.22580 },
  { T: -20, P: 0.13282, hf: 25.49, hg: 238.41, sf: 0.1049, sg: 0.9463, vf: 0.0007362, vg: 0.14729 },
  { T: -10, P: 0.20074, hf: 38.55, hg: 244.51, sf: 0.1550, sg: 0.9377, vf: 0.0007535, vg: 0.09959 },
  { T: 0, P: 0.29293, hf: 51.86, hg: 250.45, sf: 0.2044, sg: 0.9314, vf: 0.0007723, vg: 0.06931 },
  { T: 10, P: 0.41489, hf: 65.43, hg: 256.16, sf: 0.2529, sg: 0.9266, vf: 0.0007930, vg: 0.04944 },
  { T: 20, P: 0.57207, hf: 79.32, hg: 261.59, sf: 0.3006, sg: 0.9224, vf: 0.0008161, vg: 0.03600 },
  { T: 30, P: 0.77064, hf: 93.58, hg: 266.66, sf: 0.3479, sg: 0.9187, vf: 0.0008421, vg: 0.02664 },
  { T: 40, P: 1.0170, hf: 108.28, hg: 271.25, sf: 0.3949, sg: 0.9150, vf: 0.0008720, vg: 0.01997 },
  { T: 50, P: 1.3186, hf: 123.49, hg: 275.19, sf: 0.4418, sg: 0.9108, vf: 0.0009073, vg: 0.01509 },
  { T: 60, P: 1.6828, hf: 139.31, hg: 278.23, sf: 0.4888, sg: 0.9056, vf: 0.0009504, vg: 0.01144 },
  { T: 70, P: 2.1182, hf: 155.93, hg: 279.96, sf: 0.5366, sg: 0.8986, vf: 0.0010055, vg: 0.00865 },
  { T: 80, P: 2.6352, hf: 173.68, hg: 279.72, sf: 0.5857, sg: 0.8884, vf: 0.0010814, vg: 0.00644 },
  { T: 90, P: 3.2469, hf: 193.29, hg: 276.00, sf: 0.6380, sg: 0.8723, vf: 0.0012051, vg: 0.00462 },
  { T: 101.06, P: 4.0593, hf: 241.50, hg: 241.50, sf: 0.7680, sg: 0.7680, vf: 0.001953, vg: 0.001953 }
];

type NumericStateKey = 's' | 'T' | 'v' | 'P' | 'h';

interface DiagramStatePoint {
  id: string;
  s: number;
  T: number;
  v: number;
  P: number;
  h: number;
  label: string;
}

function buildVaporDome<T extends { T: number; P: number; sf: number; sg: number; vf: number; vg: number; hf: number; hg: number }>(
  table: T[],
  diagramType: string
) {
  const liquid = table; // includes critical point at last index once
  const vapor = table.slice(0, -1).reverse(); // exclude duplicate critical point
  if (diagramType === 'T-s') {
    return [
      ...liquid.map(d => ({ s: d.sf, T: d.T })),
      ...vapor.map(d => ({ s: d.sg, T: d.T }))
    ];
  }
  if (diagramType === 'P-v') {
    return [
      ...liquid.map(d => ({ v: d.vf, P: d.P })),
      ...vapor.map(d => ({ v: d.vg, P: d.P }))
    ];
  }
  return [
    ...liquid.map(d => ({ h: d.hf, P: d.P })),
    ...vapor.map(d => ({ h: d.hg, P: d.P }))
  ];
}

export default function DiagramStudio() {
  const [diagramType, setDiagramType] = useState('T-s');
  const [substance, setSubstance] = useState('water');
  const [exporting, setExporting] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const { domeData, xKey, yKey, xName, yName } = useMemo(() => {
    let xK: NumericStateKey = 's';
    let yK: NumericStateKey = 'T';
    let xLabel = 'Entropy (kJ/kg·K)';
    let yLabel = 'Temperature (°C)';

    if (diagramType === 'P-v') {
      xK = 'v'; yK = 'P'; xLabel = 'Specific Volume (m³/kg)'; yLabel = 'Pressure (MPa)';
    } else if (diagramType === 'P-h') {
      xK = 'h'; yK = 'P'; xLabel = 'Enthalpy (kJ/kg)'; yLabel = 'Pressure (MPa)';
    }

    let dome: Record<string, number>[] = [];
    if (substance === 'water') {
      dome = buildVaporDome(STEAM_SAT_DATA, diagramType);
    } else if (substance === 'r134a') {
      dome = buildVaporDome(R134A_SAT_DOME_TABLE, diagramType);
    }

    return { domeData: dome, xKey: xK, yKey: yK, xName: xLabel, yName: yLabel };
  }, [diagramType, substance]);

  // Process states
  const [states, setStates] = useState<DiagramStatePoint[]>([
    { id: '1', s: 1.5, T: 150, v: 0.05, P: 0.5, h: 600, label: 'State 1' },
    { id: '2', s: 6.5, T: 350, v: 0.1, P: 5.0, h: 2800, label: 'State 2' }
  ]);

  const updateStateField = (id: string, field: keyof DiagramStatePoint, rawValue: string) => {
    setStates(prev => prev.map(st => {
      if (st.id !== id) return st;
      if (field === 'label') return { ...st, label: rawValue };
      const parsed = parseFloat(rawValue);
      return { ...st, [field]: Number.isFinite(parsed) ? parsed : 0 };
    }));
  };

  const addState = () => {
    const last = states[states.length - 1] ?? { s: 1.0, T: 100, v: 0.05, P: 0.5, h: 500 };
    setStates(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        s: parseFloat((last.s + 0.5).toFixed(3)),
        T: parseFloat((last.T + 25).toFixed(1)),
        v: parseFloat((last.v + 0.05).toFixed(4)),
        P: parseFloat((last.P + 1.0).toFixed(3)),
        h: parseFloat((last.h + 250).toFixed(1)),
        label: `State ${prev.length + 1}`
      }
    ]);
  };

  const handleExport = async () => {
    if (!chartContainerRef.current || exporting) return;
    setExporting(true);
    try {
      const isDark = document.documentElement.classList.contains('dark');
      const dataUrl = await toPng(chartContainerRef.current, {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        pixelRatio: 2,
        skipFonts: true
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${diagramType.toLowerCase()}_${substance}_diagram.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export thermodynamic diagram', err);
    } finally {
      setExporting(false);
    }
  };

  const useLogX = diagramType === 'P-v' && states.every(st => st.v > 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-surface-800 rounded-3xl p-6 border border-surface-200 dark:border-surface-700 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
            <ChartIcon className="w-7 h-7 text-violet-500" /> Thermodynamic Diagram Studio
          </h2>
          <p className="text-surface-500 mt-1">Plot and analyze thermodynamic state points and processes visually.</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-surface-100 dark:bg-surface-900 text-surface-600 dark:text-surface-300 font-bold rounded-xl hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors disabled:opacity-50"
        >
          {exporting ? <Activity className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exporting ? 'Exporting...' : 'Export Graph'}
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
                  <option value="P-h">P-h Diagram (Pressure-Enthalpy)</option>
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
                  <option value="r134a">R-134a</option>
                  <option value="air">Air (Ideal Gas)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-800 rounded-3xl p-6 border border-surface-200 dark:border-surface-700 shadow-sm">
            <h3 className="font-bold text-surface-900 dark:text-white mb-4">State Points</h3>
            <div className="space-y-3">
              {states.map((state) => (
                <div key={state.id} className="p-3 bg-surface-50 dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 relative group space-y-2">
                  <div className="flex items-center justify-between gap-2 pr-5">
                    <input
                      type="text"
                      value={state.label}
                      onChange={e => updateStateField(state.id, 'label', e.target.value)}
                      aria-label="State label"
                      className="w-full bg-transparent font-bold text-sm text-surface-900 dark:text-white outline-none border-b border-transparent focus:border-violet-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-medium text-surface-500">
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase">{xKey}</span>
                      <input
                        type="number"
                        step="any"
                        value={state[xKey]}
                        onChange={e => updateStateField(state.id, xKey, e.target.value)}
                        className="w-full px-2 py-1 rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white font-mono text-xs outline-none focus:border-violet-500"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase">{yKey}</span>
                      <input
                        type="number"
                        step="any"
                        value={state[yKey]}
                        onChange={e => updateStateField(state.id, yKey, e.target.value)}
                        className="w-full px-2 py-1 rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white font-mono text-xs outline-none focus:border-violet-500"
                      />
                    </label>
                  </div>
                  <button 
                    className="absolute top-2 right-2 text-surface-400 hover:text-red-500 opacity-70 group-hover:opacity-100 transition-opacity font-bold px-1"
                    onClick={() => setStates(states.filter(s => s.id !== state.id))}
                    title="Remove state"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button 
                onClick={addState}
                className="w-full py-2 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 font-bold rounded-xl hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
              >
                + Add State
              </button>
            </div>
          </div>
        </div>

        {/* Chart Area */}
        <div
          ref={chartContainerRef}
          className="lg:col-span-3 bg-white dark:bg-surface-800 rounded-3xl p-6 border border-surface-200 dark:border-surface-700 shadow-sm min-h-[500px] flex flex-col"
        >
          <h3 className="font-bold text-surface-900 dark:text-white mb-6 text-center text-xl">{diagramType} Diagram for {substance.toUpperCase()}</h3>
          
          <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey={xKey}
                  type="number"
                  scale={useLogX ? 'log' : 'auto'}
                  domain={['auto', 'auto']}
                  allowDuplicatedCategory={false}
                  name={xName}
                  stroke="#94a3b8"
                />
                <YAxis dataKey={yKey} type="number" domain={['auto', 'auto']} name={yName} stroke="#94a3b8" />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                />
                
                {/* Vapor Dome */}
                {domeData.length > 0 && (
                  <Line 
                    data={domeData} 
                    type="linear" 
                    dataKey={yKey} 
                    stroke="#94a3b8" 
                    strokeWidth={2} 
                    dot={false} 
                    isAnimationActive={false} 
                    name="Saturation Curve"
                  />
                )}

                {/* Process Path */}
                {states.length > 0 && (
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
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
