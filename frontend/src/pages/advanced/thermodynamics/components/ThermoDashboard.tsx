import { 
  BookOpen, Calculator, Database, RefreshCw, LineChart, 
  Bot, Lightbulb, PlayCircle, Mic, Sigma, 
  AlertTriangle, Factory, FlaskConical, FolderArchive 
} from 'lucide-react';

interface ThermoDashboardProps {
  onNavigate: (section: string) => void;
}

export function ThermoDashboard({ onNavigate }: ThermoDashboardProps) {
  const sections = [
    { id: 'learn', title: 'Learn', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', desc: 'Master thermodynamic concepts & principles' },
    { id: 'calculators', title: 'Calculators', icon: Calculator, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', desc: '90+ unified thermodynamic calculators' },
    { id: 'database', title: 'Property Database', icon: Database, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', desc: 'Steam, refrigerants, and real gas data' },
    { id: 'cycles', title: 'Cycle Analyzer', icon: RefreshCw, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', desc: 'Interactive Rankine, Brayton, and Otto cycles' },
    { id: 'diagrams', title: 'Diagram Studio', icon: LineChart, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20', desc: 'Plot T-s, P-v, and P-h property diagrams' },
    { id: 'tutor', title: 'AI Tutor', icon: Bot, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20', desc: 'Ask complex conceptual questions' },
    { id: 'solver', title: 'Problem Solver', icon: Lightbulb, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', desc: 'Paste a problem and get step-by-step solutions' },
    { id: 'practice', title: 'Practice', icon: PlayCircle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', desc: 'Basic to university-level challenge problems' },
    { id: 'viva', title: 'Viva', icon: Mic, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20', desc: 'Dynamic adaptive oral examination' },
    { id: 'formulas', title: 'Formula Explorer', icon: Sigma, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20', desc: 'Detailed physical meaning of every equation' },
    { id: 'mistakes', title: 'Common Mistakes', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', desc: 'Avoid critical thermodynamic errors' },
    { id: 'industrial', title: 'Industrial Apps', icon: Factory, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-900/20', desc: 'How thermodynamics is used in industry' },
    { id: 'lab', title: 'Lab Analytics', icon: FlaskConical, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20', desc: 'Connect to calorimetry and engine labs' },
    { id: 'saved', title: 'My Work', icon: FolderArchive, color: 'text-zinc-500', bg: 'bg-zinc-50 dark:bg-zinc-900/20', desc: 'Saved calculations, diagrams, and notes' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-surface-900 dark:text-white tracking-tight mb-2">
            Thermodynamic Engineering Workspace
          </h1>
          <p className="text-surface-500 font-medium max-w-2xl">
            A comprehensive suite for learning, calculating, visualizing, and analyzing chemical and mechanical thermodynamics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sections.map((sec) => (
          <div 
            key={sec.id}
            onClick={() => onNavigate(sec.id)}
            className="group bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-3xl p-6 cursor-pointer hover:border-primary-400 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300"
          >
            <div className={`w-12 h-12 rounded-2xl ${sec.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
              <sec.icon className={`w-6 h-6 ${sec.color}`} />
            </div>
            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2 group-hover:text-primary-500 transition-colors">
              {sec.title}
            </h3>
            <p className="text-sm text-surface-500 leading-relaxed">
              {sec.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
