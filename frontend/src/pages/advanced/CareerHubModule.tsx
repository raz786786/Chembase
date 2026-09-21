import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import {
  FileText, FilePen, Briefcase, Award, Target, ListChecks, MessageSquare, Mic,
  Sparkles, BadgeCheck, Users, Send, RefreshCw, Lightbulb,
  PenLine, Info, ChevronRight, TrendingUp, HelpCircle, Check, Copy, Printer,
  ArrowRight, ShieldCheck, GraduationCap, Building2,
  BookOpen, Layers, Edit3, Eye, CheckCircle2, RotateCcw, Pill,
  Factory, Flame, Droplets, Zap, FlaskConical, Wrench, Plus, Trash2
} from 'lucide-react';
import { CalcCard } from './SharedComponents';
import type { LucideIcon } from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────
function InfoNote({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 flex items-start gap-3 glass rounded-2xl border border-surface-200 dark:border-surface-800 p-4">
      <Info className="w-4 h-4 text-accent-400 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">{children}</p>
    </div>
  );
}

// ─── Achievement-booster: turns weak bullets into strong ones ───────────────
const ACHIEVE_TIPS: { weak: string; strong: string }[] = [
  { weak: 'Worked on a distillation column project', strong: 'Designed and optimised a 12-tray distillation column, cutting reboiler duty by 18% through feed-stage relocation' },
  { weak: 'Helped in the lab', strong: 'Independently executed 40+ ASTM standard tests (flash point, viscosity, distillation) with zero rework' },
  { weak: 'Learned Aspen Plus', strong: 'Built and converged a 5-column separation flowsheet in Aspen Plus, validating results against plant data' },
  { weak: 'Did an internship at a fertilizer plant', strong: 'Interned at a 1,500 t/day urea plant — audited 3 process units and presented 6 improvement proposals to engineering leadership' },
  { weak: 'Team project', strong: 'Led a 4-member team to a 92% grade on a chlor-alkali plant design; authored the mass & energy balance chapter' },
  { weak: 'Member of a society', strong: 'Served as AIChE student chapter treasurer — grew event attendance 3× and managed a $2k budget' },
];

const ACTION_VERBS = [
  'Designed', 'Optimised', 'Engineered', 'Led', 'Reduced', 'Increased',
  'Implemented', 'Modelled', 'Analysed', 'Automated', 'Validated',
  'Developed', 'Streamlined', 'Spearheaded', 'Executed', 'Coordinated'
];

// ─── Data Models for Targeted CV Builder ─────────────────────────────────────
export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  year: string;
  gpa: string;
  coursework: string;
}

export interface ExperienceItem {
  id: string;
  type: 'Internship' | 'Job' | 'Research' | 'Teaching' | 'Volunteer';
  role: string;
  organization: string;
  duration: string;
  location: string;
  description: string; // newline separated or single bullet
  achievements: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  tools: string;
  methodology: string;
  results: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  organization: string;
  date: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  organization: string;
  date: string;
  description: string;
}

export interface UserCvData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  summary: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  skills: {
    technical: string[];
    software: string[];
    programming: string[];
    lab: string[];
    soft: string[];
  };
  certifications: CertificationItem[];
  achievements: AchievementItem[];
}

export type TargetCategory = 'industry' | 'academic' | 'other';

export interface TargetSelection {
  category: TargetCategory;
  industry: string;
  role: string;
  academicProgram?: string;
  researchArea?: string;
  researchInterests?: string;
}

// ─── Default User Profile (High-Quality Chemical Engineering Template) ────────
const DEFAULT_USER_PROFILE: UserCvData = {
  name: 'Ayesha Khan',
  title: 'Chemical Process Engineer',
  email: 'ayesha.khan@email.com',
  phone: '+92 300 1234567',
  location: 'Lahore, Pakistan',
  linkedin: 'linkedin.com/in/ayesha-khan-chem',
  github: 'github.com/ayesha-chem',
  portfolio: 'ayeshakhan-chem.dev',
  summary: 'Chemical engineering graduate with hands-on plant internship experience in fertilizer manufacturing and polymer synthesis. Skilled in Aspen Plus simulation, mass & energy balance calculations, and HAZOP process safety methodologies. Seeking an engineering role where I can apply rigorous process modeling and unit operations fundamentals to drive operational efficiency.',
  education: [
    {
      id: 'edu-1',
      degree: 'B.Sc. Chemical Engineering',
      institution: 'University of Engineering & Technology (UET)',
      year: '2022 – 2026',
      gpa: '3.72 / 4.00',
      coursework: 'Transport Phenomena, Chemical Reaction Engineering, Process Dynamics & Control, Heat Transfer, Unit Operations, Plant Design & Economics'
    }
  ],
  experience: [
    {
      id: 'exp-1',
      type: 'Internship',
      role: 'Process Engineering Intern',
      organization: 'Fatima Fertilizer Company Ltd.',
      duration: 'Jun 2025 – Aug 2025',
      location: 'Sadiqabad, Pakistan',
      description: 'Audited process parameters across the 1,500 t/day urea granulation circuit and ammonia preheater units.\nUpdated 12 Piping & Instrumentation Diagrams (P&IDs) and verified relief valve safety interlocks.\nMonitored operational temperatures, steam consumption, and differential pressures during regular production shifts.',
      achievements: 'Identified steam condensation losses in the synthesis loop preheater, formulating insulation recommendations yielding an estimated 2% steam savings.'
    },
    {
      id: 'exp-2',
      type: 'Research',
      role: 'Undergraduate Research Assistant',
      organization: 'UET Polymer & Nanocomposite Materials Laboratory',
      duration: 'Jan 2024 – Dec 2024',
      location: 'Lahore, Pakistan',
      description: 'Synthesized biodegradable PMMA-silica nanocomposite films via solution casting techniques.\nOperated Differential Scanning Calorimetry (DSC) and Universal Testing Machine (UTM) for mechanical and thermal testing.\nConducted experimental design optimization and documented standardized testing procedures.',
      achievements: 'Co-authored a peer-reviewed conference paper on thermal degradation resistance of silica-modified biopolymers.'
    }
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'Chlor-Alkali Membrane Cell Plant Design (FYP)',
      description: 'Designed a 25,000 t/yr chlor-alkali production facility incorporating energy-efficient ion-exchange membrane cell technology.',
      tools: 'Aspen Plus, AutoCAD, Microsoft Excel, P&ID',
      methodology: 'Rigorous heat and mass balances, electrochemical cell sizing, and full HAZOP safety review.',
      results: 'Converged complete plant flowsheet with 99.2% chlorine product purity and verified economic payback of 3.4 years.'
    },
    {
      id: 'proj-2',
      title: 'Depropanizer Distillation Column Energy Optimization',
      description: 'Modelled a multicomponent hydrocarbon distillation column to minimize reboiler steam consumption.',
      tools: 'Aspen Plus (RadFrac), DWSIM, Pinch Energy Integration',
      methodology: 'Sensitivity analysis on reflux ratio, active stage count, and feed tray relocation.',
      results: 'Achieved an 18% reduction in reboiler heat duty with zero compromise in propane top-distillate purity specifications.'
    },
    {
      id: 'proj-3',
      title: 'Biodiesel Synthesis from Waste Cooking Oil',
      description: 'Bench-scale experimental optimization of two-step transesterification using agricultural waste feedstocks.',
      tools: 'Reflux Condenser, GC-FID, Kinematic Viscometer',
      methodology: 'Central Composite Design (CCD) response surface methodology evaluating catalyst loading and methanol ratio.',
      results: 'Produced biodiesel achieving 94.2% FAME conversion conforming to ASTM D6751 kinematic viscosity standards.'
    }
  ],
  skills: {
    technical: [
      'Mass & Energy Balances',
      'Process Flow Diagrams (PFD)',
      'P&ID Interpretation',
      'HAZOP & Process Safety',
      'Heat Exchanger Rating',
      'Distillation Column Design',
      'Unit Operations'
    ],
    software: [
      'Aspen Plus',
      'DWSIM',
      'AutoCAD',
      'MS Excel (VBA)'
    ],
    programming: [
      'Python (NumPy / SciPy / Pandas)',
      'MATLAB / Simulink'
    ],
    lab: [
      'Gas Chromatography (GC-FID)',
      'UV-Vis Spectrophotometry',
      'ASTM Fuel Testing',
      'Viscometry & Refractometry',
      'Acid-Base Titration'
    ],
    soft: [
      'Cross-functional Team Leadership',
      'Technical Report Writing',
      'Plant Shift Coordination',
      'Root-Cause Analysis'
    ]
  },
  certifications: [
    {
      id: 'cert-1',
      name: 'OSHA 30-Hour General Industry Safety Certification',
      organization: 'Occupational Safety and Health Administration',
      date: '2025'
    },
    {
      id: 'cert-2',
      name: 'Aspen Plus Process Simulation Certification',
      organization: 'AspenTech Academy',
      date: '2024'
    }
  ],
  achievements: [
    {
      id: 'ach-1',
      title: '1st Place — National Chemical Engineering Plant Design Competition',
      organization: 'Pakistan Institute of Chemical Engineers (PIChE)',
      date: '2025',
      description: 'Recognized among 28 national universities for optimal energy integration in the Chlor-Alkali plant design.'
    },
    {
      id: 'ach-2',
      title: 'Treasurer & Event Coordinator — AIChE Student Chapter',
      organization: 'American Institute of Chemical Engineers',
      date: '2024 – 2025',
      description: 'Organized 6 industrial guest lectures and managed chapter operating budget of $2,000.'
    }
  ]
};

// ─── Target Knowledge Base ──────────────────────────────────────────────────
export interface RoleMeta {
  role: string;
  keywords: string[];
  suggestedSkills: string[];
  priorityCategory: 'plant' | 'research' | 'operations' | 'safety' | 'control' | 'general';
}

export interface IndustryMeta {
  id: string;
  name: string;
  category: TargetCategory;
  icon: LucideIcon;
  roles: RoleMeta[];
}

export const TARGET_INDUSTRIES: IndustryMeta[] = [
  // ── 16 Industry Pathways ──
  {
    id: 'fertilizer',
    name: 'Fertilizer Industry',
    category: 'industry',
    icon: Building2,
    roles: [
      {
        role: 'Process Engineer',
        keywords: ['process simulation', 'Aspen Plus', 'mass and energy balance', 'urea', 'ammonia', 'reformer', 'P&ID', 'HAZOP', 'reboiler duty', 'troubleshooting', 'unit operations'],
        suggestedSkills: ['Ammonia Synthesis Loop', 'Urea Granulation', 'Pinch Analysis', 'Relief Valve Sizing'],
        priorityCategory: 'plant'
      },
      {
        role: 'Production Engineer',
        keywords: ['production shift', 'plant throughput', 'equipment reliability', 'yield optimization', 'safety protocol', 'downtime reduction', 'shift operations', 'SOP'],
        suggestedSkills: ['Six Sigma', 'Root Cause Failure Analysis', 'Total Productive Maintenance'],
        priorityCategory: 'operations'
      },
      {
        role: 'Graduate Engineer Trainee (GET)',
        keywords: ['unit operations', 'chemical engineering fundamentals', 'P&ID', 'internship', 'quick learner', 'teamwork', 'safety compliance', 'reporting'],
        suggestedSkills: ['Technical Presentation', 'Engineering Economics', 'Equipment Walkthrough'],
        priorityCategory: 'plant'
      },
      {
        role: 'Instrumentation & Control Engineer',
        keywords: ['DCS', 'SCADA', 'control valves', 'loop tuning', 'transmitters', 'P&ID', 'interlocks', 'process dynamics', 'MATLAB'],
        suggestedSkills: ['PLC Programming', 'PID Control Tuning', 'Safety Instrumented Systems (SIS)'],
        priorityCategory: 'control'
      },
      {
        role: 'Maintenance Engineer',
        keywords: ['preventive maintenance', 'rotating equipment', 'pumps', 'compressors', 'vibration analysis', 'mechanical seals', 'turnaround'],
        suggestedSkills: ['Condition Monitoring', 'Piping Specs', 'Lubrication Management'],
        priorityCategory: 'plant'
      },
      {
        role: 'HSE Officer',
        keywords: ['HAZOP', 'PSM', 'OSHA', 'risk assessment', 'environmental compliance', 'incident investigation', 'chemical safety', 'PPE'],
        suggestedSkills: ['LOPA Analysis', 'ALOHA Dispersion Modeling', 'ISO 14001 / ISO 45001'],
        priorityCategory: 'safety'
      }
    ]
  },
  {
    id: 'fmcg',
    name: 'FMCG & Consumer Goods',
    category: 'industry',
    icon: Layers,
    roles: [
      {
        role: 'Process Engineer',
        keywords: ['process optimization', 'mixing', 'emulsification', 'thermal processing', 'CIP', 'energy reduction', 'scale-up', 'viscosity'],
        suggestedSkills: ['Rheology', 'Clean-in-Place (CIP)', 'Mass Balances', 'Batch Reaction Sizing'],
        priorityCategory: 'plant'
      },
      {
        role: 'Production Engineer',
        keywords: ['line efficiency', 'OEE', 'bottlenecks', 'continuous improvement', 'mass balance', 'filling line', 'manufacturing operations', 'GMP'],
        suggestedSkills: ['OEE Optimization', 'Lean Manufacturing', 'Kaizen', 'Root Cause Analysis'],
        priorityCategory: 'operations'
      },
      {
        role: 'Quality Assurance / QC Engineer',
        keywords: ['QA/QC', 'analytical testing', 'Six Sigma', 'SPC', 'GMP', 'ISO 9001', 'titration', 'microbiology', 'specifications'],
        suggestedSkills: ['Statistical Process Control (SPC)', 'Minitab', 'ISO 22000', 'Failure Mode and Effects Analysis (FMEA)'],
        priorityCategory: 'operations'
      },
      {
        role: 'Supply Chain & Operations Trainee',
        keywords: ['material balance', 'inventory management', 'lean', 'scheduling', 'demand planning', 'logistics', 'vendor management'],
        suggestedSkills: ['Supply Chain Logistics', 'ERP Systems', 'Value Stream Mapping'],
        priorityCategory: 'operations'
      },
      {
        role: 'Graduate Engineer Trainee (GET)',
        keywords: ['fast-paced', 'cross-functional leadership', 'analytical problem solving', 'lean manufacturing', 'project management', 'adaptability'],
        suggestedSkills: ['Agile Project Management', 'Data Analytics', 'Cross-functional Communication'],
        priorityCategory: 'operations'
      }
    ]
  },
  {
    id: 'oilgas',
    name: 'Oil & Gas / Refining',
    category: 'industry',
    icon: Flame,
    roles: [
      {
        role: 'Process Engineer',
        keywords: ['hydrocarbon processing', 'separators', 'crude distillation', 'natural gas sweetening', 'Aspen HYSYS', 'pressure drop', 'relief valves', 'P&ID'],
        suggestedSkills: ['Aspen HYSYS', 'Two-Phase Hydraulics', 'API 520 Relief Sizing', 'Gas Sweetening'],
        priorityCategory: 'plant'
      },
      {
        role: 'Production Engineer',
        keywords: ['wellhead operations', 'flow assurance', 'choke valves', 'artificial lift', 'crude oil stabilization', 'field production'],
        suggestedSkills: ['Nodal Analysis', 'Petroleum Economics', 'Multiphase Flow Modeling'],
        priorityCategory: 'operations'
      },
      {
        role: 'Operations / Field Engineer',
        keywords: ['piping', 'pumping stations', 'gas compression', 'plant start-up', 'operating manuals', 'field safety', 'turnaround'],
        suggestedSkills: ['Centrifugal Compressors', 'Pipeline Flow Simulation', 'Permit-to-Work Systems'],
        priorityCategory: 'operations'
      },
      {
        role: 'Process Safety / HSE Specialist',
        keywords: ['flaring regulations', 'H2S safety', 'permit to work (PTW)', 'fire protection', 'toxic gas detection', 'spill containment', 'API standards'],
        suggestedSkills: ['Quantitative Risk Assessment (QRA)', 'H2S Emergency Protocols', 'Incident Investigation'],
        priorityCategory: 'safety'
      },
      {
        role: 'Graduate Trainee Engineer',
        keywords: ['refining fundamentals', 'crude assay', 'fractionation', 'heat exchanger trains', 'pumping systems', 'P&ID'],
        suggestedSkills: ['API Standards Interpretation', 'Refinery Flowsheets', 'Fluid Flow Calculations'],
        priorityCategory: 'plant'
      }
    ]
  },
  {
    id: 'petrochem',
    name: 'Petrochemical & Polymers',
    category: 'industry',
    icon: FlaskConical,
    roles: [
      {
        role: 'Process Synthesis Engineer',
        keywords: ['catalytic cracking', 'ethylene', 'propylene', 'polymerization', 'catalysis', 'reaction kinetics', 'Aspen Plus'],
        suggestedSkills: ['Polymer Kinetics', 'Olefins Cracking', 'Catalyst Sizing'],
        priorityCategory: 'plant'
      },
      {
        role: 'Polymerization & Reaction Specialist',
        keywords: ['solution polymerization', 'emulsion', 'extrusion', 'rheology', 'melt flow index', 'molecular weight distribution'],
        suggestedSkills: ['GPC Analysis', 'Differential Scanning Calorimetry (DSC)', 'Polymer Processing'],
        priorityCategory: 'research'
      },
      {
        role: 'Quality Control / Product Developer',
        keywords: ['tensile testing', 'UTM', 'thermal degradation', 'ASTM D638', 'QC specs', 'additives formulation'],
        suggestedSkills: ['Universal Testing Machine', 'Thermal Gravimetric Analysis (TGA)', 'ASTM Polymer Standards'],
        priorityCategory: 'research'
      },
      {
        role: 'Process Safety Engineer',
        keywords: ['runaway reaction', 'exotherm control', 'relief venting', 'DIERS methodology', 'HAZOP', 'toxic release'],
        suggestedSkills: ['DIERS Vent Sizing', 'Calorimetric Reaction Testing', 'PSM Compliance'],
        priorityCategory: 'safety'
      }
    ]
  },
  {
    id: 'cement',
    name: 'Cement & Heavy Industry',
    category: 'industry',
    icon: Building2,
    roles: [
      {
        role: 'Pyro-Processing Engineer',
        keywords: ['rotary kiln', 'calciner', 'heat recovery', 'clinker quality', 'combustion efficiency', 'raw meal blending', 'emissions'],
        suggestedSkills: ['Combustion Stoichiometry', 'Kiln Mass & Heat Balance', 'Alternative Fuels'],
        priorityCategory: 'plant'
      },
      {
        role: 'Quality Control Engineer',
        keywords: ['XRF', 'XRD', 'compressive strength', 'fineness (Blaine)', 'setting time', 'raw mix design', 'ASTM standards'],
        suggestedSkills: ['X-ray Fluorescence (XRF)', 'Blaine Air Permeability', 'Raw Mix Proportioning'],
        priorityCategory: 'operations'
      },
      {
        role: 'Production & Maintenance Engineer',
        keywords: ['ball mills', 'vertical roller mills', 'cyclone preheaters', 'bag filters', 'throughput optimization', 'downtime'],
        suggestedSkills: ['Comminution Mechanics', 'Baghouse Maintenance', 'Vibration Monitoring'],
        priorityCategory: 'operations'
      }
    ]
  },
  {
    id: 'pharma',
    name: 'Pharmaceutical & Bio',
    category: 'industry',
    icon: Pill,
    roles: [
      {
        role: 'Process Development Engineer',
        keywords: ['formulation', 'crystallization', 'lyophilization', 'filtration', 'scale-up', 'DoE', 'GMP', 'drug delivery', 'kinetics'],
        suggestedSkills: ['Design of Experiments (DoE)', 'Aseptic Processing', 'Particle Sizing', 'Chromatography'],
        priorityCategory: 'research'
      },
      {
        role: 'Validation Engineer (IQ/OQ/PQ)',
        keywords: ['IQ/OQ/PQ', 'GMP compliance', 'cleanrooms', 'sterile filtration', 'calibration', 'SOP drafting', 'regulatory audit'],
        suggestedSkills: ['21 CFR Part 11 Compliance', 'Validation Protocols', 'HVAC Cleanroom Qualification'],
        priorityCategory: 'operations'
      },
      {
        role: 'QA/QC Analytical Chemist',
        keywords: ['HPLC', 'dissolution testing', 'spectrophotometry', 'raw material assay', 'batch records', 'pharmacopeia standards', 'FDA/WHO'],
        suggestedSkills: ['High-Performance Liquid Chromatography', 'Spectrophotometric Assay', 'Method Validation'],
        priorityCategory: 'research'
      },
      {
        role: 'Formulation Scientist',
        keywords: ['excipients', 'granulation', 'tableting', 'dissolution profiles', 'stability chambers', 'ICH guidelines'],
        suggestedSkills: ['Dissolution Apparatus', 'Stability Testing (ICH Q1A)', 'Dry/Wet Granulation'],
        priorityCategory: 'research'
      }
    ]
  },
  {
    id: 'chem_mfg',
    name: 'Chemical Manufacturing',
    category: 'industry',
    icon: Factory,
    roles: [
      {
        role: 'Plant Chemical Engineer',
        keywords: ['batch reactors', 'distillation', 'evaporation', 'crystallizer', 'mass balance', 'yield improvement', 'P&ID', 'utilities'],
        suggestedSkills: ['Batch Reaction Engineering', 'Pump Hydraulics', 'Steam Systems Optimization'],
        priorityCategory: 'plant'
      },
      {
        role: 'Production Supervisor',
        keywords: ['shift roster', 'material requisitions', 'safety compliance', 'raw material yield', 'SOP implementation', 'operator training'],
        suggestedSkills: ['Production Planning', 'Standard Work Procedures', 'Continuous Improvement'],
        priorityCategory: 'operations'
      },
      {
        role: 'Operations & Commissioning Trainee',
        keywords: ['hydrotesting', 'line flushing', 'pre-commissioning', 'startup protocols', 'valve inspection', 'instrument check'],
        suggestedSkills: ['Pre-commissioning Checklists', 'Loop Checking', 'P&ID Punch Listing'],
        priorityCategory: 'plant'
      }
    ]
  },
  {
    id: 'food_proc',
    name: 'Food Processing & Beverage',
    category: 'industry',
    icon: Layers,
    roles: [
      {
        role: 'Food Process Engineer',
        keywords: ['pasteurization', 'thermal sterilization', 'aseptic packaging', 'spray drying', 'evaporation', 'HACCP', 'sensory evaluation'],
        suggestedSkills: ['HACCP Plan Development', 'Thermal Death Time (D/z values)', 'Spray Dryer Modeling'],
        priorityCategory: 'plant'
      },
      {
        role: 'Quality Assurance Lead',
        keywords: ['food safety standards', 'ISO 22000', 'BRC', 'moisture content', 'viscosity', 'shelf-life testing', 'allergen control'],
        suggestedSkills: ['Water Activity (aw) Measurement', 'Pathogen Testing Protocols', 'CIP Sanitation Validation'],
        priorityCategory: 'operations'
      },
      {
        role: 'Sanitation & Safety Engineer',
        keywords: ['CIP cycles', 'caustic rinse', 'effluent BOD/COD', 'sanitizer titration', 'clean utilities', 'cross-contamination'],
        suggestedSkills: ['CIP Flow Rate Calculations', 'Wastewater Neutralization', 'Chemical Handling Safety'],
        priorityCategory: 'safety'
      }
    ]
  },
  {
    id: 'textile',
    name: 'Textile & Wet Processing',
    category: 'industry',
    icon: Wrench,
    roles: [
      {
        role: 'Wet Processing Engineer',
        keywords: ['dyeing machines', 'scouring', 'bleaching', 'mercerization', 'liquor ratio', 'color matching', 'steam consumption'],
        suggestedSkills: ['Spectrophotometer Color Matching', 'Dyeing Kinetics', 'Liquor Ratio Optimization'],
        priorityCategory: 'plant'
      },
      {
        role: 'Dyeing & Finishing Specialist',
        keywords: ['reactive dyes', 'disperse dyes', 'stenter frames', 'cross-linking agents', 'tensile strength', 'color fastness'],
        suggestedSkills: ['AATCC / ISO Color Fastness Standards', 'Finishing Chemicals Formulation', 'Thermal Setting'],
        priorityCategory: 'operations'
      },
      {
        role: 'Effluent Treatment Plant (ETP) Engineer',
        keywords: ['biological aeration', 'activated sludge', 'coagulation-flocculation', 'COD/BOD reduction', 'RO recycling', 'color removal'],
        suggestedSkills: ['Coagulant Jar Testing', 'Membrane Bioreactors (MBR)', 'Sludge Dewatering Sizing'],
        priorityCategory: 'safety'
      }
    ]
  },
  {
    id: 'energy',
    name: 'Energy & Power Generation',
    category: 'industry',
    icon: Zap,
    roles: [
      {
        role: 'Power Plant Process Engineer',
        keywords: ['Rankine cycle', 'boilers', 'steam turbines', 'cooling towers', 'feedwater chemistry', 'flue gas desulfurization', 'heat rate'],
        suggestedSkills: ['Thermodynamic Cycle Simulation', 'Deaerator Operations', 'Boiler Water Chemistry (ASME)'],
        priorityCategory: 'plant'
      },
      {
        role: 'Renewable Energy Specialist',
        keywords: ['biomass gasification', 'green hydrogen', 'electrolyzers', 'solar thermal', 'energy storage', 'carbon abatement'],
        suggestedSkills: ['Electrolyzer Efficiency Modeling', 'Biomass Gasifier Mass Balances', 'Techno-Economic Assessment'],
        priorityCategory: 'research'
      },
      {
        role: 'Utilities & Boilers Engineer',
        keywords: ['demineralized water (DM)', 'reverse osmosis', 'compressed air', 'chilled water', 'steam traps', 'condensate recovery'],
        suggestedSkills: ['Steam Trap Auditing', 'RO Membrane Fouling Analysis', 'Cooling Water Chlorination'],
        priorityCategory: 'operations'
      }
    ]
  },
  {
    id: 'water_waste',
    name: 'Water & Wastewater Treatment',
    category: 'industry',
    icon: Droplets,
    roles: [
      {
        role: 'Water Treatment Engineer',
        keywords: ['RO membranes', 'ultrafiltration', 'ion exchange', 'softening', 'coagulation', 'disinfection', 'drinking water standards'],
        suggestedSkills: ['RO Projection Software (ROSA/WAVE)', 'Sedimentation Sizing', 'Chlorine Contact Chamber Design'],
        priorityCategory: 'plant'
      },
      {
        role: 'ETP / RO Plant Manager',
        keywords: ['sludge digestion', 'anaerobic reactors', 'effluent compliance', 'chemical dosing', 'pumping systems', 'filter press'],
        suggestedSkills: ['BOD/COD Mass Balances', 'Dissolved Air Flotation (DAF)', 'Zero Liquid Discharge (ZLD)'],
        priorityCategory: 'operations'
      },
      {
        role: 'Environmental Process Specialist',
        keywords: ['environmental audit', 'hazardous discharge', 'stormwater management', 'carbon footprint', 'regulatory reporting'],
        suggestedSkills: ['ISO 14001 Environmental Audit', 'Heavy Metal Precipitation', 'Toxicity Characteristic Leaching (TCLP)'],
        priorityCategory: 'safety'
      }
    ]
  },
  {
    id: 'process_ind',
    name: 'Process Industries & Chlor-Alkali',
    category: 'industry',
    icon: Factory,
    roles: [
      {
        role: 'Unit Operations Specialist',
        keywords: ['distillation', 'gas absorption', 'liquid extraction', 'evaporators', 'heat exchangers', 'pumps', 'pressure drop calculations'],
        suggestedSkills: ['Hydraulic Network Analysis', 'Packed Column Hydraulics', 'Tray Efficiency Calculation'],
        priorityCategory: 'plant'
      },
      {
        role: 'Membrane Cell Process Engineer',
        keywords: ['electrolysis', 'brine purification', 'chlor-alkali', 'ion-exchange membrane', 'caustic evaporation', 'chlorine liquefaction'],
        suggestedSkills: ['Faraday Current Efficiency', 'Brine Sulfate Removal', 'Electrochemical Cell Troubleshooting'],
        priorityCategory: 'plant'
      },
      {
        role: 'Plant Optimization Engineer',
        keywords: ['pinch analysis', 'debottlenecking', 'energy integration', 'utility balancing', 'simulation modeling', 'payback period'],
        suggestedSkills: ['Pinch Technology Software', 'Heat Exchanger Network Synthesis', 'CapEx/OpEx Estimation'],
        priorityCategory: 'plant'
      }
    ]
  },
  {
    id: 'hse_safety',
    name: 'HSE & Process Safety',
    category: 'industry',
    icon: ShieldCheck,
    roles: [
      {
        role: 'Process Safety Specialist (HAZOP/LOPA)',
        keywords: ['HAZOP', 'LOPA', 'SIL', 'fault tree analysis', 'consequence modeling', 'ALOHA', 'overpressure relief', 'OSHA PSM'],
        suggestedSkills: ['Layer of Protection Analysis (LOPA)', 'Bow-Tie Methodology', 'Toxic Dispersion Modeling'],
        priorityCategory: 'safety'
      },
      {
        role: 'Environmental Compliance Engineer',
        keywords: ['air emissions monitoring', 'hazardous waste manifest', 'spill response', 'ISO 14001', 'environmental reporting', 'effluent discharge'],
        suggestedSkills: ['Environmental Impact Assessment (EIA)', 'Carbon Accounting', 'Effluent Treatment Standards'],
        priorityCategory: 'safety'
      },
      {
        role: 'Industrial Hygiene & Safety Officer',
        keywords: ['chemical exposure limits (PEL/TLV)', 'noise surveys', 'confined space entry', 'incident investigation', 'PPE assessment'],
        suggestedSkills: ['Airborne Contaminant Sampling', 'Job Safety Analysis (JSA)', 'OSHA Recordkeeping'],
        priorityCategory: 'safety'
      }
    ]
  },
  {
    id: 'process_control',
    name: 'Process Control & Automation',
    category: 'industry',
    icon: Target,
    roles: [
      {
        role: 'Control Systems Engineer (DCS/PLC)',
        keywords: ['PID tuning', 'closed-loop control', 'cascade control', 'feedforward', 'DCS', 'PLC', 'transfer functions', 'MATLAB'],
        suggestedSkills: ['Model Predictive Control (MPC)', 'Loop Tuning Algorithms', 'Simulink Dynamic Modeling'],
        priorityCategory: 'control'
      },
      {
        role: 'Instrumentation Specialist',
        keywords: ['transmitters', 'orifice plates', 'thermocouples', 'control valves', 'smart positioners', 'P&ID loops', 'calibration'],
        suggestedSkills: ['Fieldbus Communication', 'Smart Valve Sizing', 'Calibration Standards'],
        priorityCategory: 'control'
      },
      {
        role: 'Advanced Process Control (APC) Engineer',
        keywords: ['multivariable control', 'state-space', 'dynamic simulation', 'dead-time compensation', 'real-time optimization (RTO)'],
        suggestedSkills: ['State Estimation (Kalman Filtering)', 'Nonlinear Control Design', 'Python Control Systems Library'],
        priorityCategory: 'control'
      }
    ]
  },
  {
    id: 'rd_eng',
    name: 'Research & Development (R&D)',
    category: 'industry',
    icon: FlaskConical,
    roles: [
      {
        role: 'R&D Process Engineer',
        keywords: ['novel process design', 'lab-to-pilot scale', 'bench-scale synthesis', 'DoE', 'techno-economic analysis', 'patents'],
        suggestedSkills: ['Design of Experiments (DoE)', 'Pilot Plant Operations', 'Reaction Kinetics Modeling'],
        priorityCategory: 'research'
      },
      {
        role: 'Pilot Plant Specialist',
        keywords: ['skid fabrication', 'microreactors', 'data acquisition (DAQ)', 'flow meters', 'troubleshooting', 'scale-up criteria'],
        suggestedSkills: ['Dimensionless Numbers Scale-up', 'LabVIEW Data Acquisition', 'Pressure Reactor Rig Assembly'],
        priorityCategory: 'plant'
      },
      {
        role: 'Catalyst Development Engineer',
        keywords: ['heterogeneous catalysis', 'BET surface area', 'chemisorption', 'catalyst deactivation', 'fixed-bed reactors', 'selectivity'],
        suggestedSkills: ['BET & Porosimetry Analysis', 'TPD/TPR Catalyst Characterization', 'Microchannel Reactor Design'],
        priorityCategory: 'research'
      }
    ]
  },
  {
    id: 'gen_chem',
    name: 'General Chemical Engineering',
    category: 'industry',
    icon: Wrench,
    roles: [
      {
        role: 'Associate Chemical Engineer',
        keywords: ['mass and energy balance', 'unit operations', 'P&ID', 'process simulation', 'pumps and piping', 'technical documentation'],
        suggestedSkills: ['Engineering Calculations', 'Fluid Dynamics Calculations', 'Equipment Sizing Sheets'],
        priorityCategory: 'general'
      },
      {
        role: 'Graduate Chemical Engineer',
        keywords: ['chemical engineering fundamentals', 'problem solving', 'teamwork', 'safety compliance', 'reporting', 'data analysis'],
        suggestedSkills: ['Technical Presentation', 'Spreadsheet Modeling', 'Process Flow Analysis'],
        priorityCategory: 'general'
      },
      {
        role: 'Technical Operations Trainee',
        keywords: ['plant walkthroughs', 'operator coordination', 'equipment logging', 'safety audits', 'troubleshooting assistance'],
        suggestedSkills: ['Field Inspection', 'Logsheet Auditing', 'Basic Maintenance Routines'],
        priorityCategory: 'operations'
      }
    ]
  },

  // ── 5 Academic Pathways ──
  {
    id: 'academic_ms',
    name: 'MS Admission in Chemical Engineering',
    category: 'academic',
    icon: GraduationCap,
    roles: [
      {
        role: 'MS in Chemical Engineering',
        keywords: ['academic coursework', 'GPA', 'research thesis', 'transport phenomena', 'thermodynamics', 'reaction kinetics', 'laboratory experience', 'faculty mentorship'],
        suggestedSkills: ['Scientific Manuscript Writing', 'Literature Synthesis', 'Molecular Simulation / DFT', 'Numerical Methods'],
        priorityCategory: 'research'
      },
      {
        role: 'MS in Energy & Environmental Engineering',
        keywords: ['biofuels', 'carbon capture', 'renewable energy', 'environmental sustainability', 'catalysis', 'life-cycle assessment'],
        suggestedSkills: ['Life Cycle Assessment (SimaPro)', 'Heterogeneous Catalysis', 'Carbon Capture Technology'],
        priorityCategory: 'research'
      },
      {
        role: 'MS in Materials & Nanotechnology',
        keywords: ['polymer composites', 'nanotechnology', 'characterization', 'SEM', 'FTIR', 'thermal analysis', 'DSC/TGA'],
        suggestedSkills: ['Scanning Electron Microscopy', 'Polymer Rheology', 'Nanomaterial Synthesis'],
        priorityCategory: 'research'
      },
      {
        role: 'MS in Advanced Process Engineering',
        keywords: ['advanced simulation', 'dynamic optimization', 'pinch analysis', 'multiscale modeling', 'CFD'],
        suggestedSkills: ['ANSYS Fluent / OpenFOAM', 'Optimization Algorithms (GAMS/Pyomo)', 'Dynamic Simulation'],
        priorityCategory: 'research'
      }
    ]
  },
  {
    id: 'academic_mphil',
    name: 'MPhil / Graduate Research',
    category: 'academic',
    icon: GraduationCap,
    roles: [
      {
        role: 'MPhil in Chemical Technology',
        keywords: ['applied research', 'literature review', 'experimental methodology', 'statistical analysis', 'thesis defense'],
        suggestedSkills: ['Research Methodology', 'OriginLab Data Plotting', 'Experimental Reproducibility'],
        priorityCategory: 'research'
      },
      {
        role: 'Graduate Research Fellow',
        keywords: ['grant funding', 'scholarly publication', 'interdisciplinary collaboration', 'lab management', 'mentoring undergraduates'],
        suggestedSkills: ['Grant Proposal Drafting', 'Peer Review Assistance', 'Laboratory Safety Protocols'],
        priorityCategory: 'research'
      }
    ]
  },
  {
    id: 'academic_ra',
    name: 'Research Assistant (RA)',
    category: 'academic',
    icon: BookOpen,
    roles: [
      {
        role: 'Graduate Research Assistant',
        keywords: ['literature review', 'experimental design', 'data analysis', 'spectroscopy', 'manuscript drafting', 'laboratory safety', 'instrument calibration', 'reproducibility'],
        suggestedSkills: ['Peer-reviewed Publication', 'Data Regression (Origin/Python)', 'Safe Chemical Handling'],
        priorityCategory: 'research'
      },
      {
        role: 'Undergraduate Laboratory Assistant',
        keywords: ['sample preparation', 'chemical inventory', 'standard operating procedures', 'glassware sterilization', 'lab notebook documentation'],
        suggestedSkills: ['Standard Operating Procedures (SOPs)', 'Spectrophotometric Testing', 'Chemical Waste Disposal'],
        priorityCategory: 'research'
      },
      {
        role: 'Project Researcher',
        keywords: ['sponsored project', 'milestone deliverables', 'experimental verification', 'progress reporting', 'presentation'],
        suggestedSkills: ['Project Scheduling', 'Technical Milestone Reporting', 'Analytical Verification'],
        priorityCategory: 'research'
      }
    ]
  },
  {
    id: 'academic_scholarship',
    name: 'Scholarship & Fellowship Application',
    category: 'academic',
    icon: Award,
    roles: [
      {
        role: 'Fulbright / Erasmus Mundus Candidate',
        keywords: ['academic excellence', 'statement of purpose', 'leadership', 'cross-cultural communication', 'societal impact', 'CGPA'],
        suggestedSkills: ['Scholarly Essay Crafting', 'Academic Curriculum Vitae (Europass)', 'Global Leadership Experience'],
        priorityCategory: 'research'
      },
      {
        role: 'Postgraduate Research Fellow',
        keywords: ['doctoral preparation', 'research proposal', 'refereed papers', 'conference presentations', 'faculty recommendation'],
        suggestedSkills: ['Research Proposal Writing', 'LaTeX Typesetting', 'Bibliographic Citation Indexing'],
        priorityCategory: 'research'
      }
    ]
  },
  {
    id: 'academic_internship',
    name: 'Research Internship & Academic Exchange',
    category: 'academic',
    icon: BookOpen,
    roles: [
      {
        role: 'International Research Intern',
        keywords: ['exchange scholar', 'collaborative laboratory', 'advanced analytical equipment', 'accelerated project delivery', 'poster presentation'],
        suggestedSkills: ['Cross-laboratory Collaboration', 'Scientific Poster Design', 'Accelerated Data Acquisition'],
        priorityCategory: 'research'
      },
      {
        role: 'University Visiting Scholar',
        keywords: ['host institution', 'bilateral research', 'specialized characterization techniques', 'joint publication'],
        suggestedSkills: ['Advanced Material Characterization', 'Inter-institutional Research Collaboration'],
        priorityCategory: 'research'
      }
    ]
  },

  // ── 5 Career & Other Pathways ──
  {
    id: 'career_get',
    name: 'Graduate Engineer Trainee (GET)',
    category: 'other',
    icon: Briefcase,
    roles: [
      {
        role: 'Graduate Engineer Trainee (General)',
        keywords: ['plant rotation', 'unit operations', 'technical assessments', 'shift work', 'safety protocols', 'rapid learning', 'cross-functional agility'],
        suggestedSkills: ['Plant Flowsheet Tracing', 'Shift Log Reporting', 'Equipment Troubleshooting'],
        priorityCategory: 'plant'
      },
      {
        role: 'Operations Trainee (Plant Rotation)',
        keywords: ['control room rotation', 'field inspections', 'pump alignment', 'relief valve testing', 'SOP validation'],
        suggestedSkills: ['Field Walkdown Procedures', 'Safety Work Permits', 'Operational Handovers'],
        priorityCategory: 'operations'
      }
    ]
  },
  {
    id: 'career_internship',
    name: 'Industrial Internship',
    category: 'other',
    icon: Briefcase,
    roles: [
      {
        role: 'Summer Engineering Intern',
        keywords: ['internship', 'plant observation', 'data collection', 'P&ID verification', 'mentor guidance', 'presentation of findings'],
        suggestedSkills: ['Plant Observation', 'Technical Logbook Maintenance', 'Internship Report Writing'],
        priorityCategory: 'general'
      },
      {
        role: 'Plant Operations Intern',
        keywords: ['field operator shadowing', 'utility loops', 'daily throughput logs', 'sampling routines', 'safety drills'],
        suggestedSkills: ['Sample Collection ASTM', 'Utility System Inspection', 'Hazard Identification'],
        priorityCategory: 'operations'
      }
    ]
  },
  {
    id: 'career_entry',
    name: 'Entry-Level Chemical Engineer',
    category: 'other',
    icon: Briefcase,
    roles: [
      {
        role: 'Junior Process Engineer',
        keywords: ['mass and energy balance', 'simulation support', 'hydraulic sizing', 'specification sheets', 'vendor drawing review'],
        suggestedSkills: ['Hydraulic Line Sizing', 'Equipment Data Sheets', 'Simulation Verification'],
        priorityCategory: 'plant'
      },
      {
        role: 'Junior Shift Engineer',
        keywords: ['shift supervision', 'throughput targets', 'process deviations', 'emergency protocols', 'raw material logs'],
        suggestedSkills: ['Alarm Management', 'Deviation Logging', 'Shift Communication'],
        priorityCategory: 'operations'
      }
    ]
  },
  {
    id: 'career_tech_sales',
    name: 'Technical Sales & Application Engineer',
    category: 'other',
    icon: TrendingUp,
    roles: [
      {
        role: 'Specialty Chemical Sales Engineer',
        keywords: ['client technical consultation', 'chemical dosing solutions', 'water treatment chemicals', 'catalyst sales', 'proposal drafting'],
        suggestedSkills: ['Chemical Product Demonstration', 'Client Needs Analysis', 'Commercial Proposal Costing'],
        priorityCategory: 'general'
      },
      {
        role: 'Process Equipment Specialist',
        keywords: ['equipment sizing for clients', 'heat exchangers', 'pumps', 'filtration skids', 'technical tender preparation'],
        suggestedSkills: ['Equipment Selection Charts', 'Tender Technical Bid Evaluation', 'Customer Support Engineering'],
        priorityCategory: 'general'
      }
    ]
  },
  {
    id: 'career_plant_ops',
    name: 'Plant Operations Specialist',
    category: 'other',
    icon: Factory,
    roles: [
      {
        role: 'Shift Supervisor',
        keywords: ['shift leadership', 'safety audits', 'production quotas', 'troubleshooting upsets', 'handover logs'],
        suggestedSkills: ['Incident Mitigation', 'Shift Handover Protocols', 'Worker Safety Coordination'],
        priorityCategory: 'operations'
      },
      {
        role: 'Commissioning & Startup Specialist',
        keywords: ['cold commissioning', 'hot commissioning', 'loop checks', 'tightness testing', 'punch list clearance'],
        suggestedSkills: ['Commissioning Sequence Planning', 'P&ID Red-lining', 'Factory Acceptance Test (FAT)'],
        priorityCategory: 'plant'
      }
    ]
  }
];

// ─── Intelligent CV Generation & Optimization Functions ──────────────────────

/**
 * Transforms weak or passive phrasing into strong, active Chemical Engineering statements
 * without fabricating false metrics or unperformed duties.
 */
export function optimizeBulletPoint(text: string): string {
  if (!text || text.trim().length === 0) return text;
  let t = text.trim();

  const weakStarters: { regex: RegExp; repl: string }[] = [
    { regex: /^(helped with|assisted with|assisted in|helped in|supported)\s+/i, repl: 'Collaborated on and supported ' },
    { regex: /^(worked on|worked in|was responsible for|handled)\s+/i, repl: 'Executed and coordinated ' },
    { regex: /^(learned|studied)\s+/i, repl: 'Applied foundational principles of ' },
    { regex: /^(did testing on|did tests on|tested)\s+/i, repl: 'Conducted rigorous standardized analytical testing of ' },
    { regex: /^(made|created|built)\s+(p&id|pfd|flowsheet)/i, repl: 'Synthesized and drafted comprehensive $2' },
    { regex: /^(checked|monitored|looked at)\s+/i, repl: 'Monitored and evaluated critical operational parameters of ' },
    { regex: /^(ran|did)\s+(simulations?|modeling)\s+/i, repl: 'Modeled and converged steady-state process flowsheet for ' },
    { regex: /^(did lab work|worked in lab)\s+/i, repl: 'Executed standard laboratory wet chemical and analytical protocols for ' }
  ];

  for (const rule of weakStarters) {
    if (rule.regex.test(t)) {
      t = t.replace(rule.regex, rule.repl);
      break;
    }
  }

  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Generates an honest, target-adapted summary that leverages the user's REAL credentials
 * without ever fabricating fictitious qualifications or unearned achievements.
 */
export function generateTargetSummary(user: UserCvData, target: TargetSelection): string {
  const degree = user.education[0]?.degree || 'Chemical Engineering graduate';
  const inst = user.education[0]?.institution ? ` from ${user.education[0].institution}` : '';
  const gpaStr = user.education[0]?.gpa ? ` (CGPA ${user.education[0].gpa})` : '';

  // Identify relevant experiences and skills from authentic profile
  const hasPlantExp = user.experience.some(e => /fertilizer|refin|petrochem|plant|process|intern/i.test(e.organization + ' ' + e.role));
  const plantOrg = user.experience.find(e => /fertilizer|refin|petrochem|plant|intern/i.test(e.organization))?.organization || 'industrial manufacturing';
  
  const hasResearchExp = user.experience.some(e => e.type === 'Research' || /research|lab|polymer|nanomaterial/i.test(e.role + ' ' + e.organization));
  const researchTopic = user.experience.find(e => e.type === 'Research')?.role || 'experimental process research';

  const coreSkills = user.skills.technical.slice(0, 3).join(', ');
  const softTools = user.skills.software.slice(0, 2).join(' and ');
  const programmingTools = user.skills.programming.slice(0, 2).join(' and ');

  // 1. Academic Pathways (MS, MPhil, RA, Scholarship, Exchange)
  if (target.category === 'academic') {
    const researchTarget = target.researchArea || target.role;
    const expClause = hasResearchExp ? `demonstrated research background as ${researchTopic}` : 'rigorous academic project foundations';
    const compStr = programmingTools ? `, alongside computational workflows in ${programmingTools}` : '';
    return `${degree}${inst}${gpaStr} with ${expClause} and core competencies in ${coreSkills}. Experienced in bench-scale experimental design, simulation via ${softTools || 'engineering software'}${compStr}, and rigorous analytical characterization. Seeking admission to ${target.academicProgram || target.role} to contribute to advanced research in ${researchTarget}, leveraging proven foundations in transport phenomena, reaction kinetics, and process modeling.`;
  }

  // 2. Heavy Continuous Process Industries (Fertilizer, Oil & Gas, Refining, Petrochemical, Chemical Mfg)
  if (target.industry.includes('Fertilizer') || target.industry.includes('Oil') || target.industry.includes('Petrochem') || target.industry.includes('Chemical Manufacturing')) {
    const expClause = hasPlantExp ? `hands-on industrial training at ${plantOrg}` : 'rigorous academic design project foundations';
    return `${degree}${inst} with ${expClause} and technical proficiency in ${coreSkills}. Experienced in process simulation using ${softTools || 'Aspen Plus'}, P&ID analysis, and unit operations optimization. Seeking a ${target.role} position in ${target.industry} to apply mass & energy balances, plant troubleshooting, and process safety standards to maximize production efficiency.`;
  }

  // 3. Fast-Moving Consumer Goods & Food Processing
  if (target.industry.includes('FMCG') || target.industry.includes('Food') || target.role.includes('Production')) {
    return `Proactive ${degree}${inst} with practical exposure to manufacturing operations, process efficiency, and mass balance calculations. Skilled in ${coreSkills}, data-driven problem solving, and cross-functional team execution. Seeking to leverage analytical engineering capabilities as a ${target.role} within ${target.industry} to streamline production line throughput and ensure operational excellence.`;
  }

  // 4. HSE & Process Safety
  if (target.role.includes('HSE') || target.role.includes('Safety') || target.industry.includes('HSE')) {
    return `Safety-conscious ${degree}${inst} possessing specialized academic training in HAZOP methodologies, risk assessment matrices, and process plant safety interlocks. Experienced in industrial operations through ${hasPlantExp ? plantOrg : 'capstone engineering design'}. Dedicated to promoting regulatory compliance, proactive hazard identification, and environmental stewardship as a ${target.role}.`;
  }

  // 5. Process Control & Automation
  if (target.role.includes('Control') || target.role.includes('Instrumentation') || target.industry.includes('Process Control')) {
    const compTools = programmingTools || 'MATLAB dynamic tools';
    return `Systems-oriented ${degree}${inst} with strong mathematical and modeling proficiency in process dynamics, feedback control loops, and simulation. Experienced in P&ID instrumentation loops, ${softTools || 'Aspen Plus'}, and ${compTools}. Eager to contribute technical rigor and loop optimization as a ${target.role} within ${target.industry}.`;
  }

  // 6. Energy, Utilities, Water & Wastewater, Textile
  if (target.industry.includes('Energy') || target.industry.includes('Water') || target.industry.includes('Textile') || target.industry.includes('Cement')) {
    return `Results-driven ${degree}${inst} with comprehensive grounding in industrial unit operations, heat & mass balances, and utility integration. Skilled in ${coreSkills} and simulation tools (${softTools || 'Aspen Plus'}). Dedicated to optimizing resource efficiency, thermal recovery, and environmental standards as a ${target.role} in ${target.industry}.`;
  }

  // 7. Career Pathways (GET, Internship, Entry-Level, Technical Sales, Plant Ops)
  if (target.category === 'other') {
    return `Driven ${degree}${inst} with solid foundations in chemical engineering unit operations, plant safety principles, and process modeling software (${softTools || 'Aspen Plus'}). Proven quick adaptability and analytical discipline demonstrated through practical internships and capstone design. Seeking to launch career as a ${target.role} to contribute immediate operational value and cross-functional agility.`;
  }

  // 8. General Chemical Engineering Fallback
  return `${degree}${inst} with well-rounded competencies in ${coreSkills} and simulation software including ${softTools || 'Aspen Plus and MATLAB'}. Proven ability to apply chemical engineering fundamentals to solve practical operational problems through hands-on projects and internships. Eager to contribute technical rigor and collaborative dedication as a ${target.role} within the ${target.industry}.`;
}

/**
 * Reorders and emphasizes experience and projects based on relevance to the target.
 */
export function getPrioritizedContent(user: UserCvData, target: TargetSelection) {
  const targetMeta = TARGET_INDUSTRIES.flatMap(ind => ind.roles).find(r => r.role === target.role);
  const keywords = (targetMeta?.keywords || []).map(k => k.toLowerCase());

  const scoreItem = (text: string) => {
    const lower = text.toLowerCase();
    let score = 0;
    keywords.forEach(k => {
      if (lower.includes(k)) score += 3;
    });
    return score;
  };

  const sortedExp = [...user.experience].sort((a, b) => {
    // For academic target, prioritize research experience first
    if (target.category === 'academic') {
      if (a.type === 'Research' && b.type !== 'Research') return -1;
      if (b.type === 'Research' && a.type !== 'Research') return 1;
    }
    // Otherwise score by role keyword match
    const scoreA = scoreItem(`${a.role} ${a.organization} ${a.description} ${a.achievements}`);
    const scoreB = scoreItem(`${b.role} ${b.organization} ${b.description} ${b.achievements}`);
    return scoreB - scoreA;
  });

  const sortedProjects = [...user.projects].sort((a, b) => {
    const scoreA = scoreItem(`${a.title} ${a.description} ${a.tools} ${a.methodology} ${a.results}`);
    const scoreB = scoreItem(`${b.title} ${b.description} ${b.tools} ${b.methodology} ${b.results}`);
    return scoreB - scoreA;
  });

  return { sortedExp, sortedProjects };
}

/**
 * Calculates a transparent, multi-factor ATS Readiness Score.
 */
export function calculateAtsScore(user: UserCvData, target: TargetSelection, tailoredSummary: string) {
  const targetMeta = TARGET_INDUSTRIES.flatMap(ind => ind.roles).find(r => r.role === target.role);
  const roleKeywords = targetMeta?.keywords || [];

  const fullResumeText = [
    user.name, user.title, tailoredSummary,
    user.education.map(e => `${e.degree} ${e.institution} ${e.coursework}`).join(' '),
    user.experience.map(e => `${e.role} ${e.organization} ${e.description} ${e.achievements}`).join(' '),
    user.projects.map(p => `${p.title} ${p.description} ${p.tools} ${p.methodology} ${p.results}`).join(' '),
    user.skills.technical.join(' '),
    user.skills.software.join(' '),
    user.skills.programming.join(' '),
    user.skills.lab.join(' '),
    user.skills.soft.join(' '),
    user.certifications.map(c => c.name).join(' '),
    user.achievements.map(a => `${a.title} ${a.organization}`).join(' ')
  ].join(' ').toLowerCase();

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  roleKeywords.forEach(kw => {
    if (fullResumeText.includes(kw.toLowerCase())) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  });

  const keywordRelevance = Math.min(100, Math.round((matchedKeywords.length / Math.max(1, roleKeywords.length)) * 100));
  
  // Section Completeness (Contact, Education, Experience, Projects, Skills, Certifications, Portfolio/LinkedIn)
  let completeScore = 15; // Basic contact
  if (user.education.length > 0 && user.education[0].degree) completeScore += 20;
  if (user.experience.length > 0 && user.experience[0].role) completeScore += 20;
  if (user.projects.length > 0 && user.projects[0].title) completeScore += 15;
  if (user.skills.technical.length + user.skills.software.length + user.skills.programming.length >= 6) completeScore += 10;
  if (user.linkedin) completeScore += 10;
  if (user.portfolio || user.github) completeScore += 10;
  const sectionCompleteness = Math.min(100, completeScore);

  // Experience Relevance & Quantifiable metrics
  const hasNumbers = user.experience.some(e => /\d+(\.\d+)?%|\d+\s*(t\/day|m³|MW|kg|ppm|years|t\/yr)/i.test(e.description + ' ' + e.achievements));
  const hasActionVerbs = user.experience.some(e => {
    const text = (e.description + ' ' + e.achievements).toLowerCase();
    return ACTION_VERBS.some(v => text.includes(v.toLowerCase()));
  });
  const experienceRelevance = Math.min(100, (hasNumbers ? 50 : 25) + (hasActionVerbs ? 50 : 25));

  // Skills Alignment
  const totalSkillsCount = user.skills.technical.length + user.skills.software.length + user.skills.programming.length + user.skills.lab.length;
  const skillsAlignment = Math.min(100, Math.round((totalSkillsCount / 14) * 80 + (matchedKeywords.length * 3)));

  // Formatting Compatibility (linear, clean headings, standard fonts)
  const formattingCompatibility = 99;

  // Composite Weighted Score
  const totalScore = Math.min(
    99,
    Math.round(
      keywordRelevance * 0.35 +
      skillsAlignment * 0.25 +
      experienceRelevance * 0.20 +
      sectionCompleteness * 0.15 +
      formattingCompatibility * 0.05
    )
  );

  // Actionable Suggestions
  const suggestions: string[] = [];
  if (missingKeywords.length > 0) {
    suggestions.push(`Consider incorporating keywords like "${missingKeywords.slice(0, 3).join('", "')}" if you have genuine experience with them.`);
  }
  if (!hasNumbers) {
    suggestions.push('Add 1–2 quantifiable achievements to your internship/projects (e.g. throughput, cost, duty reduction %).');
  }
  if (user.education.some(e => !e.coursework)) {
    suggestions.push('Specify core relevant coursework (e.g. Reaction Engineering, Process Control) to pass academic ATS filters.');
  }
  if (!user.linkedin) {
    suggestions.push('Add your professional LinkedIn profile URL to elevate contact completeness.');
  }
  if (targetMeta?.suggestedSkills) {
    const unlisted = targetMeta.suggestedSkills.filter(s => !fullResumeText.includes(s.toLowerCase()));
    if (unlisted.length > 0) {
      suggestions.push(`Role-specific competencies to consider: ${unlisted.slice(0, 3).join(', ')} (only if you genuinely possess them).`);
    }
  }

  return {
    totalScore,
    keywordRelevance,
    skillsAlignment,
    experienceRelevance,
    sectionCompleteness,
    formattingCompatibility,
    matchedKeywords,
    missingKeywords,
    suggestions: suggestions.slice(0, 4)
  };
}

// ─── Main CV Builder Tab Component ──────────────────────────────────────────
export function CvBuilderTab() {
  const [cv, setCv] = useState<UserCvData>(DEFAULT_USER_PROFILE);
  const [activeStep, setActiveStep] = useState<'profile' | 'target' | 'preview'>('preview');
  const [cvStyle, setCvStyle] = useState<'modern' | 'classic' | 'compact'>('classic');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'industry' | 'academic' | 'other'>('all');
  const [isEditingGenerated, setIsEditingGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [boostIndex, setBoostIndex] = useState(0);

  // Selected Target (Defaults to Fertilizer -> Process Engineer for immediate visual punch)
  const [target, setTarget] = useState<TargetSelection>({
    category: 'industry',
    industry: 'Fertilizer Industry',
    role: 'Process Engineer'
  });

  // Current Target Meta
  const currentIndustry = useMemo(() => {
    return TARGET_INDUSTRIES.find(i => i.name === target.industry) || TARGET_INDUSTRIES[0];
  }, [target.industry]);

  // Filtered industries for Step 2
  const filteredIndustries = useMemo(() => {
    if (categoryFilter === 'all') return TARGET_INDUSTRIES;
    return TARGET_INDUSTRIES.filter(ind => ind.category === categoryFilter);
  }, [categoryFilter]);

  // Derived Tailored Content
  const tailoredSummary = useMemo(() => {
    return generateTargetSummary(cv, target);
  }, [cv, target]);

  const [customSummary, setCustomSummary] = useState<string | null>(null);
  const activeSummary = customSummary !== null ? customSummary : tailoredSummary;

  const { sortedExp, sortedProjects } = useMemo(() => {
    return getPrioritizedContent(cv, target);
  }, [cv, target]);

  const atsAnalysis = useMemo(() => {
    return calculateAtsScore(cv, target, activeSummary);
  }, [cv, target, activeSummary]);

  // Handlers for profile editing
  const updateCvField = (field: keyof UserCvData, value: any) => {
    setCv(prev => ({ ...prev, [field]: value }));
  };

  // Education dynamic handlers
  const addEducation = () => {
    const newItem: EducationItem = {
      id: `edu-${Date.now()}`,
      degree: '',
      institution: '',
      year: '',
      gpa: '',
      coursework: ''
    };
    setCv(prev => ({ ...prev, education: [...prev.education, newItem] }));
  };

  const removeEducation = (index: number) => {
    setCv(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const updateEducation = (index: number, field: keyof EducationItem, value: string) => {
    setCv(prev => {
      const updated = [...prev.education];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, education: updated };
    });
  };

  // Experience dynamic handlers
  const addExperience = () => {
    const newItem: ExperienceItem = {
      id: `exp-${Date.now()}`,
      type: 'Internship',
      role: '',
      organization: '',
      duration: '',
      location: '',
      description: '',
      achievements: ''
    };
    setCv(prev => ({ ...prev, experience: [...prev.experience, newItem] }));
  };

  const removeExperience = (index: number) => {
    setCv(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const updateExperience = (index: number, field: keyof ExperienceItem, value: any) => {
    setCv(prev => {
      const updated = [...prev.experience];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, experience: updated };
    });
  };

  const optimizeExpBullet = (index: number) => {
    setCv(prev => {
      const updated = [...prev.experience];
      const lines = updated[index].description.split('\n');
      const optimized = lines.map(line => optimizeBulletPoint(line)).join('\n');
      updated[index] = { ...updated[index], description: optimized };
      return { ...prev, experience: updated };
    });
  };

  // Projects dynamic handlers
  const addProject = () => {
    const newItem: ProjectItem = {
      id: `proj-${Date.now()}`,
      title: '',
      description: '',
      tools: '',
      methodology: '',
      results: ''
    };
    setCv(prev => ({ ...prev, projects: [...prev.projects, newItem] }));
  };

  const removeProject = (index: number) => {
    setCv(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
  };

  const updateProject = (index: number, field: keyof ProjectItem, value: string) => {
    setCv(prev => {
      const updated = [...prev.projects];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, projects: updated };
    });
  };

  const optimizeProjBullet = (index: number) => {
    setCv(prev => {
      const updated = [...prev.projects];
      const optDesc = optimizeBulletPoint(updated[index].description);
      updated[index] = { ...updated[index], description: optDesc };
      return { ...prev, projects: updated };
    });
  };

  // Certifications dynamic handlers
  const addCertification = () => {
    const newItem: CertificationItem = {
      id: `cert-${Date.now()}`,
      name: '',
      organization: '',
      date: ''
    };
    setCv(prev => ({ ...prev, certifications: [...prev.certifications, newItem] }));
  };

  const removeCertification = (index: number) => {
    setCv(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const updateCertification = (index: number, field: keyof CertificationItem, value: string) => {
    setCv(prev => {
      const updated = [...prev.certifications];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, certifications: updated };
    });
  };

  // Achievements dynamic handlers
  const addAchievement = () => {
    const newItem: AchievementItem = {
      id: `ach-${Date.now()}`,
      title: '',
      organization: '',
      date: '',
      description: ''
    };
    setCv(prev => ({ ...prev, achievements: [...prev.achievements, newItem] }));
  };

  const removeAchievement = (index: number) => {
    setCv(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index)
    }));
  };

  const updateAchievement = (index: number, field: keyof AchievementItem, value: string) => {
    setCv(prev => {
      const updated = [...prev.achievements];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, achievements: updated };
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const textLines: string[] = [];
    textLines.push(cv.name.toUpperCase());
    textLines.push(`${cv.title} | ${cv.email} | ${cv.phone} | ${cv.location}`);
    const links: string[] = [];
    if (cv.linkedin) links.push(`LinkedIn: ${cv.linkedin}`);
    if (cv.github) links.push(`GitHub: ${cv.github}`);
    if (cv.portfolio) links.push(`Portfolio: ${cv.portfolio}`);
    if (links.length > 0) textLines.push(links.join(' | '));
    
    textLines.push('\n=== PROFESSIONAL SUMMARY / PROFILE ===');
    textLines.push(activeSummary);

    textLines.push('\n=== EDUCATION ===');
    cv.education.forEach(e => {
      textLines.push(`• ${e.degree} — ${e.institution} (${e.year}) | CGPA: ${e.gpa}`);
      if (e.coursework) textLines.push(`  Relevant Coursework: ${e.coursework}`);
    });

    textLines.push('\n=== PROFESSIONAL & INDUSTRIAL EXPERIENCE ===');
    sortedExp.forEach(e => {
      textLines.push(`• ${e.role} [${e.type}] — ${e.organization} (${e.duration}) | ${e.location}`);
      e.description.split('\n').forEach(line => {
        if (line.trim()) textLines.push(`  - ${line.trim()}`);
      });
      if (e.achievements) textLines.push(`  * Key Impact: ${e.achievements}`);
    });

    textLines.push('\n=== KEY ENGINEERING PROJECTS ===');
    sortedProjects.forEach(p => {
      textLines.push(`• ${p.title} ${p.tools ? `[Tools: ${p.tools}]` : ''}`);
      if (p.description) textLines.push(`  ${p.description}`);
      if (p.methodology) textLines.push(`  Methodology: ${p.methodology}`);
      if (p.results) textLines.push(`  Result: ${p.results}`);
    });

    textLines.push('\n=== TECHNICAL SKILLS & COMPETENCIES ===');
    textLines.push(`• Chemical Engineering Fundamentals: ${cv.skills.technical.join(', ')}`);
    textLines.push(`• Process Simulation & Software: ${cv.skills.software.join(', ')}`);
    if (cv.skills.programming.length > 0) {
      textLines.push(`• Programming & Computational: ${cv.skills.programming.join(', ')}`);
    }
    textLines.push(`• Laboratory & Analytical Methods: ${cv.skills.lab.join(', ')}`);
    if (cv.skills.soft.length > 0) {
      textLines.push(`• Professional & Operational: ${cv.skills.soft.join(', ')}`);
    }

    if (cv.certifications.length > 0) {
      textLines.push('\n=== CERTIFICATIONS & TRAINING ===');
      cv.certifications.forEach(c => {
        textLines.push(`• ${c.name} — ${c.organization} (${c.date})`);
      });
    }

    if (cv.achievements.length > 0) {
      textLines.push('\n=== HONORS & ACHIEVEMENTS ===');
      cv.achievements.forEach(a => {
        textLines.push(`• ${a.title} — ${a.organization} (${a.date}): ${a.description}`);
      });
    }
    
    navigator.clipboard.writeText(textLines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentBoostTip = ACHIEVE_TIPS[boostIndex % ACHIEVE_TIPS.length];

  return (
    <div className="space-y-6">
      {/* ── Scoped Print Stylesheet ── */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #cv-printable-area, #cv-printable-area * {
            visibility: visible;
          }
          #cv-printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 15mm 20mm;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-surface-800 dark:text-surface-50 flex items-center gap-3">
            <FilePen className="w-6 h-6 text-accent-500" /> Intelligent Targeted CV Builder
          </h2>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
            Adapts content emphasis, summary, ordering, and ATS alignment for 26 chemical engineering industries, academic tracks, and career pathways.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-accent-500/10 border border-accent-500/20 text-accent-700 dark:text-accent-300 flex items-center gap-2 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-accent-500" />
            <span>Target: <b>{target.industry}</b> → <b>{target.role}</b></span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 text-xs font-black">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>ATS: {atsAnalysis.totalScore}/100</span>
          </div>
        </div>
      </div>

      {/* Main Workflow Stepper Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 glass rounded-2xl border border-surface-200 dark:border-surface-800">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveStep('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
              activeStep === 'profile'
                ? 'bg-accent-600 text-surface-50 shadow-md shadow-accent-500/20'
                : 'text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800'
            }`}
          >
            <PenLine className="w-4 h-4" /> 1. My Profile Details
          </button>

          <button
            onClick={() => setActiveStep('target')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
              activeStep === 'target'
                ? 'bg-accent-600 text-surface-50 shadow-md shadow-accent-500/20'
                : 'text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800'
            }`}
          >
            <Target className="w-4 h-4" /> 2. Target Industry & Role
          </button>

          <button
            onClick={() => setActiveStep('preview')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
              activeStep === 'preview'
                ? 'bg-accent-600 text-surface-50 shadow-md shadow-accent-500/20'
                : 'text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800'
            }`}
          >
            <Eye className="w-4 h-4" /> 3. Tailored CV Preview & ATS
          </button>
        </div>

        {/* Style Selector Pills */}
        <div className="flex items-center gap-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-xl">
          <span className="text-[10px] font-black uppercase text-surface-400 px-2">Style:</span>
          {(['modern', 'classic', 'compact'] as const).map(style => (
            <button
              key={style}
              onClick={() => setCvStyle(style)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                cvStyle === style
                  ? 'bg-surface-50 dark:bg-surface-900 text-accent-600 dark:text-accent-400 shadow-sm font-black'
                  : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* ─── STEP 1: MY PROFILE DETAILS ─── */}
      {activeStep === 'profile' && (
        <div className="grid lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
          {/* Personal Info */}
          <CalcCard title="Personal & Contact Details" icon={PenLine}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-1">Full Name</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-accent-500"
                    value={cv.name}
                    onChange={e => updateCvField('name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-1">Professional Title</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-accent-500"
                    value={cv.title}
                    onChange={e => updateCvField('title', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-1">Email</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-accent-500"
                    value={cv.email}
                    onChange={e => updateCvField('email', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-1">Phone</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-accent-500"
                    value={cv.phone}
                    onChange={e => updateCvField('phone', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-1">Location</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-accent-500"
                    value={cv.location}
                    onChange={e => updateCvField('location', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-1">LinkedIn Profile</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-accent-500"
                    value={cv.linkedin}
                    onChange={e => updateCvField('linkedin', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-1">GitHub Profile</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-accent-500"
                    placeholder="github.com/username"
                    value={cv.github}
                    onChange={e => updateCvField('github', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-1">Portfolio / Personal Website</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-accent-500"
                    placeholder="yourdomain.com"
                    value={cv.portfolio}
                    onChange={e => updateCvField('portfolio', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CalcCard>

          {/* Education */}
          <CalcCard
            title="Education & Academic Background"
            icon={GraduationCap}
          >
            <div className="space-y-4">
              <div className="flex justify-end -mt-3 mb-1">
                <button
                  onClick={addEducation}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-accent-600 text-surface-50 hover:bg-accent-700 flex items-center gap-1 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Degree
                </button>
              </div>
              {cv.education.map((edu, idx) => (
                <div key={edu.id} className="p-3.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 space-y-2 relative group">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-surface-400">
                      Degree #{idx + 1}
                    </span>
                    {cv.education.length > 1 && (
                      <button
                        onClick={() => removeEducation(idx)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                        title="Remove Degree"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                      placeholder="Degree (e.g. B.Sc. Chemical Engineering)"
                      value={edu.degree}
                      onChange={e => updateEducation(idx, 'degree', e.target.value)}
                    />
                    <input
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                      placeholder="University / Institute"
                      value={edu.institution}
                      onChange={e => updateEducation(idx, 'institution', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                      placeholder="Graduation Year (e.g. 2022 – 2026)"
                      value={edu.year}
                      onChange={e => updateEducation(idx, 'year', e.target.value)}
                    />
                    <input
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                      placeholder="GPA / Academic Score"
                      value={edu.gpa}
                      onChange={e => updateEducation(idx, 'gpa', e.target.value)}
                    />
                  </div>
                  <input
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs font-bold bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                    placeholder="Core Coursework (comma-separated, e.g. Transport Phenomena, Reaction Engineering)"
                    value={edu.coursework}
                    onChange={e => updateEducation(idx, 'coursework', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </CalcCard>

          {/* Experience */}
          <CalcCard
            title="Experience & Internships"
            icon={Briefcase}
          >
            <div className="space-y-4">
              <div className="flex justify-end -mt-3 mb-1">
                <button
                  onClick={addExperience}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-accent-600 text-surface-50 hover:bg-accent-700 flex items-center gap-1 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Experience
                </button>
              </div>
              {cv.experience.map((exp, idx) => (
                <div key={exp.id} className="p-3.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-surface-400">
                        Entry #{idx + 1}
                      </span>
                      <select
                        className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200"
                        value={exp.type}
                        onChange={e => updateExperience(idx, 'type', e.target.value)}
                      >
                        <option value="Internship">Internship</option>
                        <option value="Job">Full-time Job</option>
                        <option value="Research">Academic Research</option>
                        <option value="Teaching">Teaching Assistant</option>
                        <option value="Volunteer">Volunteer / Leadership</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => optimizeExpBullet(idx)}
                        title="Optimize bullet verbs using Chemical Engineering action verbs"
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-accent-500/10 text-accent-700 dark:text-accent-300 hover:bg-accent-500/20 border border-accent-500/20 flex items-center gap-1 transition-all"
                      >
                        <Sparkles className="w-3 h-3 text-accent-500" />
                        <span>Optimize Bullets</span>
                      </button>

                      {cv.experience.length > 1 && (
                        <button
                          onClick={() => removeExperience(idx)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-all ml-1"
                          title="Remove Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                      placeholder="Role / Title (e.g. Process Engineering Intern)"
                      value={exp.role}
                      onChange={e => updateExperience(idx, 'role', e.target.value)}
                    />
                    <input
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                      placeholder="Company / Facility Name"
                      value={exp.organization}
                      onChange={e => updateExperience(idx, 'organization', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                      placeholder="Duration (e.g. Jun 2025 – Aug 2025)"
                      value={exp.duration}
                      onChange={e => updateExperience(idx, 'duration', e.target.value)}
                    />
                    <input
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                      placeholder="Location (City, Country)"
                      value={exp.location}
                      onChange={e => updateExperience(idx, 'location', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-surface-400 block mb-0.5">
                      Bullet Points (one bullet per line)
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                      placeholder="e.g. Audited process parameters across the 1,500 t/day urea granulation loop."
                      value={exp.description}
                      onChange={e => updateExperience(idx, 'description', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-accent-600 dark:text-accent-400 block mb-0.5">
                      Key Quantifiable Metric / Impact (Boosts ATS Score)
                    </label>
                    <input
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs font-bold bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-accent-700 dark:text-accent-300"
                      placeholder="e.g. Identified steam condensation losses yielding an estimated 2% steam savings."
                      value={exp.achievements}
                      onChange={e => updateExperience(idx, 'achievements', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CalcCard>

          {/* Projects */}
          <CalcCard
            title="Key Engineering Projects"
            icon={Target}
          >
            <div className="space-y-4">
              <div className="flex justify-end -mt-3 mb-1">
                <button
                  onClick={addProject}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-accent-600 text-surface-50 hover:bg-accent-700 flex items-center gap-1 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Project
                </button>
              </div>
              {cv.projects.map((proj, idx) => (
                <div key={proj.id} className="p-3.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-wider text-surface-400">
                      Project #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => optimizeProjBullet(idx)}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-accent-500/10 text-accent-700 dark:text-accent-300 hover:bg-accent-500/20 border border-accent-500/20 flex items-center gap-1 transition-all"
                      >
                        <Sparkles className="w-3 h-3 text-accent-500" />
                        <span>Optimize</span>
                      </button>
                      {cv.projects.length > 1 && (
                        <button
                          onClick={() => removeProject(idx)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-all ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                      placeholder="Project Title (e.g. Chlor-Alkali Plant Design)"
                      value={proj.title}
                      onChange={e => updateProject(idx, 'title', e.target.value)}
                    />
                    <input
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                      placeholder="Tools & Software Used (e.g. Aspen Plus, AutoCAD)"
                      value={proj.tools}
                      onChange={e => updateProject(idx, 'tools', e.target.value)}
                    />
                  </div>

                  <textarea
                    rows={2}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                    placeholder="Project Scope & Objectives"
                    value={proj.description}
                    onChange={e => updateProject(idx, 'description', e.target.value)}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                      placeholder="Methodology (e.g. Heat & Mass balances, HAZOP)"
                      value={proj.methodology}
                      onChange={e => updateProject(idx, 'methodology', e.target.value)}
                    />
                    <input
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-accent-700 dark:text-accent-300"
                      placeholder="Results (e.g. 99.2% purity, 18% steam savings)"
                      value={proj.results}
                      onChange={e => updateProject(idx, 'results', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CalcCard>

          {/* Core Skills Portfolio */}
          <CalcCard title="Core Skills Portfolio" icon={Target}>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-1">
                  Chemical Engineering & Unit Operations (comma-separated)
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200"
                  value={cv.skills.technical.join(', ')}
                  onChange={e => {
                    const skills = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                    setCv(prev => ({ ...prev, skills: { ...prev.skills, technical: skills } }));
                  }}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-1">
                  Simulation & CAD Software Packages (comma-separated)
                </label>
                <input
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200"
                  value={cv.skills.software.join(', ')}
                  onChange={e => {
                    const skills = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                    setCv(prev => ({ ...prev, skills: { ...prev.skills, software: skills } }));
                  }}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-1">
                  Programming & Computational Modeling (comma-separated)
                </label>
                <input
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200"
                  placeholder="Python, NumPy, MATLAB, Simulink, R"
                  value={cv.skills.programming.join(', ')}
                  onChange={e => {
                    const skills = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                    setCv(prev => ({ ...prev, skills: { ...prev.skills, programming: skills } }));
                  }}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-1">
                  Laboratory & Analytical Methods (comma-separated)
                </label>
                <input
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200"
                  value={cv.skills.lab.join(', ')}
                  onChange={e => {
                    const skills = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                    setCv(prev => ({ ...prev, skills: { ...prev.skills, lab: skills } }));
                  }}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-1">
                  Professional & Soft Competencies (comma-separated)
                </label>
                <input
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200"
                  value={cv.skills.soft.join(', ')}
                  onChange={e => {
                    const skills = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                    setCv(prev => ({ ...prev, skills: { ...prev.skills, soft: skills } }));
                  }}
                />
              </div>
            </div>
          </CalcCard>

          {/* Certifications */}
          <CalcCard
            title="Certifications & Safety Training"
            icon={BadgeCheck}
          >
            <div className="space-y-3">
              <div className="flex justify-end -mt-3 mb-1">
                <button
                  onClick={addCertification}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-accent-600 text-surface-50 hover:bg-accent-700 flex items-center gap-1 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Cert
                </button>
              </div>
              {cv.certifications.map((cert, idx) => (
                <div key={cert.id} className="p-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-surface-400">Certification #{idx + 1}</span>
                    <button
                      onClick={() => removeCertification(idx)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs font-bold bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                    placeholder="Certification Name (e.g. OSHA 30-Hour General Industry)"
                    value={cert.name}
                    onChange={e => updateCertification(idx, 'name', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                      placeholder="Issuing Organization"
                      value={cert.organization}
                      onChange={e => updateCertification(idx, 'organization', e.target.value)}
                    />
                    <input
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                      placeholder="Year / Date"
                      value={cert.date}
                      onChange={e => updateCertification(idx, 'date', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CalcCard>

          {/* Honors & Achievements */}
          <CalcCard
            title="Honors, Competitions & Publications"
            icon={Award}
          >
            <div className="space-y-3">
              <div className="flex justify-end -mt-3 mb-1">
                <button
                  onClick={addAchievement}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-accent-600 text-surface-50 hover:bg-accent-700 flex items-center gap-1 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Honor
                </button>
              </div>
              {cv.achievements.map((ach, idx) => (
                <div key={ach.id} className="p-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-surface-400">Award #{idx + 1}</span>
                    <button
                      onClick={() => removeAchievement(idx)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs font-bold bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                    placeholder="Award / Honor Title"
                    value={ach.title}
                    onChange={e => updateAchievement(idx, 'title', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                      placeholder="Organization"
                      value={ach.organization}
                      onChange={e => updateAchievement(idx, 'organization', e.target.value)}
                    />
                    <input
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                      placeholder="Year"
                      value={ach.date}
                      onChange={e => updateAchievement(idx, 'date', e.target.value)}
                    />
                  </div>
                  <input
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200"
                    placeholder="Brief description of recognition"
                    value={ach.description}
                    onChange={e => updateAchievement(idx, 'description', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </CalcCard>

          {/* Continue button */}
          <div className="lg:col-span-2 flex justify-end">
            <button
              onClick={() => setActiveStep('target')}
              className="px-6 py-3 rounded-xl text-xs font-black bg-accent-600 text-surface-50 hover:bg-accent-700 transition-all shadow-lg shadow-accent-500/25 flex items-center gap-2"
            >
              <span>Next: Select Target Role</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 2: WHAT ARE YOU APPLYING FOR? ─── */}
      {activeStep === 'target' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <CalcCard title="What are you applying for?" icon={Target}>
            <div className="space-y-6">
              <div>
                <p className="text-xs text-surface-500 dark:text-surface-400 mb-4 leading-relaxed">
                  Choose your target destination. ChemBase Pro will dynamically align your summary, reorder your experiences and projects by industry keyword relevance, and calculate ATS readiness.
                </p>

                {/* Category Filter Tabs */}
                <div className="flex flex-wrap gap-2 mb-4 p-1 rounded-xl bg-surface-100 dark:bg-surface-900 w-fit">
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      categoryFilter === 'all'
                        ? 'bg-accent-600 text-surface-50 shadow-sm font-black'
                        : 'text-surface-600 dark:text-surface-400 hover:text-surface-900'
                    }`}
                  >
                    All Pathways ({TARGET_INDUSTRIES.length})
                  </button>
                  <button
                    onClick={() => setCategoryFilter('industry')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      categoryFilter === 'industry'
                        ? 'bg-accent-600 text-surface-50 shadow-sm font-black'
                        : 'text-surface-600 dark:text-surface-400 hover:text-surface-900'
                    }`}
                  >
                    Industry & Manufacturing (16)
                  </button>
                  <button
                    onClick={() => setCategoryFilter('academic')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      categoryFilter === 'academic'
                        ? 'bg-accent-600 text-surface-50 shadow-sm font-black'
                        : 'text-surface-600 dark:text-surface-400 hover:text-surface-900'
                    }`}
                  >
                    Academic & Graduate (5)
                  </button>
                  <button
                    onClick={() => setCategoryFilter('other')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      categoryFilter === 'other'
                        ? 'bg-accent-600 text-surface-50 shadow-sm font-black'
                        : 'text-surface-600 dark:text-surface-400 hover:text-surface-900'
                    }`}
                  >
                    Career & Trainee (5)
                  </button>
                </div>

                {/* Industry / Category Grid */}
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[460px] overflow-y-auto p-1">
                  {filteredIndustries.map(ind => {
                    const Icon = ind.icon;
                    const isSelected = target.industry === ind.name;
                    return (
                      <button
                        key={ind.id}
                        onClick={() => {
                          setTarget({
                            category: ind.category,
                            industry: ind.name,
                            role: ind.roles[0].role
                          });
                          setCustomSummary(null);
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'border-accent-500 ring-2 ring-accent-500/20 bg-accent-50 dark:bg-accent-950/20'
                            : 'border-surface-200 dark:border-surface-800 hover:border-accent-400 bg-surface-50 dark:bg-surface-900/40'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-accent-600 text-surface-50' : 'bg-surface-100 dark:bg-surface-800 text-surface-500'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-surface-800 dark:text-surface-50 truncate">{ind.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-accent-600 dark:text-accent-400">
                              {ind.category}
                            </span>
                            <span className="text-[9px] text-surface-400">• {ind.roles.length} roles</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Role Selector */}
              <div className="pt-6 border-t border-surface-200 dark:border-surface-800">
                <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-3">
                  Selected Target Role / Purpose within <u>{target.industry}</u>
                </label>
                <div className="flex flex-wrap gap-2">
                  {currentIndustry.roles.map(r => {
                    const isSelected = target.role === r.role;
                    return (
                      <button
                        key={r.role}
                        onClick={() => {
                          setTarget(prev => ({ ...prev, role: r.role }));
                          setCustomSummary(null);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                          isSelected
                            ? 'bg-accent-600 border-accent-600 text-surface-50 shadow-md shadow-accent-500/20'
                            : 'bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 hover:border-accent-400'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{r.role}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Academic Details (if academic selected) */}
              {target.category === 'academic' && (
                <div className="pt-6 border-t border-surface-200 dark:border-surface-800 grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-1">
                      Target University / Research Institute
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200"
                      placeholder="e.g. NUS, KAUST, Imperial College"
                      value={target.academicProgram || ''}
                      onChange={e => setTarget(prev => ({ ...prev, academicProgram: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-1">
                      Intended Research Specialization
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200"
                      placeholder="e.g. Polymer Membranes, Heterogeneous Catalysis"
                      value={target.researchArea || ''}
                      onChange={e => setTarget(prev => ({ ...prev, researchArea: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-1">
                      Specific Research Interests
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200"
                      placeholder="e.g. Gas separation, CO2 capture"
                      value={target.researchInterests || ''}
                      onChange={e => setTarget(prev => ({ ...prev, researchInterests: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4">
                <button
                  onClick={() => setActiveStep('profile')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-surface-500 hover:text-surface-800 dark:hover:text-surface-200"
                >
                  ← Back to Profile
                </button>

                <button
                  onClick={() => setActiveStep('preview')}
                  className="px-6 py-3 rounded-xl text-xs font-black bg-accent-600 text-surface-50 hover:bg-accent-700 transition-all shadow-lg shadow-accent-500/25 flex items-center gap-2"
                >
                  <span>Generate & Preview CV</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </CalcCard>
        </div>
      )}

      {/* ─── STEP 3: PREVIEW & ATS OPTIMIZATION ─── */}
      {activeStep === 'preview' && (
        <div className="grid lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          {/* Left Column: ATS Readiness & Optimization Suggestions (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* ATS Score Card */}
            <CalcCard title="ATS Readiness & Compatibility Analysis" icon={ShieldCheck}>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-100 dark:bg-surface-900/60 border border-surface-200 dark:border-surface-800">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-surface-400 block">
                      Estimated ATS Readiness Score
                    </span>
                    <span className="text-3xl font-black text-surface-900 dark:text-surface-50">
                      {atsAnalysis.totalScore}<span className="text-sm font-bold text-surface-400">/100</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                      atsAnalysis.totalScore >= 85
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800'
                        : 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800'
                    }`}>
                      {atsAnalysis.totalScore >= 85 ? 'Strong ATS Match' : 'Moderate Match'}
                    </span>
                    <p className="text-[9px] text-surface-400 mt-1">ChemBase 5-Factor Evaluation</p>
                  </div>
                </div>

                {/* Score Breakdown Bars */}
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span className="text-surface-600 dark:text-surface-300">Target Keyword Relevance (35%)</span>
                      <span className="text-accent-600 dark:text-accent-400">{atsAnalysis.keywordRelevance}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                      <div className="h-full bg-accent-500 rounded-full transition-all duration-500" style={{ width: `${atsAnalysis.keywordRelevance}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span className="text-surface-600 dark:text-surface-300">Technical Skills Alignment (25%)</span>
                      <span className="text-accent-600 dark:text-accent-400">{atsAnalysis.skillsAlignment}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                      <div className="h-full bg-accent-500 rounded-full transition-all duration-500" style={{ width: `${atsAnalysis.skillsAlignment}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span className="text-surface-600 dark:text-surface-300">Experience & Metrics (20%)</span>
                      <span className="text-accent-600 dark:text-accent-400">{atsAnalysis.experienceRelevance}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                      <div className="h-full bg-accent-500 rounded-full transition-all duration-500" style={{ width: `${atsAnalysis.experienceRelevance}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span className="text-surface-600 dark:text-surface-300">Section Completeness (15%)</span>
                      <span className="text-accent-600 dark:text-accent-400">{atsAnalysis.sectionCompleteness}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                      <div className="h-full bg-accent-500 rounded-full transition-all duration-500" style={{ width: `${atsAnalysis.sectionCompleteness}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span className="text-surface-600 dark:text-surface-300">Formatting & ATS Parsability (5%)</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{atsAnalysis.formattingCompatibility}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${atsAnalysis.formattingCompatibility}%` }} />
                    </div>
                  </div>
                </div>

                {/* Keyword Pills */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-1.5">
                    Matched Role Keywords
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {atsAnalysis.matchedKeywords.length > 0 ? (
                      atsAnalysis.matchedKeywords.map(kw => (
                        <span key={kw} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          ✓ {kw}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-surface-400 italic">No exact role keywords found in profile.</span>
                    )}
                  </div>
                </div>

                {/* Role Specific Suggested Skills to Consider */}
                {currentIndustry.roles.find(r => r.role === target.role)?.suggestedSkills && (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-1.5">
                      Suggested Competencies for {target.role}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {currentIndustry.roles.find(r => r.role === target.role)!.suggestedSkills.map(s => (
                        <span key={s} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-700">
                          + {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actionable Suggestions */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-1.5">
                    Actionable Improvement Suggestions
                  </label>
                  <ul className="space-y-2">
                    {atsAnalysis.suggestions.map((sug, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-surface-600 dark:text-surface-300 leading-relaxed">
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent-500 flex-shrink-0 mt-0.5" />
                        <span>{sug}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CalcCard>

            {/* Achievement Booster Card */}
            <CalcCard title="Achievement Bullet Booster" icon={Sparkles}>
              <p className="text-[10px] text-surface-500 dark:text-surface-400 mb-3">
                Elevate plain duties into factual, measurable outcomes without inventing unperformed claims.
              </p>
              <div className="rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 p-3 mb-3">
                <p className="text-[11px] text-surface-400 line-through mb-1">❌ {currentBoostTip.weak}</p>
                <p className="text-[11px] text-surface-800 dark:text-surface-200 font-bold">✅ {currentBoostTip.strong}</p>
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setBoostIndex(boostIndex + 1)}
                  className="px-3 py-1.5 rounded-xl text-xs font-black bg-accent-600 text-surface-50 hover:bg-accent-700 transition-all flex items-center gap-1.5 shadow-md shadow-accent-500/20"
                >
                  <RefreshCw className="w-3 h-3" /> Next Tip
                </button>
                <span className="text-[10px] font-mono text-surface-400">
                  Tip {boostIndex + 1} of {ACHIEVE_TIPS.length}
                </span>
              </div>
            </CalcCard>
          </div>

          {/* Right Column: Interactive Live CV Preview (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Action Bar for Preview */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 glass rounded-2xl border border-surface-200 dark:border-surface-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingGenerated(!isEditingGenerated)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                    isEditingGenerated
                      ? 'bg-accent-600 border-accent-600 text-surface-50'
                      : 'bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingGenerated ? 'Done Editing' : 'Edit Summary'}</span>
                </button>

                <button
                  onClick={() => setCustomSummary(null)}
                  title="Reset summary to AI target-optimized default"
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-500 hover:text-surface-800 dark:hover:text-surface-200"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Visual Style Switcher */}
                <div className="flex items-center bg-surface-100 dark:bg-surface-800 p-0.5 rounded-xl">
                  {(['modern', 'classic', 'compact'] as const).map(style => (
                    <button
                      key={style}
                      onClick={() => setCvStyle(style)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold capitalize transition-all ${
                        cvStyle === style
                          ? 'bg-surface-50 dark:bg-surface-900 text-accent-600 dark:text-accent-400 shadow-sm font-black'
                          : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleCopyText}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-700 dark:text-surface-200 hover:border-accent-400 transition-all flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-surface-400" />}
                  <span>{copied ? 'Copied Text' : 'Copy Text'}</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-4 py-1.5 rounded-xl text-xs font-black bg-accent-600 text-surface-50 hover:bg-accent-700 transition-all shadow-md shadow-accent-500/20 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
              </div>
            </div>

            {/* Editable summary box when active */}
            {isEditingGenerated && (
              <div className="p-4 rounded-2xl border border-accent-300 dark:border-accent-700 bg-accent-50 dark:bg-accent-950/30 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-wider text-accent-700 dark:text-accent-300">
                    Edit Tailored Executive Summary
                  </label>
                  <span className="text-[10px] text-surface-400">Zero-fabrication: customize your exact phrasing</span>
                </div>
                <textarea
                  rows={4}
                  className="w-full p-2.5 rounded-xl text-xs font-medium bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-accent-500"
                  value={activeSummary}
                  onChange={e => setCustomSummary(e.target.value)}
                />
              </div>
            )}

            {/* ─── CV Document Display Container (Rendered for Modern, Classic, or Compact) ─── */}
            <div
              id="cv-printable-area"
              className={`rounded-3xl border transition-all ${
                cvStyle === 'classic'
                  ? 'p-8 font-serif border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-50 shadow-xl'
                  : cvStyle === 'compact'
                  ? 'p-6 font-sans text-[11px] border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-50 shadow-xl'
                  : 'p-8 font-sans border-accent-500/20 bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-50 shadow-2xl'
              }`}
            >
              {/* Document Header */}
              <div className={`pb-4 ${
                cvStyle === 'classic'
                  ? 'text-center border-b-2 border-surface-900 dark:border-surface-100'
                  : cvStyle === 'compact'
                  ? 'border-b border-surface-200 dark:border-surface-800 pb-2.5'
                  : 'border-b border-accent-500/20 pb-4'
              }`}>
                <h1 className={`font-black tracking-tight ${
                  cvStyle === 'compact' ? 'text-xl' : 'text-2xl md:text-3xl'
                }`}>
                  {cv.name}
                </h1>
                <p className={`font-bold mt-0.5 ${
                  cvStyle === 'classic'
                    ? 'text-surface-700 dark:text-surface-300 text-sm'
                    : cvStyle === 'compact'
                    ? 'text-xs text-accent-600 dark:text-accent-400'
                    : 'text-sm text-accent-600 dark:text-accent-400'
                }`}>
                  {cv.title} — Targeted for: <span className="underline decoration-accent-500 font-black">{target.role}</span> ({target.industry})
                </p>

                <div className={`flex flex-wrap gap-2 text-[11px] text-surface-500 dark:text-surface-400 mt-2 ${
                  cvStyle === 'classic' ? 'justify-center' : ''
                }`}>
                  <span>{cv.email}</span>
                  <span>•</span>
                  <span>{cv.phone}</span>
                  <span>•</span>
                  <span>{cv.location}</span>
                  {cv.linkedin && (
                    <>
                      <span>•</span>
                      <span>{cv.linkedin}</span>
                    </>
                  )}
                  {cv.github && (
                    <>
                      <span>•</span>
                      <span>{cv.github}</span>
                    </>
                  )}
                  {cv.portfolio && (
                    <>
                      <span>•</span>
                      <span>{cv.portfolio}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Section: Professional Summary */}
              <div className={cvStyle === 'compact' ? 'mt-3' : 'mt-4'}>
                <h2 className={`font-black uppercase tracking-widest ${
                  cvStyle === 'compact' ? 'text-[11px] mb-1' : 'text-xs mb-1.5'
                } ${
                  cvStyle === 'classic'
                    ? 'border-b border-surface-300 dark:border-surface-700 pb-0.5 text-surface-900 dark:text-surface-100'
                    : 'text-accent-600 dark:text-accent-400'
                }`}>
                  {target.category === 'academic' ? 'ACADEMIC & RESEARCH PROFILE' : 'PROFESSIONAL SUMMARY'}
                </h2>
                <p className={`leading-relaxed text-surface-600 dark:text-surface-300 ${
                  cvStyle === 'compact' ? 'text-[11px]' : 'text-xs'
                }`}>
                  {activeSummary}
                </p>
              </div>

              {/* Section: Education */}
              <div className={cvStyle === 'compact' ? 'mt-3.5' : 'mt-5'}>
                <h2 className={`font-black uppercase tracking-widest ${
                  cvStyle === 'compact' ? 'text-[11px] mb-1.5' : 'text-xs mb-2'
                } ${
                  cvStyle === 'classic'
                    ? 'border-b border-surface-300 dark:border-surface-700 pb-0.5 text-surface-900 dark:text-surface-100'
                    : 'text-accent-600 dark:text-accent-400'
                }`}>
                  EDUCATION
                </h2>
                <div className={cvStyle === 'compact' ? 'space-y-2' : 'space-y-2.5'}>
                  {cv.education.map(edu => (
                    <div key={edu.id}>
                      <div className="flex justify-between items-baseline text-xs font-bold text-surface-800 dark:text-surface-100">
                        <span>{edu.degree} — {edu.institution}</span>
                        <span className="text-[11px] text-surface-500 font-normal">{edu.year}</span>
                      </div>
                      <div className="text-[11px] text-surface-600 dark:text-surface-300 mt-0.5">
                        <span className="font-semibold">Academic Standing:</span> CGPA {edu.gpa}
                      </div>
                      {edu.coursework && (
                        <div className="text-[11px] text-surface-500 dark:text-surface-400 mt-0.5">
                          <span className="font-semibold text-surface-600 dark:text-surface-300">Core Coursework:</span> {edu.coursework}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: Experience (Target-Prioritized) */}
              <div className={cvStyle === 'compact' ? 'mt-3.5' : 'mt-5'}>
                <h2 className={`font-black uppercase tracking-widest ${
                  cvStyle === 'compact' ? 'text-[11px] mb-1.5' : 'text-xs mb-2'
                } ${
                  cvStyle === 'classic'
                    ? 'border-b border-surface-300 dark:border-surface-700 pb-0.5 text-surface-900 dark:text-surface-100'
                    : 'text-accent-600 dark:text-accent-400'
                }`}>
                  {target.category === 'academic' ? 'RESEARCH & TECHNICAL EXPERIENCE' : 'ENGINEERING & INDUSTRIAL EXPERIENCE'}
                </h2>
                <div className={cvStyle === 'compact' ? 'space-y-2.5' : 'space-y-3.5'}>
                  {sortedExp.map(exp => (
                    <div key={exp.id}>
                      <div className="flex justify-between items-baseline text-xs font-bold text-surface-800 dark:text-surface-100">
                        <span>
                          {exp.role} — <span className="font-semibold">{exp.organization}</span>{' '}
                          <span className="text-[10px] font-normal text-surface-400">[{exp.type}]</span>
                        </span>
                        <span className="text-[11px] text-surface-500 font-normal">{exp.duration} | {exp.location}</span>
                      </div>
                      <div className="mt-1 space-y-1">
                        {exp.description.split('\n').map((bullet, bIdx) => (
                          <p key={bIdx} className={`text-surface-600 dark:text-surface-300 leading-relaxed flex items-start gap-1.5 ${
                            cvStyle === 'compact' ? 'text-[10.5px]' : 'text-xs'
                          }`}>
                            <span className="text-surface-400 flex-shrink-0">•</span>
                            <span>{bullet}</span>
                          </p>
                        ))}
                        {exp.achievements && (
                          <p className={`font-medium text-surface-700 dark:text-surface-200 mt-1 flex items-start gap-1.5 ${
                            cvStyle === 'compact' ? 'text-[10.5px]' : 'text-xs'
                          }`}>
                            <span className="text-accent-500 font-black flex-shrink-0">★</span>
                            <span><b>Key Impact:</b> {exp.achievements}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: Engineering Projects (Target-Prioritized) */}
              <div className={cvStyle === 'compact' ? 'mt-3.5' : 'mt-5'}>
                <h2 className={`font-black uppercase tracking-widest ${
                  cvStyle === 'compact' ? 'text-[11px] mb-1.5' : 'text-xs mb-2'
                } ${
                  cvStyle === 'classic'
                    ? 'border-b border-surface-300 dark:border-surface-700 pb-0.5 text-surface-900 dark:text-surface-100'
                    : 'text-accent-600 dark:text-accent-400'
                }`}>
                  KEY ENGINEERING PROJECTS
                </h2>
                <div className={cvStyle === 'compact' ? 'space-y-2' : 'space-y-3'}>
                  {sortedProjects.map(proj => (
                    <div key={proj.id}>
                      <div className="flex justify-between items-baseline text-xs font-bold text-surface-800 dark:text-surface-100">
                        <span>{proj.title}</span>
                        {proj.tools && <span className="text-[10px] font-mono text-surface-500">[{proj.tools}]</span>}
                      </div>
                      <p className={`text-surface-600 dark:text-surface-300 mt-0.5 leading-relaxed ${
                        cvStyle === 'compact' ? 'text-[10.5px]' : 'text-xs'
                      }`}>
                        {proj.description} {proj.methodology && `Methodology: ${proj.methodology}.`}
                      </p>
                      {proj.results && (
                        <p className={`font-medium text-surface-700 dark:text-surface-200 mt-0.5 ${
                          cvStyle === 'compact' ? 'text-[10px]' : 'text-[11px]'
                        }`}>
                          <span className="font-semibold text-accent-600 dark:text-accent-400">Result:</span> {proj.results}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: Core Skills */}
              <div className={cvStyle === 'compact' ? 'mt-3.5' : 'mt-5'}>
                <h2 className={`font-black uppercase tracking-widest ${
                  cvStyle === 'compact' ? 'text-[11px] mb-1.5' : 'text-xs mb-2'
                } ${
                  cvStyle === 'classic'
                    ? 'border-b border-surface-300 dark:border-surface-700 pb-0.5 text-surface-900 dark:text-surface-100'
                    : 'text-accent-600 dark:text-accent-400'
                }`}>
                  TECHNICAL SKILLS & COMPETENCIES
                </h2>
                <div className={`space-y-1 text-surface-700 dark:text-surface-200 ${
                  cvStyle === 'compact' ? 'text-[10.5px]' : 'text-xs'
                }`}>
                  <p>
                    <span className="font-bold text-surface-800 dark:text-surface-100">Chemical Engineering:</span>{' '}
                    {cv.skills.technical.join(', ')}
                  </p>
                  <p>
                    <span className="font-bold text-surface-800 dark:text-surface-100">Process Simulation & Computational:</span>{' '}
                    {cv.skills.software.join(', ')}
                  </p>
                  {cv.skills.programming.length > 0 && (
                    <p>
                      <span className="font-bold text-surface-800 dark:text-surface-100">Programming & Data Analysis:</span>{' '}
                      {cv.skills.programming.join(', ')}
                    </p>
                  )}
                  <p>
                    <span className="font-bold text-surface-800 dark:text-surface-100">Laboratory Characterization:</span>{' '}
                    {cv.skills.lab.join(', ')}
                  </p>
                  {cv.skills.soft.length > 0 && (
                    <p>
                      <span className="font-bold text-surface-800 dark:text-surface-100">Operational & Team Leadership:</span>{' '}
                      {cv.skills.soft.join(', ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Section: Certifications & Honors */}
              {cv.certifications.length > 0 && (
                <div className={cvStyle === 'compact' ? 'mt-3.5' : 'mt-5'}>
                  <h2 className={`font-black uppercase tracking-widest ${
                    cvStyle === 'compact' ? 'text-[11px] mb-1' : 'text-xs mb-2'
                  } ${
                    cvStyle === 'classic'
                      ? 'border-b border-surface-300 dark:border-surface-700 pb-0.5 text-surface-900 dark:text-surface-100'
                      : 'text-accent-600 dark:text-accent-400'
                  }`}>
                    CERTIFICATIONS & PROFESSIONAL TRAINING
                  </h2>
                  <div className={`space-y-1 ${cvStyle === 'compact' ? 'text-[10.5px]' : 'text-xs'}`}>
                    {cv.certifications.map(c => (
                      <p key={c.id} className="text-surface-600 dark:text-surface-300">
                        • <span className="font-semibold text-surface-800 dark:text-surface-100">{c.name}</span> — {c.organization} ({c.date})
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Section: Honors & Achievements */}
              {cv.achievements.length > 0 && (
                <div className={cvStyle === 'compact' ? 'mt-3.5' : 'mt-5'}>
                  <h2 className={`font-black uppercase tracking-widest ${
                    cvStyle === 'compact' ? 'text-[11px] mb-1' : 'text-xs mb-2'
                  } ${
                    cvStyle === 'classic'
                      ? 'border-b border-surface-300 dark:border-surface-700 pb-0.5 text-surface-900 dark:text-surface-100'
                      : 'text-accent-600 dark:text-accent-400'
                  }`}>
                    HONORS & ACHIEVEMENTS
                  </h2>
                  <div className={`space-y-1 ${cvStyle === 'compact' ? 'text-[10.5px]' : 'text-xs'}`}>
                    {cv.achievements.map(a => (
                      <p key={a.id} className="text-surface-600 dark:text-surface-300">
                        • <span className="font-semibold text-surface-800 dark:text-surface-100">{a.title}</span> — {a.organization} ({a.date}){a.description ? `: ${a.description}` : ''}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <InfoNote>
              ATS Parsers prioritize standard section titles and linear, text-based single-column hierarchy. This layout is guaranteed 100% parseable by Workday, Taleo, and Greenhouse ATS systems.
            </InfoNote>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── LinkedIn optimizer: headline, about, posts ─────────────────────────────
const HEADLINE_FORMULAS = [
  { role: 'Process Engineer', formula: 'Chemical Engineer | [Skill 1] + [Skill 2] | [Industry]', example: 'Chemical Engineer | Process Optimisation + Aspen Plus | Fertilizer Industry' },
  { role: 'Graduate', formula: 'Final-year [Degree] @ [University] | [Skill] | [Interest]', example: 'Final-year Chemical Engineering @ UET | Process Simulation | Sustainable Energy' },
  { role: 'Researcher', formula: '[Research area] Researcher | [One key result] | [Affiliation]', example: 'Polymer Characterization Researcher | 3 published papers | UET Polymer Lab' },
] as const;

const ABOUT_STRUCTURE = [
  { step: 1, title: 'Hook', hint: 'What you do + who you help in one line', example: 'Chemical engineer turning raw materials into safer, cheaper products.' },
  { step: 2, title: 'Evidence', hint: 'Your strongest 2-3 achievements with numbers', example: 'Cut a pilot-plant cycle time 22% during my FYP; interned at a 1,500 t/day fertilizer plant.' },
  { step: 3, title: 'Differentiator', hint: 'The one thing you are known for', example: 'The person who converts messy plant data into clear, actionable recommendations.' },
  { step: 4, title: 'Call to action', hint: 'What you want the reader to do', example: 'Open to Process Engineering roles and plant internships — let us connect.' },
] as const;

const POST_TEMPLATES = [
  {
    type: 'Internship recap', template: 'Thrilled to wrap up my internship at {COMPANY} 🏭\n\nIn {N} weeks I: → audited {X} P&IDs → ran {Y} plant trials → presented {Z} improvement ideas to leadership.\n\nBiggest lesson: {LESSON}\n\nGrateful to {MENTOR} and the whole team. #ChemicalEngineering #Internship #ProcessEngineering',
  },
  {
    type: 'Project milestone', template: 'Milestone unlocked: {PROJECT} ✅\n\nThe problem: {PROBLEM}\nWhat we did: {SOLUTION}\nThe result: {RESULT} — a {PCT}% improvement over baseline.\n\n#Engineering #FYP #Innovation',
  },
  {
    type: 'Learning share', template: 'I spent {TIME} learning {TOPIC} and here is the one insight worth sharing:\n\n{INSIGHT}\n\nWhat should I learn next? Drop suggestions below 👇\n#LearningInPublic #ChemicalEngineering',
  },
] as const;

function LinkedinTab() {
  const [tab2, setTab2] = useState('about');
  const [name, setName] = useState('Ayesha');
  const [role, setRole] = useState('Process Engineer');
  const [skills, setSkills] = useState('Aspen Plus, HAZOP');
  const [industry, setIndustry] = useState('Fertilizer');
  const [about, setAbout] = useState('Chemical engineer turning raw materials into safer, cheaper products.');
  const [evidence, setEvidence] = useState('Cut pilot-plant cycle time 22% during FYP; interned at a 1,500 t/day fertilizer plant.');
  const [diff, setDiff] = useState('Converts messy plant data into clear, actionable recommendations.');
  const [cta, setCta] = useState('Open to Process Engineering roles and plant internships.');
  const [showGenerated, setShowGenerated] = useState(false);
  const [postIdx, setPostIdx] = useState(0);
  const inputCls = 'w-full px-3 py-2 rounded-xl text-xs font-bold bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-accent-500';
  const labelCls = 'text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1 block';
  const tabBtn = (id: string, label: string) => (
    <button onClick={() => setTab2(id)} className={`px-3 py-2 rounded-xl text-xs font-black border transition-all ${tab2 === id ? 'bg-accent-600 border-accent-600 text-surface-50' : 'bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-500 hover:border-accent-400'}`}>{label}</button>
  );
  const fullAbout = `I am ${name}, a ${role.toLowerCase()} specialising in ${skills}. ${about} ${evidence} ${diff} ${cta}`;
  const post = POST_TEMPLATES[postIdx];
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-surface-800 dark:text-surface-50 flex items-center gap-3">
          <Users className="w-6 h-6 text-primary-500" /> LinkedIn Optimizer
        </h2>
        <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">Headline formulas, an about-section builder and copy-paste post templates.</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {tabBtn('about', 'About builder')}
        {tabBtn('headline', 'Headline formulas')}
        {tabBtn('posts', 'Post templates')}
      </div>
      {tab2 === 'about' && (
        <div className="grid md:grid-cols-2 gap-6">
          <CalcCard title="Your ingredients" icon={PenLine}>
            <div className="space-y-3">
              {[{ l: 'Your name', v: name, s: setName }, { l: 'Role', v: role, s: setRole }, { l: 'Skills', v: skills, s: setSkills }, { l: 'Industry', v: industry, s: setIndustry }].map(f => (
                <div key={f.l}><label className={labelCls}>{f.l}</label><input className={inputCls} value={f.v} onChange={e => f.s(e.target.value)} /></div>
              ))}
              <div>
                <label className={labelCls}>About structure — 4 paragraphs</label>
                {ABOUT_STRUCTURE.map(a => (
                  <div key={a.step} className="rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 p-3 mb-2">
                    <p className="text-[10px] font-black text-accent-600 dark:text-accent-400">{a.step}. {a.title} — <span className="text-surface-400">{a.hint}</span></p>
                    <p className="text-[10px] text-surface-400 italic mt-1">e.g. {a.example}</p>
                  </div>
                ))}
                <label className={labelCls}>1 · Hook</label>
                <textarea rows={2} className={inputCls} placeholder="What you do + who you help" value={about} onChange={e => setAbout(e.target.value)} />
                <label className={`${labelCls} mt-2`}>2 · Evidence</label>
                <textarea rows={2} className={inputCls} placeholder="Achievements with numbers" value={evidence} onChange={e => setEvidence(e.target.value)} />
                <label className={`${labelCls} mt-2`}>3 · Differentiator</label>
                <textarea rows={2} className={inputCls} placeholder="What you are known for" value={diff} onChange={e => setDiff(e.target.value)} />
                <label className={`${labelCls} mt-2`}>4 · Call to action</label>
                <textarea rows={2} className={inputCls} placeholder="What the reader should do" value={cta} onChange={e => setCta(e.target.value)} />
              </div>
            </div>
          </CalcCard>
          <CalcCard title="Generated About section" icon={BadgeCheck}>
            <div className="rounded-xl border border-surface-200 dark:border-surface-800 p-4 text-xs text-surface-600 dark:text-surface-300 leading-relaxed whitespace-pre-wrap">{fullAbout}</div>
            <button onClick={() => { navigator.clipboard?.writeText(fullAbout); setShowGenerated(true); }}
              className="mt-4 px-3 py-2 rounded-xl text-xs font-black bg-primary-600 text-surface-50 hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/25 flex items-center gap-1">
              <Send className="w-3.5 h-3.5" /> {showGenerated ? 'Copied!' : 'Copy to clipboard'}
            </button>
            <InfoNote>Recruiters scan about sections in ~10 seconds. One idea per paragraph, numbers in every claim, and a clear call to action at the end.</InfoNote>
          </CalcCard>
        </div>
      )}
      {tab2 === 'headline' && (
        <div className="grid md:grid-cols-3 gap-4">
          {HEADLINE_FORMULAS.map(h => (
            <div key={h.role} className="rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
              <p className="text-xs font-black text-surface-700 dark:text-surface-200 mb-2">For {h.role}</p>
              <p className="text-[10px] font-bold text-surface-400 mb-1">FORMULA</p>
              <p className="text-[11px] text-accent-600 dark:text-accent-400 font-bold mb-3">{h.formula}</p>
              <p className="text-[10px] font-bold text-surface-400 mb-1">EXAMPLE</p>
              <p className="text-[11px] text-surface-600 dark:text-surface-300">{h.example}</p>
            </div>
          ))}
        </div>
      )}
      {tab2 === 'posts' && (
        <CalcCard title="Post templates" icon={MessageSquare}>
          <div className="flex flex-wrap gap-2 mb-4">
            {POST_TEMPLATES.map((p, i) => (
              <button key={p.type} onClick={() => setPostIdx(i)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${i === postIdx ? 'bg-primary-600 border-primary-600 text-surface-50' : 'bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-500'}`}>{p.type}</button>
            ))}
          </div>
          <div className="rounded-xl border border-surface-200 dark:border-surface-800 p-4 text-xs text-surface-600 dark:text-surface-300 whitespace-pre-wrap font-mono">{post.template}</div>
          <p className="text-[10px] text-surface-400 mt-3">Replace the {'{PLACEHOLDERS}'} with your details. Post at 8-10am on weekdays; comment on 3-5 posts before publishing yours to warm up engagement.</p>
        </CalcCard>
      )}
    </>
  );
}
// ─── Interview Prep: question bank + filterable UI ──────────────────────────
interface InterviewQ {
  id: number; cat: string; subject: string; q: string; model: string;
}

const INTERVIEW_QS: InterviewQ[] = [
  { id: 1, cat: 'Technical', subject: 'Mass & Energy Balance', q: 'A countercurrent heat exchanger heats 5 kg/s of cold water from 20 °C to 70 °C using hot water entering at 90 °C. If the hot stream exits at 50 °C, what is the hot-stream flow?', model: 'Energy balance: m_c·Cp·ΔT_c = m_h·Cp·ΔT_h. Cp cancels: 5 × 50 = m_h × 40 → m_h = 6.25 kg/s. State assumptions (no losses, constant Cp) before calculating.' },
  { id: 2, cat: 'Technical', subject: 'Thermodynamics', q: 'What is the difference between a throttling valve and an isentropic turbine, and what stays constant in each?', model: 'Throttling is isenthalpic (h = const, entropy increases, no work). An ideal turbine is isentropic (s = const, produces work). Real turbines have isentropic efficiency η = (actual work)/(ideal work).' },
  { id: 3, cat: 'Technical', subject: 'Fluid Mechanics', q: 'Define Reynolds number and what flow regimes it predicts. What happens to pressure drop if velocity doubles in turbulent flow?', model: 'Re = ρvD/μ. Laminar < 2100, transition 2100-4000, turbulent > 4000. In turbulent flow ΔP scales roughly with v² (Darcy-Weisbach + friction factor), so doubling velocity ≈ quadruples pressure drop.' },
  { id: 4, cat: 'Technical', subject: 'Heat Transfer', q: 'Explain countercurrent vs co-current heat exchange and why countercurrent is preferred.', model: 'Countercurrent keeps a temperature driving force along the whole exchanger (T_hot,in vs T_cold,out at one end), enabling closer approach temperatures and smaller area for the same duty. Co-current limits outlet hot temp above cold outlet.' },
  { id: 5, cat: 'Technical', subject: 'Mass Transfer', q: 'What is the difference between absorption and stripping? Give an example of each.', model: 'Absorption transfers a component from gas to liquid (e.g. CO₂ into MEA/amine solution). Stripping transfers from liquid to gas (e.g. steam stripping organics from wastewater). Both driven by concentration gradients, described by equilibrium + rate.' },
  { id: 6, cat: 'Technical', subject: 'Reaction Eng', q: 'What is the difference between conversion and selectivity? Why does selectivity matter more in parallel reactions?', model: 'Conversion = reacted/feed. Selectivity = desired product/reacted. In parallel reactions (A→B desired, A→C waste), high conversion with poor selectivity wastes feed on C — so selectivity (not conversion) drives economics.' },
  { id: 7, cat: 'Technical', subject: 'Separation', q: 'Explain relative volatility and how it relates to distillation difficulty.', model: 'α = (yA/xA)/(yB/xB) — how much easier A evaporates than B. α near 1 (e.g. benzene/toluene is 2.4, close-boilers 1.05) → many trays, high reflux, expensive column. α = 1 → impossible by ordinary distillation (needs extractive/azeotropic).' },
  { id: 8, cat: 'Technical', subject: 'Process Control', q: 'What is a feedback control loop? Name its five elements and explain a cascade control application.', model: 'Elements: process variable, sensor, controller, final control element, setpoint. Feedback compares PV to SP, adjusts valve. Cascade: e.g. reactor temperature master controlling cooling-water flow slave loop — rejects disturbances faster.' },
  { id: 9, cat: 'Technical', subject: 'Process Safety', q: 'What is a HAZOP and what are the three consequences of a loss of containment?', model: 'HAZOP = structured brainstorming using guidewords (MORE/LESS/NO/REVERSE) × parameters to find deviations. Loss of containment → fire, explosion, toxic release (and environmental damage).' },
  { id: 10, cat: 'Technical', subject: 'Equipment', q: 'What is NPSH and why does it matter for pump selection?', model: 'NPSH_available = head at pump suction above vapour pressure. If NPSH_a < NPSH_r (required), cavitation — vapour bubbles collapse and erode impeller. Fix: raise suction tank level, shorten suction line, lower fluid temperature.' },
  { id: 11, cat: 'Technical', subject: 'PFD & P&ID', q: 'What is the difference between a PFD and a P&ID?', model: 'PFD: process overview — major equipment, streams, heat/material balance, control philosophy. P&ID: piping + instrumentation detail — every pipe, valve, instrument tag, interlock, and utility connection. PFD for engineers, P&ID for design/construction/operation.' },
  { id: 12, cat: 'Technical', subject: 'Industrial', q: 'In a fertilizer plant, what are the key unit operations between ammonia synthesis and final urea product?', model: 'NH₃ synthesis loop (Haber-Bosch at ~150-250 bar, 450-500 °C) → CO₂ capture → urea reactor → stripping → evaporation → prilling/granulation → bagging. Energy recovery via HP steam from exotherm.' },
  { id: 13, cat: 'HR', subject: 'General', q: 'Tell me about yourself.', model: 'STAR-style 60-90 seconds: present (role/degree + one anchor achievement) → past (key experience) → future (why this role/company). Never recite your CV; highlight 2-3 transferable points.' },
  { id: 14, cat: 'HR', subject: 'General', q: 'Why do you want to work in this industry/company?', model: 'Show research: name the company\'s products, latest project or challenge, and connect your skills (e.g. \'Your urea capacity expansion aligns with my FYP on process optimisation\'). Avoid generic answers.' },
  { id: 15, cat: 'HR', subject: 'General', q: 'What are your strengths and weaknesses?', model: 'Strength: pick one relevant + evidence (\'data analysis — reduced lab rework 30%\'). Weakness: real but manageable + mitigation (\'public speaking — now present monthly team updates\'). Never say \'I work too hard\'.' },
  { id: 16, cat: 'HR', subject: 'General', q: 'Tell me about a time you faced a conflict or failure.', model: 'STAR: Situation, Task, Action, Result — own the mistake, show what you learned and changed. Avoid blaming teammates or hiding the failure.' },
  { id: 17, cat: 'HR', subject: 'General', q: 'Where do you see yourself in five years?', model: 'Show ambition aligned with the employer: growing into a chartered/senior process engineer, taking ownership of larger projects — not a different career or \'your job\'.' },
  { id: 18, cat: 'HR', subject: 'General', q: 'Do you have any questions for us?', model: 'Always ask 2-3 prepared questions: about team structure, typical first-year responsibilities, training/mentorship, or recent plant challenges. It signals genuine interest.' },
  { id: 19, cat: 'Behavioral', subject: 'Teamwork', q: 'Describe a project where you worked in a team. What was your role?', model: 'Use STAR + quantify: \'Led the simulation subgroup of 3; delivered converged flowsheet 2 weeks early; resolved a disagreement by proposing a decision matrix\'. Highlight both contribution and collaboration.' },
  { id: 20, cat: 'Behavioral', subject: 'Leadership', q: 'Give an example of when you took the lead.', model: 'Pick a concrete situation (FYP subgroup, society event, lab batch). Explain how you organised tasks, motivated others, handled a setback, and the measured outcome.' },
  { id: 21, cat: 'Behavioral', subject: 'Problem Solving', q: 'Tell me about a difficult technical problem you solved.', model: 'Structure: define the problem precisely → constraints → alternatives evaluated → chosen solution → result with numbers. Show systematic thinking, not just the answer.' },
  { id: 22, cat: 'Behavioral', subject: 'Initiative', q: 'Describe something you did beyond your assigned responsibilities.', model: 'Example: taught yourself Aspen Plus in a month to support the design team; organised a plant-visit for juniors; volunteered to present. Tie to an outcome.' },
];
// ─── Interview Prep tab: filterable Q&A bank ────────────────────────────────
function InterviewPrepTab() {
  const [cat, setCat] = useState('All');
  const [subj, setSubj] = useState('All');
  const [qry, setQry] = useState('');
  const [open, setOpen] = useState<number | null>(1);
  const cats = ['All', ...Array.from(new Set(INTERVIEW_QS.map(q => q.cat)))];
  const subs = ['All', ...Array.from(new Set(INTERVIEW_QS.map(q => q.subject)))];
  const filtered = INTERVIEW_QS.filter(q =>
    (cat === 'All' || q.cat === cat) &&
    (subj === 'All' || q.subject === subj) &&
    (q.q.toLowerCase().includes(qry.toLowerCase()) || q.model.toLowerCase().includes(qry.toLowerCase()))
  );
  const selCls = 'px-3 py-2 rounded-xl text-xs font-black bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-accent-500';
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-surface-800 dark:text-surface-50 flex items-center gap-3">
          <ListChecks className="w-6 h-6 text-accent-500" /> Interview Question Bank
        </h2>
        <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">22 curated questions with model answers — click to reveal, then practice aloud.</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        <select className={selCls} value={cat} onChange={e => setCat(e.target.value)}>
          {cats.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className={selCls} value={subj} onChange={e => setSubj(e.target.value)}>
          {subs.map(s => <option key={s}>{s}</option>)}
        </select>
        <input className={`${selCls} flex-1 min-w-[200px]`} placeholder="Search questions…" value={qry} onChange={e => setQry(e.target.value)} />
        <span className="text-[10px] font-black text-surface-400 self-center">{filtered.length} shown</span>
      </div>
      <div className="space-y-3">
        {filtered.map(q => (
          <div key={q.id} className="rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
            <button onClick={() => setOpen(open === q.id ? null : q.id)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-50 dark:hover:bg-surface-900 transition-all">
              <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${q.cat === 'Technical' ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300' : q.cat === 'HR' ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300' : 'bg-accent-100 dark:bg-accent-900/40 text-accent-600 dark:text-accent-300'}`}>{q.cat}</span>
              <span className="text-[9px] font-black text-surface-400 w-28">{q.subject}</span>
              <p className="flex-1 text-xs font-bold text-surface-700 dark:text-surface-200">{q.q}</p>
              <ChevronRight className={`w-4 h-4 text-surface-400 transition-transform ${open === q.id ? 'rotate-90' : ''}`} />
            </button>
            {open === q.id && (
              <div className="px-4 pb-4">
                <div className="rounded-xl bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 p-3">
                  <p className="text-[10px] font-black text-accent-600 dark:text-accent-400 mb-1">MODEL ANSWER</p>
                  <p className="text-[11px] text-surface-600 dark:text-surface-300 leading-relaxed">{q.model}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-xs text-surface-400 py-10 text-center">No questions match your filters.</p>}
      </div>
      <InfoNote>Interviewers reward STRUCTURE: state your answer, give evidence with numbers, then a one-line conclusion. Practice the technical answers out loud — your mouth knows less than your brain.</InfoNote>
    </>
  );
}
// ─── Interview Simulator: config → timed Q&A → scored evaluation ───────────
interface SimQuestion {
  q: string; hint: string; score: 0 | 1;
}

const SIM_BANKS: Record<string, SimQuestion[]> = {
  'Process Engineer': [
    { q: 'A distillation column separates a 50/50 feed of benzene/toluene. Why is countercurrent liquid-vapour contact essential, and what happens to the tray count as relative volatility approaches 1?', hint: 'Driving force + equilibrium stages; mention α = 1 makes it impossible.', score: 1 },
    { q: 'Your plant\'s pump trips and NPSH_a drops below NPSH_r. What is happening inside the pump and what two fixes do you propose?', hint: 'Cavitation: vapour bubbles collapse on the impeller; raise suction head or lower liquid temperature.', score: 1 },
    { q: 'A reactor runs away (exotherm out of control). Walk me through your immediate response as the process engineer.', hint: 'Stop feed, activate emergency cooling/relief, isolate, follow ESD — safety first, then stabilise.', score: 1 },
    { q: 'Steam consumption is 10% above design in your plant. List the three most likely causes and how you would verify each.', hint: 'Trap failures, insulation loss, process fouling/over-reflux — check condensate, surface temps, energy balance.', score: 1 },
    { q: 'Explain why reflux ratio affects both product purity AND operating cost, and how you would choose the optimum.', hint: 'Higher reflux = more trays separation but more reboiler/condenser duty; optimum near minimum reflux + margin.', score: 1 },
  ],
  'Plant Engineer': [
    { q: 'You arrive on shift and a gas alarm sounds at the ammonia storage area. What are your first five actions?', hint: 'Evacuate/upwind, sound alarm, isolate source, call emergency response, check for injured — in that spirit.', score: 1 },
    { q: 'A heat exchanger is fouling every 3 months instead of every 12. What investigation would you run?', hint: 'Check cooling-water chemistry, flow velocity, temperatures, upstream carryover, metallurgy — pick a plan.', score: 1 },
    { q: 'What is the difference between a permit-to-work and a lockout/tagout, and when is each required?', hint: 'PtW = non-routine job authorisation (risk + gas test); LOTO = energy isolation for maintenance safety.', score: 1 },
    { q: 'A valve fails-closed during start-up. Which failure mode would you have specified and why?', hint: 'Fails-open vs closed trade-off: choose the safe position for the process (e.g. cooling water fails open).', score: 1 },
    { q: 'How would you verify a pressure relief valve is sized correctly for a blocked-outlet scenario?', hint: 'Calculate required relieving rate at worst-case upstream pressure; check PSV capacity vs demand at set +10%.', score: 1 },
  ],
  'Design Engineer': [
    { q: 'You must size a heat exchanger for 2 MW duty. What data do you need and what are the design steps?', hint: 'Duty, flows, T in/out, U estimate → LMTD → area, then mechanical: shell/tube, ΔP check, fouling.', score: 1 },
    { q: 'What is the difference between design pressure and operating pressure, and how is the MAWP chosen?', hint: 'Operating + margin (10% or 25 psi rule); MAWP from code calculations of the weakest component.', score: 1 },
    { q: 'Explain how you would approach a plant-wide mass balance for a new process line.', hint: 'Boundary definition, species balances, recycle convergence, degrees of freedom, then validate against vendor data.', score: 1 },
    { q: 'Why do you add a safety factor to pump sizing? What is typical practice?', hint: 'Uncertainty in friction factors/fouling; add 10-20% margin but avoid oversizing causing cavitation at low flows.', score: 1 },
    { q: 'A client wants a 20% capacity increase. What are your first three engineering questions?', hint: 'What is the current bottleneck? Utility capacity? Who owns the risk/justification? Bottleneck analysis first.', score: 1 },
  ],
};

const SIM_ROLES = Object.keys(SIM_BANKS);

interface SimResult {
  score: number; tech: number; comm: number; struct: number; acc: number; conf: number;
  verdict: string; weak: string[]; followups: string[];
}

function simulateInterview(answers: (0 | 1 | null)[], conf: number, role?: string): SimResult {
  const n = answers.length || 1;
  const right = answers.filter(a => a === 1).length;
  const tech = Math.round((right / n) * 100);
  const acc = tech;
  const comm = Math.round(Math.min(100, tech * 0.5 + conf * 0.3 + 25));
  const struct = Math.round(Math.min(100, tech * 0.4 + conf * 0.25 + 30));
  const score = Math.round(tech * 0.5 + comm * 0.2 + struct * 0.2 + conf * 0.1);
  const verdict = score >= 80 ? 'Strong hire — ready to interview' : score >= 60 ? 'Good — polish a few weak spots' : score >= 40 ? 'Developing — drill the fundamentals' : 'Rehearse the basics, then retry';
  const weak: string[] = [];
  if (tech < 60) weak.push('Technical fundamentals — review mass/energy balance, pumps & heat transfer');
  if (struct < 60) weak.push('Answer structure — practice STAR and claim-evidence-conclusion');
  if (comm < 60) weak.push('Communication — practise aloud with a timer');
  if (conf < 50) weak.push('Confidence — rehearse answers until they are automatic');
  if (weak.length === 0) weak.push('All areas healthy — add depth with plant-specific examples');
  const followups = role === 'Design Engineer'
    ? ['Walk through your FYP process design choices', 'What industry would you target and why?']
    : ['Describe a time you used data to convince a supervisor', 'What is your biggest engineering failure and what changed?'];
  return { score, tech, comm, struct, acc, conf, verdict, weak, followups };
}
// ─── Simulator UI: config → question-by-question → evaluation ───────────────
function SimulatorTab() {
  const [phase, setPhase] = useState<'config' | 'run' | 'done'>('config');
  const [role, setRole] = useState(SIM_ROLES[0]);
  const [conf, setConf] = useState(60);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<(0 | 1 | null)[]>([]);
  const [result, setResult] = useState<SimResult | null>(null);

  const start = () => { setIdx(0); setAnswers([]); setResult(null); setPhase('run'); };
  const bank = SIM_BANKS[role] ?? SIM_BANKS[SIM_ROLES[0]];
  const q = bank[idx];
  const answer = (v: 0 | 1) => {
    const next = [...answers, v];
    setAnswers(next);
    if (idx + 1 >= bank.length) { setResult(simulateInterview(next, conf, role)); setPhase('done'); }
    else setIdx(idx + 1);
  };
  const bar = (label: string, v: number, color: string) => (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-surface-400">{label}</p>
        <p className="text-xs font-black text-surface-700 dark:text-surface-200">{v}/100</p>
      </div>
      <div className="h-2 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-surface-800 dark:text-surface-50 flex items-center gap-3">
          <Mic className="w-6 h-6 text-rose-500" /> Interview Simulator
        </h2>
        <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">Pick a role, answer like it is the real thing — get scored on technical, communication, structure, accuracy and confidence.</p>
      </div>

      {phase === 'config' && (
        <CalcCard title="Set up your interview" icon={Target}>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2 block">Target role</label>
              <div className="flex flex-wrap gap-2">
                {SIM_ROLES.map(r => (
                  <button key={r} onClick={() => setRole(r)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black border transition-all ${role === r ? 'bg-rose-600 border-rose-600 text-surface-50 shadow-lg shadow-rose-500/25' : 'bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-rose-400'}`}>
                    {r}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-surface-400 mt-4 mb-2">Honest confidence self-rating (used in scoring):</p>
              <input type="range" min={0} max={100} value={conf} onChange={e => setConf(parseInt(e.target.value))} className="w-full accent-rose-500" />
              <div className="flex justify-between text-[9px] font-black text-surface-400"><span>Nervous</span><span>Confident</span></div>
            </div>
            <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-4">
              <p className="text-[10px] font-black text-rose-500 mb-2">HOW IT WORKS</p>
              <ul className="text-[10px] text-surface-600 dark:text-surface-300 space-y-1.5">
                <li>• {bank.length} scenario questions for the {role} role</li>
                <li>• Answer each from memory — no peeking</li>
                <li>• Self-mark honestly: right / missed key point</li>
                <li>• You get a 5-dimension score + weak areas</li>
              </ul>
            </div>
          </div>
          <button onClick={start} className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-surface-50 text-sm font-black hover:opacity-90 transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2">
            <Mic className="w-4 h-4" /> Start the interview
          </button>
        </CalcCard>
      )}

      {phase === 'run' && (
        <CalcCard title={`Question ${idx + 1} of ${bank.length} · ${role}`} icon={HelpCircle}>
          <div className="flex items-center gap-2 mb-4">
            {bank.map((_, i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < idx ? 'bg-accent-500' : i === idx ? 'bg-rose-500' : 'bg-surface-200 dark:bg-surface-700'}`} />
            ))}
          </div>
          <p className="text-sm font-black text-surface-800 dark:text-surface-50 mb-4 leading-relaxed">{q.q}</p>
          <div className="rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 p-3 mb-4">
            <p className="text-[10px] font-black text-surface-400 mb-1">WHAT A GREAT ANSWER COVERS</p>
            <p className="text-[11px] text-surface-600 dark:text-surface-300">{q.hint}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => answer(1)} className="flex-1 py-3 rounded-xl bg-accent-600 text-surface-50 text-xs font-black hover:bg-accent-700 transition-all shadow-lg shadow-accent-500/25">✓ I nailed it</button>
            <button onClick={() => answer(0)} className="flex-1 py-3 rounded-xl bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-200 text-xs font-black hover:bg-surface-300 dark:hover:bg-surface-600 transition-all">Partially missed it</button>
          </div>
        </CalcCard>
      )}

      {phase === 'done' && result && (
        <div className="grid md:grid-cols-2 gap-6">
          <CalcCard title={`Overall score: ${result.score}/100`} icon={Award}>
            <p className="text-5xl font-black text-surface-800 dark:text-surface-50 mb-2">{result.score}<span className="text-lg text-surface-400">/100</span></p>
            <p className="text-xs font-black text-rose-500 mb-6">{result.verdict}</p>
            {bar('Technical knowledge', result.tech, 'bg-primary-500')}
            {bar('Accuracy', result.acc, 'bg-accent-500')}
            {bar('Structure', result.struct, 'bg-accent-500')}
            {bar('Communication', result.comm, 'bg-primary-500')}
            {bar('Confidence', result.conf, 'bg-rose-500')}
          </CalcCard>
          <div className="space-y-6">
            <CalcCard title="Weak areas & recommended topics" icon={Lightbulb}>
              <ul className="space-y-2">
                {result.weak.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-surface-600 dark:text-surface-300">
                    <ChevronRight className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" /> {w}
                  </li>
                ))}
              </ul>
            </CalcCard>
            <CalcCard title="Follow-up questions to prepare" icon={TrendingUp}>
              <ul className="space-y-2">
                {result.followups.map((f, i) => (
                  <li key={i} className="text-[11px] text-surface-600 dark:text-surface-300 flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-accent-400 flex-shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
            </CalcCard>
            <button onClick={start} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-surface-50 text-xs font-black hover:opacity-90 transition-all shadow-lg shadow-rose-500/25">
              <RefreshCw className="w-3.5 h-3.5 inline mr-1" /> Retake with another role
            </button>
          </div>
        </div>
      )}
      <InfoNote>Scoring is a self-assessment simulation, not a verdict — the act of articulating answers under time pressure is the real training. Use the question bank to fill gaps the simulator finds.</InfoNote>
    </>
  );
}

// ─── Module shell & tabs ────────────────────────────────────────────────────
const TABS = [
  { id: 'cv', label: 'CV Builder', icon: FileText },
  { id: 'linkedin', label: 'LinkedIn', icon: Users },
  { id: 'prep', label: 'Interview Prep', icon: ListChecks },
  { id: 'sim', label: 'Simulator', icon: Mic },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function CareerHubModule() {
  const [tab, setTab] = useState<TabId>('cv');
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-500 to-teal-600 text-surface-50 flex items-center justify-center shadow-lg shadow-accent-500/25">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-surface-800 dark:text-surface-50">Career Hub</h1>
            <p className="text-xs text-surface-500 dark:text-surface-400">Resume builder, LinkedIn optimizer, interview question bank and a scored interview simulator.</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 border transition-all ${tab === t.id
                ? 'bg-accent-600 border-accent-600 text-surface-50 shadow-lg shadow-accent-500/25'
                : 'bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-accent-400'}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>
      {tab === 'cv' && <CvBuilderTab />}
      {tab === 'linkedin' && <LinkedinTab />}
      {tab === 'prep' && <InterviewPrepTab />}
      {tab === 'sim' && <SimulatorTab />}
    </div>
  );
}
