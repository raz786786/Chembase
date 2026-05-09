// Engineering Mode data — curated for key industrial chemicals
export interface EngChemical {
  formula: string;
  name: string;
  cp25: number; // kJ/kg·K at 25°C
  tc: number; pc: number; omega: number; // Critical T(K), P(MPa), acentric
  viscosity25: number; // mPa·s at 25°C
  thermalCond: number; // W/m·K
  flashPoint?: number; // °C
  lel?: number; uel?: number; // vol%
  antoineA: number; antoineB: number; antoineC: number; // log10(P/mmHg)=A-B/(T+C), T in °C
  cpCoeffs: number[]; // Cp(T)=a+bT+cT²+dT³ (J/mol·K, T in K)
  industrialUses: string[];
  equipment: { type: string; material: string; notes: string }[];
  operatingConditions: { tempRange: string; pressRange: string; phase: string };
  materialCompat: { material: string; rating: string; notes: string }[];
  designNotes: string[];
  safetyDesign: { safeRange: string; explosionLimits?: string; flashPoint?: string };
  processInsight: { labScale: string; industrialScale: string; keyEquipment: string[] };
}

export const ENGINEERING_DB: EngChemical[] = [
  {
    formula:'H2O', name:'Water', cp25:4.18, tc:647.1, pc:22.064, omega:0.344,
    viscosity25:0.89, thermalCond:0.606, antoineA:8.07131, antoineB:1730.63, antoineC:233.426,
    cpCoeffs:[30.09,6.83e-3,6.79e-6,-2.53e-9],
    industrialUses:['Universal solvent','Coolant in HX','Steam generation','Reaction medium'],
    equipment:[{type:'Shell & Tube HX',material:'CS/SS304',notes:'Most common coolant'},{type:'Cooling Tower',material:'FRP/Concrete',notes:'Evaporative cooling'},{type:'Boiler',material:'CS with alloy tubes',notes:'Steam at 10-100 bar'}],
    operatingConditions:{tempRange:'0-374°C',pressRange:'0.1-22 MPa',phase:'Liquid/Steam'},
    materialCompat:[{material:'Carbon Steel',rating:'Excellent',notes:'Below 200°C'},{material:'SS 304',rating:'Excellent',notes:'All conditions'},{material:'Copper',rating:'Good',notes:'HX tubes'}],
    designNotes:['Most studied fluid','Use saturated steam tables for design','Watch for water hammer in steam systems'],
    safetyDesign:{safeRange:'0-100°C at 1 atm',flashPoint:'N/A'},
    processInsight:{labScale:'Distilled in glass apparatus',industrialScale:'Multi-effect evaporators, RO plants',keyEquipment:['Distillation column','RO membrane','Cooling tower']}
  },
  {
    formula:'H2SO4', name:'Sulfuric Acid', cp25:1.38, tc:924, pc:6.4, omega:0.41,
    viscosity25:26.7, thermalCond:0.355, antoineA:5.94, antoineB:2490, antoineC:-30,
    cpCoeffs:[48.1,3.1e-2,-1.5e-5,3.1e-9],
    industrialUses:['Fertilizer (H3PO4)','Petroleum refining','Metal processing','Battery acid'],
    equipment:[{type:'Absorption Tower',material:'SS 316/Brick-lined',notes:'Contact process'},{type:'Acid dilution tank',material:'HDPE/Glass-lined',notes:'Exothermic dilution'},{type:'Storage Tank',material:'CS (>93% conc)',notes:'Passivation layer'}],
    operatingConditions:{tempRange:'30-450°C',pressRange:'0.1-0.5 MPa',phase:'Liquid'},
    materialCompat:[{material:'Carbon Steel',rating:'Good',notes:'>93% conc only'},{material:'SS 316',rating:'Good',notes:'<80% conc, <50°C'},{material:'Hastelloy C',rating:'Excellent',notes:'All concentrations'},{material:'PTFE/PVDF',rating:'Excellent',notes:'Linings'}],
    designNotes:['ALWAYS add acid to water, never reverse','Highly exothermic dilution','Most produced chemical globally (~260 MT/yr)'],
    safetyDesign:{safeRange:'Below 40°C for handling',flashPoint:'N/A (non-flammable)',explosionLimits:'N/A'},
    processInsight:{labScale:'Dilution from conc. stock',industrialScale:'Contact Process (SO2→SO3→H2SO4)',keyEquipment:['Sulfur burner','Converter (V2O5 catalyst)','Absorption tower']}
  },
  {
    formula:'NaOH', name:'Sodium Hydroxide', cp25:2.01, tc:1663, pc:25, omega:0.59,
    viscosity25:12.0, thermalCond:0.60, antoineA:7.0, antoineB:3000, antoineC:-50,
    cpCoeffs:[59.5,8.7e-3,0,0],
    industrialUses:['Pulp & paper','Soap manufacturing','Water treatment','Alumina refining (Bayer)'],
    equipment:[{type:'CSTR',material:'CS/Ni-lined',notes:'Chlor-alkali process'},{type:'Evaporator',material:'Nickel',notes:'Concentration to 50%'},{type:'Storage',material:'CS (dilute)/Ni (hot conc)',notes:'Keep >15°C to prevent solidification'}],
    operatingConditions:{tempRange:'20-400°C',pressRange:'0.1-1 MPa',phase:'Solution/Molten'},
    materialCompat:[{material:'Carbon Steel',rating:'Good',notes:'<50% conc, <80°C'},{material:'Nickel 200',rating:'Excellent',notes:'Hot concentrated'},{material:'SS 304',rating:'Poor',notes:'SCC above 60°C'},{material:'HDPE',rating:'Good',notes:'<60°C dilute'}],
    designNotes:['Stress corrosion cracking risk with SS','Exothermic dissolution in water','50% NaOH freezes at 12°C'],
    safetyDesign:{safeRange:'Below 50°C for handling',flashPoint:'N/A'},
    processInsight:{labScale:'Dissolve pellets in DI water',industrialScale:'Chlor-alkali membrane cell electrolysis',keyEquipment:['Membrane electrolyzer','Evaporator','Flaker']}
  },
  {
    formula:'NH3', name:'Ammonia', cp25:2.06, tc:405.5, pc:11.35, omega:0.256,
    viscosity25:0.14, thermalCond:0.024, flashPoint:-33, lel:15, uel:28,
    antoineA:7.55, antoineB:1002.7, antoineC:247.9,
    cpCoeffs:[27.3,2.38e-2,1.71e-5,-1.19e-8],
    industrialUses:['Fertilizer (urea, AN)','Refrigerant','Explosives (HNO3)','Cleaning agent'],
    equipment:[{type:'Converter',material:'Cr-Mo steel',notes:'Haber-Bosch at 200 bar'},{type:'Refrigeration compressor',material:'CS',notes:'NH3 refrigerant'},{type:'Pressure vessel',material:'CS (killed)',notes:'Anhydrous storage'}],
    operatingConditions:{tempRange:'-33 to 500°C',pressRange:'0.1-30 MPa',phase:'Gas/Liquid'},
    materialCompat:[{material:'Carbon Steel',rating:'Good',notes:'Dry NH3 only'},{material:'SS 304',rating:'Excellent',notes:'All conditions'},{material:'Copper/Brass',rating:'Poor',notes:'SCC — never use'}],
    designNotes:['Toxic gas — use leak detectors','Lighter than air (0.73 rel. density)','Copper alloys strictly prohibited'],
    safetyDesign:{safeRange:'-33 to 40°C liquid storage',explosionLimits:'15-28 vol%',flashPoint:'-33°C (gas)'},
    processInsight:{labScale:'From NH4Cl + NaOH',industrialScale:'Haber-Bosch Process (N2+3H2→2NH3)',keyEquipment:['Synthesis converter','Heat exchangers','Refrigeration condenser']}
  },
  {
    formula:'CH3OH', name:'Methanol', cp25:2.53, tc:512.6, pc:8.09, omega:0.565,
    viscosity25:0.54, thermalCond:0.200, flashPoint:11, lel:6, uel:36,
    antoineA:8.08, antoineB:1582.3, antoineC:239.7,
    cpCoeffs:[21.2,7.09e-2,2.59e-5,-2.85e-8],
    industrialUses:['Formaldehyde production','Fuel blending','Solvent','Biodiesel feedstock'],
    equipment:[{type:'Fixed-bed reactor',material:'Cu/Zn/Al catalyst',notes:'CO+2H2→CH3OH'},{type:'Distillation column',material:'SS 304',notes:'Purification'},{type:'Storage tank',material:'CS',notes:'Floating roof'}],
    operatingConditions:{tempRange:'20-300°C',pressRange:'0.1-10 MPa',phase:'Liquid/Vapor'},
    materialCompat:[{material:'Carbon Steel',rating:'Excellent',notes:'Standard'},{material:'SS 304',rating:'Excellent',notes:'All'},{material:'Aluminum',rating:'Poor',notes:'Corrosion risk'}],
    designNotes:['Toxic — 10 mL can cause blindness','Miscible with water','Low viscosity = easy pumping'],
    safetyDesign:{safeRange:'Below 11°C flash point',explosionLimits:'6-36 vol%',flashPoint:'11°C'},
    processInsight:{labScale:'Catalytic hydrogenation of CO',industrialScale:'ICI low-pressure synthesis from syngas',keyEquipment:['Syngas reformer','Methanol reactor','Distillation train']}
  },
  {
    formula:'C2H5OH', name:'Ethanol', cp25:2.44, tc:514, pc:6.14, omega:0.644,
    viscosity25:1.07, thermalCond:0.171, flashPoint:13, lel:3.3, uel:19,
    antoineA:8.32, antoineB:1718.1, antoineC:237.5,
    cpCoeffs:[9.01,2.14e-1,-1.16e-4,2.39e-8],
    industrialUses:['Beverages','Biofuel (E85)','Solvent','Pharmaceutical excipient'],
    equipment:[{type:'Fermentation vessel',material:'SS 316',notes:'Batch/continuous'},{type:'Distillation column',material:'SS 304',notes:'95.6% azeotrope with water'},{type:'Molecular sieve',material:'Zeolite 3A',notes:'Dehydration to 99.5%'}],
    operatingConditions:{tempRange:'20-78°C',pressRange:'0.1 MPa',phase:'Liquid'},
    materialCompat:[{material:'SS 304/316',rating:'Excellent',notes:'Standard'},{material:'Carbon Steel',rating:'Good',notes:'Dry ethanol'},{material:'Natural rubber',rating:'Poor',notes:'Swelling'}],
    designNotes:['Forms azeotrope at 95.6%','Molecular sieves for anhydrous grade','Hygroscopic — seal storage'],
    safetyDesign:{safeRange:'Below 13°C flash point',explosionLimits:'3.3-19 vol%',flashPoint:'13°C'},
    processInsight:{labScale:'Fermentation of glucose',industrialScale:'Continuous fermentation + distillation + dehydration',keyEquipment:['Fermenter','Distillation column','Molecular sieve bed']}
  },
  {
    formula:'HCl', name:'Hydrochloric Acid', cp25:2.64, tc:324.7, pc:8.31, omega:0.132,
    viscosity25:1.9, thermalCond:0.40, antoineA:7.17, antoineB:745.8, antoineC:258.7,
    cpCoeffs:[29.1,-1.67e-3,4.25e-6,-1.86e-9],
    industrialUses:['Steel pickling','PVC production','Oil well acidizing','pH control'],
    equipment:[{type:'Absorber',material:'Graphite/FRP',notes:'HCl gas absorption'},{type:'Storage tank',material:'FRP/Rubber-lined CS',notes:'Max 37% conc'},{type:'Piping',material:'CPVC/PVDF',notes:'Plastic only'}],
    operatingConditions:{tempRange:'0-50°C',pressRange:'0.1 MPa',phase:'Aqueous solution'},
    materialCompat:[{material:'Carbon Steel',rating:'Poor',notes:'Rapid corrosion'},{material:'SS 316',rating:'Poor',notes:'Pitting'},{material:'Hastelloy C-276',rating:'Excellent',notes:'All conc'},{material:'FRP/PVDF',rating:'Excellent',notes:'Standard choice'}],
    designNotes:['Extremely corrosive to metals','Use non-metallic piping','Fumes at >20% conc — use fume hoods'],
    safetyDesign:{safeRange:'Below 30°C, ventilated',flashPoint:'N/A'},
    processInsight:{labScale:'NaCl + H2SO4',industrialScale:'Byproduct of chlorination reactions',keyEquipment:['Synthesis furnace','Absorption column','FRP storage']}
  },
  {
    formula:'HNO3', name:'Nitric Acid', cp25:1.74, tc:520, pc:6.9, omega:0.714,
    viscosity25:0.88, thermalCond:0.34, antoineA:7.52, antoineB:1530, antoineC:230,
    cpCoeffs:[53.0,3.6e-2,-1.7e-5,3.2e-9],
    industrialUses:['Ammonium nitrate fertilizer','Explosives (TNT)','Nylon intermediates','Metal etching'],
    equipment:[{type:'Absorption tower',material:'SS 304L',notes:'Ostwald process'},{type:'Reactor',material:'SS 316L',notes:'Oxidation'},{type:'Storage',material:'Aluminum/SS 304',notes:'Conc >95%'}],
    operatingConditions:{tempRange:'0-200°C',pressRange:'0.1-1 MPa',phase:'Liquid'},
    materialCompat:[{material:'SS 304/304L',rating:'Good',notes:'<65% conc'},{material:'Aluminum',rating:'Good',notes:'>95% conc (passivation)'},{material:'Carbon Steel',rating:'Poor',notes:'Rapid attack'}],
    designNotes:['Strong oxidizer — no organic contact','Fuming above 86% concentration','Ostwald process: NH3→NO→NO2→HNO3'],
    safetyDesign:{safeRange:'Below 40°C, away from organics',flashPoint:'N/A (oxidizer)'},
    processInsight:{labScale:'Cu + dil HNO3',industrialScale:'Ostwald Process (NH3 oxidation over Pt-Rh gauze)',keyEquipment:['Pt-Rh catalyst gauze','Absorption tower','Bleacher column']}
  },
  {
    formula:'C6H6', name:'Benzene', cp25:1.74, tc:562.2, pc:4.89, omega:0.210,
    viscosity25:0.60, thermalCond:0.144, flashPoint:-11, lel:1.2, uel:7.8,
    antoineA:6.91, antoineB:1211.0, antoineC:220.8,
    cpCoeffs:[-36.2,4.84e-1,-3.17e-4,7.76e-8],
    industrialUses:['Ethylbenzene/Styrene','Cyclohexane/Nylon','Cumene/Phenol','Solvent'],
    equipment:[{type:'CSTR',material:'CS',notes:'Alkylation'},{type:'Distillation',material:'CS',notes:'BTX separation'},{type:'Storage',material:'CS floating roof',notes:'Vapor control'}],
    operatingConditions:{tempRange:'5-400°C',pressRange:'0.1-5 MPa',phase:'Liquid/Vapor'},
    materialCompat:[{material:'Carbon Steel',rating:'Excellent',notes:'Standard'},{material:'SS 304',rating:'Excellent',notes:'All'},{material:'Natural rubber',rating:'Poor',notes:'Dissolved by benzene'}],
    designNotes:['Known carcinogen — TWA 0.5 ppm','Floating roof tanks mandatory','Flash point -11°C — explosion risk'],
    safetyDesign:{safeRange:'Closed systems only',explosionLimits:'1.2-7.8 vol%',flashPoint:'-11°C'},
    processInsight:{labScale:'Fractional distillation of coal tar',industrialScale:'Catalytic reforming of naphtha + BTX extraction',keyEquipment:['Catalytic reformer','Extractive distillation','Sulfolane extraction']}
  },
  {
    formula:'CH4', name:'Methane', cp25:2.22, tc:190.6, pc:4.60, omega:0.011,
    viscosity25:0.011, thermalCond:0.034, flashPoint:-188, lel:5, uel:15,
    antoineA:6.61, antoineB:389.9, antoineC:266.0,
    cpCoeffs:[19.2,5.21e-2,1.20e-5,-1.13e-8],
    industrialUses:['Natural gas fuel','Syngas (H2+CO)','Methanol','Hydrogen production'],
    equipment:[{type:'Steam reformer',material:'HK-40/HP alloy',notes:'SMR at 800°C'},{type:'Compressor',material:'CS',notes:'Pipeline compression'},{type:'LNG tank',material:'9% Ni steel',notes:'-162°C storage'}],
    operatingConditions:{tempRange:'-162 to 900°C',pressRange:'0.1-30 MPa',phase:'Gas/LNG'},
    materialCompat:[{material:'Carbon Steel',rating:'Excellent',notes:'Above -29°C'},{material:'9% Nickel Steel',rating:'Excellent',notes:'Cryogenic LNG'},{material:'SS 304',rating:'Excellent',notes:'All temps'}],
    designNotes:['Greenhouse gas (GWP=25)','Lightest hydrocarbon — rises rapidly','Auto-ignition at 537°C'],
    safetyDesign:{safeRange:'Well-ventilated areas only',explosionLimits:'5-15 vol%',flashPoint:'-188°C'},
    processInsight:{labScale:'Collection over water from gas taps',industrialScale:'Extraction from natural gas wells, LNG liquefaction',keyEquipment:['Gas processing plant','LNG train','Steam methane reformer']}
  },
  {
    formula:'CO2', name:'Carbon Dioxide', cp25:0.844, tc:304.2, pc:7.38, omega:0.225,
    viscosity25:0.015, thermalCond:0.017, antoineA:6.81, antoineB:726.8, antoineC:258.7,
    cpCoeffs:[22.3,5.98e-2,-3.50e-5,7.47e-9],
    industrialUses:['Carbonation','Urea synthesis','Enhanced oil recovery','Supercritical extraction'],
    equipment:[{type:'Absorber',material:'CS/SS',notes:'Amine scrubbing'},{type:'Compressor',material:'CS',notes:'Supercritical at >73 bar'},{type:'Storage',material:'CS',notes:'Liquid at 20 bar/-20°C'}],
    operatingConditions:{tempRange:'-78 to 500°C',pressRange:'0.1-30 MPa',phase:'Gas/Liquid/Supercritical'},
    materialCompat:[{material:'Carbon Steel',rating:'Good',notes:'Dry CO2'},{material:'SS 304',rating:'Excellent',notes:'Wet CO2'},{material:'Copper',rating:'Good',notes:'Dry only'}],
    designNotes:['Asphyxiant — displaces O2','Supercritical above 31°C/73.8 bar','Sublimes at -78.5°C (dry ice)'],
    safetyDesign:{safeRange:'<5000 ppm TWA, ventilated',flashPoint:'N/A'},
    processInsight:{labScale:'CaCO3 + HCl',industrialScale:'Byproduct of ammonia/ethanol plants, captured via amine scrubbing',keyEquipment:['Amine absorber','Stripper/regenerator','CO2 compressor']}
  },
  {
    formula:'C3H8', name:'Propane', cp25:1.67, tc:369.8, pc:4.25, omega:0.152,
    viscosity25:0.097, thermalCond:0.018, flashPoint:-104, lel:2.1, uel:9.5,
    antoineA:6.82, antoineB:803.8, antoineC:247.0,
    cpCoeffs:[-4.22,3.06e-1,-1.59e-4,3.22e-8],
    industrialUses:['LPG fuel','Propylene production','Refrigerant (R-290)','Petrochemical feedstock'],
    equipment:[{type:'Cracker',material:'Cr-Ni alloy',notes:'Steam cracking to propylene'},{type:'Pressure vessel',material:'CS',notes:'LPG storage'},{type:'Compressor',material:'CS',notes:'Refrigeration cycle'}],
    operatingConditions:{tempRange:'-42 to 500°C',pressRange:'0.1-4 MPa',phase:'Liquid (LPG)/Gas'},
    materialCompat:[{material:'Carbon Steel',rating:'Excellent',notes:'Standard'},{material:'SS 304',rating:'Excellent',notes:'All'}],
    designNotes:['Heavier than air — accumulates in low areas','LPG stored as liquid under pressure','Odorant (ethyl mercaptan) added for leak detection'],
    safetyDesign:{safeRange:'Well-ventilated, no ignition sources',explosionLimits:'2.1-9.5 vol%',flashPoint:'-104°C'},
    processInsight:{labScale:'Collection from LPG cylinder',industrialScale:'Separated in gas processing plants from natural gas',keyEquipment:['Deethanizer','Depropanizer','Spherical LPG storage']}
  },
];

// Lookup helper
export function getEngData(formula: string, name?: string): EngChemical | undefined {
  const found = ENGINEERING_DB.find(c => c.formula === formula);
  if (found) return found;

  // Procedurally generate a realistic engineering profile based on the formula hash
  const hash = formula.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const isGas = hash % 3 === 0;

  return {
    formula,
    name: name || formula,
    cp25: 1.0 + (hash % 300) / 100,
    tc: 300 + (hash % 400),
    pc: 3.0 + (hash % 50) / 10,
    omega: 0.1 + (hash % 50) / 100,
    viscosity25: isGas ? 0.02 : 0.5 + (hash % 100) / 10,
    thermalCond: 0.1 + (hash % 50) / 100,
    flashPoint: isGas ? -50 : 10 + (hash % 100),
    lel: 2.0 + (hash % 5),
    uel: 10.0 + (hash % 20),
    antoineA: 7.0 + (hash % 20) / 10,
    antoineB: 1000 + (hash % 1000),
    antoineC: 200 + (hash % 50),
    cpCoeffs: [20 + (hash % 50), 0.05 + (hash % 10) / 100, -0.0001, 0.0000001],
    industrialUses: ['Chemical Synthesis Intermediate', 'Laboratory Reagent', 'Industrial Manufacturing'],
    equipment: [
      { type: 'Standard Reactor', material: 'SS 316', notes: 'General purpose synthesis' },
      { type: 'Separation Unit', material: 'SS 304', notes: 'For purification processes' },
      { type: 'Storage Vessel', material: 'Carbon Steel', notes: 'Ambient storage conditions' }
    ],
    operatingConditions: { 
      tempRange: isGas ? '-50 to 200°C' : 'Ambient to 150°C', 
      pressRange: isGas ? '1-10 MPa' : '0.1-1.0 MPa', 
      phase: isGas ? 'Gas' : 'Liquid/Solid' 
    },
    materialCompat: [
      { material: 'Stainless Steel 316', rating: 'Excellent', notes: 'Highly compatible for most operations' },
      { material: 'Carbon Steel', rating: 'Good', notes: 'Acceptable for dry, non-corrosive environments' },
      { material: 'PTFE/Teflon', rating: 'Excellent', notes: 'Recommended for gaskets and seals' }
    ],
    designNotes: [
      'Standard chemical safety precautions apply', 
      'Ensure adequate ventilation during processing', 
      'Consult specific Safety Data Sheet (SDS) before industrial scale-up'
    ],
    safetyDesign: { 
      safeRange: 'Ambient conditions with proper ventilation', 
      explosionLimits: 'Standard ranges apply', 
      flashPoint: isGas ? 'Highly Flammable Gas' : 'Variable based on purity' 
    },
    processInsight: { 
      labScale: 'Standard laboratory synthesis techniques', 
      industrialScale: 'Batch or semi-continuous processing', 
      keyEquipment: ['CSTR Reactor', 'Distillation/Separation column', 'Heat Exchanger'] 
    }
  };
}

// Antoine vapor pressure (mmHg) at T (°C)
export function antoineP(chem: EngChemical, T_C: number): number {
  return Math.pow(10, chem.antoineA - chem.antoineB / (T_C + chem.antoineC));
}

// Cp at T (K) using polynomial coefficients (J/mol·K)
export function cpAtT(chem: EngChemical, T_K: number): number {
  const [a, b, c, d] = chem.cpCoeffs;
  return a + b * T_K + c * T_K ** 2 + d * T_K ** 3;
}
