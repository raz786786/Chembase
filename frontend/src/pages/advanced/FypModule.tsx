import { useState, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Rocket, Lightbulb, FlaskConical, Microscope, TestTubes, ShieldAlert,
  BookOpen, FileText, Presentation, Filter, Target, HelpCircle, ListChecks,
  CheckCircle2, Plus, Trash2, Info, Layers, Network, CalendarDays, ClipboardList,
  Award, TrendingUp, Database, ScrollText, Leaf, Droplets, Pill,
  ArrowLeft, ArrowRight, Check, AlertCircle, Wrench, ChevronRight, Copy, Sparkles
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

// ─── FYP Idea Interface ─────────────────────────────────────────────────────
export interface FypIdea {
  id: number;
  domain: string;
  title: string;
  area: string; // Chemical Engineering Area
  problem: string; // Problem Statement
  approach: string; // Concise Project Description / Overview
  objectives: string[]; // Clear SMART objectives
  methodology: string[]; // Step-by-step execution phases
  tools: string[]; // Required Equipment, Sensors & Software
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  type: 'Experimental' | 'Simulation' | 'Hybrid';
  expectedOutput: string; // Expected technical outputs
  deliverables: string[]; // Deliverable artifacts
  skillsRequired: string[]; // Key technical and ChE skills
  researchQuestions: string[]; // Defensible questions
}

export const FYP_DOMAINS: { id: string; label: string; icon: LucideIcon; color: string }[] = [
  { id: 'energy', label: 'Energy & Environment', icon: Leaf, color: '#16a34a' },
  { id: 'water', label: 'Water & Wastewater', icon: Droplets, color: '#06b6d4' },
  { id: 'materials', label: 'Materials & Polymers', icon: Layers, color: '#8b5cf6' },
  { id: 'bio', label: 'Bio & Pharma', icon: Pill, color: '#ec4899' },
  { id: 'process', label: 'Process Intensification', icon: FlaskConical, color: '#f59e0b' },
  { id: 'safety', label: 'Safety & Digitalisation', icon: ShieldAlert, color: '#ef4444' },
];

export const FYP_IDEAS: FypIdea[] = [
  {
    id: 1,
    domain: 'energy',
    title: 'Biodiesel from Waste Cooking Oil',
    area: 'Environmental Engineering & Bioenergy',
    problem: 'Restaurant waste oil is dumped, polluting water and sewer lines. Waste-to-fuel cuts cost and reduces dependence on imported edible oils.',
    approach: 'Collect waste oil, run acid-catalysed esterification followed by base-catalysed transesterification; optimize methanol-to-oil ratio, catalyst loading and reaction time using response surface methodology.',
    objectives: [
      'Characterize waste cooking oil for free fatty acid (FFA) and moisture content.',
      'Optimize a two-step acid-esterification followed by alkaline-transesterification.',
      'Evaluate fuel properties (viscosity, flash point, cetane index) against ASTM D6751 standards.',
      'Perform techno-economic and carbon reduction assessment for small-scale commercialization.'
    ],
    methodology: [
      'Feedstock pre-treatment: Filtration, dehydration at 105 °C, and acid value titration.',
      'Acid pre-esterification: H2SO4-catalyzed reaction (1 vol%) at 60 °C to reduce FFA < 1%.',
      'Base transesterification: KOH catalyst (1.0 wt%) with methanol (6:1 molar ratio) at 60 °C for 90 min.',
      'Phase separation & purification: Gravity settling, warm water washing, and vacuum moisture removal.',
      'Fuel testing: GC-FID analysis for FAME content, kinematic viscosity, flash point, and density.'
    ],
    tools: ['Reflux condenser setup', 'Buchner filtration', 'Gas Chromatography (GC-FID)', 'Kinematic Viscometer', 'Design-Expert / Python (RSM)'],
    difficulty: 'Beginner',
    type: 'Experimental',
    expectedOutput: 'Fatty acid methyl ester (FAME) yield exceeding 92% with kinematic viscosity between 1.9–6.0 mm²/s complying with ASTM D6751.',
    deliverables: ['Standard operating bench protocol', 'Response surface optimization model', 'Fuel quality comparison datasheet', 'Comprehensive thesis report'],
    skillsRequired: ['Organic synthesis & titration', 'Reaction kinetics analysis', 'Chromatography interpretation', 'Design of Experiments (DoE)'],
    researchQuestions: [
      'What combination of methanol:oil ratio and catalyst loading maximizes biodiesel yield while minimizing soap formation?',
      'How does feedstock FFA concentration influence acid-esterification kinetics and catalyst consumption?',
      'How do the combustion and emission profiles of the produced biodiesel compare with standard petrodiesel?'
    ]
  },
  {
    id: 2,
    domain: 'energy',
    title: 'Biogas from Organic Farm Waste',
    area: 'Bioenergy & Biochemical Engineering',
    problem: 'Agricultural waste emits uncontrolled methane to air and causes severe odor; off-grid rural communities lack clean, reliable cooking fuel.',
    approach: 'Construct a bench anaerobic digestion unit; test co-digestion of manure with agricultural crop residues; evaluate C/N ratio, organic loading rate, and temperature on methane productivity.',
    objectives: [
      'Determine biochemical methane potential (BMP) of dairy manure co-digested with agricultural straw.',
      'Evaluate the impact of C:N ratio adjustment (25:1 to 30:1) on digester stability and volatile fatty acids.',
      'Fit biogas generation profiles to the modified Gompertz kinetic model.',
      'Design a modular floating-drum digester suited for rural farming households.'
    ],
    methodology: [
      'Substrate preparation: Maceration, moisture analysis, and total solids / volatile solids (TS/VS) testing.',
      'Inoculum acclimation: Mesophilic cultivation (37 °C) in sealed anaerobic reaction flasks.',
      'Daily monitoring: Biogas volume via water displacement and CH4/CO2 composition using gas chromatography.',
      'Process stability checks: Weekly volatile fatty acid (VFA) and total alkalinity titration (FOS/TAC ratio).',
      'Kinetic regression: Parameter estimation for maximum biogas potential and lag phase duration.'
    ],
    tools: ['Anaerobic batch digester', 'Water displacement gasometer', 'Gas Chromatography (TCD)', 'pH & ORP meter', 'MATLAB / Python curve fitting'],
    difficulty: 'Beginner',
    type: 'Experimental',
    expectedOutput: 'Biomethane yield > 0.35 m³ CH4/kg volatile solids with methane content exceeding 62% in stable mesophilic regime.',
    deliverables: ['Lab-scale digester operating ledger', 'Gompertz kinetic regression model', 'Nutrient-rich digestate fertilizer report', 'Modular rural digester design drawing'],
    skillsRequired: ['Anaerobic microbiological kinetics', 'Gas analysis techniques', 'Bioreactor environmental control', 'Process mass balances'],
    researchQuestions: [
      'What co-digestion ratio of manure to straw prevents acidification while maximizing volumetric methane productivity?',
      'How does substrate particle size reduction influence hydrolysis rate and overall lag phase?',
      'Can digestate liquid effluent be utilized as a standardized liquid bio-fertilizer without phytotoxicity?'
    ]
  },
  {
    id: 3,
    domain: 'energy',
    title: 'Solar Thermal Distillation for Brackish Water',
    area: 'Heat Transfer & Thermal Process Engineering',
    problem: 'Coastal and arid communities face severe potable water shortages; conventional solar stills are simple but suffer from low thermal efficiency and nighttime shutdowns.',
    approach: 'Design and test an enhanced stepped solar still incorporating latent heat phase-change materials (PCM) for nocturnal distillation; validate against a transient lumped thermal model.',
    objectives: [
      'Design a multi-stepped solar still absorber plate to minimize thermal boundary layer thickness.',
      'Integrate paraffin wax PCM beneath the basin for thermal energy storage and nocturnal water production.',
      'Quantify hourly distillate yield, thermal efficiency, and water potability (TDS, electrical conductivity).',
      'Validate numerical transient heat transfer models against outdoor meteorological data.'
    ],
    methodology: [
      'Thermal design & sizing: Energy balance formulation for glass cover, saline water layer, and PCM matrix.',
      'Rig fabrication: Corrosion-resistant stepped galvanized steel absorber with anti-reflective glass cover.',
      'Instrumentation: Multi-channel thermocouple array, pyranometer solar flux logger, and distillate collection vessels.',
      'Experimental testing: Dual parallel trials comparing stepped PCM still against baseline single-slope basin still.',
      'Quality testing: Standard test methods for TDS, total hardness, and chloride reduction.'
    ],
    tools: ['Stepped solar still rig', 'Paraffin wax PCM module', 'Solar pyranometer', 'Multi-channel thermocouple logger', 'TDS & conductivity meter'],
    difficulty: 'Intermediate',
    type: 'Hybrid',
    expectedOutput: '30–45% increase in daily distillate yield per m² collector area with continuous production during non-sunlight hours.',
    deliverables: ['Fabricated solar distillation prototype', 'Transient thermal mathematical model', 'Hourly yield and solar efficiency plots', 'Water quality test certification'],
    skillsRequired: ['Transient heat transfer modeling', 'Thermal instrumentation & DAQ', 'Material phase change thermodynamics', 'Potable water testing'],
    researchQuestions: [
      'How does the thickness of the PCM layer affect nighttime distillate output versus daytime peak temperature?',
      'What is the optimum step geometry and water depth for maximizing evaporative mass transfer?',
      'What is the levelized cost of clean water ($/m³) produced compared to commercial RO systems?'
    ]
  },
  {
    id: 4,
    domain: 'energy',
    title: 'CO2 Capture with Amine in a Packed Column',
    area: 'Mass Transfer & Separation Processes',
    problem: 'Cement and fertilizer flue gas streams emit gigatons of CO2; chemical absorption via alkanolamines is energy-intensive and requires rigorous local optimization.',
    approach: 'Simulate monoethanolamine (MEA) absorption in Aspen Plus and validate against a pilot-scale bench packed column; optimize lean loading, packing height, and reboiler duty trade-offs.',
    objectives: [
      'Measure CO2 absorption capacity and rate into 30 wt% aqueous MEA under counter-current packed column flow.',
      'Calculate overall volumetric mass transfer coefficient (KLa) across varied liquid-to-gas (L/G) ratios.',
      'Build and converge a rigorous rate-based absorption and stripper flowsheet in Aspen Plus using Electrolyte-NRTL.',
      'Perform thermal pinch analysis to reduce stripper reboiler energy consumption below 3.6 MJ/kg CO2.'
    ],
    methodology: [
      'Hydrodynamic characterization: Measuring pressure drop, loading, and flooding limits across structured packing.',
      'Bench absorption trials: Sparging 15% CO2 / 85% N2 gas mix through aqueous MEA with continuous gas analysis.',
      'Amine loading titration: Chittick apparatus sampling to quantify rich and lean CO2 loading (mol CO2/mol MEA).',
      'Rate-based simulation: Flowsheet modeling with kinetics of carbamate formation and thermal desorber column.',
      'Energy optimization: Cross-exchanger heat recovery optimization and stripper operating pressure study.'
    ],
    tools: ['Bench packed glass column (Sulzer/Raschig)', 'NDIR CO2 flue gas analyzer', 'Aspen Plus / DWSIM', 'Chittick gasometric apparatus', 'Mass flow controllers'],
    difficulty: 'Advanced',
    type: 'Hybrid',
    expectedOutput: '>90% CO2 capture efficiency with verified KLa correlation and validated stripper reboiler thermal duty benchmark.',
    deliverables: ['Converged Aspen Plus simulation file (.bkp)', 'Empirical mass transfer correlation model', 'Process Flow Diagram with Heat & Mass Balances', 'Technical energy abatement report'],
    skillsRequired: ['Rate-based mass transfer', 'Electrolyte thermodynamics (e-NRTL)', 'Aspen Plus / DWSIM modeling', 'Industrial gas analysis'],
    researchQuestions: [
      'How does the L/G ratio influence the temperature bulge location within the packed absorption bed?',
      'What are the trade-offs between amine degradation rates and regenerator operating pressure?',
      'Can blended amines (MEA + MDEA) reduce the total stripping thermal penalty without sacrificing capture speed?'
    ]
  },
  {
    id: 5,
    domain: 'water',
    title: 'Low-Cost Biosand Water Filter',
    area: 'Environmental Engineering & Separation Processes',
    problem: 'Rural and peri-urban households drink untreated groundwater and surface runoff; imported commercial filters are cost-prohibitive for low-income communities.',
    approach: 'Layer graded sand/gravel columns to nurture an active biological schmutzdecke layer; evaluate turbidity, pathogen, and heavy metal removal across flow rates for local sand media.',
    objectives: [
      'Determine grain size distribution and uniformity coefficient of local quartz sand media.',
      'Establish and maintain an active biological layer (schmutzdecke) for microbiological pathogen predation.',
      'Quantify turbidity, suspended solids, and total coliform removal over a 60-day operational lifespan.',
      'Develop an open-source, locally fabricable design with step-by-step casting instructions.'
    ],
    methodology: [
      'Media selection & grading: Sieve analysis per ASTM C136 to achieve effective size (d10 = 0.15–0.20 mm).',
      'Filter assembly: Multi-layer column assembly (underdrain gravel, separating gravel, core filtration sand).',
      'Biological ripening: Daily dosing with raw surface water to cultivate active aerobic biofilm at the sand-water interface.',
      'Water quality monitoring: Daily measurement of influent vs effluent turbidity, pH, and dissolved oxygen.',
      'Microbiological validation: Membrane filtration culturing for E. coli and total coliform quantification.'
    ],
    tools: ['Acrylic / concrete filter column', 'ASTM standard sieve set', 'Nephelometric turbidity meter', 'Microbial membrane filtration kit', 'Coliform incubator'],
    difficulty: 'Beginner',
    type: 'Experimental',
    expectedOutput: 'Effluent turbidity consistently < 1.0 NTU with > 98% coliform bacteria removal and sustainable flow rate of 30–40 L/hr.',
    deliverables: ['Open-source fabrication manual & drawings', 'Sand media grading curve specifications', '60-day filtration breakthrough dataset', 'Community deployment guide'],
    skillsRequired: ['Particle technology & sieving', 'Porous media Darcy flow', 'Water microbiology assaying', 'Low-cost design engineering'],
    researchQuestions: [
      'What is the minimum standing water depth required to preserve schmutzdecke oxygenation during idle pause periods?',
      'How does sand uniformity coefficient affect flow rate decline and bed clogging frequency?',
      'Can an iron-enriched sand layer effectively remove arsenic and heavy metals simultaneously?'
    ]
  },
  {
    id: 6,
    domain: 'water',
    title: 'Phytoremediation of Industrial Effluent',
    area: 'Biochemical Engineering & Wastewater Treatment',
    problem: 'Textile and tanning clusters release toxic heavy metals (Cr, Ni, Pb) and synthetic dyes into irrigation canals; chemical treatment is unaffordable for small enterprises.',
    approach: 'Cultivate aquatic macrophytes (water hyacinth / duckweed) in synthetic and real industrial effluent; measure bioaccumulation factors, translocation kinetics, and design pilot constructed wetlands.',
    objectives: [
      'Quantify heavy metal (Cr and Pb) and azo dye removal efficiencies across varied plant biomass densities.',
      'Calculate Bioconcentration Factor (BCF) and Translocation Factor (TF) for root vs shoot tissues.',
      'Fit contaminant uptake rates to pseudo-first and pseudo-second-order kinetic adsorption-uptake models.',
      'Design a free-water surface constructed wetland sizing protocol for a 50 m³/day textile wash facility.'
    ],
    methodology: [
      'Effluent characterization: Baseline testing for COD, BOD5, total dissolved solids, and heavy metal concentrations.',
      'Plant acclimatization: Growing Lemna minor and Eichhornia crassipes in nutrient media before toxic exposure.',
      'Batch exposure trials: 21-day incubation with scheduled aqueous sampling every 48 hours.',
      'Tissue acid digestion: Microwave-assisted nitric acid digestion of harvested root and shoot biomass.',
      'Spectroscopic analysis: Atomic Absorption Spectroscopy (AAS) and UV-Vis spectrophotometry for dye degradation.'
    ],
    tools: ['Constructed wetland pilot microcosms', 'Atomic Absorption Spectrometer (AAS)', 'UV-Vis Spectrophotometer', 'Microwave digestion system', 'pH & DO analytical probes'],
    difficulty: 'Beginner',
    type: 'Experimental',
    expectedOutput: '> 85% heavy metal removal within 14 days with validated bioconcentration factors exceeding 1,000 for chromium.',
    deliverables: ['Plant uptake kinetic curves', 'Pilot constructed wetland engineering layout', 'AAS analytical calibration dataset', 'Harvested biomass disposal & ash protocol'],
    skillsRequired: ['Environmental analytical chemistry', 'Spectroscopic instrumentation (AAS)', 'Biokinetic modeling', 'Constructed wetland hydraulics'],
    researchQuestions: [
      'Which plant species exhibits superior tolerance and accumulation capacity for hexavalent chromium?',
      'What is the threshold heavy metal concentration that induces chlorosis and plant mortality?',
      'Can spent hyperaccumulating biomass be safely processed via pyrolytic biochar immobilization?'
    ]
  },
  {
    id: 7,
    domain: 'water',
    title: 'Forward Osmosis for RO Brine Concentration',
    area: 'Membrane Technology & Separation Processes',
    problem: 'Desalination plants discharge hypersaline reject brine back to ecosystems; zero liquid discharge (ZLD) is hindered by high osmotic pressures exceeding hydraulic RO limits.',
    approach: 'Build a bench-scale forward osmosis (FO) cross-flow test cell utilizing thermolytic draw solutes (NH4HCO3) to concentrate RO brine beyond 100,000 ppm TDS without external hydraulic pressure.',
    objectives: [
      'Evaluate water flux (Jw) and reverse solute flux (Js) across thin-film composite (TFC) FO membranes.',
      'Compare performance of thermolytic draw solutes against conventional inorganic salts (NaCl, MgCl2).',
      'Quantify internal concentration polarization (ICP) resistance in both AL-FS and AL-DS membrane orientations.',
      'Model thermal energy duty required for low-temperature (60 °C) draw solute recovery.'
    ],
    methodology: [
      'Cross-flow cell testing: Dual variable-speed gear pumps recirculating feed brine and concentrated draw solution.',
      'Dynamic flux measurement: Digital analytical balance logging permeate mass transfer automatically every 30 seconds.',
      'Conductivity monitoring: Real-time logging of feed tank conductivity to quantify reverse salt diffusion.',
      'Orientation evaluation: Active Layer facing Feed Solution (AL-FS) vs Active Layer facing Draw Solution (AL-DS).',
      'Draw recovery simulation: Aspen Plus distillation column simulation for ammonium bicarbonate thermal cleavage.'
    ],
    tools: ['Cross-flow FO membrane test cell', 'Digital precision balance with RS232 logger', 'Dual conductivity data loggers', 'Draw solute recovery thermal rig', 'Aspen Plus / MATLAB'],
    difficulty: 'Advanced',
    type: 'Experimental',
    expectedOutput: 'Concentration of desalination reject brine from 45,000 ppm to > 110,000 ppm TDS with water flux > 10 LMH.',
    deliverables: ['Membrane water and solute flux profiles', 'Internal concentration polarization model', 'Thermolytic draw solute recovery flowsheet', 'Zero Liquid Discharge feasibility analysis'],
    skillsRequired: ['Membrane transport theory', 'Osmotic pressure thermodynamics', 'Cross-flow hydrodynamics', 'Thermal separation modeling'],
    researchQuestions: [
      'How does structural parameter (S) of the membrane substrate govern dilutive internal concentration polarization?',
      'What is the optimal draw solution temperature to balance high water flux against membrane stability?',
      'What is the specific thermal energy consumption (kWh/m³) for thermal draw solute recovery?'
    ]
  },
  {
    id: 8,
    domain: 'water',
    title: 'Rainwater Harvesting & Treatment System',
    area: 'Fluid Mechanics & Environmental Infrastructure',
    problem: 'Urban institutions experience severe seasonal water shortages despite torrential monsoon downpours; stormwater runoff is lost and causes street flooding.',
    approach: 'Design an engineered campus rooftop rainwater harvesting system with automated first-flush diversion, settling chambers, and multi-media filtration; simulate multi-year yields using local rainfall datasets.',
    objectives: [
      'Perform statistical hydrological analysis on 10-year local rainfall data to establish intensity-duration curves.',
      'Design an automated mechanical first-flush diversion valve to discard initial contaminated roof washings.',
      'Engineer a multi-media filtration train (gravel, activated carbon, sand) to achieve non-potable utility standards.',
      'Conduct life-cycle cost analysis and municipal water grid demand reduction calculations.'
    ],
    methodology: [
      'Catchment area audit: Surface runoff coefficient estimation across concrete, metal, and tile rooftops.',
      'Hydrological modeling: Calculating mass curve storage requirements for campus operational dry months.',
      'Hydraulic design: Sizing gutters, downspouts, first-flush chambers, and gravity sedimentation tanks.',
      'Filtration prototype: Building a pilot 3-stage filtration skid and testing turbidity, TDS, and microbiological quality.',
      'Economic assessment: Sizing subterranean cisterns and calculating capital payback period.'
    ],
    tools: ['Rainfall historical dataset', 'EPANET / AutoCAD / Civil3D', 'Water quality analytical kits', 'Pilot filtration column skid', 'Hydraulic calculation models'],
    difficulty: 'Beginner',
    type: 'Hybrid',
    expectedOutput: 'Engineered stormwater harvesting system satisfying > 35% of campus non-potable water demand with a 3.2-year payback.',
    deliverables: ['CAD architectural & hydraulic drawings', 'Mass-curve reservoir sizing calculation ledger', 'First-flush separation efficiency dataset', 'Financial payback & life-cycle cost model'],
    skillsRequired: ['Hydraulic flow in open channels & pipes', 'Hydrological mass balancing', 'CAD layout design', 'Engineering economics'],
    researchQuestions: [
      'What first-flush depth (mm) is required to remove 90% of roof atmospheric dust and bird droppings?',
      'How does storage tank capacity optimize the trade-off between installation cost and seasonal water reliability?',
      'What filtration media configuration provides maximum throughput with minimum backwash frequency?'
    ]
  },
  {
    id: 9,
    domain: 'materials',
    title: 'Bioplastic from Banana Peel Starch',
    area: 'Materials Science & Polymer Engineering',
    problem: 'Petroleum-based single-use packaging plastics persist in landfills for centuries; agricultural starch from food processing waste is biodegradable but suffers from brittleness.',
    approach: 'Extract and purify starch from discarded banana peels; formulate thermoplastic starch films using glycerol and sorbitol plasticizers; measure tensile strength, water solubility, and soil biodegradability.',
    objectives: [
      'Extract high-purity starch from ripe and unripe banana peels with maximum yield.',
      'Formulate bioplastic films by varying plasticizer concentration (glycerol: 15–35 wt%) and organic crosslinkers.',
      'Measure mechanical tensile strength, elongation at break, water vapor permeability, and thermal stability.',
      'Quantify soil burial degradation rate over 30 days under standardized environmental conditions.'
    ],
    methodology: [
      'Starch extraction: Peels washing, antioxidant bleaching (citric acid), milling, centrifugation, and oven drying.',
      'Gelatinization & casting: Aqueous heating at 80 °C with glycerol plasticizer and mild acetic acid crosslinker.',
      'Curing: Casting onto non-stick Teflon trays and drying at 50 °C in a vacuum oven for 24 hours.',
      'Mechanical testing: Tensile testing per ASTM D882 using a Universal Testing Machine (UTM).',
      'Characterization: FTIR spectroscopy for functional group verification, moisture absorption, and soil burial tests.'
    ],
    tools: ['Film casting applicator & Teflon trays', 'Universal Testing Machine (UTM)', 'FTIR Spectrometer', 'Moisture balance analyzer', 'Thermogravimetric analyzer (TGA)'],
    difficulty: 'Beginner',
    type: 'Experimental',
    expectedOutput: 'Biodegradable packaging film with tensile strength > 16 MPa, elongation > 25%, and complete soil breakdown in < 28 days.',
    deliverables: ['Starch extraction protocol SOP', 'Stress-strain mechanical curves', 'FTIR functional group spectra', '30-day soil degradation log with photographic evidence'],
    skillsRequired: ['Polymer solution casting', 'Mechanical testing standards (ASTM)', 'Spectroscopic analysis (FTIR)', 'Green chemical formulation'],
    researchQuestions: [
      'What plasticizer ratio yields optimum flexibility without causing excessive water solubility?',
      'How does starch amylose-to-amylopectin ratio in banana peels compare with corn starch for film integrity?',
      'Can natural crosslinkers (citric acid / glutaraldehyde) improve bioplastic moisture resistance?'
    ]
  },
  {
    id: 10,
    domain: 'materials',
    title: 'Fly-Ash Geopolymer Concrete',
    area: 'Materials Engineering & Industrial Waste Valorization',
    problem: 'Coal-fired power stations produce millions of tons of fly ash that is dumped in landfills; Ordinary Portland Cement (OPC) manufacturing is responsible for 8% of global CO2 emissions.',
    approach: 'Synthesize zero-cement geopolymer binder by activating industrial fly ash with alkaline sodium silicate and sodium hydroxide solutions; investigate curing regimes and compressive strength development.',
    objectives: [
      'Characterize coal fly ash chemical composition (XRF) and crystalline phases (XRD).',
      'Optimize alkaline activator ratio (Na2SiO3 : NaOH) and liquid-to-solid binder ratio for workability.',
      'Determine compressive strength development at 3, 7, and 28 days under ambient and thermal curing regimes.',
      'Perform embodied carbon life-cycle assessment comparing geopolymer concrete against standard OPC.'
    ],
    methodology: [
      'Raw material characterization: Particle size distribution and X-ray fluorescence elemental composition.',
      'Activator preparation: Mixing NaOH pellets (10–14 M) with sodium silicate solution, aged for 24 hours.',
      'Mixing & casting: Planetary mortar mixing of fly ash, activator, and graded river sand into 50 mm cube molds.',
      'Curing: Comparing heat curing (60–80 °C for 24 hrs) against ambient room-temperature curing.',
      'Mechanical & structural testing: Compressive strength testing per ASTM C109 and SEM-EDX microstructural imaging.'
    ],
    tools: ['Compression testing machine (200 kN)', 'Planetary mortar mixer & vibrating table', 'Environmental curing oven', 'SEM-EDX microscope', 'XRF / XRD spectrometer'],
    difficulty: 'Intermediate',
    type: 'Experimental',
    expectedOutput: 'Zero-cement structural mortar reaching > 38 MPa 28-day compressive strength with a 72% reduction in embodied CO2.',
    deliverables: ['Mix design proportioning matrix', 'Strength vs curing time curves', 'SEM microstructure micrographs', 'Life-cycle carbon abatement calculation'],
    skillsRequired: ['Inorganic polymer chemistry', 'Concrete testing standards (ASTM)', 'Microstructural analysis (SEM)', 'Alkaline activator safety handling'],
    researchQuestions: [
      'What NaOH molarity achieves maximum aluminosilicate dissolution without causing alkali-silica efflorescence?',
      'Can ambient curing strength be improved by partial replacement with ground granulated blast-furnace slag (GGBS)?',
      'How does geopolymer concrete perform under aggressive acidic and sulfate exposure compared to Portland cement?'
    ]
  },
  {
    id: 11,
    domain: 'materials',
    title: 'Recycled PET into Composite Panels',
    area: 'Polymer Processing & Circular Economy',
    problem: 'Post-consumer PET beverage bottles litter waterways and urban drains; mechanical recycling into textile fiber is saturated, demanding high-value structural upcycling routes.',
    approach: 'Shred post-consumer PET bottles, combine with surface-modified natural agricultural fibers (rice husk / sawdust), and hot-press mold into high-strength architectural building panels.',
    objectives: [
      'Optimize shredding, hot-washing, and drying protocols for post-consumer PET bottle flake.',
      'Surface-modify natural fiber fillers using silane coupling agents to enhance interfacial adhesion with PET.',
      'Identify optimum hot-press compression molding parameters (temperature, pressure, dwell time).',
      'Characterize flexural strength, impact resistance, thermal conductivity, and water absorption.'
    ],
    methodology: [
      'Flake preparation: Shredding bottles, caustic washing at 80 °C to remove adhesives, and dehumidified drying.',
      'Filler compounding: Blending PET flakes with 20–40 wt% treated rice husk in a high-shear mechanical mixer.',
      'Compression molding: Hot platen pressing at 240–260 °C under 8–12 MPa pressure with staged degas breathing cycles.',
      'Sample preparation: Precision CNC cutting of test coupons for mechanical characterization.',
      'Mechanical testing: Flexural testing (ASTM D790), Izod impact (ASTM D256), and 24-hr water immersion swelling.'
    ],
    tools: ['Industrial plastic granulator', 'Heated hydraulic compression press', '3-point bend flexural test fixture', 'Izod impact pendulum tester', 'Thermal conductivity meter'],
    difficulty: 'Intermediate',
    type: 'Experimental',
    expectedOutput: 'Architectural composite panel with flexural modulus > 2.5 GPa, flexural strength > 30 MPa, and water absorption < 1.5%.',
    deliverables: ['Hot-press processing window map', 'Flexural and impact test datasets', 'Physical sample panel prototype', 'Commercial techno-economic manufacturing model'],
    skillsRequired: ['Thermoplastic compression molding', 'Composite interfacial mechanics', 'Mechanical testing standards', 'Recycling wash-line engineering'],
    researchQuestions: [
      'What temperature-time-pressure profile prevents thermal degradation of PET during composite compression molding?',
      'How does silane coupling agent concentration impact interfacial shear strength between hydrophobic PET and hydrophilic fiber?',
      'What is the acoustic and thermal insulation performance compared to standard gypsum ceiling tiles?'
    ]
  },
  {
    id: 12,
    domain: 'materials',
    title: 'Polymer Membrane for Water Purification',
    area: 'Membrane Science & Materials Chemistry',
    problem: 'Industrial wastewater treatment requires robust ultrafiltration membranes, but commercial polymeric membranes suffer from severe organic fouling and flux decline.',
    approach: 'Synthesize flat-sheet ultrafiltration membranes using polyvinylidene fluoride (PVDF) via non-solvent induced phase separation (NIPS); incorporate hydrophilic TiO2 nanoparticles to enhance antifouling.',
    objectives: [
      'Synthesize nanocomposite PVDF membranes with varying TiO2 nanoparticle loadings (0.1–1.0 wt%).',
      'Characterize membrane morphology (cross-section sponge vs finger-like pores) and surface roughness.',
      'Measure clean water permeability, bovine serum albumin (BSA) protein rejection, and flux recovery ratio (FRR).',
      'Evaluate photocatalytic self-cleaning capability under low-intensity UV irradiation.'
    ],
    methodology: [
      'Dope solution preparation: Dissolving PVDF polymer and PVP pore-former in NMP solvent at 60 °C with sonication.',
      'Nanoparticle dispersion: Ultrasonic dispersion of TiO2 nanoparticles to prevent agglomeration.',
      'Phase inversion casting: Knife casting (200 µm thickness) followed by immersion in deionized water coagulation bath.',
      'Filtration testing: Dead-end stirred cell testing for pure water flux, protein rejection, and cyclic fouling runs.',
      'Surface analysis: Contact angle goniometry for surface wettability and SEM for cross-sectional pore morphology.'
    ],
    tools: ['Precision doctor blade film casting knife', 'Dead-end stirred membrane cell (Amicon)', 'Optical contact angle goniometer', 'UV-Vis Spectrophotometer', 'SEM electron microscope'],
    difficulty: 'Advanced',
    type: 'Experimental',
    expectedOutput: 'Antifouling ultrafiltration membrane with pure water flux > 180 LMH/bar, BSA rejection > 92%, and flux recovery ratio > 85%.',
    deliverables: ['Membrane casting operating procedure', 'Contact angle wettability curves', 'Cyclic protein fouling and recovery plots', 'SEM cross-sectional pore micrographs'],
    skillsRequired: ['Polymer phase inversion casting', 'Nanomaterial surface functionalization', 'Membrane filtration transport physics', 'Spectroscopic quantification'],
    researchQuestions: [
      'How does coagulation bath temperature and composition alter finger-like vs spongy pore morphology?',
      'What is the critical TiO2 nanoparticle threshold before agglomeration creates macro-void structural defects?',
      'Can UV-induced photocatalytic hydroxyl radical generation completely degrade adsorbed foulants on the membrane surface?'
    ]
  },
  {
    id: 13,
    domain: 'bio',
    title: 'Antibacterial Activity of Plant Extracts',
    area: 'Biochemical Engineering & Natural Products',
    problem: 'Hospital-acquired pathogens increasingly resist conventional antibiotics; local botanical resources contain potent bioactive phytochemicals that lack standardized extraction benchmarks.',
    approach: 'Extract bioactive phytochemicals (polyphenols, flavonoids) from Azadirachta indica (Neem) and Ocimum sanctum (Tulsi) using conventional vs ultrasound-assisted extraction; determine minimum inhibitory concentrations.',
    objectives: [
      'Compare bioactive extraction yield between maceration, Soxhlet, and ultrasound-assisted extraction (UAE).',
      'Quantify total phenolic content (TPC) and total flavonoid content (TFC) via colorimetric assays.',
      'Determine minimum inhibitory concentration (MIC) and minimum bactericidal concentration (MBC) against E. coli and S. aureus.',
      'Formulate a natural sanitizing gel and benchmark stability over a 90-day period.'
    ],
    methodology: [
      'Biomass pre-treatment: Washing, shade drying at 35 °C, precision hammer milling, and moisture determination.',
      'Extraction optimization: Varying ethanol-water solvent ratio (50–100%), ultrasonic power, and extraction time.',
      'Concentration: Rotary vacuum evaporation at 40 °C to recover solvent and produce crude botanical extract.',
      'Phytochemical quantification: Folin-Ciocalteu assay for phenolics and aluminum chloride assay for flavonoids.',
      'Bioassay: Micro-broth dilution and agar well diffusion testing to measure bacterial zones of inhibition.'
    ],
    tools: ['Ultrasonic extraction bath', 'Rotary vacuum evaporator', 'Microplate spectrophotometer reader', 'Laminar flow biosafety cabinet', 'Bacteriological incubator'],
    difficulty: 'Beginner',
    type: 'Experimental',
    expectedOutput: 'Standardized antimicrobial botanical extract with verified MIC < 1.25 mg/mL against S. aureus and > 30% higher phenolic yield via ultrasound.',
    deliverables: ['Comparative extraction efficiency matrix', 'Zone of inhibition statistical graphs', 'Antimicrobial formulation SOP', 'Phytochemical analytical datasheet'],
    skillsRequired: ['Aseptic microbiological assaying', 'Ultrasound-assisted extraction', 'Colorimetric spectrophotometry', 'Phytochemical screening'],
    researchQuestions: [
      'How does ultrasound cavitation frequency influence cellular wall rupture and secondary metabolite release?',
      'What is the synergistic antimicrobial effect observed when combining Neem and Tulsi extracts?',
      'How stable are the bioactive polyphenols against photodegradation and thermal oxidation during storage?'
    ]
  },
  {
    id: 14,
    domain: 'bio',
    title: 'Fermentation of Agro-Waste to Ethanol',
    area: 'Biochemical Engineering & Industrial Biotechnology',
    problem: 'Sugarcane bagasse and citrus peel waste are burned or discarded, creating air pollution; second-generation bioethanol from lignocellulose is key for sustainable fuel blending.',
    approach: 'Subject agro-waste biomass to dilute acid thermochemical pre-treatment, enzymatic saccharification, and anaerobic fermentation using Saccharomyces cerevisiae; model fermentation kinetics.',
    objectives: [
      'Optimize dilute acid pre-treatment severity to maximize hemicellulose solubilization while minimizing furfural inhibitors.',
      'Evaluate cellulase enzyme loading and hydrolysis kinetics for glucose and xylose sugar release.',
      'Conduct anaerobic batch fermentation to evaluate ethanol yield and productivity.',
      'Model biomass growth and substrate utilization using Monod and Luedeking-Piret kinetic equations.'
    ],
    methodology: [
      'Thermochemical pre-treatment: Autoclave dilute H2SO4 treatment (1–2 wt%, 121 °C, 30 min) of ground agro-residue.',
      'Enzymatic saccharification: Incubation with commercial cellulase at 50 °C, pH 4.8 for 48 hours.',
      'Sugar analysis: Dinitrosalicylic acid (DNS) assay and HPLC quantification of glucose and cellobiose.',
      'Fermentation: Inoculating yeast culture into detoxified hydrolysate in a temperature-controlled bioreactor at 30 °C.',
      'Product recovery: Fractional distillation and alcohol determination via digital refractometry and hydrometer.'
    ],
    tools: ['Benchtop stirred autoclave digestor', 'Laboratory bioreactor fermenter', 'UV-Vis Spectrophotometer (DNS assay)', 'Digital refractometer & hydrometer', 'High-Performance Liquid Chromatograph (HPLC)'],
    difficulty: 'Beginner',
    type: 'Experimental',
    expectedOutput: 'Ethanol concentration > 6.5% v/v in raw fermentation broth with cellulose-to-glucose conversion efficiency > 80%.',
    deliverables: ['Pre-treatment severity optimization map', 'Fermentation kinetic profiles (sugar, biomass, ethanol)', 'Stoichiometric mass and carbon balance table', 'Second-generation ethanol process flowsheet'],
    skillsRequired: ['Enzymatic hydrolysis kinetics', 'Anaerobic bioreactor operation', 'Analytical spectrophotometry', 'Microbial fermentation modeling'],
    researchQuestions: [
      'What pre-treatment conditions balance maximum monomeric sugar yield against furfural yeast inhibitor formation?',
      'How does substrate feedback inhibition affect cellulase enzyme adsorption on residual lignin?',
      'What is the net energy ratio (NER) of the entire biomass-to-fuel conversion process?'
    ]
  },
  {
    id: 15,
    domain: 'bio',
    title: 'Algae Cultivation for Lipid Extraction',
    area: 'Bioprocess Engineering & Biofuels',
    problem: 'Terrestrial biofuel crops compete directly with food crops for arable land and freshwater; microalgae offer 10× higher areal oil productivity but require local culturing optimization.',
    approach: 'Cultivate Chlorella vulgaris in a bubble column photobioreactor with CO2 flue gas sparging; induce nitrogen-deprivation stress to boost cellular lipid accumulation; extract neutral lipids for biodiesel.',
    objectives: [
      'Determine growth kinetics (maximum specific growth rate µmax) under varied CO2 enrichment levels (1–8%).',
      'Implement nitrogen starvation strategies to trigger cellular triacylglycerol (TAG) lipid accumulation.',
      'Compare cell disruption techniques (sonication, bead milling, microwave) on total extractable lipid yield.',
      'Characterize fatty acid methyl ester (FAME) composition to assess cetane number and cold-flow properties.'
    ],
    methodology: [
      'Photobioreactor setup: Vertical bubble column with filtered air and regulated CO2 sparging under continuous LED lights.',
      'Growth monitoring: Daily optical density (OD680) logging and dry cell weight (DCW) gravimetric measurement.',
      'Nutrient starvation phase: Centrifugation and re-suspension of mature algal biomass in nitrogen-free medium.',
      'Cell lysis & extraction: Ultrasonic disruption followed by green solvent (ethyl acetate/ethanol) lipid extraction.',
      'Transesterification & GC: In situ transesterification and GC-MS profiling of extracted algal lipids.'
    ],
    tools: ['Column photobioreactor rig', 'Gas blending manifold & CO2 sensors', 'High-speed cooling centrifuge', 'Ultrasonic cell disrupter', 'GC-MS Spectrometer'],
    difficulty: 'Intermediate',
    type: 'Hybrid',
    expectedOutput: 'Biomass productivity > 0.45 g/L/day with cellular lipid content exceeding 34% dry cell weight under nitrogen stress.',
    deliverables: ['Photobioreactor design & aeration blueprint', 'Algal growth and lipid accumulation kinetic curves', 'Cell lysis energy efficiency comparison', 'Biodiesel fuel property compliance report'],
    skillsRequired: ['Phototrophic bioreactor design', 'Algal physiology & nutrient kinetics', 'Cellular lysis & lipid chemistry', 'Chromatographic fatty acid profiling'],
    researchQuestions: [
      'What CO2 sparging concentration maximizes carbon fixation without causing culture medium acidification below pH 6.5?',
      'How many days of nitrogen starvation maximize lipid productivity before total biomass degradation occurs?',
      'What is the parasitic energy consumption of algal harvesting and dewatering per liter of crude bio-oil?'
    ]
  },
  {
    id: 16,
    domain: 'bio',
    title: 'Drug Release Kinetics of Hydrogel Beads',
    area: 'Pharmaceutical Engineering & Controlled Release',
    problem: 'Oral pharmaceutical formulations often suffer from burst release in gastric acid, causing stomach irritation and poor bioavailability; controlled-release matrix engineering is critical.',
    approach: 'Synthesize crosslinked sodium alginate-chitosan polyelectrolyte hydrogel beads via ionotropic gelation; encapsulate a model therapeutic compound and model release kinetics across simulated digestive fluids.',
    objectives: [
      'Formulate crosslinked alginate-chitosan hydrogel micro-beads with high drug encapsulation efficiency (> 85%).',
      'Characterize bead swelling dynamics, pore structure, and chemical interactions via FTIR and optical microscopy.',
      'Quantify in vitro drug dissolution kinetics across Simulated Gastric Fluid (pH 1.2) and Simulated Intestinal Fluid (pH 7.4).',
      'Fit dissolution data to mathematical models (Zero-Order, First-Order, Higuchi, Korsmeyer-Peppas).'
    ],
    methodology: [
      'Bead fabrication: Syringe pump extrusion of sodium alginate/drug solution into CaCl2 crosslinking bath.',
      'Surface coating: Polyelectrolyte complexation in chitosan solution (pH 5.0) to form protective outer membrane.',
      'Bead washing & drying: Lyophilization or controlled room-temperature drying to constant weight.',
      'In vitro dissolution: USP dissolution paddle apparatus at 37 °C with automated sampling every 30 minutes.',
      'Kinetic regression: Nonlinear regression to determine diffusion release mechanism (Fickian vs anomalous transport).'
    ],
    tools: ['Precision automated syringe pump', 'USP dissolution testing apparatus', 'UV-Vis Spectrophotometer', 'Optical stereo microscope', 'Python / Origin kinetic modeling toolkit'],
    difficulty: 'Advanced',
    type: 'Experimental',
    expectedOutput: 'pH-triggered controlled release system with < 15% drug loss in simulated stomach acid and sustained release over 8 hours in intestinal pH.',
    deliverables: ['Hydrogel formulation batch protocol', 'In vitro dissolution profile curves', 'Mathematical kinetic model fit parameters', 'Bead morphology and swelling index datasheet'],
    skillsRequired: ['Hydrogel polymer crosslinking', 'Pharmaceutical dissolution testing', 'Mass transfer diffusion kinetics', 'Mathematical non-linear regression'],
    researchQuestions: [
      'How does chitosan coating molecular weight influence structural barrier integrity in acidic gastric conditions?',
      'What value of the Korsmeyer-Peppas exponent (n) describes the underlying drug diffusion mechanism?',
      'How does polymer-to-drug ratio govern the initial burst release phenomenon?'
    ]
  },
  {
    id: 17,
    domain: 'process',
    title: 'Microwave-Assisted Extraction of Essential Oils',
    area: 'Process Intensification & Separation Technology',
    problem: 'Conventional hydrodistillation and Soxhlet extraction require hours of boiling, consume immense electrical energy, and often degrade heat-sensitive terpenes and aromatic esters.',
    approach: 'Develop a specialized microwave-assisted extraction (MAE) system with a modified reflux Clevenger apparatus; optimize microwave power, moisture content, and time; benchmark against conventional hydrodistillation.',
    objectives: [
      'Design a laboratory microwave extraction reactor linked to an external water-cooled Clevenger condenser.',
      'Investigate the impact of microwave irradiation power (200–600 W) and solid-to-solvent ratio on oil yield.',
      'Quantify specific energy consumption (kWh/mL oil extracted) compared to conventional 4-hour hydrodistillation.',
      'Characterize extracted essential oil composition (limonene, linalool) using GC-MS spectrometry.'
    ],
    methodology: [
      'Feedstock preparation: Standardized particle size comminution of citrus peel / rosemary leaves with moisture control.',
      'Microwave extraction trials: Systematic factorial runs varying radiation power and extraction duration (5–30 min).',
      'Baseline hydrodistillation: Standard 240-minute extraction in a heating mantle Clevenger apparatus.',
      'Energy monitoring: Digital power meter logging cumulative electrical energy consumed during both processes.',
      'Analytical profiling: GC-MS identification of key monoterpenes, oxygenated compounds, and refractive index testing.'
    ],
    tools: ['Modified laboratory microwave reactor', 'Glass Clevenger extraction apparatus', 'Digital power analyzer meter', 'GC-MS Spectrometer', 'Abbe refractometer'],
    difficulty: 'Intermediate',
    type: 'Experimental',
    expectedOutput: '80% reduction in extraction cycle time (from 240 min to 25 min) with equivalent yield and > 70% electrical energy savings.',
    deliverables: ['Microwave extraction apparatus schematic', 'Extraction kinetic yield curves', 'Electrical energy audit comparison ledger', 'GC-MS chromatographic composition report'],
    skillsRequired: ['Process intensification fundamentals', 'Dielectric microwave heating physics', 'Extraction separation equilibrium', 'GC-MS chemical analysis'],
    researchQuestions: [
      'How does dielectric heating of internal moisture cause rapid plant cellular rupture compared to conductive heating?',
      'What microwave power density prevents thermal degradation of volatile monoterpenes?',
      'Can microwave pre-treatment be scaled up economically to continuous industrial conveyor belt extractors?'
    ]
  },
  {
    id: 18,
    domain: 'process',
    title: 'Heat Exchanger Fouling Study',
    area: 'Heat Transfer & Plant Maintenance Optimization',
    problem: 'Fouling in heat exchanger networks costs the process industry billions annually in lost thermal efficiency, increased pumping power, and unscheduled plant shutdowns.',
    approach: 'Operate a concentric tube heat exchanger test rig under controlled scaling conditions (CaSO4 / CaCO3); log temperature and flow data to model asymptotic fouling resistance and optimize cleaning cycles.',
    objectives: [
      'Measure clean vs fouled overall heat transfer coefficient (U) over extended continuous operating cycles.',
      'Evaluate the influence of fluid velocity and surface wall temperature on asymptotic fouling resistance (Rf*).',
      'Fit empirical scaling data to the Kern-Seaton and Ebert-Panchal threshold fouling mathematical models.',
      'Develop an economic model to determine the optimal cleaning frequency that minimizes cumulative operating costs.'
    ],
    methodology: [
      'Rig commissioning: Counter-current concentric tube heat exchanger with hot water loop and cold supersaturated brine loop.',
      'Instrumentation calibration: RTD temperature sensors at all 4 terminal ports, magnetic flowmeters, and differential pressure transmitters.',
      'Continuous data logging: Recording heat duty (Q), Log Mean Temperature Difference (LMTD), and fouling resistance Rf(t).',
      'Parameter sensitivity: Varying Reynolds number (turbulent vs transitional) to analyze shear stress suppression of fouling.',
      'Optimization algorithm: Formulating an objective cost function balancing fuel penalty against cleaning labor and production downtime.'
    ],
    tools: ['Concentric tube heat exchanger test rig', 'Multi-channel RTD temperature logger', 'Magnetic flowmeters & DP cells', 'Chemical descaling circulation system', 'Python / Excel optimization solver'],
    difficulty: 'Intermediate',
    type: 'Hybrid',
    expectedOutput: 'Calibrated dynamic fouling resistance model predicting cleaning intervals with an estimated 15% reduction in annual thermal energy penalties.',
    deliverables: ['Real-time fouling resistance curves (Rf vs time)', 'Ebert-Panchal model regression parameters', 'Economic heat exchanger cleaning schedule matrix', 'Laboratory rig engineering technical manual'],
    skillsRequired: ['Overall heat transfer coefficient calculations', 'LMTD & NTU thermal modeling', 'Industrial instrumentation & DAQ', 'Maintenance optimization economics'],
    researchQuestions: [
      'At what fluid velocity does wall shear stress prevent particulate deposition without excessive pressure drop penalties?',
      'How does surface roughness promote initial crystal nucleation during the fouling induction period?',
      'What is the economically optimal threshold for chemical CIP (clean-in-place) versus mechanical tube cleaning?'
    ]
  },
  {
    id: 19,
    domain: 'process',
    title: 'Distillation Column Optimisation via Simulation',
    area: 'Process Simulation, Separation & Energy Integration',
    problem: 'Refineries and petrochemical columns operate off-optimum, wasting massive boiler steam; tray-by-tray simulation can discover hidden thermodynamic efficiency gains.',
    approach: 'Build and validate a rigorous multi-component distillation column simulation in Aspen Plus / DWSIM against real operational plant data; perform pinch analysis and optimize feed tray and reflux ratio.',
    objectives: [
      'Model an industrial multi-component depropanizer or benzene-toluene separation column in Aspen Plus.',
      'Validate thermodynamic property packages (Peng-Robinson, SRK, NRTL) against experimental VLE equilibrium data.',
      'Execute sensitivity analysis on feed tray location, reflux ratio, column pressure, and side-stream draws.',
      'Apply thermal pinch analysis and internal heat integration to cut condenser and reboiler duties by > 15%.'
    ],
    methodology: [
      'Data gathering: Collecting industrial column operating conditions (feed composition, tray count, pressure, purity).',
      'Thermodynamic verification: Regressing binary interaction parameters to match literature vapor-liquid equilibrium curves.',
      'Rigorous flowsheet convergence: RadFrac column model convergence with design specifications on product purity.',
      'Parametric optimization: Automated sensitivity runs varying reflux ratio (1.1–2.0 × Rmin) and feed stage.',
      'Hydraulic sizing: Sizing column diameter, downcomer area, and checking weeping and flooding margins (Fair correlation).'
    ],
    tools: ['Aspen Plus / DWSIM Process Simulator', 'NIST Chemistry WebBook / DECHEMA VLE database', 'Column hydraulic sizing utilities', 'Excel Pinch Energy Integration Toolkit'],
    difficulty: 'Advanced',
    type: 'Simulation',
    expectedOutput: 'Converged rigorous column flowsheet with > 18% reduction in reboiler heat duty and payback under 1.2 years for feed tray retrofit.',
    deliverables: ['Converged Aspen Plus simulation file (.bkp)', 'Detailed Process Flow Diagram (PFD) with stream tables', 'Composite thermal pinch curves & utility reduction report', 'Column tray hydraulic rating datasheet'],
    skillsRequired: ['Rigorous multi-component distillation theory', 'Thermodynamic EOS & activity models', 'Aspen Plus / DWSIM flowsheet mastery', 'Column hydraulic flooding calculations'],
    researchQuestions: [
      'How does feed thermal condition (subcooled vs saturated liquid) shift the optimal feed tray location?',
      'What is the economic optimum trade-off between higher capital cost (more trays) and operational cost (lower reflux ratio)?',
      'Can vapor recompression (heat pump distillation) achieve favorable economics for low relative-volatility separations?'
    ]
  },
  {
    id: 20,
    domain: 'process',
    title: 'Reactive Distillation for Ester Production',
    area: 'Reaction Engineering & Process Intensification',
    problem: 'Equilibrium-limited esterification reactions require separate reactor and multi-column separation trains with high recycle rates, resulting in heavy capital expenditure.',
    approach: 'Design and simulate a reactive distillation column combining esterification kinetics and continuous product separation in a single vessel; evaluate capital cost reduction and energy savings.',
    objectives: [
      'Model the reversible liquid-phase esterification of acetic acid with methanol over Amberlyst-15 ion-exchange resin.',
      'Configure a reactive distillation column with non-reactive rectifying and stripping zones in Aspen Plus.',
      'Eliminate chemical equilibrium conversion limitations by in situ removal of water and methyl acetate.',
      'Compare total annualized cost (TAC) of reactive distillation against conventional reactor-separator flowsheets.'
    ],
    methodology: [
      'Kinetic modeling: Parameterizing Langmuir-Hinshelwood or pseudo-homogeneous reaction kinetic rate expressions.',
      'VLE/VLLE thermodynamic validation: Selecting Wilson or NRTL-HOC models to account for vapor-phase dimerization of carboxylic acids.',
      'Column configuration: Defining reactive stage window, catalyst volume, reflux ratio, and dual feed locations.',
      'Sensitivity optimization: Investigating the effect of stoichiometric feed ratio (acid:alcohol) on conversion and purity.',
      'Economic benchmarking: Sizing vessels, heat exchangers, and calculating Guthrie module capital equipment costs.'
    ],
    tools: ['Aspen Plus (RadFrac with reactive stages)', 'Reaction kinetics regression software', 'Equipment capital cost estimation spreadsheets', 'Chemical Engineering Plant Cost Index (CEPCI) database'],
    difficulty: 'Advanced',
    type: 'Simulation',
    expectedOutput: 'Near 100% conversion of limiting reactant with 40% reduction in capital expenditure and 30% lower steam consumption.',
    deliverables: ['Rigorous reactive distillation simulation file', 'Column internal concentration and temperature profiles', 'Total Annualized Cost (TAC) economic ledger', 'Comparative process flowsheet dossier'],
    skillsRequired: ['Heterogeneous catalytic reaction kinetics', 'Vapor-liquid-reaction equilibrium (VLRE)', 'Process intensification synthesis', 'Equipment capital cost estimation'],
    researchQuestions: [
      'How does the relative location of the alcohol and acid feed trays govern the reactive zone hold-up?',
      'What operational parameters prevent catalyst dry-out and thermal deactivation inside the reactive packing?',
      'What control strategy maintains top product purity during feed composition disturbances?'
    ]
  },
  {
    id: 21,
    domain: 'safety',
    title: 'HAZOP Study of a Fertilizer Unit (Case Study)',
    area: 'Process Safety & Risk Management',
    problem: 'Industrial chemical plants handle hazardous toxic and flammable gases; inadequate hazard identification leads to catastrophic loss-of-containment incidents and fatalities.',
    approach: 'Execute a comprehensive P&ID-based Hazard and Operability (HAZOP) study on an industrial ammonia synthesis or urea plant section; formulate risk rankings and specify Safety Instrumented Systems (SIS).',
    objectives: [
      'Deconstruct complex plant Piping & Instrumentation Diagrams (P&IDs) into distinct functional operational nodes.',
      'Apply standard guide words (NO, MORE, LESS, REVERSE, AS WELL AS) across critical process parameters.',
      'Quantify risk severity and likelihood using a 5×5 corporate risk matrix before and after safeguards.',
      'Perform Layer of Protection Analysis (LOPA) to determine required Safety Integrity Levels (SIL 1, 2, or 3).'
    ],
    methodology: [
      'Node identification: Dividing ammonia synthesis loop into reactor feed, synthesis converter, loop compressor, and purge gas nodes.',
      'Guideword analysis: Systematic brainstorming of deviations (e.g., High Pressure, Low Flow, Reverse Flow).',
      'Consequence & cause mapping: Documenting mechanical failures, human errors, and runaway reaction escalation scenarios.',
      'Safeguard verification: Auditing pressure safety valves (PSVs), high-pressure trips, and emergency depressuring systems.',
      'Recommendation formulation: Proposing engineering changes, interlocks, and independent protection layers (IPLs).'
    ],
    tools: ['Fertilizer plant P&IDs and PFDs', 'Standard HAZOP worksheet software / templates', 'Risk Assessment Matrix (RAM)', 'EPA ALOHA dispersion modeling software', 'Layer of Protection Analysis (LOPA) tools'],
    difficulty: 'Beginner',
    type: 'Simulation',
    expectedOutput: 'Comprehensive industrial-grade HAZOP ledger covering > 40 operational nodes with actionable engineering recommendations and audited SIL requirements.',
    deliverables: ['Formal HAZOP study ledger document', 'Layer of Protection Analysis (LOPA) worksheets', 'Marked-up P&ID drawings with safety node boundaries', 'Emergency depressurizing and venting sizing review'],
    skillsRequired: ['Process safety management (OSHA PSM)', 'Piping & Instrumentation Diagram (P&ID) reading', 'Hazard identification methodologies', 'Safety Integrity Level (SIL) allocation'],
    researchQuestions: [
      'How does human error in manual valve bypass sequencing affect the overall probability of overpressure rupture?',
      'What independent protection layers are required to mitigate synthesis loop runaway to an acceptable ALARP level?',
      'How should relief valve sizing account for two-phase runaway reaction venting under fire exposure?'
    ]
  },
  {
    id: 22,
    domain: 'safety',
    title: 'Dust Explosion Risk Assessment of a Grain Plant',
    area: 'Industrial Safety & Explosion Dynamics',
    problem: 'Combustible agricultural and flour dusts present catastrophic deflagration risks in processing silos; hazard classification and explosion venting are frequently misapplied.',
    approach: 'Measure combustible dust characteristics (Kst, Pmax, Minimum Ignition Energy); classify hazardous zones per NFPA 652 and ATEX directives; design explosion relief venting and isolation systems.',
    objectives: [
      'Characterize dust sample particle size distribution, moisture content, and explosion index (Kst value).',
      'Classify plant areas into Zone 20, 21, and 22 hazardous dust atmospheres according to ATEX / IEC 60079.',
      'Calculate required explosion venting area for bucket elevators and baghouse dust collectors following NFPA 68.',
      'Establish preventative maintenance and housekeeping protocols to prevent secondary dust explosions.'
    ],
    methodology: [
      'Sampling & physical characterization: Sieve analysis, laser diffraction, and moisture analysis of grain dust.',
      'Explosion severity data analysis: Reviewing 20-L sphere test data to classify dust explosibility class (St 1, St 2, St 3).',
      'Hazardous area zoning: Mapping dust cloud and layer dispersion areas onto plant architectural floor plans.',
      'Vent sizing calculations: Applying NFPA 68 Vent Sizing equations considering vessel volume, pred, and vent duct length.',
      'Isolation design: Specifying chemical suppression and mechanical flap valves to prevent flame propagation.'
    ],
    tools: ['Dust explosion parameter database / 20-L sphere data', 'NFPA 68 / NFPA 652 engineering standards', 'AutoCAD / Plant layout zoning software', 'Particle size laser diffractometer data'],
    difficulty: 'Intermediate',
    type: 'Experimental',
    expectedOutput: 'Certified Dust Hazard Analysis (DHA) detailing explosion class, zoning boundaries, and stamped vent area engineering calculations.',
    deliverables: ['Formal Dust Hazard Analysis (DHA) report', 'Hazardous area classification zoning drawings', 'NFPA 68 vent sizing calculation spreadsheets', 'Electrical equipment classification specification table'],
    skillsRequired: ['Dust deflagration dynamics', 'NFPA / ATEX regulatory standards', 'Industrial ventilation & dust collection', 'Process safety calculation methodologies'],
    researchQuestions: [
      'How does moisture content above 12% suppress dust cloud minimum ignition energy (MIE)?',
      'What vent duct length induces flame acceleration and secondary pressure enhancement inside interconnected equipment?',
      'What housekeeping layer thickness threshold (mm) presents a critical secondary explosion propagation hazard?'
    ]
  },
  {
    id: 23,
    domain: 'safety',
    title: 'Machine Learning for Process Fault Detection',
    area: 'Process Control, Digitalization & Applied AI/ML',
    problem: 'Modern continuous plants generate millions of SCADA data points, but conventional alarm thresholds fail to detect creeping faults, leading to catastrophic equipment trips.',
    approach: 'Develop supervised and unsupervised machine learning models to detect and diagnose process anomalies early; validate using the benchmark Tennessee Eastman Process (TEP) dynamic simulator dataset.',
    objectives: [
      'Pre-process multivariate time-series data from 52 continuous process variables under normal and faulty conditions.',
      'Apply dimensionality reduction (PCA, t-SNE) and feature engineering to isolate dynamic process cross-correlations.',
      'Train and benchmark classifiers (SVM, Random Forest, XGBoost, LSTM Autoencoders) for early fault detection.',
      'Build a real-time web dashboard displaying fault probabilities, contributing sensors, and time-to-trip warnings.'
    ],
    methodology: [
      'Dataset acquisition: Loading Tennessee Eastman Process benchmark simulation data covering 20 distinct fault modes.',
      'Signal processing: Handling sensor noise, missing timestamps, and dynamic time-window rolling statistics.',
      'Model architecture: Building an unsupervised Autoencoder to detect novel anomalies, and an XGBoost multi-class classifier.',
      'Explainable AI: Applying SHAP (SHapley Additive exPlanations) to identify the root-cause sensors driving each alert.',
      'Validation: Evaluating Fault Detection Rate (FDR), False Alarm Rate (FAR), and mean detection delay in seconds.'
    ],
    tools: ['Python (scikit-learn, PyTorch, pandas, numpy)', 'Tennessee Eastman Process (TEP) simulator', 'SHAP explainability toolkit', 'Streamlit / React dashboard interface', 'Jupyter Notebooks'],
    difficulty: 'Advanced',
    type: 'Simulation',
    expectedOutput: 'Trained predictive ML pipeline achieving > 95% fault detection rate with false alarm rate < 1.5% and 15-minute advance warning.',
    deliverables: ['Fully documented Python source code repository', 'Model benchmark comparison matrix & confusion matrices', 'SHAP sensor root-cause attribution plots', 'Interactive process monitoring dashboard'],
    skillsRequired: ['Multivariate time-series analysis', 'Applied machine learning algorithms', 'Dynamic chemical process control', 'Python data science stack'],
    researchQuestions: [
      'How do recurrent LSTM architectures compare with gradient boosting in capturing time-lagged chemical recirculations?',
      'Can unsupervised autoencoders reliably detect novel unknown faults without historical labeled training data?',
      'What is the computational latency of SHAP explanations for real-time SCADA deployment?'
    ]
  },
  {
    id: 24,
    domain: 'safety',
    title: 'Emergency Response Plan for a Chemical Store',
    area: 'Process Safety & Emergency Management',
    problem: 'Chemical warehousing facilities store incompatible toxic, flammable, and corrosive substances; accidental containment breaches cause toxic plumes and multi-casualty incidents.',
    approach: 'Formulate an OSHA/EPA-compliant Emergency Response Plan (ERP) for a multi-chemical warehouse; model toxic vapor dispersion and pool fires using ALOHA; map evacuation corridors and incident command workflows.',
    objectives: [
      'Audit facility chemical inventories and establish a GHS / NFPA 704 chemical compatibility segregation matrix.',
      'Model atmospheric toxic vapor dispersion and BLEVE thermal radiation footprints using EPA ALOHA software.',
      'Delineate Emergency Response Planning Guidelines (ERPG-1, ERPG-2, ERPG-3) evacuation zones for surrounding communities.',
      'Establish standardized incident command protocols, PPE selection matrices, and multi-agency emergency drill schedules.'
    ],
    methodology: [
      'Inventory risk assessment: Classifying hazardous chemical stores (chlorine cylinders, flammable solvents, acids, oxidizers).',
      'Consequence dispersion modeling: Simulating catastrophic release scenarios under varied atmospheric stability classes (A to F).',
      'GIS zone mapping: Exporting threat contours into Google Earth / GIS to identify vulnerable schools, hospitals, and populations.',
      'Emergency operating procedures: Writing tactical response checklists for hazardous material leak containment and fire control.',
      'Tabletop simulation: Designing an emergency drill scenario with evaluation rubrics for plant response personnel.'
    ],
    tools: ['EPA ALOHA / CAMEO / MARPLOT', 'GIS / Google Earth Pro mapping', 'Safety Data Sheet (SDS) regulatory database', 'NFPA 400 Hazardous Materials Code', 'Incident Command System (ICS) templates'],
    difficulty: 'Intermediate',
    type: 'Hybrid',
    expectedOutput: 'Validated site-specific Emergency Response Plan with quantified threat footprint maps and certified standard operating procedures.',
    deliverables: ['Comprehensive Emergency Response Plan manual', 'Toxic gas dispersion contour footprint maps', 'Chemical storage compatibility matrix', 'Full-scale emergency drill scenario & evaluation rubrics'],
    skillsRequired: ['Chemical hazard classification (GHS / NFPA)', 'Atmospheric dispersion modeling (ALOHA)', 'Industrial emergency response planning', 'Environmental safety regulations'],
    researchQuestions: [
      'How does local wind direction and ambient temperature shift ERPG-3 evacuation boundaries into neighboring residential zones?',
      'What foam application density is required to effectively suppress vapor emission from an open solvent pool spill?',
      'What are the minimum response times required for municipal fire services before a pressurized storage vessel experiences BLEVE?'
    ]
  }
];

// ─── Canvas Preload Data Interface ──────────────────────────────────────────
export interface CanvasPreloadData {
  topic?: string;
  why?: string;
  who?: string;
  gap?: string;
  rq?: string;
  hyp?: string;
}

// ─── Project Detail View Component ──────────────────────────────────────────
interface ProjectDetailViewProps {
  project: FypIdea;
  onBack: () => void;
  onNavigateProject: (id: number) => void;
  onUseInCanvas: (preload: CanvasPreloadData) => void;
}

function ProjectDetailView({ project, onBack, onNavigateProject, onUseInCanvas }: ProjectDetailViewProps) {
  const [copied, setCopied] = useState(false);

  // Safe navigation helpers
  const currentIndex = FYP_IDEAS.findIndex(p => p.id === project.id);
  const prevProject = currentIndex > 0 ? FYP_IDEAS[currentIndex - 1] : null;
  const nextProject = currentIndex < FYP_IDEAS.length - 1 ? FYP_IDEAS[currentIndex + 1] : null;

  const domainMeta = FYP_DOMAINS.find(d => d.id === project.domain) || {
    label: project.domain || 'Chemical Engineering',
    icon: Rocket,
    color: '#0ea5e9'
  };
  const DomainIcon = domainMeta.icon;

  const diffBadgeColor = (d: string) =>
    d === 'Beginner'
      ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
      : d === 'Intermediate'
      ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
      : 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800';

  const typeBadgeColor = (t: string) =>
    t === 'Simulation'
      ? 'bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border-primary-300 dark:border-primary-800'
      : t === 'Experimental'
      ? 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800'
      : 'bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-800';

  const copyBlueprint = () => {
    const text = `CHEMBASE PRO — FYP PROJECT BLUEPRINT
Title: ${project.title}
Area: ${project.area}
Domain: ${domainMeta.label}
Difficulty: ${project.difficulty} | Type: ${project.type}

PROBLEM STATEMENT:
${project.problem}

APPROACH & SUMMARY:
${project.approach}

SMART OBJECTIVES:
${(project.objectives || []).map((o, idx) => `${idx + 1}. ${o}`).join('\n')}

METHODOLOGY PHASES:
${(project.methodology || []).map((m, idx) => `Stage ${idx + 1}: ${m}`).join('\n')}

TOOLS & EQUIPMENT:
${(project.tools || []).join(', ')}

EXPECTED OUTPUT:
${project.expectedOutput}

DELIVERABLES:
${(project.deliverables || []).map(d => `- ${d}`).join('\n')}

SKILLS REQUIRED:
${(project.skillsRequired || []).join(', ')}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Return Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-surface-200 dark:border-surface-800">
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-surface-600 dark:text-surface-300 hover:text-accent-600 dark:hover:text-accent-400 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to FYP Projects
          </button>
          <span className="text-surface-400">/</span>
          <span className="text-surface-500 font-medium">Idea Lab</span>
          <span className="text-surface-400">/</span>
          <span className="text-surface-800 dark:text-surface-100 font-bold truncate max-w-[200px] md:max-w-xs">{project.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyBlueprint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-700 dark:text-surface-200 hover:border-accent-400 transition-all shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-surface-400" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Blueprint'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onUseInCanvas({
                topic: project.title,
                why: project.problem,
                who: `${domainMeta.label} industry stakeholders, regulatory bodies, and process engineers.`,
                gap: project.approach,
                rq: (project.researchQuestions && project.researchQuestions.length > 0)
                  ? project.researchQuestions[0]
                  : `How can ${project.title} be optimized to maximize technical performance and yield?`,
                hyp: (project.objectives && project.objectives.length > 0)
                  ? project.objectives[0]
                  : `Implementation of the proposed methodology will achieve target conversion and separation metrics.`
              });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-accent-600 text-surface-50 hover:bg-accent-700 transition-all shadow-md shadow-accent-500/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Use in Problem Canvas</span>
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="glass rounded-3xl border border-surface-200 dark:border-surface-800 p-6 md:p-8 relative overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`px-3 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 ${diffBadgeColor(project.difficulty)}`}>
            {project.difficulty}
          </span>
          <span className={`px-3 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 ${typeBadgeColor(project.type)}`}>
            {project.type}
          </span>
          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 flex items-center gap-1.5">
            <DomainIcon className="w-3.5 h-3.5" />
            {domainMeta.label}
          </span>
          <span className="ml-auto text-xs font-mono font-bold text-surface-400">
            Project #{project.id} of {FYP_IDEAS.length}
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-surface-900 dark:text-surface-50 tracking-tight mb-2">
          {project.title}
        </h1>

        <p className="text-sm font-semibold text-accent-600 dark:text-accent-400 mb-4 flex items-center gap-2">
          <FlaskConical className="w-4 h-4" />
          {project.area || 'Chemical Process Engineering'}
        </p>

        <p className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed max-w-4xl">
          {project.approach || 'Information not available yet.'}
        </p>
      </div>

      {/* Grid of Structured Sections */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Card 1: Problem Statement & Objectives */}
        <CalcCard title="Problem Statement & SMART Objectives" icon={Target}>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-1.5">
                The Engineering Problem
              </label>
              <div className="rounded-xl p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-xs text-surface-700 dark:text-surface-200 leading-relaxed font-medium">
                {project.problem || 'Information not available yet.'}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-2">
                Core Project Objectives
              </label>
              <ul className="space-y-2">
                {(project.objectives && project.objectives.length > 0) ? (
                  project.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-surface-700 dark:text-surface-200">
                      <CheckCircle2 className="w-4 h-4 text-accent-500 flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{obj}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-surface-400">Information not available yet.</li>
                )}
              </ul>
            </div>
          </div>
        </CalcCard>

        {/* Card 2: Step-by-Step Methodology */}
        <CalcCard title="Execution Methodology & Process Flow" icon={Network}>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-2">
                Step-by-Step Research Methodology
              </label>
              <ol className="space-y-2.5">
                {(project.methodology && project.methodology.length > 0) ? (
                  project.methodology.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs text-surface-700 dark:text-surface-200">
                      <span className="w-5 h-5 rounded-full bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-surface-400">Information not available yet.</li>
                )}
              </ol>
            </div>

            <div className="pt-2 border-t border-surface-200 dark:border-surface-800">
              <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-1.5">
                Expected Technical Output
              </label>
              <div className="rounded-xl p-3 bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 text-xs font-semibold text-accent-800 dark:text-accent-200">
                <Sparkles className="w-3.5 h-3.5 inline mr-1 text-accent-500" />
                {project.expectedOutput || 'Information not available yet.'}
              </div>
            </div>
          </div>
        </CalcCard>

        {/* Card 3: Equipment, Sensors & Software */}
        <CalcCard title="Required Equipment, Software & Skills" icon={Wrench}>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-2">
                Laboratory Equipment & Software Packages
              </label>
              <div className="flex flex-wrap gap-2">
                {(project.tools && project.tools.length > 0) ? (
                  project.tools.map((tool, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 shadow-sm"
                    >
                      {tool}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-surface-400">Information not available yet.</span>
                )}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-2">
                Key Technical & Engineering Skills Required
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(project.skillsRequired && project.skillsRequired.length > 0) ? (
                  project.skillsRequired.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-surface-400">Information not available yet.</span>
                )}
              </div>
            </div>
          </div>
        </CalcCard>

        {/* Card 4: Deliverables & Defense Viva Prep */}
        <CalcCard title="Final Deliverables & Defense Prep" icon={Award}>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-2">
                Expected Final Year Deliverables
              </label>
              <ul className="space-y-1.5">
                {(project.deliverables && project.deliverables.length > 0) ? (
                  project.deliverables.map((del, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-surface-700 dark:text-surface-200">
                      <ListChecks className="w-3.5 h-3.5 text-accent-500 flex-shrink-0" />
                      <span>{del}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-surface-400">Information not available yet.</li>
                )}
              </ul>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-2">
                Defensible Viva & Research Questions
              </label>
              <ul className="space-y-2">
                {(project.researchQuestions && project.researchQuestions.length > 0) ? (
                  project.researchQuestions.map((rq, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-surface-600 dark:text-surface-300 italic">
                      <HelpCircle className="w-3.5 h-3.5 text-accent-400 flex-shrink-0 mt-0.5 not-italic" />
                      <span>"{rq}"</span>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-surface-400">Information not available yet.</li>
                )}
              </ul>
            </div>
          </div>
        </CalcCard>
      </div>

      {/* Bottom Sequential Project Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-surface-200 dark:border-surface-800">
        <div>
          {prevProject ? (
            <button
              type="button"
              onClick={() => onNavigateProject(prevProject.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-700 dark:text-surface-200 hover:border-accent-400 transition-all text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              <ArrowLeft className="w-4 h-4" />
              <div>
                <p className="text-[9px] uppercase tracking-wider text-surface-400 font-black">Previous</p>
                <p className="truncate max-w-[150px] sm:max-w-xs">{prevProject.title}</p>
              </div>
            </button>
          ) : (
            <div />
          )}
        </div>

        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl text-xs font-black bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        >
          View All {FYP_IDEAS.length} Projects
        </button>

        <div>
          {nextProject ? (
            <button
              type="button"
              onClick={() => onNavigateProject(nextProject.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-700 dark:text-surface-200 hover:border-accent-400 transition-all text-right cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              <div>
                <p className="text-[9px] uppercase tracking-wider text-surface-400 font-black">Next</p>
                <p className="truncate max-w-[150px] sm:max-w-xs">{nextProject.title}</p>
              </div>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Idea Lab: filter the curated bank ──────────────────────────────────────
function IdeaLabTab({ onOpenProject }: { onOpenProject: (id: number) => void }) {
  const [dom, setDom] = useState('all');
  const [diff, setDiff] = useState('All');
  const [typ, setTyp] = useState('All');
  const [qry, setQry] = useState('');

  const ideas = useMemo(() => {
    return FYP_IDEAS.filter(i =>
      (dom === 'all' || i.domain === dom) &&
      (diff === 'All' || i.difficulty === diff) &&
      (typ === 'All' || i.type === typ) &&
      (i.title.toLowerCase().includes(qry.toLowerCase()) || i.problem.toLowerCase().includes(qry.toLowerCase()) || i.area.toLowerCase().includes(qry.toLowerCase()))
    );
  }, [dom, diff, typ, qry]);

  const selCls = 'px-3 py-2 rounded-xl text-xs font-black bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-accent-500';
  const diffColor = (d: string) => d === 'Beginner' ? 'bg-accent-100 dark:bg-accent-900/40 text-accent-600 dark:text-accent-300' : d === 'Intermediate' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300' : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300';
  const typColor = (t: string) => t === 'Simulation' ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300' : t === 'Experimental' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300' : 'bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-300';

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-surface-800 dark:text-surface-50 flex items-center gap-3">
          <Lightbulb className="w-6 h-6 text-accent-500" /> FYP Idea Lab
        </h2>
        <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
          {FYP_IDEAS.length} curated, engineering-grounded project blueprints. Click on any project card to inspect complete methodology, equipment, objectives, and deliverables.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {[{ id: 'all', label: 'All domains', icon: Filter }, ...FYP_DOMAINS].map(d => (
          <button
            key={d.id}
            onClick={() => setDom(d.id)}
            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 border transition-all ${
              dom === d.id
                ? 'bg-accent-600 border-accent-600 text-surface-50 shadow-lg shadow-accent-500/25'
                : 'bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-accent-400'
            }`}
          >
            {d.id !== 'all' ? <d.icon className="w-3.5 h-3.5" /> : null} {d.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <select className={selCls} value={diff} onChange={e => setDiff(e.target.value)}>
          {['All', 'Beginner', 'Intermediate', 'Advanced'].map(d => <option key={d}>{d}</option>)}
        </select>
        <select className={selCls} value={typ} onChange={e => setTyp(e.target.value)}>
          {['All', 'Experimental', 'Simulation', 'Hybrid'].map(t => <option key={t}>{t}</option>)}
        </select>
        <input
          className={`${selCls} flex-1 min-w-[200px]`}
          placeholder="Search by keyword, topic, or chemical engineering area…"
          value={qry}
          onChange={e => setQry(e.target.value)}
        />
        <span className="text-[10px] font-black text-surface-400 self-center">{ideas.length} ideas</span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {ideas.map(i => (
          <button
            key={i.id}
            type="button"
            onClick={() => onOpenProject(i.id)}
            aria-label={`Open FYP project blueprint: ${i.title}`}
            className="rounded-2xl border border-surface-200 dark:border-surface-800 p-5 text-left transition-all hover:border-accent-400 hover:shadow-xl hover:shadow-accent-500/5 hover:-translate-y-0.5 group cursor-pointer relative flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${diffColor(i.difficulty)}`}>
                  {i.difficulty}
                </span>
                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${typColor(i.type)}`}>
                  {i.type}
                </span>
                <span className="ml-auto text-[9px] font-black text-surface-400">
                  {FYP_DOMAINS.find(d => d.id === i.domain)?.label}
                </span>
              </div>

              <p className="text-base font-black text-surface-900 dark:text-surface-50 mb-1 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
                {i.title}
              </p>

              <p className="text-[10px] font-bold text-accent-600 dark:text-accent-400 mb-2">
                {i.area}
              </p>

              <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed mb-4 line-clamp-3">
                {i.problem}
              </p>
            </div>

            <div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {i.tools.slice(0, 3).map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-[9px] font-bold text-surface-500 dark:text-surface-400">
                    {t}
                  </span>
                ))}
                {i.tools.length > 3 && (
                  <span className="px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-[9px] font-bold text-surface-400">
                    +{i.tools.length - 3} more
                  </span>
                )}
              </div>

              <div className="pt-3 border-t border-surface-100 dark:border-surface-800/80 flex items-center justify-between text-xs font-bold text-accent-600 dark:text-accent-400 group-hover:translate-x-0.5 transition-transform">
                <span>View Complete Project Specifications</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </button>
        ))}

        {ideas.length === 0 && (
          <div className="text-xs text-surface-400 py-16 text-center col-span-2 space-y-2">
            <Filter className="w-8 h-8 text-surface-300 dark:text-surface-700 mx-auto" />
            <p className="font-bold">No FYP project ideas match your current search or filter criteria.</p>
            <p className="text-[11px]">Try resetting the domain or difficulty filter to view all {FYP_IDEAS.length} projects.</p>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Problem Canvas: guided problem identification ──────────────────────────
interface ProblemCanvasTabProps {
  preload?: CanvasPreloadData;
}

function ProblemCanvasTab({ preload }: ProblemCanvasTabProps) {
  const [topic, setTopic] = useState(preload?.topic || 'Biodiesel from waste cooking oil');
  const [why, setWhy] = useState(preload?.why || 'Waste oil currently pollutes drains and is not monetised.');
  const [who, setWho] = useState(preload?.who || 'Restaurants, edible-oil importers, local municipalities.');
  const [gap, setGap] = useState(preload?.gap || 'No local optimisation of the transesterification process has been published for this feedstock.');
  const [rq, setRq] = useState(preload?.rq || 'What methanol-to-oil ratio, catalyst loading and reaction time maximise biodiesel yield from waste cooking oil?');
  const [hyp, setHyp] = useState(preload?.hyp || 'A 6:1 methanol:oil ratio with 1% KOH at 60 °C for 90 minutes will achieve ≥ 94% yield.');

  useEffect(() => {
    if (preload?.topic) setTopic(preload.topic);
    if (preload?.why) setWhy(preload.why);
    if (preload?.who) setWho(preload.who);
    if (preload?.gap) setGap(preload.gap);
    if (preload?.rq) setRq(preload.rq);
    if (preload?.hyp) setHyp(preload.hyp);
  }, [preload]);

  const inputCls = 'w-full px-3 py-2 rounded-xl text-xs font-bold bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-accent-500';
  const labelCls = 'text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1 block';
  const qbox = (label: string, prompt: string, v: string, s: (x: string) => void) => (
    <div className="rounded-xl border border-surface-200 dark:border-surface-800 p-3">
      <label className={labelCls}>{label}</label>
      <p className="text-[10px] text-surface-400 italic mb-2">{prompt}</p>
      <textarea rows={2} className={inputCls} value={v} onChange={e => s(e.target.value)} />
    </div>
  );
  const rqIsGood = rq.split(' ').length >= 8 && rq.includes('?');
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-surface-800 dark:text-surface-50 flex items-center gap-3">
          <Target className="w-6 h-6 text-accent-500" /> Problem Canvas
        </h2>
        <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">Turn a vague interest into a sharp, defensible research question and hypothesis.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {qbox('Broad topic', 'One line about your interest.', topic, setTopic)}
        {qbox('Why now?', 'What is the pain, cost or risk right now?', why, setWhy)}
        {qbox('Who is affected?', 'Stakeholders who feel the problem.', who, setWho)}
        {qbox('What is the knowledge gap?', 'What has NOT been published or solved?', gap, setGap)}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <CalcCard title="Research question" icon={HelpCircle}>
          <textarea rows={3} className={inputCls} value={rq} onChange={e => setRq(e.target.value)} />
          <div className={`mt-3 rounded-xl p-3 text-[11px] font-bold ${rqIsGood ? 'bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300 border border-accent-200 dark:border-accent-800' : 'bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300 border border-accent-200 dark:border-accent-800'}`}>
            {rqIsGood ? '✓ Good research question — specific, measurable and ends with a ?' : 'Tip: make it specific and measurable — name the variables and the outcome. End with a question mark.'}
          </div>
        </CalcCard>
        <CalcCard title="Hypothesis + SMART objectives" icon={ClipboardList}>
          <label className={labelCls}>Hypothesis</label>
          <textarea rows={2} className={inputCls} value={hyp} onChange={e => setHyp(e.target.value)} />
          <ul className="mt-3 space-y-1.5 text-[11px] text-surface-600 dark:text-surface-300">
            <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent-500 flex-shrink-0 mt-0.5" /> <b>Specific:</b> one process, one feedstock</li>
            <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent-500 flex-shrink-0 mt-0.5" /> <b>Measurable:</b> a number (yield %, removal %, U value)</li>
            <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent-500 flex-shrink-0 mt-0.5" /> <b>Achievable:</b> fits your lab and semester</li>
            <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent-500 flex-shrink-0 mt-0.5" /> <b>Relevant:</b> matters to the stakeholder</li>
            <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent-500 flex-shrink-0 mt-0.5" /> <b>Time-bound:</b> done by the defense date</li>
          </ul>
        </CalcCard>
      </div>
      <InfoNote>Assist, do not fabricate: ChemBase helps you structure your own work — the experiments, data and writing must be yours. If you copy-paste this text into your report, that is plagiarism.</InfoNote>
    </>
  );
}

// ─── Methodology Planner: experimental design + simulation plan ─────────────
function MethodologyTab() {
  const [mode, setMode] = useState('experimental');
  const [factors, setFactors] = useState('Methanol:oil ratio (3:1–9:1), Catalyst loading (0.5–1.5%), Temperature (50–65 °C)');
  const [levels, setLevels] = useState('3 levels each → factorial or RSM design');
  const [response, setResponse] = useState('Biodiesel yield (%) and viscosity (cSt)');
  const [reps, setReps] = useState('3 replicates per run');
  const [software, setSoftware] = useState('Aspen Plus / DWSIM');
  const [modelType, setModelType] = useState('Steady-state equilibrium (RadFrac for the column)');
  const [assumptions, setAssumptions] = useState('Ideal gas, constant pressure drop, 85% column efficiency');
  const [validation, setValidation] = useState('Compare simulated product purity vs. 3 published plant data points');
  const inputCls = 'w-full px-3 py-2 rounded-xl text-xs font-bold bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-accent-500';
  const labelCls = 'text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1 block';
  const field = (label: string, v: string, s: (x: string) => void, ph?: string) => (
    <div className="mb-3"><label className={labelCls}>{label}</label><textarea rows={2} className={inputCls} placeholder={ph} value={v} onChange={e => s(e.target.value)} /></div>
  );
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-surface-800 dark:text-surface-50 flex items-center gap-3">
          <FlaskConical className="w-6 h-6 text-accent-500" /> Methodology Planner
        </h2>
        <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">Structure your experimental design or simulation plan before touching the lab or keyboard.</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {[{ id: 'experimental', label: 'Experimental', icon: TestTubes }, { id: 'simulation', label: 'Simulation', icon: Database }, { id: 'lit', label: 'Literature matrix', icon: BookOpen }].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 border transition-all ${mode === m.id ? 'bg-accent-600 border-accent-600 text-surface-50 shadow-lg shadow-accent-500/25' : 'bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-accent-400'}`}>
            <m.icon className="w-4 h-4" /> {m.label}
          </button>
        ))}
      </div>
      {mode === 'experimental' && (
        <div className="grid md:grid-cols-2 gap-6">
          <CalcCard title="Design of Experiments" icon={Microscope}>
            {field('Independent variables (factors)', factors, setFactors, 'Which variables you will change')}
            {field('Levels / design type', levels, setLevels, 'Full factorial, fractional, RSM…')}
            {field('Response variables', response, setResponse, 'What you measure')}
            {field('Replicates & controls', reps, setReps, 'How many repeats, what baseline')}
          </CalcCard>
          <CalcCard title="Checklist before you start" icon={ListChecks}>
            <ul className="space-y-2 text-[11px] text-surface-600 dark:text-surface-300">
              {['Materials & chemicals received and stored per SDS', 'Equipment calibrated (balance, pH meter, thermometer)', 'Safety review done — MSDS, PPE, ventilation', 'Blank/control runs defined', 'Data sheet ready (date, run #, variables, results)', 'Budget for consumables confirmed', 'Supervisor sign-off on the procedure'].map((c, i) => (
                <li key={i} className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent-500 flex-shrink-0 mt-0.5" /> {c}</li>
              ))}
            </ul>
            <div className="rounded-xl bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 p-3 mt-4">
              <p className="text-[11px] font-bold text-accent-700 dark:text-accent-300">Typical run count: 3 factors × 3 levels × 3 reps = 27 runs ≈ 2-3 lab weeks.</p>
            </div>
          </CalcCard>
        </div>
      )}
      {mode === 'simulation' && (
        <div className="grid md:grid-cols-2 gap-6">
          <CalcCard title="Simulation plan" icon={Database}>
            {field('Software', software, setSoftware, 'Aspen Plus, DWSIM, COMSOL, Python…')}
            {field('Model type & key blocks', modelType, setModelType, 'Steady-state, equilibrium, RadFrac…')}
            {field('Assumptions', assumptions, setAssumptions, 'Ideal gas, efficiency, no heat loss…')}
            {field('Validation strategy', validation, setValidation, 'Compare with plant data or literature')}
          </CalcCard>
          <CalcCard title="Simulation workflow" icon={Network}>
            <ol className="space-y-2 text-[11px] text-surface-600 dark:text-surface-300">
              {['Define scope: feed, products, constraints', 'Draw the flowsheet with the right property package', 'Add components + methods (e.g. NRTL, Peng-Robinson)', 'Converge base case — fix warnings one by one', 'Validate against real data before optimising', 'Sensitivity analysis on the variables that matter', 'Document every assumption for the report'].map((s, i) => (
                <li key={i} className="flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300 text-[9px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span> {s}</li>
              ))}
            </ol>
          </CalcCard>
        </div>
      )}
      {mode === 'lit' && <LiteratureMatrix />}
      <InfoNote>Every methodology decision maps back to your research question: if a variable is not in your question, it probably does not belong in your design.</InfoNote>
    </>
  );
}

// ─── Literature matrix: organise papers you have read ───────────────────────
interface LitRow { id: number; cite: string; problem: string; method: string; finding: string; gap: string; }

function LiteratureMatrix() {
  const [rows, setRows] = useState<LitRow[]>([
    { id: 1, cite: 'Khan et al. (2021), Fuel', problem: 'Waste oil transesterification yields vary', method: 'Central composite design, 6:1 ratio', finding: '94% yield at 60 °C, 1% KOH', gap: 'No local feedstock study' },
    { id: 2, cite: 'Ali & Raza (2022), Energy Reports', problem: 'Catalyst recovery is costly', method: 'Heterogeneous CaO catalyst', finding: 'Reusable 5 cycles, 91% yield', gap: 'Long reaction time not studied' },
  ]);
  const add = () => setRows(prev => [...prev, { id: Math.max(0, ...prev.map(r => r.id)) + 1, cite: '', problem: '', method: '', finding: '', gap: '' }]);
  const edit = (id: number, k: keyof LitRow, v: string) => setRows(prev => prev.map(r => (r.id === id ? { ...r, [k]: v } : r)));
  const del = (id: number) => setRows(prev => prev.filter(r => r.id !== id));
  const cols: { k: keyof LitRow; label: string }[] = [
    { k: 'cite', label: 'Citation' }, { k: 'problem', label: 'Problem addressed' }, { k: 'method', label: 'Method' }, { k: 'finding', label: 'Key finding' }, { k: 'gap', label: 'Gap → your angle' },
  ];
  return (
    <CalcCard title={`Literature matrix · ${rows.length} papers`} icon={BookOpen}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[10px]">
          <thead>
            <tr className="border-b border-surface-200 dark:border-surface-800">
              {cols.map(c => <th key={c.k} className="py-2 pr-3 font-black text-surface-400 uppercase tracking-widest">{c.label}</th>)}
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b border-surface-100 dark:border-surface-800/50">
                {cols.map(c => (
                  <td key={c.k} className="py-1.5 pr-3">
                    <input className="w-40 md:w-48 px-2 py-1.5 rounded-lg text-[10px] font-bold bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-1 focus:ring-accent-500" value={String(r[c.k])} onChange={e => edit(r.id, c.k, e.target.value)} />
                  </td>
                ))}
                <td className="py-1.5">
                  <button onClick={() => del(r.id)} className="text-surface-400 hover:text-red-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={add} className="mt-4 px-3 py-2 rounded-xl text-xs font-black bg-accent-600 text-surface-50 hover:bg-accent-700 transition-all shadow-lg shadow-accent-500/25 flex items-center gap-1">
        <Plus className="w-3.5 h-3.5" /> Add paper
      </button>
      <p className="text-[10px] text-surface-400 mt-3">The last column is your gold: every gap you record is a candidate research angle for the introduction and discussion.</p>
    </CalcCard>
  );
}

// ─── Report Studio: report structure + presentation outline ────────────────
const REPORT_CHAPTERS = [
  { ch: 1, title: 'Introduction', weeks: '2', words: '800-1,200', what: 'Background, problem statement, research questions, objectives, scope and thesis outline.' },
  { ch: 2, title: 'Literature Review', weeks: '3-4', words: '2,000-3,000', what: 'State of the art, key studies (cite your matrix!), research gap and how your work fills it.' },
  { ch: 3, title: 'Methodology', weeks: '2', words: '1,500-2,500', what: 'Materials, equipment, experimental design or simulation setup, data collection plan, safety.' },
  { ch: 4, title: 'Results & Discussion', weeks: '4-6', words: '2,500-4,000', what: 'Present data (tables/figures), analyse trends, compare with literature, discuss anomalies.' },
  { ch: 5, title: 'Conclusion & Recommendations', weeks: '1', words: '600-1,000', what: 'Answer each research question explicitly; limitations; future work and recommendations.' },
  { ch: 6, title: 'References & Appendices', weeks: '1', words: 'n/a', what: 'Consistent citation style; raw data, sample calculations, P&IDs, code listings.' },
];

const PRESENTATION_SLIDES = [
  { n: 1, title: 'Title slide', secs: 15, what: 'Project title, names, supervisor, university' },
  { n: 2, title: 'Motivation & problem', secs: 45, what: 'The pain, the cost, the stakeholders — one clear story' },
  { n: 3, title: 'Objectives & research questions', secs: 45, what: '2-3 objectives max, mapped to your questions' },
  { n: 4, title: 'Methodology', secs: 60, what: 'Diagram + key variables; not every lab detail' },
  { n: 5, title: 'Key results (2-3 slides)', secs: 120, what: 'Best figures only; one message per slide' },
  { n: 6, title: 'Discussion / comparison', secs: 45, what: 'Your results vs literature; why they differ' },
  { n: 7, title: 'Conclusion & future work', secs: 30, what: 'Answer the questions; what next' },
  { n: 8, title: 'Q&A + thank you', secs: 30, what: 'Prepared backup slides for likely questions' },
];

const DEFENSE_QUESTIONS = [
  'Why did you choose this particular feedstock / process / software?',
  'What is the main contribution of your work?',
  'What are the limitations, and how would you improve the study?',
  'How do your results compare with published data?',
  'Which variable had the biggest effect and how do you know?',
  'What would you do differently with unlimited time and budget?',
  'Explain one calculation from your methodology from first principles.',
  'How does your work apply to industry?',
];

function ReportStudioTab() {
  const [view, setView] = useState('report');
  const [totalWords, setTotalWords] = useState('8,000');
  const parseWords = (w: string) => w === 'n/a' ? null : w.split('-').map(x => parseInt(x.replace(/[^0-9]/g, ''), 10));
  const [sumMin, sumMax] = REPORT_CHAPTERS.reduce<[number, number]>(([mn, mx], c) => {
    const p = parseWords(c.words);
    return p ? [mn + p[0], mx + (p[1] ?? p[0])] : [mn, mx];
  }, [0, 0]);
  const tgt = parseInt(totalWords.replace(/[^0-9]/g, ''), 10) || 0;
  const inBudget = tgt > 0 && tgt >= sumMin && tgt <= sumMax;
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-surface-800 dark:text-surface-50 flex items-center gap-3">
          <FileText className="w-6 h-6 text-accent-500" /> Report Studio
        </h2>
        <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">Chapter-by-chapter report structure and a slide-by-slide defense presentation.</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {[{ id: 'report', label: 'Report structure', icon: ScrollText }, { id: 'slides', label: 'Presentation', icon: Presentation }, { id: 'defense', label: 'Defense prep', icon: Award }].map(v => (
          <button key={v.id} onClick={() => setView(v.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 border transition-all ${view === v.id ? 'bg-accent-600 border-accent-600 text-surface-50 shadow-lg shadow-accent-500/25' : 'bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-accent-400'}`}>
            <v.icon className="w-4 h-4" /> {v.label}
          </button>
        ))}
      </div>
      {view === 'report' && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-surface-400">Target length (words):</label>
            <input className="px-3 py-2 rounded-xl text-xs font-black bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-accent-500 w-32" value={totalWords} onChange={e => setTotalWords(e.target.value)} />
            <span className="text-[10px] font-bold text-accent-600 dark:text-accent-400">
              {inBudget ? `✓ fits the ${sumMin.toLocaleString()}–${sumMax.toLocaleString()} word chapter budget` : `Chapter budget is ${sumMin.toLocaleString()}–${sumMax.toLocaleString()} words — aim inside it`}
            </span>
          </div>
          <div className="space-y-3">
            {REPORT_CHAPTERS.map(c => (
              <div key={c.ch} className="grid md:grid-cols-[60px_180px_100px_1fr] gap-3 rounded-xl border border-surface-200 dark:border-surface-800 p-4 hover:border-accent-400 transition-all">
                <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300 font-black flex items-center justify-center text-sm">{c.ch}</div>
                <div>
                  <p className="text-xs font-black text-surface-800 dark:text-surface-50">Chapter {c.ch}</p>
                  <p className="text-[10px] text-surface-400">{c.title}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-surface-400 uppercase">{c.weeks} wks</p>
                  <p className="text-[10px] font-bold text-accent-600 dark:text-accent-400">{c.words} words</p>
                </div>
                <p className="text-[11px] text-surface-500 dark:text-surface-400 leading-relaxed">{c.what}</p>
              </div>
            ))}
          </div>
        </>
      )}
      {view === 'slides' && (
        <div className="grid md:grid-cols-2 gap-4">
          {PRESENTATION_SLIDES.map(s => (
            <div key={s.n} className="rounded-xl border border-surface-200 dark:border-surface-800 p-4 hover:border-accent-400 transition-all">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-lg bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300 text-[9px] font-black">{s.n}</span>
                <p className="text-xs font-black text-surface-800 dark:text-surface-50">{s.title}</p>
                <span className="ml-auto text-[9px] font-black text-surface-400">~{s.secs}s</span>
              </div>
              <p className="text-[11px] text-surface-500 dark:text-surface-400">{s.what}</p>
            </div>
          ))}
          <div className="rounded-xl bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 p-4 md:col-span-2">
            <p className="text-[11px] font-bold text-accent-700 dark:text-accent-300">Total ≈ 6.5 minutes of talking — perfect for a 10-minute slot with Q&A. Practice with a real timer twice before the defense.</p>
          </div>
        </div>
      )}
      {view === 'defense' && (
        <CalcCard title="Likely defense questions" icon={Award}>
          <ul className="space-y-2">
            {DEFENSE_QUESTIONS.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-surface-600 dark:text-surface-300">
                <HelpCircle className="w-3.5 h-3.5 text-accent-500 flex-shrink-0 mt-0.5" /> {q}
              </li>
            ))}
          </ul>
          <InfoNote>Prepare answers for these BEFORE the defense. Rehearse aloud, time yourself, and have one backup slide ready for the limitation question.</InfoNote>
        </CalcCard>
      )}
    </>
  );
}

// ─── Timeline planner: semester phases with progress ────────────────────────
interface Phase { id: number; name: string; weeks: string; tasks: string; done: boolean; }

const DEFAULT_PHASES: Phase[] = [
  { id: 1, name: 'Topic & supervisor', weeks: 'W1-2', tasks: 'Pick domain, shortlist ideas, meet supervisor, freeze title', done: false },
  { id: 2, name: 'Proposal', weeks: 'W3-4', tasks: 'Problem statement, research questions, initial methodology', done: false },
  { id: 3, name: 'Literature review', weeks: 'W3-6', tasks: 'Read 15-25 papers, build the literature matrix, draft Ch.2', done: false },
  { id: 4, name: 'Methodology finalised', weeks: 'W6-7', tasks: 'Freeze design/software, order materials, get safety sign-off', done: false },
  { id: 5, name: 'Experiments / simulation', weeks: 'W8-13', tasks: 'Run trials, collect data, log everything, troubleshoot', done: false },
  { id: 6, name: 'Analysis', weeks: 'W13-15', tasks: 'Statistical analysis, plots, compare with literature', done: false },
  { id: 7, name: 'Report writing', weeks: 'W14-17', tasks: 'Write Ch.3-4 as you go, then Ch.1-2, then Ch.5', done: false },
  { id: 8, name: 'Defense prep', weeks: 'W17-18', tasks: 'Slides, rehearse aloud, prepare backup slides, final edit', done: false },
];

function TimelineTab() {
  const [phases, setPhases] = useState<Phase[]>(DEFAULT_PHASES);
  const toggle = (id: number) => setPhases(prev => prev.map(p => (p.id === id ? { ...p, done: !p.done } : p)));
  const done = phases.filter(p => p.done).length;
  const pct = Math.round((done / phases.length) * 100);
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-surface-800 dark:text-surface-50 flex items-center gap-3">
          <CalendarDays className="w-6 h-6 text-accent-500" /> Semester Timeline
        </h2>
        <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">A realistic 18-week FYP plan. Tick phases as you complete them.</p>
      </div>
      <CalcCard title={`Overall progress: ${pct}%`} icon={TrendingUp}>
        <div className="h-3 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden mb-6">
          <div className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-500 transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <div className="space-y-2">
          {phases.map(p => (
            <button key={p.id} onClick={() => toggle(p.id)}
              className={`w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${p.done ? 'border-accent-400 bg-accent-50 dark:bg-accent-900/10' : 'border-surface-200 dark:border-surface-800 hover:border-accent-400'}`}>
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${p.done ? 'bg-accent-500 text-surface-50' : 'bg-surface-100 dark:bg-surface-800 text-surface-400'}`}>
                {p.done ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-[10px] font-black">{p.id}</span>}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className={`text-xs font-black ${p.done ? 'text-accent-700 dark:text-accent-300 line-through' : 'text-surface-800 dark:text-surface-50'}`}>{p.name}</p>
                  <span className="px-1.5 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-[9px] font-black text-surface-400">{p.weeks}</span>
                </div>
                <p className="text-[10px] text-surface-400 mt-0.5">{p.tasks}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => setPhases(prev => prev.map(p => ({ ...p, done: true })))}
            className="px-3 py-2 rounded-xl text-[10px] font-black bg-accent-600 text-surface-50 hover:bg-accent-700 transition-all">Mark all done</button>
          <button onClick={() => setPhases(prev => prev.map(p => ({ ...p, done: false })))}
            className="px-3 py-2 rounded-xl text-[10px] font-black bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 transition-all">Reset</button>
        </div>
      </CalcCard>
      <InfoNote>Writing the report chapter-by-chapter as you go (not at the end) is the single biggest de-risking move. Start Chapter 3 while the equipment is still being delivered.</InfoNote>
    </>
  );
}

// ─── Module shell & tabs ────────────────────────────────────────────────────
const TABS = [
  { id: 'ideas', label: 'Idea Lab', icon: Lightbulb },
  { id: 'canvas', label: 'Problem Canvas', icon: Target },
  { id: 'method', label: 'Methodology', icon: FlaskConical },
  { id: 'report', label: 'Report Studio', icon: FileText },
  { id: 'timeline', label: 'Timeline', icon: CalendarDays },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function FypModule() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<TabId>('ideas');
  const [canvasPreload, setCanvasPreload] = useState<CanvasPreloadData>({});

  const projectParam = searchParams.get('project');

  // Resolve currently requested project
  const selectedProject = useMemo(() => {
    if (!projectParam) return null;
    const parsedId = parseInt(projectParam, 10);
    if (isNaN(parsedId)) return 'INVALID';
    const found = FYP_IDEAS.find(p => p.id === parsedId);
    return found || 'NOT_FOUND';
  }, [projectParam]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const main = document.querySelector('main');
    if (main) {
      main.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToTop();
  }, [projectParam]);

  const handleOpenProject = (id: number) => {
    setSearchParams({ project: String(id) });
    scrollToTop();
  };

  const handleBackToProjects = () => {
    setSearchParams({});
    scrollToTop();
  };

  const handleUseInCanvas = (preloadData: CanvasPreloadData) => {
    setCanvasPreload(preloadData);
    setSearchParams({});
    setTab('canvas');
    scrollToTop();
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 text-surface-50 flex items-center justify-center shadow-lg shadow-accent-500/25">
            <Rocket className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-surface-800 dark:text-surface-50">Final Year Project</h1>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              From first idea to defended thesis — curated project blueprints, problem framing, methodology, reporting and semester planning.
            </p>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation (Hidden when viewing project detail to maximize focus) */}
      {!selectedProject && (
        <div className="flex flex-wrap gap-2 mb-8">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                  tab === t.id
                    ? 'bg-accent-600 border-accent-600 text-surface-50 shadow-lg shadow-accent-500/25'
                    : 'bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-accent-400'
                }`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Dynamic Content Views */}
      {selectedProject ? (
        selectedProject === 'INVALID' || selectedProject === 'NOT_FOUND' ? (
          <div className="glass rounded-3xl border border-surface-200 dark:border-surface-800 p-12 text-center space-y-4 max-w-xl mx-auto">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
            <h3 className="text-lg font-black text-surface-800 dark:text-surface-50">
              This project could not be loaded.
            </h3>
            <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">
              The requested FYP project identifier was not found in the database. Please return to the FYP Idea Lab and select a valid project.
            </p>
            <button
              type="button"
              onClick={handleBackToProjects}
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-accent-600 text-surface-50 hover:bg-accent-700 transition-all shadow-lg shadow-accent-500/25 inline-flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              <ArrowLeft className="w-4 h-4" /> Return to FYP Projects
            </button>
          </div>
        ) : (
          <ProjectDetailView
            project={selectedProject}
            onBack={handleBackToProjects}
            onNavigateProject={handleOpenProject}
            onUseInCanvas={handleUseInCanvas}
          />
        )
      ) : (
        <>
          {tab === 'ideas' && <IdeaLabTab onOpenProject={handleOpenProject} />}
          {tab === 'canvas' && <ProblemCanvasTab preload={canvasPreload} />}
          {tab === 'method' && <MethodologyTab />}
          {tab === 'report' && <ReportStudioTab />}
          {tab === 'timeline' && <TimelineTab />}
        </>
      )}
    </div>
  );
}
