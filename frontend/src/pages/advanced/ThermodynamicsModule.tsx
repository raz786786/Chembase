import React, { useState } from 'react';
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
import FormulaExplorer from './thermodynamics/components/FormulaExplorer';
import CommonMistakes from './thermodynamics/components/CommonMistakes';
import IndustrialApplications from './thermodynamics/components/IndustrialApplications';
import ThermoLabAnalytics from './thermodynamics/components/ThermoLabAnalytics';
import MyWork from './thermodynamics/components/MyWork';


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
      // Stubs for future implementations
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
      case 'formulas':
        return <FormulaExplorer />;
      case 'mistakes':
        return <CommonMistakes />;
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
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb / Back Button */}
        {activeSection !== 'dashboard' && (
          <button 
            onClick={() => setActiveSection('dashboard')}
            className="flex items-center gap-2 text-sm font-bold text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group bg-white dark:bg-surface-900 px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-800 w-fit shadow-sm"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Thermodynamics Hub
          </button>
        )}

        {/* Dynamic Section Content */}
        {renderSection()}

      </div>
    </div>
  );
}
