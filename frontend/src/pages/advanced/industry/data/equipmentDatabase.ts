export interface EquipmentItem {
  id: string;
  name: string;
  category: 'Fluid Mechanics' | 'Heat Transfer' | 'Separation' | 'Reaction Engineering' | 'Particulate Technology' | 'General Industrial';
  purpose: string;
  workingPrinciple: string;
  mainComponents: string[];
  inputs: string[];
  outputs: string[];
  operatingParameters: { name: string; normalRange: string; unit: string; importance: string }[];
  designParameters: { name: string; typicalValue: string }[];
  instrumentation: string[];
  control: string;
  commonFailures: string[];
  troubleshooting: { symptom: string; probableCause: string; solution: string }[];
  hazards: string[];
  ppe: string[];
  environmentalConcerns: string;
  maintenance: string[];
  industrialApplications: string[];
  relatedSubjects: { name: string; path: string }[];
  relatedCalculators: { name: string; path: string }[];
  relatedLabs: { name: string; path: string }[];
  vivaQuestions: { q: string; a: string }[];
}

export const CENTRAL_EQUIPMENT_DATABASE: EquipmentItem[] = [
  // 1. ROTARY KILN
  {
    id: "EQ-ROTARY-KILN-01",
    name: "Rotary Kiln (Pyroprocessing)",
    category: "General Industrial",
    purpose: "Continuously heat raw meal solids to extreme temperatures (1450°C) to induce sintering and clinkerization reactions.",
    workingPrinciple: "A long refractory-lined cylindrical shell inclined at 3-4% rotates at 3-5 RPM. Solids enter the cool elevated end and travel downward counter-current to a massive combustion flame at the discharge hood.",
    mainComponents: ["Steel cylindrical shell", "Basic refractory brick lining (Spinel/Magnesite)", "Tires (riding rings)", "Support roller piers", "Girth gear & pinion drive", "Multi-channel coal/gas burner pipe", "Inlet & outlet pneumatic seals"],
    inputs: ["Calcined raw meal powder", "Primary pulverized coal/gas", "Preheated secondary combustion air (1000°C) from cooler"],
    outputs: ["Portland cement clinker nodules (1450°C)", "Exhaust kiln gas (CO2, N2, excess O2, trace NOx/SOx)"],
    operatingParameters: [
      { name: "Burning Zone Temperature", normalRange: "1400 - 1480", unit: "°C", importance: "Crucial for formation of Alite (C3S) clinker mineral" },
      { name: "Kiln Speed", normalRange: "3.0 - 5.0", unit: "RPM", importance: "Controls solids retention time (20-30 minutes)" },
      { name: "Kiln Inlet Oxygen", normalRange: "1.5 - 2.5", unit: "%", importance: "Ensures complete fuel combustion and prevents CO explosion risks" },
      { name: "Kiln Shell Temperature", normalRange: "200 - 320", unit: "°C", importance: "Monitors refractory coating health and detects red spots" }
    ],
    designParameters: [
      { name: "Length to Diameter Ratio (L/D)", typicalValue: "14:1 to 16:1" },
      { name: "Shell Diameter", typicalValue: "4.5 - 6.0 m" },
      { name: "Shell Length", typicalValue: "65 - 90 m" },
      { name: "Drive Motor Power", typicalValue: "500 - 900 kW" }
    ],
    instrumentation: ["Optical radiation pyrometer", "Infrared kiln shell scanner", "Inlet zirconia O2/CO gas analyzer", "Bearing temperature thermocouples", "Drive motor torque & current meters"],
    control: "Cascade PID loop adjusting coal feed weigh feeders based on burning zone temperature pyrometer, with ID fan speed modulating kiln inlet draft.",
    commonFailures: ["Refractory brick spalling or loss leading to shell red spot", "Kiln ring formation restricting gas flow", "Tire migration or roller bearing overheating", "Inlet seal air leakage"],
    troubleshooting: [
      { symptom: "Red spot on shell (>380°C)", probableCause: "Local brick refractory drop or severe wash-out", solution: "Apply localized external cooling fans immediately, shift flame away, and schedule hot repair or shutdown." },
      { symptom: "High CO at kiln inlet (>0.2%)", probableCause: "Insufficient draft or fuel surge", solution: "Reduce fuel feed rate immediately and increase ID fan speed to avoid ESP high-voltage trip." }
    ],
    hazards: ["Extreme radiant heat (1450°C)", "CO gas explosion hazard in exhaust duct", "Rotating heavy machinery pinch points", "Hot liquid clinker flush"],
    ppe: ["Aluminized proximity heat suit", "Face shield with IR-filtering glass", "Steel-toe high-top boots", "Dust respirator"],
    environmentalConcerns: "Major source of industrial process CO2 from limestone calcination and fuel combustion; NOx emissions from high thermal flame temperatures.",
    maintenance: ["Daily infrared shell scanning", "Monthly roller skew alignment inspection", "Annual complete refractory brick relining", "Girth gear grease spray lubrication check"],
    industrialApplications: ["Cement Industry", "Lime Production", "Iron Ore Pelletizing", "Hazardous Waste Incineration"],
    relatedSubjects: [
      { name: "Heat Transfer", path: "/advanced/heat-transfer" },
      { name: "Thermodynamics", path: "/advanced/thermodynamics" },
      { name: "Reaction Engineering", path: "/advanced/reaction-eng" },
      { name: "Process Control", path: "/advanced/process-control" }
    ],
    relatedCalculators: [
      { name: "Heat Duty Calculator", path: "/advanced/calculators" },
      { name: "Radiation Heat Loss", path: "/advanced/calculators" }
    ],
    relatedLabs: [
      { name: "Furnace Heat Loss & Refractory Lab", path: "/advanced/lab-assistant" }
    ],
    vivaQuestions: [
      { q: "Why is the rotary kiln inclined at 3-4%?", a: "The slope combined with rotation uses gravity to transport the solid bed forward from the feed inlet to the discharge hood at a controlled velocity." },
      { q: "What is the purpose of clinker liquid phase (20-25%) in the kiln burning zone?", a: "The liquid phase (C3A and C4AF melt) acts as a solvent that dissolves solid CaO and C2S, enabling rapid chemical diffusion to synthesize Alite (C3S)." }
    ]
  },

  // 2. VERTICAL ROLLER MILL (VRM)
  {
    id: "EQ-VRM-01",
    name: "Vertical Roller Mill (VRM)",
    category: "Particulate Technology",
    purpose: "Simultaneously crush, grind, dry, and pneumatically classify raw minerals and meal.",
    workingPrinciple: "Material falls onto a rotating circular horizontal grinding table. Centrifugal force moves it under large hydraulically pressed rollers. Hot gas sweeping upward carries ground fines into an integrated dynamic separator.",
    mainComponents: ["Rotating grinding table with liner segments", "Hydraulic grinding rollers (2-4 rollers)", "Hydraulic accumulators", "Dynamic cage rotor classifier", "Main bevel-helical gearbox", "Hot gas inlet duct"],
    inputs: ["Coarse crushed limestone and additives (<50 mm)", "Hot gas from preheater (300°C)"],
    outputs: ["Fine raw meal powder (<90 microns, moisture <1%)", "Exhaust gas laden with powder to baghouse"],
    operatingParameters: [
      { name: "Hydraulic Grinding Pressure", normalRange: "100 - 160", unit: "bar", importance: "Determines grinding force applied by rollers to solid bed" },
      { name: "Mill Differential Pressure", normalRange: "40 - 70", unit: "mbar", importance: "Indicates internal circulation load and mill bed depth" },
      { name: "Mill Outlet Temperature", normalRange: "85 - 95", unit: "°C", importance: "Ensures complete drying without scorching baghouse filter bags" },
      { name: "Mill Vibration", normalRange: "< 2.5", unit: "mm/s", importance: "Mechanical health indicator; high vibration causes automatic trip" }
    ],
    designParameters: [
      { name: "Table Diameter", typicalValue: "3.5 - 5.6 m" },
      { name: "Throughput Capacity", typicalValue: "250 - 550 t/h" },
      { name: "Installed Motor Power", typicalValue: "2000 - 4500 kW" }
    ],
    instrumentation: ["Differential pressure transmitters", "Table motor amp meters", "Vibration sensors on roller arms", "Inlet/outlet thermocouples", "Dynamic separator VFD speed tachometer"],
    control: "Table feed weigh feeder modulated by elevator/mill motor power, with hot gas louvers controlling outlet temperature.",
    commonFailures: ["Grinding bed collapse causing high vibration trip", "Tramp metal jamming under roller", "Worn roller tire or table liner plates", "Accumulator nitrogen bladder deflation"],
    troubleshooting: [
      { symptom: "Sudden high mill vibration (>5 mm/s)", probableCause: "Loss of grinding bed, feed starvation, or tramp metal", solution: "Inject table water spray to stabilize bed, check weigh feeder belt, and verify metal detector rejection chute." },
      { symptom: "High mill outlet temperature (>105°C)", probableCause: "Excess hot gas damper opening or low wet feed moisture", solution: "Open fresh atmospheric air damper and throttle preheater hot gas duct." }
    ],
    hazards: ["High pressure hydraulic oil injection (>150 bar)", "Pinch points between roller and table", "Fine combustible or irritating dust clouds"],
    ppe: ["Ear protection (mill noise >95 dBA)", "Dust mask / P100 respirator", "Safety glasses", "Cut-resistant gloves"],
    environmentalConcerns: "High electrical power consumer; requires efficient pulse-jet baghouse to capture all fine particulate emissions.",
    maintenance: ["Weekly hydraulic nitrogen pre-charge check", "Bi-weekly hardfacing welding of roller profiles", "Lubrication oil cooling filtration servicing"],
    industrialApplications: ["Cement Raw Grinding", "Coal Pulverization", "Slag Grinding", "Mineral Ore Beneficiation"],
    relatedSubjects: [
      { name: "Particulate Technology", path: "/advanced/particulate" },
      { name: "Fluid Mechanics", path: "/advanced/fluid-mechanics" },
      { name: "Process Control", path: "/advanced/process-control" }
    ],
    relatedCalculators: [
      { name: "Bond Work Index & Power Sizing", path: "/advanced/calculators" },
      { name: "Cyclone & Classifier Sizing", path: "/advanced/calculators" }
    ],
    relatedLabs: [
      { name: "Sieve Analysis & Comminution Lab", path: "/advanced/lab-assistant" }
    ],
    vivaQuestions: [
      { q: "What is the primary advantage of a VRM over a traditional Ball Mill?", a: "A VRM combines crushing, grinding, drying, and classification into one compact unit, using 25-35% less electrical energy than a ball mill." },
      { q: "Why is water injection used on a VRM table?", a: "Water injection de-aerates the fine powder bed, increasing friction between rollers and table, preventing bed slip and vibration." }
    ]
  },

  // 3. PRIMARY STEAM METHANE REFORMER (SMR)
  {
    id: "EQ-PRIMARY-REFORMER",
    name: "Steam Methane Primary Reformer (SMR)",
    category: "Reaction Engineering",
    purpose: "Catalytically convert natural gas (methane) and steam into synthesis gas (H2, CO, CO2) at high pressure and temperature.",
    workingPrinciple: "A massive firebox furnace containing hundreds of vertical nickel-alloy catalyst tubes. Fuel gas is fired between tubes to supply the intense endothermic heat of reforming (CH4 + H2O <-> CO + 3H2).",
    mainComponents: ["Nickel-chromium alloy catalyst tubes (e.g. HP-Micro)", "Nickel-impregnated alumina catalyst rings", "Radiant arch & wall burners", "Convection section coil banks", "Induced draft (ID) and forced draft (FD) fans", "Pigtails & outlet collector manifolds"],
    inputs: ["Desulfurized natural gas", "Superheated steam (Steam-to-Carbon ratio ~3.0)", "Fuel gas and combustion air"],
    outputs: ["Raw syngas (H2, CO, CO2, unreacted CH4, steam)", "Flue gas (sent to heat recovery section)"],
    operatingParameters: [
      { name: "Reformer Tube Outlet Temperature", normalRange: "780 - 830", unit: "°C", importance: "Drives endothermic reaction forward to minimize residual CH4 slip" },
      { name: "Operating Pressure", normalRange: "30 - 38", unit: "bar", importance: "Balances downstream ammonia/methanol synthesis pressure economics" },
      { name: "Steam-to-Carbon (S/C) Ratio", normalRange: "2.8 - 3.2", unit: "mol/mol", importance: "Prevents coking (carbon deposition) on nickel catalyst" },
      { name: "Tube Skin Temperature", normalRange: "880 - 950", unit: "°C", importance: "Monitors tube metallurgy life; exceeding limits causes creep rupture" }
    ],
    designParameters: [
      { name: "Number of Tubes", typicalValue: "250 - 450 tubes" },
      { name: "Tube Outer Diameter", typicalValue: "115 - 140 mm" },
      { name: "Tube Length", typicalValue: "12 - 14 m" },
      { name: "Heat Duty", typicalValue: "120 - 250 MW" }
    ],
    instrumentation: ["Optical pyrometers for tube skin temperatures", "Outlet syngas infrared gas chromatograph", "Burner fuel header pressure transmitters", "Draft differential pressure gauges"],
    control: "Cascade temperature control adjusting fuel gas control valve based on coil outlet temperature, with cross-limiting air-to-fuel ratio control.",
    commonFailures: ["Tube creep rupture due to hot spots", "Catalyst poisoning from sulfur breakthrough (>0.2 ppm)", "Carbon deposition (coking) blocking flow", "Burner flashback or impingement on tubes"],
    troubleshooting: [
      { symptom: "Bright glowing patch (hot spot) on single tube", probableCause: "Internal catalyst void, bridge, or local coking", solution: "Trim firing on adjacent burners, inspect pyrometer reading, and verify sulfur absorber efficiency." },
      { symptom: "High methane (CH4) slip in outlet syngas (>10%)", probableCause: "Low reforming temperature or deactivated catalyst", solution: "Increase firebox heat input gradually while ensuring tube skin temperatures stay below maximum creep limits." }
    ],
    hazards: ["High pressure flammable hydrogen gas (35 bar)", "Furnace thermal explosion risk during light-off", "Asphyxiation risk from inert flue gas"],
    ppe: ["Flame-retardant (FR) coveralls", "Gas detector (H2, CO, CH4)", "Safety glasses with side shields", "Thermal safety gloves"],
    environmentalConcerns: "Major direct CO2 emission point from fuel gas combustion; requires Low-NOx burners to prevent thermal NOx generation.",
    maintenance: ["Continuous tube skin infrared thermography", "Turnaround eddy current tube thickness inspection", "Catalyst changeout every 5-7 years with sock/dense loading"],
    industrialApplications: ["Fertilizer Industry (Ammonia/Urea)", "Hydrogen Plants / Fuel Cells", "Methanol Synthesis", "Petroleum Hydrocracking"],
    relatedSubjects: [
      { name: "Reaction Engineering", path: "/advanced/reaction-eng" },
      { name: "Thermodynamics", path: "/advanced/thermodynamics" },
      { name: "Heat Transfer", path: "/advanced/heat-transfer" },
      { name: "Process Control", path: "/advanced/process-control" }
    ],
    relatedCalculators: [
      { name: "Equilibrium Conversion Calculator", path: "/advanced/calculators" },
      { name: "Heat Duty & Furnace Efficiency", path: "/advanced/calculators" }
    ],
    relatedLabs: [
      { name: "Catalytic Reactor Kinetics Lab", path: "/advanced/lab-assistant" }
    ],
    vivaQuestions: [
      { q: "Why is sulfur fatal to steam methane reforming catalyst?", a: "Sulfur chemisorbs strongly and irreversibly onto the active metallic nickel sites, completely deactivating the catalyst and causing localized overheating." },
      { q: "Why is reforming operated at 30 bar when Le Chatelier predicts higher conversion at low pressure?", a: "Although low pressure thermodynamically favors the 1 -> 4 mole expansion, compressing syngas downstream from 1 bar to 200 bar is far more energy-intensive than compressing natural gas feed to 30 bar." }
    ]
  },

  // 4. HABER-BOSCH AMMONIA SYNTHESIS CONVERTER
  {
    id: "EQ-AMMONIA-CONVERTER",
    name: "Ammonia Synthesis Converter (Haber-Bosch)",
    category: "Reaction Engineering",
    purpose: "Convert nitrogen (N2) and hydrogen (H2) into ammonia (NH3) under high pressure and temperature over an iron catalyst.",
    workingPrinciple: "Stoichiometric syngas (3:1 H2:N2) passes through multi-bed promoted magnetite (Fe3O4/wüstite) catalyst beds. Because the exothermic reaction is equilibrium-limited (15-20% pass conversion), inter-bed cooling or quench gas injection is used.",
    mainComponents: ["High-pressure forged steel pressure vessel", "Internal catalyst baskets (radial flow)", "Inter-bed gas-gas heat exchangers", "Quench gas spargers", "Cold-wall bypass cooling channels"],
    inputs: ["Purified synthesis gas (3:1 H2:N2, <5 ppm CO/CO2)", "Recycle gas from ammonia chillers"],
    outputs: ["Ammonia-rich syngas (~18-20% NH3) to condensation refrigeration loop"],
    operatingParameters: [
      { name: "Synthesis Pressure", normalRange: "150 - 220", unit: "bar", importance: "Thermodynamically forces the forward reaction (4 moles -> 2 moles)" },
      { name: "Bed Inlet Temperature", normalRange: "380 - 420", unit: "°C", importance: "Activates the tough triple bond of N2 across iron catalyst" },
      { name: "Bed Exit Temperature", normalRange: "480 - 520", unit: "°C", importance: "Controlled to avoid catalyst sintering and thermal deactivation" },
      { name: "Inert Gas (Ar + CH4) Concentration", normalRange: "8 - 14", unit: "%", importance: "Managed via continuous loop purge to prevent partial pressure dilution" }
    ],
    designParameters: [
      { name: "Design Pressure", typicalValue: "250 bar" },
      { name: "Catalyst Type", typicalValue: "Promoted Iron (K2O, Al2O3, CaO)" },
      { name: "Reactor Flow Pattern", typicalValue: "Radial or Cross-Flow to reduce pressure drop" }
    ],
    instrumentation: ["Multi-point internal thermocouple lances", "High-pressure differential pressure cells", "Gas chromatograph measuring loop NH3 concentration"],
    control: "Inter-bed quench gas bypass valves modulate bed inlet temperatures to stay along the optimal equilibrium reaction operating line.",
    commonFailures: ["Catalyst poisoning from trace CO/CO2 or moisture", "Nitrogen/hydrogen embrittlement of steel walls", "High pressure drop across catalyst bed"],
    troubleshooting: [
      { symptom: "Sudden drop in NH3 production across loop", probableCause: "Oxygen or CO/CO2 poison slip from methanator", solution: "Check methanator outlet chromatograph immediately; if CO/CO2 > 2 ppm, divert feed gas to flare to save catalyst." }
    ],
    hazards: ["Extreme pressure (200 bar)", "Toxic, corrosive, and flammable ammonia gas", "High temperature hydrogen attack (HTHA)"],
    ppe: ["Ammonia canister gas mask / SCBA on standby", "High-pressure blast shielding", "Full chemical suit during sampling"],
    environmentalConcerns: "Requires flare system equipped with water scrubbers to prevent toxic ammonia release during emergency depressurization.",
    maintenance: ["Hydrogen embrittlement acoustic emission testing", "Ultrasonic shell wall thickness gauging", "Catalyst passivation prior to vessel opening"],
    industrialApplications: ["Synthetic Fertilizer Production", "Explosives & Nitric Acid", "Refrigerants & Chemical Bulk Synthesis"],
    relatedSubjects: [
      { name: "Reaction Engineering", path: "/advanced/reaction-eng" },
      { name: "Thermodynamics", path: "/advanced/thermodynamics" },
      { name: "Process Control", path: "/advanced/process-control" }
    ],
    relatedCalculators: [
      { name: "Chemical Equilibrium & Conversion", path: "/advanced/calculators" },
      { name: "Compressor Power & Recycle Loop", path: "/advanced/calculators" }
    ],
    relatedLabs: [
      { name: "Chemical Equilibrium Reactor Lab", path: "/advanced/lab-assistant" }
    ],
    vivaQuestions: [
      { q: "Why is conversion per pass only 15-20% in an ammonia converter?", a: "Because N2 + 3H2 <-> 2NH3 is exothermic. At the temperatures required for adequate reaction rate (>400°C), chemical equilibrium strongly shifts backward, limiting single-pass conversion." }
    ]
  },

  // 5. SHELL AND TUBE HEAT EXCHANGER
  {
    id: "EQ-HEAT-EXCHANGER-01",
    name: "Shell and Tube Heat Exchanger (TEMA E-Type)",
    category: "Heat Transfer",
    purpose: "Efficiently transfer thermal energy between two continuous fluid streams without physical mixing.",
    workingPrinciple: "One fluid flows inside a bundle of parallel tubes while the second fluid flows through the outer shell around the tubes. Segmental baffles force the shell-side fluid into cross-flow to maximize convective heat transfer coefficients.",
    mainComponents: ["Outer cylindrical shell", "Tube bundle (seamless steel/titanium tubes)", "Fixed/Floating tube sheets", "Segmental transverse baffles", "Channel heads & bonnets", "Tie rods and spacers", "Impingement plates"],
    inputs: ["Hot process fluid (shell or tube side)", "Cold process or utility cooling water/steam"],
    outputs: ["Cooled process fluid", "Heated utility stream"],
    operatingParameters: [
      { name: "Shell-side Pressure Drop", normalRange: "0.2 - 0.7", unit: "bar", importance: "Indicates fouling and pumping power requirements" },
      { name: "Tube-side Velocity", normalRange: "1.2 - 2.5", unit: "m/s", importance: "Sufficient to reduce fouling without causing severe erosion" },
      { name: "Log Mean Temp Difference (LMTD)", normalRange: "15 - 50", unit: "°C", importance: "Driving force for thermal transfer rate" }
    ],
    designParameters: [
      { name: "TEMA Type", typicalValue: "BEM or AES" },
      { name: "Overall Heat Transfer Coefficient (U)", typicalValue: "300 - 900 W/m²·K" },
      { name: "Baffle Cut", typicalValue: "20% - 25%" }
    ],
    instrumentation: ["Inlet and outlet resistance temperature detectors (RTDs)", "Differential pressure transmitters across shell and tube sides", "Flow meters"],
    control: "PID controller modulating cooling water control valve on shell-side outlet based on target process stream outlet temperature.",
    commonFailures: ["Tube fouling/scaling reducing heat transfer coefficient", "Tube-to-tubesheet joint leaks leading to cross-contamination", "Flow-induced vibration causing tube fatigue collision", "Corrosion pitting under deposit"],
    troubleshooting: [
      { symptom: "Gradual decline in heat duty / rising process outlet temp", probableCause: "Deposition of foulant (bio-slime, scale, coking) on surfaces", solution: "Schedule online backwashing or chemical CIP (Cleaning-in-Place); plan mechanical hydro-blasting during outage." },
      { symptom: "Pressure surge and contamination of cooling water", probableCause: "Tube pinhole rupture or joint failure", solution: "Isolate exchanger immediately, perform hydrostatic leak test, and install mechanical plugs in failed tubes." }
    ],
    hazards: ["Thermal burns from uninsulated hot surfaces", "Overpressurization due to blocked-in fluid thermal expansion", "Fluid cross-contamination"],
    ppe: ["Thermal gloves", "Safety glasses with side shields", "Standard site PPE"],
    environmentalConcerns: "Discharge of chemically treated cooling water blowdown must comply with thermal and biocide limits.",
    maintenance: ["Annual eddy-current non-destructive tube wall testing", "High pressure water jetting (1000 bar) of tube bundles", "Gasket replacement during head removal"],
    industrialApplications: ["Petroleum Refining", "Chemical Synthesis", "Power Generation Condensers", "Fertilizer Plants"],
    relatedSubjects: [
      { name: "Heat Transfer", path: "/advanced/heat-transfer" },
      { name: "Fluid Mechanics", path: "/advanced/fluid-mechanics" },
      { name: "Process Control", path: "/advanced/process-control" }
    ],
    relatedCalculators: [
      { name: "LMTD & NTU Calculator", path: "/advanced/calculators" },
      { name: "Overall Heat Transfer Coefficient (U)", path: "/advanced/calculators" },
      { name: "Shell & Tube Pressure Drop", path: "/advanced/calculators" }
    ],
    relatedLabs: [
      { name: "Shell and Tube Heat Exchanger Lab", path: "/advanced/lab-assistant" }
    ],
    vivaQuestions: [
      { q: "Why are baffles placed inside the shell?", a: "Baffles support the long tube bundle against vibration sagging and force the shell fluid into cross-flow, greatly boosting turbulence and convective heat transfer." },
      { q: "When would you put a fluid in the tubes rather than the shell?", a: "Put corrosive, fouling, high-pressure, or hazardous fluids in the tubes because tubes are easier to clean mechanically and high pressures are cheaper to contain in small-diameter tubes." }
    ]
  },

  // 6. CENTRIFUGAL PUMP
  {
    id: "EQ-CENTRIFUGAL-PUMP-01",
    name: "Industrial Centrifugal Pump (API 610)",
    category: "Fluid Mechanics",
    purpose: "Provide hydraulic pressure head to transport liquids through piping networks and process equipment.",
    workingPrinciple: "An electric motor rotates an impeller inside a spiral casing (volute). Liquid entering the impeller eye is accelerated radially outward by centrifugal force, converting kinetic energy into static pressure in the expanding volute.",
    mainComponents: ["Rotating impeller (closed/semi-open)", "Spiral volute casing", "Pump shaft & bearings", "Mechanical shaft seal (dual cartridge)", "Suction & discharge flanges", "Electric drive motor & coupling"],
    inputs: ["Low pressure liquid stream"],
    outputs: ["High pressure liquid stream"],
    operatingParameters: [
      { name: "Discharge Pressure", normalRange: "5 - 25", unit: "bar", importance: "Overcomes piping head loss and vessel back-pressure" },
      { name: "NPSH Margin (NPSHa - NPSHr)", normalRange: "> 1.0", unit: "m", importance: "Crucial buffer to completely avoid cavitational boiling" },
      { name: "Vibration Velocity", normalRange: "< 2.8", unit: "mm/s", importance: "Monitors bearing and impeller mechanical health" }
    ],
    designParameters: [
      { name: "Specific Speed (Ns)", typicalValue: "1200 - 2500 (radial flow)" },
      { name: "Hydraulic Efficiency", typicalValue: "72% - 85%" }
    ],
    instrumentation: ["Suction and discharge pressure gauges", "Bearing vibration accelerometers", "Seal flush buffer fluid pressure switch"],
    control: "Discharge control valve modulated by downstream level or flow transmitter; variable frequency drive (VFD) for energy conservation.",
    commonFailures: ["Cavitation erosion damaging impeller blades", "Mechanical seal leakage from dry-running", "Bearing seizure from oil contamination", "Thermal overheating against closed deadhead discharge"],
    troubleshooting: [
      { symptom: "Loud popping / gravel rattle noise and head drop", probableCause: "Cavitation (NPSHa fell below NPSHr)", solution: "Increase suction vessel liquid level, clean suction strainer, or throttle discharge valve to reduce flow rate." },
      { symptom: "Mechanical seal leaking liquid drops", probableCause: "Seal face thermal distortion or seal flush plan failure", solution: "Verify seal barrier fluid pot pressure and schedule seal cartridge overhaul." }
    ],
    hazards: ["High pressure liquid spray", "Toxic or flammable liquid leak at shaft seal", "Rotating shaft entanglement"],
    ppe: ["Safety glasses with side shields", "Chemical resistant gloves", "Hearing protection"],
    environmentalConcerns: "Volatile organic compound (VOC) emissions from leaking seals; mitigated by API Plan 52/53 pressurized dual mechanical seals.",
    maintenance: ["Daily bearing oil level and temperature check", "Monthly vibration spectrum analysis", "Annual laser shaft realignment"],
    industrialApplications: ["All Chemical Processing Industries", "Water Treatment", "Oil Refining", "Refinery Hydrocarbon Pumping"],
    relatedSubjects: [
      { name: "Fluid Mechanics", path: "/advanced/fluid-mechanics" },
      { name: "Process Control", path: "/advanced/process-control" }
    ],
    relatedCalculators: [
      { name: "Pump Head & Power Calculator", path: "/advanced/calculators" },
      { name: "NPSH Available vs Required", path: "/advanced/calculators" },
      { name: "Darcy-Weisbach Piping Friction Loss", path: "/advanced/calculators" }
    ],
    relatedLabs: [
      { name: "Centrifugal Pump Performance Lab", path: "/advanced/lab-assistant" }
    ],
    vivaQuestions: [
      { q: "What is cavitation and why is it destructive to a pump?", a: "Cavitation occurs when local static pressure falls below the liquid vapor pressure, forming vapor bubbles that violently implode when entering higher pressure zones, creating micro-jets (>1000 MPa) that pit and erode impeller metal." }
    ]
  },

  // 7. FRACTIONAL DISTILLATION COLUMN
  {
    id: "EQ-DISTILLATION-COL-01",
    name: "Fractional Distillation Column",
    category: "Separation",
    purpose: "Separate volatile liquid mixtures into distinct purity fractions based on relative volatility differences.",
    workingPrinciple: "Vapor rises up the vertical column while liquid reflux descends over trays or structured packing. Repeated counter-current vapor-liquid equilibrium contacts drive more volatile light components to the top overhead and heavy components to the bottoms.",
    mainComponents: ["Vertical cylindrical shell (tray or packed)", "Sieve/valve trays or structured packing", "Overhead condenser & reflux accumulator drum", "Reboiler (thermosiphon or kettle)", "Reflux pumps", "Feed inlet distributor"],
    inputs: ["Multi-component liquid feed mixture (e.g. Crude oil, Ethanol-Water, BTX)"],
    outputs: ["Overhead distillate vapor/liquid (light ends)", "Bottoms residue (heavy ends)"],
    operatingParameters: [
      { name: "Top Column Pressure", normalRange: "1.0 - 5.0", unit: "bar", importance: "Fixes boiling points and separation relative volatility" },
      { name: "Reflux Ratio (R/D)", normalRange: "1.5 - 4.5", unit: "-", importance: "Governs product purity versus reboiler utility energy cost" },
      { name: "Column Differential Pressure", normalRange: "0.1 - 0.4", unit: "bar", importance: "Monitors hydraulic loading and detects incipient flooding" }
    ],
    designParameters: [
      { name: "Number of Theoretical Stages", typicalValue: "25 - 60 trays" },
      { name: "Column Height", typicalValue: "30 - 65 m" },
      { name: "Column Diameter", typicalValue: "1.5 - 4.5 m" }
    ],
    instrumentation: ["Tray temperature profile sensors (every 5-10 trays)", "Overhead pressure transmitter", "Differential pressure cell across column", "Reflux flow meter", "Bottoms level transmitter"],
    control: "Dual composition control: overhead reflux rate controls top temperature/purity; reboiler steam valve controls tray stripping temperature.",
    commonFailures: ["Column flooding (liquid entrainment up column)", "Weeping / dumping (liquid draining through tray holes without vapor contact)", "Foaming caused by chemical contaminants", "Reboiler tube fouling"],
    troubleshooting: [
      { symptom: "Sudden spike in differential pressure and top temperature loss", probableCause: "Flooding (vapor velocity too high or downcomer choked)", solution: "Reduce reboiler heat input and lower feed rate immediately to clear the hydraulic flood." },
      { symptom: "Overhead purity declining despite normal reflux", probableCause: "Tray weeping or damaged downcomer seal pan", solution: "Increase boil-up rate slightly to establish vapor velocity through tray perforations." }
    ],
    hazards: ["High inventory of volatile flammable hydrocarbons", "High thermal energy and pressure", "Column vacuum collapse during improper shutdown"],
    ppe: ["Flame retardant clothing", "Hard hat with chin strap", "Harness for tower ladder climbing", "Gas detector"],
    environmentalConcerns: "Fugitive VOC leaks from flange gaskets and relief valves; overhead vent gas sent to flare or vapor recovery unit (VRU).",
    maintenance: ["Gamma-ray scanning to diagnose internal tray damage without shutdown", "Periodic turnaround tray wash and manway inspection"],
    industrialApplications: ["Petroleum Refining (Crude Distillation)", "Petrochemicals (Ethylene/Propylene fractionation)", "Alcohol Distilleries", "Air Separation Units"],
    relatedSubjects: [
      { name: "Separation Processes", path: "/advanced/separation" },
      { name: "Thermodynamics", path: "/advanced/thermodynamics" },
      { name: "Mass Transfer", path: "/advanced/mass-transfer" },
      { name: "Process Control", path: "/advanced/process-control" }
    ],
    relatedCalculators: [
      { name: "McCabe-Thiele & FUG Column Sizing", path: "/advanced/calculators" },
      { name: "VLE Bubble & Dew Point", path: "/advanced/calculators" }
    ],
    relatedLabs: [
      { name: "Binary Distillation Column Lab", path: "/advanced/lab-assistant" }
    ],
    vivaQuestions: [
      { q: "What is the difference between minimum reflux ratio and total reflux?", a: "Minimum reflux ratio requires an infinite number of stages to achieve separation. Total reflux produces zero net distillate product but requires the minimum number of stages." }
    ]
  }
];
