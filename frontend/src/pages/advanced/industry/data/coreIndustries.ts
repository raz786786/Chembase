import type { Industry } from './types';

export const CORE_INDUSTRIES: Industry[] = [
  // 1. CEMENT INDUSTRY
  {
    id: "cement",
    name: "Cement Industry",
    description: "The manufacturing of Portland cement involves mining calcareous and argillaceous raw materials, crushing, blending, and high-temperature pyroprocessing at 1450°C to synthesize clinker minerals (C3S, C2S, C3A, C4AF), followed by finish grinding with gypsum.",
    icon: "Factory",
    rawMaterials: [
      { name: "Limestone (CaCO3)", purpose: "Primary source of calcium oxide (CaO) for clinker phases", properties: "Sedimentary rock, decomposes endothermically at 900°C", entryPoint: "Primary Jaw Crusher" },
      { name: "Clay / Shale", purpose: "Supplies acidic oxides: silica (SiO2), alumina (Al2O3), and iron (Fe2O3)", properties: "Fine-grained aluminosilicate minerals", entryPoint: "Raw Material Blending Hoppers" },
      { name: "Iron Ore / Copper Slag", purpose: "Fluxing corrective additive to adjust Alumina and Silica Moduli", properties: "Dense granular mineral / metallurgical byproduct", entryPoint: "Raw Mill Feed Proportioning" },
      { name: "Gypsum (CaSO4·2H2O)", purpose: "Retards cement hydration setting time to prevent flash-set of concrete", properties: "Soft calcium sulfate dihydrate mineral", entryPoint: "Finish Cement Mill" }
    ],
    products: [
      { name: "Ordinary Portland Cement (OPC)", purpose: "General-purpose hydraulic binding agent for concrete and structural construction", productionRoute: "Inter-grinding 95% clinker with 5% natural gypsum in closed-circuit ball mills" },
      { name: "Portland Pozzolana Cement (PPC)", purpose: "High-durability hydraulic cement with enhanced sulfate and acid resistance", productionRoute: "Co-grinding clinker, gypsum, and 15-35% pozzolanic fly ash or calcined clay" },
      { name: "Clinker", purpose: "Semi-finished hydraulic nodular product exported for local grinding", productionRoute: "High-temperature sintering of homogenized raw meal in rotary kilns at 1450°C" }
    ],
    roles: [
      {
        title: "Process Optimization Engineer",
        responsibilities: ["Tune precalciner fuel feed to achieve 90-95% calcination degree", "Monitor burning zone optical pyrometer to stabilize Alite formation", "Minimize plant specific heat consumption (<3150 MJ/t clinker)"],
        skills: ["Thermodynamics", "Combustion Engineering", "Data Analysis (PI/IP21)"],
        typicalProblems: ["Kiln inlet ring formation", "Low early compressive strength in finished cement", "High power consumption on finish mills"]
      },
      {
        title: "Plant HSE & Environmental Compliance Manager",
        responsibilities: ["Ensure stack continuous emission monitoring (CEMS) compliance", "Supervise Selective Non-Catalytic Reduction (SNCR) for NOx control", "Enforce LOTO protocols during preheater cyclone deslagging"],
        skills: ["Process Safety", "Environmental Regulations", "Industrial Hygiene"],
        typicalProblems: ["Baghouse filter bag burns from hot gas spikes", "CO trip in Electrostatic Precipitators", "Fugitive dust leaks at transfer chutes"]
      },
      {
        title: "Quality Control Chemist & XRF Analyst",
        responsibilities: ["Control Lime Saturation Factor (LSF 94-98%) and Silica Modulus", "Perform free-lime (f-CaO) ethylene glycol titration on clinker hourly", "Conduct Blaine fineness and autoclave soundness tests on finished cement"],
        skills: ["Analytical Chemistry", "X-Ray Fluorescence (XRF)", "Materials Science"],
        typicalProblems: ["Raw mix chemical segregation in storage silos", "High free lime causing delayed expansion in concrete"]
      }
    ],
    processes: [
      {
        id: "crushing",
        name: "Quarrying & Primary Crushing",
        purpose: "Reduce run-of-mine limestone boulders from 1.2 m down to gravel size (<50 mm) for efficient grinding.",
        workingPrinciple: "Heavy reciprocating jaw plates and high-speed impact hammers impart high compressive and shear stress, shattering massive rock boulders along natural mineral cleavage planes.",
        inputs: { materials: ["Limestone boulders (CaCO3)"], utilities: ["Electrical grid power"], energy: ["Mechanical drive energy (1-2 kWh/t)"] },
        outputs: { products: ["Crushed limestone aggregates (20-50 mm)"], byproducts: [], waste: ["Fugitive dust (captured by baghouses)"] },
        typicalConditions: { "Throughput": "1000 - 2200 t/h", "Power Draw": "1.2 - 1.8 kWh/ton", "Crusher Gap Setting": "35 - 50 mm" },
        chemicalReactions: ["Physical size reduction; no chemical reaction."],
        massBalanceDesc: "Input raw quarried rock = Output crushed aggregates + Dust captured in bag filters (100% mass continuity).",
        energyBalanceDesc: "Electrical power converted to kinetic comminution energy, with major dissipation as frictional heat and acoustic sound (>95 dBA).",
        equipmentIds: ["EQ-JAW-CRUSHER-01"],
        instruments: ["Belt weighometers", "Vibration transmitters on crusher bearings", "Tramp metal detectors"],
        control: [
          { controlledVariable: "Crusher surge bin level", manipulatedVariable: "Wobbler feeder speed", sensor: "Ultrasonic level transmitter", valve: "Hydraulic VFD motor", controller: "PID" }
        ],
        hazards: [
          { type: "Mechanical", description: "Flying rock projectiles and nip pinch points", precautions: "Heavy rubber safety curtains, exclusion barriers, pull-wire emergency stops", ppe: ["Hard hat", "Steel-toe high-top boots", "High-visibility vest", "Safety glasses"] }
        ],
        environmentalImpact: { emissions: ["Particulate dust matter (PM10/PM2.5)"], waste: [], controlTech: ["Water mist suppression sprays", "Modular pulse-jet bag filter units"] },
        commonProblems: ["Crusher cavity jam from oversized rock", "Toggle plate failure on uncrushable metal tramp"],
        troubleshooting: [
          {
            id: "crush-jam",
            symptom: "Sudden crusher stalling with motor overcurrent trip",
            possibleCauses: ["Oversized rock wedged in cavity", "Tramp iron metal piece caught between jaw dies", "Lubrication oil failure on eccentric shaft"],
            whatToCheckFirst: "Inspect crusher feed cavity using overhead crane camera before attempting restart.",
            diagnosticQuestions: ["Did the metal detector trip the upstream conveyor?", "Are eccentric bearing temperatures elevated?"],
            possibleSolutions: ["Activate hydraulic rock breaker to fragment jammed boulder", "Reverse feeder to clear tramp metal", "Reset thermal overloads"],
            safetyConsiderations: "Never enter crusher cavity without complete mechanical pinning and electrical LOTO."
          }
        ],
        relatedSubjects: ["particulate-technology", "fluid-mechanics"],
        nextProcessIds: ["raw-mill"]
      },
      {
        id: "raw-mill",
        name: "Raw Milling & Drying",
        purpose: "Grind and dry limestone, clay, and iron corrective additives into an ultra-fine homogeneous powder (raw meal).",
        workingPrinciple: "Material falls onto a rotating circular grinding table and is crushed under large hydraulically loaded rollers. Preheater exhaust gas (300°C) sweeps upward through a nozzle ring, drying the meal and conveying it into an integral dynamic cage classifier.",
        inputs: { materials: ["Crushed limestone", "Clay", "Corrective iron ore"], utilities: ["Kiln preheater hot exhaust gas (300°C)"], energy: ["Electric power (14-18 kWh/t)"] },
        outputs: { products: ["Homogenized raw meal (<90 µm, moisture <1.0%)"], byproducts: [], waste: ["Vented moisture vapor"] },
        typicalConditions: { "Inlet Gas Temperature": "280 - 320 °C", "Mill Outlet Temperature": "85 - 95 °C", "Product Fineness": "12 - 14% residue on 90 µm sieve", "Mill Differential Pressure": "50 - 65 mbar" },
        chemicalReactions: ["Endothermic evaporation of free surface and pore moisture (H2O(l) -> H2O(g))."],
        massBalanceDesc: "Wet feed aggregates (5-8% moisture) + Hot gas -> Dry raw meal powder (99.2% solids) + Evaporated water vapor.",
        energyBalanceDesc: "Electrical mechanical grinding energy + Preheater exhaust sensible heat = Sensible heat of meal + Latent heat of water evaporation + Exhaust gas.",
        equipmentIds: ["EQ-VRM-01"],
        instruments: ["Mill differential pressure transmitter", "Dynamic separator VFD speed tachometer", "Inlet/outlet thermocouples", "Roller hydraulic pressure gauges"],
        control: [
          { controlledVariable: "Mill outlet gas temperature (90°C)", manipulatedVariable: "Hot gas damper position / fresh air damper", sensor: "Thermocouple (TE-101)", valve: "Pneumatic butterfly damper", controller: "PID" },
          { controlledVariable: "Mill grinding bed load / differential pressure", manipulatedVariable: "Fresh feed weigh feeder rate", sensor: "Differential pressure cell (PDT-102)", valve: "Gravimetric weigh feeder VFD", controller: "PID" }
        ],
        hazards: [
          { type: "Thermal & Pressure", description: "Hot flue gases (300°C) and pressurized hydraulic oil accumulators (150 bar)", precautions: "Thermal insulation, strict hydraulic depressurization protocols", ppe: ["Heat-resistant gloves", "Face shield", "Hearing protection (noise >90 dBA)"] }
        ],
        environmentalImpact: { emissions: ["Particulate dust", "Moisture vapor"], waste: [], controlTech: ["Pulse-jet fabric filter baghouse (emission <5 mg/Nm³)"] },
        commonProblems: ["High mill vibration causing unexpected trip", "High moisture in product meal causing silo aeration fluidization failure"],
        troubleshooting: [
          {
            id: "vrm-vib",
            symptom: "Excessive mill vibration trip (>3.5 mm/s)",
            possibleCauses: ["Loss of grinding bed stability due to fine or dry feed", "Tramp metal under grinding roller", "Deflated hydraulic accumulator nitrogen bladder"],
            whatToCheckFirst: "Check feed bin level and table water spray status.",
            diagnosticQuestions: ["Did the raw material moisture drop abruptly?", "Are hydraulic pressure swings visible on the DCS?"],
            possibleSolutions: ["Increase table water injection rate by 1-2% to stabilize the solid bed", "Inspect table and rollers for foreign metal", "Recharge accumulator bladders"],
            safetyConsiderations: "Ensure mill is completely stopped and locked out before opening inspection manways."
          }
        ],
        relatedSubjects: ["particulate-technology", "heat-transfer", "process-control"],
        nextProcessIds: ["pyroprocessing"]
      },
      {
        id: "pyroprocessing",
        name: "Preheating, Precalcination & Rotary Kiln",
        purpose: "Chemically convert raw meal into hydraulic cement clinker minerals at 1450°C through calcination and sintering.",
        workingPrinciple: "Raw meal cascades downward through a 5-stage cyclone preheater tower and inline precalciner vessel, achieving 90-95% calcination. The meal enters a counter-current refractory rotary kiln, where an intense burner flame creates a 20-25% liquid melt, crystallizing Alite (C3S) and Belite (C2S).",
        inputs: { materials: ["Raw meal (CaCO3, SiO2, Al2O3, Fe2O3)"], utilities: ["Combustion air (primary air + preheated secondary/tertiary air at 1000°C)"], energy: ["Pulverized coal / Petcoke / Alternative fuels (RDF) (3000-3200 MJ/t clinker)"] },
        outputs: { products: ["Cement clinker nodules (1450°C)"], byproducts: [], waste: ["Kiln flue gases (CO2, N2, H2O, thermal NOx, trace SO2)"] },
        typicalConditions: { "Burning Zone Temperature": "1400 - 1480 °C", "Kiln Shell Temperature": "200 - 320 °C", "Calciner Exit Temperature": "860 - 900 °C", "Kiln Inlet Oxygen": "1.5 - 2.5 %", "Kiln Inlet CO": "< 0.08 %", "Kiln Speed": "3.2 - 4.8 RPM" },
        chemicalReactions: [
          "Calcination (850-900°C): CaCO3(s) -> CaO(s) + CO2(g) (ΔH = +1782 kJ/kg CaCO3)",
          "Belite formation (1000-1200°C): 2CaO + SiO2 -> 2CaO·SiO2 (C2S)",
          "Alite formation in liquid melt (1400-1450°C): 2CaO·SiO2 (C2S) + CaO -> 3CaO·SiO2 (C3S)",
          "Liquid flux phase formation (1338°C): 3CaO·Al2O3 (C3A) and 4CaO·Al2O3·Fe2O3 (C4AF)"
        ],
        massBalanceDesc: "1.55 tons of dry raw meal -> 1.00 ton of clinker + 0.55 tons of process CO2 gas (chemical stoichiometry).",
        energyBalanceDesc: "Fuel combustion heat (3150 MJ/t) = Calcination enthalpy (+1782 kJ/kg) + Clinker sensible heat + Radiation/convection shell losses + Preheater exhaust loss.",
        equipmentIds: ["EQ-ROTARY-KILN-01"],
        instruments: ["Optical radiation pyrometer", "Continuous infrared shell temperature scanner", "Inlet zirconia probe (O2, CO, NOx)", "Kiln drive motor torque meter", "Thermocouples in all cyclone riser ducts"],
        control: [
          { controlledVariable: "Burning zone temperature (1450°C)", manipulatedVariable: "Kiln main burner coal feed rate", sensor: "Optical radiation pyrometer", valve: "Coal weigh feeder VFD", controller: "Advanced Process Control (Fuzzy Logic)" },
          { controlledVariable: "Kiln inlet draft and oxygen (2.0%)", manipulatedVariable: "Induced draft (ID) fan speed", sensor: "Zirconia oxygen probe / Pressure transmitter", valve: "ID fan medium voltage VFD", controller: "PID" }
        ],
        hazards: [
          { type: "Thermal & Radiation", description: "Extreme radiant heat (1450°C flame, 2000°C core), liquid clinker flush, shell red spots", precautions: "Infrared shell scanning, refractory thickness monitoring, strict perimeter barriers", ppe: ["Aluminized proximity heat suit", "Face shield with infrared filter", "Thermal safety boots"] },
          { type: "Explosive Gas", description: "CO gas accumulation from incomplete combustion in preheater or ESP", precautions: "Automated high CO trip interlock (<0.5% CO) shutting down high-voltage fields", ppe: ["Portable 4-gas monitor"] }
        ],
        environmentalImpact: { emissions: ["Process CO2 (calcination)", "Combustion CO2", "Thermal and fuel NOx", "Trace SOx", "Particulate dust"], waste: [], controlTech: ["Selective Non-Catalytic Reduction (SNCR) with aqueous ammonia injection", "Low-NOx burner design", "Electrostatic Precipitator (ESP) / High-temperature baghouse", "Waste Heat Recovery (WHR) Rankine cycle"] },
        commonProblems: ["Kiln ring formation choking gas flow", "Preheater cyclone blockage (snowman formation)", "High CO trips causing electrostatic precipitator shutdown", "Refractory brick loss leading to red spots on shell"],
        troubleshooting: [
          {
            id: "high-co-trip",
            symptom: "Rapid spike in kiln inlet CO (>0.4%) with falling O2 (<0.8%)",
            possibleCauses: ["Sudden coal weigh feeder flush or over-dosing", "Insufficient secondary combustion air from clinker cooler", "Induced draft (ID) fan damper hunting or failure"],
            whatToCheckFirst: "Check kiln inlet O2 analyzer reading immediately to confirm oxygen deficiency.",
            diagnosticQuestions: ["Did the coal feeder gravimetric belt speed jump?", "Is tertiary air duct damper open?"],
            possibleSolutions: ["Immediately reduce coal feed by 10-15%", "Increase ID fan speed to restore inlet draft and pull excess air", "Ensure ESP does not trip on high CO limit"],
            safetyConsiderations: "CO mixed with air at >0.5% is an explosion hazard in downstream dust collectors. Do not override CO trip interlocks."
          },
          {
            id: "kiln-ring",
            symptom: "Increasing kiln inlet draft resistance, surging drive amps, and restricted clinker flow",
            possibleCauses: ["Alkali-sulfur imbalance in raw meal forming low-melting sulfated phases", "Over-concentrated thermal flame impinging on shell", "High coal ash deposition"],
            whatToCheckFirst: "Review raw mix and fuel sulfur/alkali molar ratio (target: 0.8 - 1.2).",
            diagnosticQuestions: ["Has petcoke with high sulfur (>5%) been introduced?", "Is the flame short and bushy?"],
            possibleSolutions: ["Adjust burner pipe primary air momentum to elongate flame", "Perform controlled thermal cycling to crack the ring", "Employ specialized CO2 blaster cannons during a brief stop"],
            safetyConsiderations: "Ring collapses can produce sudden massive waves of hot clinker towards the kiln hood."
          }
        ],
        relatedSubjects: ["thermodynamics", "heat-transfer", "reaction-eng", "process-control"],
        nextProcessIds: ["clinker-cooling"]
      },
      {
        id: "clinker-cooling",
        name: "Clinker Cooling & Heat Recuperation",
        purpose: "Rapidly quench clinker nodules from 1450°C to <100°C to freeze Alite crystal structure and maximize thermal recuperation.",
        workingPrinciple: "Clinker drops from the kiln onto reciprocating hydraulic grate plates. Cold atmospheric air is blown upward through the porous bed. The air is preheated to 1000°C and recuperated as secondary and tertiary combustion air for the kiln and calciner.",
        inputs: { materials: ["Hot clinker nodules (1450°C)"], utilities: ["Cold cooling air from high-pressure blowers"], energy: ["Electric power for grate drive and blowers"] },
        outputs: { products: ["Cooled clinker nodules (<100°C) sent to storage silos"], byproducts: [], waste: ["Excess cooler exhaust air (sent to Waste Heat Recovery or baghouse)"] },
        typicalConditions: { "Secondary Air Temperature": "950 - 1150 °C", "Tertiary Air Temperature": "800 - 950 °C", "Clinker Discharge Temperature": "< 100 °C", "Cooler Thermal Efficiency": "72 - 76 %" },
        chemicalReactions: ["Rapid cooling (quenching) prevents Alite (C3S) decomposition back into Belite (C2S) and free lime; locks in high hydraulic reactivity."],
        massBalanceDesc: "1.0 ton of clinker in = 1.0 ton of clinker out (zero mass loss).",
        energyBalanceDesc: "Sensible heat of 1450°C clinker (~1500 MJ/t) -> 75% recuperated into combustion air, 20% into excess air/WHR, 5% residual heat.",
        equipmentIds: ["EQ-ROTARY-KILN-01"],
        instruments: ["Grate pressure drop transmitters", "Secondary air optical pyrometer", "Infrared bed surface camera", "Clinker discharge thermocouple"],
        control: [
          { controlledVariable: "Cooler under-grate pressure (bed depth)", manipulatedVariable: "Hydraulic grate stroke speed", sensor: "Pressure transmitter", valve: "Hydraulic proportional valve", controller: "PID" }
        ],
        hazards: [
          { type: "Thermal & Mechanical", description: "Hot clinker spills, high pressure hydraulic oil lines, clinker crust collapses", precautions: "Enclosed cooler housing, automatic clinker breaker guards", ppe: ["Thermal high-top boots", "Face shield", "Thermal gloves"] }
        ],
        environmentalImpact: { emissions: ["Clinker dust in excess air"], waste: [], controlTech: ["Dedicated clinker cooler pulse-jet baghouse"] },
        commonProblems: ["Red river (uncooled liquid/hot clinker channeling along one side)", "Snowman buildup on inlet static grate"],
        troubleshooting: [
          {
            id: "red-river",
            symptom: "A stream of incandescent clinker bypassing air flow along one side of the cooler grate",
            possibleCauses: ["Uneven clinker distribution from kiln discharge", "Blinded grate air nozzles", "Excessive fines in clinker"],
            whatToCheckFirst: "Inspect inlet static grate air nozzle pressures and clinker spread via viewport.",
            diagnosticQuestions: ["Are under-grate compartment pressures asymmetric?"],
            possibleSolutions: ["Adjust aeration fan damper balance", "Increase grate speed momentarily to purge bed", "Optimize kiln flame shape to prevent uneven granulation"],
            safetyConsiderations: "Avoid looking directly into inspection doors without protective dark visors."
          }
        ],
        relatedSubjects: ["heat-transfer", "fluid-mechanics", "thermodynamics"],
        nextProcessIds: ["cement-mill"]
      },
      {
        id: "cement-mill",
        name: "Finish Cement Grinding & Blending",
        purpose: "Co-grind hard clinker nodules with natural gypsum (and pozzolanic mineral additives) into fine hydraulic cement powder.",
        workingPrinciple: "A dual-compartment rotating steel tube ball mill (or high-pressure grinding roll) pulverizes clinker using forged steel grinding balls (20-90 mm). Gypsum is simultaneously ground to ensure molecular distribution for setting time control.",
        inputs: { materials: ["Cooled clinker nodules (95%)", "Gypsum mineral (5%)", "Optional fly ash/slag additives"], utilities: ["Internal water cooling spray"], energy: ["Electric power (30-38 kWh/t cement)"] },
        outputs: { products: ["Finished Portland Cement powder (Blaine 3200-3800 cm²/g)"], byproducts: [], waste: [] },
        typicalConditions: { "Blaine Specific Surface Area": "3200 - 3800 cm²/g", "Mill Outlet Temperature": "95 - 110 °C", "Circulating Load": "150 - 250 %" },
        chemicalReactions: ["Dehydration of gypsum must be controlled: CaSO4·2H2O -> CaSO4·0.5H2O (hemihydrate) + 1.5H2O. If mill temp >115°C, excessive dehydration causes concrete false set."],
        massBalanceDesc: "95% Clinker + 5% Gypsum = 100% Ordinary Portland Cement powder.",
        energyBalanceDesc: "Electrical power (35 kWh/t) converted into particle surface area creation (~2%) and frictional heat (~98%). Internal water spray evaporates to maintain safe operating temperature.",
        equipmentIds: ["EQ-BALL-MILL-01"],
        instruments: ["Mill ear acoustic sound sensor", "Bucket elevator motor power wattmeter", "Dynamic air separator speed tachometer", "Outlet temperature RTDs"],
        control: [
          { controlledVariable: "Mill filling degree / load", manipulatedVariable: "Clinker weigh feeder rate", sensor: "Acoustic ear sensor / Elevator power", valve: "Weigh feeder VFD", controller: "PID" },
          { controlledVariable: "Cement fineness (Blaine)", manipulatedVariable: "Dynamic separator rotor speed", sensor: "Hourly lab Blaine / Online laser diffraction", valve: "Separator VFD", controller: "PID" }
        ],
        hazards: [
          { type: "Acoustic & Dust", description: "Extreme noise levels (>105 dBA from tumbling steel balls) and caustic fine cement dust", precautions: "Acoustic insulation panels, enclosed negative-pressure dust extraction", ppe: ["Hearing protection (double earmuffs + plugs)", "P100 dust mask", "Eyewash availability"] }
        ],
        environmentalImpact: { emissions: ["Cement dust particulate"], waste: [], controlTech: ["Dedicated pulse-jet bag filters (<5 mg/Nm³)"] },
        commonProblems: ["Mill plugging or coating on grinding media (cushioning effect)", "False set in concrete caused by high grinding temperature dehydrating gypsum"],
        troubleshooting: [
          {
            id: "false-set",
            symptom: "Customer complaints of cement stiffening within 3 minutes of mixing with water without heat release",
            possibleCauses: ["Mill outlet temperature exceeded 115°C, dehydrating gypsum to soluble hemihydrate/anhydrite", "Low gypsum addition rate"],
            whatToCheckFirst: "Check mill outlet temperature logs and gypsum weigh feeder calibration.",
            diagnosticQuestions: ["Did internal water spray nozzles plug?", "Was ambient clinker feed temperature >120°C?"],
            possibleSolutions: ["Increase internal water spray injection to keep mill outlet temperature at 100-105°C", "Allow hot clinker to cool in storage dome before grinding"],
            safetyConsiderations: "Hot cement powder fluidizes like a liquid; beware of sudden rushes when opening silo discharge valves."
          }
        ],
        relatedSubjects: ["particulate-technology", "process-control", "materials"],
        nextProcessIds: []
      }
    ],
    challenges: [
      {
        id: "cem-c1",
        scenario: "You are the Shift Process Engineer. Kiln inlet O2 drops sharply to 0.4% and CO spikes to 0.45% (rapidly approaching the 0.5% ESP explosion trip limit). Simultaneously, burning zone pyrometer temperature is dropping from 1450°C to 1390°C. What is your immediate executive control action?",
        options: [
          { text: "Increase coal firing rate to arrest the falling burning zone temperature.", feedback: "DANGEROUS MISTAKE! The combustion is severely oxygen-starved (low O2, rising CO). Adding fuel will trigger a catastrophic explosion in the downstream electrostatic precipitator.", score: 0 },
          { text: "Decrease the ID fan speed to retain thermal heat within the rotary kiln.", feedback: "INCORRECT. Lowering ID fan draft reduces combustion air intake, further worsening the fuel-rich incomplete combustion and accelerating the CO spike.", score: 0 },
          { text: "Cut coal feed by 15% immediately and ramp up ID fan draft speed.", feedback: "EXCELLENT ENGINEERING DECISION! You prioritize process safety over temperature. Reducing fuel and increasing draft eliminates CO before the ESP explosive limit is reached. Once combustion is safely restored, temperature is recovered safely.", score: 100 }
        ],
        correctApproach: "Safety always supersedes production parameters. High CO with low O2 indicates incomplete combustion. The immediate action must be cutting fuel and providing excess air draft. Once the CO spike clears, burner momentum and fuel rate can be modulated to recover clinkerization temperature safely."
      },
      {
        id: "cem-c2",
        scenario: "During finish grinding in the cement ball mill, the lab reports 28-day concrete strength is down 15%, while Blaine fineness is on target at 3500 cm²/g. Chemical analysis shows free CaO is normal (<1.0%), but SO3 is 1.4% (target: 2.5%). What is the root cause and corrective action?",
        options: [
          { text: "The gypsum weigh feeder is under-dosing; recalibrate and increase gypsum proportioning.", feedback: "CORRECT! Low SO3 confirms inadequate gypsum. Gypsum not only regulates initial set but also accelerates early hydration of Alite, maximizing compressive strength development.", score: 100 },
          { text: "Increase burning zone temperature in the rotary kiln to make denser clinker.", feedback: "INCORRECT. The clinker chemistry and free lime are already normal (<1.0%), proving the issue is strictly in finish grinding additive proportioning.", score: 0 },
          { text: "Ramp up ball mill separator speed to grind the cement finer to 4200 cm²/g.", feedback: "INEFFICIENT. While increasing fineness compensates slightly, it consumes excessive electricity and does not fix the underlying sulfate deficiency.", score: 10 }
        ],
        correctApproach: "Analyze the chemical fingerprint. When free lime is acceptable but strength drops alongside low SO3, the cause is under-dosing of gypsum. Restoring the target 2.5% SO3 balance optimizes C3S hydration kinetics and restores required concrete strength."
      }
    ],
    relatedSubjects: [
      { subjectId: "thermodynamics", application: "Used to analyze the endothermic dissociation enthalpy of CaCO3 (+1782 kJ/kg) and calculate the thermal efficiency of clinker coolers and waste heat recovery (WHR) Rankine cycles." },
      { subjectId: "heat-transfer", application: "Fundamental for modeling 1450°C radiative flame heat transfer to the solid clinker bed, 5-stage cyclone convective gas-solid heat exchange, and shell refractory conduction losses." },
      { subjectId: "reaction-eng", application: "Governs solid-state and liquid-melt sintering kinetics for synthesizing Alite (C3S) from Belite and lime, determining required kiln retention time (20-30 min)." },
      { subjectId: "particulate-technology", application: "Controls all comminution (crushing, vertical roller milling, ball milling) accounting for 65% of plant electricity, utilizing Bond's Work Index and dynamic air classification." },
      { subjectId: "process-control", application: "Applies feedback and cascade PID loops for kiln draft pressure, burning zone temperature optical pyrometry, and weigh feeder gravimetric proportioning." },
      { subjectId: "process-safety", application: "Manages explosion mitigation of pulverized coal storage, electrostatic precipitator CO trip interlocks, and high-temperature radiant burn prevention." }
    ]
  },

  // 2. FERTILIZER INDUSTRY (AMMONIA / UREA)
  {
    id: "fertilizer",
    name: "Fertilizer (Ammonia/Urea)",
    description: "The synthetic nitrogen fertilizer industry converts natural gas, atmospheric air, and water into synthesis gas (H2 + N2) via Steam Methane Reforming, converts syngas into anhydrous Ammonia via the Haber-Bosch process (150-200 bar), and subsequently reacts NH3 with captured CO2 to synthesize solid Urea fertilizer.",
    icon: "Wheat",
    rawMaterials: [
      { name: "Natural Gas (Methane CH4)", purpose: "Primary chemical source of hydrogen (H2) and process combustion fuel", properties: "Clean hydrocarbon gas, flammable, sulfur-treated", entryPoint: "Feed Desulfurization Hydrotreater" },
      { name: "Atmospheric Air", purpose: "Supplies stoichiometric nitrogen (N2) for ammonia synthesis and oxygen for secondary reforming", properties: "Filtered, compressed atmospheric air (78% N2, 21% O2)", entryPoint: "Secondary Reformer Air Compressor" },
      { name: "Demineralized Water / Steam", purpose: "Reactant for reforming (SMR) and water-gas shift reactions; boiler feedwater", properties: "Ultra-pure demineralized water (conductivity <0.1 µS/cm)", entryPoint: "Primary Reformer Steam Mixer" },
      { name: "Carbon Dioxide (CO2)", purpose: "Co-reactant with liquid ammonia to synthesize urea (NH2CONH2)", properties: "High-purity gas captured from syngas decarbonization", entryPoint: "Urea Reactor CO2 Compressor" }
    ],
    products: [
      { name: "Anhydrous Liquid Ammonia (NH3)", purpose: "Direct chemical fertilizer and foundational building block for all nitrogen compounds", productionRoute: "Catalytic Haber-Bosch synthesis loop at 180 bar and 450°C over promoted iron catalyst" },
      { name: "Urea Granules / Prills (46% Nitrogen)", purpose: "World's most widely applied solid nitrogen fertilizer with highest nutrient density", productionRoute: "Two-step high pressure synthesis (carbamate formation and dehydration) followed by prilling tower" },
      { name: "Ammonium Nitrate (NH4NO3)", purpose: "High-solubility nitrogen fertilizer for specialized agricultural horticulture", productionRoute: "Neutralization reaction between gaseous ammonia and nitric acid" }
    ],
    roles: [
      {
        title: "Lead Ammonia Process Engineer",
        responsibilities: ["Optimize Steam-to-Carbon ratio on primary reformer to prevent catalyst coking", "Supervise synthesis loop purge rate to control inert argon/methane buildup", "Monitor methanator outlet CO/CO2 slip to protect synthesis catalyst"],
        skills: ["Reaction Kinetics", "Thermodynamics", "Aspen Plus / HYSYS Simulation"],
        typicalProblems: ["Catalyst poisoning from sulfur breakthrough", "Compressor anti-surge valve oscillation", "High methane slip leaving secondary reformer"]
      },
      {
        title: "Process Control & Instrumentation Specialist",
        responsibilities: ["Tune multi-variable predictive control (MPC) loops on primary reformer burners", "Maintain anti-surge control algorithms on high-pressure syngas compressors", "Manage SIL-3 safety instrumented systems (SIS) on high-pressure ammonia loops"],
        skills: ["Advanced Process Control", "Compressor Dynamics", "Triconex Safety Systems"],
        typicalProblems: ["Thermocouple drift on high-temperature reformer tubes", "Control valve cavitation on carbamate letdown"]
      },
      {
        title: "HSE & Ammonia Process Safety Engineer",
        responsibilities: ["Manage toxic ammonia gas detection grid and automatic water deluge monitors", "Lead Quantitative Risk Assessments (QRA) for high-pressure synthesis islands", "Supervise relief valve certification on 200 bar ammonia equipment"],
        skills: ["HAZOP / LOPA Leadership", "Dispersion Modeling (ALOHA/PHAST)", "Emergency Response"],
        typicalProblems: ["Atmospheric vent relief valve weeping", "Corrosion monitoring under insulation on cold ammonia tanks"]
      }
    ],
    processes: [
      {
        id: "desulfurization",
        name: "Feed Gas Hydrodesulfurization",
        purpose: "Remove poisonous organic sulfur compounds from natural gas to <0.05 ppm to protect nickel reforming catalysts.",
        workingPrinciple: "Natural gas is mixed with hydrogen and passed over a Cobalt-Molybdenum (CoMo) catalyst at 350°C to hydrogenate organic sulfur into H2S, which is subsequently chemisorbed onto a Zinc Oxide (ZnO) guard bed.",
        inputs: { materials: ["Natural gas", "Recycle hydrogen"], utilities: [], energy: ["Feed preheat fuel (350°C)"] },
        outputs: { products: ["Ultra-pure desulfurized methane (<0.05 ppm sulfur)"], byproducts: [], waste: ["Spent zinc sulfide (ZnS) bed"] },
        typicalConditions: { "Operating Temperature": "350 - 380 °C", "Operating Pressure": "35 - 40 bar", "Outlet Sulfur": "< 0.05 ppm" },
        chemicalReactions: [
          "Hydrogenation: R-SH + H2 -> RH + H2S",
          "Zinc Oxide Absorption: H2S + ZnO -> ZnS + H2O"
        ],
        massBalanceDesc: "All natural gas passes through; sulfur is chemically captured as solid ZnS in the vessel.",
        energyBalanceDesc: "Feed is preheated via convection coils; hydrogenation reaction is slightly exothermic.",
        equipmentIds: ["EQ-PRIMARY-REFORMER"],
        instruments: ["Online lead acetate sulfur colorimetric analyzer", "Inlet/outlet thermocouples"],
        control: [
          { controlledVariable: "Hydrotreater inlet temperature (360°C)", manipulatedVariable: "Convection coil bypass damper", sensor: "Thermocouple", valve: "Pneumatic damper", controller: "PID" }
        ],
        hazards: [
          { type: "Chemical & Flammability", description: "High-pressure methane and toxic hydrogen sulfide gas", precautions: "H2S gas detectors, nitrogen purge during catalyst skimming", ppe: ["FR clothing", "H2S personal monitor", "Safety glasses"] }
        ],
        environmentalImpact: { emissions: ["Zero atmospheric emissions during normal operations"], waste: ["Spent non-hazardous zinc sulfide catalyst sent for zinc reclamation"], controlTech: ["Closed-loop chemisorption"] },
        commonProblems: ["Sulfur breakthrough blinding primary reformer catalyst"],
        troubleshooting: [
          {
            id: "s-breakthrough",
            symptom: "Lead acetate tape analyzer alarms indicating >0.2 ppm sulfur downstream of ZnO vessel",
            possibleCauses: ["Zinc oxide bed saturation / exhaustion", "Low operating temperature causing H2S slip", "High mercaptan content in pipeline gas"],
            whatToCheckFirst: "Verify operating temperature is above 350°C.",
            diagnosticQuestions: ["How many operating hours has the current ZnO bed logged?"],
            possibleSolutions: ["Switch feed to standby parallel ZnO vessel immediately", "Increase preheat temperature to restore absorption kinetics"],
            safetyConsiderations: "Do not vent sour gas to atmosphere."
          }
        ],
        relatedSubjects: ["reaction-eng", "thermodynamics"],
        nextProcessIds: ["primary-reforming"]
      },
      {
        id: "primary-reforming",
        name: "Primary Steam Methane Reforming (SMR)",
        purpose: "Convert natural gas and steam into synthesis gas (H2, CO, CO2) across nickel catalyst tubes inside a radiant firebox.",
        workingPrinciple: "Desulfurized natural gas is mixed with superheated steam (S/C ratio ~3.0) and passed downward through hundreds of nickel-alloy tubes suspended inside a top-fired firebox at 800°C.",
        inputs: { materials: ["Desulfurized methane", "Superheated steam"], utilities: ["Fuel gas", "Combustion air"], energy: ["Radiant heat duty (150-250 MW)"] },
        outputs: { products: ["Raw synthesis gas (H2, CO, CO2, unreacted CH4)"], byproducts: [], waste: ["Flue gas to waste heat recovery"] },
        typicalConditions: { "Tube Outlet Temperature": "790 - 820 °C", "Operating Pressure": "32 - 38 bar", "Steam-to-Carbon Ratio": "2.8 - 3.2", "Methane Slip": "8 - 11 %" },
        chemicalReactions: [
          "Reforming: CH4 + H2O <-> CO + 3H2 (ΔH = +206 kJ/mol - Endothermic)",
          "Water-Gas Shift: CO + H2O <-> CO2 + H2 (ΔH = -41 kJ/mol - Exothermic)"
        ],
        massBalanceDesc: "1 mole CH4 + 1 mole H2O yields 4 moles of product syngas (expansion reaction).",
        energyBalanceDesc: "High thermal heat input required; 50% of plant fuel gas is burned in the firebox to supply reforming enthalpy.",
        equipmentIds: ["EQ-PRIMARY-REFORMER"],
        instruments: ["Tube skin infrared pyrometers", "Outlet chromatograph for methane slip", "Burner fuel header pressure gauges"],
        control: [
          { controlledVariable: "Reformer tube outlet temperature (800°C)", manipulatedVariable: "Fuel gas control valve", sensor: "Thermocouple (TE-201)", valve: "Fuel control valve", controller: "Cascade PID" },
          { controlledVariable: "Steam-to-Carbon ratio (3.0)", manipulatedVariable: "Process steam flow valve", sensor: "Coriolis mass flow meters", valve: "Steam control valve", controller: "Ratio Controller" }
        ],
        hazards: [
          { type: "Thermal & Explosion", description: "Extreme firebox radiant temperatures (1000°C) and tube rupture risks", precautions: "Optical flame scanners, high tube skin temperature alarms, purge cycle prior to lighting burners", ppe: ["FR coveralls", "Heat-resistant gloves", "Gas monitor"] }
        ],
        environmentalImpact: { emissions: ["Combustion flue gas CO2", "Thermal NOx"], waste: [], controlTech: ["Low-NOx burners", "Selective Catalytic Reduction (SCR) in convection section"] },
        commonProblems: ["Carbon deposition (coking) deactivating catalyst", "Reformer tube creep deformation due to local hot spots"],
        troubleshooting: [
          {
            id: "tube-hot-spot",
            symptom: "Infrared thermal inspection reveals bright glowing patch (>930°C) on single reformer tube",
            possibleCauses: ["Catalyst fragmentation causing localized void or bridging", "Coking from low Steam-to-Carbon ratio", "Burner flame impingement on tube wall"],
            whatToCheckFirst: "Inspect adjacent burner flame pattern through firebox sight glass.",
            diagnosticQuestions: ["Is the burner flame licking the tube?", "Has S/C ratio dipped below 2.8?"],
            possibleSolutions: ["Trim adjacent burner fuel valve to eliminate flame impingement", "Increase steam-to-carbon ratio slightly to gasify carbon deposits via steam"],
            safetyConsiderations: "Exceeding maximum tube metallurgy temperature causes rapid creep rupture and hydrogen fire."
          }
        ],
        relatedSubjects: ["reaction-eng", "thermodynamics", "heat-transfer", "process-control"],
        nextProcessIds: ["secondary-reforming"]
      },
      {
        id: "secondary-reforming",
        name: "Secondary Autothermal Reforming",
        purpose: "Complete methane conversion and introduce the required stoichiometric nitrogen (N2) for ammonia synthesis.",
        workingPrinciple: "Primary syngas enters a refractory-lined vessel where compressed atmospheric air is introduced through a specialized burner. Partial internal combustion raises gas temperature to 1200°C, providing heat for residual methane to reform across a nickel catalyst bed.",
        inputs: { materials: ["Primary reformer syngas (800°C)", "Compressed air (78% N2, 21% O2)"], utilities: [], energy: ["Internal combustion"] },
        outputs: { products: ["Raw synthesis gas with ~0.3% CH4 and stoichiometric H2:N2 ratio ~3:1"], byproducts: [], waste: [] },
        typicalConditions: { "Outlet Temperature": "980 - 1020 °C", "Operating Pressure": "30 - 35 bar", "Methane Slip": "< 0.5 %", "H2:N2 Ratio": "2.95 - 3.05" },
        chemicalReactions: [
          "Combustion: 2H2 + O2 -> 2H2O (Highly Exothermic)",
          "Reforming: CH4 + H2O <-> CO + 3H2 (Across nickel catalyst bed)"
        ],
        massBalanceDesc: "Oxygen in air is completely consumed; nitrogen passes through inertly, achieving stoichiometric 3:1 H2:N2 ratio.",
        energyBalanceDesc: "Internal combustion of hydrogen generates high temperature (1200°C), driving residual methane reforming without external fuel firing.",
        equipmentIds: ["EQ-PRIMARY-REFORMER"],
        instruments: ["Process gas chromatograph measuring H2:N2 ratio and CH4 slip", "Refractory skin thermocouples"],
        control: [
          { controlledVariable: "H2 to N2 molar ratio (3.0:1)", manipulatedVariable: "Process air compressor discharge flow valve", sensor: "Online gas chromatograph", valve: "Air control valve", controller: "Ratio Controller" }
        ],
        hazards: [
          { type: "Thermal & Pressure", description: "Internal temperatures >1200°C and pressurized hydrogen", precautions: "Refractory lining integrity monitoring, water jacket cooling on shell", ppe: ["FR clothing", "Safety glasses"] }
        ],
        environmentalImpact: { emissions: ["None (closed continuous process)"], waste: [], controlTech: ["Downstream waste heat boiler recovers 100 bar superheated steam"] },
        commonProblems: ["Air burner nozzle tip erosion or thermal damage", "Methane slip increase"],
        troubleshooting: [
          {
            id: "high-ch4-sec",
            symptom: "Methane slip leaving secondary reformer increases above 0.8%",
            possibleCauses: ["Air flow rate too low (insufficient combustion temperature)", "Secondary catalyst bed settling or channeling"],
            whatToCheckFirst: "Check air-to-gas ratio and secondary reformer outlet temperature.",
            diagnosticQuestions: ["Is outlet temperature below 980°C?"],
            possibleSolutions: ["Increase air compressor rate slightly to raise bed temperature and drive reforming equilibrium"],
            safetyConsiderations: "Ensure air increase does not throw off the downstream 3:1 H2:N2 ratio."
          }
        ],
        relatedSubjects: ["reaction-eng", "thermodynamics", "fluid-mechanics"],
        nextProcessIds: ["shift-conversion"]
      },
      {
        id: "shift-conversion",
        name: "Water-Gas Shift & Methanation",
        purpose: "Maximize hydrogen yield by converting CO to CO2, followed by complete removal of carbon oxides which poison ammonia catalyst.",
        workingPrinciple: "Syngas passes through a High-Temperature Shift (HTS) reactor over iron-chromium catalyst at 350°C, then a Low-Temperature Shift (LTS) reactor over copper-zinc catalyst at 210°C. CO2 is absorbed, and trace remaining CO/CO2 (<5 ppm) is converted back to inert methane in a methanator.",
        inputs: { materials: ["Syngas containing CO and steam"], utilities: ["Boiler feedwater cooling"], energy: [] },
        outputs: { products: ["Ultra-pure syngas (H2 + N2 with <2 ppm CO/CO2)"], byproducts: ["High purity CO2 sent to Urea plant"], waste: [] },
        typicalConditions: { "HTS Inlet Temperature": "350 - 370 °C", "LTS Inlet Temperature": "200 - 220 °C", "Methanator Inlet Temperature": "300 - 320 °C", "Outlet CO + CO2": "< 2.0 ppm" },
        chemicalReactions: [
          "Water-Gas Shift: CO + H2O <-> CO2 + H2 (Exothermic - ΔH = -41 kJ/mol)",
          "Methanation: CO + 3H2 -> CH4 + H2O & CO2 + 4H2 -> CH4 + 2H2O (Highly Exothermic)"
        ],
        massBalanceDesc: "CO is converted to CO2, generating additional H2; CO2 is subsequently absorbed in an MDEA/Benfield wash tower.",
        energyBalanceDesc: "Exothermic reaction heat is recovered into high-pressure boiler feedwater economizers.",
        equipmentIds: ["EQ-PRIMARY-REFORMER"],
        instruments: ["Infrared CO/CO2 trace analyzers (0-10 ppm range)", "Multi-point catalyst bed thermocouples"],
        control: [
          { controlledVariable: "LTS catalyst bed inlet temperature (210°C)", manipulatedVariable: "Inter-stage cooler bypass valve", sensor: "Thermocouple", valve: "3-way bypass valve", controller: "PID" }
        ],
        hazards: [
          { type: "Thermal Runaway", description: "Methanation of high CO2/CO breakthrough produces violent exothermic temperature spikes (>500°C)", precautions: "Automated emergency nitrogen trip and syngas feed isolation valve", ppe: ["Standard PPE", "Gas monitor"] }
        ],
        environmentalImpact: { emissions: ["CO2 is captured at 99% purity and transferred via pipeline to adjacent Urea plant"], waste: [], controlTech: ["Amine / MDEA absorption unit"] },
        commonProblems: ["LTS copper catalyst sintering from temperature spikes", "CO breakthrough into methanator"],
        troubleshooting: [
          {
            id: "methanator-runaway",
            symptom: "Rapid temperature spike (>400°C) across methanator catalyst bed",
            possibleCauses: ["CO2 absorber failure slipping >0.5% CO2 into methanator feed"],
            whatToCheckFirst: "Inspect CO2 absorber top gas analyzer immediately.",
            diagnosticQuestions: ["Did the amine circulation pump trip?"],
            possibleSolutions: ["Emergency shutdown: trip syngas feed valve instantly and purge methanator with nitrogen to prevent vessel destruction"],
            safetyConsiderations: "Methanation runaway can melt vessel internals within minutes if unmitigated."
          }
        ],
        relatedSubjects: ["reaction-eng", "thermodynamics", "separation"],
        nextProcessIds: ["ammonia-synthesis"]
      },
      {
        id: "ammonia-synthesis",
        name: "Haber-Bosch Ammonia Synthesis Loop",
        purpose: "Compress pure syngas to 180 bar and synthesize anhydrous liquid ammonia across promoted iron catalyst.",
        workingPrinciple: "Make-up syngas and recycle gas are compressed to 180 bar by a multi-stage centrifugal compressor and enter the radial-flow ammonia converter. Gas reacts over promoted iron at 400-500°C. Product gas is chilled using mechanical ammonia refrigeration to condense liquid NH3, while unreacted gas is recycled.",
        inputs: { materials: ["Purified syngas (3:1 H2:N2)", "Recycle syngas"], utilities: ["Liquid ammonia refrigeration (-33°C)", "Cooling water"], energy: ["Steam turbine compressor power (20-35 MW)"] },
        outputs: { products: ["Anhydrous liquid ammonia (99.8% NH3 at -33°C or high pressure)"], byproducts: [], waste: ["Loop purge gas (sent to hydrogen recovery / fuel header)"] },
        typicalConditions: { "Synthesis Loop Pressure": "150 - 200 bar", "Converter Bed Inlet Temperature": "380 - 410 °C", "Converter Bed Peak Temperature": "480 - 520 °C", "Single-Pass Conversion": "16 - 20 %", "Inert Level (CH4 + Ar)": "10 - 13 %" },
        chemicalReactions: [
          "Ammonia Synthesis: N2 + 3H2 <-> 2NH3 (ΔH = -92 kJ/mol - Highly Exothermic at high pressure)"
        ],
        massBalanceDesc: "Single pass conversion is 18%; unreacted gas is recycled continuously. Purge stream (3-5%) removes accumulating inert Argon and Methane.",
        energyBalanceDesc: "High exothermic reaction heat generates high-pressure steam in the waste heat boiler downstream of converter; product chilled to -33°C.",
        equipmentIds: ["EQ-AMMONIA-CONVERTER"],
        instruments: ["Multi-stage compressor vibration sensors", "High pressure differential pressure cells", "Gas chromatograph measuring loop NH3 and inerts"],
        control: [
          { controlledVariable: "Synthesis loop pressure (180 bar)", manipulatedVariable: "Syngas compressor governor steam valve", sensor: "High pressure transmitter (PT-501)", valve: "Steam turbine throttle valve", controller: "PID / Anti-Surge" },
          { controlledVariable: "Loop inert gas concentration (12%)", manipulatedVariable: "Loop purge gas control valve", sensor: "Gas chromatograph", valve: "Purge control valve", controller: "PID" }
        ],
        hazards: [
          { type: "Pressure & Toxicity", description: "Extreme pressure (180 bar) and toxic, suffocating, flammable ammonia gas", precautions: "Ammonia gas detectors, automated water spray curtains, blast-proof control room", ppe: ["Ammonia respirator canister mask", "Full emergency SCBA suit on standby", "Chemical goggles"] }
        ],
        environmentalImpact: { emissions: ["Ammonia vapor leaks"], waste: [], controlTech: ["Emergency water absorption scrubber and flare system"] },
        commonProblems: ["Catalyst poisoning from oxygen/water slip", "Syngas compressor surge during pressure swings"],
        troubleshooting: [
          {
            id: "comp-surge",
            symptom: "Rapid oscillating vibration and flow reversal on syngas centrifugal compressor",
            possibleCauses: ["Downstream loop pressure surge", "Low feed mass flow rate entering compressor eye", "Anti-surge valve malfunction"],
            whatToCheckFirst: "Verify anti-surge recycle valves are open.",
            diagnosticQuestions: ["Did the converter trip or close its block valve?"],
            possibleSolutions: ["Fully open compressor anti-surge recycle valve to restore forward mass flow immediately"],
            safetyConsiderations: "Compressor surge causes severe axial thrust bearing destruction within seconds."
          }
        ],
        relatedSubjects: ["reaction-eng", "thermodynamics", "fluid-mechanics", "process-control"],
        nextProcessIds: ["urea-synthesis"]
      },
      {
        id: "urea-synthesis",
        name: "Urea Synthesis & Prilling",
        purpose: "React liquid ammonia with captured carbon dioxide at 140 bar to produce solid urea fertilizer granules.",
        workingPrinciple: "Liquid ammonia and CO2 gas are compressed to 140 bar and react inside a high-pressure pool reactor. Ammonium carbamate forms rapidly (exothermic) and slowly dehydrates into urea (endothermic). The concentrated urea melt is sprayed down a 100 m tall prilling tower against rising air to form solid spheres.",
        inputs: { materials: ["Liquid anhydrous ammonia (NH3)", "Gaseous carbon dioxide (CO2)"], utilities: ["Steam (low & medium pressure)", "Cooling water"], energy: ["Electric power for pumps and prill tower fans"] },
        outputs: { products: ["Solid Urea prills/granules (46% Nitrogen)"], byproducts: [], waste: ["Process condensate (treated in hydrolyzer-stripper)"] },
        typicalConditions: { "Synthesis Reactor Pressure": "140 - 150 bar", "Reactor Temperature": "180 - 190 °C", "Ammonia-to-Carbon (N/C) Ratio": "2.9 - 3.2", "Prill Tower Height": "80 - 110 m" },
        chemicalReactions: [
          "Step 1 (Fast, Exothermic): 2NH3 + CO2 <-> NH2COONH4 (Ammonium Carbamate) (ΔH = -117 kJ/mol)",
          "Step 2 (Slow, Endothermic): NH2COONH4 <-> NH2CONH2 (Urea) + H2O (ΔH = +15 kJ/mol)"
        ],
        massBalanceDesc: "2 moles NH3 + 1 mole CO2 -> 1 mole Urea + 1 mole H2O. Water is evaporated in a vacuum concentration system.",
        energyBalanceDesc: "Carbamate formation heat is recovered in high-pressure carbamate condenser to generate low-pressure steam utilized in downstream vacuum evaporators.",
        equipmentIds: ["EQ-AMMONIA-CONVERTER"],
        instruments: ["Coriolis mass flow meters for NH3 and CO2", "Reactor density nuclear gauges", "Prill tower baghouse differential pressure gauges"],
        control: [
          { controlledVariable: "Reactor NH3-to-CO2 ratio (N/C = 3.0)", manipulatedVariable: "Liquid ammonia pump flow", sensor: "Coriolis mass flow meters", valve: "High pressure ammonia control valve", controller: "Ratio Controller" }
        ],
        hazards: [
          { type: "Corrosion & Pressure", description: "Hot ammonium carbamate solution is violently corrosive to standard steels at 140 bar", precautions: "Special urea-grade stainless steel (316L Urea Grade / Safurex) and continuous passivating oxygen/air injection", ppe: ["Chemical apron", "Face shield", "Rubber boots"] }
        ],
        environmentalImpact: { emissions: ["Urea particulate dust and ammonia odor from prilling tower top"], waste: [], controlTech: ["Prill tower wet scrubbers and mist eliminators"] },
        commonProblems: ["Biuret formation (toxic to plant roots) due to excessive temperature in vacuum evaporators", "Severe carbamate corrosion if passivating air injection fails"],
        troubleshooting: [
          {
            id: "high-biuret",
            symptom: "Lab quality test shows final urea prills contain >1.2% biuret (spec: <1.0%)",
            possibleCauses: ["Excessive residence time or temperature (>135°C) in vacuum evaporation stage", "Low ammonia partial pressure in concentrator"],
            whatToCheckFirst: "Inspect vacuum evaporator temperature and steam control valves.",
            diagnosticQuestions: ["Is the vacuum system maintaining <0.05 bar absolute pressure?"],
            possibleSolutions: ["Reduce heating steam pressure to lower melt temperature to 130°C", "Increase throughput to minimize melt residence time"],
            safetyConsiderations: "Biuret causes phytotoxic leaf scorch when applied as fertilizer."
          }
        ],
        relatedSubjects: ["reaction-eng", "thermodynamics", "mass-transfer", "materials"],
        nextProcessIds: []
      }
    ],
    challenges: [
      {
        id: "fert-c1",
        scenario: "You are the Ammonia Synthesis Loop Lead Engineer. A sudden cooling water temperature surge causes ammonia chiller condenser pressure to rise. As a result, synthesis loop pressure climbs to 195 bar (design trip is 200 bar) and loop circulating gas temperature increases. What is your immediate corrective intervention?",
        options: [
          { text: "Increase make-up syngas feed to force higher production and absorb the pressure.", feedback: "DANGEROUS ERROR! Adding more feed will push the already elevated loop pressure over the 200 bar emergency trip limit.", score: 0 },
          { text: "Open the loop purge gas valve to reduce pressure and vent inerts, and trim compressor throughput.", feedback: "EXCELLENT RESPONSE! Increasing purge vents non-condensable gas and relieves loop pressure while trimming compressor prevents over-pressure tripping.", score: 100 },
          { text: "Trip the syngas compressor immediately on manual shutdown.", feedback: "TOO DRASTIC. Tripping the main compressor causes massive thermal shock to the converter and flares millions of dollars of syngas. Purge throttling stabilizes the loop first.", score: 20 }
        ],
        correctApproach: "High loop pressure during condensing bottlenecks must be managed by increasing loop purge rate and modulating syngas compressor speed. This avoids an emergency trip while protecting synthesis loop metallurgy."
      }
    ],
    relatedSubjects: [
      { subjectId: "reaction-eng", application: "Essential for modeling the complex catalytic kinetics of Steam Methane Reforming (endothermic), Water-Gas Shift, and Haber-Bosch synthesis (equilibrium-limited exothermic)." },
      { subjectId: "thermodynamics", application: "Calculates phase equilibria for high pressure gas-liquid flash separation, refrigeration loops (-33°C NH3 chillers), and fugacity coefficients at 200 bar." },
      { subjectId: "fluid-mechanics", application: "Governs centrifugal syngas compressor aerodynamics, anti-surge dynamic modeling, and high-pressure supercritical piping flow." },
      { subjectId: "mass-transfer", application: "Critical for the design and operation of CO2 absorption towers (MDEA/Benfield) and urea prilling tower droplet convective cooling." },
      { subjectId: "process-control", application: "Employs ratio controllers (N/C and S/C ratios), compressor anti-surge override loops, and multi-variable predictive control on reformers." },
      { subjectId: "process-safety", application: "Manages toxic ammonia dispersion risk, high-temperature hydrogen attack (HTHA Nelson curves), and runaway methanation reaction trip interlocks." }
    ]
  },

  // 3. PETROLEUM REFINING (OIL & GAS)
  {
    id: "oil-gas",
    name: "Oil & Gas Refinery",
    description: "Petroleum refineries convert crude oil into high-value fuels (LPG, gasoline, jet fuel, diesel) and petrochemical feedstocks through physical desalting, atmospheric and vacuum fractional distillation, fluid catalytic cracking, hydrotreating, and catalytic reforming.",
    icon: "Fuel",
    rawMaterials: [
      { name: "Crude Oil (Heavy / Light Sweet)", purpose: "Primary complex hydrocarbon mixture feedstock", properties: "Viscous liquid, API gravity 25-42°, contains sulfur, salts, and heavy metals", entryPoint: "Desalter Unit" },
      { name: "Hydrogen Gas (H2)", purpose: "Used in hydrotreaters and hydrocrackers to remove sulfur, nitrogen, and saturate aromatics", properties: "High purity gas (>95% H2)", entryPoint: "Hydrotreating Unit" },
      { name: "Wash Water", purpose: "Dissolves inorganic salts (NaCl, CaCl2, MgCl2) in the crude desalter", properties: "Demineralized or low-salinity stripped water", entryPoint: "Desalter Mix Valve" }
    ],
    products: [
      { name: "Ultra-Low Sulfur Diesel (ULSD)", purpose: "High-cetane commercial transportation fuel with <10 ppm sulfur", productionRoute: "Atmospheric gas oil hydrotreated over CoMo catalyst at 40 bar" },
      { name: "Motor Gasoline (95/98 Octane)", purpose: "High-octane spark-ignition engine fuel", productionRoute: "Blending FCC gasoline, alkylate, and catalytic reformate" },
      { name: "Aviation Jet Fuel (Jet A-1 / Kerosene)", purpose: "Commercial aircraft turbine fuel with strict freeze point (<-47°C)", productionRoute: "Atmospheric crude distillation side-stream treated with Merox mercaptan oxidation" },
      { name: "Liquefied Petroleum Gas (LPG)", purpose: "Bottled heating and cooking fuel (propane and butane)", productionRoute: "Overhead fractionator gas recovery and de-ethanizer/de-propanizer columns" }
    ],
    roles: [
      {
        title: "Crude Distillation Unit (CDU) Process Engineer",
        responsibilities: ["Optimize atmospheric column side-draw cut temperatures to meet product D86 boiling curve specs", "Control overhead reflux drum temperature and accumulator water draw-off", "Minimize furnace firing duty through preheat train pinch optimization"],
        skills: ["Fractional Distillation", "Thermodynamics", "Crude Assay Analysis"],
        typicalProblems: ["Column tray flooding", "Overhead condenser corrosion from HCl/NH4Cl", "Vacuum column bottom coking"]
      },
      {
        title: "Hydroprocessing & Catalytic Reforming Engineer",
        responsibilities: ["Monitor catalyst bed weighted average bed temperature (WABT) to maintain 10 ppm sulfur", "Manage hydrogen-to-hydrocarbon ratio on reactors to prevent catalyst coking", "Supervise continuous catalyst regeneration (CCR) loop"],
        skills: ["Heterogeneous Catalysis", "Hydrogen Networks", "Kinetics"],
        typicalProblems: ["Hydrotreater reactor bed pressure drop buildup", "Reformer catalyst chloriding imbalance"]
      }
    ],
    processes: [
      {
        id: "desalting",
        name: "Crude Oil Desalting",
        purpose: "Remove water-soluble salts (NaCl, MgCl2) and suspended solids from crude oil before distillation.",
        workingPrinciple: "Crude is heated to 120°C, mixed with 3-5% wash water through an emulsifying mix valve, and enters a vessel with high-voltage AC electric grids (15-25 kV). The electric field polarizes and coalesces water droplets, allowing them to settle by gravity.",
        inputs: { materials: ["Raw crude oil", "Wash water (3-5 vol%)"], utilities: ["Demulsifier chemical"], energy: ["Electric power for high voltage transformers"] },
        outputs: { products: ["Desalted crude oil (<3 PTB salt, <0.2% BS&W)"], byproducts: [], waste: ["Oily brine wastewater to treatment plant"] },
        typicalConditions: { "Operating Temperature": "115 - 135 °C", "Vessel Pressure": "10 - 15 bar (prevents vaporization)", "Grid Voltage": "16 - 24 kV AC", "Salt Content": "< 3 lbs / 1000 bbl" },
        chemicalReactions: ["Physical electrostatic coalescence and phase separation; no chemical reaction."],
        massBalanceDesc: "Crude + Wash water in = Desalted crude out + Desalter brine effluent out.",
        energyBalanceDesc: "Crude preheated via heat exchanger train recovering heat from hot distillation side-streams.",
        equipmentIds: ["EQ-CENTRIFUGAL-PUMP-01"],
        instruments: ["Interface level probe", "Mix valve differential pressure gauge", "Transformer primary amp meter"],
        control: [
          { controlledVariable: "Water-oil interface level", manipulatedVariable: "Brine water discharge valve", sensor: "Capacitance / Radiometric level probe", valve: "Control valve", controller: "PID" }
        ],
        hazards: [
          { type: "Electrical & Flammable", description: "High voltage electricity inside a vessel filled with flammable crude at 130°C", precautions: "Vessel pressure maintained above crude bubble point, explosion-proof transformer bushings", ppe: ["FR coveralls", "Safety glasses", "Rubber sole boots"] }
        ],
        environmentalImpact: { emissions: ["None (closed vessel)"], waste: ["Phenol- and salt-rich oily brine effluent"], controlTech: ["Induced gas flotation (IGF) and biological wastewater treatment plant"] },
        commonProblems: ["Rag layer formation (stable emulsion) causing grid electrical shorting", "High salt carryover to crude column causing severe HCl corrosion"],
        troubleshooting: [
          {
            id: "desalter-short",
            symptom: "Desalter transformer amperage spikes and electrical grid automatically trips",
            possibleCauses: ["Water-oil interface level rose into the electric grid", "Heavy rag layer emulsion buildup due to insufficient chemical demulsifier"],
            whatToCheckFirst: "Check water-oil interface level gauge reading.",
            diagnosticQuestions: ["Is the brine water draw-off control valve stuck shut?"],
            possibleSolutions: ["Manually open brine dump valve to lower interface below grids", "Increase chemical demulsifier injection rate"],
            safetyConsiderations: "Do not energize grid if vessel is not completely liquid-full."
          }
        ],
        relatedSubjects: ["fluid-mechanics", "separation"],
        nextProcessIds: ["cdu"]
      },
      {
        id: "cdu",
        name: "Atmospheric Crude Distillation (CDU)",
        purpose: "Fractionate desalted crude oil into boiling-point cuts: LPG, light naphtha, heavy naphtha, kerosene, diesel, and atmospheric residue.",
        workingPrinciple: "Crude is heated to 360°C in a fired furnace and enters the column flash zone. Lighter vapors ascend through 40-50 trays, condensing into side-streams stripped with superheated steam. Heavy unvaporized crude falls to the bottom as atmospheric residue.",
        inputs: { materials: ["Desalted crude oil"], utilities: ["Stripping steam (3.5 bar)"], energy: ["Crude fired heater furnace (50-120 MW)"] },
        outputs: { products: ["Overhead Naphtha / LPG (<150°C)", "Kerosene / Jet fuel cut (150-230°C)", "Light Gas Oil / Diesel (230-350°C)", "Atmospheric Residue (>350°C)"], byproducts: [], waste: ["Sour water condensate"] },
        typicalConditions: { "Flash Zone Temperature": "350 - 370 °C", "Overhead Pressure": "1.2 - 1.8 bar", "Overhead Temperature": "100 - 120 °C", "Bottoms Residue Temp": "340 - 360 °C" },
        chemicalReactions: ["Physical continuous fractional distillation; thermal cracking must be minimized by keeping temperature <370°C."],
        massBalanceDesc: "100% crude feed = Overhead + Kerosene + Diesel + Atmospheric Residue (100% material conservation).",
        energyBalanceDesc: "Furnace provides latent and sensible heat; overhead condenser and pumparound heat exchangers recover thermal energy into cold crude preheat.",
        equipmentIds: ["EQ-DISTILLATION-COL-01", "EQ-HEAT-EXCHANGER-01"],
        instruments: ["Tray temperature transmitters", "Overhead pressure controller", "Differential pressure cell", "Reflux drum level gauge"],
        control: [
          { controlledVariable: "Overhead column top temperature (110°C)", manipulatedVariable: "Overhead liquid reflux pump flow", sensor: "Thermocouple (TE-301)", valve: "Reflux control valve", controller: "PID" },
          { controlledVariable: "Flash zone crude temperature (360°C)", manipulatedVariable: "Crude furnace fuel gas valve", sensor: "Thermocouple (TE-302)", valve: "Fuel control valve", controller: "Cascade PID" }
        ],
        hazards: [
          { type: "Thermal & Fire", description: "Massive inventory of volatile flammable hydrocarbons above their auto-ignition temperature", precautions: "Emergency blowdown to flare, steam snuffing on furnace firebox", ppe: ["FR coveralls", "H2S gas monitor", "Escape respirator"] }
        ],
        environmentalImpact: { emissions: ["Combustion flue gas from fired heater", "Fugitive VOCs"], waste: ["Sour water containing H2S and NH3"], controlTech: ["Sour water stripper tower (SWS)", "Fired heater Low-NOx burners"] },
        commonProblems: ["Overhead condenser ammonium chloride (NH4Cl) salt fouling and corrosion", "Column tray flooding during high throughput"],
        troubleshooting: [
          {
            id: "cdu-flood",
            symptom: "Rapid increase in column differential pressure with kerosene color turning black",
            possibleCauses: ["Excessive stripping steam or reboiler duty", "High crude throughput exceeding downcomer capacity", "Water slug in crude feed expanding 1600x as steam"],
            whatToCheckFirst: "Inspect column delta-P and desalter water carryover log.",
            diagnosticQuestions: ["Did the crude transfer pump rate surge?"],
            possibleSolutions: ["Reduce fired heater outlet temperature by 5°C immediately", "Reduce crude feed rate by 10% to clear hydraulic flooding"],
            safetyConsiderations: "Water slugs in crude can cause catastrophic tower overpressurization and tray collapse."
          }
        ],
        relatedSubjects: ["separation", "thermodynamics", "heat-transfer", "process-control"],
        nextProcessIds: ["hydrotreating"]
      },
      {
        id: "hydrotreating",
        name: "Diesel & Naphtha Hydrotreating (HDT)",
        purpose: "Remove sulfur, nitrogen, and heavy metals from distillation cuts using hydrogen to meet ultra-low sulfur environmental standards (<10 ppm).",
        workingPrinciple: "Distillate oil is mixed with high-pressure hydrogen, heated to 340°C, and passed through a fixed-bed reactor packed with Cobalt-Molybdenum (CoMo) or Nickel-Molybdenum (NiMo) catalyst. Sulfur is converted to gaseous H2S and stripped.",
        inputs: { materials: ["Straight-run diesel / gas oil", "Make-up and recycle hydrogen gas"], utilities: ["Wash water for salt washing"], energy: ["Charge heater furnace (10-25 MW)"] },
        outputs: { products: ["Ultra-low sulfur diesel (<10 ppm S)", "Sour off-gas (H2S + H2 sent to Amine unit)"], byproducts: [], waste: ["Sour wash water"] },
        typicalConditions: { "Reactor Temperature": "330 - 370 °C", "Reactor Pressure": "40 - 70 bar", "Hydrogen-to-Oil Ratio": "250 - 400 Nm³/m³", "Product Sulfur": "< 10 ppm" },
        chemicalReactions: [
          "Hydrodesulfurization (HDS): Thiophene (C4H4S) + 4H2 -> Butane (C4H10) + H2S",
          "Hydrodenitrogenation (HDN): Pyridine (C5H5N) + 5H2 -> Pentane (C5H12) + NH3",
          "Olefin Saturation: R-CH=CH2 + H2 -> R-CH2-CH3"
        ],
        massBalanceDesc: "Liquid hydrocarbon in + Hydrogen gas in = Desulfurized liquid out + H2S gas out.",
        energyBalanceDesc: "Exothermic reaction heat increases temperature across the catalyst bed by 15-30°C (quench hydrogen used for cooling).",
        equipmentIds: ["EQ-CENTRIFUGAL-PUMP-01", "EQ-HEAT-EXCHANGER-01"],
        instruments: ["Multi-point bed thermocouple lances", "High-pressure separator level gauge", "Recycle gas H2 purity analyzer"],
        control: [
          { controlledVariable: "Weighted Average Bed Temperature (WABT = 345°C)", manipulatedVariable: "Charge furnace fuel firing rate", sensor: "Bed thermocouples", valve: "Fuel gas valve", controller: "Cascade PID" }
        ],
        hazards: [
          { type: "High Pressure Hydrogen & H2S", description: "Hot high-pressure hydrogen (60 bar) and lethal toxic H2S gas", precautions: "Fixed H2S detector array, automated depressurization valves (Depressuring to Flare)", ppe: ["FR coveralls", "Personal H2S detector", "SCBA on standby"] }
        ],
        environmentalImpact: { emissions: ["H2S off-gas converted to elemental sulfur in Claus Sulfur Recovery Unit (SRU)"], waste: [], controlTech: ["Amine gas treating unit (MDEA)", "Claus sulfur plant (99.8% recovery)"] },
        commonProblems: ["Catalyst bed pressure drop buildup from particulate gum scale", "Hydrogen compressor trip"],
        troubleshooting: [
          {
            id: "hdt-delta-p",
            symptom: "Continuous rise in reactor differential pressure reaching alarm limit (>3.5 bar)",
            possibleCauses: ["Fines and scale deposition in top catalyst bed layer", "Diolefins polymerizing into gums on catalyst"],
            whatToCheckFirst: "Check feed filter basket differential pressure.",
            diagnosticQuestions: ["Has cracked feed from FCC or coker been blended into straight-run diesel?"],
            possibleSolutions: ["Increase recycle hydrogen quench rate to moderate bed temperature", "Plan top catalyst bed skimming during turnaround"],
            safetyConsiderations: "Excessive reactor delta-P can crush catalyst internals and channel hydrogen."
          }
        ],
        relatedSubjects: ["reaction-eng", "thermodynamics", "process-safety"],
        nextProcessIds: []
      }
    ],
    challenges: [
      {
        id: "ref-c1",
        scenario: "You are the CDU Panel Operator. Crude desalter brine carryover alarms trip, and column overhead accumulator sour water pH plummets from 6.8 to 3.2. Overhead condenser tube corrosion rate jumps tenfold. What is your immediate diagnostic response?",
        options: [
          { text: "Increase overhead neutralizing amine injection and check desalter electrical grid status.", feedback: "EXCELLENT! Falling sour water pH indicates chloride salts (MgCl2/CaCl2) bypassed the desalter and hydrolyzed into acidic HCl. Neutralizing amine immediately protects condenser tubes, while fixing desalter stops the root salt slip.", score: 100 },
          { text: "Reduce crude feed rate by 50% and wait for pH to stabilize.", feedback: "INEFFICIENT. Unnecessary production cut that does not address the active acid attack on overhead condensers.", score: 20 },
          { text: "Turn off stripping steam to the bottom of the crude tower.", feedback: "WRONG. Turning off stripping steam ruins bottoms residue flash separation and does not fix overhead HCl corrosion.", score: 0 }
        ],
        correctApproach: "Desalter salt carryover causes MgCl2 and CaCl2 to hydrolyze at >120°C into hydrochloric acid (HCl) gas. The acid condenses in the overhead system, plunging sour water pH to <3.5. Immediate intervention requires increasing neutralizing amine / filming inhibitor injection and troubleshooting desalter interface level and grid power."
      }
    ],
    relatedSubjects: [
      { subjectId: "separation", application: "The heart of petroleum refining: atmospheric multi-cut distillation, vacuum fractionation, and absorption stripping." },
      { subjectId: "thermodynamics", application: "Used for multicomponent Vapor-Liquid Equilibrium (VLE), Peng-Robinson equation of state, and crude assay distillation curves." },
      { subjectId: "reaction-eng", application: "Essential for heterogeneous catalytic hydroprocessing, fluid catalytic cracking kinetics, and catalyst deactivation modeling." },
      { subjectId: "heat-transfer", application: "Critical for the crude preheat exchanger train (Pinch analysis) and radiant/convective crude fired heater design." },
      { subjectId: "process-control", application: "Implements advanced regulatory control, side-stream draw cascade loops, and furnace draft cross-limiting control." },
      { subjectId: "process-safety", application: "Mitigates high-temperature hydrocarbon fire risks, toxic H2S release, and overpressurization relief systems to flare." }
    ]
  },

  // 4. CHEMICAL MANUFACTURING (SULFURIC ACID / CHLOR-ALKALI)
  {
    id: "chemical-mfg",
    name: "Chemical Manufacturing",
    description: "Production of high-volume bulk industrial chemicals such as Sulfuric Acid (H2SO4 via the catalytic Contact Process), Chlor-Alkali (Cl2, NaOH, H2 via membrane cell electrolysis), and Nitric Acid.",
    icon: "Factory",
    rawMaterials: [
      { name: "Elemental Sulfur (S)", purpose: "Feedstock combusted to generate sulfur dioxide (SO2)", properties: "Solid bright yellow prills or molten liquid at 135°C", entryPoint: "Sulfur Melting Pit & Burner" },
      { name: "Dry Atmospheric Air", purpose: "Supplies oxygen for sulfur combustion and SO2 catalytic oxidation", properties: "Dehydrated using 96% H2SO4 drying tower", entryPoint: "Air Drying Tower" },
      { name: "Process Water", purpose: "Reactant for absorbing SO3 into sulfuric acid to form 98.5% H2SO4", properties: "Demineralized water", entryPoint: "Absorption Tower Dilution Pump" }
    ],
    products: [
      { name: "Sulfuric Acid (98.5% H2SO4)", purpose: "World's most widely consumed industrial chemical for phosphate fertilizer manufacturing, metal leaching, and chemical synthesis", productionRoute: "Contact process: Sulfur burning -> Catalytic V2O5 converter (SO2 -> SO3) -> 98.5% absorption tower" },
      { name: "Oleum (Fuming Sulfuric Acid / Pyrosulfuric)", purpose: "Sulfonating agent in organic synthesis, dyes, and explosives", productionRoute: "Absorption of SO3 vapor into concentrated sulfuric acid" }
    ],
    roles: [
      {
        title: "Contact Process Acid Engineer",
        responsibilities: ["Maintain 4-bed catalytic converter temperatures (420-600°C) for >99.7% SO2 conversion", "Control absorption tower acid concentration at exactly 98.5% to prevent acid mist", "Maximize steam production from exothermic sulfur combustion"],
        skills: ["Heterogeneous Catalysis", "Thermodynamics", "Acid Corrosion Metallurgy"],
        typicalProblems: ["Catalyst bed sulfation and pressure drop buildup", "Acid mist breakthrough", "Corrosion of pump tanks"]
      }
    ],
    processes: [
      {
        id: "sulfur-burning",
        name: "Sulfur Combustion & SO2 Generation",
        purpose: "Combust molten elemental sulfur with dry air to generate high-concentration sulfur dioxide (SO2) gas and high-pressure steam.",
        workingPrinciple: "Molten sulfur at 140°C is atomized into a refractory combustion furnace with dried air. Sulfur burns violently at 1050°C, producing 10-12% SO2 gas. Heat is recovered in a waste heat boiler to generate 60 bar superheated steam.",
        inputs: { materials: ["Molten sulfur", "Dry air (moisture <0.1 g/m³)"], utilities: [], energy: ["Self-sustaining combustion heat"] },
        outputs: { products: ["Sulfur dioxide gas mixture (~11% SO2, 10% O2, 79% N2 at 420°C)"], byproducts: [], waste: ["60 bar superheated steam"] },
        typicalConditions: { "Furnace Temperature": "1000 - 1150 °C", "SO2 Concentration": "10.5 - 11.8 %", "Steam Generation": "1.2 tons steam / ton acid" },
        chemicalReactions: ["Combustion: S(l) + O2(g) -> SO2(g) (ΔH = -297 kJ/mol - Highly Exothermic)"],
        massBalanceDesc: "1 ton of elemental sulfur yields approximately 3.0 tons of 100% equivalent H2SO4.",
        energyBalanceDesc: "Massive heat generation recovered completely into high-pressure steam turbines; plant is net electricity exporter.",
        equipmentIds: ["EQ-CENTRIFUGAL-PUMP-01"],
        instruments: ["Optical SO2 gas analyzer", "Waste heat boiler steam drum level gauge", "Furnace pyrometer"],
        control: [
          { controlledVariable: "SO2 gas concentration leaving furnace (11.5%)", manipulatedVariable: "Molten sulfur pump flow", sensor: "Infrared SO2 analyzer", valve: "Sulfur control valve", controller: "Ratio PID" }
        ],
        hazards: [
          { type: "Thermal & Toxic Gas", description: "Extreme combustion heat and toxic, suffocating SO2 gas", precautions: "Negative pressure draft maintained by main blower, SO2 gas monitors", ppe: ["Sulfur dioxide gas mask", "Acid-resistant boots", "Safety glasses"] }
        ],
        environmentalImpact: { emissions: ["Zero emissions during normal operation (closed continuous loop)"], waste: [], controlTech: ["Waste heat recovery boiler"] },
        commonProblems: ["Sulfur burner atomization nozzle plugging", "Tube leaks in waste heat boiler"],
        troubleshooting: [
          {
            id: "burner-plug",
            symptom: "Furnace temperature drops and sulfur feed pressure rises rapidly",
            possibleCauses: ["Solid ash impurities plugging molten sulfur spray nozzle", "Sulfur line steam tracing failure causing solidification"],
            whatToCheckFirst: "Check sulfur feed temperature (must be 135-145°C where viscosity is lowest).",
            diagnosticQuestions: ["Did steam tracing pressure drop?"],
            possibleSolutions: ["Switch to standby sulfur burner nozzle and purge jammed gun with high-pressure steam"],
            safetyConsiderations: "Wear protective face shield when handling molten sulfur lines."
          }
        ],
        relatedSubjects: ["thermodynamics", "reaction-eng", "heat-transfer"],
        nextProcessIds: ["so2-conversion"]
      },
      {
        id: "so2-conversion",
        name: "Catalytic SO2 Oxidation (4-Bed Converter)",
        purpose: "Oxidize sulfur dioxide (SO2) to sulfur trioxide (SO3) over a Cesium-promoted Vanadium Pentoxide (V2O5) catalyst.",
        workingPrinciple: "Gas passes through 4 sequential catalyst beds with inter-stage cooling. Because SO2 + 0.5 O2 <-> SO3 is reversible and exothermic, temperature must decrease from bed 1 (600°C) to bed 4 (420°C) to push thermodynamic equilibrium conversion to >99.7%.",
        inputs: { materials: ["11.5% SO2 gas from waste heat boiler"], utilities: [], energy: ["Heat recovered in gas-gas exchangers"] },
        outputs: { products: ["Sulfur trioxide (SO3) gas sent to absorption towers"], byproducts: [], waste: [] },
        typicalConditions: { "Bed 1 Inlet / Outlet Temp": "420°C / 600°C", "Bed 4 Inlet / Outlet Temp": "410°C / 430°C", "Overall Conversion": "> 99.7 %", "Pressure Drop": "60 - 90 mbar" },
        chemicalReactions: ["Oxidation: SO2 + 0.5 O2 <-> SO3 (ΔH = -99 kJ/mol - Reversible Exothermic)"],
        massBalanceDesc: "SO2 and O2 convert to SO3 with a 1.5 -> 1.0 mole contraction.",
        energyBalanceDesc: "Exothermic reaction heat is removed between catalyst beds using gas-gas heat exchangers to reheat returning cool gas.",
        equipmentIds: ["EQ-PRIMARY-REFORMER"],
        instruments: ["Inlet and outlet thermocouples on each catalyst bed", "Differential pressure gauge across converter", "CEMS stack SO2 analyzer"],
        control: [
          { controlledVariable: "Bed 1 inlet gas temperature (420°C)", manipulatedVariable: "Gas-gas heat exchanger bypass damper", sensor: "Thermocouple (TE-401)", valve: "Pneumatic butterfly damper", controller: "PID" }
        ],
        hazards: [
          { type: "Thermal & Toxic", description: "Corrosive SO2 and SO3 gas at high temperatures (600°C)", precautions: "High-integrity stainless steel construction (304H), continuous stack CEMS monitoring", ppe: ["Acid gas respirator", "Thermal gloves"] }
        ],
        environmentalImpact: { emissions: ["Trace residual unreacted SO2 (<250 ppm)"], waste: [], controlTech: ["Double Contact Double Absorption (DCDA) layout achieving >99.7% conversion", "Tail gas caustic scrubber"] },
        commonProblems: ["Catalyst bed sulfation due to inlet temperature falling below 400°C strike temperature"],
        troubleshooting: [
          {
            id: "cat-strike",
            symptom: "Bed 1 temperature dropping and overall SO2 stack emission rising",
            possibleCauses: ["Gas inlet temperature fell below catalyst activation threshold (410°C)", "Dust blinding top of bed"],
            whatToCheckFirst: "Inspect Bed 1 inlet thermocouple reading.",
            diagnosticQuestions: ["Did upstream waste heat boiler over-cool the gas?"],
            possibleSolutions: ["Bypass portion of gas cooler to restore inlet gas temperature to 425°C to re-ignite catalytic reaction"],
            safetyConsiderations: "Do not vent unreacted SO2 gas to atmosphere."
          }
        ],
        relatedSubjects: ["reaction-eng", "thermodynamics", "heat-transfer"],
        nextProcessIds: ["so3-absorption"]
      },
      {
        id: "so3-absorption",
        name: "SO3 Absorption & Acid Circulation",
        purpose: "Absorb sulfur trioxide gas into concentrated 98.5% sulfuric acid to produce commercial product.",
        workingPrinciple: "SO3 gas cannot be absorbed directly into water because the reaction is so violent it creates an uncollectible sulfuric acid fog. Instead, SO3 is absorbed into circulating 98.5% H2SO4 inside a packed tower with ceramic saddles. Water is added to the circulating acid to maintain exact 98.5% concentration.",
        inputs: { materials: ["SO3 gas from converter", "Circulating 98.5% H2SO4", "Dilution demineralized water"], utilities: ["Cooling water for acid plate coolers"], energy: [] },
        outputs: { products: ["98.5% Commercial Sulfuric Acid (H2SO4)"], byproducts: [], waste: ["Exhaust stack nitrogen gas"] },
        typicalConditions: { "Circulating Acid Concentration": "98.3 - 98.8 %", "Acid Inlet Temperature": "75 - 85 °C", "Acid Outlet Temperature": "100 - 115 °C" },
        chemicalReactions: [
          "Absorption: SO3(g) + H2SO4(l) -> H2S2O7(l) (Pyrosulfuric acid / Oleum)",
          "Dilution: H2S2O7(l) + H2O(l) -> 2 H2SO4(l) (ΔH = -132 kJ/mol - Highly Exothermic)"
        ],
        massBalanceDesc: "SO3 gas + Dilution water = 98.5% Sulfuric Acid product pumped to storage.",
        energyBalanceDesc: "Exothermic hydration heat is removed by dedicated anodic-protected plate heat exchangers with cooling water.",
        equipmentIds: ["EQ-DISTILLATION-COL-01", "EQ-HEAT-EXCHANGER-01"],
        instruments: ["Conductivity acid concentration transmitters (98.5%)", "Acid cooler outlet thermocouples", "Stack photometric mist opacity detector"],
        control: [
          { controlledVariable: "Circulating acid concentration (98.5%)", manipulatedVariable: "Demineralized dilution water flow", sensor: "Conductivity / Sonic velocity concentration meter", valve: "Corrosion-resistant control valve", controller: "PID" }
        ],
        hazards: [
          { type: "Corrosion & Chemical Burns", description: "Extremely corrosive 98.5% sulfuric acid at 100°C causes instantaneous severe chemical burns", precautions: "Acid-proof brick linings, PTFE-lined piping, safety shower stations every 15 meters", ppe: ["Full acid suit (Tychem)", "Face shield", "Heavy PVC acid gloves", "Rubber boots"] }
        ],
        environmentalImpact: { emissions: ["Acid mist droplet carryover"], waste: [], controlTech: ["High-efficiency candle mist eliminators (HEME) in tower top capturing >99.9% of droplets"] },
        commonProblems: ["Acid concentration dipping below 98.0% causing catastrophic corrosion of carbon steel piping"],
        troubleshooting: [
          {
            id: "acid-corrosion",
            symptom: "Acid concentration meter reading 97.2% with cloudy grey pump tank color",
            possibleCauses: ["Excess dilution water flow into pump tank", "Water leak in anodically protected acid cooler"],
            whatToCheckFirst: "Verify dilution water control valve position and check acid color for dissolved iron.",
            diagnosticQuestions: ["Is acid concentration below the 98.0% passive protective oxide threshold?"],
            possibleSolutions: ["Throttle dilution water valve immediately; pump fresh 98.5% acid into tank to restore concentration above 98.3%"],
            safetyConsiderations: "Sulfuric acid below 98.0% rapidly corrodes carbon steel, generating explosive hydrogen gas (H2)."
          }
        ],
        relatedSubjects: ["mass-transfer", "thermodynamics", "materials", "process-safety"],
        nextProcessIds: []
      }
    ],
    challenges: [
      {
        id: "chem-c1",
        scenario: "You are the Sulfuric Acid Plant Supervisor. The drying tower acid concentration drops from 98.5% to 95.0% due to a faulty water valve. Simultaneously, the main SO2 converter blower shows surging amps. Why is this critical, and what is your immediate response?",
        options: [
          { text: "Increase blower speed to compensate for the pressure surge.", feedback: "DANGEROUS! Lower acid concentration means wet atmospheric air enters the sulfur furnace, forming extremely corrosive acid mist that destroys blower impellers and converter catalyst.", score: 0 },
          { text: "Cut dilution water to the drying tower, verify acid concentration >98%, and drain any condensed acid from blower suction.", feedback: "EXCELLENT! At 95% acid, water vapor slips into the process gas. Restoring 98.5% acid ensures complete air drying and protects downstream machinery.", score: 100 }
        ],
        correctApproach: "The drying tower must operate at exactly 98.5% H2SO4 to achieve near-zero water vapor pressure. If concentration slips, moisture enters the sulfur furnace and forms sulfuric acid mist that corrodes the main gas blower and poisons the vanadium catalyst."
      }
    ],
    relatedSubjects: [
      { subjectId: "reaction-eng", application: "Models multi-bed catalytic converter kinetics for SO2 oxidation over V2O5 catalyst with equilibrium Le Chatelier temperature constraints." },
      { subjectId: "mass-transfer", application: "Governs counter-current packed tower absorption of SO3 gas into concentrated 98.5% sulfuric acid across ceramic saddle packing." },
      { subjectId: "thermodynamics", application: "Analyzes highly exothermic sulfur combustion (-297 kJ/mol) and acid hydration enthalpy to maximize high-pressure steam power export." },
      { subjectId: "materials", application: "Critical for managing corrosion: austenitic stainless steels, silicon-iron alloys, and anodic protection of acid cooler heat exchangers." }
    ]
  },

  // 5. PHARMACEUTICALS
  {
    id: "pharmaceutical",
    name: "Pharmaceuticals",
    description: "High-purity batch and continuous manufacturing of Active Pharmaceutical Ingredients (APIs) and finished oral solid dosage formulations under strict cGMP regulations, utilizing jacketed stirred reactors, anti-solvent crystallization, filter-drying, and tablet compression.",
    icon: "Pill",
    rawMaterials: [
      { name: "Starting Chemical Intermediates", purpose: "Precursor organic molecules for multi-step chemical synthesis of API", properties: "High purity chemical reagents", entryPoint: "Glass-Lined Batch Reactor" },
      { name: "Organic Solvents (Acetone, Ethanol, DCM)", purpose: "Reaction medium and anti-solvent for controlled crystallization", properties: "High purity, flammable, anhydrous", entryPoint: "Solvent Manifold Station" },
      { name: "Excipients (Lactose, Microcrystalline Cellulose)", purpose: "Non-active binder, filler, and disintegrant for final tablet dosage", properties: "Pharmaceutical USP/EP grade powders", entryPoint: "Fluid Bed Granulation" }
    ],
    products: [
      { name: "Active Pharmaceutical Ingredient (API Crystals)", purpose: "Therapeutically active drug substance conforming to pharmacopeial monographs", productionRoute: "Multi-stage organic synthesis -> Anti-solvent crystallization -> Agitated filter drying" },
      { name: "Finished Tablet Formulations", purpose: "Precise oral dosage units for clinical and consumer administration", productionRoute: "API wet granulation -> Fluid bed drying -> High-speed rotary tablet compression" }
    ],
    roles: [
      {
        title: "API Process Development Engineer",
        responsibilities: ["Scale up batch organic synthesis from 20 L laboratory to 5000 L commercial glass-lined reactors", "Optimize seed crystal loading and cooling rate in crystallization to control Crystal Size Distribution (CSD)", "Validate cGMP Clean-in-Place (CIP) and Solvent Recovery operations"],
        skills: ["Organic Synthesis Scale-Up", "Crystallization Kinetics", "cGMP Regulations"],
        typicalProblems: ["Uncontrolled nucleation forming fine unfilterable crystals", "Thermal degradation of heat-sensitive API molecules"]
      }
    ],
    processes: [
      {
        id: "api-synthesis",
        name: "Batch Chemical API Synthesis",
        purpose: "Synthesize target drug molecule via controlled liquid-phase organic reactions in a sanitary glass-lined reactor.",
        workingPrinciple: "Reactants and dry solvents are charged under inert nitrogen atmosphere into a jacketed stirred tank reactor (CSTR/batch). An automated thermal control unit circulates heat transfer fluid through the jacket to maintain precise reaction temperature.",
        inputs: { materials: ["Intermediates", "Solvents", "Catalysts/Reagents"], utilities: ["Nitrogen gas blanket", "Thermal fluid (-20°C to 150°C)"], energy: ["Electric agitation motor"] },
        outputs: { products: ["Crude API reaction solution"], byproducts: ["Spent reagents", "Reaction salts"], waste: ["Waste solvent to recovery column"] },
        typicalConditions: { "Reaction Temperature": "-15 to 80 °C (±0.5°C control)", "Agitator Speed": "60 - 150 RPM", "Vessel Pressure": "0.2 - 0.5 bar N2 blanket" },
        chemicalReactions: ["Multi-step organic synthesis (e.g. nucleophilic substitution, coupling, or hydrogenation)."],
        massBalanceDesc: "Batch material reconciliation required by cGMP: 100% accountability of all charged raw materials and solvents.",
        energyBalanceDesc: "Jacket thermal fluid removes exothermic heat of reaction to prevent product thermal degradation.",
        equipmentIds: ["EQ-PRIMARY-REFORMER"],
        instruments: ["In-situ PAT infrared probe (ReactIR)", "Jacket & process PT100 temperature sensors", "Torque transmitter"],
        control: [
          { controlledVariable: "Process batch temperature (±0.5°C)", manipulatedVariable: "Jacket thermal fluid 3-way mixing valve", sensor: "PT100 RTD", valve: "Thermal fluid control valve", controller: "Cascade PID" }
        ],
        hazards: [
          { type: "Flammability & Toxicity", description: "Flammable organic solvent vapors (Zone 1 hazardous area) and potent drug exposure", precautions: "Nitrogen inerting blanket (O2 < 2%), explosion-proof motors, closed containment isolators", ppe: ["Anti-static cleanroom suit", "PAPR powered air-purifying respirator", "Double nitrile gloves"] }
        ],
        environmentalImpact: { emissions: ["Solvent VOC vapor emissions"], waste: ["Hazardous liquid solvent waste"], controlTech: ["Cryogenic solvent condensation unit (-60°C)", "Thermal oxidizer"] },
        commonProblems: ["Exothermic runaway during reagent dosing", "Product crystallization on cold reactor wall"],
        troubleshooting: [
          {
            id: "exo-runaway",
            symptom: "Batch temperature increases rapidly despite maximum jacket cooling",
            possibleCauses: ["Reagent dosing rate too fast", "Agitator failure causing local accumulation of unreacted reagent"],
            whatToCheckFirst: "Stop reagent addition pump immediately and verify agitator rotation.",
            diagnosticQuestions: ["Is the thermal fluid chiller operating?"],
            possibleSolutions: ["Inject emergency quench solvent or dump thermal fluid to emergency cold loop"],
            safetyConsiderations: "Reactor burst disc will rupture if pressure exceeds vessel rating (6 bar)."
          }
        ],
        relatedSubjects: ["reaction-eng", "thermodynamics", "process-control"],
        nextProcessIds: ["crystallization-filtration"]
      },
      {
        id: "crystallization-filtration",
        name: "Crystallization & Agitated Filter-Drying",
        purpose: "Purify API by controlled crystallization and separate solid crystals using an agitated Nutsche filter-dryer.",
        workingPrinciple: "Anti-solvent is added slowly to the reaction solution at a controlled cooling rate, inducing supersaturation. Pure API nucleates and grows on seed crystals. The slurry is transferred to an Agitated Nutsche Filter-Dryer (ANFD) where it is filtered under pressure, washed with solvent, and vacuum dried.",
        inputs: { materials: ["Crude API solution", "Anti-solvent", "Seed crystals", "Wash solvent"], utilities: ["Vacuum (-0.95 bar)", "Nitrogen pressure (2 bar)"], energy: ["Thermal fluid to ANFD heated jacket and agitator"] },
        outputs: { products: ["Pure dry API powder (residual solvent <500 ppm, ICH limits)"], byproducts: [], waste: ["Mother liquor sent to solvent recovery distillation"] },
        typicalConditions: { "Crystallization Temperature": "50°C cooled to 5°C at 0.5°C/min", "Filter Pressure": "1.5 - 2.5 bar N2", "Dryer Vacuum": "< 10 mbar", "Residual Solvent": "< 500 ppm" },
        chemicalReactions: ["Physical crystallization and solid-liquid phase separation."],
        massBalanceDesc: "Solute dissolved in liquid -> Solid crystalline cake on filter mesh + Mother liquor filtrate.",
        energyBalanceDesc: "Heated filter jacket and heated rotating agitator transfer vacuum conductive heat to vaporize residual solvent.",
        equipmentIds: ["EQ-DISTILLATION-COL-01"],
        instruments: ["Focused Beam Reflectance Measurement (FBRM) probe", "Particle vision measurement (PVM)", "Vacuum gauges"],
        control: [
          { controlledVariable: "Crystallizer cooling trajectory", manipulatedVariable: "Jacket thermal fluid temperature ramp", sensor: "PT100 probe", valve: "Thermal fluid control valve", controller: "Recipe Profile Controller" }
        ],
        hazards: [
          { type: "Chemical & Occupational", description: "Exposure to highly potent API dust (OEL < 1 µg/m³)", precautions: "Contained split-butterfly discharge valves, glovebox isolators", ppe: ["Full cleanroom bunny suit", "PAPR respirator", "Nitrile gloves"] }
        ],
        environmentalImpact: { emissions: ["Vacuum pump exhaust VOCs"], waste: ["Organic mother liquor filtrate"], controlTech: ["Cryogenic condenser and carbon adsorption beds"] },
        commonProblems: ["Formation of needle-shaped fines causing slow filtration time", "Solvent occlusion inside crystals"],
        troubleshooting: [
          {
            id: "slow-filtration",
            symptom: "Filtration time through Nutsche filter increases from 1 hour to 12 hours",
            possibleCauses: ["Secondary nucleation created massive amounts of sub-micron fines", "Filter cloth blinded with fine particles"],
            whatToCheckFirst: "Inspect crystal morphology via in-line microscope camera.",
            diagnosticQuestions: ["Was seed crystal added at the correct supersaturation level?"],
            possibleSolutions: ["Implement temperature cycling (heat slurry by 5°C to dissolve fines, then cool slowly to grow large prismatic crystals)"],
            safetyConsiderations: "Do not exceed maximum allowable pressure on filter vessel."
          }
        ],
        relatedSubjects: ["separation", "mass-transfer", "thermodynamics"],
        nextProcessIds: []
      }
    ],
    challenges: [
      {
        id: "pharm-c1",
        scenario: "During an API crystallization scale-up from 10 L to 2000 L, the analytical lab reports that final product contains high amounts of an unwanted amorphous polymorph with poor stability. Agitation speed in the 2000 L vessel was set to identical RPM as the 10 L bench scale. What is the scale-up error and how do you fix it?",
        options: [
          { text: "Identical RPM on a larger vessel causes excessive tip speed and massive shear, destroying metastable crystal seeds; scale up by constant power-per-unit-volume (P/V) instead.", feedback: "CORRECT! Scaling by constant RPM drastically increases impeller tip speed (v = πDN) and shear, inducing uncontrolled primary nucleation of the wrong polymorph. Scaling by constant P/V or tip speed preserves crystal form.", score: 100 },
          { text: "Increase the cooling rate to freeze the amorphous polymorph.", feedback: "INCORRECT. Faster cooling increases supersaturation and actually promotes amorphous precipitation.", score: 0 }
        ],
        correctApproach: "Mixing scale-up in pharmaceutical crystallization must never be done by constant RPM. Constant RPM leads to huge impeller tip speeds and localized shear that shatters delicate crystalline nuclei. Proper scale-up maintains constant Power per unit volume (P/V) or constant tip speed."
      }
    ],
    relatedSubjects: [
      { subjectId: "reaction-eng", application: "Applied to batch reactor kinetics, scale-up criteria (mixing Reynolds, power number), and preventing thermal runaways." },
      { subjectId: "separation", application: "Governs anti-solvent crystallization supersaturation curves, solid-liquid Nutsche filtration, and vacuum drying." },
      { subjectId: "thermodynamics", application: "Calculates solid-liquid solubility curves, eutectic points, and polymorph stability enthalpies." },
      { subjectId: "process-control", application: "Utilizes Process Analytical Technology (PAT), in-situ FTIR, and recipe-based temperature ramp cascade control." }
    ]
  },

  // 6. PETROCHEMICALS
  {
    id: "petrochemical",
    name: "Petrochemicals",
    description: "Thermal steam cracking of hydrocarbon feedstocks (ethane, propane, naphtha) into basic chemical building blocks: Ethylene, Propylene, Butadiene, and BTX Aromatics.",
    icon: "Activity",
    rawMaterials: [
      { name: "Naphtha / Ethane Gas", purpose: "Cracking feedstock", properties: "Aliphatic hydrocarbons", entryPoint: "Cracking Furnace" }
    ],
    products: [
      { name: "Polymer-Grade Ethylene (99.95%)", purpose: "Monomer for polyethylene plastics", productionRoute: "Steam cracking and cryogenic distillation" },
      { name: "Propylene", purpose: "Monomer for polypropylene and acrylonitrile", productionRoute: "Steam cracking fractionation" }
    ],
    roles: [
      {
        title: "Steam Cracker Operations Engineer",
        responsibilities: ["Optimize coil outlet temperature (850°C) to maximize ethylene yield", "Monitor furnace decoking cycles", "Control cryogenic distillation train"],
        skills: ["Thermal Cracking", "Cryogenics", "Process Safety"],
        typicalProblems: ["Coil coking", "Acetylene hydrogenation runaway"]
      }
    ],
    processes: [
      {
        id: "steam-cracking",
        name: "Thermal Steam Cracking",
        purpose: "Crack saturated hydrocarbons into olefins (ethylene, propylene) at 850°C with milliseconds of residence time.",
        workingPrinciple: "Hydrocarbon feed is diluted with steam and passes through radiant furnace coils at 800-850°C with residence time <0.2 seconds, followed by instant oil/water quenching to freeze radical reactions.",
        inputs: { materials: ["Ethane / Naphtha", "Steam"], utilities: [], energy: ["Fuel gas"] },
        outputs: { products: ["Cracked gas (Ethylene, Propylene, Methane, H2)"], byproducts: ["Pyrolysis gasoline"], waste: [] },
        typicalConditions: { "Coil Outlet Temp (COT)": "820 - 860 °C", "Residence Time": "0.1 - 0.25 s", "Steam-to-Oil Ratio": "0.4 - 0.6" },
        chemicalReactions: ["C2H6 -> C2H4 + H2 (Thermal free-radical cracking)"],
        massBalanceDesc: "High severity cracking yields ~30-35% Ethylene and 15% Propylene from naphtha.",
        energyBalanceDesc: "Extremely endothermic; instant quench boiler generates 120 bar steam.",
        equipmentIds: ["EQ-PRIMARY-REFORMER"],
        instruments: ["Optical coil pyrometers", "Effluent gas chromatograph"],
        control: [
          { controlledVariable: "Coil Outlet Temperature (840°C)", manipulatedVariable: "Burner fuel gas valve", sensor: "Thermocouple", valve: "Control valve", controller: "PID" }
        ],
        hazards: [
          { type: "Thermal & Explosive", description: "Severe fire and explosion risk from high-pressure olefins at 850°C", precautions: "Steam snuffing, emergency isolation valves", ppe: ["FR clothing", "Gas detector"] }
        ],
        environmentalImpact: { emissions: ["CO2, NOx from cracking furnaces"], waste: [], controlTech: ["Low-NOx burners", "Selective Catalytic Reduction (SCR)"] },
        commonProblems: ["Heavy coke deposition inside radiant coils"],
        troubleshooting: [
          {
            id: "coke-buildup",
            symptom: "Tube skin temperature rises toward metallurgical limit (>1050°C)",
            possibleCauses: ["Coke layer insulating the inside of the tube"],
            whatToCheckFirst: "Check coil differential pressure and skin temperature logs.",
            diagnosticQuestions: ["How many days since last steam-air decoke?"],
            possibleSolutions: ["Take furnace offline and perform steam-air decoking cycle"],
            safetyConsiderations: "Do not exceed maximum tube skin temperature during decoking."
          }
        ],
        relatedSubjects: ["reaction-eng", "thermodynamics", "heat-transfer"],
        nextProcessIds: []
      }
    ],
    challenges: [],
    relatedSubjects: [
      { subjectId: "reaction-eng", application: "Thermal free-radical pyrolysis kinetics and ultra-short residence time plug flow reactor modeling." },
      { subjectId: "separation", application: "Cryogenic multi-stage fractionation: demethanizer, deethanizer, C2 and C3 splitters." }
    ]
  },

  // Remaining industries (7-15) structured with clear engineering profiles
  {
    id: "polymer",
    name: "Polymer Production",
    description: "Polymerization of monomers into commodity and engineering plastics: Polyethylene (HDPE/LLDPE via gas-phase fluidized bed), Polypropylene, and Polystyrene.",
    icon: "Box",
    rawMaterials: [{ name: "Ethylene / Propylene Monomer", purpose: "Polymer backbone", properties: "High purity gas (>99.95%)", entryPoint: "Fluidized Bed Reactor" }],
    products: [{ name: "High Density Polyethylene (HDPE Pellets)", purpose: "Pipes, containers, geomembranes", productionRoute: "Ziegler-Natta catalytic gas-phase polymerization" }],
    roles: [{ title: "Polymerization Process Engineer", responsibilities: ["Control reactor temperature to prevent polymer melting/sheeting", "Monitor Melt Flow Index (MFI) and density"], skills: ["Polymer Kinetics", "Fluidized Beds"], typicalProblems: ["Reactor wall sheeting", "Electrostatic discharge"] }],
    processes: [], challenges: [], relatedSubjects: [{ subjectId: "reaction-eng", application: "Coordination polymerization kinetics in fluidized bed reactors." }]
  },
  {
    id: "power",
    name: "Power Generation",
    description: "Thermal, combined-cycle gas turbine (CCGT), and nuclear power plants converting chemical and thermal energy into electricity via Rankine and Brayton thermodynamic cycles.",
    icon: "Zap",
    rawMaterials: [{ name: "Natural Gas / Coal", purpose: "Thermal fuel", properties: "High heating value", entryPoint: "Combustion Chamber / Boiler" }],
    products: [{ name: "High Voltage Electricity", purpose: "Industrial and municipal grid power", productionRoute: "Gas and steam turbine driven generators" }],
    roles: [{ title: "Thermal Performance Engineer", responsibilities: ["Calculate plant heat rate and thermal efficiency", "Optimize boiler excess air and condenser vacuum"], skills: ["Thermodynamics", "Heat Transfer"], typicalProblems: ["Condenser vacuum loss", "Boiler tube corrosion"] }],
    processes: [], challenges: [], relatedSubjects: [{ subjectId: "thermodynamics", application: "Rankine and Brayton cycle heat rate and isentropic turbine efficiencies." }]
  },
  {
    id: "water",
    name: "Water & Wastewater",
    description: "Industrial and municipal water treatment utilizing chemical coagulation, dissolved air flotation, reverse osmosis membrane desalination, and aerobic biological activated sludge.",
    icon: "Droplets",
    rawMaterials: [{ name: "Raw Brackish / Sea Water", purpose: "Water source", properties: "Contains dissolved salts and organics", entryPoint: "Coagulation Flocculator" }],
    products: [{ name: "Potable & Demineralized Water", purpose: "Boiler feedwater and municipal drinking water", productionRoute: "Pretreatment -> High-pressure Reverse Osmosis (RO) membranes" }],
    roles: [{ title: "Water Treatment Plant Engineer", responsibilities: ["Manage membrane fouling and chemical CIP schedules", "Control biological COD/BOD reduction"], skills: ["Membrane Technology", "Mass Transfer"], typicalProblems: ["RO membrane bio-fouling", "Sludge bulking"] }],
    processes: [], challenges: [], relatedSubjects: [{ subjectId: "separation", application: "Cross-flow reverse osmosis membrane mass transport and concentration polarization." }]
  },
  {
    id: "pulp-paper",
    name: "Pulp & Paper",
    description: "Chemical digestion (Kraft process) of wood chips into cellulose pulp, chemical recovery boilers, bleaching, and high-speed fourdrinier paper forming.",
    icon: "FileText",
    rawMaterials: [{ name: "Wood Chips (Cellulose + Lignin)", purpose: "Fiber source", properties: "Organic wood chips", entryPoint: "Continuous Digester" }],
    products: [{ name: "Kraft Pulp & Paper", purpose: "Packaging, linerboard, printing paper", productionRoute: "Chemical pulping, washing, and multi-cylinder drying" }],
    roles: [{ title: "Recovery Boiler Engineer", responsibilities: ["Operate black liquor recovery boiler and recausticizing loop", "Ensure smelt-water explosion prevention"], skills: ["Thermodynamics", "Combustion"], typicalProblems: ["Evaporator scaling", "Smelt spout plugging"] }],
    processes: [], challenges: [], relatedSubjects: [{ subjectId: "heat-transfer", application: "Multiple-effect black liquor evaporators and paper drying cylinders." }]
  },
  {
    id: "mining",
    name: "Mining & Minerals",
    description: "Mineral ore beneficiation: crushing, ball milling, froth flotation separation, hydrometallurgical leaching, and tailings thickening.",
    icon: "Box",
    rawMaterials: [{ name: "Copper / Gold Ore", purpose: "Mineral bearing rock", properties: "Low-grade sulfide or oxide ore", entryPoint: "Primary Gyratory Crusher" }],
    products: [{ name: "Mineral Concentrate (e.g. 28% Cu)", purpose: "Smelter feedstock", productionRoute: "Crushing -> Milling -> Froth flotation" }],
    roles: [{ title: "Metallurgical Process Engineer", responsibilities: ["Optimize flotation reagent dosing (collectors/frothers)", "Maximize mineral recovery and grade"], skills: ["Particulate Technology", "Surface Chemistry"], typicalProblems: ["Grinding media over-consumption", "Poor recovery in slimes"] }],
    processes: [], challenges: [], relatedSubjects: [{ subjectId: "particulate-technology", application: "Hydrocyclone classification and flotation surface chemistry." }]
  },
  {
    id: "food-beverage",
    name: "Food & Beverage",
    description: "Hygienic processing of agricultural commodities into foods and beverages: pasteurization, multi-stage vacuum evaporation, spray drying, and fermentation.",
    icon: "Wheat",
    rawMaterials: [{ name: "Raw Milk / Fruit Juice", purpose: "Food feedstock", properties: "Perishable liquid", entryPoint: "Pasteurizer" }],
    products: [{ name: "Powdered Milk / Concentrates", purpose: "Shelf-stable food products", productionRoute: "Pasteurization -> Falling film evaporation -> Spray drying" }],
    roles: [{ title: "Food Process Engineer", responsibilities: ["Ensure thermal lethality (F0/D-values) in pasteurization", "Manage Clean-in-Place (CIP) cycles"], skills: ["Heat Transfer", "Bio-Engineering"], typicalProblems: ["Evaporator bio-film fouling", "Powder moisture caking"] }],
    processes: [], challenges: [], relatedSubjects: [{ subjectId: "heat-transfer", application: "Thermal death kinetics and sanitary plate heat exchanger design." }]
  },
  {
    id: "sugar",
    name: "Sugar Manufacturing",
    description: "Extraction of sucrose juice from sugarcane, lime clarification, multiple-effect evaporation, vacuum pan crystallization, and centrifugal separation.",
    icon: "Activity",
    rawMaterials: [{ name: "Sugarcane", purpose: "Sucrose source", properties: "Fibrous stalk containing 12-16% sucrose", entryPoint: "Milling Tandem" }],
    products: [{ name: "Refined White Sugar (Sucrose)", purpose: "Commercial sweetener", productionRoute: "Milling -> Evaporation -> Crystallization -> Centrifugation" }],
    roles: [{ title: "Sugar Mill Chemical Engineer", responsibilities: ["Maintain brix and purity across multiple-effect evaporators", "Supervise vacuum pan boiling grain size"], skills: ["Separation", "Evaporator Design"], typicalProblems: ["Inversion sugar losses", "Evaporator tube scaling"] }],
    processes: [], challenges: [], relatedSubjects: [{ subjectId: "separation", application: "Multiple-effect evaporator steam economy and crystallization kinetics." }]
  },
  {
    id: "paints",
    name: "Paints & Coatings",
    description: "High-shear dispersion of pigments, resins, and solvents into industrial architectural and automotive protective coatings.",
    icon: "Factory",
    rawMaterials: [{ name: "Titanium Dioxide (TiO2) & Resin", purpose: "Pigment and binder", properties: "Sub-micron white powder and acrylic/epoxy emulsion", entryPoint: "High-Speed Disperser" }],
    products: [{ name: "Architectural & Industrial Coatings", purpose: "Surface protection and aesthetics", productionRoute: "Premixing -> Bead milling -> Letdown and filtration" }],
    roles: [{ title: "Formulation Chemical Engineer", responsibilities: ["Control grind fineness via Hegman gauge", "Balance VOC emissions and rheological sag resistance"], skills: ["Rheology", "Colloid Chemistry"], typicalProblems: ["Pigment flocculation", "Viscosity drift on storage"] }],
    processes: [], challenges: [], relatedSubjects: [{ subjectId: "fluid-mechanics", application: "Non-Newtonian rheology and high-shear bead milling dynamics." }]
  },
  {
    id: "refining",
    name: "Petroleum Refining",
    description: "Refineries convert crude oil into high-value fuels (LPG, gasoline, jet fuel, diesel) and petrochemical feedstocks through distillation, cracking, and treating.",
    icon: "Fuel",
    rawMaterials: [{ name: "Crude Oil", purpose: "Feedstock", properties: "Hydrocarbon mix", entryPoint: "CDU" }],
    products: [{ name: "Gasoline & Diesel", purpose: "Transportation fuels", productionRoute: "Fractionation & Hydrotreating" }],
    roles: [{ title: "Refinery Process Engineer", responsibilities: ["Optimize distillation cuts", "Maintain sulfur specs"], skills: ["Distillation", "Safety"], typicalProblems: ["Tray flooding"] }],
    processes: [], challenges: [], relatedSubjects: [{ subjectId: "separation", application: "Atmospheric and vacuum distillation." }]
  }
];
