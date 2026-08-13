import { useState, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { 
  ArrowLeft, Beaker, CheckCircle2, ChevronRight, FileText, 
  FlaskConical, LineChart, ShieldAlert, Plus, Trash2, Wand2, Save 
} from 'lucide-react';
import { 
  LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

type Step = 'setup' | 'theory' | 'data' | 'analysis' | 'safety';

export default function LabWorkspace() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState<Step>('setup');
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State - Step 1: Setup
  const [equipment, setEquipment] = useState('');
  const [experimentName, setExperimentName] = useState('');
  const [objective, setObjective] = useState('');
  
  // Step 2: Theory & Method
  const [theory, setTheory] = useState('');
  const [procedure, setProcedure] = useState('');
  const [isGeneratingTheory, setIsGeneratingTheory] = useState(false);

  // Step 3: Observations
  const [columns, setColumns] = useState([
    { id: 'col1', name: 'Time (min)' }, 
    { id: 'col2', name: 'Temperature (°C)' }
  ]);
  const [dataRows, setDataRows] = useState([
    { id: 'row1', col1: '0', col2: '25' },
    { id: 'row2', col1: '5', col2: '30' },
    { id: 'row3', col1: '10', col2: '45' },
  ]);
  
  // Step 4: Analysis & Graph
  const [results, setResults] = useState('');
  const [discussion, setDiscussion] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [chartX, setChartX] = useState('col1');
  const [chartY, setChartY] = useState('col2');
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);

  // Step 5: Safety
  const [ppe, setPpe] = useState('');
  const [hazards, setHazards] = useState('');
  const [precautions, setPrecautions] = useState('');
  const [isGeneratingSafety, setIsGeneratingSafety] = useState(false);

  const steps = [
    { id: 'setup', label: 'Setup', icon: <Beaker className="w-4 h-4" /> },
    { id: 'theory', label: 'Theory & Method', icon: <FileText className="w-4 h-4" /> },
    { id: 'data', label: 'Observations', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'analysis', label: 'Analysis & Graph', icon: <LineChart className="w-4 h-4" /> },
    { id: 'safety', label: 'Safety', icon: <ShieldAlert className="w-4 h-4" /> },
  ];

  const handleGenerateAI = (stepType: 'theory' | 'analysis' | 'safety') => {
    if (stepType === 'theory') {
      setIsGeneratingTheory(true);
      setTimeout(() => {
        setTheory('This experiment relies on fundamental principles to determine the target properties. Under steady-state conditions, variables are monitored continuously to identify key relationships between the parameters. The primary assumption is that external losses are negligible, allowing for direct correlation of measured quantities.');
        setProcedure('1. Ensure all equipment is clean and calibrated.\n2. Set up the apparatus according to standard safety guidelines.\n3. Initialize the equipment and allow the system to reach steady state.\n4. Record the designated variables at defined intervals.\n5. Tabulate the recorded data for further processing.\n6. Safely shut down the equipment and clean the workspace.');
        setIsGeneratingTheory(false);
      }, 2000);
    } else if (stepType === 'analysis') {
      setIsGeneratingAnalysis(true);
      setTimeout(() => {
        setResults('The data collected demonstrates a clear trend between the independent and dependent variables. The plotted values indicate a proportional relationship that conforms to expected theoretical models. Calculated coefficients fall well within the acceptable margin of error.');
        setDiscussion('Minor deviations observed during the procedure can be attributed to non-ideal environmental conditions. While assuming perfect isolation is theoretical, the robust nature of the trend strongly validates the initial hypothesis and provides a reliable framework for future scale-up.');
        setConclusion('The experiment successfully validated the theoretical models in question. The practical findings are in strong agreement with predictions, proving the efficacy and reliability of the chosen methodology.');
        setIsGeneratingAnalysis(false);
      }, 2000);
    } else if (stepType === 'safety') {
      setIsGeneratingSafety(true);
      setTimeout(() => {
        setPpe('Safety Goggles\nHeat/Chemical-Resistant Gloves\nLab Coat\nClosed-toe Shoes');
        setHazards('1. Thermal/Chemical Burns: Risk from exposed elements or reactive substances.\n2. Mechanical/Electrical Hazard: Potential injury from moving parts or exposed circuits.\n3. Glassware Breakage: Risk of lacerations from broken equipment.');
        setPrecautions('1. Wear all designated PPE before entering the workspace.\n2. Ensure electrical connections are secure and kept away from liquid sources.\n3. Handle glassware with care; immediately clean breakages with a brush and dustpan.\n4. Familiarize yourself with emergency shut-off switches and exits.');
        setIsGeneratingSafety(false);
      }, 2000);
    }
  };

  const handleSaveLab = async () => {
    setIsSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const payload = {
        user_id: userData.user.id,
        subject: subjectId,
        experiment_name: experimentName,
        equipment_name: equipment,
        objective,
        theory,
        procedure,
        observations: { columns, dataRows },
        results,
        discussion,
        conclusion,
        safety: { ppe, hazards, precautions }
      };

      const { error } = await supabase.from('lab_analytics_records').insert(payload);
      if (error) throw error;
      alert('Lab saved successfully!');
      navigate(`/advanced/lab-assistant/${subjectId}`);
    } catch (err: any) {
      console.error(err);
      alert('Error saving lab: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Observations Table Methods
  const addColumn = () => {
    const newColId = `col${Date.now()}`;
    setColumns([...columns, { id: newColId, name: `Var ${columns.length + 1}` }]);
    setDataRows(dataRows.map(row => ({ ...row, [newColId]: '' })));
  };

  const addRow = () => {
    const newRowId = `row${Date.now()}`;
    const newRow: any = { id: newRowId };
    columns.forEach(col => {
      newRow[col.id] = '';
    });
    setDataRows([...dataRows, newRow]);
  };

  const updateColumnName = (id: string, newName: string) => {
    setColumns(columns.map(col => col.id === id ? { ...col, name: newName } : col));
  };

  const updateCell = (rowId: string, colId: string, value: string) => {
    setDataRows(dataRows.map(row => row.id === rowId ? { ...row, [colId]: value } : row));
  };

  const removeRow = (rowId: string) => {
    setDataRows(dataRows.filter(row => row.id !== rowId));
  };
  
  const removeColumn = (colId: string) => {
    setColumns(columns.filter(col => col.id !== colId));
    setDataRows(dataRows.map(row => {
      const newRow = { ...row };
      delete (newRow as any)[colId];
      return newRow;
    }));
    if (chartX === colId) setChartX(columns[0]?.id || '');
    if (chartY === colId) setChartY(columns[0]?.id || '');
  };

  // Process data for charts
  const chartData = dataRows.map(row => {
    const parsedRow: any = {};
    columns.forEach(col => {
      const val = parseFloat((row as any)[col.id]);
      parsedRow[col.id] = isNaN(val) ? 0 : val;
    });
    return parsedRow;
  });

  const activeChartYName = columns.find(c => c.id === chartY)?.name || chartY;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20 mt-6 relative z-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-900 border border-surface-200/50 dark:border-surface-50/10 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/advanced/lab-assistant/${subjectId}`)} className="p-2 bg-surface-800 hover:bg-surface-700 text-white rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">New Laboratory</h1>
            <p className="text-surface-400 text-sm font-medium capitalize">{subjectId?.replace('-', ' ')}</p>
          </div>
        </div>
        <button 
          onClick={handleSaveLab}
          disabled={isSaving}
          className="btn-tactile flex items-center gap-2 px-6 py-2 bg-primary-600 disabled:bg-primary-800 hover:bg-primary-500 text-white font-semibold rounded-xl text-sm shadow-[0_0_20px_rgba(138,203,193,0.3)] transition-all"
        >
          {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving...' : 'Save Lab'}
        </button>
      </div>

      {/* Wizard Navigation */}
      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-surface-800 p-2 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-x-auto">
        {steps.map((step, idx) => {
          const isActive = currentStep === step.id;
          const isPast = steps.findIndex(s => s.id === currentStep) > idx;
          return (
            <Fragment key={step.id}>
              <button 
                onClick={() => setCurrentStep(step.id as Step)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                    : isPast 
                      ? 'text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700'
                      : 'text-surface-400 dark:text-surface-500 cursor-not-allowed opacity-50'
                }`}
              >
                {isActive ? step.icon : (isPast ? <CheckCircle2 className="w-4 h-4 text-primary-500" /> : step.icon)}
                {step.label}
              </button>
              {idx < steps.length - 1 && <ChevronRight className="w-4 h-4 text-surface-300 dark:text-surface-600 shrink-0" />}
            </Fragment>
          );
        })}
      </div>

      {/* Workspace Area */}
      <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-3xl p-6 sm:p-8 shadow-sm min-h-[500px]">
        
        {/* STEP 1: SETUP */}
        {currentStep === 'setup' && (
          <div className="max-w-3xl space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-1">Experiment Details</h2>
              <p className="text-surface-500 text-sm">Define your laboratory parameters to get started.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">Equipment Used</label>
                <input 
                  type="text" 
                  value={equipment}
                  onChange={e => setEquipment(e.target.value)}
                  placeholder="e.g. Ball Mill, Venturi Meter"
                  className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">Experiment Name</label>
                <input 
                  type="text" 
                  value={experimentName}
                  onChange={e => setExperimentName(e.target.value)}
                  placeholder="e.g. Particle Size Reduction Analysis"
                  className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">Objective</label>
              <textarea 
                value={objective}
                onChange={e => setObjective(e.target.value)}
                placeholder="To investigate the effect of..."
                className="w-full h-32 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary-500 transition-colors resize-none"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-surface-100 dark:border-surface-700">
              <button 
                onClick={() => setCurrentStep('theory')}
                className="btn-tactile px-6 py-2.5 bg-surface-900 dark:bg-white text-white dark:text-surface-900 font-semibold rounded-xl text-sm flex items-center gap-2"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: THEORY & METHOD */}
        {currentStep === 'theory' && (
          <div className="max-w-4xl space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-1">Theory & Method</h2>
                <p className="text-surface-500 text-sm">Write down the fundamental theory and step-by-step procedure.</p>
              </div>
              <button 
                onClick={() => handleGenerateAI('theory')}
                disabled={isGeneratingTheory}
                className="btn-tactile flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold rounded-xl text-sm border border-indigo-200 dark:border-indigo-800 transition-colors"
              >
                {isGeneratingTheory ? <span className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" /> : <Wand2 className="w-4 h-4" />}
                Generate with AI
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">Theory</label>
                <textarea 
                  value={theory}
                  onChange={e => setTheory(e.target.value)}
                  placeholder="The principles governing this experiment..."
                  className="w-full h-[400px] bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary-500 transition-colors resize-none leading-relaxed"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">Procedure (Numbered List)</label>
                <textarea 
                  value={procedure}
                  onChange={e => setProcedure(e.target.value)}
                  placeholder="1. First step...&#10;2. Second step..."
                  className="w-full h-[400px] bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary-500 transition-colors resize-none leading-relaxed whitespace-pre-wrap"
                />
              </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t border-surface-100 dark:border-surface-700">
              <button 
                onClick={() => setCurrentStep('data')}
                className="btn-tactile px-6 py-2.5 bg-surface-900 dark:bg-white text-white dark:text-surface-900 font-semibold rounded-xl text-sm flex items-center gap-2"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        
        {/* STEP 3: OBSERVATIONS */}
        {currentStep === 'data' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-1">Observations Table</h2>
                <p className="text-surface-500 text-sm">Add variables as columns and record your data points.</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={addColumn}
                  className="btn-tactile flex items-center gap-1.5 px-3 py-1.5 bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200 font-semibold rounded-lg text-sm transition-colors border border-surface-200 dark:border-surface-700"
                >
                  <Plus className="w-4 h-4" /> Column
                </button>
                <button 
                  onClick={addRow}
                  className="btn-tactile flex items-center gap-1.5 px-3 py-1.5 bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200 font-semibold rounded-lg text-sm transition-colors border border-surface-200 dark:border-surface-700"
                >
                  <Plus className="w-4 h-4" /> Row
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-surface-500 dark:text-surface-400 uppercase bg-surface-100 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700">
                  <tr>
                    <th className="px-4 py-3 w-10 text-center font-semibold text-surface-400">#</th>
                    {columns.map(col => (
                      <th key={col.id} className="px-4 py-3 min-w-[150px]">
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={col.name}
                            onChange={(e) => updateColumnName(col.id, e.target.value)}
                            className="bg-transparent border-b border-transparent focus:border-primary-500 focus:outline-none w-full font-semibold text-surface-700 dark:text-surface-200"
                          />
                          {columns.length > 1 && (
                            <button onClick={() => removeColumn(col.id)} className="text-surface-400 hover:text-red-500">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((row, idx) => (
                    <tr key={row.id} className="border-b border-surface-100 dark:border-surface-800/50 hover:bg-white dark:hover:bg-surface-800 transition-colors">
                      <td className="px-4 py-3 text-center text-surface-400 font-medium">{idx + 1}</td>
                      {columns.map(col => (
                        <td key={col.id} className="px-4 py-2">
                          <input 
                            type="text" 
                            value={(row as any)[col.id]}
                            onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                            placeholder="-"
                            className="w-full bg-transparent border border-transparent focus:border-surface-300 dark:focus:border-surface-600 rounded-md px-2 py-1 focus:outline-none font-medium text-surface-900 dark:text-surface-100"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-2">
                        {dataRows.length > 1 && (
                          <button onClick={() => removeRow(row.id)} className="p-1.5 text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4 border-t border-surface-100 dark:border-surface-700">
              <button 
                onClick={() => setCurrentStep('analysis')}
                className="btn-tactile px-6 py-2.5 bg-surface-900 dark:bg-white text-white dark:text-surface-900 font-semibold rounded-xl text-sm flex items-center gap-2"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: ANALYSIS & GRAPH */}
        {currentStep === 'analysis' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-1">Analysis & Results</h2>
                <p className="text-surface-500 text-sm">Visualize your data and document your findings.</p>
              </div>
              <button 
                onClick={() => handleGenerateAI('analysis')}
                disabled={isGeneratingAnalysis}
                className="btn-tactile flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold rounded-xl text-sm border border-indigo-200 dark:border-indigo-800 transition-colors"
              >
                {isGeneratingAnalysis ? <span className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" /> : <Wand2 className="w-4 h-4" />}
                Generate with AI
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Chart Section */}
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-1">
                    <label className="text-[11px] font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">X-Axis</label>
                    <select 
                      value={chartX} 
                      onChange={e => setChartX(e.target.value)}
                      className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none"
                    >
                      {columns.map(col => (
                        <option key={col.id} value={col.id}>{col.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-[11px] font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">Y-Axis</label>
                    <select 
                      value={chartY} 
                      onChange={e => setChartY(e.target.value)}
                      className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none"
                    >
                      {columns.map(col => (
                        <option key={col.id} value={col.id}>{col.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="h-[300px] w-full bg-surface-50 dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 p-4">
                  {dataRows.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                        <XAxis 
                          dataKey={chartX} 
                          tick={{ fontSize: 12, fill: '#64748b' }} 
                          tickLine={false} 
                          axisLine={{ stroke: '#cbd5e1' }}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: '#64748b' }} 
                          tickLine={false} 
                          axisLine={{ stroke: '#cbd5e1' }}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 500 }} />
                        <Line 
                          type="monotone" 
                          dataKey={chartY} 
                          name={activeChartYName}
                          stroke="#4f46e5" 
                          strokeWidth={3}
                          dot={{ fill: '#4f46e5', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: '#818cf8', strokeWidth: 2 }}
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-surface-400 text-sm">
                      No data to chart
                    </div>
                  )}
                </div>
              </div>

              {/* Text Areas */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">Results</label>
                  <textarea 
                    value={results}
                    onChange={e => setResults(e.target.value)}
                    placeholder="Describe the findings..."
                    className="w-full h-[100px] bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary-500 transition-colors resize-none leading-relaxed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">Discussion</label>
                  <textarea 
                    value={discussion}
                    onChange={e => setDiscussion(e.target.value)}
                    placeholder="Discuss the implications and anomalies..."
                    className="w-full h-[120px] bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary-500 transition-colors resize-none leading-relaxed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">Conclusion</label>
                  <textarea 
                    value={conclusion}
                    onChange={e => setConclusion(e.target.value)}
                    placeholder="Final conclusive statements..."
                    className="w-full h-[80px] bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary-500 transition-colors resize-none leading-relaxed"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-surface-100 dark:border-surface-700">
              <button 
                onClick={() => setCurrentStep('safety')}
                className="btn-tactile px-6 py-2.5 bg-surface-900 dark:bg-white text-white dark:text-surface-900 font-semibold rounded-xl text-sm flex items-center gap-2"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: SAFETY */}
        {currentStep === 'safety' && (
          <div className="max-w-4xl space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-1">Safety Guidelines</h2>
                <p className="text-surface-500 text-sm">Ensure all safety measures and hazards are documented.</p>
              </div>
              <button 
                onClick={() => handleGenerateAI('safety')}
                disabled={isGeneratingSafety}
                className="btn-tactile flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold rounded-xl text-sm border border-indigo-200 dark:border-indigo-800 transition-colors"
              >
                {isGeneratingSafety ? <span className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" /> : <Wand2 className="w-4 h-4" />}
                Generate with AI
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">Required PPE</label>
                  <textarea 
                    value={ppe}
                    onChange={e => setPpe(e.target.value)}
                    placeholder="List required protective equipment..."
                    className="w-full h-[150px] bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary-500 transition-colors resize-none leading-relaxed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">Precautions</label>
                  <textarea 
                    value={precautions}
                    onChange={e => setPrecautions(e.target.value)}
                    placeholder="List handling precautions..."
                    className="w-full h-[150px] bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary-500 transition-colors resize-none leading-relaxed"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">Hazards</label>
                <textarea 
                  value={hazards}
                  onChange={e => setHazards(e.target.value)}
                  placeholder="Identify potential hazards..."
                  className="w-full h-full min-h-[324px] bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary-500 transition-colors resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
