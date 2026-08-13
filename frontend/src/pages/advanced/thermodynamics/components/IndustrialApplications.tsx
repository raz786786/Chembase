import { Factory, Settings } from 'lucide-react';

const applications = [
  { name: 'Boilers', equipment: 'Steam Generator', principle: 'Isobaric heat addition, phase change from liquid to vapor', purpose: 'Produces high-pressure steam for power or heating' },
  { name: 'Steam Turbines', equipment: 'Turbine', principle: 'Isentropic expansion of steam converting enthalpy into shaft work', purpose: 'Drives electrical generators in power plants' },
  { name: 'Gas Turbines', equipment: 'Compressor, Combustor, Turbine', principle: 'Brayton cycle (compression, combustion, expansion)', purpose: 'Aviation propulsion and peak-load power generation' },
  { name: 'Refrigeration & HVAC', equipment: 'Compressor, Condenser, Expansion Valve, Evaporator', principle: 'Vapor-compression cycle transferring heat against temperature gradient', purpose: 'Climate control and food preservation' },
  { name: 'Compressors', equipment: 'Gas Compressor', principle: 'Polytropic/Isentropic compression increasing gas pressure', purpose: 'Pneumatic systems, gas transport, and process plants' },
  { name: 'Pumps', equipment: 'Centrifugal/Positive Displacement Pump', principle: 'Increases liquid pressure with minimal specific volume change', purpose: 'Fluid transport across chemical plants' },
  { name: 'LNG Facilities', equipment: 'Cryogenic Heat Exchangers', principle: 'Refrigeration cycles at cryogenic temperatures', purpose: 'Liquefaction of natural gas for volume reduction and transport' },
  { name: 'Chemical Reactors', equipment: 'Jacketed Reactors', principle: 'Reaction enthalpy management (exothermic/endothermic)', purpose: 'Safe and optimal production of chemical products' }
];

export default function IndustrialApplications() {
  return (
    <div className="w-full mx-auto bg-white dark:bg-surface-800 rounded-3xl shadow-sm border border-surface-200 dark:border-surface-700 p-6 animate-in fade-in duration-500">
      <div className="flex items-center space-x-3 mb-8 pb-4 border-b border-surface-200 dark:border-surface-700">
        <div className="p-3 bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400 rounded-lg">
          <Factory className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Industrial Applications</h2>
          <p className="text-surface-500 mt-1 font-medium">Where Thermodynamics meets Chemical Engineering practice.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {applications.map((app, idx) => (
          <div key={idx} className="p-5 border border-surface-200 dark:border-surface-700 rounded-2xl bg-surface-50 dark:bg-surface-900 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-surface-900 dark:text-white">{app.name}</h3>
              <Settings className="w-5 h-5 text-slate-400" />
            </div>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-1">Equipment</span>
                <span className="text-surface-800 dark:text-surface-200 font-medium">{app.equipment}</span>
              </div>
              
              <div>
                <span className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-1">Thermodynamic Principle</span>
                <span className="text-surface-800 dark:text-surface-200 font-medium">{app.principle}</span>
              </div>
              
              <div className="pt-3 mt-3 border-t border-surface-200 dark:border-surface-700">
                <span className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Industrial Purpose</span>
                <span className="text-surface-700 dark:text-surface-300 font-bold">{app.purpose}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
