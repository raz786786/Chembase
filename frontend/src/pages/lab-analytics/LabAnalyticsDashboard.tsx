
import { NavLink } from 'react-router-dom';
import { Activity, Beaker, Droplets, Flame, Wind, Layers, Settings2, Zap } from 'lucide-react';

const SUBJECTS = [
  { id: 'fluid-mechanics', title: 'Fluid Mechanics', icon: <Droplets className="w-5 h-5" />, desc: 'Pipes, pumps, and fluid flow experiments' },
  { id: 'heat-transfer', title: 'Heat Transfer', icon: <Flame className="w-5 h-5" />, desc: 'Heat exchangers, conduction, and radiation' },
  { id: 'thermodynamics', title: 'Thermodynamics', icon: <Zap className="w-5 h-5" />, desc: 'Engines, cycles, and property analysis' },
  { id: 'mass-transfer', title: 'Mass Transfer', icon: <Wind className="w-5 h-5" />, desc: 'Diffusion, absorption, and drying' },
  { id: 'separation-processes', title: 'Separation Processes', icon: <Layers className="w-5 h-5" />, desc: 'Distillation, extraction, and chromatography' },
  { id: 'reaction-engineering', title: 'Reaction Engineering', icon: <Activity className="w-5 h-5" />, desc: 'Reactors, kinetics, and catalysis' },
  { id: 'particulate-technology', title: 'Particulate Technology', icon: <Beaker className="w-5 h-5" />, desc: 'Comminution, sieving, and fluidization' },
  { id: 'process-control', title: 'Process Control', icon: <Settings2 className="w-5 h-5" />, desc: 'Instrumentation and control systems' },
];

export default function LabAnalyticsDashboard() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 mt-6">
      <div className="relative overflow-hidden rounded-3xl bg-surface-900 border border-surface-200/50 dark:border-surface-50/10 p-5 sm:p-8 lg:p-12 text-surface-50 shadow-2xl group">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-950/40 border border-primary-800/60 text-primary-400 text-xs font-bold uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5" /> AI-Assisted Engineering Laboratory
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white">
            Lab Analytics <span className="text-primary-400">Hub</span>
          </h1>
          <p className="text-surface-300 text-base sm:text-lg max-w-2xl font-medium">
            Select a Chemical Engineering subject to manage equipment, track experiments, and generate AI-assisted laboratory reports from your raw observation data.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {SUBJECTS.map((subject) => (
          <NavLink
            key={subject.id}
            to={`/advanced/lab-assistant/${subject.id}`}
            className="bg-white dark:bg-surface-800 p-6 rounded-2xl border border-surface-200 dark:border-surface-700 hover:border-primary-400 dark:hover:border-primary-500 transition-all group no-underline relative overflow-hidden btn-tactile block"
          >
            {/* Dynamic F+ Aura Tracker for Cards */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"
                 style={{
                   background: 'radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(138, 203, 193, 0.08), transparent 40%)',
                   backgroundAttachment: 'fixed'
                 }}
            />
            
            <div className="relative z-10 flex flex-col h-full gap-4">
              <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-[10px] flex items-center justify-center group-hover:scale-110 transition-transform">
                {subject.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {subject.title}
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400 font-medium">
                  {subject.desc}
                </p>
              </div>
              <div className="mt-auto pt-4 flex items-center text-primary-600 dark:text-primary-400 text-sm font-semibold group-hover:gap-2 transition-all">
                Enter Subject <span aria-hidden="true">&rarr;</span>
              </div>
            </div>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
