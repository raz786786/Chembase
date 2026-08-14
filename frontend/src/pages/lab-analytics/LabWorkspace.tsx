import { useState, useEffect, Fragment } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { api } from '../../api';
import { 
  ArrowLeft, Beaker, CheckCircle2, ChevronRight, FileText, 
  FlaskConical, LineChart, ShieldAlert, Plus, Trash2, Wand2, Save, AlertCircle 
} from 'lucide-react';
import { 
  LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

type Step = 'setup' | 'theory' | 'data' | 'analysis' | 'safety';

export default function LabWorkspace() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eqId = searchParams.get('eq');
  const expId = searchParams.get('exp');
  
  const [currentStep, setCurrentStep] = useState<Step>('setup');
  const [isSaving, setIsSaving] = useState(false);
  
  // Knowledge Base Data
  const [eqProfile, setEqProfile] = useState<any>(null);
  const [expProfile, setExpProfile] = useState<any>(null);

  // Form State - Step 1: Setup
  const [equipment, setEquipment] = useState('');
  const [experimentName, setExperimentName] = useState('');
  const [objective, setObjective] = useState('');
  
  // Step 2: Theory & Method
  const [theoryDepth, setTheoryDepth] = useState<'quick' | 'detailed' | 'viva'>('detailed');
  const [theorySegments, setTheorySegments] = useState({
    principle: '',
    working: '',
    concepts: '',
    equations: '',
    variables: '',
    trends: ''
  });
  const [procedure, setProcedure] = useState('');
  const [isGeneratingTheory, setIsGeneratingTheory] = useState(false);

  // Step 3: Observations
  const [columns, setColumns] = useState([
    { id: 'col1', name: 'Time (min)' }, 
    { id: 'col2', name: 'Temperature (°C)' }
  ]);
  const [dataRows, setDataRows] = useState([
    { id: 'row1', col1: '', col2: '' }
  ]);
  
  // Step 4: Analysis & Graph
  const [results, setResults] = useState('');
  const [calculations, setCalculations] = useState('');
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

  useEffect(() => {
    async function loadKnowledge() {
      if (eqId) {
        const { data: eq } = await supabase.from('chembase_equipment_knowledge').select('*').eq('id', eqId).single();
        if (eq) {
          setEqProfile(eq);
          setEquipment(eq.name);
        }
      }
      if (expId) {
        const { data: exp } = await supabase.from('chembase_experiment_knowledge').select('*').eq('id', expId).single();
        if (exp) {
          setExpProfile(exp);
          setExperimentName(exp.name);
          setObjective(exp.typical_objective || '');
        }
      }
    }
    loadKnowledge();
  }, [eqId, expId]);

  const steps = [
    { id: 'setup', label: 'Setup', icon: <Beaker className="w-4 h-4" /> },
    { id: 'theory', label: 'Theory & Method', icon: <FileText className="w-4 h-4" /> },
    { id: 'data', label: 'Observations', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'analysis', label: 'Analysis & Graph', icon: <LineChart className="w-4 h-4" /> },
    { id: 'safety', label: 'Safety', icon: <ShieldAlert className="w-4 h-4" /> },
  ];

  const buildContextPrompt = () => {
    return `
      Equipment Profile: ${JSON.stringify(eqProfile || { name: equipment })}
      Experiment Profile: ${JSON.stringify(expProfile || { name: experimentName })}
      Student Objective: "${objective}"
    `;
  };

  const handleGenerateAI = async (stepType: 'theory' | 'analysis' | 'safety') => {
    if (!objective.trim()) {
      alert("Please define the Student Objective in the Setup step before generating content. AI relies entirely on your objective.");
      return setCurrentStep('setup');
    }

    

    if (stepType === 'theory') {
      setIsGeneratingTheory(true);
      try {
        const prompt = `You are a Chemical Engineering Lab Assistant. Generate the experiment theory and procedure strictly according to the student objective and equipment knowledge provided.
        Format your response as strict JSON:
        {
          "principle": "Fundamental principle",
          "working": "How equipment works",
          "concepts": "Key concepts",
          "equations": "Governing equations with units",
          "variables": "Independent, dependent, controlled",
          "trends": "Expected trends",
          "procedure": "Numbered step-by-step procedure"
        }
        Depth Mode: ${theoryDepth} (Adjust the length and detail accordingly).
        
        Context: ${buildContextPrompt()}`;

        const response = await api.aiProxy({
          prompt,
          system_prompt: 'Respond strictly with valid JSON only.'
        });
        
        const cleaned = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleaned);
        setTheorySegments({
          principle: data.principle || '',
          working: data.working || '',
          concepts: data.concepts || '',
          equations: data.equations || '',
          variables: data.variables || '',
          trends: data.trends || ''
        });
        setProcedure(data.procedure || '');
      } catch (err) {
        alert("Failed to generate theory.");
        console.error(err);
      } finally {
        setIsGeneratingTheory(false);
      }
    } else if (stepType === 'analysis') {
      // Data check constraint
      const hasData = dataRows.some(row => Object.keys(row).some(k => k !== 'id' && (row as any)[k]));
      if (!hasData) {
        alert("CRITICAL ERROR: No experimental data found. The AI is strictly prohibited from fabricating data. Please enter your actual readings in the Observations tab first.");
        return setCurrentStep('data');
      }

      setIsGeneratingAnalysis(true);
      try {
        const prompt = `You are a Chemical Engineering Lab Assistant. Analyze the student's actual experimental data and generate relevant calculations, results, discussion, and conclusion. 
        DO NOT FABRICATE ANY NUMBERS. Only analyze what is provided.
        Format your response as strict JSON:
        {
          "calculations": "Show step-by-step formulas -> inputs -> units -> calculations -> results for key derived values",
          "results": "Describe the findings from the data",
          "discussion": "Discuss trends, deviations, and engineering interpretation",
          "conclusion": "Final conclusion directly answering the objective"
        }
        
        Context: ${buildContextPrompt()}
        Actual Student Data (JSON array): ${JSON.stringify(dataRows)}`;

        const response = await api.aiProxy({
          prompt,
          system_prompt: 'Respond strictly with valid JSON only.'
        });
        
        const cleaned = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleaned);
        setCalculations(data.calculations || '');
        setResults(data.results || '');
        setDiscussion(data.discussion || '');
        setConclusion(data.conclusion || '');
      } catch (err) {
        alert("Failed to generate analysis.");
        console.error(err);
      } finally {
        setIsGeneratingAnalysis(false);
      }
    } else if (stepType === 'safety') {
      setIsGeneratingSafety(true);
      try {
        const prompt = `You are a Chemical Engineering Lab Assistant. Generate strict safety guidelines for the given experiment and equipment.
        Format your response as strict JSON:
        {
          "ppe": "List required PPE",
          "hazards": "Identify potential hazards",
          "precautions": "List handling precautions"
        }
        Context: ${buildContextPrompt()}`;

        const response = await api.aiProxy({
          prompt,
          system_prompt: 'Respond strictly with valid JSON only.'
        });
        
        const cleaned = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleaned);
        setPpe(data.ppe || '');
        setHazards(data.hazards || '');
        setPrecautions(data.precautions || '');
      } catch (err) {
        alert("Failed to generate safety info.");
        console.error(err);
      } finally {
        setIsGeneratingSafety(false);
      }
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
        equipment_id: eqId || null,
        experiment_id: expId || null,
        objective,
        theory: theorySegments,
        procedure,
        observation_data: { columns, dataRows },
        calculations,
        results,
        discussion,
        conclusion,
        safety_info: { ppe, hazards, precautions }
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
          disabled={isSaving || !objective.trim()}
          className="btn-tactile flex items-center gap-2 px-6 py-2 bg-primary-600 disabled:bg-surface-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-sm shadow-[0_0_20px_rgba(138,203,193,0.3)] transition-all"
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
              <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-1">Experiment Context</h2>
              <p className="text-surface-500 text-sm">Define your exact objective. The AI relies entirely on this objective.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">Apparatus / Equipment Used</label>
                <textarea 
                  value={equipment}
                  onChange={e => setEquipment(e.target.value)}
                  placeholder="e.g. Ball Mill, Sieves, Stopwatch..."
                  className="w-full h-24 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary-500 transition-colors resize-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">Experiment / Lab Title</label>
                <textarea 
                  value={experimentName}
                  onChange={e => setExperimentName(e.target.value)}
                  placeholder="e.g. Ball Mill — Grinding Media — Lab 03"
                  className="w-full h-24 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary-500 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider flex justify-between">
                Student Objective 
                <span className="text-rose-500">* Required</span>
              </label>
              <textarea 
                value={objective}
                onChange={e => setObjective(e.target.value)}
                placeholder="To investigate the effect of grinding time and grinding media on particle size reduction using a ball mill..."
                className="w-full h-32 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary-500 transition-colors resize-none"
              />
              <p className="text-xs text-surface-400 mt-2">
                <AlertCircle className="w-3 h-3 inline mr-1" />
                The AI will use this exact objective to generate relevant theory, equations, and observations. Do not leave it blank.
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-surface-100 dark:border-surface-700">
              <button 
                onClick={() => setCurrentStep('theory')}
                disabled={!objective.trim()}
                className="btn-tactile px-6 py-2.5 bg-surface-900 dark:bg-white text-white dark:text-surface-900 disabled:opacity-50 font-semibold rounded-xl text-sm flex items-center gap-2"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: THEORY & METHOD */}
        {currentStep === 'theory' && (
          <div className="max-w-6xl space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-1">Segmented Theory & Procedure</h2>
                <p className="text-surface-500 text-sm">Theory generated directly from your objective, not a generic textbook.</p>
              </div>
              
              <div className="flex items-center gap-2">
                <select 
                  value={theoryDepth}
                  onChange={e => setTheoryDepth(e.target.value as any)}
                  className="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none"
                >
                  <option value="quick">Quick Understanding</option>
                  <option value="detailed">Detailed Theory</option>
                  <option value="viva">Viva Preparation</option>
                </select>
                <button 
                  onClick={() => handleGenerateAI('theory')}
                  disabled={isGeneratingTheory}
                  className="btn-tactile flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold rounded-xl text-sm border border-indigo-200 dark:border-indigo-800 transition-colors"
                >
                  {isGeneratingTheory ? <span className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  Generate Content
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Theory Segments (Left Col) */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">A. Principle</label>
                  <textarea 
                    value={theorySegments.principle}
                    onChange={e => setTheorySegments({...theorySegments, principle: e.target.value})}
                    placeholder="Fundamental principle being demonstrated..."
                    className="w-full h-24 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary-500 transition-colors resize-none leading-relaxed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">B. Equipment Working</label>
                  <textarea 
                    value={theorySegments.working}
                    onChange={e => setTheorySegments({...theorySegments, working: e.target.value})}
                    placeholder="How the selected equipment works..."
                    className="w-full h-24 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary-500 transition-colors resize-none leading-relaxed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">C. Relevant Concepts</label>
                  <textarea 
                    value={theorySegments.concepts}
                    onChange={e => setTheorySegments({...theorySegments, concepts: e.target.value})}
                    placeholder="Only concepts relevant to this specific objective..."
                    className="w-full h-32 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary-500 transition-colors resize-none leading-relaxed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">D. Governing Equations</label>
                  <textarea 
                    value={theorySegments.equations}
                    onChange={e => setTheorySegments({...theorySegments, equations: e.target.value})}
                    placeholder="Relevant equations with variables and units..."
                    className="w-full h-32 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary-500 transition-colors resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Procedure & Trends (Right Col) */}
              <div className="space-y-4 flex flex-col h-full">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">E. Variables</label>
                    <textarea 
                      value={theorySegments.variables}
                      onChange={e => setTheorySegments({...theorySegments, variables: e.target.value})}
                      placeholder="Independent, dependent, controlled..."
                      className="w-full h-24 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary-500 transition-colors resize-none leading-relaxed"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">F. Expected Trends</label>
                    <textarea 
                      value={theorySegments.trends}
                      onChange={e => setTheorySegments({...theorySegments, trends: e.target.value})}
                      placeholder="What you should observe..."
                      className="w-full h-24 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary-500 transition-colors resize-none leading-relaxed"
                    />
                  </div>
                </div>

                <div className="space-y-1 flex-1 flex flex-col">
                  <label className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">Practical Procedure</label>
                  <textarea 
                    value={procedure}
                    onChange={e => setProcedure(e.target.value)}
                    placeholder="1. First step...&#10;2. Second step..."
                    className="w-full flex-1 min-h-[300px] bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary-500 transition-colors resize-none leading-relaxed whitespace-pre-wrap"
                  />
                </div>
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
            <div className="flex justify-between items-center bg-rose-50 dark:bg-rose-900/10 p-4 rounded-xl border border-rose-100 dark:border-rose-900/30">
              <div>
                <h2 className="text-lg font-bold text-rose-800 dark:text-rose-300 mb-1 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Experimental Data Entry
                </h2>
                <p className="text-rose-600 dark:text-rose-400/80 text-sm">
                  The AI is strictly prohibited from fabricating experimental data. Enter your actual physical observations here to proceed with calculations and analysis.
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <h3 className="text-surface-900 dark:text-white font-bold">Observation Table</h3>
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
                            placeholder="Data point"
                            className="w-full bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-700 focus:border-primary-500 rounded-md px-2 py-1.5 focus:outline-none font-medium text-surface-900 dark:text-surface-100 font-mono shadow-sm"
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
                <p className="text-surface-500 text-sm">Visualize your actual data and document your findings.</p>
              </div>
              <button 
                onClick={() => handleGenerateAI('analysis')}
                disabled={isGeneratingAnalysis}
                className="btn-tactile flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold rounded-xl text-sm border border-indigo-200 dark:border-indigo-800 transition-colors"
              >
                {isGeneratingAnalysis ? <span className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" /> : <Wand2 className="w-4 h-4" />}
                Analyze Actual Data
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

                <div className="h-[300px] w-full bg-surface-50 dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 p-4 shadow-inner">
                  {dataRows.length > 0 && chartData.some(row => row[chartY] !== 0) ? (
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
                    <div className="w-full h-full flex flex-col items-center justify-center text-surface-400 text-sm gap-2">
                      <LineChart className="w-8 h-8 opacity-50" />
                      No numerical data entered yet
                    </div>
                  )}
                </div>
              </div>

              {/* Text Areas */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">Calculations (Formula &rarr; Inputs &rarr; Units &rarr; Result)</label>
                  <textarea 
                    value={calculations}
                    onChange={e => setCalculations(e.target.value)}
                    placeholder="Relevant calculations for this experiment..."
                    className="w-full h-[150px] bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary-500 transition-colors resize-none leading-relaxed font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">Results</label>
                  <textarea 
                    value={results}
                    onChange={e => setResults(e.target.value)}
                    placeholder="Findings based on actual data..."
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
                    placeholder="Final conclusive statements answering the objective..."
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
                Generate Contextual Safety
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
