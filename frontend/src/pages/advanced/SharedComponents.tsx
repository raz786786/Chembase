import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { 
  Activity,
  Camera,
  AlertCircle,
  CheckCircle2,
  Database,
  Info
} from 'lucide-react';

export function CalcCard({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }> | string; children: React.ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const isDark = document.documentElement.classList.contains('dark');
      const dataUrl = await toPng(cardRef.current, { 
        backgroundColor: isDark ? '#0f172a' : '#ffffff', 
        pixelRatio: 2,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export report', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div 
      ref={cardRef} 
      className="glass-card p-8 rounded-2xl mb-8 relative group"
    >
      <div className="flex justify-between items-start mb-8 relative z-10">
        <h3 className="text-xl font-bold tracking-tight text-surface-900 dark:text-surface-50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-500/20 shadow-sm shadow-primary-500/10">
            {typeof Icon === 'string' ? <span>{Icon}</span> : <Icon className="w-5 h-5" />}
          </div>
          {title}
        </h3>
        <button 
          onClick={handleExport} 
          disabled={exporting}
          className={`btn-tactile flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            exporting 
            ? 'bg-surface-100 dark:bg-surface-50/5 text-surface-400 border-transparent' 
            : 'bg-surface-50 dark:bg-surface-50/5 text-surface-700 dark:text-surface-200 border-surface-200 dark:border-surface-50/10 hover:border-primary-400 dark:hover:border-primary-500/50 shadow-sm'
          }`}
        >
          {exporting ? <Activity className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          {exporting ? 'Generating Report...' : 'Export Results'}
        </button>
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export function InputRow({ label, unit, value, onChange, disabled }: { label: string; unit: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 group">
      <label className="md:w-64 text-xs font-medium tracking-wide text-surface-500 dark:text-surface-400 group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400 transition-colors">{label}</label>
      <div className="flex-grow flex items-center gap-3">
        <div className="relative flex-grow">
          <input
            type="number" 
            step="any" 
            value={value} 
            onChange={e => onChange(e.target.value)} 
            disabled={disabled}
            className={`w-full px-5 py-3 rounded-xl border font-mono text-sm font-medium outline-none transition-all ${
              disabled 
              ? 'bg-surface-50 dark:bg-surface-50/5 text-surface-400 border-transparent dark:border-transparent' 
              : 'bg-surface-50 dark:bg-surface-50/5 text-surface-900 dark:text-surface-50 border-transparent focus:border-primary-500 focus:bg-surface-50 dark:focus:bg-surface-950 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:shadow-[0_0_0_4px_rgba(6,182,212,0.1)]'
            }`}
          />
        </div>
        <div className="w-24 px-4 py-3 bg-surface-100 dark:bg-surface-50/5 rounded-xl text-[11px] font-bold text-surface-500 dark:text-surface-400 uppercase tracking-widest text-center border border-transparent">
          {unit}
        </div>
      </div>
    </div>
  );
}

export function ResultBox({ label, value, unit, color = '#8acbc1' }: { label: string; value: string | number; unit: string; color?: string }) {
  return (
    <div className="relative overflow-hidden p-6 rounded-2xl border border-surface-200 dark:border-surface-50/10 bg-surface-50 dark:bg-surface-900 transition-all hover:border-primary-500/30 group">
      <div className="absolute top-0 right-0 w-32 h-32 blur-[50px] opacity-20 pointer-events-none -mr-16 -mt-16 transition-opacity group-hover:opacity-30" style={{ backgroundColor: color }}></div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight font-mono" style={{ color: color }}>{value}</span>
        <span className="text-xs font-bold text-surface-400 dark:text-surface-500 font-mono">{unit}</span>
      </div>
    </div>
  );
}

export function ValidationInputRow({ 
  label, unit, value, onChange, disabled,
  validationRules = [], placeholder, onAutoFill, allowNegative = false
}: { 
  label: string; 
  unit: string; 
  value: string; 
  onChange: (v: string) => void; 
  disabled?: boolean;
  validationRules?: { rule: (v: number) => boolean; message: string }[];
  placeholder?: string;
  onAutoFill?: () => void;
  allowNegative?: boolean;
}) {
  const numValue = parseFloat(value);
  const error = value !== '' && validationRules.find(r => !r.rule(numValue));
  const [tooltipError, setTooltipError] = useState<string | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!allowNegative && e.key === '-') {
      e.preventDefault();
      setTooltipError('Violates Thermodynamic Law: Absolute scalars cannot be negative.');
      setTimeout(() => setTooltipError(null), 3000);
    }
  };

  return (
    <div className="flex flex-col mb-6 group">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <label className="md:w-64 text-sm font-medium text-surface-500 dark:text-surface-400 group-focus-within:text-primary-600 transition-colors flex items-center justify-between">
          <span>{label}</span>
          {onAutoFill && (
            <button 
              onClick={onAutoFill}
              title="Use from database"
              className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
            >
              <Database className="w-3.5 h-3.5" />
            </button>
          )}
        </label>
        <div className="flex-grow flex items-center gap-3">
          <div className="relative flex-grow">
            <input
              type="number" 
              step="any" 
              value={value} 
              onChange={e => onChange(e.target.value)} 
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={placeholder}
              className={`w-full px-5 py-3 rounded-2xl border bg-surface-50 dark:bg-surface-900/50 text-surface-900 dark:text-surface-50 font-mono font-medium text-sm outline-none transition-all ${
                disabled 
                ? 'bg-surface-50 dark:bg-surface-900/20 text-surface-400 border-surface-100 dark:border-surface-800' 
                : error 
                  ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                  : 'border-surface-200 dark:border-surface-800 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10'
              }`}
            />
            {value !== '' && !error && !disabled && (
              <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-500" />
            )}
            {error && (
              <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
            )}
          </div>
          <div className="w-24 px-4 py-3 bg-surface-100 dark:bg-surface-800 rounded-2xl text-[11px] font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-widest text-center border border-surface-200 dark:border-surface-700 flex items-center justify-center">
            {unit}
          </div>
        </div>
      </div>
      {tooltipError && (
        <div className="mt-2 ml-0 md:ml-[17rem] flex items-center gap-2 text-xs font-bold text-rose-500 animate-in fade-in">
          <AlertCircle className="w-3 h-3" />
          <span className="bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded border border-rose-200 dark:border-rose-800/50">
            {tooltipError}
          </span>
        </div>
      )}
      {error && !tooltipError && (
        <div className="mt-2 ml-0 md:ml-[17rem] flex items-center gap-2 text-xs font-bold text-red-500">
          <AlertCircle className="w-3 h-3" />
          {error.message}
        </div>
      )}
    </div>
  );
}

export function StepByStepDisplay({ 
  showSteps, 
  formula, 
  substitution, 
  result, 
  insight 
}: { 
  showSteps: boolean; 
  formula: string | React.ReactNode; 
  substitution: string | React.ReactNode; 
  result: string | React.ReactNode;
  insight?: string;
}) {
  if (!showSteps) return null;
  return (
    <div className="mt-6 p-6 rounded-[24px] bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-800 animate-in fade-in slide-in-from-top-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-widest text-surface-400 mb-4">Calculation Steps</h4>
      
      <div className="space-y-4 font-mono text-sm">
        <div>
          <span className="text-surface-400 text-xs font-bold">Formula:</span>
          <div className="text-surface-800 dark:text-surface-200 font-bold mt-1 bg-surface-50 dark:bg-surface-800 p-3 rounded-xl border border-surface-100 dark:border-surface-700 overflow-x-auto whitespace-pre-wrap">{formula}</div>
        </div>
        <div>
          <span className="text-surface-400 text-xs font-bold">Substitution:</span>
          <div className="text-surface-800 dark:text-surface-200 font-bold mt-1 bg-surface-50 dark:bg-surface-800 p-3 rounded-xl border border-surface-100 dark:border-surface-700 overflow-x-auto whitespace-pre-wrap">{substitution}</div>
        </div>
        <div>
          <span className="text-surface-400 text-xs font-bold">Result:</span>
          <div className="text-primary-600 dark:text-primary-400 font-bold mt-1 text-base bg-primary-50 dark:bg-primary-900/20 p-3 rounded-xl border border-primary-100 dark:border-primary-800/50 overflow-x-auto whitespace-pre-wrap">{result}</div>
        </div>
      </div>

      {insight && (
        <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-800">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center flex-shrink-0">
              <Info className="w-4 h-4 text-accent-600" />
            </div>
            <div>
              <h5 className="text-[11px] font-semibold uppercase tracking-widest text-accent-600 mb-1">Engineering Insight</h5>
              <p className="text-sm font-medium text-surface-600 dark:text-surface-300">{insight}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
