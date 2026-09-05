import { Routes, Route, NavLink, useLocation, Navigate, useParams } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Flame, 
  Thermometer, 
  Settings, 
  Zap, 
  Database, 
  TrendingUp, 
  Calculator,
  ChevronRight,
  FlaskConical,
  Waves,
  Layers,
  Box,
  TrendingUp as TrendingUpIcon,
  BookOpen,
  ArrowRightLeft,
  Sigma,
  Columns2,
  Activity,
  Workflow,
  GitBranch,
  Grid3x3,
  ShieldAlert,
  Factory,
  Briefcase,
  GraduationCap,
  Brain,
  Microscope,
  BarChart3,
  Menu,
  X
} from 'lucide-react';
import ThermodynamicsModule from './ThermodynamicsModule';
import FluidMechanicsModule from './FluidMechanicsModule';
import HeatTransferModule from './HeatTransferModule';
import ReactionEngModule from './ReactionEngModule';
import MassTransferModule from './MassTransferModule';
import EquipmentModule from './EquipmentModule';
import MaterialsPropertiesModule from './MaterialsPropertiesModule';
import ProcessDesignModule from './ProcessDesignModule';
import CalculatorsHub from './CalculatorsHub';
import SubstanceProfileModule from './SubstanceProfileModule';
import VisualizationsModule from './VisualizationsModule';
import ProblemSolverModule from './ProblemSolverModule';
import UnitsConverterModule from './UnitsConverterModule';
import MathChemistryModule from './MathChemistryModule';
import SeparationProcessesModule from './SeparationProcessesModule';
import ProcessControlModule from './ProcessControlModule';
import ProcessSimulationModule from './ProcessSimulationModule';
import PfdPidModule from './PfdPidModule';
import ParticulateTechnologyModule from './ParticulateTechnologyModule';
import ProcessSafetyModule from './ProcessSafetyModule';
import IndustryModule from './industry/IndustryModule';
import { CORE_INDUSTRIES } from './industry/data/coreIndustries';
import CareerHubModule from './CareerHubModule';
import FypModule from './FypModule';
import AcademicHubModule from './AcademicHubModule';
import LaboratoryAssistantModule from './LaboratoryAssistantModule';
import DataAnalysisModule from './DataAnalysisModule';
import { isModuleEnabled } from '../../utils/moduleVisibility';
import { useState, useEffect } from 'react';

const ALL_MODULES = [
  { path: '', label: 'Dashboard', icon: LayoutDashboard, color: 'text-primary-600' },
  { path: 'thermodynamics', label: 'Thermodynamics', icon: Flame, color: 'text-rose-500' },
  { path: 'fluid-mechanics', label: 'Fluid Mechanics', icon: Waves, color: 'text-primary-500' },
  { path: 'heat-transfer', label: 'Heat Transfer', icon: Thermometer, color: 'text-accent-500' },
  { path: 'reaction-eng', label: 'Reaction Eng.', icon: Settings, color: 'text-violet-500' },
  { path: 'mass-transfer', label: 'Mass Transfer', icon: Layers, color: 'text-teal-500' },
  { path: 'equipment', label: 'Equipment', icon: Zap, color: 'text-accent-500' },
  { path: 'materials', label: 'Materials', icon: Database, color: 'text-accent-500' },
  { path: 'process-design', label: 'Process Design', icon: TrendingUp, color: 'text-surface-500' },
  { path: 'calculators', label: 'Calculators', icon: Calculator, color: 'text-accent-500' },
  { path: 'math-chemistry', label: 'Math & Chemistry', icon: Sigma, color: 'text-fuchsia-500' },
  { path: 'separation', label: 'Separation', icon: Columns2, color: 'text-primary-500' },
  { path: 'process-control', label: 'Process Control', icon: Activity, color: 'text-rose-500' },
  { path: 'process-simulation', label: 'Process Simulation', icon: Workflow, color: 'text-accent-500' },
  { path: 'pfd-pid', label: 'PFD & P&ID', icon: GitBranch, color: 'text-accent-500' },
  { path: 'particulate', label: 'Particulate Tech', icon: Grid3x3, color: 'text-violet-500' },
  { path: 'process-safety', label: 'HSE & Safety', icon: ShieldAlert, color: 'text-red-500' },
  { path: 'industry', label: 'Industrial Knowledge', icon: Factory, color: 'text-primary-500' },
  { path: 'career-hub', label: 'Career Hub', icon: Briefcase, color: 'text-accent-500' },
  { path: 'fyp', label: 'FYP Module', icon: GraduationCap, color: 'text-accent-500' },
  { path: 'academic-hub', label: 'Academic Hub', icon: Brain, color: 'text-primary-500' },
  { path: 'substance-profiles', label: 'Profiles', icon: FlaskConical, color: 'text-primary-500' },
  { path: 'visualizations', label: 'Visualizations', icon: TrendingUpIcon, color: 'text-pink-500' },
  { path: 'problem-solver', label: 'Problem Solver', icon: BookOpen, color: 'text-accent-500' },
  { path: 'units-converter', label: 'Units Converter', icon: ArrowRightLeft, color: 'text-primary-500' },
  { path: 'lab-assistant', label: 'Lab Assistant', icon: Microscope, color: 'text-teal-500' },
  { path: 'data-analysis', label: 'Data Analysis', icon: BarChart3, color: 'text-fuchsia-500' },
];

const ALL_DASHBOARD_CARDS = [
  { path: 'thermodynamics', label: 'Thermodynamics', icon: Flame, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', desc: 'Phase diagrams, flash calcs, ideal gas, van der waals, property tables', tools: 6 },
  { path: 'fluid-mechanics', label: 'Fluid Mechanics', icon: Waves, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20', desc: 'Moody Chart, flow regimes, Reynolds, Bernoulli, Darcy-Weisbach', tools: 4 },
  { path: 'heat-transfer', label: 'Heat Transfer', icon: Thermometer, color: 'text-accent-500', bg: 'bg-accent-50 dark:bg-accent-900/20', desc: 'Conduction, convection, radiation, LMTD, fouling factors database', tools: 5 },
  { path: 'reaction-eng', label: 'Reaction Engineering', icon: Settings, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20', desc: 'CSTR, PFR, Batch reactor sizing, Arrhenius, kinetics database', tools: 5 },
  { path: 'mass-transfer', label: 'Mass Transfer', icon: Layers, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20', desc: "Fick's law, McCabe-Thiele, packed column absorption", tools: 3 },
  { path: 'equipment', label: 'Equipment & Machinery', icon: Zap, color: 'text-accent-500', bg: 'bg-accent-50 dark:bg-accent-900/20', desc: 'Turbines, pump sizing & NPSH, compressor power, HX types', tools: 4 },
  { path: 'materials', label: 'Materials & Properties', icon: Database, color: 'text-accent-500', bg: 'bg-accent-50 dark:bg-accent-900/20', desc: 'Chemical properties database, MSDS basics guide', tools: 2 },
  { path: 'process-design', label: 'Process Design', icon: TrendingUp, color: 'text-surface-500', bg: 'bg-surface-50 dark:bg-surface-900/20', desc: 'CEPCI cost estimation, break-even analysis, economic pipe sizing', tools: 3 },
  { path: 'calculators', label: 'Calculators Hub', icon: Calculator, color: 'text-accent-500', bg: 'bg-accent-50 dark:bg-accent-900/20', desc: 'Heat duty, mass/energy balance, pressure drop, pump power', tools: 8 },
  { path: 'math-chemistry', label: 'Math & Chemistry Tools', icon: Sigma, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20', desc: 'Equation balancer, stoichiometry, molarity, pH, matrices, root finding, regression', tools: 10 },
  { path: 'separation', label: 'Separation Processes', icon: Columns2, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20', desc: 'Bubble/dew point, flash, x–y VLE, FUG design, McCabe–Thiele, absorption', tools: 6 },
  { path: 'process-control', label: 'Process Control', icon: Activity, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', desc: 'FOPDT models, PID tuning, closed-loop simulation, Routh–Hurwitz, root locus, Bode margins', tools: 6 },
  { path: 'process-simulation', label: 'Process Simulation', icon: Workflow, color: 'text-accent-500', bg: 'bg-accent-50 dark:bg-accent-900/20', desc: 'Sequential-modular flowsheets, recycle convergence, unit ops, cubic EOS', tools: 5 },
  { path: 'pfd-pid', label: 'PFD & P&ID', icon: GitBranch, color: 'text-accent-500', bg: 'bg-accent-50 dark:bg-accent-900/20', desc: 'Symbol library, example PFDs, ISA-5.1 tag decoder, control loops, interactive builder, quiz', tools: 5 },
  { path: 'particulate', label: 'Particulate Technology', icon: Grid3x3, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20', desc: 'PSD & sieve analysis, Bond crushing, settling, cyclones, filtration, fluidization', tools: 5 },
  { path: 'process-safety', label: 'HSE & Process Safety', icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', desc: 'Risk matrix, HAZOP worksheet, LOPA, JSA, bow-tie, PtW/LOTO/confined-space fundamentals', tools: 5 },
  { path: 'industry', label: 'Industrial Knowledge', icon: Factory, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20', desc: 'Interactive structured databases for Fertilizer, Cement, O&G, with troubleshooting and process flow simulators', tools: 5 },
  { path: 'career-hub', label: 'Career Hub', icon: Briefcase, color: 'text-accent-500', bg: 'bg-accent-50 dark:bg-accent-900/20', desc: 'ATS-friendly CV builder with live preview, LinkedIn optimizer, 22-question interview bank and a scored interview simulator', tools: 4 },
  { path: 'fyp', label: 'Final Year Project', icon: GraduationCap, color: 'text-accent-500', bg: 'bg-accent-50 dark:bg-accent-900/20', desc: '24 FYP idea cards, problem canvas with research-question coach, methodology & literature matrix, report studio, defense prep and 18-week timeline', tools: 5 },
  { path: 'academic-hub', label: 'Academic Hub', icon: Brain, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20', desc: 'Study, exam & assignment planners, flashcards with spaced repetition, quiz lab, formula sheets and a personalized mastery dashboard', tools: 7 },
  { path: 'substance-profiles', label: 'Substance Profiles', icon: FlaskConical, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20', desc: 'PubChem-powered chemical datasheets with CAS, MSDS, properties', tools: 1 },
  { path: 'visualizations', label: 'Visualizations', icon: TrendingUpIcon, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20', desc: 'Interactive Cp vs T, vapor pressure curves, phase diagrams, reactor graphs', tools: 4 },
  { path: 'problem-solver', label: 'Problem Solver', icon: BookOpen, color: 'text-accent-500', bg: 'bg-accent-50 dark:bg-accent-900/20', desc: 'Ready-to-use engineering problems with step-by-step solutions', tools: 6 },
  { path: 'units-converter', label: 'Units Converter', icon: ArrowRightLeft, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20', desc: 'Engineering unit conversions: temperature, pressure, flow, energy, viscosity', tools: 50 },
  { path: 'lab-assistant', label: 'Lab Assistant', icon: Microscope, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20', desc: 'Experiment library with pre-lab prep, in-lab data sheets (live calculations, unit conversion & error checks), post-lab analysis and a self-graded viva simulator', tools: 5 },
  { path: 'data-analysis', label: 'Data Analysis', icon: BarChart3, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20', desc: 'Upload CSV/Excel data, fit regression models with R², descriptive statistics and plain-English interpretation', tools: 5 },
];

const MAIN_CATEGORIES = [
  { id: 'courses', title: 'Courses', icon: BookOpen, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20', desc: 'Core engineering subjects, unit operations, and process design.', paths: ['thermodynamics', 'fluid-mechanics', 'heat-transfer', 'reaction-eng', 'mass-transfer', 'equipment', 'materials', 'process-design', 'math-chemistry', 'separation', 'process-control', 'process-simulation', 'pfd-pid', 'particulate'] },
  { id: 'safety', title: 'Safety', icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', desc: 'HSE tools, risk matrix, HAZOP, and process safety fundamentals.', paths: ['process-safety'] },
  { id: 'industry', title: 'Industry', icon: Factory, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', desc: 'Interactive databases and knowledge base for core chemical industries.', paths: ['industry'] },
  { id: 'career-hub', title: 'Career Hub', icon: Briefcase, color: 'text-accent-500', bg: 'bg-accent-50 dark:bg-accent-900/20', desc: 'CV builders, interview simulators, FYP, and academic resources.', paths: ['career-hub', 'fyp', 'academic-hub', 'data-analysis'] },
  { id: 'lab', title: 'Lab', icon: Microscope, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20', desc: 'Virtual lab assistant, experiment prep, and data analysis.', paths: ['lab-assistant'] },
  { id: 'others', title: 'Others', icon: Layers, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20', desc: 'Calculators, property profiles, visualizations, and conversions.', paths: ['calculators', 'substance-profiles', 'visualizations', 'problem-solver', 'units-converter'] },
];

function DashboardLanding() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[11px] font-semibold uppercase tracking-wider border border-primary-500/20">
            27 Chemical Engineering Subjects Active
          </span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50 mb-2">Engineering Hub Console</h1>
        <p className="text-surface-500 text-base max-w-3xl leading-relaxed">Professional-grade chemical engineering simulators, unit operation solvers, thermodynamic engines, and property databases.</p>
        
        <div className="flex flex-wrap gap-4 mt-6">
          <div className="bg-primary-50 dark:bg-primary-950 px-4 py-2.5 rounded-[10px] flex items-center gap-2 text-[11px] font-semibold text-primary-600 dark:text-primary-400 border border-primary-500/20">
            <Calculator className="w-4 h-4" /> 60+ Computation Solvers
          </div>
          <div className="bg-primary-50 dark:bg-primary-950 px-4 py-2.5 rounded-[10px] flex items-center gap-2 text-[11px] font-semibold text-accent-600 dark:text-accent-400 border border-accent-500/20">
            <FlaskConical className="w-4 h-4" /> Peer-Verified Correlations
          </div>
          <div className="bg-primary-50 dark:bg-primary-950 px-4 py-2.5 rounded-[10px] flex items-center gap-2 text-[11px] font-semibold text-accent-600 dark:text-accent-400 border border-accent-500/20">
            <Zap className="w-4 h-4" /> Real-Time Non-Blocking Compute
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
        {MAIN_CATEGORIES.map(cat => (
          <NavLink
            key={cat.id}
            to={`/advanced/category/${cat.id}`}
            className="glass-card p-6 group no-underline relative block overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 via-transparent to-accent-500/0 group-hover:from-primary-500/5 group-hover:to-accent-500/5 transition-colors duration-500 pointer-events-none" />
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className={`w-14 h-14 rounded-2xl ${cat.bg} ${cat.color} flex items-center justify-center group-hover:scale-[1.03] group-active:scale-[0.97] transition-transform duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] border border-surface-200/50 dark:border-surface-50/5 shadow-sm`}>
                <cat.icon className="w-7 h-7" />
              </div>
              <span className="text-[11px] font-semibold uppercase text-surface-500 tracking-widest bg-surface-100/80 dark:bg-black/40 px-2.5 py-1 rounded-xl border border-surface-200/50 dark:border-surface-50/5 backdrop-blur-md">{cat.paths.length} Modules</span>
            </div>
            <h3 className="text-xl font-bold text-surface-900 dark:text-surface-50 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors relative z-10">{cat.title}</h3>
            <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed relative z-10">{cat.desc}</p>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

function CategoryView() {
  const { categoryId } = useParams();
  const category = MAIN_CATEGORIES.find(c => c.id === categoryId);
  const [cards, setCards] = useState(() => {
    if (!category) return [];
    return ALL_DASHBOARD_CARDS.filter(c => category.paths.includes(c.path) && (!c.path || isModuleEnabled(c.path)));
  });

  useEffect(() => {
    const handleUpdate = () => {
      if (!category) return;
      setCards(ALL_DASHBOARD_CARDS.filter(c => category.paths.includes(c.path) && (!c.path || isModuleEnabled(c.path))));
    };
    window.addEventListener('chembase-governance-updated', handleUpdate);
    return () => window.removeEventListener('chembase-governance-updated', handleUpdate);
  }, [category]);

  if (!category) {
    return <Navigate to="/advanced" replace />;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      <div className="flex items-center gap-2 mb-6">
        <NavLink to="/advanced" className="text-sm font-semibold text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          Engineering Hub
        </NavLink>
        <ChevronRight className="w-4 h-4 text-surface-400" />
        <span className="text-sm font-bold text-surface-900 dark:text-surface-50">{category.title}</span>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className={`w-12 h-12 rounded-xl ${category.bg} ${category.color} flex items-center justify-center border border-surface-200/50 dark:border-surface-50/5 shadow-sm`}>
          <category.icon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-surface-50">{category.title} Modules</h1>
          <p className="text-surface-500 text-sm">{category.desc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map(card => (
          <NavLink
            key={card.path}
            to={`/advanced/${card.path}`}
            className="glass-card p-5 group no-underline relative block overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 via-transparent to-accent-500/0 group-hover:from-primary-500/5 group-hover:to-accent-500/5 transition-colors duration-500 pointer-events-none" />
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className={`w-14 h-14 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center group-hover:scale-[1.03] group-active:scale-[0.97] transition-transform duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] border border-surface-200/50 dark:border-surface-50/5 shadow-sm`}>
                <card.icon className="w-7 h-7" />
              </div>
              <span className="text-[11px] font-semibold uppercase text-surface-500 tracking-widest bg-surface-100/80 dark:bg-black/40 px-2.5 py-1 rounded-xl border border-surface-200/50 dark:border-surface-50/5 backdrop-blur-md">{card.tools} tools</span>
            </div>
            <h3 className="text-base font-bold text-surface-900 dark:text-surface-50 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors relative z-10">{card.label}</h3>
            <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed mb-6 relative z-10">{card.desc}</p>
            <div className="flex items-center text-xs font-bold text-primary-600 dark:text-primary-400 gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 relative z-10">
              Launch Module <ChevronRight className="w-4 h-4" />
            </div>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export default function AdvancedDashboard() {
  const location = useLocation();
  const currentPath = location.pathname.replace('/advanced', '').replace(/^\//, '');
  const [navModules, setNavModules] = useState(() => ALL_MODULES.filter(m => !m.path || isModuleEnabled(m.path)));
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setNavModules(ALL_MODULES.filter(m => !m.path || isModuleEnabled(m.path)));
    };
    window.addEventListener('chembase-governance-updated', handleUpdate);
    return () => window.removeEventListener('chembase-governance-updated', handleUpdate);
  }, []);

  // Close mobile sidebar whenever route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  const activeModuleLabel = ALL_MODULES.find(m => m.path === currentPath || (m.path && currentPath.startsWith(m.path)))?.label || 'Dashboard';

  return (
    <div className="flex flex-col lg:flex-row -m-4 sm:-m-6 lg:-m-8 h-[calc(100vh-64px)] overflow-hidden relative">
      {/* Mobile Top Navigation Bar */}
      <div className="lg:hidden flex items-center justify-between p-3.5 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex-shrink-0 z-20">
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800"
        >
          {isMobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>Modules Menu</span>
        </button>
        <span className="text-xs font-medium text-surface-500 truncate max-w-[180px]">
          {activeModuleLabel}
        </span>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 glass border-r border-surface-200 dark:border-surface-800 flex-col flex-shrink-0">
        <div className="p-6 border-b border-surface-100 dark:border-surface-800">
          <h2 className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Engineering Modules</h2>
        </div>
        <nav className="flex-grow p-4 space-y-6 overflow-y-auto scrollbar-hide">
          <div className="space-y-1">
            <NavLink
              to="/advanced"
              end
              className={({ isActive }) => `flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 no-underline group relative overflow-hidden ${
                isActive 
                ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 font-bold border border-primary-200 dark:border-primary-500/20 shadow-sm shadow-primary-500/5' 
                : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-50/5 border border-transparent font-medium'
              }`}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3 relative z-10">
                    <LayoutDashboard className={`w-5 h-5 transition-colors ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400 group-hover:text-surface-600 dark:group-hover:text-surface-300'}`} />
                    <span className="text-sm tracking-tight">Dashboard</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 relative z-10" />}
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-l-xl shadow-[0_0_10px_rgba(6,182,212,0.5)]" />}
                </>
              )}
            </NavLink>
          </div>

          {MAIN_CATEGORIES.map(cat => {
            const catModules = navModules.filter(m => cat.paths.includes(m.path));
            if (catModules.length === 0) return null;
            return (
              <div key={cat.id} className="space-y-1">
                <h3 className="px-4 text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2">{cat.title}</h3>
                {catModules.map(m => {
                  const isActive = currentPath === m.path || (m.path && currentPath.startsWith(m.path + '/'));
                  return (
                    <NavLink
                      key={m.path}
                      to={`/advanced/${m.path}`}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-300 no-underline group relative overflow-hidden ${
                        isActive 
                        ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 font-bold border border-primary-200 dark:border-primary-500/20 shadow-sm shadow-primary-500/5' 
                        : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-50/5 border border-transparent font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3 relative z-10">
                        <m.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400 group-hover:text-surface-600 dark:group-hover:text-surface-300'}`} />
                        <span className="text-[13px] tracking-tight">{m.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 relative z-10" />}
                      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-l-xl shadow-[0_0_10px_rgba(6,182,212,0.5)]" />}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="p-6 border-t border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-surface-200 dark:border-surface-700">
            <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-surface-400 uppercase">Current Version</p>
              <p className="text-xs font-black text-surface-900 dark:text-surface-50 leading-tight">v4.2.0-stable</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {isMobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div 
            className="fixed inset-0 bg-surface-900/60 backdrop-blur-xs"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-surface-50 dark:bg-surface-950 h-full flex flex-col z-50 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
              <h2 className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Engineering Modules</h2>
              <button 
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-grow p-4 space-y-6 overflow-y-auto scrollbar-hide">
          <div className="space-y-1">
            <NavLink
              to="/advanced"
              end
              className={({ isActive }) => `flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 no-underline group relative overflow-hidden ${
                isActive 
                ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 font-bold border border-primary-200 dark:border-primary-500/20 shadow-sm shadow-primary-500/5' 
                : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-50/5 border border-transparent font-medium'
              }`}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3 relative z-10">
                    <LayoutDashboard className={`w-5 h-5 transition-colors ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400 group-hover:text-surface-600 dark:group-hover:text-surface-300'}`} />
                    <span className="text-sm tracking-tight">Dashboard</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 relative z-10" />}
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-l-xl shadow-[0_0_10px_rgba(6,182,212,0.5)]" />}
                </>
              )}
            </NavLink>
          </div>

          {MAIN_CATEGORIES.map(cat => {
            const catModules = navModules.filter(m => cat.paths.includes(m.path));
            if (catModules.length === 0) return null;
            return (
              <div key={cat.id} className="space-y-1">
                <h3 className="px-4 text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2">{cat.title}</h3>
                {catModules.map(m => {
                  const isActive = currentPath === m.path || (m.path && currentPath.startsWith(m.path + '/'));
                  return (
                    <NavLink
                      key={m.path}
                      to={`/advanced/${m.path}`}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-300 no-underline group relative overflow-hidden ${
                        isActive 
                        ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 font-bold border border-primary-200 dark:border-primary-500/20 shadow-sm shadow-primary-500/5' 
                        : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-50/5 border border-transparent font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3 relative z-10">
                        <m.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400 group-hover:text-surface-600 dark:group-hover:text-surface-300'}`} />
                        <span className="text-[13px] tracking-tight">{m.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 relative z-10" />}
                      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-l-xl shadow-[0_0_10px_rgba(6,182,212,0.5)]" />}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>
            <div className="p-4 border-t border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-surface-200 dark:border-surface-700">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-surface-400 uppercase">Current Version</p>
                  <p className="text-xs font-black text-surface-900 dark:text-surface-50 leading-tight">v4.2.0-stable</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Area */}
      <main className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-12 bg-surface-50/50 dark:bg-surface-900/50 scrollbar-hide">
        <Routes>
          <Route index element={<DashboardLanding />} />
          <Route path="category/:categoryId" element={<CategoryView />} />
          <Route path="thermodynamics" element={<ThermodynamicsModule />} />
          <Route path="fluid-mechanics" element={<FluidMechanicsModule />} />
          <Route path="heat-transfer" element={<HeatTransferModule />} />
          <Route path="reaction-eng" element={<ReactionEngModule />} />
          <Route path="mass-transfer" element={<MassTransferModule />} />
          <Route path="equipment" element={<EquipmentModule />} />
          <Route path="materials" element={<MaterialsPropertiesModule />} />
          <Route path="process-design" element={<ProcessDesignModule />} />
          <Route path="calculators" element={<CalculatorsHub />} />
          <Route path="math-chemistry" element={<MathChemistryModule />} />
          <Route path="separation" element={<SeparationProcessesModule />} />
          <Route path="process-control" element={<ProcessControlModule />} />
          <Route path="process-simulation" element={<ProcessSimulationModule />} />
          <Route path="pfd-pid" element={<PfdPidModule />} />
          <Route path="particulate" element={<ParticulateTechnologyModule />} />
          <Route path="process-safety" element={<ProcessSafetyModule />} />
          <Route path="industry/*" element={<IndustryModule />} />
          <Route path="industrial-knowledge/*" element={<Navigate to="/advanced/industry" replace />} />
          {CORE_INDUSTRIES.map(ind => (
            <Route key={ind.id} path={`${ind.id}/*`} element={<Navigate to={`/advanced/industry/${ind.id}`} replace />} />
          ))}
          <Route path="career-hub" element={<CareerHubModule />} />
          <Route path="fyp" element={<FypModule />} />
          <Route path="academic-hub" element={<AcademicHubModule />} />
          <Route path="substance-profiles" element={<SubstanceProfileModule />} />
          <Route path="visualizations" element={<VisualizationsModule />} />
          <Route path="problem-solver" element={<ProblemSolverModule />} />
          <Route path="units-converter" element={<UnitsConverterModule />} />
          <Route path="lab-assistant/*" element={<LaboratoryAssistantModule />} />
          <Route path="data-analysis" element={<DataAnalysisModule />} />
        </Routes>
      </main>
    </div>
  );
}
