import { useState, useMemo, useEffect, useRef } from 'react';
import { Routes, Route, NavLink, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { CORE_INDUSTRIES } from '../data/coreIndustries';
import { CENTRAL_EQUIPMENT_DATABASE, type EquipmentItem } from '../data/equipmentDatabase';
import { 
  ArrowLeft, ArrowRight, LayoutTemplate, GitBranch, Activity, Box, 
  ThermometerSun, Sliders, Calculator, ShieldAlert, Leaf, 
  Settings, BrainCircuit, GraduationCap, Bot, Briefcase, 
  Users, FileText, Star, AlertTriangle, Target,
  Layers, Check, Send, Sparkles, X, ExternalLink,
  BookOpen, Award
} from 'lucide-react';
import ProcessFlowViewer from './ProcessFlowViewer';

export default function IndustryDashboard() {
  const { industryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [explanationLevel, setExplanationLevel] = useState<'beginner' | 'student' | 'advanced' | 'interview'>('student');
  
  // Interactive equipment modal
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentItem | null>(null);

  // Interactive challenge state
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  
  // Interactive mass energy balance state (raw string inputs for clean typing without snapping)
  const [productionRateStr, setProductionRateStr] = useState<string>('4000'); // tons/day
  const [matFeedRateStr, setMatFeedRateStr] = useState<string>('1000'); // kg/hr
  const [matConversionStr, setMatConversionStr] = useState<string>('85'); // %
  const [energyMassFlowStr, setEnergyMassFlowStr] = useState<string>('1000'); // kg/hr
  const [energyCpStr, setEnergyCpStr] = useState<string>('2.5'); // kJ/kg·K
  const [energyEfficiencyStr, setEnergyEfficiencyStr] = useState<string>('92'); // %
  const [energyFeedTempStr, setEnergyFeedTempStr] = useState<string>('25'); // °C
  const [energyTargetTempStr, setEnergyTargetTempStr] = useState<string>('350'); // °C
  
  // Interactive troubleshooting selector state
  const [selectedProcId, setSelectedProcId] = useState<string>('');
  const [selectedProbId, setSelectedProbId] = useState<string>('');

  // Interactive internship progress state
  const [completedDays, setCompletedDays] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(`internship_days_${industryId}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<number, number>>({});
  const [showAssessmentResult, setShowAssessmentResult] = useState(false);
  
  // Interactive tutor state
  const tutorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tutorQuery, setTutorQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai', text: string }>>([
    { sender: 'ai', text: 'Welcome to the Industrial Knowledge Assistant! I am trained on full operational flows, PID control loops, mass & energy balances, and troubleshooting cases. Ask me any technical question or select one of the suggested prompts below.' }
  ]);
  
  // Interactive interview state
  const [interviewCategory, setInterviewCategory] = useState<'All' | 'Technical' | 'Equipment' | 'Process' | 'Troubleshooting' | 'Safety' | 'Control' | 'HR'>('All');
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});

  // Notes & bookmarks
  const [userNotes, setUserNotes] = useState<string>(() => localStorage.getItem(`notes_${industryId}`) || '');
  const [savedProcesses, setSavedProcesses] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(`saved_proc_${industryId}`) || '[]'); } catch { return []; }
  });

  const industry = CORE_INDUSTRIES.find(ind => ind.id === industryId);

  // Reload per-industry persisted state and reset transient UI when switching sectors
  useEffect(() => {
    if (tutorTimeoutRef.current) {
      clearTimeout(tutorTimeoutRef.current);
      tutorTimeoutRef.current = null;
    }
    if (!industryId) return;
    setUserNotes(localStorage.getItem(`notes_${industryId}`) || '');
    try {
      setSavedProcesses(JSON.parse(localStorage.getItem(`saved_proc_${industryId}`) || '[]'));
    } catch {
      setSavedProcesses([]);
    }
    try {
      const savedDays = localStorage.getItem(`internship_days_${industryId}`);
      setCompletedDays(savedDays ? JSON.parse(savedDays) : []);
    } catch {
      setCompletedDays([]);
    }
    setSelectedProcId('');
    setSelectedProbId('');
    setSelectedOptions({});
    setAssessmentAnswers({});
    setShowAssessmentResult(false);
    setRevealedAnswers({});
    setTutorQuery('');
    const currentInd = CORE_INDUSTRIES.find(ind => ind.id === industryId);
    setChatMessages([
      {
        sender: 'ai',
        text: `Welcome to the ${currentInd?.name || 'Industrial'} Knowledge Assistant! Ask me about flowsheets, PID control loops, mass & energy balances, or plant troubleshooting for this sector.`
      }
    ]);

    // Track visited sectors for Global My Industry progress
    try {
      const visited: string[] = JSON.parse(localStorage.getItem('chembase_visited_industries') || '[]');
      if (!visited.includes(industryId)) {
        localStorage.setItem('chembase_visited_industries', JSON.stringify([...visited, industryId]));
      }
    } catch { /* ignore */ }

    return () => {
      if (tutorTimeoutRef.current) {
        clearTimeout(tutorTimeoutRef.current);
        tutorTimeoutRef.current = null;
      }
    };
  }, [industryId]);

  // Smooth scroll to #hash anchor when navigating from PFD or search
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    const timer = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => clearTimeout(timer);
  }, [location.hash, location.pathname]);

  // Close Equipment Modal on Escape key
  useEffect(() => {
    if (!selectedEquipment) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedEquipment(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedEquipment]);

  if (!industry) {
    return (
      <div className="p-16 text-center max-w-xl mx-auto bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-sm mt-10">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2">Industry Not Found</h2>
        <p className="text-surface-500 mb-6">The requested industry module could not be located in the database.</p>
        <button 
          onClick={() => navigate('/advanced/industry/explore')} 
          className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl text-sm shadow-sm hover:bg-primary-700 transition-colors"
        >
          Return to Explore Industries
        </button>
      </div>
    );
  }

  // Master sub-module tabs matching Master Prompt Rules 3-26
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutTemplate },
    { id: 'process-flow', label: 'Process Flow', icon: GitBranch },
    { id: 'processes', label: 'Processes', icon: Activity },
    { id: 'equipment', label: 'Equipment', icon: Box },
    { id: 'parameters', label: 'Operating Parameters', icon: ThermometerSun },
    { id: 'control', label: 'Process Control', icon: Sliders },
    { id: 'mass-energy', label: 'Mass & Energy', icon: Calculator },
    { id: 'safety', label: 'Safety', icon: ShieldAlert },
    { id: 'environment', label: 'Environment', icon: Leaf },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: Settings },
    { id: 'challenges', label: 'Engineering Challenges', icon: BrainCircuit },
    { id: 'subjects', label: 'Subjects Applied', icon: Target },
    { id: 'internship', label: 'Internship Mode', icon: GraduationCap },
    { id: 'tutor', label: 'AI Tutor', icon: Bot },
    { id: 'interview', label: 'Interview Prep', icon: Briefcase },
    { id: 'careers', label: 'Careers', icon: Users },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'my-industry', label: 'My Industry', icon: Star },
  ];

  // Dynamic industry equipment filtered from central database
  const industryEquipmentList = useMemo(() => {
    const procEqIds = industry.processes.flatMap(p => p.equipmentIds);
    return CENTRAL_EQUIPMENT_DATABASE.filter(eq => 
      procEqIds.includes(eq.id) || 
      eq.industrialApplications.some(app => app.toLowerCase().includes(industry.name.toLowerCase().split(' ')[0]))
    );
  }, [industry]);

  // Mass & Energy Calculations with sector-accurate labels & units
  const productionRate = Math.max(0, Number(productionRateStr) || 0);
  const matFeedRate = Math.max(0, Number(matFeedRateStr) || 0);
  const matConversion = Math.min(100, Math.max(0, Number(matConversionStr) || 0));
  const energyMassFlow = Math.max(0, Number(energyMassFlowStr) || 0);
  const energyCp = Math.max(0, Number(energyCpStr) || 0);
  const energyEfficiency = Math.min(100, Math.max(1, Number(energyEfficiencyStr) || 92));
  const energyFeedTemp = Number(energyFeedTempStr) || 0;
  const energyTargetTemp = Number(energyTargetTempStr) || 0;

  const massEnergyMetrics = useMemo(() => {
    if (industry.id === 'cement') {
      return [
        { label: 'Required Raw Meal', value: (productionRate * 1.55).toLocaleString(undefined, { maximumFractionDigits: 0 }), unit: 'tons / day', color: 'text-indigo-600' },
        { label: 'Process CO₂ Emitted', value: (productionRate * 0.55).toLocaleString(undefined, { maximumFractionDigits: 0 }), unit: 'tons / day', color: 'text-rose-600' },
        { label: 'Coal Fuel Consumed', value: (productionRate * (3150 / 25000)).toLocaleString(undefined, { maximumFractionDigits: 1 }), unit: 'tons / day', color: 'text-amber-600' },
        { label: 'Total Electricity', value: (productionRate * 105).toLocaleString(undefined, { maximumFractionDigits: 0 }), unit: 'kWh / day', color: 'text-emerald-600' },
      ];
    }
    if (industry.id === 'fertilizer') {
      return [
        { label: 'Natural Gas Feed', value: (productionRate * 750).toLocaleString(undefined, { maximumFractionDigits: 0 }), unit: 'Nm³ / day', color: 'text-indigo-600' },
        { label: 'CO₂ Generated / Captured', value: (productionRate * 1.25).toLocaleString(undefined, { maximumFractionDigits: 1 }), unit: 't / day', color: 'text-rose-600' },
        { label: 'Steam Requirement', value: (productionRate * 2.2).toLocaleString(undefined, { maximumFractionDigits: 1 }), unit: 't / day', color: 'text-amber-600' },
        { label: 'Total Electricity', value: (productionRate * 650).toLocaleString(undefined, { maximumFractionDigits: 0 }), unit: 'kWh / day', color: 'text-emerald-600' },
      ];
    }
    return [
      { label: 'Required Raw Feedstock', value: (productionRate * 1.25).toLocaleString(undefined, { maximumFractionDigits: 0 }), unit: 'tons / day', color: 'text-indigo-600' },
      { label: 'Process CO₂ Emitted', value: (productionRate * 0.4).toLocaleString(undefined, { maximumFractionDigits: 0 }), unit: 'tons / day', color: 'text-rose-600' },
      { label: 'Thermal Fuel Equivalent', value: (productionRate * 0.12).toLocaleString(undefined, { maximumFractionDigits: 1 }), unit: 'tons / day', color: 'text-amber-600' },
      { label: 'Total Electricity', value: (productionRate * 95).toLocaleString(undefined, { maximumFractionDigits: 0 }), unit: 'kWh / day', color: 'text-emerald-600' },
    ];
  }, [industry.id, productionRate]);

  // Simplified Material Balance Output
  const materialBalanceOutput = useMemo(() => {
    const productFlow = (matFeedRate * (matConversion / 100)).toFixed(1);
    const unreactedFlow = (matFeedRate * (1 - matConversion / 100)).toFixed(1);
    return { productFlow, unreactedFlow };
  }, [matFeedRate, matConversion]);

  // Thermodynamically consistent Energy Balance Output (handles both heating & cooling)
  const energyBalanceOutput = useMemo(() => {
    const deltaT = Math.abs(energyTargetTemp - energyFeedTemp);
    const mode = energyTargetTemp > energyFeedTemp ? 'Heating' : energyTargetTemp < energyFeedTemp ? 'Cooling' : 'Isothermal';
    const qUsefulKW = (energyMassFlow / 3600) * energyCp * deltaT;
    const etaFrac = energyEfficiency / 100;
    const qInputKW = qUsefulKW / etaFrac;
    const qLossKW = qInputKW - qUsefulKW;
    return {
      mode,
      deltaT: deltaT.toFixed(1),
      qUsefulKW: qUsefulKW.toFixed(1),
      qInputKW: qInputKW.toFixed(1),
      qLossKW: qLossKW.toFixed(1),
      efficiency: energyEfficiency.toFixed(0),
    };
  }, [energyMassFlow, energyCp, energyEfficiency, energyFeedTemp, energyTargetTemp]);

  // Industry-specific tutor prompts
  const tutorChips = useMemo(() => {
    if (industry.id === 'cement') {
      return [
        'Why is gypsum added to clinker?',
        'What is LSF in raw meal?',
        'How does SNCR control NOx?',
        'What temperature is the burning zone?'
      ];
    }
    if (industry.id === 'fertilizer') {
      return [
        'How does the primary steam reformer work?',
        'Why is Haber-Bosch conversion limited to 15-20%?',
        'How is CO2 captured for urea synthesis?',
        'What causes catalyst poisoning in ammonia loops?'
      ];
    }
    if (industry.id === 'oil-gas' || industry.id === 'petrochemical') {
      return [
        'What prevents High Temperature Hydrogen Attack (HTHA)?',
        'How does Atmospheric Distillation separate crude fractions?',
        'Why is cross-limiting air-fuel control used on fired heaters?',
        'How do we prevent centrifugal pump cavitation?'
      ];
    }
    const firstProc = industry.processes[0]?.name || `${industry.name} primary unit`;
    return [
      `Explain the working principle of ${firstProc}`,
      `What are the key process control loops in ${industry.name}?`,
      `What major safety hazards exist in ${industry.name}?`,
      `How are mass and energy balances reconciled in ${industry.name}?`
    ];
  }, [industry]);

  // Internship assessment questions
  const internshipQuestions = useMemo(() => [
    {
      q: "1. What is the fundamental mechanism used in a grate cooler or feed-effluent exchanger to recover thermal energy back into the main thermal reactor/kiln?",
      opts: [
        "Counter-current heat recovery transfers sensible heat from hot product/effluent to preheat incoming air or feed",
        "External water sprays quench the shell to generate low-grade mist",
        "Increasing excess combustion air above 80% reduces stack heat loss"
      ],
      correct: 0,
      explanation: "Counter-current recuperation preheats combustion air or feed streams directly from hot product/effluent, cutting primary fuel demand."
    },
    {
      q: "2. Why does a CO reading above 0.5% at a kiln or furnace exhaust require an automatic trip of an Electrostatic Precipitator (ESP)?",
      opts: [
        "CO will immediately corrode the carbon steel shell",
        "CO mixed with oxygen creates an explosive mixture that can be ignited by high-voltage ESP sparks",
        "CO dissolves the downstream ceramic packing"
      ],
      correct: 1,
      explanation: "Unburned CO + O₂ inside a high-voltage ESP creates a severe explosion hazard when sparking occurs."
    },
    {
      q: "3. In a closed-loop centrifugal pump system, what happens if NPSH_available falls below NPSH_required?",
      opts: [
        "Pump discharge head increases steadily due to vapor lift",
        "Vapor bubbles form at the impeller eye and collapse violently (cavitation), eroding the impeller and dropping head",
        "Motor efficiency improves because vapor has lower viscosity"
      ],
      correct: 1,
      explanation: "Cavitation occurs when local suction pressure drops below fluid vapor pressure (NPSH_A < NPSH_R), causing mechanical damage and loss of head."
    },
    {
      q: "4. In a fired heater with cross-limiting (lead-lag) air-to-fuel ratio control, what happens when heat demand increases?",
      opts: [
        "Fuel flow increases first while air lags behind",
        "Combustion air flow leads (increases first) before fuel flow rises, preventing fuel-rich explosive mixtures",
        "Both valves lock at 50% until manual operator override"
      ],
      correct: 1,
      explanation: "Cross-limiting ensures air leads fuel on load increase and fuel leads air on load decrease, preventing hazardous fuel-rich combustion."
    }
  ], []);

  const assessmentScore = useMemo(() => {
    return internshipQuestions.reduce((acc, q, idx) => acc + (assessmentAnswers[idx] === q.correct ? 1 : 0), 0);
  }, [assessmentAnswers, internshipQuestions]);
  const assessmentPct = Math.round((assessmentScore / internshipQuestions.length) * 100);
  const assessmentPassed = assessmentPct >= 70;

  // Persist completed internship days per industry
  const toggleInternshipDay = (day: number) => {
    const next = completedDays.includes(day)
      ? completedDays.filter(d => d !== day)
      : [...completedDays, day].sort((a, b) => a - b);
    setCompletedDays(next);
    localStorage.setItem(`internship_days_${industryId}`, JSON.stringify(next));
  };

  // Handle Ask Tutor
  const handleSendTutor = (customQuery?: string) => {
    const q = customQuery || tutorQuery;
    if (!q.trim()) return;

    setChatMessages(prev => [...prev, { sender: 'user' as const, text: q }]);
    setTutorQuery('');

    if (tutorTimeoutRef.current) {
      clearTimeout(tutorTimeoutRef.current);
    }

    const activeIndustry = industry;
    tutorTimeoutRef.current = setTimeout(() => {
      tutorTimeoutRef.current = null;
      let reply = `In the ${activeIndustry.name}, chemical engineering operations require strict mass and energy balance reconciliation. Specifically regarding "${q}", engineers optimize reaction kinetics, fluid transport, and automated PID loops to maximize single-pass conversion while preventing thermal degradation.`;
      
      const qLower = q.toLowerCase();
      if (qLower.includes('gypsum')) {
        reply = "Gypsum (CaSO4·2H2O) is inter-ground with clinker at 3–5 wt% during finish milling. It reacts with Tricalcium Aluminate (C3A) to precipitate ettringite crystals, retarding hydration to prevent flash-setting of concrete.";
      } else if (qLower.includes('lsf') || qLower.includes('modulus')) {
        reply = "The Lime Saturation Factor (LSF) controls the molar ratio of CaO to acidic oxides (SiO2, Al2O3, Fe2O3). Typical target is 94–98%. If LSF > 100%, uncombined free lime (f-CaO) causes concrete unsoundness; if LSF < 90%, clinker formation is sluggish and early strength drops.";
      } else if (qLower.includes('sncr') || qLower.includes('nox')) {
        reply = "Selective Non-Catalytic Reduction (SNCR) injects aqueous ammonia or urea into the precalciner at 850 °C–1050 °C, chemically reducing NOx into harmless N2 and H2O without requiring expensive precious metal catalysts.";
      } else if (qLower.includes('htha') || qLower.includes('hydrogen attack')) {
        reply = "High Temperature Hydrogen Attack (HTHA) occurs above ~200 °C under high hydrogen partial pressures when atomic hydrogen diffuses into carbon steel and reacts with iron carbides to form trapped methane (CH4), causing internal fissuring and brittle rupture. Prevention relies on selecting Cr–Mo alloy steels (e.g., 1.25Cr–0.5Mo, 2.25Cr–1Mo) or austenitic stainless cladding strictly within API RP 941 Nelson Curve operating envelopes.";
      } else if (qLower.includes('poison')) {
        reply = "Promoted iron ammonia-synthesis catalysts suffer temporary poisoning from oxygen-bearing compounds (H2O, CO, CO2, O2 — kept <10 ppm via CO2 scrubbing and catalytic methanation) and permanent poisoning from sulfur, chlorine, phosphorus, and arsenic. Upstream hydrodesulfurization (CoMo/NiMo) followed by a Zinc Oxide (ZnO) guard bed strips sulfur below 0.1 ppmv to protect both reformer nickel tubes and synthesis beds.";
      } else if (qLower.includes('urea') || qLower.includes('co2')) {
        reply = "In integrated ammonia-urea complexes, CO2 generated during steam reforming and water-gas shift is absorbed from raw syngas using Benfield (hot K2CO3) or activated MDEA (aMDEA) scrubbing, then thermally stripped at >99% purity. Compressed to 140–160 bar, CO2 reacts exothermically with liquid NH3 to form ammonium carbamate (2NH3 + CO2 ⇌ NH2COONH4), which endothermically dehydrates to urea (NH2CONH2 + H2O) inside a high-pressure stripper-recycle loop.";
      } else if (qLower.includes('haber') || qLower.includes('ammonia') || qLower.includes('bosch')) {
        reply = "The Haber-Bosch reaction (N2 + 3H2 ⇌ 2NH3, ΔH = −92 kJ/mol) is exothermic and mole-reducing. While Le Chatelier's principle favors low temperature and high pressure, iron catalysts require 400–480 °C for practical reaction kinetics, thermodynamically capping single-pass conversion to 15–20% at 150–250 bar. Chilling and condensing liquid NH3 followed by continuous unreacted gas recycle (with a small purge for Ar/CH4 inerts) drives overall conversion above 98%.";
      } else if (qLower.includes('reformer') || qLower.includes('smr')) {
        reply = "The primary steam methane reformer (SMR) endothermically converts desulfurized CH4 and steam into H2, CO, and CO2 at ~800 °C and 25–35 bar inside fired Ni-catalyst tubes. A Steam-to-Carbon (S/C) molar ratio near 3.0 is maintained to suppress Boudouard/cracking carbon coking on the nickel catalyst.";
      } else if (qLower.includes('distillation') || qLower.includes('crude')) {
        reply = "The Atmospheric Distillation Unit (ADU) preheats desalted crude through a feed-effluent heat-exchanger train and fired furnace to 350–370 °C (below thermal cracking thresholds) before entering the flash zone. Across 30–50 trays with circulating pumparounds and steam side-strippers, vapor-liquid countercurrent fractionation separates boiling-range cuts: fuel gas & LPG overhead, naphtha, kerosene/jet, diesel, atmospheric gas oil (AGO), and atmospheric residue bottoms sent to Vacuum Distillation.";
      } else if (qLower.includes('cross-limiting') || qLower.includes('fired heater')) {
        reply = "Cross-limiting (lead-lag) air-to-fuel ratio control uses high/low selectors so that on a firing demand increase, combustion air flow leads (ramps up first) before fuel gas is allowed to rise; on a load decrease, fuel gas drops first before combustion air is reduced. This guarantees excess O2 at all transients and prevents dangerous fuel-rich unburned hydrocarbon accumulation inside the firebox.";
      } else if (qLower.includes('cavitation') || qLower.includes('npsh') || qLower.includes('pump')) {
        reply = "Centrifugal pump cavitation happens when suction pressure at the impeller eye falls below the liquid's vapor pressure (NPSH_available < NPSH_required), forming vapor bubbles that implode violently in high-pressure zones and pit the impeller. Engineers prevent it by maintaining NPSH_A ≥ NPSH_R + 1.0–1.5 m margin: elevating the suction vessel, minimizing suction-line friction/elbows, subcooling the liquid, or installing an impeller inducer.";
      } else if (qLower.includes('burning zone') || qLower.includes('temperature')) {
        reply = "The burning zone of a rotary kiln operates between 1400 °C and 1480 °C to generate 20–25% liquid phase (melt). This enables rapid chemical diffusion of solid lime (CaO) into dicalcium silicate (C2S) to synthesize Alite (C3S).";
      } else if (qLower.includes('control') || qLower.includes('pid')) {
        const loops = activeIndustry.processes.flatMap(p => p.control);
        if (loops.length > 0) {
          const sample = loops.slice(0, 3).map(l => `${l.controlledVariable} via ${l.controller} modulating ${l.manipulatedVariable}`).join('; ');
          reply = `Key process control loops in ${activeIndustry.name} include: ${sample}. Multi-loop DCS architectures combine feedback PID, cascade loops (fast inner flow/pressure slave stabilizing slow outer temperature/composition master), ratio control for feed stoichiometry, and independent Safety Instrumented Systems (SIS) for emergency trips.`;
        } else {
          reply = `In ${activeIndustry.name}, Distributed Control Systems (DCS) stabilize critical quality and safety variables using feedback PID, cascade temperature-to-utility loops, feedforward ratio control for reagent dosing, and independent SIL-rated Safety Instrumented Systems (SIS) for high-pressure/high-temperature shutdown interlocks.`;
        }
      } else if (qLower.includes('safety') || qLower.includes('hazard')) {
        const hazards = activeIndustry.processes.flatMap(p => p.hazards);
        if (hazards.length > 0) {
          const summary = hazards.slice(0, 3).map(h => `${h.type} (${h.description})`).join('; ');
          reply = `Major hazards in ${activeIndustry.name} include: ${summary}. Risk mitigation follows Process Safety Management (PSM): HAZOP & LOPA studies, ASME/API 520 pressure relief valves, gas/flame detection, Lockout-Tagout (LOTO), and chemical/thermal PPE.`;
        } else {
          reply = `Key safety hazards in ${activeIndustry.name} include thermal/exothermic runaways, toxic or corrosive chemical exposure, overpressurization, flammable vapor/dust atmospheres, and rotating-equipment energy. Plants manage these through HAZOP/LOPA layers of protection, relief systems (PSV/rupture discs), containment/scrubbing, gas detection, LOTO, and strict PPE protocols.`;
        }
      } else if (qLower.includes('balance')) {
        const firstProc = activeIndustry.processes[0];
        if (firstProc) {
          reply = `In ${activeIndustry.name}, plant-wide balances enforce steady-state conservation (Σṁ_in = Σṁ_out and ΣQ̇_in + ΣẆ = ΣQ̇_out + ΔH_rxn). For example, in ${firstProc.name}: Mass balance — ${firstProc.massBalanceDesc} Energy balance — ${firstProc.energyBalanceDesc} Engineers reconcile metered flows using data reconciliation to detect sensor drift and apply Pinch Analysis to maximize heat recovery.`;
        } else {
          reply = `In ${activeIndustry.name}, engineers close overall and component mass balances (In + Generation = Out + Consumption + Accumulation) alongside enthalpy/energy balances (sensible heat, latent phase changes, and reaction enthalpies). Metered plant data are reconciled via weighted least-squares to eliminate gross instrument errors, while Pinch Analysis minimizes external hot/cold utility duties.`;
        }
      } else if (qLower.includes('working principle') || qLower.includes('explain')) {
        const firstProc = activeIndustry.processes[0];
        if (firstProc) {
          const conds = Object.entries(firstProc.typicalConditions).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(', ');
          reply = `${firstProc.name} in ${activeIndustry.name}: ${firstProc.purpose} Working principle — ${firstProc.workingPrinciple}${conds ? ` Typical operating window: ${conds}.` : ''}`;
        } else {
          reply = `In ${activeIndustry.name}, core unit operations integrate feedstock preparation, controlled reaction or bioprocessing, multi-stage separation/purification, and utility heat recovery: ${activeIndustry.description}`;
        }
      }

      setChatMessages(prev => [...prev, { sender: 'ai' as const, text: reply }]);
    }, 500);
  };

  // Toggle bookmark process
  const toggleSaveProcess = (procId: string) => {
    const updated = savedProcesses.includes(procId) 
      ? savedProcesses.filter(id => id !== procId)
      : [...savedProcesses, procId];
    setSavedProcesses(updated);
    localStorage.setItem(`saved_proc_${industryId}`, JSON.stringify(updated));
  };

  // Save notes
  const handleSaveNotes = (val: string) => {
    setUserNotes(val);
    localStorage.setItem(`notes_${industryId}`, val);
  };

  // Interview Questions Bank
  const interviewQuestions = useMemo(() => {
    return [
      {
        id: 'iq1',
        category: 'Technical',
        q: 'What are the main chemical phases in Portland cement clinker and their individual roles in strength development?',
        a: 'Alite (C3S, 50-70%) hydrates rapidly to provide 1-28 day early compressive strength. Belite (C2S, 15-30%) hydrates slowly to provide long-term ultimate strength (>28 days to 1 year). Tricalcium Aluminate (C3A, 5-10%) contributes to rapid early hydration but generates high heat and is vulnerable to sulfate attack. Brownmillerite (C4AF, 5-15%) acts as an essential fluxing liquid phase reducing kiln burning temperature.'
      },
      {
        id: 'iq2',
        category: 'Equipment',
        q: 'How does a Vertical Roller Mill (VRM) achieve 25-35% lower specific power consumption compared to a traditional Ball Mill?',
        a: 'A VRM utilizes bed compression grinding between heavy hydraulic rollers and a rotating table rather than random ball impact collisions. It integrates crushing, grinding, drying (using hot exhaust gases), and dynamic classification in a single compact housing, avoiding the massive kinetic and acoustic energy dissipation inherent to tumbling ball mills.'
      },
      {
        id: 'iq3',
        category: 'Process',
        q: 'Why is single-pass conversion in the Haber-Bosch ammonia synthesis loop limited to 15-20%?',
        a: 'The synthesis reaction (N2 + 3H2 <-> 2NH3) is exothermic (ΔH = -92 kJ/mol). Operating at high temperatures (>400°C) is required for catalytic reaction rate across the iron catalyst, but thermodynamically shifts the chemical equilibrium backward (Le Chatelier principle). Therefore, single-pass conversion is low, requiring an efficient recycle loop with ammonia chilling and condensation.'
      },
      {
        id: 'iq4',
        category: 'Troubleshooting',
        q: 'If kiln inlet CO rises rapidly to 0.45% while O2 drops below 0.8%, what immediate action must the control room engineer take and why?',
        a: 'The engineer must cut fuel feed immediately and ramp up induced draft (ID) fan speed to provide excess air. High CO in the presence of air forms an explosive mixture in downstream electrostatic precipitators (ESPs). If CO exceeds 0.5%, the ESP high-voltage field automatically trips to prevent a catastrophic explosion.'
      },
      {
        id: 'iq5',
        category: 'Safety',
        q: 'What is High Temperature Hydrogen Attack (HTHA) and how is it prevented in refinery hydrotreaters?',
        a: 'HTHA occurs when atomic hydrogen diffuses into carbon steel at elevated temperatures (>200°C) and pressures, reacting with dissolved carbon to form methane gas (CH4). Methane cannot diffuse out, creating internal microscopic fissuring and catastrophic brittle rupture. It is prevented by selecting alloy steels with chromium and molybdenum specified by the API 941 Nelson Curves.'
      },
      {
        id: 'iq6',
        category: 'Control',
        q: 'Explain the working principle of a cross-limiting air-to-fuel ratio control scheme on a fired heater.',
        a: 'Cross-limiting (lead-lag) control ensures that when heat demand increases, combustion air flow leads (increases first) before fuel gas flow is increased. Conversely, when heat demand drops, fuel gas flow decreases first before combustion air is reduced. This strictly prevents fuel-rich incomplete combustion and explosion hazards in the firebox.'
      },
      {
        id: 'iq7',
        category: 'HR',
        q: 'How would you handle a disagreement with a senior shift operator who insists on bypassing a high-pressure relief interlock to maintain plant production quotas?',
        a: 'Safety interlocks are non-negotiable legal and life-critical boundaries. I would refuse the bypass, clearly explain the Process Safety Management (PSM) and overpressurization failure consequences, and initiate standard Management of Change (MOC) procedures with the Plant Manager and Safety Superintendent.'
      }
    ].filter(item => interviewCategory === 'All' || item.category === interviewCategory);
  }, [interviewCategory]);

  return (
    <div className="max-w-7xl mx-auto pb-24 animate-in fade-in duration-500">
      
      {/* Top Breadcrumb Navigation */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <button 
          onClick={() => navigate('/advanced/industry/explore')}
          className="flex items-center gap-2 text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm font-bold bg-white dark:bg-surface-900 px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Explore Industries
        </button>

        {/* Explain Like a Student Toggle */}
        <div className="flex items-center gap-1.5 bg-surface-100 dark:bg-surface-800 rounded-xl p-1 border border-surface-200 dark:border-surface-700 text-xs">
          <span className="font-bold text-surface-400 uppercase tracking-widest px-2 hidden sm:inline">Explain Level:</span>
          {(['beginner', 'student', 'advanced', 'interview'] as const).map(lvl => (
            <button 
              key={lvl}
              onClick={() => setExplanationLevel(lvl)}
              className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all ${
                explanationLevel === lvl 
                  ? 'bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm' 
                  : 'text-surface-500 hover:text-surface-900 dark:hover:text-white'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Industry Detail Header */}
      <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-8 mb-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="text-xs font-black uppercase tracking-widest text-primary-600 bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800 px-3 py-1 rounded-full">
            Sector: {industry.name}
          </span>
          <span className="text-xs font-semibold text-surface-500">
            {industry.processes.length} Processes &bull; {industryEquipmentList.length} Central Equipment Units &bull; {industry.roles.length} Engineering Roles
          </span>
        </div>

        <h1 className="text-4xl font-black text-surface-900 dark:text-white tracking-tight mb-4 relative z-10">
          {industry.name}
        </h1>
        <p className="text-surface-600 dark:text-surface-300 max-w-4xl text-base leading-relaxed mb-8 relative z-10">
          {industry.description}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {/* Main Products */}
          <div className="bg-surface-50 dark:bg-surface-950 p-6 rounded-2xl border border-surface-200 dark:border-surface-800">
            <h3 className="text-xs font-bold text-surface-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Box className="w-4 h-4 text-primary-500" /> Main Products
            </h3>
            <div className="space-y-3">
              {industry.products.map(p => (
                <div key={p.name} className="bg-white dark:bg-surface-900 p-3.5 rounded-xl border border-surface-200/60 dark:border-surface-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-surface-900 dark:text-white text-sm">{p.name}</span>
                    <span className="text-[10px] font-bold text-primary-600 bg-primary-50 dark:bg-primary-950 px-2 py-0.5 rounded">Route: {p.productionRoute}</span>
                  </div>
                  <span className="text-xs text-surface-500">{p.purpose}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Raw Materials */}
          <div className="bg-surface-50 dark:bg-surface-950 p-6 rounded-2xl border border-surface-200 dark:border-surface-800">
            <h3 className="text-xs font-bold text-surface-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent-500" /> Raw Materials & Feedstocks
            </h3>
            <div className="space-y-3">
              {industry.rawMaterials.map(r => (
                <div key={r.name} className="bg-white dark:bg-surface-900 p-3.5 rounded-xl border border-surface-200/60 dark:border-surface-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-surface-900 dark:text-white text-sm">{r.name}</span>
                    <span className="text-[10px] font-bold text-surface-400 bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded">Entry: {r.entryPoint}</span>
                  </div>
                  <span className="text-xs text-surface-500">{r.purpose} &bull; <em className="text-surface-400">{r.properties}</em></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-module Navigation Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 bg-surface-100/70 dark:bg-surface-900/70 p-2 rounded-2xl border border-surface-200 dark:border-surface-800">
        {tabs.map(tab => {
          const tabUrl = `/advanced/industry/${industry.id}/${tab.id}`;
          const isTabActive = location.pathname === tabUrl || (location.pathname === `/advanced/industry/${industry.id}` && tab.id === 'overview');
          return (
            <NavLink
              key={tab.id}
              to={tabUrl}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                isTabActive 
                  ? 'bg-white dark:bg-surface-800 text-primary-600 dark:text-primary-400 shadow-sm border border-surface-200 dark:border-surface-700' 
                  : 'text-surface-500 hover:text-surface-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-surface-800/50 border border-transparent'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </NavLink>
          );
        })}
      </div>

      {/* Tab Content Display Area */}
      <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 min-h-[550px] shadow-sm overflow-hidden p-8">
        <Routes>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="" element={<Navigate to="overview" replace />} />
          
          {/* TAB 1: OVERVIEW */}
          <Route path="overview" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <LayoutTemplate className="w-6 h-6 text-primary-500" /> Industry Overview & Engineering Foundations
                </h2>
                <p className="text-surface-500 text-sm">Student-friendly synthesized engineering description tailored for {explanationLevel} level.</p>
              </div>

              {/* Dynamic explanation according to level */}
              <div className="p-6 bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-800 rounded-2xl">
                <h3 className="font-bold text-primary-900 dark:text-primary-200 text-sm mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary-600" /> Technical Synthesis ({explanationLevel.toUpperCase()} View)
                </h3>
                <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed">
                  {explanationLevel === 'beginner' && `The ${industry.name} takes simple natural feedstocks and transforms them through physical crushing, high temperatures, and chemical reactions into foundational products used across global society.`}
                  {explanationLevel === 'student' && `The ${industry.name} is a prime showcase of Chemical Engineering principles: thermodynamics dictates reaction enthalpies, fluid mechanics governs multi-phase slurry and pneumatic flow, and reaction engineering controls kinetics across massive continuous reactors.`}
                  {explanationLevel === 'advanced' && `This industrial flowsheet represents an integrated thermochemical system governed by strict heat recuperation pinch constraints (<3150 MJ/t thermal consumption) and mass continuity. Dynamic process control stabilizes reaction zones against raw feed disturbances.`}
                  {explanationLevel === 'interview' && `In technical interviews, expect questions on mass and energy balance reconciliation, LOTO and HAZOP protocols, PID cascade control loops, and mitigation of thermal stress or unexpected pressure surges across reactors.`}
                </p>
              </div>

              {/* Where Chemical Engineers Work */}
              <div>
                <h3 className="text-base font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-pink-500" /> Where Chemical Engineers Work in this Sector
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {industry.roles.map((r, i) => (
                    <div key={i} className="p-5 bg-surface-50 dark:bg-surface-950 rounded-2xl border border-surface-200 dark:border-surface-800">
                      <h4 className="font-bold text-sm text-surface-900 dark:text-white mb-2">{r.title}</h4>
                      <ul className="text-xs text-surface-600 dark:text-surface-400 space-y-1 list-disc pl-4">
                        {r.responsibilities.slice(0, 3).map((res, idx) => <li key={idx}>{res}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          } />

          {/* TAB 2: PROCESS FLOW */}
          <Route path="process-flow" element={
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-surface-900 dark:text-white flex items-center gap-2">
                    <GitBranch className="w-6 h-6 text-primary-500" /> Interactive Process Flow Diagram
                  </h2>
                  <p className="text-surface-500 text-sm">Not a static image. Click on any process block to inspect its complete unit operation details.</p>
                </div>
              </div>

              <div className="h-[650px] bg-surface-50 dark:bg-surface-950 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden shadow-inner">
                {industry.processes.length > 0 ? (
                  <ProcessFlowViewer 
                    processes={industry.processes} 
                    onProcessClick={(_id) => navigate(`/advanced/industry/${industry.id}/processes#${_id}`)} 
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-surface-400 p-8 text-center">
                    <GitBranch className="w-12 h-12 mb-3 opacity-30" />
                    <p className="font-bold">Process flow model for {industry.name}</p>
                    <p className="text-xs mt-1">Flowchart connections are compiling.</p>
                  </div>
                )}
              </div>
            </div>
          } />

          {/* TAB 3: PROCESSES (Rule 6 - Full 17-point Structure) */}
          <Route path="processes" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-primary-500" /> Standard Process Details
                </h2>
                <p className="text-surface-500 text-sm">Structured unit operations with inputs, outputs, reactions, balances, control, and hazards.</p>
              </div>

              <div className="space-y-8">
                {industry.processes.length === 0 ? (
                  <div className="p-10 text-center bg-surface-50 dark:bg-surface-950 rounded-3xl border border-surface-200 dark:border-surface-800">
                    <Activity className="w-10 h-10 text-surface-300 mx-auto mb-3" />
                    <h3 className="font-bold text-base text-surface-800 dark:text-white mb-1">Unit operations compiling for {industry.name}</h3>
                    <p className="text-xs text-surface-500">Explore the Equipment Library, Mass &amp; Energy simulator, or AI Tutor for this sector.</p>
                  </div>
                ) : industry.processes.map((proc, index) => (
                  <div 
                    key={proc.id} 
                    id={proc.id} 
                    className="p-8 border border-surface-200 dark:border-surface-800 rounded-3xl bg-surface-50/50 dark:bg-surface-950 shadow-sm"
                  >
                    <div className="flex flex-wrap justify-between items-start mb-4 gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 bg-primary-50 dark:bg-primary-950 px-2.5 py-1 rounded-md border border-primary-200 dark:border-primary-800">
                          Unit Operation #{index + 1}: {proc.id}
                        </span>
                        <h3 className="text-2xl font-black text-surface-900 dark:text-white mt-2">{proc.name}</h3>
                      </div>
                      <button 
                        onClick={() => toggleSaveProcess(proc.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                          savedProcesses.includes(proc.id)
                            ? 'bg-yellow-50 dark:bg-yellow-950/40 border-yellow-300 text-yellow-700'
                            : 'bg-white dark:bg-surface-900 border-surface-200 text-surface-500 hover:text-surface-900'
                        }`}
                      >
                        <Star className="w-3.5 h-3.5" /> {savedProcesses.includes(proc.id) ? 'Saved' : 'Bookmark'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-xs">
                      <div className="p-4 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800">
                        <strong className="text-surface-900 dark:text-white block mb-1 text-sm">1. Purpose:</strong>
                        <p className="text-surface-600 dark:text-surface-400">{proc.purpose}</p>
                      </div>
                      <div className="p-4 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800">
                        <strong className="text-surface-900 dark:text-white block mb-1 text-sm">2. Working Principle:</strong>
                        <p className="text-surface-600 dark:text-surface-400">{proc.workingPrinciple}</p>
                      </div>
                    </div>

                    {/* Inputs & Outputs (Rule 6 Points 3 & 4) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-xs">
                      <div className="p-4 bg-surface-100/50 dark:bg-surface-900/50 rounded-2xl border border-surface-200 dark:border-surface-800">
                        <span className="font-bold uppercase tracking-wider text-surface-500 block mb-2">3. Inputs:</span>
                        <div><strong>Materials:</strong> {proc.inputs.materials.join(', ')}</div>
                        <div><strong>Utilities:</strong> {proc.inputs.utilities.join(', ') || 'None'}</div>
                        <div><strong>Energy:</strong> {proc.inputs.energy.join(', ') || 'Process Heat'}</div>
                      </div>
                      <div className="p-4 bg-surface-100/50 dark:bg-surface-900/50 rounded-2xl border border-surface-200 dark:border-surface-800">
                        <span className="font-bold uppercase tracking-wider text-surface-500 block mb-2">4. Outputs:</span>
                        <div><strong>Products:</strong> {proc.outputs.products.join(', ')}</div>
                        <div><strong>Byproducts:</strong> {proc.outputs.byproducts.join(', ') || 'None'}</div>
                        <div><strong>Waste / Emissions:</strong> {proc.outputs.waste.join(', ') || 'None'}</div>
                      </div>
                    </div>

                    {/* Typical Conditions & Chemical Reactions (Rule 6 Points 6 & 7) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-xs">
                      <div className="p-4 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800">
                        <span className="font-bold uppercase tracking-wider text-orange-500 block mb-2">6. Typical Conditions:</span>
                        <div className="space-y-1.5">
                          {Object.entries(proc.typicalConditions).map(([k, v]) => (
                            <div key={k} className="flex justify-between border-b border-surface-100 dark:border-surface-800 pb-1">
                              <span className="text-surface-500">{k}:</span>
                              <span className="font-mono font-bold text-surface-900 dark:text-white">{v as string}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800">
                        <span className="font-bold uppercase tracking-wider text-rose-500 block mb-2">7. Chemical Reactions:</span>
                        <div className="space-y-1.5">
                          {proc.chemicalReactions && proc.chemicalReactions.length > 0 ? (
                            proc.chemicalReactions.map((r, idx) => (
                              <div key={idx} className="font-mono text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 p-2 rounded border border-rose-100">
                                {r}
                              </div>
                            ))
                          ) : (
                            <span className="text-surface-400">Physical unit operation without chemical stoichiometry.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Mass & Energy Balance (Points 8 & 9) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-indigo-50/40 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                      <div>
                        <strong className="text-indigo-950 dark:text-indigo-200 block mb-1">8. Mass Balance:</strong>
                        <p className="text-indigo-900 dark:text-indigo-300">{proc.massBalanceDesc}</p>
                      </div>
                      <div>
                        <strong className="text-indigo-950 dark:text-indigo-200 block mb-1">9. Energy Balance:</strong>
                        <p className="text-indigo-900 dark:text-indigo-300">{proc.energyBalanceDesc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          } />

          {/* TAB 4: EQUIPMENT LIBRARY (Rules 7-11, 30) */}
          <Route path="equipment" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <Box className="w-6 h-6 text-primary-500" /> Equipment Library (Connected to Lab & Calculators)
                </h2>
                <p className="text-surface-500 text-sm">Centralized machinery profiles with operating ranges, failure modes, and direct links to Lab Assistant and Calculators.</p>
              </div>

              {industryEquipmentList.length === 0 ? (
                <div className="p-10 text-center bg-surface-50 dark:bg-surface-950 rounded-3xl border border-surface-200 dark:border-surface-800">
                  <Box className="w-10 h-10 text-surface-300 mx-auto mb-3" />
                  <h3 className="font-bold text-base text-surface-800 dark:text-white mb-1">No sector-specific equipment mapped yet for {industry.name}</h3>
                  <p className="text-xs text-surface-500 mb-4">Browse all industrial vessels, pumps, reactors, and heat exchangers in the Global Equipment Library.</p>
                  <button
                    onClick={() => navigate('/advanced/industry/equipment')}
                    className="px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition-colors"
                  >
                    Open Global Equipment Library &rarr;
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {industryEquipmentList.map(eq => (
                    <div 
                      key={eq.id}
                      onClick={() => setSelectedEquipment(eq)}
                      className="bg-surface-50 dark:bg-surface-950 p-6 rounded-3xl border border-surface-200 dark:border-surface-800 hover:border-primary-500 cursor-pointer transition-all shadow-sm flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-mono font-bold text-primary-600 bg-primary-50 dark:bg-primary-950 px-2 py-0.5 rounded border border-primary-200 dark:border-primary-800">{eq.id}</span>
                          <span className="text-[10px] uppercase font-bold text-surface-400">{eq.category}</span>
                        </div>
                        <h3 className="font-bold text-lg text-surface-900 dark:text-white group-hover:text-primary-600 mb-2">{eq.name}</h3>
                        <p className="text-xs text-surface-500 line-clamp-3 mb-4">{eq.purpose}</p>

                        <div className="space-y-1.5 text-[11px] mb-4">
                          <div className="flex items-center gap-1.5 text-surface-600 dark:text-surface-300">
                            <ExternalLink className="w-3.5 h-3.5 text-primary-500" />
                            <span><strong>Lab:</strong> {eq.relatedLabs[0]?.name || 'Lab experiment linked'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-surface-600 dark:text-surface-300">
                            <Calculator className="w-3.5 h-3.5 text-indigo-500" />
                            <span><strong>Calculator:</strong> {eq.relatedCalculators[0]?.name || 'Sizing calculation linked'}</span>
                          </div>
                        </div>
                      </div>

                      <button className="w-full py-2 bg-white dark:bg-surface-900 group-hover:bg-primary-50 text-primary-600 font-bold rounded-xl text-xs border border-surface-200 dark:border-surface-800 transition-colors">
                        Inspect Equipment Profile &rarr;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          } />

          {/* TAB 5: OPERATING PARAMETERS MATRIX */}
          <Route path="parameters" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <ThermometerSun className="w-6 h-6 text-orange-500" /> What Should an Engineer Monitor?
                </h2>
                <p className="text-surface-500 text-sm">Critical process variables, why they matter, and consequences if too high or too low to teach engineering judgment.</p>
              </div>

              {(() => {
                const parameterRows = industry.processes.flatMap(p =>
                  Object.entries(p.typicalConditions).map(([param, val]) => ({
                    key: p.id + param,
                    procName: p.name,
                    param,
                    val: val as string,
                  }))
                );
                if (parameterRows.length === 0) {
                  return (
                    <div className="p-10 text-center bg-surface-50 dark:bg-surface-950 rounded-3xl border border-surface-200 dark:border-surface-800">
                      <ThermometerSun className="w-10 h-10 text-surface-300 mx-auto mb-3" />
                      <h3 className="font-bold text-base text-surface-800 dark:text-white mb-1">No sector-specific operating parameters listed yet for {industry.name}</h3>
                      <p className="text-xs text-surface-500 mb-4">Compare critical temperatures, pressures, and operating windows across all sectors in the Global Parameters Matrix.</p>
                      <button
                        onClick={() => navigate('/advanced/industry/parameters')}
                        className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition-colors"
                      >
                        Open Global Operating Parameters &rarr;
                      </button>
                    </div>
                  );
                }
                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b-2 border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950 text-surface-500 text-xs uppercase tracking-wider">
                          <th className="p-4 font-bold">Parameter</th>
                          <th className="p-4 font-bold">Process</th>
                          <th className="p-4 font-bold">Typical Range</th>
                          <th className="p-4 font-bold">Why It Matters</th>
                          <th className="p-4 font-bold text-red-500">If Too High</th>
                          <th className="p-4 font-bold text-blue-500">If Too Low</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
                        {parameterRows.map(row => (
                          <tr key={row.key} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/50 transition-colors">
                            <td className="p-4 font-bold text-surface-900 dark:text-white">{row.param}</td>
                            <td className="p-4 text-xs text-primary-600 font-semibold">{row.procName}</td>
                            <td className="p-4 font-mono font-bold text-surface-800 dark:text-surface-200 whitespace-nowrap">{row.val}</td>
                            <td className="p-4 text-xs text-surface-600 dark:text-surface-400">
                              Ensures proper reaction kinetics, prevents thermal shock, and stabilizes continuous yield.
                            </td>
                            <td className="p-4 text-xs text-red-600 dark:text-red-400 bg-red-50/20">
                              Refractory wear, excessive thermal losses, degradation of products, risk of equipment trip.
                            </td>
                            <td className="p-4 text-xs text-blue-600 dark:text-blue-400 bg-blue-50/20">
                              Incomplete conversion, sluggish reaction rates, unreacted raw feed slips through.
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          } />

          {/* TAB 6: PROCESS CONTROL */}
          <Route path="control" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <Sliders className="w-6 h-6 text-blue-500" /> Process Control Loops
                </h2>
                <p className="text-surface-500 text-sm">Industrial feedback, cascade, and ratio control schemes connecting directly to ChemBase Process Control tools.</p>
              </div>

              {(() => {
                const controlLoops = industry.processes.flatMap(p => p.control.map(c => ({ ...c, procName: p.name })));
                if (controlLoops.length === 0) {
                  return (
                    <div className="p-10 text-center bg-surface-50 dark:bg-surface-950 rounded-3xl border border-surface-200 dark:border-surface-800">
                      <Sliders className="w-10 h-10 text-surface-300 mx-auto mb-3" />
                      <h3 className="font-bold text-base text-surface-800 dark:text-white mb-1">No sector-specific control loops documented yet for {industry.name}</h3>
                      <p className="text-xs text-surface-500 mb-4">Explore industrial PID, cascade, and ratio control schemes across plants in Global Process Control.</p>
                      <button
                        onClick={() => navigate('/advanced/industry/control')}
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
                      >
                        Open Global Process Control &rarr;
                      </button>
                    </div>
                  );
                }
                return (
                  <div className="space-y-6">
                    {controlLoops.map((ctrl, i) => (
                      <div key={i} className="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">{ctrl.procName}</span>
                            <h3 className="text-xl font-bold text-surface-900 dark:text-white mt-1">Control Loop: {ctrl.controlledVariable}</h3>
                          </div>
                          <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-3 py-1 rounded-full uppercase tracking-widest font-black">
                            {ctrl.controller} Loop
                          </span>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-surface-900 p-6 rounded-2xl border border-surface-200 dark:border-surface-800">
                          <div className="flex-1 w-full text-center p-4 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl">
                            <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1">Process Sensor (PV)</span>
                            <span className="font-bold text-surface-800 dark:text-surface-200 text-sm">{ctrl.sensor}</span>
                            <span className="text-[11px] text-surface-500 block mt-1">Measures: {ctrl.controlledVariable}</span>
                          </div>
                          <ArrowRight className="text-surface-400 rotate-90 md:rotate-0 my-1 md:my-0"/>
                          <div className="flex-1 w-full text-center p-4 bg-blue-50/60 dark:bg-blue-950/40 border-2 border-blue-400 dark:border-blue-700 rounded-xl">
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-1">Controller Algorithm</span>
                            <span className="font-black text-blue-800 dark:text-blue-300 text-base">{ctrl.controller}</span>
                            <span className="text-[11px] text-blue-600 block mt-1">Calculates Error (SP - PV)</span>
                          </div>
                          <ArrowRight className="text-surface-400 rotate-90 md:rotate-0 my-1 md:my-0"/>
                          <div className="flex-1 w-full text-center p-4 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl">
                            <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1">Final Control Element (MV)</span>
                            <span className="font-bold text-surface-800 dark:text-surface-200 text-sm">{ctrl.valve}</span>
                            <span className="text-[11px] text-surface-500 block mt-1">Modulates: {ctrl.manipulatedVariable}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          } />

          {/* TAB 7: MASS & ENERGY ANALYSIS */}
          <Route path="mass-energy" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <Calculator className="w-6 h-6 text-indigo-500" /> Analyze the Process
                </h2>
                <p className="text-surface-500 text-sm">Enter process operating data to calculate mass balances, conversion yields, and heat duties.</p>
              </div>

              {/* Plant Scale Energy Model */}
              <div className="bg-indigo-50/40 dark:bg-indigo-950/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-3xl p-8">
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-indigo-950 dark:text-indigo-100">Plant-Wide Stoichiometry & Production Model</h3>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300">Scale plant capacity to recalculate total feedstock requirement, thermal fuel duty, and emissions.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-surface-600">Capacity (t/day):</label>
                    <input 
                      type="number" 
                      min="0"
                      value={productionRateStr} 
                      onChange={(e) => setProductionRateStr(e.target.value)}
                      className="w-28 p-2 rounded-xl border border-indigo-300 dark:border-indigo-700 font-mono font-bold text-sm bg-white dark:bg-surface-900 text-surface-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {massEnergyMetrics.map(m => (
                    <div key={m.label} className="bg-white dark:bg-surface-900 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900 shadow-sm">
                      <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1">{m.label}</span>
                      <span className={`text-2xl font-black font-mono ${m.color}`}>{m.value}</span>
                      <span className="text-xs text-surface-400 block">{m.unit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Material & Energy Balance Calculations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Material Balance Section */}
                <div className="p-6 bg-surface-50 dark:bg-surface-950 rounded-3xl border border-surface-200 dark:border-surface-800">
                  <h3 className="font-bold text-base text-surface-900 dark:text-white mb-2">Material Balance Simulator</h3>
                  <p className="text-xs text-surface-500 mb-4">Input stream flow and chemical conversion percentage.</p>
                  
                  <div className="space-y-3 mb-4 text-xs">
                    <div>
                      <label className="font-semibold text-surface-700 dark:text-surface-300 block mb-1">Feed Flow Rate (kg/hr):</label>
                      <input 
                        type="number" 
                        min="0"
                        value={matFeedRateStr}
                        onChange={(e) => setMatFeedRateStr(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-surface-300 dark:border-surface-700 font-mono font-bold bg-white dark:bg-surface-900"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-surface-700 dark:text-surface-300 block mb-1">Conversion / Yield (0–100%):</label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        value={matConversionStr}
                        onChange={(e) => setMatConversionStr(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-surface-300 dark:border-surface-700 font-mono font-bold bg-white dark:bg-surface-900"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-surface-500">Product Stream Flow:</span>
                      <span className="font-mono font-bold text-emerald-600">{materialBalanceOutput.productFlow} kg/hr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-500">Unreacted / Recycle Stream:</span>
                      <span className="font-mono font-bold text-amber-600">{materialBalanceOutput.unreactedFlow} kg/hr</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 font-bold">
                      <span>Total Mass Balance:</span>
                      <span className="text-primary-600">Inputs (100%) = Outputs (100%)</span>
                    </div>
                  </div>
                </div>

                {/* Energy Balance Section */}
                <div className="p-6 bg-surface-50 dark:bg-surface-950 rounded-3xl border border-surface-200 dark:border-surface-800">
                  <h3 className="font-bold text-base text-surface-900 dark:text-white mb-2">Energy Balance Simulator</h3>
                  <p className="text-xs text-surface-500 mb-4">Q_useful = ṁ·Cp·|T_target − T_feed|, Q_input = Q_useful / η, Q_loss = Q_input − Q_useful.</p>
                  
                  <div className="space-y-3 mb-4 text-xs">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="font-semibold text-surface-700 dark:text-surface-300 block mb-1">Mass Flow (kg/hr):</label>
                        <input 
                          type="number" 
                          min="0"
                          value={energyMassFlowStr}
                          onChange={(e) => setEnergyMassFlowStr(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-surface-300 dark:border-surface-700 font-mono font-bold bg-white dark:bg-surface-900"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-surface-700 dark:text-surface-300 block mb-1">Cp (kJ/kg·K):</label>
                        <input 
                          type="number" 
                          step="0.1"
                          min="0"
                          value={energyCpStr}
                          onChange={(e) => setEnergyCpStr(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-surface-300 dark:border-surface-700 font-mono font-bold bg-white dark:bg-surface-900"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-surface-700 dark:text-surface-300 block mb-1">Efficiency η (%):</label>
                        <input 
                          type="number" 
                          min="1"
                          max="100"
                          value={energyEfficiencyStr}
                          onChange={(e) => setEnergyEfficiencyStr(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-surface-300 dark:border-surface-700 font-mono font-bold bg-white dark:bg-surface-900"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-semibold text-surface-700 dark:text-surface-300 block mb-1">Feed Temp (°C):</label>
                        <input 
                          type="number" 
                          value={energyFeedTempStr}
                          onChange={(e) => setEnergyFeedTempStr(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-surface-300 dark:border-surface-700 font-mono font-bold bg-white dark:bg-surface-900"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-surface-700 dark:text-surface-300 block mb-1">Target Temp (°C):</label>
                        <input 
                          type="number" 
                          value={energyTargetTempStr}
                          onChange={(e) => setEnergyTargetTempStr(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-surface-300 dark:border-surface-700 font-mono font-bold bg-white dark:bg-surface-900"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-surface-500">Mode (|ΔT| = {energyBalanceOutput.deltaT} °C):</span>
                      <span className="font-bold text-primary-600">{energyBalanceOutput.mode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-500">Useful {energyBalanceOutput.mode} Duty (Q_useful):</span>
                      <span className="font-mono font-bold text-indigo-600">{energyBalanceOutput.qUsefulKW} kW</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-500">Total Utility Input (Q_input = Q_useful / η):</span>
                      <span className="font-mono font-bold text-surface-800 dark:text-surface-100">{energyBalanceOutput.qInputKW} kW</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-500">Thermal Losses (Q_loss = Q_input − Q_useful):</span>
                      <span className="font-mono font-bold text-rose-600">{energyBalanceOutput.qLossKW} kW</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 font-bold">
                      <span>Thermal Efficiency (η):</span>
                      <span className="text-emerald-600">{energyBalanceOutput.efficiency}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          } />

          {/* TAB 8: SAFETY & HAZARDS */}
          <Route path="safety" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <ShieldAlert className="w-6 h-6 text-red-500" /> Plant Safety & Process Hazards
                </h2>
                <p className="text-surface-500 text-sm">Process-specific hazards: thermal, chemical, pressure, mechanical, dust, and toxic exposure.</p>
              </div>

              {(() => {
                const hazardItems = industry.processes.flatMap(p => p.hazards.map(h => ({ ...h, procName: p.name })));
                if (hazardItems.length === 0) {
                  return (
                    <div className="p-10 text-center bg-surface-50 dark:bg-surface-950 rounded-3xl border border-surface-200 dark:border-surface-800">
                      <ShieldAlert className="w-10 h-10 text-surface-300 mx-auto mb-3" />
                      <h3 className="font-bold text-base text-surface-800 dark:text-white mb-1">No sector-specific hazard sheets compiled yet for {industry.name}</h3>
                      <p className="text-xs text-surface-500 mb-4">Review thermal, chemical, pressure, and toxic hazard safeguards across plants in the Global Safety Hub.</p>
                      <button
                        onClick={() => navigate('/advanced/industry/safety')}
                        className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
                      >
                        Open Global Safety Hub &rarr;
                      </button>
                    </div>
                  );
                }
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {hazardItems.map((haz, idx) => (
                      <div key={idx} className="p-6 bg-white dark:bg-surface-900 border-l-4 border-red-500 border-y border-r border-surface-200 dark:border-surface-800 rounded-r-3xl shadow-sm">
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{haz.type} HAZARD</span>
                        <h3 className="font-bold text-lg text-surface-900 dark:text-white mt-1 mb-2">{haz.procName}</h3>
                        <p className="text-xs text-surface-700 dark:text-surface-300 mb-4 leading-relaxed">{haz.description}</p>
                        
                        <div className="bg-surface-50 dark:bg-surface-950 p-4 rounded-xl border border-surface-200 dark:border-surface-800 space-y-2 text-xs">
                          <div><strong className="text-surface-900 dark:text-white">Safety Precautions:</strong> {haz.precautions}</div>
                          <div>
                            <strong className="text-surface-900 dark:text-white">Required PPE:</strong>{' '}
                            {haz.ppe && haz.ppe.length > 0 ? (
                              haz.ppe.map(p => (
                                <span key={p} className="inline-block bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 font-bold px-2 py-0.5 rounded text-[10px] mr-1">
                                  {p}
                                </span>
                              ))
                            ) : 'Hard hat, safety glasses, steel-toe shoes'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          } />

          {/* TAB 9: ENVIRONMENT */}
          <Route path="environment" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <Leaf className="w-6 h-6 text-green-500" /> Environmental Sustainability
                </h2>
                <p className="text-surface-500 text-sm">Industrial stack emissions, effluent treatment, and control technologies (Baghouse, ESP, SNCR, Scrubber).</p>
              </div>

              {(() => {
                const envProcesses = industry.processes.filter(p => p.environmentalImpact);
                if (envProcesses.length === 0) {
                  return (
                    <div className="p-10 text-center bg-surface-50 dark:bg-surface-950 rounded-3xl border border-surface-200 dark:border-surface-800">
                      <Leaf className="w-10 h-10 text-surface-300 mx-auto mb-3" />
                      <h3 className="font-bold text-base text-surface-800 dark:text-white mb-1">No sector-specific emissions profiles listed yet for {industry.name}</h3>
                      <p className="text-xs text-surface-500 mb-4">Explore abatement technologies (ESP, baghouses, scrubbers, SNCR) in the Global Environment Hub.</p>
                      <button
                        onClick={() => navigate('/advanced/industry/environment')}
                        className="px-4 py-2 rounded-xl bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition-colors"
                      >
                        Open Global Environment Hub &rarr;
                      </button>
                    </div>
                  );
                }
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {envProcesses.map((p, i) => (
                      <div key={i} className="p-6 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-sm">
                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">{p.name}</span>
                        <h3 className="text-lg font-bold text-surface-900 dark:text-white mt-1 mb-4">Emissions & Abatement Control</h3>
                        
                        <div className="space-y-3 text-xs">
                          <div className="p-3 bg-surface-50 dark:bg-surface-950 rounded-xl border border-surface-200 dark:border-surface-800">
                            <span className="font-bold text-surface-800 dark:text-surface-200 block mb-1">Air Emissions:</span>
                            <span className="text-surface-600">{p.environmentalImpact.emissions.join(', ') || 'Low fugitive dust'}</span>
                          </div>
                          <div className="p-3 bg-green-50/50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-900">
                            <span className="font-bold text-green-900 dark:text-green-300 block mb-1">Control Technologies:</span>
                            <span className="text-green-800 dark:text-green-400 font-semibold">{p.environmentalImpact.controlTech.join(', ') || 'High efficiency bag filters'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          } />

          {/* TAB 10: TROUBLESHOOTING */}
          <Route path="troubleshooting" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-surface-700 dark:text-surface-300" /> Industrial Troubleshooter
                </h2>
                <p className="text-surface-500 text-sm">Select Industry → Process → Equipment → Problem to inspect root causes and investigation steps.</p>
              </div>

              {/* Troubleshooting Interactive Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-surface-50 dark:bg-surface-950 rounded-3xl border border-surface-200 dark:border-surface-800">
                <div>
                  <label className="text-xs font-bold text-surface-500 uppercase tracking-wider block mb-1.5">Select Process:</label>
                  <select 
                    value={selectedProcId} 
                    onChange={(e) => {
                      setSelectedProcId(e.target.value);
                      setSelectedProbId('');
                    }}
                    className="w-full p-3 rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm font-semibold"
                  >
                    <option value="">-- All Processes --</option>
                    {industry.processes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-surface-500 uppercase tracking-wider block mb-1.5">Select Problem / Symptom:</label>
                  <select 
                    value={selectedProbId} 
                    onChange={(e) => setSelectedProbId(e.target.value)}
                    className="w-full p-3 rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm font-semibold"
                  >
                    <option value="">-- All Symptoms --</option>
                    {industry.processes
                      .filter(p => !selectedProcId || p.id === selectedProcId)
                      .flatMap(p => p.troubleshooting)
                      .map(t => <option key={t.id} value={t.id}>{t.symptom}</option>)
                    }
                  </select>
                </div>
              </div>

              {/* Troubleshooting Diagnostic Cards */}
              {(() => {
                const troubleshootingCases = industry.processes
                  .filter(p => !selectedProcId || p.id === selectedProcId)
                  .flatMap(p => p.troubleshooting.map(t => ({ ...t, procName: p.name })))
                  .filter(t => !selectedProbId || t.id === selectedProbId);
                if (troubleshootingCases.length === 0) {
                  return (
                    <div className="p-10 text-center bg-surface-50 dark:bg-surface-950 rounded-3xl border border-surface-200 dark:border-surface-800">
                      <Settings className="w-10 h-10 text-surface-300 mx-auto mb-3" />
                      <h3 className="font-bold text-base text-surface-800 dark:text-white mb-1">No troubleshooting cases available for {industry.name}</h3>
                      <p className="text-xs text-surface-500 mb-4">Investigate cross-sector plant symptoms, root causes, and corrective actions in the Global Troubleshooter.</p>
                      <button
                        onClick={() => navigate('/advanced/industry/troubleshooting')}
                        className="px-4 py-2 rounded-xl bg-surface-800 dark:bg-primary-600 text-white text-xs font-bold hover:bg-surface-900 dark:hover:bg-primary-700 transition-colors"
                      >
                        Open Global Troubleshooter &rarr;
                      </button>
                    </div>
                  );
                }
                return (
                  <div className="space-y-6">
                    {troubleshootingCases.map(tcase => (
                      <div key={tcase.id} className="border border-surface-200 dark:border-surface-800 rounded-3xl bg-surface-50 dark:bg-surface-950 overflow-hidden shadow-sm">
                        <div className="p-6 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800">
                          <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">{tcase.procName}</span>
                          <h3 className="text-lg font-bold flex items-center gap-2 text-surface-900 dark:text-white mt-1">
                            <AlertTriangle className="w-5 h-5 text-orange-500" /> Symptom: {tcase.symptom}
                          </h3>
                          {tcase.whatToCheckFirst && (
                            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 font-semibold">
                              <strong>What to Check First:</strong> {tcase.whatToCheckFirst}
                            </div>
                          )}
                        </div>
                        
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                          <div>
                            <h4 className="font-bold text-surface-900 dark:text-white mb-2 uppercase tracking-wider text-[11px]">Possible Causes (Ranked by Likelihood):</h4>
                            <ul className="list-disc pl-5 space-y-1.5 text-surface-600 dark:text-surface-400">
                              {tcase.possibleCauses.map((c, i) => <li key={i}>A likely contributor may be: {c}</li>)}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-bold text-emerald-700 dark:text-emerald-400 mb-2 uppercase tracking-wider text-[11px]">Recommended Engineering Solutions:</h4>
                            <ul className="list-disc pl-5 space-y-1.5 text-surface-600 dark:text-surface-400">
                              {tcase.possibleSolutions.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                            {tcase.safetyConsiderations && (
                              <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 rounded-xl border border-red-100">
                                <strong>Safety Considerations:</strong> {tcase.safetyConsiderations}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          } />

          {/* TAB 11: CHALLENGES */}
          <Route path="challenges" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <BrainCircuit className="w-6 h-6 text-purple-500" /> Engineering Challenges & Scenario Simulator
                </h2>
                <p className="text-surface-500 text-sm">Choose what to investigate first under upset plant conditions and receive a reasoning evaluation.</p>
              </div>

              <div className="space-y-6">
                {industry.challenges.length === 0 ? (
                  <div className="p-10 text-center bg-surface-50 dark:bg-surface-950 rounded-3xl border border-surface-200 dark:border-surface-800">
                    <BrainCircuit className="w-10 h-10 text-surface-300 mx-auto mb-3" />
                    <h3 className="font-bold text-base text-surface-800 dark:text-white mb-1">No sector-specific scenarios yet for {industry.name}</h3>
                    <p className="text-xs text-surface-500 mb-4">Practice cross-sector upset scenarios in the Global Engineering Challenges hub.</p>
                    <button onClick={() => navigate('/advanced/industry/challenges')} className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors">
                      Open Global Challenges &rarr;
                    </button>
                  </div>
                ) : industry.challenges.map((c, idx) => (
                  <div key={c.id} className="p-8 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 bg-purple-50 dark:bg-purple-950 px-2.5 py-1 rounded">
                      Plant Scenario #{idx + 1}
                    </span>
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white mt-3 mb-4 leading-relaxed">
                      {c.scenario}
                    </h3>

                    <div className="space-y-3 mb-6">
                      {c.options.map((opt, optIdx) => {
                        const isSelected = selectedOptions[c.id] === optIdx;
                        return (
                          <div 
                            key={optIdx} 
                            onClick={() => setSelectedOptions(prev => ({ ...prev, [c.id]: optIdx }))}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all text-sm ${
                              isSelected 
                                ? opt.score > 50 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold' 
                                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-500 text-rose-900 dark:text-rose-200 font-semibold'
                                : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 hover:border-purple-400 text-surface-800 dark:text-surface-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs shrink-0">
                                {optIdx + 1}
                              </span>
                              <span>{opt.text}</span>
                            </div>

                            {isSelected && (
                              <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10 text-xs">
                                <strong>Evaluation Score: {opt.score}/100</strong> &bull; {opt.feedback}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {selectedOptions[c.id] !== undefined && (
                      <div className="p-4 bg-purple-50/50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200">
                        <strong className="block mb-1 font-bold">Recommended Engineering Approach:</strong>
                        {c.correctApproach}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          } />

          {/* TAB 12: SUBJECTS APPLIED */}
          <Route path="subjects" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <Target className="w-6 h-6 text-primary-500" /> Chemical Engineering Subjects Used Here
                </h2>
                <p className="text-surface-500 text-sm">For every subject, discover how university theory translates into commercial plant practice.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {industry.relatedSubjects.map(s => {
                  const targetPath = s.subjectId === 'particulate-technology' ? 'particulate' : s.subjectId;
                  const subjectLabel = s.subjectId.replace(/-/g, ' ');
                  return (
                    <div key={s.subjectId} className="p-6 bg-surface-50 dark:bg-surface-950 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-primary-600 block mb-1">Subject Module</span>
                        <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-3 capitalize">{subjectLabel}</h3>
                        <p className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed mb-6 bg-white dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-800">
                          {s.application}
                        </p>
                      </div>

                      <button 
                        onClick={() => navigate(`/advanced/${targetPath}`)}
                        className="w-full py-2.5 bg-primary-50 hover:bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300 font-bold rounded-xl text-xs transition-colors text-center border border-primary-200 dark:border-primary-800 capitalize"
                      >
                        Open {subjectLabel} Subject &rarr;
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          } />

          {/* TAB 13: INTERNSHIP MODE & ASSESSMENT */}
          <Route path="internship" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-amber-500" /> 7-Day Virtual Internship & Assessment
                </h2>
                <p className="text-surface-500 text-sm">Step through the structured graduate training path and take the final Internship Assessment.</p>
              </div>

              {/* Progress Tracker */}
              <div className="p-6 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-3xl">
                <div className="flex justify-between items-center mb-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                  <span>Internship Curriculum Progress</span>
                  <span>{completedDays.length} / 7 Days Completed</span>
                </div>
                <div className="w-full bg-surface-200 dark:bg-surface-800 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-amber-500 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${(completedDays.length / 7) * 100}%` }}
                  />
                </div>
              </div>

              {/* Day-by-Day Path */}
              <div className="space-y-4">
                {[
                  { day: 1, title: 'Day 1: Understand Plant Layout & Feedstock Geology', task: 'Study raw material mining, storage dome layouts, and sampling protocols.' },
                  { day: 2, title: 'Day 2: Study Process Flow Topology', task: 'Trace complete material and utility streams through the interactive process flow diagram.' },
                  { day: 3, title: 'Day 3: Study Major Plant Equipment', task: 'Inspect sizing parameters and failure modes in the central equipment database.' },
                  { day: 4, title: 'Day 4: Study Instrumentation & Process Control Loops', task: 'Review sensor placement, PID feedback loops, and automated safety interlocks.' },
                  { day: 5, title: 'Day 5: Analyze Operating Parameters & Balances', task: 'Execute plant material balance reconciliation and energy duty estimations.' },
                  { day: 6, title: 'Day 6: Solve Industrial Troubleshooting Scenarios', task: 'Diagnose equipment upset conditions using root cause analysis trees.' },
                  { day: 7, title: 'Day 7: Final Plant Optimization Capstone', task: 'Deliver energy audit report and take the final Internship Assessment exam.' },
                ].map(item => {
                  const isDone = completedDays.includes(item.day);
                  return (
                    <div 
                      key={item.day} 
                      className={`p-6 rounded-2xl border transition-all flex flex-wrap justify-between items-center gap-4 ${
                        isDone 
                          ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' 
                          : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 block mb-1">
                          Curriculum Stage {item.day}
                        </span>
                        <h4 className="font-bold text-base text-surface-900 dark:text-white mb-1">{item.title}</h4>
                        <p className="text-xs text-surface-500">{item.task}</p>
                      </div>

                      <button 
                        onClick={() => toggleInternshipDay(item.day)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                          isDone 
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                            : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-amber-500 hover:text-white'
                        }`}
                      >
                        {isDone ? <Check className="w-3.5 h-3.5"/> : null}
                        {isDone ? 'Completed' : 'Mark Day Complete'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* End-of-Internship Assessment Exam */}
              <div className="p-8 bg-surface-50 dark:bg-surface-950 rounded-3xl border border-surface-200 dark:border-surface-800">
                <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary-500" /> Internship Assessment
                </h3>
                <p className="text-xs text-surface-500 mb-6">Tests Process Understanding, Equipment Knowledge, Safety Awareness, and Troubleshooting. Score ≥ 70% to pass.</p>

                <div className="space-y-6">
                  {internshipQuestions.map((item, idx) => {
                    const chosen = assessmentAnswers[idx];
                    const isRight = chosen === item.correct;
                    return (
                      <div key={idx} className="space-y-2 text-xs">
                        <p className="font-bold text-surface-900 dark:text-white">{item.q}</p>
                        <div className="space-y-1.5">
                          {item.opts.map((opt, optIdx) => {
                            let cls = 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800';
                            if (showAssessmentResult) {
                              if (optIdx === item.correct) cls = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-semibold';
                              else if (chosen === optIdx) cls = 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-200 font-semibold';
                            } else if (chosen === optIdx) {
                              cls = 'bg-primary-50 dark:bg-primary-950 border-primary-500 text-primary-700 font-semibold';
                            }
                            return (
                              <div 
                                key={optIdx} 
                                onClick={() => {
                                  if (!showAssessmentResult) setAssessmentAnswers(prev => ({ ...prev, [idx]: optIdx }));
                                }}
                                className={`p-3 rounded-xl border transition-colors ${showAssessmentResult ? '' : 'cursor-pointer'} ${cls}`}
                              >
                                {opt}
                              </div>
                            );
                          })}
                        </div>
                        {showAssessmentResult && (
                          <p className={`text-[11px] font-semibold mt-1 ${isRight ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {isRight ? '✓ Correct: ' : '✗ Incorrect: '}{item.explanation}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  <div className="flex flex-wrap items-center gap-3">
                    <button 
                      onClick={() => setShowAssessmentResult(true)}
                      disabled={Object.keys(assessmentAnswers).length < internshipQuestions.length}
                      className="px-6 py-2.5 bg-primary-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs hover:bg-primary-700 transition-colors"
                    >
                      Submit Assessment ({Object.keys(assessmentAnswers).length}/{internshipQuestions.length} answered)
                    </button>
                    {showAssessmentResult && (
                      <button
                        onClick={() => { setAssessmentAnswers({}); setShowAssessmentResult(false); }}
                        className="px-4 py-2.5 bg-surface-200 dark:bg-surface-800 text-surface-700 dark:text-surface-200 font-bold rounded-xl text-xs hover:bg-surface-300 dark:hover:bg-surface-700 transition-colors"
                      >
                        Retake Assessment
                      </button>
                    )}
                  </div>

                  {showAssessmentResult && (
                    <div className={`p-4 rounded-2xl border text-xs ${
                      assessmentPassed
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                    }`}>
                      <strong>Score: {assessmentScore} / {internshipQuestions.length} ({assessmentPct}%) — {assessmentPassed ? 'PASSED' : 'NEEDS REVIEW'}:</strong>{' '}
                      {assessmentPassed
                        ? 'Verified proficiency across Process Understanding, Safety Awareness, and Troubleshooting (≥70% threshold met).'
                        : 'You need at least 70% to pass. Review the explanations above and retake the assessment.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          } />

          {/* TAB 14: AI TUTOR */}
          <Route path="tutor" element={
            <div className="h-[650px] flex flex-col animate-in fade-in duration-300">
              <div className="mb-4">
                <h2 className="text-2xl font-black text-surface-900 dark:text-white flex items-center gap-2">
                  <Bot className="w-6 h-6 text-primary-500" /> Contextual AI Industry Tutor
                </h2>
                <p className="text-surface-500 text-sm">Specialized AI assistant knowing {industry.name} PFDs, parameters, and safety data.</p>
              </div>

              {/* Chat Window */}
              <div className="flex-1 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 flex flex-col justify-between overflow-hidden shadow-inner">
                <div className="overflow-y-auto space-y-4 pr-2 flex-1 mb-4">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-2xl p-4 rounded-2xl text-sm leading-relaxed ${
                        msg.sender === 'user' 
                          ? 'bg-primary-600 text-white rounded-br-none shadow-sm' 
                          : 'bg-white dark:bg-surface-900 text-surface-800 dark:text-surface-200 rounded-bl-none border border-surface-200 dark:border-surface-800 shadow-sm'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Suggested prompt chips (industry-aware) */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {tutorChips.map(chip => (
                    <button 
                      key={chip} 
                      onClick={() => handleSendTutor(chip)}
                      className="text-xs bg-white dark:bg-surface-900 hover:bg-primary-50 text-surface-600 dark:text-surface-300 px-3 py-1.5 rounded-full border border-surface-200 dark:border-surface-800 transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Input row */}
                <div className="relative">
                  <input 
                    type="text" 
                    value={tutorQuery}
                    onChange={(e) => setTutorQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendTutor()}
                    placeholder={`Ask an engineering question about ${industry.name}...`} 
                    className="w-full p-4 pr-14 rounded-2xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none text-sm"
                  />
                  <button 
                    onClick={() => handleSendTutor()}
                    className="absolute right-2.5 top-2.5 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-sm transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          } />

          {/* TAB 15: INTERVIEW PREP */}
          <Route path="interview" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <Briefcase className="w-6 h-6 text-teal-500" /> Industrial Interview Prep
                </h2>
                <p className="text-surface-500 text-sm">Categorized questions: Technical, Equipment, Process, Troubleshooting, Safety, Control, HR.</p>
              </div>

              {/* Categories Filter */}
              <div className="flex flex-wrap gap-2">
                {(['All', 'Technical', 'Equipment', 'Process', 'Troubleshooting', 'Safety', 'Control', 'HR'] as const).map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setInterviewCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      interviewCategory === cat 
                        ? 'bg-teal-600 text-white shadow-sm' 
                        : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {interviewQuestions.map(item => {
                  const isRevealed = revealedAnswers[item.id];
                  return (
                    <div key={item.id} className="p-6 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-3xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-surface-900 dark:text-white mb-4">
                        {item.q}
                      </h3>

                      <button 
                        onClick={() => setRevealedAnswers(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                        className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 rounded-xl font-bold text-xs border border-teal-200 dark:border-teal-800 transition-colors"
                      >
                        {isRevealed ? 'Hide Model Answer' : 'Reveal Model Answer →'}
                      </button>

                      {isRevealed && (
                        <div className="mt-3 p-4 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl text-xs text-surface-700 dark:text-surface-300 leading-relaxed">
                          <strong className="text-teal-700 dark:text-teal-400 block mb-1">Model Professional Answer:</strong>
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          } />

          {/* TAB 16: CAREERS */}
          <Route path="careers" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <Users className="w-6 h-6 text-pink-500" /> Chemical Engineering Careers in {industry.name}
                </h2>
                <p className="text-surface-500 text-sm">Industrial job titles, daily shift responsibilities, software tools, and required subjects.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {industry.roles.map((role, idx) => (
                  <div key={idx} className="p-6 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-sm">
                    <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">{role.title}</h3>
                    <div className="space-y-4 text-xs mt-4">
                      <div className="bg-white dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-800">
                        <span className="font-bold text-primary-600 block mb-2 uppercase tracking-wider text-[10px]">Key Responsibilities:</span>
                        <ul className="list-disc pl-4 space-y-1 text-surface-600 dark:text-surface-400">
                          {role.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                      <div className="bg-white dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-800">
                        <span className="font-bold text-primary-600 block mb-2 uppercase tracking-wider text-[10px]">Essential Core Skills:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {role.skills.map((s, i) => (
                            <span key={i} className="bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded text-surface-700 dark:text-surface-300 font-medium">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      {role.typicalProblems && (
                        <div className="bg-white dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-800">
                          <span className="font-bold text-primary-600 block mb-2 uppercase tracking-wider text-[10px]">Typical Problems Handled:</span>
                          <ul className="list-disc pl-4 space-y-1 text-surface-600 dark:text-surface-400">
                            {role.typicalProblems.map((tp, i) => <li key={i}>{tp}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          } />

          {/* TAB 17: DOCUMENTS */}
          <Route path="documents" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-amber-500" /> Industrial Document Reading Room
                </h2>
                <p className="text-surface-500 text-sm">Interactive tutorials on reading and decoding PFDs, P&IDs, equipment tags, and datasheets.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-3xl flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-surface-900 dark:text-white mb-2">How to Read a PFD</h3>
                    <p className="text-xs text-surface-500 mb-4">Learn stream numbering, mass/mole balance tables, operating pressure/temperature flags, and major equipment tags.</p>
                  </div>
                  <button 
                    onClick={() => navigate('/advanced/pfd-pid')}
                    className="w-full py-2.5 bg-white dark:bg-surface-900 hover:bg-primary-50 text-primary-600 font-bold text-xs rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm transition-colors"
                  >
                    Launch PFD Editor &rarr;
                  </button>
                </div>

                <div className="p-6 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-3xl flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-surface-900 dark:text-white mb-2">P&ID ISA-5.1 Decoder</h3>
                    <p className="text-xs text-surface-500 mb-4">Interpret instrument bubbles: Discrete (Circle), Shared display (Square), Computer function (Hexagon), and valve fail modes.</p>
                  </div>
                  <button 
                    onClick={() => navigate('/advanced/pfd-pid')}
                    className="w-full py-2.5 bg-white dark:bg-surface-900 hover:bg-primary-50 text-primary-600 font-bold text-xs rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm transition-colors"
                  >
                    View ISA Tag Reference &rarr;
                  </button>
                </div>

                <div className="p-6 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-3xl flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-surface-900 dark:text-white mb-2">Equipment Datasheets</h3>
                    <p className="text-xs text-surface-500 mb-4">Read mechanical design pressures, design temperatures, corrosion allowances, and metallurgy schedules.</p>
                  </div>
                  <button 
                    onClick={() => navigate(`/advanced/industry/${industry.id}/equipment`)}
                    className="w-full py-2.5 bg-white dark:bg-surface-900 hover:bg-primary-50 text-primary-600 font-bold text-xs rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm transition-colors"
                  >
                    Browse Datasheets &rarr;
                  </button>
                </div>
              </div>
            </div>
          } />

          {/* TAB 18: MY INDUSTRY & PROGRESS */}
          <Route path="my-industry" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-500" /> My Industry Study Dashboard
                </h2>
                <p className="text-surface-500 text-sm">Personal engineering notes, saved process bookmarks, and exact curriculum completion metrics.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Progress Card */}
                <div className="p-8 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-3xl space-y-6">
                  <div>
                    <h3 className="font-bold text-lg text-surface-900 dark:text-white mb-4">Learning Progress: {industry.name}</h3>
                    <div className="space-y-4 text-xs">
                      <div>
                        <div className="flex justify-between mb-1 text-surface-600">
                          <span>Processes Bookmarked:</span>
                          <span className="font-bold text-primary-600">
                            {savedProcesses.length} / {industry.processes.length} ({industry.processes.length > 0 ? Math.round((savedProcesses.length / industry.processes.length) * 100) : 0}%)
                          </span>
                        </div>
                        <div className="w-full bg-surface-200 dark:bg-surface-800 rounded-full h-2.5">
                          <div
                            className="bg-primary-600 h-2.5 rounded-full transition-all"
                            style={{ width: `${industry.processes.length > 0 ? Math.round((savedProcesses.length / industry.processes.length) * 100) : 0}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1 text-surface-600">
                          <span>Central Equipment Linked:</span>
                          <span className="font-bold text-indigo-600">{industryEquipmentList.length} Units Available</span>
                        </div>
                        <div className="w-full bg-surface-200 dark:bg-surface-800 rounded-full h-2.5">
                          <div
                            className="bg-indigo-600 h-2.5 rounded-full transition-all"
                            style={{ width: `${industryEquipmentList.length > 0 ? Math.min(100, Math.round((industryEquipmentList.length / Math.max(1, CENTRAL_EQUIPMENT_DATABASE.length)) * 100)) : 0}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1 text-surface-600">
                          <span>Internship Days Completed:</span>
                          <span className="font-bold text-amber-600">{completedDays.length} / 7 Days</span>
                        </div>
                        <div className="w-full bg-surface-200 dark:bg-surface-800 rounded-full h-2.5">
                          <div className="bg-amber-500 h-2.5 rounded-full transition-all" style={{ width: `${(completedDays.length / 7) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bookmarked Processes List */}
                  <div className="pt-4 border-t border-surface-200 dark:border-surface-800">
                    <h4 className="font-bold text-sm text-surface-900 dark:text-white mb-2">Bookmarked Processes ({savedProcesses.length})</h4>
                    {savedProcesses.length === 0 ? (
                      <p className="text-xs text-surface-400 italic">No bookmarked processes yet. Click "Bookmark" on any unit operation in the Processes tab.</p>
                    ) : (
                      <div className="space-y-2">
                        {savedProcesses.map(pid => {
                          const proc = industry.processes.find(p => p.id === pid);
                          if (!proc) return null;
                          return (
                            <div key={pid} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-xs">
                              <button
                                onClick={() => navigate(`/advanced/industry/${industry.id}/processes#${pid}`)}
                                className="font-bold text-surface-800 dark:text-surface-100 hover:text-primary-600 text-left"
                              >
                                {proc.name} &rarr;
                              </button>
                              <button
                                onClick={() => toggleSaveProcess(pid)}
                                className="text-[11px] font-semibold text-rose-500 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Personal Notes */}
                <div className="p-8 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-3xl flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-surface-900 dark:text-white mb-2">My Engineering Notes</h3>
                    <p className="text-xs text-surface-500 mb-3">Persisted scratchpad for observations, formulas, and plant notes.</p>
                    <textarea 
                      value={userNotes}
                      onChange={(e) => handleSaveNotes(e.target.value)}
                      placeholder="Type your notes about reactions, operational issues, or questions for your professor..."
                      className="w-full h-32 p-3 text-xs rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 outline-none focus:border-primary-500"
                    />
                  </div>
                  <div className="text-[11px] text-surface-400 mt-2">Notes are automatically saved locally.</div>
                </div>
              </div>
            </div>
          } />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="overview" replace />} />
        </Routes>
      </div>

      {/* DETAILED EQUIPMENT MODAL / DRAWER */}
      {selectedEquipment && (
        <div
          onClick={() => setSelectedEquipment(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-surface-900 w-full max-w-4xl max-h-[90vh] rounded-3xl border border-surface-200 dark:border-surface-800 shadow-2xl overflow-y-auto p-8 relative"
          >
            <button 
              onClick={() => setSelectedEquipment(null)}
              className="absolute right-6 top-6 p-2 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500 hover:text-surface-900 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-mono font-bold text-primary-600 bg-primary-50 dark:bg-primary-950 px-2.5 py-1 rounded-md border border-primary-200 dark:border-primary-800">{selectedEquipment.id}</span>
              <span className="text-xs font-bold uppercase text-surface-400">{selectedEquipment.category}</span>
            </div>

            <h2 className="text-3xl font-black text-surface-900 dark:text-white mb-4">{selectedEquipment.name}</h2>
            <p className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed mb-6 bg-surface-50 dark:bg-surface-950 p-4 rounded-2xl border border-surface-200 dark:border-surface-800">
              <strong>Purpose:</strong> {selectedEquipment.purpose}
            </p>

            <div className="space-y-6 text-sm">
              <div>
                <h4 className="font-bold text-surface-900 dark:text-white mb-1.5 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary-500" /> Working Principle
                </h4>
                <p className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed">{selectedEquipment.workingPrinciple}</p>
              </div>

              <div>
                <h4 className="font-bold text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-accent-500" /> Main Mechanical Components
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedEquipment.mainComponents.map((comp, idx) => (
                    <span key={idx} className="text-xs bg-surface-100 dark:bg-surface-800 px-3 py-1 rounded-lg text-surface-700 dark:text-surface-300 font-medium">
                      {comp}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <ThermometerSun className="w-4 h-4 text-orange-500" /> Operating Parameters
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedEquipment.operatingParameters.map((p, idx) => (
                    <div key={idx} className="p-3 bg-surface-50 dark:bg-surface-950 rounded-xl border border-surface-200 dark:border-surface-800 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-surface-900 dark:text-white">{p.name}</span>
                        <span className="font-mono font-bold text-primary-600">{p.normalRange} {p.unit}</span>
                      </div>
                      <span className="text-surface-500 text-[11px]">{p.importance}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mandatory ChemBase Ecosystem Links (Rules 9, 10, 11) */}
              <div className="p-6 bg-primary-50/50 dark:bg-primary-950/20 rounded-2xl border border-primary-200 dark:border-primary-800">
                <h4 className="font-bold text-primary-900 dark:text-primary-200 mb-3 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary-600" /> ChemBase Connected Ecosystem (Rules 9, 10, 11)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button 
                    onClick={() => {
                      setSelectedEquipment(null);
                      navigate(selectedEquipment.relatedLabs[0]?.path || '/advanced/lab-assistant');
                    }}
                    className="p-3 bg-white dark:bg-surface-900 rounded-xl border border-primary-200 dark:border-primary-800 text-left hover:border-primary-500 transition-colors shadow-sm"
                  >
                    <span className="text-[10px] uppercase font-bold text-primary-600 block mb-1">Lab Assistant</span>
                    <span className="font-bold text-xs text-surface-900 dark:text-white block">{selectedEquipment.relatedLabs[0]?.name || 'Perform Experiment'}</span>
                  </button>

                  <button 
                    onClick={() => {
                      setSelectedEquipment(null);
                      navigate(selectedEquipment.relatedCalculators[0]?.path || '/advanced/calculators');
                    }}
                    className="p-3 bg-white dark:bg-surface-900 rounded-xl border border-primary-200 dark:border-primary-800 text-left hover:border-primary-500 transition-colors shadow-sm"
                  >
                    <span className="text-[10px] uppercase font-bold text-indigo-600 block mb-1">Calculator</span>
                    <span className="font-bold text-xs text-surface-900 dark:text-white block">{selectedEquipment.relatedCalculators[0]?.name || 'Sizing Engine'}</span>
                  </button>

                  <button 
                    onClick={() => {
                      setSelectedEquipment(null);
                      navigate(selectedEquipment.relatedSubjects[0]?.path || '/advanced');
                    }}
                    className="p-3 bg-white dark:bg-surface-900 rounded-xl border border-primary-200 dark:border-primary-800 text-left hover:border-primary-500 transition-colors shadow-sm"
                  >
                    <span className="text-[10px] uppercase font-bold text-accent-600 block mb-1">Subject Theory</span>
                    <span className="font-bold text-xs text-surface-900 dark:text-white block">{selectedEquipment.relatedSubjects[0]?.name || 'Theory & Equations'}</span>
                  </button>
                </div>
              </div>

              {/* Viva Questions */}
              {selectedEquipment.vivaQuestions.length > 0 && (
                <div>
                  <h4 className="font-bold text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-500" /> Viva Voce Oral Exam Questions
                  </h4>
                  <div className="space-y-2">
                    {selectedEquipment.vivaQuestions.map((v, idx) => (
                      <div key={idx} className="p-3 bg-surface-50 dark:bg-surface-950 rounded-xl border border-surface-200 dark:border-surface-800 text-xs">
                        <strong className="text-surface-900 dark:text-white block mb-1">Q: {v.q}</strong>
                        <span className="text-surface-600 dark:text-surface-400"><strong>A:</strong> {v.a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
