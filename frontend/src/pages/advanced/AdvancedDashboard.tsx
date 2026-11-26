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
import { useState, useEffect, Component, type ReactNode } from 'react';

class ModuleErrorBoundary extends Component<{ children: ReactNode; resetKey: string }, { hasError: boolean; message: string }> {
  state = { hasError: false, message: '' };
  static getDerivedStateFromError(err: Error) {
    return { hasError: true, message: err?.message || 'Unexpected calculation error' };
  }
  componentDidUpdate(prevProps: { resetKey: string }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, message: '' });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="glass p-6 rounded-2xl border border-rose-500/30 text-center space-y-3 max-w-lg mx-auto my-8">
          <p className="text-sm font-bold text-rose-500">Module encountered an unexpected state</p>
          <p className="text-xs text-surface-400">{this.state.message}</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-500 transition-colors"
          >
            Reset Module
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
  { path: 'thermodynamics', label: 'Thermodynamics', icon: Flame, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', desc: 'Phase diagrams, flash calcs & property tables', tools: 6 },
  { path: 'fluid-mechanics', label: 'Fluid Mechanics', icon: Waves, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20', desc: 'Moody Chart, Reynolds & Darcy-Weisbach', tools: 4 },
  { path: 'heat-transfer', label: 'Heat Transfer', icon: Thermometer, color: 'text-accent-500', bg: 'bg-accent-50 dark:bg-accent-900/20', desc: 'LMTD, conduction, convection & radiation', tools: 5 },
  { path: 'reaction-eng', label: 'Reaction Engineering', icon: Settings, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20', desc: 'CSTR, PFR, Batch sizing & Arrhenius', tools: 5 },
  { path: 'mass-transfer', label: 'Mass Transfer', icon: Layers, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20', desc: "Fick's law, McCabe-Thiele & absorption", tools: 3 },
  { path: 'equipment', label: 'Equipment & Machinery', icon: Zap, color: 'text-accent-500', bg: 'bg-accent-50 dark:bg-accent-900/20', desc: 'Pumps, NPSH, compressors & turbines', tools: 4 },
  { path: 'materials', label: 'Materials & Properties', icon: Database, color: 'text-accent-500', bg: 'bg-accent-50 dark:bg-accent-900/20', desc: 'Chemical properties & materials database', tools: 2 },
  { path: 'process-design', label: 'Process Design', icon: TrendingUp, color: 'text-surface-500', bg: 'bg-surface-50 dark:bg-surface-900/20', desc: 'CEPCI cost models & economic sizing', tools: 3 },
  { path: 'calculators', label: 'Calculators Hub', icon: Calculator, color: 'text-accent-500', bg: 'bg-accent-50 dark:bg-accent-900/20', desc: 'Heat duty, pressure drop & balances', tools: 8 },
  { path: 'math-chemistry', label: 'Math & Chemistry Tools', icon: Sigma, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20', desc: 'Stoichiometry, equation balancer & roots', tools: 10 },
  { path: 'separation', label: 'Separation Processes', icon: Columns2, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20', desc: 'VLE, FUG, McCabe-Thiele & flash', tools: 6 },
  { path: 'process-control', label: 'Process Control', icon: Activity, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', desc: 'PID tuning, Bode margins & simulation', tools: 6 },
  { path: 'process-simulation', label: 'Process Simulation', icon: Workflow, color: 'text-accent-500', bg: 'bg-accent-50 dark:bg-accent-900/20', desc: 'Flowsheet simulation & recycle loops', tools: 5 },
  { path: 'pfd-pid', label: 'PFD & P&ID', icon: GitBranch, color: 'text-accent-500', bg: 'bg-accent-50 dark:bg-accent-900/20', desc: 'ISA-5.1 tag decoder & symbol library', tools: 5 },
  { path: 'particulate', label: 'Particulate Technology', icon: Grid3x3, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20', desc: 'Sieve analysis, Bond crushing & cyclones', tools: 5 },
  { path: 'process-safety', label: 'HSE & Process Safety', icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', desc: 'HAZOP, LOPA, risk matrix & safety', tools: 5 },
  { path: 'industry', label: 'Industrial Knowledge', icon: Factory, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20', desc: 'Fertilizer, Cement, Petrochemical & O&G', tools: 5 },
  { path: 'career-hub', label: 'Career Hub', icon: Briefcase, color: 'text-accent-500', bg: 'bg-accent-50 dark:bg-accent-900/20', desc: 'Targeted CV builder & interview simulator', tools: 4 },
  { path: 'fyp', label: 'Final Year Project', icon: GraduationCap, color: 'text-accent-500', bg: 'bg-accent-50 dark:bg-accent-900/20', desc: 'Idea bank, canvas & timeline tracker', tools: 5 },
  { path: 'academic-hub', label: 'Academic Hub', icon: Brain, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20', desc: 'Study planners, flashcards & quiz lab', tools: 7 },
  { path: 'substance-profiles', label: 'Substance Profiles', icon: FlaskConical, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20', desc: 'PubChem datasheets & CAS search', tools: 1 },
  { path: 'visualizations', label: 'Visualizations', icon: TrendingUpIcon, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20', desc: 'Phase diagrams & kinetic plots', tools: 4 },
  { path: 'problem-solver', label: 'Problem Solver', icon: BookOpen, color: 'text-accent-500', bg: 'bg-accent-50 dark:bg-accent-900/20', desc: 'Step-by-step engineering problems', tools: 6 },
  { path: 'units-converter', label: 'Units Converter', icon: ArrowRightLeft, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20', desc: 'Engineering unit conversions', tools: 50 },
  { path: 'lab-assistant', label: 'Lab Assistant', icon: Microscope, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20', desc: 'Virtual lab prep & viva simulator', tools: 5 },
  { path: 'data-analysis', label: 'Data Analysis', icon: BarChart3, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20', desc: 'CSV regression & statistical analysis', tools: 5 },
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 sm:space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-bold uppercase tracking-wider border border-primary-500/20">
            26 Engineering Modules
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-surface-900 dark:text-surface-50 mb-1">
          Engineering Hub Console
        </h1>
        <p className="text-surface-500 text-xs sm:text-sm max-w-2xl">
          Simulators, unit operation solvers, thermodynamic engines, and property databases.
        </p>
        
        <div className="flex flex-wrap gap-2 mt-4">
          <div className="bg-surface-100 dark:bg-surface-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-[11px] font-semibold text-surface-700 dark:text-surface-300">
            <Calculator className="w-3.5 h-3.5 text-primary-600" /> 60+ Solvers
          </div>
          <div className="bg-surface-100 dark:bg-surface-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-[11px] font-semibold text-surface-700 dark:text-surface-300">
            <FlaskConical className="w-3.5 h-3.5 text-accent-500" /> Verified Data
          </div>
          <div className="bg-surface-100 dark:bg-surface-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-[11px] font-semibold text-surface-700 dark:text-surface-300">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Fast Compute
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {MAIN_CATEGORIES.map(cat => (
          <NavLink
            key={cat.id}
            to={`/advanced/category/${cat.id}`}
            className="glass-card p-4 sm:p-5 group no-underline relative block overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border border-surface-200 dark:border-surface-800 rounded-2xl"
          >
            <div className="flex justify-between items-start mb-3 relative z-10">
              <div className={`w-10 h-10 rounded-xl ${cat.bg} ${cat.color} flex items-center justify-center border border-surface-200/50 dark:border-surface-50/5 shadow-xs`}>
                <cat.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase text-surface-500 tracking-wider bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded-lg">
                {cat.paths.length} {cat.paths.length === 1 ? 'Module' : 'Modules'}
              </span>
            </div>
            <h3 className="text-base font-bold text-surface-900 dark:text-surface-50 mb-1 group-hover:text-primary-600 transition-colors relative z-10">
              {cat.title}
            </h3>
            <p className="text-xs text-surface-500 line-clamp-2 relative z-10">{cat.desc}</p>
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${category.bg} ${category.color} flex items-center justify-center border border-surface-200/50 dark:border-surface-50/5 shadow-xs`}>
          <category.icon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-surface-900 dark:text-surface-50">{category.title} Modules</h1>
          <p className="text-surface-500 text-xs">{category.desc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {cards.map(card => (
          <NavLink
            key={card.path}
            to={`/advanced/${card.path}`}
            className="glass-card p-4 sm:p-5 group no-underline relative block overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border border-surface-200 dark:border-surface-800 rounded-2xl"
          >
            <div className="flex justify-between items-start mb-3 relative z-10">
              <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center border border-surface-200/50 dark:border-surface-50/5 shadow-xs`}>
                <card.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase text-surface-500 tracking-wider bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded-lg">
                {card.tools} tools
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-surface-900 dark:text-surface-50 mb-1 group-hover:text-primary-600 transition-colors relative z-10">{card.label}</h3>
            <p className="text-xs text-surface-500 line-clamp-2 mb-3 relative z-10">{card.desc}</p>
            <div className="flex items-center text-xs font-bold text-primary-600 gap-1 opacity-80 group-hover:opacity-100 transition-opacity relative z-10">
              Launch <ChevronRight className="w-3.5 h-3.5" />
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
    <div className="flex flex-col lg:flex-row m-0 lg:-m-8 min-h-[calc(100dvh-64px)] relative">
      {/* Mobile Top Navigation & Quick Switcher Strip */}
      <div className="lg:hidden flex flex-col bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex-shrink-0 z-20">
        <div className="flex items-center justify-between p-3">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800"
          >
            {isMobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span>All 26 Modules</span>
          </button>
          <span className="text-xs font-bold text-surface-800 dark:text-surface-100 truncate max-w-[180px]">
            {activeModuleLabel}
          </span>
        </div>

        {/* Mobile Horizontal Pill Carousel for Fast Switching */}
        <div className="touch-scroll-x flex gap-1.5 overflow-x-auto px-3 pb-2.5 pt-0.5 no-scrollbar">
          {navModules.slice(0, 10).map(m => {
            const isActive = (!m.path && !currentPath) || (m.path && (currentPath === m.path || currentPath.startsWith(m.path + '/')));
            return (
              <NavLink
                key={m.path}
                to={m.path ? `/advanced/${m.path}` : '/advanced'}
                className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  isActive
                    ? 'bg-primary-600 text-surface-50 shadow-xs'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'
                }`}
              >
                <m.icon className="w-3 h-3" />
                {m.label}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 glass border-r border-surface-200 dark:border-surface-800 flex-col flex-shrink-0">
        <div className="p-5 border-b border-surface-100 dark:border-surface-800">
          <h2 className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Engineering Modules</h2>
        </div>
        <nav className="flex-grow p-3 space-y-5 overflow-y-auto scrollbar-hide">
          <div className="space-y-1">
            <NavLink
              to="/advanced"
              end
              className={({ isActive }) => `flex items-center justify-between px-3 py-2 rounded-xl transition-all no-underline group relative overflow-hidden ${
                isActive 
                ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 font-bold border border-primary-200 dark:border-primary-500/20 shadow-xs' 
                : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 font-medium'
              }`}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-2.5 relative z-10">
                    <LayoutDashboard className={`w-4 h-4 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400'}`} />
                    <span className="text-xs tracking-tight">Dashboard</span>
                  </div>
                  {isActive && <ChevronRight className="w-3 h-3 relative z-10" />}
                </>
              )}
            </NavLink>
          </div>

          {MAIN_CATEGORIES.map(cat => {
            const catModules = navModules.filter(m => cat.paths.includes(m.path));
            if (catModules.length === 0) return null;
            return (
              <div key={cat.id} className="space-y-0.5">
                <h3 className="px-3 text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-1.5">{cat.title}</h3>
                {catModules.map(m => {
                  const isActive = currentPath === m.path || (m.path && currentPath.startsWith(m.path + '/'));
                  return (
                    <NavLink
                      key={m.path}
                      to={`/advanced/${m.path}`}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-xl transition-all no-underline group ${
                        isActive 
                        ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 font-bold border border-primary-200 dark:border-primary-500/20 shadow-xs' 
                        : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <m.icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400'}`} />
                        <span className="text-xs tracking-tight truncate max-w-[140px]">{m.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3 h-3" />}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="p-4 border-t border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
          <div className="flex items-center gap-2.5 p-2 rounded-xl border border-surface-200 dark:border-surface-700">
            <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center flex-shrink-0">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-surface-400 uppercase">Engine Status</p>
              <p className="text-xs font-black text-surface-900 dark:text-surface-50 leading-tight">26 Modules Online</p>
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
            <nav className="flex-grow p-4 space-y-5 overflow-y-auto scrollbar-hide">
              <div className="space-y-1">
                <NavLink
                  to="/advanced"
                  end
                  className={({ isActive }) => `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold ${
                    isActive 
                    ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400' 
                    : 'text-surface-600 dark:text-surface-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-primary-600" />
                    <span>Dashboard</span>
                  </div>
                </NavLink>
              </div>

              {MAIN_CATEGORIES.map(cat => {
                const catModules = navModules.filter(m => cat.paths.includes(m.path));
                if (catModules.length === 0) return null;
                return (
                  <div key={cat.id} className="space-y-1">
                    <h3 className="px-2 text-[10px] font-bold text-surface-400 uppercase tracking-widest">{cat.title}</h3>
                    {catModules.map(m => (
                      <NavLink
                        key={m.path}
                        to={`/advanced/${m.path}`}
                        className={({ isActive }) => `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                          isActive 
                          ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 font-bold' 
                          : 'text-surface-600 dark:text-surface-400'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <m.icon className="w-3.5 h-3.5" />
                          <span>{m.label}</span>
                        </div>
                      </NavLink>
                    ))}
                  </div>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area with Universal Breadcrumb Bar */}
      <div className="flex-grow overflow-y-auto p-3 sm:p-5 lg:p-8 bg-surface-50/50 dark:bg-surface-900/50 scrollbar-hide">
        {/* Universal Breadcrumb Bar */}
        <div className="flex items-center gap-1.5 mb-4 text-xs font-semibold text-surface-400">
          <NavLink to="/advanced" className="hover:text-primary-600 transition-colors">
            Engineering Hub
          </NavLink>
          {currentPath && (
            <>
              <ChevronRight className="w-3 h-3 text-surface-400" />
              <span className="text-surface-800 dark:text-surface-200 font-bold truncate">
                {activeModuleLabel}
              </span>
            </>
          )}
        </div>

        <ModuleErrorBoundary resetKey={location.pathname}><Routes>
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
        </Routes></ModuleErrorBoundary>
      </div>
    </div>
  );
}
