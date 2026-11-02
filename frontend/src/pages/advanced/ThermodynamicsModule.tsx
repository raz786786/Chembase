import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { ThermoDashboard } from './thermodynamics/components/ThermoDashboard';
import CalculatorsHub from './thermodynamics/components/CalculatorsHub';
import CycleAnalyzer from './thermodynamics/components/CycleAnalyzer';
import PropertyDatabase from './thermodynamics/components/PropertyDatabase';
import AITutor from './thermodynamics/components/AITutor';
import ThermoLearn from './thermodynamics/components/ThermoLearn';
import DiagramStudio from './thermodynamics/components/DiagramStudio';
import ProblemSolver from './thermodynamics/components/ProblemSolver';
import Practice from './thermodynamics/components/Practice';
import Viva from './thermodynamics/components/Viva';
import IndustrialApplications from './thermodynamics/components/IndustrialApplications';
import ThermoLabAnalytics from './thermodynamics/components/ThermoLabAnalytics';
import MyWork from './thermodynamics/components/MyWork';

const SUB_TOOLS = [
  { id: 'dashboard', label: 'Overview' },
  { id: 'calculators', label: '90+ Calculators' },
  { id: 'database', label: 'Property DB' },
  { id: 'cycles', label: 'Cycles' },
  { id: 'diagrams', label: 'Diagrams' },
  { id: 'tutor', label: 'AI Tutor' },
  { id: 'solver', label: 'Problem Solver' },
  { id: 'lab', label: 'Lab Analytics' },
] as const;

export default function ThermodynamicsModule() {
  const [activeSection, setActiveSection] = useState<string>('dashboard');

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <ThermoDashboard onNavigate={setActiveSection} />;
      case 'calculators':
        return <CalculatorsHub />;
      case 'cycles':
        return <CycleAnalyzer />;
      case 'database':
        return <PropertyDatabase />;
      case 'tutor':
        return <AITutor />;
      case 'learn':
        return <ThermoLearn />;
      case 'diagrams':
        return <DiagramStudio />;
      case 'solver':
        return <ProblemSolver />;
      case 'practice':
        return <Practice />;
      case 'viva':
        return <Viva />;
      case 'industrial':
        return <IndustrialApplications />;
      case 'lab':
        return <ThermoLabAnalytics />;
      case 'saved':
        return <MyWork />;
      default:
        return <ThermoDashboard onNavigate={setActiveSection} />;
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Quick Sub-tool Pill Switcher */}
      <div className="touch-scroll-x flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-surface-200 dark:border-surface-800 no-scrollbar">
        {activeSection !== 'dashboard' && (
          <button 
            onClick={() => setActiveSection('dashboard')}
            className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:text-primary-600 mr-1 flex-shrink-0"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
        )}
        {SUB_TOOLS.map(t => {
          const isActive = activeSection === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveSection(t.id)}
              className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-rose-600 text-surface-50 shadow-xs'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Dynamic Section Content */}
      {renderSection()}
    </div>
  );
}
