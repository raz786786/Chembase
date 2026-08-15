import type { Industry } from './types';

export const CORE_INDUSTRIES: Industry[] = [
  {
    id: "cement",
    name: "Cement Industry",
    description: "The manufacturing of cement involves mining raw materials, crushing, blending, and pyroprocessing at extreme temperatures to form clinker, which is then ground into fine cement powder.",
    icon: "Factory",
    rawMaterials: [
      { name: "Limestone (CaCO3)", purpose: "Primary source of calcium", properties: "Hard rock, decomposes at 900C", entryPoint: "Crusher" },
      { name: "Clay/Shale", purpose: "Source of silica, alumina, and iron", properties: "Fine-grained", entryPoint: "Raw Mill" },
      { name: "Gypsum", purpose: "Regulates setting time", properties: "Soft sulfate mineral", entryPoint: "Cement Mill" }
    ],
    products: [
      { name: "Portland Cement", purpose: "Primary binding agent in concrete", productionRoute: "Clinker grinding with gypsum" },
      { name: "Clinker", purpose: "Intermediate nodular product", productionRoute: "Pyroprocessing in Rotary Kiln" }
    ],
    roles: [
      {
        title: "Process Engineer",
        responsibilities: ["Optimize kiln fuel consumption", "Monitor raw mix composition", "Ensure environmental compliance"],
        skills: ["Thermodynamics", "Heat Transfer", "Data Analysis"],
        typicalProblems: ["Kiln ringing", "High specific energy consumption", "Unstable preheater temperatures"]
      }
    ],
    processes: [
      {
        id: "crushing",
        name: "Crushing & Pre-homogenization",
        purpose: "Reduce size of quarried limestone for subsequent milling.",
        workingPrinciple: "Mechanical forces (impact, compression) break down large boulders into gravel-sized rocks.",
        inputs: { materials: ["Limestone boulders"], utilities: ["Electricity"], energy: ["Mechanical power"] },
        outputs: { products: ["Crushed limestone (~20-50mm)"], byproducts: [], waste: ["Dust"] },
        typicalConditions: { "Throughput": "1000 - 2000 tph", "Power": "1-3 kWh/ton" },
        chemicalReactions: [],
        massBalanceDesc: "Input rock = Output crushed rock + Dust loss (captured by bag filters).",
        energyBalanceDesc: "Electrical energy is converted to mechanical work for size reduction, with losses to heat and sound.",
        equipmentIds: ["EQ-JAW-CRUSHER-01"],
        instruments: ["Weightometers", "Vibration sensors"],
        control: [],
        hazards: [
          { type: "Mechanical", description: "Moving parts and falling rocks", precautions: "Guards and exclusion zones", ppe: ["Hard hat", "Steel-toe boots"] }
        ],
        environmentalImpact: { emissions: ["Dust"], waste: [], controlTech: ["Bag Filters", "Water sprays"] },
        commonProblems: ["Crusher jam", "Excessive wear on hammers"],
        troubleshooting: [],
        relatedSubjects: ["particulate-technology"],
        nextProcessIds: ["raw-mill"]
      },
      {
        id: "raw-mill",
        name: "Raw Milling",
        purpose: "Grind and dry the raw materials into a fine powder (raw meal).",
        workingPrinciple: "Materials are crushed between rollers (Vertical Roller Mill) or steel balls (Ball Mill) while hot gases from the kiln dry them.",
        inputs: { materials: ["Crushed Limestone", "Clay", "Additives"], utilities: ["Hot gas from Preheater"], energy: ["Electricity"] },
        outputs: { products: ["Raw Meal (<90 microns)"], byproducts: [], waste: [] },
        typicalConditions: { "Inlet Gas Temp": "300C", "Product Fineness": "10-15% residue on 90 micron sieve" },
        chemicalReactions: ["Evaporation of free moisture"],
        massBalanceDesc: "Crushed stone + Clay = Raw Meal + Moisture (vented as vapor).",
        energyBalanceDesc: "Grinding energy + Heat from kiln exhaust = Dry powder + Cooler exhaust gas.",
        equipmentIds: ["EQ-VRM-01"],
        instruments: ["Differential pressure sensors", "Thermocouples"],
        control: [
          { controlledVariable: "Mill outlet temperature", manipulatedVariable: "Hot gas flow", sensor: "Thermocouple", valve: "Damper", controller: "PID" }
        ],
        hazards: [
          { type: "Thermal", description: "Hot gases (300C)", precautions: "Insulation, strict LOTO", ppe: ["Heat-resistant gloves"] }
        ],
        environmentalImpact: { emissions: ["Dust", "Water vapor"], waste: [], controlTech: ["Bag Filters"] },
        commonProblems: ["High mill vibration", "High moisture in product"],
        troubleshooting: [],
        relatedSubjects: ["particulate-technology", "heat-transfer", "process-control"],
        nextProcessIds: ["pyroprocessing"]
      },
      {
        id: "pyroprocessing",
        name: "Pyroprocessing (Kiln)",
        purpose: "Chemically transform raw meal into clinker minerals at 1450C.",
        workingPrinciple: "Raw meal falls through a cyclone preheater, enters a rotary kiln where it is heated by a massive flame. Partial melting allows clinker minerals to form.",
        inputs: { materials: ["Raw Meal"], utilities: ["Combustion Air"], energy: ["Coal/Petcoke/Gas"] },
        outputs: { products: ["Clinker"], byproducts: [], waste: ["Exhaust gases (CO2, NOx)"] },
        typicalConditions: { "Burning Zone Temp": "1450C", "Gas Temp": "2000C", "Kiln Speed": "3-5 rpm" },
        chemicalReactions: [
          "Calcination: CaCO3 -> CaO + CO2 (at 900C)",
          "Clinkerization: 3CaO + SiO2 -> C3S (Alite) (at 1450C)"
        ],
        massBalanceDesc: "1.55 tons of raw meal -> 1 ton of clinker + 0.55 tons of CO2.",
        energyBalanceDesc: "Fuel combustion provides heat for calcination (endothermic) and offsets radiation losses. Heat is recovered from clinker cooler.",
        equipmentIds: ["EQ-ROTARY-KILN-01"],
        instruments: ["Pyrometers", "Gas analyzers (O2, CO, NOx)"],
        control: [
          { controlledVariable: "Burning zone temperature", manipulatedVariable: "Fuel rate", sensor: "Pyrometer", valve: "Fuel feeder", controller: "Advanced Process Control" }
        ],
        hazards: [
          { type: "Thermal", description: "Extreme heat (1450C) and radiant energy", precautions: "Specialized heat shielding, strict operating procedures", ppe: ["Aluminized suits for specific tasks", "Dark visors"] }
        ],
        environmentalImpact: { emissions: ["CO2", "NOx", "SOx"], waste: [], controlTech: ["SNCR for NOx", "ESP/Bag filter for dust"] },
        commonProblems: ["Ring formation", "Refractory failure", "High CO trips"],
        troubleshooting: [
          {
            id: "high-co",
            symptom: "High CO levels at kiln inlet",
            possibleCauses: ["Incomplete combustion", "Excess fuel", "Insufficient secondary air from cooler", "Poor burner atomization"],
            whatToCheckFirst: "Check O2 levels at the kiln inlet to verify if there is an oxygen deficiency.",
            diagnosticQuestions: ["Has the fuel feed rate spiked?", "Is the ID fan running at full capacity?", "Did the clinker cooler grate speed change?"],
            possibleSolutions: ["Reduce fuel feed rate", "Increase ID fan speed to pull more air", "Adjust burner momentum"],
            safetyConsiderations: "High CO can lead to explosive mixtures in the ESP/Baghouse. Do NOT bypass CO trips."
          }
        ],
        relatedSubjects: ["thermodynamics", "heat-transfer", "reaction-eng"],
        nextProcessIds: ["cement-mill"]
      },
      {
        id: "cement-mill",
        name: "Cement Grinding",
        purpose: "Grind clinker and gypsum into fine cement powder.",
        workingPrinciple: "Ball mill or roller press crushes the hard clinker nodules. Gypsum is co-ground to prevent flash-setting of concrete.",
        inputs: { materials: ["Clinker", "Gypsum", "Fly ash/Slag"], utilities: [], energy: ["Electricity"] },
        outputs: { products: ["Finished Cement"], byproducts: [], waste: [] },
        typicalConditions: { "Blaine Fineness": "3000-4000 cm2/g", "Mill Outlet Temp": "< 110C" },
        chemicalReactions: ["Dehydration of gypsum if temperature is too high (CaSO4-2H2O -> CaSO4-0.5H2O + 1.5H2O)"],
        massBalanceDesc: "95% Clinker + 5% Gypsum = 100% Ordinary Portland Cement.",
        energyBalanceDesc: "High electrical energy (30-40 kWh/t) converted to surface area (comminution) and heat. Water injection used for cooling.",
        equipmentIds: ["EQ-BALL-MILL-01"],
        instruments: ["Acoustic sensors (mill ear)", "Elevator motor amps"],
        control: [
          { controlledVariable: "Mill load", manipulatedVariable: "Fresh feed rate", sensor: "Acoustic sensor / Elevator amps", valve: "Weigh feeders", controller: "PID" }
        ],
        hazards: [
          { type: "Acoustic", description: "Extreme noise levels (>100 dB)", precautions: "Acoustic enclosures", ppe: ["Ear muffs / Plugs"] }
        ],
        environmentalImpact: { emissions: ["Dust"], waste: [], controlTech: ["Bag Filters"] },
        commonProblems: ["Mill plugging", "False set in cement (due to high temp)"],
        troubleshooting: [],
        relatedSubjects: ["particulate-technology"],
        nextProcessIds: []
      }
    ],
    challenges: [
      {
        id: "cem-c1",
        scenario: "You are the Process Engineer on duty. The kiln inlet O2 analyzer shows 0.5% (normal is 1.5%) and CO is rising rapidly towards the 0.5% trip limit. The kiln temperature is dropping. What is your immediate action?",
        options: [
          { text: "Increase fuel feed to raise the dropping temperature.", feedback: "DANGEROUS. You already have a lack of oxygen (low O2, high CO). Adding more fuel will create an explosive mixture in the exhaust system.", score: 0 },
          { text: "Decrease the ID fan speed to retain heat in the kiln.", feedback: "INCORRECT. Decreasing the ID fan reduces the draft, pulling even less combustion air, which worsens the incomplete combustion.", score: 0 },
          { text: "Reduce fuel feed and increase ID fan speed (draft).", feedback: "CORRECT! The priority is to restore safe combustion by providing more air and less fuel, clearing the CO. Temperature recovery comes after combustion is stable.", score: 100 }
        ],
        correctApproach: "Always prioritize safe combustion over temperature. High CO with low O2 means incomplete combustion. You must reduce the fuel-to-air ratio by cutting fuel and/or increasing air (draft). Once CO is clear, you can re-adjust to restore temperature safely."
      }
    ],
    relatedSubjects: [
      { subjectId: "thermodynamics", application: "Used to analyze the energy requirements of the calcination reaction and heat recovery in the clinker cooler." },
      { subjectId: "heat-transfer", application: "Critical for the design of the cyclone preheater, rotary kiln refractory lining, and clinker cooler." },
      { subjectId: "particulate-technology", application: "Governs all comminution (crushing and grinding) operations, which account for ~60% of the plant's electricity use." }
    ]
  },
  {
    id: "fertilizer",
    name: "Fertilizer (Ammonia/Urea)",
    description: "The synthetic fertilizer industry primarily converts natural gas, air, and water into Ammonia (Haber-Bosch), which is then reacted with CO2 to form Urea, the world's most common nitrogen fertilizer.",
    icon: "Wheat",
    rawMaterials: [
      { name: "Natural Gas (Methane)", purpose: "Source of hydrogen and energy", properties: "Gas, highly flammable", entryPoint: "Desulfurization / Primary Reformer" },
      { name: "Air", purpose: "Source of nitrogen", properties: "Atmospheric", entryPoint: "Secondary Reformer" },
      { name: "Water", purpose: "Steam for reforming", properties: "Demineralized", entryPoint: "Primary Reformer" }
    ],
    products: [
      { name: "Ammonia (NH3)", purpose: "Intermediate chemical and direct fertilizer", productionRoute: "Haber-Bosch Process" },
      { name: "Urea (NH2CONH2)", purpose: "Solid nitrogen fertilizer", productionRoute: "Ammonia + CO2 reaction" }
    ],
    roles: [
      {
        title: "Process Control Engineer",
        responsibilities: ["Tune APC loops on reformers", "Monitor compressor anti-surge control"],
        skills: ["Process Control", "Fluid Mechanics"],
        typicalProblems: ["Compressor surge", "Temperature runaways in methanator"]
      }
    ],
    processes: [
      {
        id: "reforming",
        name: "Steam Methane Reforming (SMR)",
        purpose: "Convert natural gas and steam into synthesis gas (H2, CO, CO2).",
        workingPrinciple: "Endothermic catalytic reaction inside tubes heated by external burners.",
        inputs: { materials: ["Desulfurized Natural Gas", "Steam"], utilities: ["Fuel Gas"], energy: ["Heat"] },
        outputs: { products: ["Syngas (H2, CO, CO2, unreacted CH4)"], byproducts: [], waste: ["Flue gas"] },
        typicalConditions: { "Reformer Temp": "800C", "Pressure": "30-40 bar", "Steam:Carbon Ratio": "3.0" },
        chemicalReactions: ["CH4 + H2O <-> CO + 3H2 (Endothermic)"],
        massBalanceDesc: "1 mole CH4 + 1 mole H2O -> 4 moles of product gas.",
        energyBalanceDesc: "Highly endothermic. 50% of natural gas is burned just to provide the heat for reforming the other 50%.",
        equipmentIds: ["EQ-PRIMARY-REFORMER"],
        instruments: ["Tube skin thermocouples"],
        control: [
          { controlledVariable: "Exit temperature", manipulatedVariable: "Fuel gas flow", sensor: "Thermocouple", valve: "Fuel control valve", controller: "Cascade PID" }
        ],
        hazards: [
          { type: "Thermal/Pressure", description: "High pressure inside red-hot tubes", precautions: "Strict monitoring of tube skin temperatures", ppe: ["Standard PPE"] }
        ],
        environmentalImpact: { emissions: ["CO2", "NOx"], waste: [], controlTech: ["Low-NOx burners"] },
        commonProblems: ["Carbon laydown (coking) on catalyst", "Tube rupture"],
        troubleshooting: [],
        relatedSubjects: ["reaction-eng", "thermodynamics"],
        nextProcessIds: ["shift-conversion"]
      },
      {
        id: "shift-conversion",
        name: "Water-Gas Shift & Methanation",
        purpose: "Maximize H2 yield and remove CO/CO2 which poison the ammonia catalyst.",
        workingPrinciple: "CO reacts with steam to form more H2 and CO2. CO2 is then absorbed. Any remaining traces of CO/CO2 are converted back to CH4 (Methanation).",
        inputs: { materials: ["Syngas", "Steam"], utilities: ["Cooling water"], energy: [] },
        outputs: { products: ["Pure Syngas (H2 + N2)"], byproducts: ["CO2 (sent to Urea plant)"], waste: [] },
        typicalConditions: { "HTSC Temp": "350-400C", "LTSC Temp": "200-250C" },
        chemicalReactions: ["Shift: CO + H2O <-> CO2 + H2 (Exothermic)", "Methanation: CO + 3H2 -> CH4 + H2O (Highly Exothermic)"],
        massBalanceDesc: "CO is converted to CO2, increasing H2 yield.",
        energyBalanceDesc: "Exothermic reactions require inter-stage cooling to favor the forward reaction (Le Chatelier).",
        equipmentIds: ["EQ-SHIFT-REACTOR"],
        instruments: ["Infrared gas analyzers"],
        control: [],
        hazards: [
          { type: "Chemical", description: "Methanation runaway", precautions: "Strict limits on CO/CO2 slip into methanator", ppe: [] }
        ],
        environmentalImpact: { emissions: [], waste: [], controlTech: [] },
        commonProblems: ["High CO slip from shift reactors"],
        troubleshooting: [],
        relatedSubjects: ["reaction-eng", "thermodynamics"],
        nextProcessIds: ["ammonia-synthesis"]
      },
      {
        id: "ammonia-synthesis",
        name: "Ammonia Synthesis",
        purpose: "Convert H2 and N2 into Ammonia gas.",
        workingPrinciple: "Haber-Bosch process. High pressure (150-250 bar) and a catalyst are used to force N2 and H2 to react. Conversion is low per pass (15-20%), requiring a large recycle loop.",
        inputs: { materials: ["Pure Syngas (H2, N2 ratio 3:1)"], utilities: ["Refrigeration (Ammonia)"], energy: ["Compressor power"] },
        outputs: { products: ["Liquid Ammonia"], byproducts: [], waste: ["Purge gas"] },
        typicalConditions: { "Pressure": "150 - 250 bar", "Temperature": "400 - 500C" },
        chemicalReactions: ["N2 + 3H2 <-> 2NH3 (Exothermic)"],
        massBalanceDesc: "Make-up gas + Recycle gas -> Reactor -> Ammonia condensation -> Unreacted gas recycled.",
        energyBalanceDesc: "Reaction is exothermic. Heat is recovered to generate high-pressure steam. Product is condensed using a refrigeration loop.",
        equipmentIds: ["EQ-SYN-GAS-COMPRESSOR", "EQ-AMMONIA-CONVERTER"],
        instruments: ["Vibration monitors on compressor", "High-pressure gauges"],
        control: [],
        hazards: [
          { type: "Chemical/Pressure", description: "Toxic ammonia gas at extreme pressures", precautions: "Ammonia detectors, double block and bleed valves", ppe: ["Ammonia respirators available"] }
        ],
        environmentalImpact: { emissions: ["Ammonia vapor (if leaked)"], waste: [], controlTech: ["Flares/Scrubbers"] },
        commonProblems: ["Catalyst poisoning", "Compressor surge", "High inert (Argon/Methane) buildup in loop"],
        troubleshooting: [],
        relatedSubjects: ["thermodynamics", "reaction-eng", "fluid-mechanics"],
        nextProcessIds: ["urea-synthesis"]
      },
      {
        id: "urea-synthesis",
        name: "Urea Synthesis & Prilling",
        purpose: "Convert toxic ammonia and CO2 into safe, solid Urea fertilizer.",
        workingPrinciple: "Ammonia and CO2 react at high pressure to form ammonium carbamate, which dehydrates to urea. The urea melt is sprayed down a tall tower (prilling) to form solid spheres.",
        inputs: { materials: ["Liquid Ammonia", "CO2"], utilities: ["Cooling Water"], energy: ["Steam"] },
        outputs: { products: ["Urea Prills/Granules"], byproducts: [], waste: ["Process condensate"] },
        typicalConditions: { "Synthesis Pressure": "140 bar", "Synthesis Temp": "190C" },
        chemicalReactions: ["2NH3 + CO2 <-> NH2COONH4 (Fast, Exothermic)", "NH2COONH4 <-> NH2CONH2 + H2O (Slow, Endothermic)"],
        massBalanceDesc: "Ammonia and CO2 are consumed; water is generated and must be evaporated.",
        energyBalanceDesc: "First step is highly exothermic, second is endothermic. Overall requires careful heat integration.",
        equipmentIds: ["EQ-UREA-REACTOR", "EQ-PRILLING-TOWER"],
        instruments: ["Coriolis flow meters"],
        control: [
          { controlledVariable: "NH3/CO2 Ratio (N/C)", manipulatedVariable: "Ammonia feed", sensor: "Flow meters", valve: "Control valve", controller: "Ratio Controller" }
        ],
        hazards: [
          { type: "Chemical", description: "Carbamate is highly corrosive", precautions: "Special metallurgy (e.g. Urea-grade stainless steel) and passivating air injection", ppe: [] }
        ],
        environmentalImpact: { emissions: ["Urea dust from prill tower"], waste: [], controlTech: ["Scrubbers"] },
        commonProblems: ["Corrosion of high-pressure piping", "Biuret formation (toxic to plants) due to high temps"],
        troubleshooting: [],
        relatedSubjects: ["reaction-eng", "mass-transfer"],
        nextProcessIds: []
      }
    ],
    challenges: [],
    relatedSubjects: [
      { subjectId: "reaction-eng", application: "Reactor design for the Haber-Bosch process involves complex thermodynamics and kinetics due to the equilibrium limitations." },
      { subjectId: "fluid-mechanics", application: "Syngas compressor operations are the heart of the plant, requiring deep knowledge of centrifugal compression and surge control." }
    ]
  },
  {
    id: "oil-gas",
    name: "Oil & Gas Refinery",
    description: "Refineries convert crude oil into high-value products like gasoline, diesel, and jet fuel through fractional distillation, cracking, and treating.",
    icon: "Fuel",
    rawMaterials: [],
    products: [],
    roles: [],
    processes: [],
    challenges: [],
    relatedSubjects: []
  }
];
