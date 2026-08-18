import { useState } from 'react';
import { Routes, Route, useNavigate, NavLink, Navigate } from 'react-router-dom';
import { 
  Factory, Search, Wheat, Fuel, Pill, Droplets, Zap, ChevronRight, Activity, 
  Globe, GitBranch, Box, ThermometerSun, Sliders, Calculator, 
  ShieldAlert, Leaf, Settings, BrainCircuit, GraduationCap, Bot, Briefcase, 
  Users, FileText, Star
} from 'lucide-react';
import { CORE_INDUSTRIES } from './data/coreIndustries';
import IndustryDashboard from './components/IndustryDashboard';

const iconMap: Record<string, any> = {
  Factory, Wheat, Fuel, Pill, Droplets, Zap, Activity, Box, FileText
};

export default function IndustryModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  const filteredIndustries = CORE_INDUSTRIES.filter(ind => 
    ind.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ind.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navItems = [
    { id: 'search', label: 'Search', icon: Search, path: '' },
    { id: 'explore', label: 'Explore Industries', icon: Globe, path: 'explore' },
    { id: 'industries', label: 'Industries', icon: Factory, path: 'list' },
    { id: 'process-explorer', label: 'Process Explorer', icon: GitBranch, path: 'process-explorer' },
    { id: 'equipment', label: 'Equipment Library', icon: Box, path: 'equipment' },
    { id: 'parameters', label: 'Operating Parameters', icon: ThermometerSun, path: 'parameters' },
    { id: 'control', label: 'Process Control', icon: Sliders, path: 'control' },
    { id: 'mass-energy', label: 'Mass & Energy Analysis', icon: Calculator, path: 'mass-energy' },
    { id: 'safety', label: 'Safety', icon: ShieldAlert, path: 'safety' },
    { id: 'environment', label: 'Environment', icon: Leaf, path: 'environment' },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: Settings, path: 'troubleshooting' },
    { id: 'challenges', label: 'Engineering Challenges', icon: BrainCircuit, path: 'challenges' },
    { id: 'internship', label: 'Internship Mode', icon: GraduationCap, path: 'internship' },
    { id: 'tutor', label: 'Industry AI Tutor', icon: Bot, path: 'tutor' },
    { id: 'interview', label: 'Industry Interview', icon: Briefcase, path: 'interview' },
    { id: 'careers', label: 'Chemical Engineering Careers', icon: Users, path: 'careers' },
    { id: 'documents', label: 'Industrial Documents', icon: FileText, path: 'documents' },
    { id: 'my-industry', label: 'My Industry', icon: Star, path: 'my-industry' },
  ];

  return (
    <div className="flex h-[calc(100vh-64px)] animate-in fade-in duration-500">
      
      {/* Rule 40 Sidebar Navigation */}
      <div className="w-64 bg-surface-50 dark:bg-surface-950 border-r border-surface-200 dark:border-surface-800 flex flex-col h-full overflow-y-auto hide-scrollbar shrink-0">
        <div className="p-4 border-b border-surface-200 dark:border-surface-800">
          <h2 className="text-sm font-black text-surface-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
            <Factory className="w-4 h-4 text-primary-500"/> INDUSTRY
          </h2>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {navItems.map(item => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === ''}
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive 
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-900 hover:text-surface-900 dark:hover:text-white'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8 relative">
        <Routes>
          <Route path="/" element={
            <div className="max-w-5xl mx-auto space-y-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center">
                  <Factory className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-surface-900 dark:text-white tracking-tight">Industrial Knowledge</h1>
                  <p className="text-surface-500 mt-1">Search or explore the complete industrial engineering database.</p>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-surface-400" />
                <input 
                  type="text" 
                  placeholder="Search industries, plants, processes, equipment, problems..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-4 py-5 bg-white dark:bg-surface-900 border-2 border-surface-200 dark:border-surface-800 rounded-2xl text-lg shadow-sm focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
                />
              </div>

              {searchTerm && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredIndustries.map(industry => {
                    const Icon = iconMap[industry.icon] || Factory;
                    return (
                      <div key={industry.id} onClick={() => navigate(industry.id)} className="bg-white p-6 rounded-3xl border border-surface-200 shadow-sm cursor-pointer hover:border-primary-500 hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-surface-100 text-surface-600 rounded-xl flex items-center justify-center"><Icon className="w-5 h-5"/></div>
                          <h3 className="font-bold text-lg">{industry.name}</h3>
                        </div>
                        <p className="text-sm text-surface-500 line-clamp-2">{industry.description}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          } />

          <Route path="explore" element={
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-black mb-8">Explore Industries</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {CORE_INDUSTRIES.map(industry => {
                  const Icon = iconMap[industry.icon] || Factory;
                  return (
                    <div key={industry.id} onClick={() => navigate(`../${industry.id}`)} className="bg-white dark:bg-surface-900 rounded-3xl p-6 border border-surface-200 dark:border-surface-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full cursor-pointer">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                          <Icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold group-hover:text-primary-600">{industry.name}</h3>
                      </div>
                      <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-3 mb-6 flex-grow leading-relaxed">
                        {industry.description}
                      </p>
                      <button className="w-full py-3 bg-surface-100 dark:bg-surface-800 hover:bg-primary-600 hover:text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-surface-200 hover:border-primary-500">
                        Explore Industry <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          } />
          
          <Route path="list" element={<Navigate to="../explore" replace />} />

          {/* Placeholder for global views */}
          <Route path="equipment" element={<div className="max-w-5xl mx-auto"><h1 className="text-3xl font-black mb-4">Central Equipment Database</h1><p className="text-surface-500">Global registry of all equipment across all industries.</p></div>} />
          <Route path="troubleshooting" element={<div className="max-w-5xl mx-auto"><h1 className="text-3xl font-black mb-4">Global Troubleshooter</h1><p className="text-surface-500">Search symptoms across all industrial processes.</p></div>} />
          <Route path="tutor" element={<div className="max-w-5xl mx-auto"><h1 className="text-3xl font-black mb-4">Global Industry AI Tutor</h1><p className="text-surface-500">Ask any industrial chemical engineering question.</p></div>} />
          
          {/* Detailed specific Industry routing */}
          <Route path=":industryId/*" element={<IndustryDashboard />} />
        </Routes>
      </div>
    </div>
  );
}
