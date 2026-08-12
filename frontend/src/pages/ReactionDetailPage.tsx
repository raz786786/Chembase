import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShieldAlert, 
  Info,
  ChevronRight,
  Flame,
  Snowflake,
  CheckCircle2,
  AlertTriangle,
  Beaker,
  ArrowRightLeft,
  TrendingUp,
  Package
} from 'lucide-react';
import { api, type Reaction } from '../api';
import { FormulaDisplay } from '../components/FormulaDisplay';

function getTierColor(tier?: number): string {
  if (tier === 1) return 'text-rose-500 border-rose-500';
  if (tier === 2) return 'text-accent-500 border-accent-500';
  if (tier === 3) return 'text-accent-500 border-accent-500';
  return 'text-surface-400 border-surface-400';
}

function getTierLabel(tier?: number): string {
  if (tier === 1) return 'Tier 1 - High Industrial Value';
  if (tier === 2) return 'Tier 2 - Medium Industrial Value';
  if (tier === 3) return 'Tier 3 - Low Industrial Value';
  if (tier === 4) return 'Tier 4 - No Industrial Value';
  return 'Unclassified';
}

export default function ReactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.getReaction(id).then((r) => { 
      setReaction(r); 
      setLoading(false); 
    }).catch(console.error);
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-40">
      <div className="w-16 h-16 border-4 border-primary-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  if (!reaction) return (
    <div className="flex flex-col items-center justify-center py-20 glass rounded-3xl border border-rose-200 dark:border-rose-900/30">
      <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
      <p className="text-surface-500 font-medium mb-6">Reaction not found.</p>
      <Link to="/reactions" className="px-6 py-3 bg-primary-600 text-surface-50 rounded-2xl font-bold hover:bg-primary-700 transition-colors no-underline">
        Return to Reactions
      </Link>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-700">
      <Link to="/reactions" className="inline-flex items-center gap-2 text-sm font-bold text-surface-500 hover:text-primary-600 transition-colors mb-8 no-underline">
        <ArrowLeft className="w-4 h-4" /> Back to Reactions
      </Link>

      {/* Main Header Card */}
      <div className="glass p-8 md:p-12 rounded-[40px] border border-surface-200 dark:border-surface-800 mb-12 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-[100px] -mr-32 -mt-32"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
          <div>
            <div className="flex items-center gap-4 mb-4">
              {reaction.reaction_type && (
                <span className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {reaction.reaction_type}
                </span>
              )}
              {reaction.is_reversible && (
                <span className="flex items-center gap-1 text-[10px] font-black text-violet-500 uppercase">
                  <ArrowRightLeft className="w-3 h-3" /> Reversible
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-surface-900 dark:text-surface-50 mb-2">
              {reaction.name}
            </h1>
          </div>

          {reaction.industrial_value_tier && (
            <div className={`px-4 py-2 rounded-xl border bg-surface-50/50 dark:bg-surface-900/50 text-[10px] font-black uppercase tracking-widest ${getTierColor(reaction.industrial_value_tier)}`}>
              {getTierLabel(reaction.industrial_value_tier)}
            </div>
          )}
        </div>

        <div className="bg-surface-50/50 dark:bg-surface-950/50 p-8 md:p-12 rounded-[32px] border border-surface-100 dark:border-surface-800 text-center mb-8">
          <div className="text-3xl md:text-5xl font-black text-surface-900 dark:text-surface-50 mb-6 tracking-tight">
            <FormulaDisplay formula={reaction.equation} />
          </div>
          <div className="flex justify-center gap-4">
            {reaction.verification_status && (
              <span className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 ${
                reaction.verification_status === 'verified' 
                ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-600' 
                : 'bg-accent-100 dark:bg-accent-900/30 text-accent-600'
              }`}>
                {reaction.verification_status === 'verified' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {reaction.verification_status === 'verified' ? 'Database Verified' : reaction.verification_status}
              </span>
            )}
          </div>
        </div>

        {reaction.safety_notes && (
          <div className="p-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-3xl flex gap-4">
            <ShieldAlert className="w-6 h-6 text-rose-500 flex-shrink-0" />
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-1">Safety Protocol</h4>
              <p className="text-sm font-medium text-surface-600 dark:text-surface-400 leading-relaxed">{reaction.safety_notes}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-8">
          {reaction.description && (
            <div className="glass p-8 rounded-3xl border border-surface-200 dark:border-surface-800">
              <h3 className="text-xl font-bold text-surface-900 dark:text-surface-50 mb-6 flex items-center gap-3">
                <Info className="w-6 h-6 text-primary-600" /> Reaction Details
              </h3>
              <p className="text-surface-600 dark:text-surface-400 leading-relaxed">{reaction.description}</p>
            </div>
          )}

          <div className="glass p-8 rounded-3xl border border-surface-200 dark:border-surface-800">
            <h3 className="text-xl font-bold text-surface-900 dark:text-surface-50 mb-8 flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-accent-600" /> Thermodynamic Data
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
              <div className="flex justify-between py-3 border-b border-surface-100 dark:border-surface-800/50">
                <span className="text-sm font-medium text-surface-500 flex items-center gap-2">Enthalpy Change (ΔH)</span>
                <span className={`text-sm font-black ${reaction.enthalpy_change && reaction.enthalpy_change < 0 ? 'text-accent-500' : 'text-rose-500'}`}>
                  {reaction.enthalpy_change != null ? `${reaction.enthalpy_change} kJ/mol` : '—'}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-surface-100 dark:border-surface-800/50">
                <span className="text-sm font-medium text-surface-500">Reaction Type</span>
                <span className="text-sm font-bold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                  {reaction.enthalpy_change != null ? (
                    reaction.enthalpy_change < 0 ? <><Flame className="w-4 h-4 text-rose-500" /> Exothermic</> : <><Snowflake className="w-4 h-4 text-primary-500" /> Endothermic</>
                  ) : '—'}
                </span>
              </div>
              {reaction.conditions && (
                <div className="md:col-span-2 flex justify-between py-3 border-b border-surface-100 dark:border-surface-800/50">
                  <span className="text-sm font-medium text-surface-500">Operational Conditions</span>
                  <span className="text-sm font-bold text-surface-900 dark:text-surface-50">{reaction.conditions}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Substances */}
        <div className="space-y-8">
          <div className="glass p-8 rounded-3xl border border-surface-200 dark:border-surface-800">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 mb-6 flex items-center gap-3">
              <Beaker className="w-5 h-5 text-primary-500" /> Reactants
            </h3>
            <div className="space-y-4">
              {reaction.reactants.map(s => (
                <Link 
                  to={`/substances/${s.id}`} 
                  key={s.id}
                  className="flex items-center justify-between p-4 bg-surface-50/50 dark:bg-surface-900/50 rounded-2xl border border-surface-100 dark:border-surface-800 hover:border-primary-400 transition-all no-underline group"
                >
                  <div>
                    <p className="text-xs font-bold text-surface-400 mb-1 group-hover:text-primary-400 transition-colors">{s.name}</p>
                    <p className="text-sm font-black text-surface-900 dark:text-surface-50"><FormulaDisplay formula={s.formula} /></p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-surface-300 group-hover:text-primary-600 transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          <div className="glass p-8 rounded-3xl border border-surface-200 dark:border-surface-800">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 mb-6 flex items-center gap-3">
              <Package className="w-5 h-5 text-accent-500" /> Products
            </h3>
            <div className="space-y-4">
              {reaction.products.length > 0 ? reaction.products.map(s => (
                <Link 
                  to={`/substances/${s.id}`} 
                  key={s.id}
                  className="flex items-center justify-between p-4 bg-surface-50/50 dark:bg-surface-900/50 rounded-2xl border border-surface-100 dark:border-surface-800 hover:border-primary-400 transition-all no-underline group"
                >
                  <div>
                    <p className="text-xs font-bold text-surface-400 mb-1 group-hover:text-primary-400 transition-colors">{s.name}</p>
                    <p className="text-sm font-black text-surface-900 dark:text-surface-50"><FormulaDisplay formula={s.formula} /></p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-surface-300 group-hover:text-primary-600 transition-colors" />
                </Link>
              )) : (
                <p className="text-xs font-medium text-surface-400 text-center py-4 italic">Products not in local database</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
