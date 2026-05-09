import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { 
  Download, 
  ChevronRight, 
  FlaskConical, 
  Activity,
  Maximize2,
  FileDown,
  Camera
} from 'lucide-react';

export function CalcCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
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
      className="glass p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 mb-8 shadow-sm hover:shadow-xl transition-all relative group"
    >
      <div className="flex justify-between items-start mb-8">
        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
            {typeof Icon === 'string' ? <span>{Icon}</span> : <Icon className="w-5 h-5" />}
          </div>
          {title}
        </h3>
        <button 
          onClick={handleExport} 
          disabled={exporting}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            exporting 
            ? 'bg-slate-100 text-slate-400 border-slate-200' 
            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm'
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
      <label className="md:w-64 text-sm font-bold text-slate-500 dark:text-slate-400 group-focus-within:text-indigo-600 transition-colors">{label}</label>
      <div className="flex-grow flex items-center gap-3">
        <div className="relative flex-grow">
          <input
            type="number" 
            step="any" 
            value={value} 
            onChange={e => onChange(e.target.value)} 
            disabled={disabled}
            className={`w-full px-5 py-3 rounded-2xl border bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold text-sm outline-none transition-all ${
              disabled 
              ? 'bg-slate-50 dark:bg-slate-900/20 text-slate-400 border-slate-100 dark:border-slate-800' 
              : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
            }`}
          />
        </div>
        <div className="w-24 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center border border-slate-200/50 dark:border-slate-700/50">
          {unit}
        </div>
      </div>
    </div>
  );
}

export function ResultBox({ label, value, unit, color = '#6366f1' }: { label: string; value: string | number; unit: string; color?: string }) {
  return (
    <div className="relative overflow-hidden p-6 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 transition-all hover:scale-[1.02]">
      <div className="absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-10 pointer-events-none -mr-12 -mt-12" style={{ backgroundColor: color }}></div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black tracking-tight" style={{ color: color }}>{value}</span>
        <span className="text-xs font-bold text-slate-500">{unit}</span>
      </div>
    </div>
  );
}
