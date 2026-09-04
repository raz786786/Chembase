'use client';

import React from 'react';
import { Book, Shield } from 'lucide-react';

interface DualUseToggleProps {
  mode: 'academic' | 'tactical';
  setMode: (m: 'academic' | 'tactical') => void;
}

export default function DualUseToggle({ mode, setMode }: DualUseToggleProps) {
  return (
    <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800 w-fit">
      <button
        onClick={() => setMode('academic')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
          mode === 'academic' 
            ? 'bg-blue-500 text-white shadow-md' 
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Book className="w-4 h-4" />
        Academic
      </button>
      <button
        onClick={() => setMode('tactical')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
          mode === 'tactical' 
            ? 'bg-red-600 text-white shadow-md' 
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Shield className="w-4 h-4" />
        Tactical
      </button>
    </div>
  );
}
