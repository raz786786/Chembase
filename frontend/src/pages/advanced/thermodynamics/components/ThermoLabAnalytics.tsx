import React from 'react';
import { FlaskConical, ExternalLink, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ThermoLabAnalytics() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-surface-800 rounded-3xl p-6 border border-surface-200 dark:border-surface-700 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
            <FlaskConical className="w-7 h-7 text-emerald-500" /> Lab Analytics Integration
          </h2>
          <p className="text-surface-500 mt-1">Connect your thermodynamic calculations with real-world laboratory data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl p-8 border border-emerald-100 dark:border-emerald-900/30 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-white dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center shadow-sm mb-6 text-emerald-600 dark:text-emerald-400">
            <Activity className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mb-3">Thermodynamics Experiments</h3>
          <p className="text-emerald-700/80 dark:text-emerald-300/80 font-medium mb-8">
            Access specific lab experiments like Bomb Calorimetry, Vapor Pressure measurement, and Heat Exchanger analysis directly in the Lab Analytics module.
          </p>
          <button 
            onClick={() => navigate('/lab-analytics')}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors w-full justify-center shadow-sm"
          >
            Open Lab Analytics <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white dark:bg-surface-800 rounded-3xl p-8 border border-surface-200 dark:border-surface-700 shadow-sm flex flex-col">
          <h3 className="font-bold text-surface-900 dark:text-white mb-4">Recent Lab Data</h3>
          <div className="flex-grow flex flex-col justify-center items-center text-center">
            <div className="p-4 bg-surface-50 dark:bg-surface-900 rounded-full mb-4">
              <FlaskConical className="w-8 h-8 text-surface-300 dark:text-surface-600" />
            </div>
            <p className="text-surface-500 font-medium max-w-xs">
              You don't have any recent experimental data logged for Thermodynamics. Head over to the Lab Analytics dashboard to record your first experiment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
