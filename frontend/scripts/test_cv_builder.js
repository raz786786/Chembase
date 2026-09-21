// Full Scenario Verification for CV Builder Intelligent Engine
const TARGET_INDUSTRIES = [
  // 16 Industries
  {
    id: 'fertilizer',
    name: 'Fertilizer Industry',
    category: 'industry',
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

  // 5 Academic Tracks
  {
    id: 'academic_ms',
    name: 'MS Admission in Chemical Engineering',
    category: 'academic',
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

  // 5 Career & Other Tracks
  {
    id: 'career_get',
    name: 'Graduate Engineer Trainee (GET)',
    category: 'other',
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

function generateTargetSummary(user, target) {
  const degree = user.education[0]?.degree || 'Chemical Engineering graduate';
  const inst = user.education[0]?.institution ? ` from ${user.education[0].institution}` : '';
  const gpaStr = user.education[0]?.gpa ? ` (CGPA ${user.education[0].gpa})` : '';

  const hasPlantExp = user.experience.some(e => /fertilizer|refin|petrochem|plant|process|intern/i.test(e.organization + ' ' + e.role));
  const plantOrg = user.experience.find(e => /fertilizer|refin|petrochem|plant|intern/i.test(e.organization))?.organization || 'industrial manufacturing';
  
  const hasResearchExp = user.experience.some(e => e.type === 'Research' || /research|lab|polymer|nanomaterial/i.test(e.role + ' ' + e.organization));
  const researchTopic = user.experience.find(e => e.type === 'Research')?.role || 'experimental process research';

  const coreSkills = user.skills.technical.slice(0, 3).join(', ');
  const softTools = user.skills.software.slice(0, 2).join(' and ');

  if (target.category === 'academic') {
    const researchTarget = target.researchArea || target.role;
    const expClause = hasResearchExp ? `demonstrated research background as ${researchTopic}` : 'rigorous academic project foundations';
    return `${degree}${inst}${gpaStr} with ${expClause} and core competencies in ${coreSkills}. Experienced in bench-scale experimental design, simulation via ${softTools || 'engineering software'}, and rigorous analytical characterization. Seeking admission to ${target.academicProgram || target.role} to contribute to advanced research in ${researchTarget}, leveraging proven foundations in transport phenomena and process modeling.`;
  }

  if (target.industry.includes('Fertilizer') || target.industry.includes('Oil') || target.industry.includes('Petrochem') || target.industry.includes('Chemical Manufacturing')) {
    const expClause = hasPlantExp ? `hands-on industrial training at ${plantOrg}` : 'rigorous academic design project foundations';
    return `${degree}${inst} with ${expClause} and technical proficiency in ${coreSkills}. Experienced in process simulation using ${softTools || 'Aspen Plus'}, P&ID analysis, and unit operations optimization. Seeking a ${target.role} position in ${target.industry} to apply mass & energy balances, plant troubleshooting, and process safety standards to maximize production efficiency.`;
  }

  if (target.industry.includes('FMCG') || target.industry.includes('Food') || target.role.includes('Production')) {
    return `Proactive ${degree}${inst} with practical exposure to manufacturing operations, process efficiency, and mass balance calculations. Skilled in ${coreSkills}, data-driven problem solving, and cross-functional team execution. Seeking to leverage analytical engineering capabilities as a ${target.role} within ${target.industry} to streamline production line throughput and ensure operational excellence.`;
  }

  if (target.role.includes('HSE') || target.role.includes('Safety')) {
    return `Safety-conscious ${degree}${inst} possessing specialized academic training in HAZOP methodologies, risk assessment matrices, and process plant safety interlocks. Experienced in industrial operations through ${hasPlantExp ? plantOrg : 'capstone engineering design'}. Dedicated to promoting regulatory compliance, proactive hazard identification, and environmental stewardship as a ${target.role}.`;
  }

  if (target.role.includes('Control') || target.role.includes('Instrumentation') || target.industry.includes('Process Control')) {
    return `Systems-oriented ${degree}${inst} with strong mathematical and modeling proficiency in process dynamics, feedback control loops, and simulation. Experienced in P&ID instrumentation loops, Aspen Plus, and MATLAB dynamic models. Eager to contribute technical rigor and loop optimization as a ${target.role} within ${target.industry}.`;
  }

  if (target.category === 'other') {
    return `Driven ${degree}${inst} with solid foundations in chemical engineering unit operations, plant safety principles, and process modeling software (${softTools || 'Aspen Plus'}). Proven quick adaptability and analytical discipline demonstrated through practical internships and capstone design. Seeking to launch career as a ${target.role} to contribute immediate operational value.`;
  }

  return `${degree}${inst} with well-rounded competencies in ${coreSkills} and simulation software including ${softTools || 'Aspen Plus and MATLAB'}. Proven ability to apply chemical engineering fundamentals to solve practical operational problems through hands-on projects and internships. Eager to contribute technical rigor and collaborative dedication as a ${target.role} within the ${target.industry}.`;
}

function getPrioritizedContent(user, target) {
  const targetMeta = TARGET_INDUSTRIES.flatMap(ind => ind.roles).find(r => r.role === target.role);
  const keywords = (targetMeta?.keywords || []).map(k => k.toLowerCase());

  const scoreItem = (text) => {
    const lower = text.toLowerCase();
    let score = 0;
    keywords.forEach(k => {
      if (lower.includes(k)) score += 3;
    });
    return score;
  };

  const sortedExp = [...user.experience].sort((a, b) => {
    if (target.category === 'academic') {
      if (a.type === 'Research' && b.type !== 'Research') return -1;
      if (b.type === 'Research' && a.type !== 'Research') return 1;
    }
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

// Run 5 Scenarios
const sampleUser = {
  name: 'Ayesha Khan',
  title: 'Chemical Process Engineer',
  email: 'ayesha.khan@email.com',
  phone: '+92 300 1234567',
  location: 'Lahore, Pakistan',
  linkedin: 'linkedin.com/in/ayesha-khan-chem',
  github: 'github.com/ayesha-chem',
  portfolio: 'ayeshakhan-chem.dev',
  summary: '',
  education: [
    {
      id: 'edu-1',
      degree: 'B.Sc. Chemical Engineering',
      institution: 'University of Engineering & Technology (UET)',
      year: '2022 – 2026',
      gpa: '3.72 / 4.00',
      coursework: 'Transport Phenomena, Reaction Engineering, Process Dynamics & Control, Unit Operations'
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
      description: 'Audited process parameters across 1,500 t/day urea granulation circuit.\nUpdated 12 P&IDs.',
      achievements: 'Identified steam condensation losses yielding 2% steam savings.'
    },
    {
      id: 'exp-2',
      type: 'Research',
      role: 'Undergraduate Research Assistant',
      organization: 'UET Polymer & Nanocomposite Materials Laboratory',
      duration: 'Jan 2024 – Dec 2024',
      location: 'Lahore, Pakistan',
      description: 'Synthesized biodegradable PMMA-silica nanocomposite films via solution casting.\nOperated DSC and UTM.',
      achievements: 'Co-authored a peer-reviewed conference paper.'
    }
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'Chlor-Alkali Membrane Cell Plant Design (FYP)',
      description: 'Designed a 25,000 t/yr chlor-alkali production facility.',
      tools: 'Aspen Plus, AutoCAD',
      methodology: 'Rigorous heat and mass balances, electrochemical cell sizing.',
      results: 'Converged plant flowsheet with 99.2% chlorine product purity.'
    },
    {
      id: 'proj-2',
      title: 'Depropanizer Distillation Column Energy Optimization',
      description: 'Modelled a multicomponent hydrocarbon distillation column.',
      tools: 'Aspen Plus, DWSIM',
      methodology: 'Sensitivity analysis on reflux ratio and stage count.',
      results: 'Achieved 18% reduction in reboiler heat duty.'
    },
    {
      id: 'proj-3',
      title: 'Biodiesel Synthesis from Waste Cooking Oil',
      description: 'Bench-scale experimental optimization of transesterification.',
      tools: 'Reflux Condenser, GC-FID',
      methodology: 'Central Composite Design response surface methodology.',
      results: 'Produced biodiesel achieving 94.2% FAME conversion.'
    }
  ],
  skills: {
    technical: ['Mass & Energy Balances', 'PFD', 'P&ID Interpretation', 'HAZOP', 'Distillation'],
    software: ['Aspen Plus', 'DWSIM', 'AutoCAD'],
    programming: ['Python', 'MATLAB'],
    lab: ['GC-FID', 'UV-Vis Spectrophotometry', 'Titration'],
    soft: ['Leadership', 'Technical Writing']
  },
  certifications: [
    { id: 'c-1', name: 'OSHA 30-Hour Safety', organization: 'OSHA', date: '2025' }
  ],
  achievements: [
    { id: 'a-1', title: '1st Place Plant Design', organization: 'PIChE', date: '2025', description: 'Awarded 1st place' }
  ]
};

const scenarios = [
  {
    name: 'Scenario 1: Fertilizer → Process Engineer → Classic',
    target: { category: 'industry', industry: 'Fertilizer Industry', role: 'Process Engineer' },
    style: 'classic'
  },
  {
    name: 'Scenario 2: FMCG → Graduate Engineer Trainee (GET) → Modern',
    target: { category: 'industry', industry: 'FMCG & Consumer Goods', role: 'Graduate Engineer Trainee (GET)' },
    style: 'modern'
  },
  {
    name: 'Scenario 3: Oil & Gas → Process Engineer → Compact',
    target: { category: 'industry', industry: 'Oil & Gas / Refining', role: 'Process Engineer' },
    style: 'compact'
  },
  {
    name: 'Scenario 4: MS Admission → Chemical Engineering → Classic',
    target: { category: 'academic', industry: 'MS Admission in Chemical Engineering', role: 'MS in Chemical Engineering', academicProgram: 'National University of Singapore (NUS)', researchArea: 'Polymer Membrane Separations' },
    style: 'classic'
  },
  {
    name: 'Scenario 5: Research Assistant → Graduate Research Assistant → Compact',
    target: { category: 'academic', industry: 'Research Positions / Academic Institute', role: 'Graduate Research Assistant', researchArea: 'Nanocomposite Materials' },
    style: 'compact'
  }
];

console.log('Total Categories defined:', TARGET_INDUSTRIES.length);
console.log('Industry count:', TARGET_INDUSTRIES.filter(i => i.category === 'industry').length);
console.log('Academic count:', TARGET_INDUSTRIES.filter(i => i.category === 'academic').length);
console.log('Other count:', TARGET_INDUSTRIES.filter(i => i.category === 'other').length);

scenarios.forEach((sc, idx) => {
  console.log(`\n========================================`);
  console.log(`TESTING: ${sc.name}`);
  const summary = generateTargetSummary(sampleUser, sc.target);
  console.log(`\n[Generated Summary]:\n${summary}`);
  
  const { sortedExp, sortedProjects } = getPrioritizedContent(sampleUser, sc.target);
  console.log(`\n[Top Prioritized Experience]: ${sortedExp[0].role} at ${sortedExp[0].organization} (Type: ${sortedExp[0].type})`);
  console.log(`[Top Prioritized Project]: ${sortedProjects[0].title}`);

  // Assertions
  if (sc.target.category === 'academic') {
    if (sortedExp[0].type !== 'Research') {
      console.error(`FAILED: Academic scenario did not prioritize Research experience first!`);
      process.exit(1);
    }
  } else if (sc.target.industry === 'Fertilizer Industry') {
    if (!summary.includes('Fatima Fertilizer') || !summary.includes('Fertilizer Industry')) {
      console.error(`FAILED: Fertilizer summary missing expected industry references!`);
      process.exit(1);
    }
  } else if (sc.target.industry === 'FMCG & Consumer Goods') {
    if (!summary.includes('FMCG') && !summary.includes('manufacturing operations')) {
      console.error(`FAILED: FMCG summary missing manufacturing operations!`);
      process.exit(1);
    }
  }
  console.log(`PASS: ${sc.name}`);
});

console.log('\nAll 5 Prompt Scenarios PASSED successfully!');
