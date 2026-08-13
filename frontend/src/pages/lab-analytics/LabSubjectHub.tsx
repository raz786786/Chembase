import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, Plus, Beaker, FileText, Settings, PlayCircle, Activity } from 'lucide-react';
import VivaModal from './VivaModal';

export default function LabSubjectHub() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  
  const [equipment, setEquipment] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);

  // Format subject title (e.g. fluid-mechanics -> Fluid Mechanics)
  const title = subjectId?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  useEffect(() => {
    fetchData();
  }, [subjectId]);

  const fetchData = async () => {

    try {
      // These will fail gracefully if the table doesn't exist yet
      const { data: eqData } = await supabase
        .from('lab_analytics_equipment')
        .select('*')
        .eq('subject', subjectId);
        
      if (eqData) setEquipment(eqData);

      const { data: labData } = await supabase
        .from('lab_analytics_records')
        .select('id, experiment_name, equipment_name, created_at')
        .eq('subject', subjectId)
        .order('created_at', { ascending: false });
        
      if (labData) setLabs(labData);
    } catch (err) {
      console.error(err);
    } finally {

    }
  };

  const [isAddEquipmentModalOpen, setIsAddEquipmentModalOpen] = useState(false);
  const [newEqName, setNewEqName] = useState('');
  const [newEqDesc, setNewEqDesc] = useState('');

  const handleAddEquipment = async () => {
    if (!newEqName) return;
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;
      
      const { error } = await supabase.from('lab_analytics_equipment').insert({
        user_id: user.user.id,
        subject: subjectId,
        name: newEqName,
        description: newEqDesc
      });
      
      if (!error) {
        setIsAddEquipmentModalOpen(false);
        setNewEqName('');
        setNewEqDesc('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [isVivaOpen, setIsVivaOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 mt-6 relative z-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-900 border border-surface-200/50 dark:border-surface-50/10 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/advanced/lab-assistant')} className="p-2 bg-surface-800 hover:bg-surface-700 text-white rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{title}</h1>
            <p className="text-surface-400 text-sm font-medium">Manage equipment and experiments</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsAddEquipmentModalOpen(true)}
            className="btn-tactile flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-sm shadow-[0_0_20px_rgba(138,203,193,0.3)]"
          >
            <Plus className="w-4 h-4" /> Add Equipment
          </button>
          <button 
            onClick={() => setIsVivaOpen(true)}
            className="btn-tactile flex items-center gap-2 px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white font-semibold rounded-xl text-sm shadow-[0_0_20px_rgba(219,176,87,0.3)]"
          >
            <PlayCircle className="w-4 h-4" /> Viva Mode
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Equipment Sidebar */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-500" /> Laboratory Equipment
          </h2>
          {equipment.length === 0 ? (
            <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl p-6 text-center shadow-sm">
              <Beaker className="w-8 h-8 text-surface-300 mx-auto mb-2" />
              <p className="text-surface-500 text-sm font-medium">No equipment found.</p>
              <p className="text-surface-400 text-xs mt-1">Add your university's specific equipment to start generating labs.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {equipment.map(eq => (
                <div key={eq.id} className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-4 shadow-sm hover:border-primary-400 transition-colors">
                  <h4 className="font-semibold text-surface-900 dark:text-white">{eq.name}</h4>
                  {eq.description && <p className="text-xs text-surface-500 mt-1 line-clamp-2">{eq.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Labs Workspace */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent-500" /> Saved Laboratories
            </h2>
            <button 
              onClick={() => navigate(`/advanced/lab-assistant/${subjectId}/workspace`)}
              className="btn-tactile text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500"
            >
              + Create New Lab
            </button>
          </div>
          
          {labs.length === 0 ? (
            <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-3xl p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-surface-100 dark:bg-surface-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-surface-400" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">No experiments yet</h3>
              <p className="text-surface-500 text-sm max-w-md mx-auto mb-6">
                Create a new lab. Our AI will help you generate the theory, procedures, and calculations based entirely on your actual experimental objective.
              </p>
              <button 
                onClick={() => navigate(`/advanced/lab-assistant/${subjectId}/workspace`)}
                className="btn-tactile inline-flex items-center gap-2 px-6 py-3 bg-surface-900 dark:bg-white text-white dark:text-surface-900 font-bold rounded-xl text-sm"
              >
                Create First Lab
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {labs.map(lab => (
                <div key={lab.id} className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl p-5 shadow-sm hover:border-primary-400 transition-colors group cursor-pointer">
                  <div className="text-xs font-semibold text-primary-500 mb-2 uppercase tracking-wider">{lab.equipment_name}</div>
                  <h4 className="font-bold text-surface-900 dark:text-white text-lg mb-1 group-hover:text-primary-500">{lab.experiment_name}</h4>
                  <p className="text-xs text-surface-400">{new Date(lab.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>

      {isVivaOpen && (
        <VivaModal subject={subjectId || ''} onClose={() => setIsVivaOpen(false)} />
      )}

      {isAddEquipmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-surface-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-surface-200 dark:border-surface-800">
            <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-4">Add Laboratory Equipment</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider block mb-1">Equipment Name</label>
                <input 
                  type="text" 
                  value={newEqName}
                  onChange={e => setNewEqName(e.target.value)}
                  placeholder="e.g. Venturi Meter"
                  className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider block mb-1">Description (Optional)</label>
                <textarea 
                  value={newEqDesc}
                  onChange={e => setNewEqDesc(e.target.value)}
                  placeholder="Brief description of the equipment setup..."
                  className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-primary-500 resize-none h-24"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setIsAddEquipmentModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddEquipment}
                disabled={!newEqName}
                className="btn-tactile flex-1 py-2.5 rounded-xl font-bold text-sm bg-primary-600 text-white disabled:bg-surface-300 dark:disabled:bg-surface-700 disabled:cursor-not-allowed transition-colors"
              >
                Save Equipment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
