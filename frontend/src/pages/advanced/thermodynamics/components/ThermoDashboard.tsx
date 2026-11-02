import { 
  BookOpen, Calculator, Database, RefreshCw, LineChart, 
  Bot, Lightbulb, PlayCircle, Mic, 
  Factory, FlaskConical, FolderArchive, Flame 
} from 'lucide-react';

interface ThermoDashboardProps {
  onNavigate: (section: string) => void;
}

export function ThermoDashboard({ onNavigate }: ThermoDashboardProps) {
  const sections = [
    { id: 'learn', title: 'Learn', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', desc: 'Core principles & laws' },
    { id: 'calculators', title: 'Calculators', icon: Calculator, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', desc: '90+ thermodynamic solvers' },
    { id: 'database', title: 'Property DB', icon: Database, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', desc: 'Steam, refrigerants & gas' },
    { id: 'cycles', title: 'Cycle Analyzer', icon: RefreshCw, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', desc: 'Rankine, Brayton & Otto' },
    { id: 'diagrams', title: 'Diagram Studio', icon: LineChart, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20', desc: 'T-s, P-v, and P-h charts' },
    { id: 'tutor', title: 'AI Tutor', icon: Bot, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20', desc: 'Conceptual explanations' },
    { id: 'solver', title: 'Problem Solver', icon: Lightbulb, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', desc: 'Step-by-step solutions' },
    { id: 'practice', title: 'Practice', icon: PlayCircle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', desc: 'Challenge problems' },
    { id: 'viva', title: 'Viva Prep', icon: Mic, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20', desc: 'Adaptive oral examination' },
    { id: 'industrial', title: 'Industrial Apps', icon: Factory, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-900/20', desc: 'Plant application cases' },
    { id: 'lab', title: 'Lab Analytics', icon: FlaskConical, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20', desc: 'Calorimetry & engine data' },
    { id: 'saved', title: 'My Work', icon: FolderArchive, color: 'text-zinc-500', bg: 'bg-zinc-50 dark:bg-zinc-900/20', desc: 'Saved calculations & notes' },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="mb-2">
        <h1 className="text-xl sm:text-2xl font-extrabold text-surface-900 dark:text-surface-50 flex items-center gap-2 mb-0.5">
          <Flame className="w-5 h-5 text-rose-500" /> Thermodynamics Hub
        </h1>
        <p className="text-xs text-surface-500">
          Simulators, cycle solvers, EOS engines, and steam property tables.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {sections.map((sec) => (
          <div 
            key={sec.id}
            onClick={() => onNavigate(sec.id)}
            className="group glass border border-surface-200 dark:border-surface-800 rounded-2xl p-3 sm:p-4 cursor-pointer hover:border-rose-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${sec.bg} flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform`}>
                <sec.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${sec.color}`} />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-surface-900 dark:text-surface-50 mb-0.5 group-hover:text-rose-500 transition-colors truncate">
                {sec.title}
              </h3>
              <p className="text-[10px] sm:text-xs text-surface-400 line-clamp-1 sm:line-clamp-2">
                {sec.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
