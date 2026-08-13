import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { ThermoDashboard } from './thermodynamics/components/ThermoDashboard';
import CalculatorsHub from './thermodynamics/components/CalculatorsHub';
import CycleAnalyzer from './thermodynamics/components/CycleAnalyzer';
import PropertyDatabase from './thermodynamics/components/PropertyDatabase';
import AITutor from './thermodynamics/components/AITutor';

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
      case 'diagrams':
      case 'solver':
      case 'practice':
      case 'viva':
      case 'formulas':
      case 'mistakes':
      case 'industrial':
      case 'lab':
      case 'saved':
        return (
          <div className="flex flex-col items-center justify-center py-20 bg-surface-50 dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800">
            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4 capitalize">
              {activeSection} Workspace
            </h2>
            <p className="text-surface-500 mb-8">This advanced thermodynamic tool is currently under construction.</p>
            <button 
              onClick={() => setActiveSection('dashboard')}
              className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        );
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
