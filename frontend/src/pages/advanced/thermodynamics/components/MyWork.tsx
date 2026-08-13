import { Folder, Clock, Calculator, Star } from 'lucide-react';

export default function MyWork() {
  const savedItems = [
    { id: 1, type: 'calculation', title: 'Rankine Cycle Analysis - Group Project', date: '2 hours ago', icon: Calculator },
    { id: 2, type: 'diagram', title: 'T-s Diagram: R134a Compressor', date: 'Yesterday', icon: Star },
    { id: 3, type: 'practice', title: 'Advanced Thermodynamics Quiz', date: '3 days ago', icon: Clock },
    { id: 4, type: 'viva', title: 'Viva Transcript: Second Law', date: 'Last week', icon: Folder },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-surface-800 rounded-3xl p-6 border border-surface-200 dark:border-surface-700 shadow-sm">
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
          <Folder className="w-7 h-7 text-indigo-500" /> My Work
        </h2>
        <p className="text-surface-500 mt-1">Access your saved calculations, diagrams, and practice histories.</p>
      </div>

      <div className="bg-white dark:bg-surface-800 rounded-3xl p-6 border border-surface-200 dark:border-surface-700 shadow-sm">
        <div className="space-y-3">
          {savedItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-900 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors cursor-pointer border border-transparent hover:border-surface-200 dark:hover:border-surface-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white dark:bg-surface-800 rounded-lg shadow-sm border border-surface-200 dark:border-surface-700">
                  <item.icon className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h4 className="font-bold text-surface-900 dark:text-white">{item.title}</h4>
                  <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">{item.type} • {item.date}</p>
                </div>
              </div>
              <button className="px-4 py-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">
                Open
              </button>
            </div>
          ))}
          {savedItems.length === 0 && (
            <div className="text-center py-12 text-surface-500 font-medium">
              You haven't saved any work yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
