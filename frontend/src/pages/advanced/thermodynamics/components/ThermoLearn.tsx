import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, CheckCircle, Loader2 } from 'lucide-react';
import { THERMO_LEARN_DATA } from './ThermoLearnData';
import { api } from '../../../../api';

const topics = [
  {
    id: 'A',
    title: 'A. Basic Concepts',
    subtopics: ['System', 'Surroundings', 'Boundary', 'Open system', 'Closed system', 'Isolated system', 'State', 'Process', 'Cycle', 'Intensive properties', 'Extensive properties', 'Equilibrium', 'Quasi-static process']
  },
  {
    id: 'B',
    title: 'B. Thermodynamic Properties',
    subtopics: ['Pressure', 'Temperature', 'Volume', 'Specific volume', 'Density', 'Internal energy', 'Enthalpy', 'Entropy', 'Gibbs free energy', 'Helmholtz free energy', 'Specific heats', 'Compressibility factor']
  },
  {
    id: 'C',
    title: 'C. First Law of Thermodynamics',
    subtopics: ['Energy conservation', 'Closed-system energy balance', 'Open-system energy balance', 'Steady-flow energy equation', 'Heat', 'Work', 'Boundary work', 'Shaft work', 'Electrical work', 'Enthalpy']
  },
  {
    id: 'D',
    title: 'D. Second Law',
    subtopics: ['Kelvin-Planck statement', 'Clausius statement', 'Reversible processes', 'Irreversible processes', 'Entropy', 'Entropy generation', 'Carnot cycle', 'Second-law efficiency']
  },
  {
    id: 'E',
    title: 'E. Pure Substances',
    subtopics: ['Phase change', 'Compressed liquid', 'Saturated liquid', 'Saturated vapor', 'Wet region', 'Superheated vapor', 'Critical point', 'Triple point', 'Quality']
  },
  {
    id: 'F',
    title: 'F. Thermodynamic Relations',
    subtopics: ['Maxwell relations', 'Exact/inexact differentials', 'Fundamental property relations', 'Joule-Thomson effect', 'Clapeyron equation', 'Clausius-Clapeyron equation']
  },
  {
    id: 'G',
    title: 'G. Gas Thermodynamics',
    subtopics: ['Ideal gases', 'Real gases', 'Compressibility factor', 'Equations of state', 'van der Waals', 'Peng-Robinson', 'Soave-Redlich-Kwong', 'Fugacity concepts']
  },
  {
    id: 'H',
    title: 'H. Power Cycles',
    subtopics: ['Carnot', 'Rankine', 'Reheat Rankine', 'Regenerative Rankine', 'Brayton', 'Intercooled Brayton', 'Reheated Brayton', 'Regenerative Brayton', 'Otto', 'Diesel', 'Dual cycle']
  },
  {
    id: 'I',
    title: 'I. Refrigeration',
    subtopics: ['Refrigeration principle', 'Vapor-compression refrigeration', 'Absorption refrigeration', 'COP', 'Refrigerant properties', 'Throttling', 'Compressor', 'Condenser', 'Expansion valve', 'Evaporator']
  },
  {
    id: 'J',
    title: 'J. Mixtures',
    subtopics: ['Mole Fraction', 'Mass Fraction', 'Average Molecular Weight', 'Partial Pressure', 'Partial Molar Properties', 'Mixture Enthalpy']
  },
  {
    id: 'K',
    title: 'K. Power Cycles (Advanced Analyzer)',
    subtopics: ['Carnot Cycle Analyzer', 'Rankine Cycle Analyzer', 'Reheat Rankine Cycle', 'Regenerative Rankine Cycle', 'Brayton Cycle', 'Intercooled Brayton', 'Reheated Brayton', 'Regenerative Brayton', 'Otto Cycle', 'Diesel Cycle', 'Dual Cycle']
  },
  {
    id: 'L',
    title: 'L. Refrigeration (Advanced)',
    subtopics: ['Refrigeration COP', 'Heat Pump COP', 'Vapor Compression Cycle Analyzer', 'Refrigeration Capacity', 'Ton of Refrigeration', 'Compressor Performance', 'Throttling Valve']
  },
  {
    id: 'M',
    title: 'M. Combustion Thermodynamics',
    subtopics: ['Stoichiometric Air Requirement', 'Excess Air', 'Air-Fuel Ratio', 'Equivalence Ratio', 'Combustion Product Calculation', 'Heating Value']
  },
  {
    id: 'N',
    title: 'N. Chemical Thermodynamics',
    subtopics: ['Gibbs Free Energy', 'Helmholtz Free Energy', 'Chemical Potential', 'Equilibrium Constant from ΔG°', 'Reaction Gibbs Energy', 'Equilibrium Constant', 'van\'t Hoff Equation', 'Reaction Enthalpy', 'Reaction Entropy']
  },
  {
    id: 'O',
    title: 'O. Phase Equilibrium / VLE',
    subtopics: ['Raoult\'s Law', 'Bubble Point Pressure', 'Dew Point Pressure', 'Bubble Point Temperature', 'Dew Point Temperature', 'Relative Volatility', 'K-value Calculator', 'VLE Flash Calculation']
  }
];

export default function ThermoLearn() {
  const [expanded, setExpanded] = useState<string | null>('A');
  const [expandedSubtopic, setExpandedSubtopic] = useState<string | null>(null);

  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingTopic, setLoadingTopic] = useState<string | null>(null);

  const handleSubtopicClick = async (sub: string) => {
    if (expandedSubtopic === sub) {
      setExpandedSubtopic(null);
      return;
    }
    setExpandedSubtopic(sub);
    
    if (explanations[sub]) return;
    
    setLoadingTopic(sub);
    try {
      const systemPrompt = "You are an expert chemical engineering professor. Write a comprehensive explanation (2-3 paragraphs) of the requested thermodynamics concept. Include its rigorous definition, key mathematical relationship/formula, and a brief industrial application. Use bullet points or clear paragraph breaks.";
      
      const response = await api.aiProxy({
        provider: 'gemini',
        api_key: localStorage.getItem('GEMINI_API_KEY') || '',
        prompt: `Explain the concept: ${sub}`,
        system_prompt: systemPrompt
      });
      
      setExplanations(prev => ({ ...prev, [sub]: response.text || "Failed to generate explanation." }));
    } catch (err) {
      setExplanations(prev => ({ ...prev, [sub]: "Error connecting to AI. Using basic definition:\n\n" + (THERMO_LEARN_DATA[sub] || "") }));
    } finally {
      setLoadingTopic(null);
    }
  };

  return (
    <div className="w-full mx-auto bg-white dark:bg-surface-800 rounded-3xl shadow-sm border border-surface-200 dark:border-surface-700 p-6 animate-in fade-in duration-500">
      <div className="flex items-center space-x-3 mb-8 pb-4 border-b border-surface-200 dark:border-surface-700">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Learn Thermodynamics</h2>
          <p className="text-surface-500 mt-1 font-medium">Master topics from Basic Concepts to Phase Equilibrium.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topics.map((topic) => (
          <div 
            key={topic.id}
            className={`border rounded-xl transition-all duration-200 ${
              expanded === topic.id 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 shadow-sm' 
                : 'border-surface-200 dark:border-surface-700 hover:border-blue-300 dark:hover:border-blue-700/50 bg-white dark:bg-surface-800'
            }`}
          >
            <button
              onClick={() => setExpanded(expanded === topic.id ? null : topic.id)}
              className="w-full flex items-center justify-between p-4 focus:outline-none"
            >
              <h3 className="font-bold text-left text-surface-900 dark:text-white">{topic.title}</h3>
              {expanded === topic.id ? (
                <ChevronDown className="w-5 h-5 text-blue-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-surface-400" />
              )}
            </button>
            
            {expanded === topic.id && (
              <div className="px-4 pb-4 pt-1">
                <div className="h-px w-full bg-surface-200 dark:bg-surface-700 mb-3" />
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {topic.subtopics.map((sub, idx) => (
                    <li key={idx} className="flex flex-col">
                      <button 
                        onClick={() => handleSubtopicClick(sub)}
                        className="flex items-start space-x-2 text-sm text-surface-600 dark:text-surface-400 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span>{sub}</span>
                      </button>
                      {expandedSubtopic === sub && (
                        <div className="mt-2 ml-6 p-4 bg-surface-50 dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 text-sm text-surface-800 dark:text-surface-200 shadow-sm animate-in slide-in-from-top-2 leading-relaxed whitespace-pre-wrap">
                          {loadingTopic === sub ? (
                            <div className="flex items-center space-x-2 text-blue-500">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="font-medium animate-pulse">Generating comprehensive explanation via ChemBase AI...</span>
                            </div>
                          ) : (
                            explanations[sub] || THERMO_LEARN_DATA[sub] || "No explanation available."
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
