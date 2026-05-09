import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Flame, 
  Wind, 
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
  ArrowRightLeft
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

const MODULES = [
  { path: '', label: 'Dashboard', icon: LayoutDashboard, color: 'text-indigo-600' },
  { path: 'thermodynamics', label: 'Thermodynamics', icon: Flame, color: 'text-rose-500' },
  { path: 'fluid-mechanics', label: 'Fluid Mechanics', icon: Waves, color: 'text-blue-500' },
  { path: 'heat-transfer', label: 'Heat Transfer', icon: Thermometer, color: 'text-amber-500' },
  { path: 'reaction-eng', label: 'Reaction Eng.', icon: Settings, color: 'text-violet-500' },
  { path: 'mass-transfer', label: 'Mass Transfer', icon: Layers, color: 'text-teal-500' },
  { path: 'equipment', label: 'Equipment', icon: Zap, color: 'text-yellow-500' },
  { path: 'materials', label: 'Materials', icon: Database, color: 'text-emerald-500' },
  { path: 'process-design', label: 'Process Design', icon: TrendingUp, color: 'text-slate-500' },
  { path: 'calculators', label: 'Calculators', icon: Calculator, color: 'text-green-500' },
  { path: 'substance-profiles', label: 'Profiles', icon: FlaskConical, color: 'text-cyan-500' },
  { path: 'visualizations', label: 'Visualizations', icon: TrendingUpIcon, color: 'text-pink-500' },
  { path: 'problem-solver', label: 'Problem Solver', icon: BookOpen, color: 'text-orange-500' },
  { path: 'units-converter', label: 'Units Converter', icon: ArrowRightLeft, color: 'text-sky-500' },
];

const DASHBOARD_CARDS = [
  { path: 'thermodynamics', label: 'Thermodynamics', icon: Flame, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', desc: 'Phase diagrams, flash calcs, ideal gas, van der waals, property tables', tools: 6 },
  { path: 'fluid-mechanics', label: 'Fluid Mechanics', icon: Waves, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', desc: 'Moody Chart, flow regimes, Reynolds, Bernoulli, Darcy-Weisbach', tools: 4 },
  { path: 'heat-transfer', label: 'Heat Transfer', icon: Thermometer, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', desc: 'Conduction, convection, radiation, LMTD, fouling factors database', tools: 5 },
  { path: 'reaction-eng', label: 'Reaction Engineering', icon: Settings, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20', desc: 'CSTR, PFR, Batch reactor sizing, Arrhenius, kinetics database', tools: 5 },
  { path: 'mass-transfer', label: 'Mass Transfer', icon: Layers, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20', desc: "Fick's law, McCabe-Thiele, packed column absorption", tools: 3 },
  { path: 'equipment', label: 'Equipment & Machinery', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', desc: 'Turbines, pump sizing & NPSH, compressor power, HX types', tools: 4 },
  { path: 'materials', label: 'Materials & Properties', icon: Database, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', desc: 'Chemical properties database, MSDS basics guide', tools: 2 },
  { path: 'process-design', label: 'Process Design', icon: TrendingUp, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-900/20', desc: 'CEPCI cost estimation, break-even analysis, economic pipe sizing', tools: 3 },
  { path: 'calculators', label: 'Calculators Hub', icon: Calculator, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', desc: 'Heat duty, mass/energy balance, pressure drop, pump power', tools: 8 },
  { path: 'substance-profiles', label: 'Substance Profiles', icon: FlaskConical, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20', desc: 'PubChem-powered chemical datasheets with CAS, MSDS, properties', tools: 1 },
  { path: 'visualizations', label: 'Visualizations', icon: TrendingUpIcon, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20', desc: 'Interactive Cp vs T, vapor pressure curves, phase diagrams, reactor graphs', tools: 4 },
  { path: 'problem-solver', label: 'Problem Solver', icon: BookOpen, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', desc: 'Ready-to-use engineering problems with step-by-step solutions', tools: 6 },
  { path: 'units-converter', label: 'Units Converter', icon: ArrowRightLeft, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-900/20', desc: 'Engineering unit conversions: temperature, pressure, flow, energy, viscosity', tools: 50 },
];

function DashboardLanding() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">Advanced Engineering Console</h1>
        <p className="text-slate-500 text-lg">Professional-grade chemical engineering simulators and property databases.</p>
        
        <div className="flex flex-wrap gap-4 mt-8">
          <div className="glass px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold text-indigo-600 border border-indigo-100 dark:border-indigo-900/30">
            <Calculator className="w-4 h-4" /> 60+ Tools Active
          </div>
          <div className="glass px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold text-emerald-600 border border-emerald-100 dark:border-emerald-900/30">
            <FlaskConical className="w-4 h-4" /> Verified Models
          </div>
          <div className="glass px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold text-amber-600 border border-amber-100 dark:border-amber-900/30">
            <Zap className="w-4 h-4" /> Real-time Compute
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DASHBOARD_CARDS.map(card => (
          <NavLink
            key={card.path}
            to={`/advanced/${card.path}`}
            className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition-all group no-underline"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <card.icon className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{card.tools} tools</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors">{card.label}</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">{card.desc}</p>
            <div className="flex items-center text-xs font-bold text-indigo-600 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

  return (
    <div className="flex -m-8 h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 glass border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Engineering Modules</h2>
        </div>
        <nav className="flex-grow p-4 space-y-1 overflow-y-auto scrollbar-hide">
          {MODULES.map(m => {
            const isActive = m.path === '' ? currentPath === '' : currentPath.startsWith(m.path);
            return (
              <NavLink
                key={m.path}
                to={m.path ? `/advanced/${m.path}` : '/advanced'}
                end={m.path === ''}
                className={`flex items-center justify-between p-3 rounded-2xl transition-all no-underline group ${
                  isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <m.icon className={`w-5 h-5 ${isActive ? 'text-white' : m.color}`} />
                  <span className="text-sm font-bold">{m.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Current Version</p>
              <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">v4.2.0-stable</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-grow overflow-y-auto p-12 bg-slate-50/50 dark:bg-slate-900/50 scrollbar-hide">
        <Routes>
          <Route index element={<DashboardLanding />} />
          <Route path="thermodynamics" element={<ThermodynamicsModule />} />
          <Route path="fluid-mechanics" element={<FluidMechanicsModule />} />
          <Route path="heat-transfer" element={<HeatTransferModule />} />
          <Route path="reaction-eng" element={<ReactionEngModule />} />
          <Route path="mass-transfer" element={<MassTransferModule />} />
          <Route path="equipment" element={<EquipmentModule />} />
          <Route path="materials" element={<MaterialsPropertiesModule />} />
          <Route path="process-design" element={<ProcessDesignModule />} />
          <Route path="calculators" element={<CalculatorsHub />} />
          <Route path="substance-profiles" element={<SubstanceProfileModule />} />
          <Route path="visualizations" element={<VisualizationsModule />} />
          <Route path="problem-solver" element={<ProblemSolverModule />} />
          <Route path="units-converter" element={<UnitsConverterModule />} />
        </Routes>
      </main>
    </div>
  );
}
