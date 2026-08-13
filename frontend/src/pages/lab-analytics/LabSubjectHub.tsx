import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, Plus, Beaker, FileText, Settings, PlayCircle, Activity, ChevronRight, TestTubes, Info } from 'lucide-react';
import VivaModal from './VivaModal';
import { api } from '../../api';

export default function LabSubjectHub() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<any | null>(null);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [savedLabs, setSavedLabs] = useState<any[]>([]);
  
  // Format subject title (e.g. fluid-mechanics -> Fluid Mechanics)
  const title = subjectId?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  // Declarations moved up to fix linter error
  const fetchEquipment = async () => {
    try {
      const { data } = await supabase
        .from('chembase_equipment_knowledge')
        .select('*')
        .eq('subject', subjectId)
        .order('name');
      if (data) setEquipmentList(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSavedLabs = async () => {
    try {
      const { data } = await supabase
        .from('lab_analytics_records')
        .select(`
          id, 
          created_at,
          objective,
          chembase_equipment_knowledge(name),
          chembase_experiment_knowledge(name)
        `)
        .eq('subject', subjectId)
        .order('created_at', { ascending: false });
      if (data) setSavedLabs(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEquipment();
    fetchSavedLabs();
  }, [subjectId]);

  const handleSelectEquipment = async (eq: any) => {
    setSelectedEquipment(eq);
    try {
      const { data } = await supabase
        .from('chembase_experiment_knowledge')
        .select('*')
        .eq('equipment_id', eq.id)
        .order('name');
      if (data) setExperiments(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Add Custom Equipment Logic
  const [isAddEquipmentModalOpen, setIsAddEquipmentModalOpen] = useState(false);
  const [newEqName, setNewEqName] = useState('');
  const [newEqDesc, setNewEqDesc] = useState('');
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);

  const handleAddCustomEquipment = async () => {
    if (!newEqName) return;
    setIsGeneratingProfile(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not logged in");

      // Use AI to generate a knowledge profile for the custom equipment
      const prompt = `You are a Chemical Engineering expert. The user has added a custom lab equipment named "${newEqName}" for the subject "${title}". Description provided: "${newEqDesc}".
      Please generate a JSON profile containing:
      {
        "working_principle": "Brief text",
        "operating_principle": "Brief text",
        "main_components": ["component1", "component2"],
        "operating_parameters": ["param1", "param2"],
        "safety_hazards": ["hazard1", "hazard2"]
      }`;

      // In a real production scenario, we'd ensure valid JSON parsing here.
      // For this demo, we'll try to parse, or fallback to empty arrays.
      let provider = 'groq';
      let model = 'llama-3.3-70b-versatile';
      let apiKey = localStorage.getItem('api_keys') ? JSON.parse(localStorage.getItem('api_keys') || '{}')[provider] : '';

      if (!apiKey) {
        provider = 'gemini';
        model = 'gemini-2.5-flash';
        apiKey = localStorage.getItem('api_keys') ? JSON.parse(localStorage.getItem('api_keys') || '{}')[provider] : '';
      }

      if (!apiKey) {
         throw new Error("No API key configured for Groq or Gemini. Please configure your models in Settings.");
      }

      const response = await api.aiProxy({
        provider,
        model,
        api_key: apiKey,
        prompt,
        system_prompt: 'Respond strictly with valid JSON only. No markdown formatting.'
      });

      let profile = {
        working_principle: 'Information pending...',
        operating_principle: '',
        main_components: [],
        operating_parameters: [],
        safety_hazards: []
      };

      try {
        const cleaned = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        profile = JSON.parse(cleaned);
      } catch (e) {
        console.warn("Failed to parse AI profile, using fallbacks");
      }
      
      const { error } = await supabase.from('chembase_equipment_knowledge').insert({
        user_id: user.user.id,
        is_custom: true,
        subject: subjectId,
        category: 'Custom',
        name: newEqName,
        description: newEqDesc,
        working_principle: profile.working_principle,
        operating_principle: profile.operating_principle,
        main_components: profile.main_components,
        operating_parameters: profile.operating_parameters,
        safety_hazards: profile.safety_hazards
      });
      
      if (error) throw error;
      
      setIsAddEquipmentModalOpen(false);
      setNewEqName('');
      setNewEqDesc('');
      fetchEquipment();
    } catch (err: any) {
      alert("Error adding equipment: " + err.message);
    } finally {
      setIsGeneratingProfile(false);
    }
  };

  const [isVivaOpen, setIsVivaOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 mt-6 relative z-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-900 border border-surface-200/50 dark:border-surface-50/10 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (selectedEquipment) {
                setSelectedEquipment(null);
                setExperiments([]);
              } else {
                navigate('/advanced/lab-assistant');
              }
            }} 
            className="p-2 bg-surface-800 hover:bg-surface-700 text-white rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {selectedEquipment ? selectedEquipment.name : title}
            </h1>
            <p className="text-surface-400 text-sm font-medium">
              {selectedEquipment ? 'Select an experiment or create a new lab' : 'Select laboratory equipment'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!selectedEquipment && (
            <button 
              onClick={() => setIsAddEquipmentModalOpen(true)}
              className="btn-tactile flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-sm shadow-[0_0_20px_rgba(138,203,193,0.3)]"
            >
              <Plus className="w-4 h-4" /> Custom Equipment
            </button>
          )}
          <button 
            onClick={() => setIsVivaOpen(true)}
            className="btn-tactile flex items-center gap-2 px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white font-semibold rounded-xl text-sm shadow-[0_0_20px_rgba(219,176,87,0.3)]"
          >
            <PlayCircle className="w-4 h-4" /> Start Viva
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {!selectedEquipment ? (
        // Equipment Selection Grid
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary-500" /> Available Equipment
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipmentList.map(eq => (
              <div 
                key={eq.id} 
                onClick={() => handleSelectEquipment(eq)}
                className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-3xl p-6 shadow-sm hover:border-primary-400 hover:shadow-xl transition-all cursor-pointer group flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Beaker className="w-6 h-6" />
                  </div>
                  {eq.is_custom && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-accent-500 bg-accent-50 dark:bg-accent-900/30 px-2 py-1 rounded-lg">Custom</span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2 group-hover:text-primary-500 transition-colors">{eq.name}</h3>
                <p className="text-sm text-surface-500 line-clamp-3 mb-6 flex-grow">{eq.description || eq.working_principle || 'No description available.'}</p>
                
                <div className="flex items-center justify-between text-xs font-bold text-primary-600 dark:text-primary-400 mt-auto">
                  <span>View Experiments</span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>

          {/* Saved Labs Section (Only show at root subject level) */}
          <div className="mt-12 pt-8 border-t border-surface-200 dark:border-surface-800">
            <h2 className="text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2 mb-6">
              <FileText className="w-6 h-6 text-accent-500" /> Saved Laboratories
            </h2>
            
            {savedLabs.length === 0 ? (
              <p className="text-surface-500 text-sm">No saved labs yet for this subject.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedLabs.map(lab => (
                  <div key={lab.id} className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl p-5 shadow-sm hover:border-accent-400 transition-colors group cursor-pointer">
                    <div className="text-[10px] font-bold text-accent-500 mb-1 uppercase tracking-wider line-clamp-1">
                      {lab.chembase_equipment_knowledge?.name} • {lab.chembase_experiment_knowledge?.name || 'Custom Exp'}
                    </div>
                    <h4 className="font-bold text-surface-900 dark:text-white text-base mb-2 group-hover:text-accent-500 line-clamp-2">{lab.objective}</h4>
                    <p className="text-xs text-surface-400">{new Date(lab.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Equipment Details & Experiments
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-6 border-primary-200 dark:border-primary-900/50">
              <h3 className="text-sm font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Info className="w-4 h-4" /> Equipment Profile
              </h3>
              
              <div className="space-y-4 text-sm text-surface-600 dark:text-surface-300">
                <div>
                  <strong className="block text-surface-900 dark:text-white mb-1">Working Principle</strong>
                  <p>{selectedEquipment.working_principle || 'Not specified'}</p>
                </div>
                {selectedEquipment.main_components?.length > 0 && (
                  <div>
                    <strong className="block text-surface-900 dark:text-white mb-1">Main Components</strong>
                    <ul className="list-disc pl-4 space-y-1">
                      {selectedEquipment.main_components.map((c: string, i: number) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
                {selectedEquipment.safety_hazards?.length > 0 && (
                  <div>
                    <strong className="block text-rose-600 dark:text-rose-400 mb-1">Key Hazards</strong>
                    <ul className="list-disc pl-4 space-y-1 text-rose-700/80 dark:text-rose-300/80">
                      {selectedEquipment.safety_hazards.map((h: string, i: number) => <li key={i}>{h}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
                <TestTubes className="w-6 h-6 text-accent-500" /> Standard Experiments
              </h2>
              <button 
                onClick={() => navigate(`/advanced/lab-assistant/${subjectId}/workspace?eq=${selectedEquipment.id}`)}
                className="btn-tactile text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500"
              >
                + Custom Experiment
              </button>
            </div>

            {experiments.length === 0 ? (
              <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-3xl p-12 text-center shadow-sm">
                <Activity className="w-8 h-8 text-surface-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">No built-in experiments</h3>
                <p className="text-surface-500 text-sm max-w-md mx-auto mb-6">
                  You can still create a lab using this equipment by defining your own objective.
                </p>
                <button 
                  onClick={() => navigate(`/advanced/lab-assistant/${subjectId}/workspace?eq=${selectedEquipment.id}`)}
                  className="btn-tactile inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl text-sm"
                >
                  Create Custom Lab
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {experiments.map(exp => (
                  <div key={exp.id} className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl p-6 shadow-sm hover:border-primary-400 transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-surface-900 dark:text-white text-lg mb-1 group-hover:text-primary-500 transition-colors">{exp.name}</h4>
                      <p className="text-sm text-surface-500 line-clamp-2">{exp.typical_objective}</p>
                    </div>
                    <button 
                      onClick={() => navigate(`/advanced/lab-assistant/${subjectId}/workspace?eq=${selectedEquipment.id}&exp=${exp.id}`)}
                      className="btn-tactile whitespace-nowrap px-4 py-2 bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-white font-semibold rounded-xl text-sm group-hover:bg-primary-600 group-hover:text-white transition-colors"
                    >
                      Start Lab
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      )}

      {/* Viva Modal */}
      {isVivaOpen && (
        <VivaModal subject={subjectId || ''} equipment={selectedEquipment} onClose={() => setIsVivaOpen(false)} />
      )}

      {/* Add Custom Equipment Modal */}
      {isAddEquipmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-surface-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-surface-200 dark:border-surface-800">
            <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-4">Add Custom Equipment</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider block mb-1">Equipment Name</label>
                <input 
                  type="text" 
                  value={newEqName}
                  onChange={e => setNewEqName(e.target.value)}
                  placeholder="e.g. Orifice Meter"
                  className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider block mb-1">Description</label>
                <textarea 
                  value={newEqDesc}
                  onChange={e => setNewEqDesc(e.target.value)}
                  placeholder="Brief description of the equipment setup..."
                  className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-primary-500 resize-none h-24"
                />
              </div>
            </div>
            
            {isGeneratingProfile && (
              <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse">
                <Activity className="w-4 h-4" /> AI is generating knowledge profile...
              </div>
            )}
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setIsAddEquipmentModalOpen(false)}
                disabled={isGeneratingProfile}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddCustomEquipment}
                disabled={!newEqName || isGeneratingProfile}
                className="btn-tactile flex-1 py-2.5 rounded-xl font-bold text-sm bg-primary-600 text-white disabled:bg-surface-300 dark:disabled:bg-surface-700 disabled:cursor-not-allowed transition-colors"
              >
                {isGeneratingProfile ? 'Saving...' : 'Add Equipment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
