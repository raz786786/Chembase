import { useState, useEffect, useMemo, Fragment } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { api } from '../../api';
import { DEFAULT_EQUIPMENT_BY_SUBJECT } from './LabSubjectHub';
import { 
  ArrowLeft, Beaker, CheckCircle2, ChevronLeft, ChevronRight, Download, FileText, 
  FlaskConical, LineChart, ShieldAlert, Plus, Trash2, Wand2, Save, AlertCircle 
} from 'lucide-react';
import { 
  LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

type Step = 'setup' | 'theory' | 'data' | 'analysis' | 'safety';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(val: string | null | undefined): val is string {
  return Boolean(val && UUID_RE.test(val));
}

function extractJsonObject(raw: string): any | null {
  const stripped = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

async function callAiWithTimeout(prompt: string, systemPrompt: string, timeoutMs = 10000) {
  const timeoutPromise = new Promise<null>(resolve => setTimeout(() => resolve(null), timeoutMs));
  const response = await Promise.race([
    api.aiProxy({ prompt, system_prompt: systemPrompt }).catch(() => null),
    timeoutPromise,
  ]);
  if (response && !response.error && response.text) {
    return response.text;
  }
  return null;
}

export default function LabWorkspace() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eqId = searchParams.get('eq');
  const expId = searchParams.get('exp');
  const recordId = searchParams.get('record');
  
  const [currentStep, setCurrentStep] = useState<Step>('setup');
  const [isSaving, setIsSaving] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'info' | 'warning'; text: string } | null>(null);
  
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
  const [dataRows, setDataRows] = useState<Record<string, string>[]>([
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

  const formattedSubject = (subjectId || 'chemical-engineering').replace(/-/g, ' ');
  const savedLabsLocalKey = `chembase_saved_labs_${subjectId}`;
  const customEqLocalKey = `chembase_custom_lab_eq_${subjectId}`;

  const flashBanner = (type: 'success' | 'info' | 'warning', text: string) => {
    setStatusBanner({ type, text });
  };

  useEffect(() => {
    async function loadWorkspaceData() {
      // 1. Reopen a saved record if ?record=<id> is provided
      if (recordId) {
        let rec: any = null;
        if (recordId.startsWith('local_lab_')) {
          try {
            const localSaved = JSON.parse(localStorage.getItem(savedLabsLocalKey) || '[]');
            rec = localSaved.find((item: any) => String(item.id) === recordId) || null;
          } catch {
            rec = null;
          }
        } else if (isUuid(recordId)) {
          try {
            const { data } = await supabase
              .from('lab_analytics_records')
              .select('*, chembase_equipment_knowledge(*), chembase_experiment_knowledge(*)')
              .eq('id', recordId)
              .single();
            rec = data;
          } catch {
            rec = null;
          }
        }

        if (rec) {
          if (rec.chembase_equipment_knowledge) {
            setEqProfile(rec.chembase_equipment_knowledge);
            setEquipment(rec.chembase_equipment_knowledge.name || '');
          } else if (rec.equipment_name) {
            setEquipment(rec.equipment_name);
          }
          if (rec.chembase_experiment_knowledge) {
            setExpProfile(rec.chembase_experiment_knowledge);
            setExperimentName(rec.chembase_experiment_knowledge.name || '');
          } else if (rec.experiment_name) {
            setExperimentName(rec.experiment_name);
          }
          setObjective(rec.objective || '');
          if (rec.theory) {
            setTheorySegments({
              principle: rec.theory.principle || '',
              working: rec.theory.working || '',
              concepts: rec.theory.concepts || '',
              equations: rec.theory.equations || '',
              variables: rec.theory.variables || '',
              trends: rec.theory.trends || '',
            });
          }
          setProcedure(rec.procedure || '');
          if (rec.observation_data?.columns?.length) {
            setColumns(rec.observation_data.columns);
            setChartX(rec.observation_data.columns[0]?.id || 'col1');
            setChartY(rec.observation_data.columns[1]?.id || rec.observation_data.columns[0]?.id || 'col2');
          }
          if (rec.observation_data?.dataRows?.length) {
            setDataRows(rec.observation_data.dataRows);
          }
          setCalculations(rec.calculations || '');
          setResults(rec.results || '');
          setDiscussion(rec.discussion || '');
          setConclusion(rec.conclusion || '');
          if (rec.safety_info) {
            setPpe(rec.safety_info.ppe || '');
            setHazards(rec.safety_info.hazards || '');
            setPrecautions(rec.safety_info.precautions || '');
          }
          flashBanner('info', 'Loaded saved laboratory record.');
          return;
        }
      }

      // 2. Load equipment profile (localStorage, built-in catalog, or Supabase)
      if (eqId) {
        if (eqId.startsWith('local_')) {
          try {
            const localEqs = JSON.parse(localStorage.getItem(customEqLocalKey) || '[]');
            const found = localEqs.find((e: any) => String(e.id) === eqId);
            if (found) {
              setEqProfile(found);
              setEquipment(found.name);
            }
          } catch { /* ignore */ }
        } else if (eqId.startsWith('builtin_')) {
          const allBuiltins = Object.values(DEFAULT_EQUIPMENT_BY_SUBJECT).flat();
          const found = allBuiltins.find(e => e.id === eqId);
          if (found) {
            setEqProfile(found);
            setEquipment(found.name);
          }
        } else if (isUuid(eqId)) {
          try {
            const { data: eq } = await supabase.from('chembase_equipment_knowledge').select('*').eq('id', eqId).single();
            if (eq) {
              setEqProfile(eq);
              setEquipment(eq.name);
            }
          } catch { /* ignore */ }
        }
      }

      // 3. Load experiment profile (built-in preset or Supabase)
      if (expId && isUuid(expId)) {
        try {
          const { data: exp } = await supabase.from('chembase_experiment_knowledge').select('*').eq('id', expId).single();
          if (exp) {
            setExpProfile(exp);
            setExperimentName(exp.name);
            setObjective(exp.typical_objective || '');
          }
        } catch { /* ignore */ }
      } else if (expId && expId.startsWith('builtin_')) {
        const idx = expId.split('_').pop();
        const names: Record<string, { name: string; obj: string }> = {
          '1': { name: 'Performance & Efficiency Characterization', obj: 'Measure operating curves, throughput, and energy efficiency across varying flow/load conditions.' },
          '2': { name: 'Steady-State Mass & Energy Balance', obj: 'Perform inlet-outlet mass and thermal/hydraulic energy balance verification and quantify losses.' },
          '3': { name: 'Operating Limits & Safety Margin Study', obj: 'Identify safe operating envelope, pressure drop / cavitation / flooding limits, and uncertainty analysis.' },
        };
        const preset = names[idx || '1'] || names['1'];
        setExperimentName(preset.name);
        setObjective(preset.obj);
      }
    }
    loadWorkspaceData();
  }, [eqId, expId, recordId, subjectId]);

  const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: 'setup', label: 'Setup', icon: <Beaker className="w-4 h-4" /> },
    { id: 'theory', label: 'Theory & Method', icon: <FileText className="w-4 h-4" /> },
    { id: 'data', label: 'Observations', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'analysis', label: 'Analysis & Graph', icon: <LineChart className="w-4 h-4" /> },
    { id: 'safety', label: 'Safety', icon: <ShieldAlert className="w-4 h-4" /> },
  ];

  const buildContextPrompt = () => {
    return `
      Subject: ${formattedSubject}
      Equipment Profile: ${JSON.stringify(eqProfile || { name: equipment })}
      Experiment Profile: ${JSON.stringify(expProfile || { name: experimentName })}
      Student Objective: "${objective}"
    `;
  };

  // Deterministic engineering fallbacks so no button ever fails offline
  const buildDeterministicTheory = () => {
    const eqLabel = equipment.trim() || eqProfile?.name || `${formattedSubject} Apparatus`;
    const expLabel = experimentName.trim() || `${eqLabel} Characterization`;
    const params = eqProfile?.operating_parameters?.join(', ') || columns.map(c => c.name).join(', ');
    const comps = eqProfile?.main_components?.join(', ') || 'test section, flow/thermal instrumentation, control valve, and data readout';

    const subjectEqs: Record<string, string> = {
      'fluid-mechanics': '• Continuity: Q = A₁v₁ = A₂v₂ (m³/s)\n• Bernoulli: P₁/ρg + v₁²/2g + z₁ = P₂/ρg + v₂²/2g + z₂ + h_L (m)\n• Darcy-Weisbach: ΔP = f·(L/D)·(ρv²/2) (Pa), Re = ρvD/μ',
      'heat-transfer': '• Fourier Conduction: q = -k·A·(dT/dx) (W)\n• Heat Exchanger Duty: Q = ṁ·Cp·ΔT = U·A·ΔT_lm (W)\n• LMTD: ΔT_lm = (ΔT₁ - ΔT₂) / ln(ΔT₁/ΔT₂) (K)',
      'thermodynamics': '• First Law (Open): Q̇ - Ẇ_s = ṁ·(Δh + Δv²/2 + gΔz) (W)\n• Clausius-Clapeyron: ln(P₂/P₁) = -(ΔH_vap/R)·(1/T₂ - 1/T₁)\n• Efficiency / COP: η = W_net / Q_in; COP = Q_L / W_in',
      'mass-transfer': '• Fick First Law: J_A = -D_AB·(dC_A/dx) (mol/m²·s)\n• Interphase Flux: N_A = K_G·(p_A - p_A*) = K_L·(C_A* - C_A)\n• Packed Column Height: Z = HTU_OG × NTU_OG (m)',
      'separation-processes': '• Relative Volatility: α = (y_A/x_A) / (y_B/x_B)\n• Material Balance: F = D + B; F·z_F = D·x_D + B·x_B\n• Membrane Flux: J_w = A_w·(ΔP - Δπ) (L/m²·h)',
      'reaction-engineering': '• Rate Law: -r_A = k·C_A^n, where k = A·exp(-E_a / RT)\n• CSTR Design: τ = V/v₀ = C_A0·X / (-r_A)\n• PFR Design: τ = C_A0 ∫₀^X dX / (-r_A)',
      'particulate-technology': '• Critical Speed (Ball Mill): N_c = (1/2π)·√(g / (R - r)) (rev/s)\n• Bond Law: E = 10·W_i·(1/√d_p - 1/√d_f) (kWh/t)\n• Ergun / Fluidization: ΔP/L = (1 - ε)(ρ_p - ρ_f)g',
      'process-control': '• PID Law: u(t) = u_0 + K_c·[e(t) + (1/τ_I)∫e dt + τ_D·de/dt]\n• First-Order Plus Dead Time: G(s) = K_p·e^(-θs) / (τs + 1)\n• Valve Sizing: Q = C_v·√(ΔP / SG)',
    };

    const depthPrefix = theoryDepth === 'quick'
      ? '[Quick Summary Mode] '
      : theoryDepth === 'viva'
        ? '[Viva-Focused Mode] '
        : '';

    return {
      principle: `${depthPrefix}This experiment investigates "${objective.trim()}" using the ${eqLabel}. Transport and conservation laws in ${formattedSubject} link the manipulated operating input to the measured steady-state response, enabling direct comparison between experimental performance and theoretical predictions.`,
      working: eqProfile?.working_principle || `The ${eqLabel} integrates ${comps}. Process fluid or material enters the active section under regulated conditions while sensors continuously track ${params} until steady-state equilibrium is achieved.`,
      concepts: `Key ${formattedSubject} concepts for ${expLabel}: conservation of mass/energy/momentum, dimensionless similarity groups, steady-state stabilization criteria, instrument calibration offset, and propagation of measurement uncertainty.${theoryDepth === 'viva' ? ' Viva Tip: Be ready to explain physical causes of deviation from ideal assumptions and how scaling affects performance.' : ''}`,
      equations: subjectEqs[subjectId || ''] || '• Mass Balance: Σṁ_in = Σṁ_out (kg/s)\n• Energy Balance: Q̇ = ṁ·Cp·ΔT (W)\n• Efficiency: η = (Useful Output / Total Input) × 100 (%)',
      variables: `• Independent (Manipulated): ${columns[0]?.name || 'Primary Operating Setpoint'}\n• Dependent (Measured): ${columns.slice(1).map(c => c.name).join(', ') || 'System Response Variable'}\n• Controlled (Constant): Ambient temperature, feed properties, apparatus geometry, and calibration zero.`,
      trends: `As ${columns[0]?.name || 'the independent variable'} varies across the operating range, ${columns[1]?.name || 'the dependent response'} is expected to follow a smooth, reproducible physical trend governed by the transport equations above, with minor systematic deviation at extreme loads due to losses or non-idealities.`,
      procedure: `1. Inspect the ${eqLabel} (${comps}), verify all fittings/valves, and put on required PPE.\n2. Zero and calibrate gauges, thermocouples, or digital sensors prior to startup.\n3. Establish baseline flow/power conditions and allow the system to reach steady state (stable readings over 2–3 minutes).\n4. Record the initial set of readings for ${columns.map(c => c.name).join(', ')} in the Observation Table.\n5. Increment the manipulated variable (${columns[0]?.name || 'primary input'}) stepwise across 5–7 operating points, waiting for steady state at each step.\n6. Collect replicate readings where feasible to quantify random error.\n7. Return controls to safe standby, shut down heaters/pumps in reverse sequence, and clean the workspace.`,
    };
  };

  const buildDeterministicAnalysis = () => {
    const xColDef = columns.find(c => c.id === chartX) || columns[0];
    const yColDef = columns.find(c => c.id === chartY) || columns[1] || columns[0];
    const xName = xColDef?.name || 'X';
    const yName = yColDef?.name || 'Y';

    // Compute per-column statistics
    const colSummaries = columns.map(col => {
      const vals = dataRows
        .map(r => String(r[col.id] ?? '').trim())
        .filter(s => s !== '')
        .map(Number)
        .filter(Number.isFinite);
      if (vals.length === 0) return { name: col.name, n: 0, min: 0, max: 0, mean: 0, sd: 0 };
      const n = vals.length;
      const mean = vals.reduce((a, b) => a + b, 0) / n;
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const variance = n > 1 ? vals.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1) : 0;
      return { name: col.name, n, min, max, mean, sd: Math.sqrt(variance) };
    });

    // Compute OLS linear regression on valid (x, y) pairs
    const pairs = dataRows
      .map(r => {
        const sx = String(r[xColDef?.id || ''] ?? '').trim();
        const sy = String(r[yColDef?.id || ''] ?? '').trim();
        if (sx === '' || sy === '') return null;
        const x = Number(sx);
        const y = Number(sy);
        return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
      })
      .filter((p): p is { x: number; y: number } => p !== null)
      .sort((a, b) => a.x - b.x);

    let regCalcBlock = '';
    let trendSummary = '';
    if (pairs.length >= 2) {
      const n = pairs.length;
      const mx = pairs.reduce((s, p) => s + p.x, 0) / n;
      const my = pairs.reduce((s, p) => s + p.y, 0) / n;
      let sxx = 0, syy = 0, sxy = 0;
      for (const p of pairs) {
        sxx += (p.x - mx) ** 2;
        syy += (p.y - my) ** 2;
        sxy += (p.x - mx) * (p.y - my);
      }
      const slope = sxx > 0 ? sxy / sxx : 0;
      const intercept = my - slope * mx;
      const r = sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0;
      const r2 = r * r;
      const sse = pairs.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0);
      const rmse = Math.sqrt(sse / n);
      const yFirst = pairs[0].y;
      const yLast = pairs[n - 1].y;
      const deltaY = yLast - yFirst;
      const pctChange = yFirst !== 0 ? ((deltaY / Math.abs(yFirst)) * 100) : null;

      regCalcBlock = [
        `OLS Linear Regression (${yName} vs ${xName}, n = ${n} paired observations):`,
        `  Formula:  slope m = Σ[(x_i - x̄)(y_i - ȳ)] / Σ[(x_i - x̄)²],  intercept b = ȳ - m·x̄`,
        `  Inputs:   x̄ = ${mx.toPrecision(5)}, ȳ = ${my.toPrecision(5)}, Sxx = ${sxx.toPrecision(5)}, Sxy = ${sxy.toPrecision(5)}`,
        `  Equation: ${yName} = ${slope.toPrecision(5)} · (${xName}) ${intercept >= 0 ? '+' : '−'} ${Math.abs(intercept).toPrecision(5)}`,
        `  Fit:      Pearson r = ${r.toFixed(4)}, R² = ${r2.toFixed(4)}, RMSE = ${rmse.toPrecision(4)}`,
        `  Net ΔY:   ${yLast.toPrecision(5)} − ${yFirst.toPrecision(5)} = ${deltaY >= 0 ? '+' : ''}${deltaY.toPrecision(5)}${pctChange !== null ? ` (${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(1)}%)` : ''}`,
      ].join('\n');

      const direction = slope > 1e-12 ? 'positive (increasing)' : slope < -1e-12 ? 'negative (decreasing)' : 'flat (invariant)';
      const strength = r2 >= 0.95 ? 'strong linear correlation' : r2 >= 0.75 ? 'moderate linear correlation' : 'nonlinear or scattered behavior';
      trendSummary = `Across ${n} valid data points spanning ${xName} from ${pairs[0].x} to ${pairs[n - 1].x}, ${yName} exhibited a ${direction} trend with slope ${slope.toPrecision(4)} and R² = ${r2.toFixed(4)} (${strength}).`;
    } else if (pairs.length === 1) {
      regCalcBlock = `Single numeric data point recorded: (${xName} = ${pairs[0].x}, ${yName} = ${pairs[0].y}). Enter at least 2–3 points to compute slope and R².`;
      trendSummary = `One observation recorded (${xName} = ${pairs[0].x}, ${yName} = ${pairs[0].y}). Additional operating points are needed for trend fitting.`;
    } else {
      regCalcBlock = `No paired finite numeric values were found for (${xName}, ${yName}). Verify numeric formatting in the Observations table.`;
      trendSummary = `Non-numeric or incomplete paired readings detected for ${xName} vs ${yName}.`;
    }

    const statsLines = colSummaries
      .filter(s => s.n > 0)
      .map(s => `• ${s.name} (n=${s.n}): min = ${s.min.toPrecision(5)}, max = ${s.max.toPrecision(5)}, mean = ${s.mean.toPrecision(5)}, SD = ${s.sd.toPrecision(4)}`)
      .join('\n');

    return {
      calculations: `1. Descriptive Statistics (Actual Recorded Observations):\n${statsLines || 'No numeric columns detected.'}\n\n2. ${regCalcBlock}`,
      results: `${trendSummary} Summary statistics computed directly from the entered laboratory readings confirm the measurable response of ${equipment || formattedSubject} under the tested conditions.`,
      discussion: `The observed relationship between ${xName} and ${yName} aligns with ${formattedSubject} transport/conservation principles. Minor residuals between measured points and the fitted regression line typically arise from sensor resolution limits, transient approach to steady state, ambient heat/friction losses, and manual reading parallax. Repeating boundary runs and checking zero-point calibration will further tighten confidence intervals.`,
      conclusion: `The experimental objective — "${objective.trim()}" — was evaluated quantitatively on ${equipment || formattedSubject} using ${pairs.length} paired measurements. The computed trend and regression parameters provide a reproducible engineering characterization of the system within the tested envelope.`,
    };
  };

  const buildDeterministicSafety = () => {
    const eqLabel = equipment.trim() || eqProfile?.name || formattedSubject;
    const eqHazards = eqProfile?.safety_hazards?.length
      ? eqProfile.safety_hazards.map((h: string) => `• ${h}`).join('\n')
      : '';
    return {
      ppe: `• Chemical splash safety goggles (ANSI Z87.1) at all times in the lab\n• Cotton/flame-resistant laboratory coat (buttoned) and closed-toe shoes\n• Chemical-resistant nitrile or thermal insulated gloves appropriate to ${eqLabel}\n• Hearing protection or dust mask if operating rotating machinery or dry solids`,
      hazards: `${eqHazards ? eqHazards + '\n' : ''}• Pressurized fluid/gas lines and glass apparatus failure risk during flow surges\n• Thermal burns from hot utilities, heated vessels, or electrical heaters\n• Electrical shock hazard if liquid spills contact power supplies or instrumentation\n• Chemical exposure (corrosive, flammable, or toxic vapors) depending on test medium`,
      precautions: `1. Inspect all tubing, clamps, pressure relief valves, and electrical grounding before startup of ${eqLabel}.\n2. Verify ventilation/fume hood and locate the nearest eyewash, safety shower, and emergency stop (E-stop).\n3. Never exceed rated pressure, temperature, or rotational speed limits; ramp setpoints gradually.\n4. Never leave an energized heater, pump, or pressurized rig unattended.\n5. Depressurize, cool to safe handling temperature (<45 °C), clean spills immediately, and dispose of waste in labeled containers.`,
    };
  };

  const handleGenerateAI = async (stepType: 'theory' | 'analysis' | 'safety') => {
    if (!objective.trim()) {
      flashBanner('warning', 'Please define the Student Objective in the Setup step before generating content.');
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

        const rawText = await callAiWithTimeout(prompt, 'Respond strictly with valid JSON only.');
        const data = rawText ? extractJsonObject(rawText) : null;
        if (data && (data.principle || data.procedure)) {
          setTheorySegments({
            principle: data.principle || '',
            working: data.working || '',
            concepts: data.concepts || '',
            equations: data.equations || '',
            variables: data.variables || '',
            trends: data.trends || ''
          });
          setProcedure(data.procedure || '');
          flashBanner('success', 'Theory & procedure generated with AI.');
        } else {
          const fb = buildDeterministicTheory();
          setTheorySegments({
            principle: fb.principle,
            working: fb.working,
            concepts: fb.concepts,
            equations: fb.equations,
            variables: fb.variables,
            trends: fb.trends,
          });
          setProcedure(fb.procedure);
          flashBanner('info', 'Generated structured engineering theory & procedure using built-in curriculum engine.');
        }
      } finally {
        setIsGeneratingTheory(false);
      }
    } else if (stepType === 'analysis') {
      const hasData = dataRows.some(row => columns.some(col => String(row[col.id] ?? '').trim() !== ''));
      if (!hasData) {
        flashBanner('warning', 'No experimental data found. Enter your actual readings in the Observations tab first.');
        return setCurrentStep('data');
      }

      setIsGeneratingAnalysis(true);
      try {
        const namedRows = dataRows.map((row, idx) => {
          const obj: Record<string, string | number> = { Run: idx + 1 };
          columns.forEach(col => {
            obj[col.name] = row[col.id] ?? '';
          });
          return obj;
        });

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
        Actual Student Data with Column Names & Units (JSON array): ${JSON.stringify(namedRows)}`;

        const rawText = await callAiWithTimeout(prompt, 'Respond strictly with valid JSON only.');
        const data = rawText ? extractJsonObject(rawText) : null;
        if (data && (data.calculations || data.results)) {
          setCalculations(data.calculations || '');
          setResults(data.results || '');
          setDiscussion(data.discussion || '');
          setConclusion(data.conclusion || '');
          flashBanner('success', 'Experimental data analyzed with AI.');
        } else {
          const fb = buildDeterministicAnalysis();
          setCalculations(fb.calculations);
          setResults(fb.results);
          setDiscussion(fb.discussion);
          setConclusion(fb.conclusion);
          flashBanner('info', 'Computed exact statistical & OLS regression analysis directly from your observation data.');
        }
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

        const rawText = await callAiWithTimeout(prompt, 'Respond strictly with valid JSON only.');
        const data = rawText ? extractJsonObject(rawText) : null;
        if (data && (data.ppe || data.hazards)) {
          setPpe(data.ppe || '');
          setHazards(data.hazards || '');
          setPrecautions(data.precautions || '');
          flashBanner('success', 'Contextual safety guidelines generated with AI.');
        } else {
          const fb = buildDeterministicSafety();
          setPpe(fb.ppe);
          setHazards(fb.hazards);
          setPrecautions(fb.precautions);
          flashBanner('info', 'Generated contextual laboratory safety protocol from engineering hazard knowledge.');
        }
      } finally {
        setIsGeneratingSafety(false);
      }
    }
  };

  const handleSaveLab = async () => {
    if (!objective.trim()) {
      flashBanner('warning', 'Please enter a Student Objective before saving.');
      return;
    }
    setIsSaving(true);
    try {
      const saveLocally = () => {
        let existing: any[] = [];
        try {
          existing = JSON.parse(localStorage.getItem(savedLabsLocalKey) || '[]');
        } catch {
          existing = [];
        }
        const id = recordId && recordId.startsWith('local_lab_') ? recordId : `local_lab_${Date.now()}`;
        const localRecord = {
          id,
          created_at: new Date().toISOString(),
          subject: subjectId,
          equipment_id: eqId || null,
          experiment_id: expId || null,
          equipment_name: equipment.trim() || eqProfile?.name || 'Custom Equipment',
          experiment_name: experimentName.trim() || expProfile?.name || 'Custom Experiment',
          objective,
          theory: theorySegments,
          procedure,
          observation_data: { columns, dataRows },
          calculations,
          results,
          discussion,
          conclusion,
          safety_info: { ppe, hazards, precautions },
        };
        const updated = [localRecord, ...existing.filter((item: any) => item.id !== id)];
        localStorage.setItem(savedLabsLocalKey, JSON.stringify(updated));
        flashBanner('success', 'Lab saved locally in your browser! You can reopen it anytime from Saved Laboratories.');
      };

      const { data: userData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
      if (userData?.user) {
        const payload = {
          user_id: userData.user.id,
          subject: subjectId,
          equipment_id: isUuid(eqId) ? eqId : null,
          experiment_id: isUuid(expId) ? expId : null,
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

        const { error } = isUuid(recordId)
          ? await supabase.from('lab_analytics_records').update(payload).eq('id', recordId)
          : await supabase.from('lab_analytics_records').insert(payload);

        if (!error) {
          flashBanner('success', 'Lab saved to your cloud account!');
          return;
        }
        console.warn('Supabase lab save failed, falling back to localStorage:', error);
      }

      saveLocally();
    } catch (err: any) {
      console.error(err);
      flashBanner('warning', 'Cloud save unavailable; please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportReport = () => {
    const titleStr = experimentName.trim() || `${equipment.trim() || formattedSubject} Laboratory Report`;
    const tableHeader = `| # | ${columns.map(c => c.name.replace(/\|/g, '/')).join(' | ')} |`;
    const tableSep = `|---|${columns.map(() => '---').join('|')}|`;
    const tableBody = dataRows.map((row, idx) =>
      `| ${idx + 1} | ${columns.map(c => String(row[c.id] ?? '').replace(/\|/g, '/') || '—').join(' | ')} |`
    ).join('\n');

    const md = [
      `# ${titleStr}`,
      ``,
      `- **Subject:** ${formattedSubject.replace(/\b\w/g, c => c.toUpperCase())}`,
      `- **Equipment / Apparatus:** ${equipment || '—'}`,
      `- **Date:** ${new Date().toLocaleDateString()}`,
      ``,
      `## 1. Objective`,
      objective || '—',
      ``,
      `## 2. Theory & Governing Principles`,
      `### A. Principle`,
      theorySegments.principle || '—',
      `### B. Equipment Working`,
      theorySegments.working || '—',
      `### C. Relevant Concepts`,
      theorySegments.concepts || '—',
      `### D. Governing Equations`,
      theorySegments.equations || '—',
      `### E. Variables`,
      theorySegments.variables || '—',
      `### F. Expected Trends`,
      theorySegments.trends || '—',
      ``,
      `## 3. Experimental Procedure`,
      procedure || '—',
      ``,
      `## 4. Observation Table`,
      tableHeader,
      tableSep,
      tableBody,
      ``,
      `## 5. Analysis, Calculations & Discussion`,
      `### Calculations`,
      calculations || '—',
      `### Results`,
      results || '—',
      `### Discussion`,
      discussion || '—',
      `### Conclusion`,
      conclusion || '—',
      ``,
      `## 6. Laboratory Safety`,
      `### Required PPE`,
      ppe || '—',
      `### Identified Hazards`,
      hazards || '—',
      `### Handling & Shutdown Precautions`,
      precautions || '—',
    ].join('\n');

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const slug = titleStr.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 50) || 'lab_report';
    a.download = `${slug}.md`;
    a.click();
    URL.revokeObjectURL(url);
    flashBanner('success', `Exported formatted lab report (${slug}.md).`);
  };

  // Observations Table Methods
  const addColumn = () => {
    const newColId = `col${Date.now()}`;
    setColumns(prev => [...prev, { id: newColId, name: `Var ${prev.length + 1}` }]);
    setDataRows(prev => prev.map(row => ({ ...row, [newColId]: '' })));
  };

  const addRow = () => {
    const newRowId = `row${Date.now()}`;
    const newRow: Record<string, string> = { id: newRowId };
    columns.forEach(col => {
      newRow[col.id] = '';
    });
    setDataRows(prev => [...prev, newRow]);
  };

  const updateColumnName = (id: string, newName: string) => {
    setColumns(prev => prev.map(col => col.id === id ? { ...col, name: newName } : col));
  };

  const updateCell = (rowId: string, colId: string, value: string) => {
    setDataRows(prev => prev.map(row => row.id === rowId ? { ...row, [colId]: value } : row));
  };

  const removeRow = (rowId: string) => {
    setDataRows(prev => prev.filter(row => row.id !== rowId));
  };
  
  const removeColumn = (colId: string) => {
    const nextCols = columns.filter(col => col.id !== colId);
    setColumns(nextCols);
    setDataRows(prev => prev.map(row => {
      const newRow = { ...row };
      delete newRow[colId];
      return newRow;
    }));
    if (chartX === colId) setChartX(nextCols[0]?.id || '');
    if (chartY === colId) setChartY(nextCols[1]?.id || nextCols[0]?.id || '');
  };

  // Process data for charts: strictly finite numeric pairs, sorted by X ascending
  const validChartData = useMemo(() => {
    if (!chartX || !chartY) return [];
    const pts: { x: number; y: number }[] = [];
    for (const row of dataRows) {
      const sx = String(row[chartX] ?? '').trim();
      const sy = String(row[chartY] ?? '').trim();
      if (sx === '' || sy === '') continue;
      const x = Number(sx);
      const y = Number(sy);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        pts.push({ x, y });
      }
    }
    return pts.sort((a, b) => a.x - b.x);
  }, [dataRows, chartX, chartY]);

  const activeChartXName = columns.find(c => c.id === chartX)?.name || chartX;
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
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {recordId ? 'Saved Laboratory' : 'New Laboratory'}
            </h1>
            <p className="text-surface-400 text-sm font-medium capitalize">{formattedSubject}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportReport}
            className="btn-tactile flex items-center gap-2 px-4 py-2 bg-surface-800 hover:bg-surface-700 text-white font-semibold rounded-xl text-sm border border-surface-700 transition-all"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
          <button 
            onClick={handleSaveLab}
            disabled={isSaving || !objective.trim()}
            className="btn-tactile flex items-center gap-2 px-6 py-2 bg-primary-600 disabled:bg-surface-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-sm shadow-[0_0_20px_rgba(138,203,193,0.3)] transition-all"
          >
            {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving...' : 'Save Lab'}
          </button>
        </div>
      </div>

      {/* Inline Status Banner */}
      {statusBanner && (
        <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-xs font-semibold border animate-in fade-in duration-200 ${
          statusBanner.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
            : statusBanner.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
              : 'bg-primary-50 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-200'
        }`}>
          <div className="flex items-center gap-2">
            {statusBanner.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{statusBanner.text}</span>
          </div>
          <button onClick={() => setStatusBanner(null)} className="text-[11px] font-bold opacity-70 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {/* Wizard Navigation */}
      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-surface-800 p-2 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-x-auto">
        {steps.map((step, idx) => {
          const isActive = currentStep === step.id;
          const isPast = steps.findIndex(s => s.id === currentStep) > idx;
          return (
            <Fragment key={step.id}>
              <button 
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive 
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                    : isPast 
                      ? 'text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700'
                      : 'text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
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
              <p className="text-surface-500 text-sm">Define your exact objective. The assistant relies on this objective to tailor theory, equations, and safety guidelines.</p>
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
                This objective guides theory, governing equations, and analysis. Do not leave it blank.
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
            
            <div className="flex justify-between pt-4 border-t border-surface-100 dark:border-surface-700">
              <button 
                onClick={() => setCurrentStep('setup')}
                className="btn-tactile px-5 py-2.5 bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200 font-semibold rounded-xl text-sm flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Previous Step
              </button>
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
                  The assistant never fabricates experimental data. Enter your actual physical observations here to proceed with calculations and analysis.
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
                            value={row[col.id] ?? ''}
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

            <div className="flex justify-between pt-4 border-t border-surface-100 dark:border-surface-700">
              <button 
                onClick={() => setCurrentStep('theory')}
                className="btn-tactile px-5 py-2.5 bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200 font-semibold rounded-xl text-sm flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Previous Step
              </button>
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
                  {validChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={validChartData} margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                        <XAxis 
                          type="number"
                          dataKey="x"
                          name={activeChartXName}
                          domain={['auto', 'auto']}
                          tick={{ fontSize: 12, fill: '#64748b' }} 
                          tickLine={false} 
                          axisLine={{ stroke: '#cbd5e1' }}
                        />
                        <YAxis 
                          domain={['auto', 'auto']}
                          tick={{ fontSize: 12, fill: '#64748b' }} 
                          tickLine={false} 
                          axisLine={{ stroke: '#cbd5e1' }}
                        />
                        <Tooltip 
                          formatter={(val: any) => [val, activeChartYName]}
                          labelFormatter={(lbl: any) => `${activeChartXName}: ${lbl}`}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 500 }} />
                        <Line 
                          type="monotone" 
                          dataKey="y" 
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

            <div className="flex justify-between pt-4 border-t border-surface-100 dark:border-surface-700">
              <button 
                onClick={() => setCurrentStep('data')}
                className="btn-tactile px-5 py-2.5 bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200 font-semibold rounded-xl text-sm flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Previous Step
              </button>
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

            <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-surface-100 dark:border-surface-700">
              <button 
                onClick={() => setCurrentStep('analysis')}
                className="btn-tactile px-5 py-2.5 bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200 font-semibold rounded-xl text-sm flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Previous Step
              </button>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleExportReport}
                  className="btn-tactile px-5 py-2.5 bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 text-surface-800 dark:text-white font-semibold rounded-xl text-sm flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Export Report
                </button>
                <button 
                  onClick={handleSaveLab}
                  disabled={isSaving || !objective.trim()}
                  className="btn-tactile px-6 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-surface-400 text-white font-semibold rounded-xl text-sm flex items-center gap-2"
                >
                  {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving...' : 'Save Lab'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
