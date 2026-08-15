import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Factory, Search, Wheat, Fuel, Pill, Droplets, Zap, ChevronRight, Activity } from 'lucide-react';
import { CORE_INDUSTRIES } from './data/coreIndustries';
import IndustryDashboard from './components/IndustryDashboard';

const iconMap: Record<string, any> = {
  Factory, Wheat, Fuel, Pill, Droplets, Zap, Activity
};

export default function IndustryModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredIndustries = CORE_INDUSTRIES.filter(ind => 
    ind.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ind.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Routes>
      <Route path="/" element={
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10 max-w-7xl mx-auto pb-20">
          
          {/* Header */}
          <div className="flex flex-col items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-100 dark:border-primary-800 shadow-sm">
                <Factory className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-surface-900 dark:text-white tracking-tight">Industrial Chemical Engineering</h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">Explore real industrial processes, equipment, operating parameters, and troubleshooting.</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input 
              type="text" 
              placeholder="Search industries, plants, processes, equipment, problems..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-surface-900 border-2 border-surface-200 dark:border-surface-800 rounded-2xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm"
            />
          </div>

          {/* Industries Grid */}
          <div>
            <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-6">Explore Industries</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIndustries.map(industry => {
                const Icon = iconMap[industry.icon] || Factory;
                return (
                  <div key={industry.id} className="bg-white dark:bg-surface-900 rounded-3xl p-6 border border-surface-200 dark:border-surface-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-surface-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{industry.name}</h3>
                    </div>
                    
                    <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-3 mb-6 flex-grow leading-relaxed">
                      {industry.description}
                    </p>

                    <div className="space-y-4 mb-6">
                      <div>
                        <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider block mb-1.5">Major Products</span>
                        <div className="flex flex-wrap gap-1.5">
                          {industry.products.slice(0, 3).map(p => (
                            <span key={p.name} className="px-2 py-1 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 text-xs rounded-md font-medium border border-surface-200 dark:border-surface-700">
                              {p.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider block mb-1.5">Key Subjects</span>
                        <div className="flex flex-wrap gap-1.5">
                          {industry.relatedSubjects.slice(0, 3).map(s => (
                            <span key={s.subjectId} className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/10 px-2 py-1 rounded-md">
                              {s.subjectId.replace('-', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => navigate(industry.id)}
                      className="w-full py-3 bg-surface-100 dark:bg-surface-800 hover:bg-primary-600 hover:text-white text-surface-900 dark:text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-surface-200 dark:border-surface-700 hover:border-primary-500"
                    >
                      Explore Industry <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      } />
      
      {/* Nested Route for specific industry details */}
      <Route path=":industryId/*" element={<IndustryDashboard />} />
    </Routes>
  );
}
