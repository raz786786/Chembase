import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, Plus, Beaker, FileText, Settings, PlayCircle, Activity, ChevronRight, TestTubes, Info } from 'lucide-react';
import VivaModal from './VivaModal';
import { sendAutoRoutedChat, extractCleanJsonObject } from '../../utils/providerRouter';

export const DEFAULT_EQUIPMENT_BY_SUBJECT: Record<string, any[]> = {
  'fluid-mechanics': [
    {
      id: 'builtin_fm_venturi',
      name: 'Venturi & Orifice Flow Meter Rig',
      subject: 'fluid-mechanics',
      category: 'Flow Measurement',
      description: 'Differential-head flow measurement bench comparing Venturi tube, orifice plate, and rotameter discharge coefficients across laminar and turbulent regimes.',
      working_principle: 'Applies the continuity equation and Bernoulli energy balance across a smooth constriction (Venturi) or sharp-edged aperture (orifice) to correlate pressure head drop Δh with volumetric flow rate Q.',
      main_components: ['Acrylic Venturi Tube', 'Sharp-Edged Orifice Plate', 'Multi-Tube Piezometer Manometer', 'Variable-Area Rotameter', 'Flow Control Valve & Weigh Tank'],
      operating_parameters: ['Volumetric Flow Rate Q (L/min)', 'Differential Head Δh (mm H2O)', 'Reynolds Number Re', 'Discharge Coefficient Cd'],
      safety_hazards: ['Check hose clamps before starting circulation pump', 'Keep electrical switches dry and wipe up floor spills immediately']
    },
    {
      id: 'builtin_fm_pump',
      name: 'Centrifugal Pump Characteristic Test Rig',
      subject: 'fluid-mechanics',
      category: 'Turbomachinery',
      description: 'Closed-loop hydraulic test bench for measuring total dynamic head, shaft power, hydraulic efficiency, and NPSH curves of a centrifugal pump.',
      working_principle: 'A rotating impeller imparts kinetic energy to the fluid which is converted into static pressure head inside the volute casing; throttling the discharge valve maps the H-Q, P-Q, and η-Q curves.',
      main_components: ['Centrifugal Pump & VFD Motor', 'Suction & Discharge Pressure Gauges', 'Electromagnetic Flowmeter', 'Torque / Wattmeter Sensor', 'Recirculation Sump Tank'],
      operating_parameters: ['Flow Rate Q (m³/h)', 'Total Head H (m)', 'Shaft Power P (W)', 'Pump Efficiency η (%)', 'NPSH Available (m)'],
      safety_hazards: ['Never run the pump dry — verify priming before startup', 'Do not dead-head the pump with discharge valve fully closed for extended periods']
    },
    {
      id: 'builtin_fm_friction',
      name: 'Pipe Friction & Reynolds Apparatus',
      subject: 'fluid-mechanics',
      category: 'Internal Flow',
      description: 'Pipe network rack with smooth/rough pipes, bends, and fittings for determining Darcy-Weisbach friction factors and laminar-to-turbulent transition.',
      working_principle: 'Measures static pressure drop ΔP along straight pipe lengths and across fittings to compute Darcy friction factor f = ΔP·(D/L)/(½ρv²) and minor loss coefficients K.',
      main_components: ['Smooth & Artificially Roughened Test Pipes', 'Dye Injection Reynolds Tube', 'Differential Pressure Transducer / U-Tube Manometer', '90° Elbows, Tees & Gate/Globe Valves'],
      operating_parameters: ['Mean Velocity v (m/s)', 'Pressure Drop ΔP (Pa)', 'Reynolds Number Re', 'Darcy Friction Factor f'],
      safety_hazards: ['Bleed trapped air bubbles from manometer lines slowly', 'Avoid exceeding maximum pressure rating of glass manometer tubes']
    }
  ],
  'heat-transfer': [
    {
      id: 'builtin_ht_hx',
      name: 'Concentric-Tube Heat Exchanger',
      subject: 'heat-transfer',
      category: 'Heat Exchangers',
      description: 'Double-pipe liquid-to-liquid heat exchanger configurable in co-current or counter-current mode for LMTD and overall U-value evaluation.',
      working_principle: 'Transfers sensible heat across the inner metallic tube wall between hot and cold streams governed by Q = U·A·ΔT_lm; counter-current operation maximizes thermal driving force.',
      main_components: ['Inner Copper Tube & Outer Insulated Shell', 'Co-Current / Counter-Current Switching Manifold', '4-Channel Thermocouple Readout', 'Hot Water Heater & Circulation Pump'],
      operating_parameters: ['Hot/Cold Inlet & Outlet Temperatures (°C)', 'Mass Flow Rates (kg/s)', 'LMTD (°C)', 'Overall Heat Transfer Coefficient U (W/m²·K)'],
      safety_hazards: ['Hot water lines can exceed 70 °C — avoid touching uninsulated fittings', 'Verify water circulation before energizing the immersion heater']
    },
    {
      id: 'builtin_ht_cond',
      name: 'Linear & Radial Thermal Conduction Unit',
      subject: 'heat-transfer',
      category: 'Conduction',
      description: 'Instrumented cylindrical bar and radial disk conduction bench for determining thermal conductivity k of brass, aluminum, and stainless steel.',
      working_principle: 'Establishes steady 1D axial or radial heat flux q from a controlled electric heater to a water-cooled sink; Fourier law q = -k·A·dT/dx yields material thermal conductivity.',
      main_components: ['Interchangeable Brass/Steel/Aluminum Specimens', 'Cartridge Electric Heater & Wattmeter', 'Axial/Radial Thermocouple Array', 'Cooling Water Heat Sink'],
      operating_parameters: ['Heater Power Q (W)', 'Axial Temperature Profile T(x) (°C)', 'Thermal Conductivity k (W/m·K)', 'Contact Resistance'],
      safety_hazards: ['Allow heated metallic test sections to cool below 45 °C before swapping specimens', 'Ensure cooling water flow is active before applying heater power']
    },
    {
      id: 'builtin_ht_rad',
      name: 'Stefan-Boltzmann Radiation Apparatus',
      subject: 'heat-transfer',
      category: 'Radiation',
      description: 'Benchtop thermal radiation rig with matte black, oxidized, and polished metallic plates to verify emissivity and the T⁴ radiation law.',
      working_principle: 'Measures net radiative heat transfer between a heated emitter and an instrumented sensor plate governed by q = ε·σ·A·(T_s⁴ - T_∞⁴).',
      main_components: ['Temperature-Controlled Blackbody Emitter', 'Polished & Matte Target Plates', 'Radiometer / Thermopile Sensor', 'Digital Power & Temperature Console'],
      operating_parameters: ['Emitter Temperature T (K)', 'Surface Emissivity ε', 'View Factor / Separation Distance (m)', 'Radiative Heat Flux (W/m²)'],
      safety_hazards: ['High-temperature emitter surface (>200 °C) — severe burn hazard', 'Keep flammable materials clear of the radiation enclosure']
    }
  ],
  'thermodynamics': [
    {
      id: 'builtin_th_marcet',
      name: 'Marcet Boiler (Vapor Pressure Apparatus)',
      subject: 'thermodynamics',
      category: 'Phase Equilibrium',
      description: 'Benchtop pressurized steam boiler for measuring the saturated water vapor-pressure curve and verifying the Clausius-Clapeyron relation.',
      working_principle: 'Heats deionized water in a sealed pressure vessel to measure equilibrium saturation pressure P_sat vs temperature T_sat and derive latent heat of vaporization ΔH_vap.',
      main_components: ['Stainless Steel Pressure Vessel', 'Electric Immersion Heater', 'Bourdon Pressure Gauge & Relief Valve', 'Thermowell Digital Thermometer'],
      operating_parameters: ['Saturation Temperature T_sat (°C)', 'Gauge & Absolute Pressure P (bar)', 'Slope dP/dT (bar/K)', 'Enthalpy of Vaporization ΔH_vap (kJ/kg)'],
      safety_hazards: ['High-pressure steam hazard — never exceed safe working pressure (10 bar)', 'Confirm safety relief valve operation and purge air properly before heating']
    },
    {
      id: 'builtin_th_refrig',
      name: 'Vapor-Compression Refrigeration Unit',
      subject: 'thermodynamics',
      category: 'Thermodynamic Cycles',
      description: 'Instrumented vapor-compression cycle trainer for plotting P-h diagrams and calculating actual vs Carnot Coefficient of Performance (COP).',
      working_principle: 'Circulates refrigerant through a compressor, condenser, expansion valve, and evaporator to reject heat from a low-temperature reservoir to a higher-temperature sink.',
      main_components: ['Hermetic Compressor & Power Meter', 'Water/Air-Cooled Condenser', 'Thermostatic Expansion Valve', 'Evaporator Coil', 'High/Low Pressure Gauges & 4 Thermocouples'],
      operating_parameters: ['Evaporator & Condenser Pressures (bar)', 'Cycle State Temperatures T1–T4 (°C)', 'Compressor Work W_in (W)', 'COP_actual & COP_Carnot'],
      safety_hazards: ['Do not open refrigerant lines — pressurized fluorocarbon/hydrocarbon fluid', 'Avoid touching hot compressor discharge tubing']
    },
    {
      id: 'builtin_th_calorimeter',
      name: 'Oxygen Bomb Calorimeter',
      subject: 'thermodynamics',
      category: 'Thermochemistry',
      description: 'Constant-volume combustion calorimeter for determining higher heating value (HHV) and enthalpy of combustion of solid and liquid fuels.',
      working_principle: 'Ignites a weighed fuel sample in pressurized O₂ inside a rigid steel bomb immersed in a known water bath; temperature rise ΔT gives ΔU_c = -C_cal·ΔT.',
      main_components: ['High-Pressure Stainless Steel Bomb', 'Insulated Water Jacket & Stirrer', 'Ignition Wire & Firing Box', 'Precision 0.001 °C Digital Thermometer'],
      operating_parameters: ['Sample Mass m (g)', 'Water Bath Temperature Rise ΔT (K)', 'Calorimeter Heat Capacity C_cal (kJ/K)', 'Higher Heating Value HHV (MJ/kg)'],
      safety_hazards: ['High-pressure oxygen (25–30 bar) — keep all oil/grease away from O₂ fittings', 'Stand clear of the bomb head during ignition and depressurize slowly after firing']
    }
  ],
  'mass-transfer': [
    {
      id: 'builtin_mt_absorber',
      name: 'Packed-Bed Gas Absorption Column',
      subject: 'mass-transfer',
      category: 'Gas-Liquid Mass Transfer',
      description: 'Glass column packed with Raschig rings for studying CO₂/NH₃ gas absorption into aqueous solvent, pressure drop, flooding, and K_Ga.',
      working_principle: 'Counter-current contact between rising gas mixture and descending liquid film drives interphase solute diffusion governed by two-film mass transfer theory.',
      main_components: ['Borosilicate Glass Column with Raschig Rings', 'Gas & Liquid Rotameters', 'Differential Manometer', 'Inlet/Outlet Gas Analyzer & Sample Ports'],
      operating_parameters: ['Gas & Liquid Flow Rates (L/min)', 'Column Pressure Drop ΔP/Z (Pa/m)', 'Outlet Mole Fraction y_out', 'HTU / NTU & K_La'],
      safety_hazards: ['Operate inside ventilated lab space when using CO₂, NH₃, or caustic solvents', 'Wear chemical splash goggles and nitrile gloves during liquid titration sampling']
    },
    {
      id: 'builtin_mt_dryer',
      name: 'Tray Dryer (Drying Kinetics Unit)',
      subject: 'mass-transfer',
      category: 'Drying',
      description: 'Forced-convection heated air tunnel with digital balance for measuring moisture content vs time, constant-rate, and falling-rate drying curves.',
      working_principle: 'Simultaneous convective heat transfer to wet solid trays and diffusive water vapor mass transfer into unsaturated heated air until equilibrium moisture content is reached.',
      main_components: ['Variable-Speed Blower & Duct Heater', 'Suspended Perforated Sample Trays', 'In-Situ Digital Load Cell', 'Dry-Bulb / Wet-Bulb Psychrometer'],
      operating_parameters: ['Air Temperature (°C) & Velocity (m/s)', 'Relative Humidity (%)', 'Dry-Basis Moisture X (kg/kg)', 'Drying Rate N (kg/m²·h)'],
      safety_hazards: ['Duct heating elements reach high temperatures — start blower before energizing heater', 'Use heat-resistant gloves when unloading hot sample trays']
    },
    {
      id: 'builtin_mt_diffusion',
      name: 'Liquid-Liquid & Gas Diffusion Cell',
      subject: 'mass-transfer',
      category: 'Molecular Diffusion',
      description: 'Stefan tube and conductivity diaphragm cell apparatus for measuring binary molecular diffusivity D_AB in gases and dilute liquids.',
      working_principle: 'Monitors evaporation level drop or conductivity drift over time to solve Fick first and second laws for the binary diffusion coefficient D_AB.',
      main_components: ['Precision Capillary Stefan Tube', 'Thermostatted Water Bath', 'Traveling Microscope / Vernier Scale', 'Conductivity Probe & Data Logger'],
      operating_parameters: ['Temperature T (K)', 'Liquid Meniscus Drop Δz (mm)', 'Elapsed Time t (s)', 'Binary Diffusivity D_AB (m²/s)'],
      safety_hazards: ['Volatile organic solvents (acetone/ethanol) must be kept away from ignition sources', 'Operate volatile Stefan-tube runs under local fume extraction']
    }
  ],
  'separation-processes': [
    {
      id: 'builtin_sp_distill',
      name: 'Continuous Sieve-Tray Distillation Column',
      subject: 'separation-processes',
      category: 'Distillation',
      description: 'Multi-stage glass sieve-tray column with electric reboiler, total condenser, and adjustable reflux ratio for McCabe-Thiele stage efficiency studies.',
      working_principle: 'Separates binary liquid mixtures (e.g., ethanol-water) based on relative volatility α through repeated vapor-liquid contact across counter-current equilibrium stages.',
      main_components: ['8-Tray Borosilicate Column', 'Electrically Heated Reboiler', 'Overhead Condenser & Reflux Splitter', 'Feed Preheater & Refractometer'],
      operating_parameters: ['Reflux Ratio R', 'Reboiler Duty (W)', 'Tray Temperature Profile (°C)', 'Distillate & Bottoms Composition (x_D, x_B)'],
      safety_hazards: ['Flammable alcohol vapors — verify condenser cooling water is flowing before heating reboiler', 'Inspect glass flange seals for leaks and ensure fume extraction is active']
    },
    {
      id: 'builtin_sp_lle',
      name: 'Liquid-Liquid Extraction Column',
      subject: 'separation-processes',
      category: 'Extraction',
      description: 'Counter-current packed/pulsed extraction column for separating a solute between immiscible aqueous and organic liquid phases.',
      working_principle: 'Transfers solute preferentially from the raffinate phase into an immiscible extract solvent driven by liquid-liquid partition equilibrium (K_D).',
      main_components: ['Glass Extraction Column with Packing', 'Feed & Solvent Metering Pumps', 'Interface Level Controller', 'Raffinate & Extract Sampling Valves'],
      operating_parameters: ['Solvent-to-Feed Ratio (S/F)', 'Dispersed Phase Holdup', 'Extract & Raffinate Concentrations', 'Extraction Efficiency (%)'],
      safety_hazards: ['Organic extraction solvents are flammable and volatile — keep away from sparks', 'Dispose of organic/aqueous waste streams in labeled hazardous waste carboys']
    },
    {
      id: 'builtin_sp_ro',
      name: 'Reverse Osmosis Membrane Module',
      subject: 'separation-processes',
      category: 'Membrane Separation',
      description: 'Cross-flow spiral-wound RO/UF membrane skid for studying permeate flux, salt rejection, and concentration polarization vs transmembrane pressure.',
      working_principle: 'Applies hydraulic pressure exceeding osmotic pressure (ΔP > Δπ) to force pure solvent across a semi-permeable membrane while rejecting dissolved solutes.',
      main_components: ['High-Pressure Feed Pump', 'Spiral-Wound TFC Membrane Housing', 'Back-Pressure Needle Valve', 'Permeate & Retentate Flow/Conductivity Meters'],
      operating_parameters: ['Transmembrane Pressure ΔP (bar)', 'Permeate Flux J_w (LMH)', 'Salt Rejection R (%)', 'Recovery Ratio (%)'],
      safety_hazards: ['High-pressure feed lines — never exceed manufacturer TMP limit', 'Gradually open back-pressure valve to depressurize before servicing']
    }
  ],
  'reaction-engineering': [
    {
      id: 'builtin_re_cstr',
      name: 'Continuous Stirred Tank Reactor (CSTR) Rig',
      subject: 'reaction-engineering',
      category: 'Chemical Reactors',
      description: 'Jacketed stirred vessel with dual peristaltic feed pumps and inline conductivity sensor for studying saponification kinetics and residence time distribution (RTD).',
      working_principle: 'Assumes complete back-mixing so reactor interior equals outlet composition; steady-state design follows V = F_A0·X / (-r_A) and tracer step/pulse tests yield E(t).',
      main_components: ['Jacketed Glass Reactor Vessel', 'Variable-Speed Impeller Agitator', 'Dual Reagent Metering Pumps', 'Inline Conductivity & Temperature Probes'],
      operating_parameters: ['Space Time τ (min)', 'Feed Molar Ratio', 'Reactor Temperature (°C)', 'Fractional Conversion X'],
      safety_hazards: ['Sodium hydroxide & ethyl acetate reagents — wear splash goggles and chemical gloves', 'Verify impeller guard is secure before powering agitator']
    },
    {
      id: 'builtin_re_pfr',
      name: 'Plug Flow Tubular Reactor (PFR) Unit',
      subject: 'reaction-engineering',
      category: 'Chemical Reactors',
      description: 'Coiled isothermal tubular reactor submerged in a temperature-controlled bath for measuring axial conversion profiles and comparing CSTR vs PFR sizing.',
      working_principle: 'Fluid elements move axially with minimal back-mixing so conversion increases monotonically along reactor length according to V = F_A0 ∫ dX/(-r_A).',
      main_components: ['Helical Glass/PTFE Tubular Coil', 'Thermostatted Water Bath', 'Premixing Tee & Feed Pumps', 'Outlet Conductivity/Sampling Cell'],
      operating_parameters: ['Volumetric Flow Rate v₀ (mL/min)', 'Bath Temperature T (°C)', 'Space Time τ (min)', 'Conversion X & Rate Constant k'],
      safety_hazards: ['Check tubing connections for caustic/organic leaks before pressurizing feed pumps', 'Neutralize spent alkaline reaction effluent prior to lab disposal']
    },
    {
      id: 'builtin_re_batch',
      name: 'Isothermal Batch Reactor',
      subject: 'reaction-engineering',
      category: 'Chemical Reactors',
      description: 'Jacketed stirred batch flask with digital pH/conductivity logging for integral & differential reaction order determination and Arrhenius Ea estimation.',
      working_principle: 'Closed well-mixed vessel where species concentration evolves over batch time t following -dC_A/dt = k·C_A^n; runs at multiple temperatures yield activation energy E_a.',
      main_components: ['Jacketed Reaction Flask', 'Magnetic / Overhead Stirrer', 'Circulating Water Bath', 'Continuous Data Acquisition Probe'],
      operating_parameters: ['Reaction Time t (s)', 'Initial Concentration C_A0 (mol/L)', 'Temperature T (K)', 'Rate Constant k & Activation Energy Ea'],
      safety_hazards: ['Add reactive reagents slowly to control exothermic temperature spikes', 'Keep eyewash station accessible and wear full lab PPE']
    }
  ],
  'particulate-technology': [
    {
      id: 'builtin_pt_ballmill',
      name: 'Laboratory Ball Mill',
      subject: 'particulate-technology',
      category: 'Comminution',
      description: 'Variable-speed cylindrical tumbling mill with steel/ceramic grinding media for studying critical speed, Bond work index, and size reduction kinetics.',
      working_principle: 'Grinds brittle solids by impact and attrition from cascading/cataracting balls; optimal milling occurs around 65–75% of critical speed N_c = (1/2π)√(g/(R-r)).',
      main_components: ['Rotating Cylindrical Drum', 'Steel/Ceramic Grinding Balls', 'Variable-Speed Drive & Tachometer', 'Power Meter & Product Discharge Screen'],
      operating_parameters: ['Rotational Speed (% of N_c)', 'Grinding Time (min)', 'Ball-to-Powder Charge Ratio', 'Reduction Ratio d80_feed / d80_prod'],
      safety_hazards: ['Pinch/entanglement hazard — keep safety guard interlocked during drum rotation', 'Wear dust mask and hearing protection when operating and discharging fine powders']
    },
    {
      id: 'builtin_pt_sieve',
      name: 'Ro-Tap Sieve Shaker Stack',
      subject: 'particulate-technology',
      category: 'Particle Sizing',
      description: 'Standard ASTM/Tyler mesh sieve stack with mechanical tapping shaker for particle size distribution (PSD), differential/cumulative curves, and Sauter mean diameter.',
      working_principle: 'Classifies granular solids by aperture size through combined rotary sifting and vertical tapping to compute mass fractions, d_50, and specific surface area.',
      main_components: ['ASTM Standard Wire-Mesh Sieve Stack', 'Mechanical Vibratory/Tapping Shaker', 'Catch Pan & Lid', 'Analytical Top-Loading Balance'],
      operating_parameters: ['Sieve Aperture Size (µm)', 'Mass Retained (g)', 'Cumulative Undersize (%)', 'Sauter Mean Diameter d_32 (µm)'],
      safety_hazards: ['Fine dust inhalation hazard — wear N95 dust mask during pouring and brushing sieves', 'Secure clamping rods tightly before starting the mechanical shaker']
    },
    {
      id: 'builtin_pt_fluidbed',
      name: 'Gas-Solid Fluidized Bed Column',
      subject: 'particulate-technology',
      category: 'Fluidization',
      description: 'Transparent acrylic column with porous distributor plate for measuring Ergun fixed-bed pressure drop, minimum fluidization velocity u_mf, and bed expansion.',
      working_principle: 'Upward air velocity increases drag on solid particles until bed pressure drop balances buoyant bed weight (ΔP = (1-ε)(ρ_p - ρ_f)gL), transitioning from fixed to fluidized bed.',
      main_components: ['Acrylic Fluidization Column', 'Sintered Porous Air Distributor', 'Air Rotameter & Regulating Valve', 'Differential Pressure Manometer & Bed Scale'],
      operating_parameters: ['Superficial Air Velocity u_0 (m/s)', 'Bed Pressure Drop ΔP (Pa)', 'Expanded Bed Height H (cm)', 'Minimum Fluidization Velocity u_mf (m/s)'],
      safety_hazards: ['Ensure exhaust dust filter/bag is fitted at column top to prevent particle entrainment into eyes', 'Increase air valve gradually to prevent violent slugging of glass beads/sand']
    }
  ],
  'process-control': [
    {
      id: 'builtin_pc_pid',
      name: 'PID Level & Flow Control Trainer',
      subject: 'process-control',
      category: 'Feedback Control',
      description: 'Process control loop bench with level/flow transmitters, motorized control valve, and digital PID controller for step-response and Ziegler-Nichols tuning.',
      working_principle: 'Continuously compares measured process variable (PV) against setpoint (SP) and drives a final control element via P, I, and D actions to reject load disturbances.',
      main_components: ['Process Tank & Circulation Pump', 'Differential Pressure Level Transmitter', 'Pneumatic/Motorized Control Valve', 'Digital PID Controller & DAQ'],
      operating_parameters: ['Proportional Gain Kc', 'Integral Time τ_I (s)', 'Derivative Time τ_D (s)', 'Overshoot (%), Settling Time (s), ISE'],
      safety_hazards: ['Verify tank overflow drain is unobstructed before introducing large step changes', 'Keep electronics console dry and check emergency stop button']
    },
    {
      id: 'builtin_pc_cascade',
      name: 'Cascade Thermal Control Loop Bench',
      subject: 'process-control',
      category: 'Advanced Control',
      description: 'Heated stirred tank with primary temperature controller cascading onto a secondary jacket-flow or heater-power slave loop.',
      working_principle: 'The fast inner (slave) loop rejects utility supply disturbances immediately before they propagate to the slower outer (master) product temperature variable.',
      main_components: ['Heated Process Vessel & Jacket', 'Primary & Secondary RTD Sensors', 'Dual-Loop Cascade Controller', 'Disturbance Injection Valve'],
      operating_parameters: ['Master Setpoint T_sp (°C)', 'Slave Flow/Power Output (%)', 'Disturbance Rejection Peak Error (°C)', 'Dead Time θ & Time Constant τ'],
      safety_hazards: ['Hot fluid & electric heater hazard — verify high-temperature cut-out interlock is enabled', 'Do not leave heated tank unattended during manual open-loop step tests']
    },
    {
      id: 'builtin_pc_valve',
      name: 'Control Valve Cv Characteristic Rig',
      subject: 'process-control',
      category: 'Final Control Elements',
      description: 'Test bench with linear, equal-percentage, and quick-opening control valves for determining inherent vs installed flow characteristics and Cv.',
      working_principle: 'Measures volumetric flow rate Q and valve pressure drop ΔP across 0–100% stem travel to evaluate valve flow coefficient Cv = Q√(SG/ΔP) and rangeability.',
      main_components: ['Linear & Equal-Percentage Pneumatic Valves', 'I/P Transducer (4–20 mA to 3–15 psig)', 'Upstream/Downstream Pressure Transmitters', 'Turbine Flowmeter'],
      operating_parameters: ['Valve Opening / Stem Travel (%)', 'Pressure Drop ΔP (psi / bar)', 'Flow Coefficient Cv', 'Valve Authority'],
      safety_hazards: ['Keep fingers clear of pneumatic actuator stem during stroking', 'Verify regulated instrument air supply does not exceed actuator maximum rating']
    }
  ]
};

export default function LabSubjectHub() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<any | null>(null);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [savedLabs, setSavedLabs] = useState<any[]>([]);
  
  // Format subject title (e.g. fluid-mechanics -> Fluid Mechanics)
  const title = subjectId?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const localStorageKey = `chembase_custom_lab_eq_${subjectId}`;
  const savedLabsLocalKey = `chembase_saved_labs_${subjectId}`;

  const getLocalEquipment = (): any[] => {
    try {
      const raw = localStorage.getItem(localStorageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const getLocalSavedLabs = (): any[] => {
    try {
      const raw = localStorage.getItem(savedLabsLocalKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const buildDefaultExperiments = (eq: any) => [
    {
      id: `builtin_${eq.id}_1`,
      name: `${eq.name} — Performance & Efficiency Characterization`,
      typical_objective: `Measure operating curves, throughput, and energy efficiency of the ${eq.name} across varying flow/load conditions.`,
    },
    {
      id: `builtin_${eq.id}_2`,
      name: `${eq.name} — Steady-State Mass & Energy Balance`,
      typical_objective: `Perform inlet-outlet mass and thermal/hydraulic energy balance verification on the ${eq.name} and quantify losses.`,
    },
    {
      id: `builtin_${eq.id}_3`,
      name: `${eq.name} — Operating Limits & Safety Margin Study`,
      typical_objective: `Identify safe operating envelope, pressure drop / cavitation / flooding limits, and error analysis for ${eq.name}.`,
    },
  ];

  // Declarations moved up to fix linter error
  const fetchEquipment = async () => {
    const localItems = getLocalEquipment();
    const builtinItems = DEFAULT_EQUIPMENT_BY_SUBJECT[subjectId || ''] || [];
    const mergeUnique = (remote: any[]) => {
      const seen = new Set<string>();
      const merged: any[] = [];
      for (const item of [...remote, ...builtinItems, ...localItems]) {
        const key = String(item.name || item.id).trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(item);
        }
      }
      return merged;
    };

    try {
      const { data } = await supabase
        .from('chembase_equipment_knowledge')
        .select('*')
        .eq('subject', subjectId)
        .order('name');
      setEquipmentList(mergeUnique(data || []));
    } catch (err) {
      console.error(err);
      setEquipmentList(mergeUnique([]));
    }
  };

  const fetchSavedLabs = async () => {
    const localSaved = getLocalSavedLabs();
    try {
      const { data } = await supabase
        .from('lab_analytics_records')
        .select(`
          id, 
          created_at,
          objective,
          chembase_equipment_knowledge(name),
          chembase_experiment_knowledge(name)
        `)
        .eq('subject', subjectId)
        .order('created_at', { ascending: false });
      const remoteList = data || [];
      const seen = new Set(remoteList.map((r: any) => String(r.id)));
      const combined = [...remoteList, ...localSaved.filter((l: any) => !seen.has(String(l.id)))]
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setSavedLabs(combined);
    } catch (err) {
      console.error(err);
      setSavedLabs(localSaved);
    }
  };

  useEffect(() => {
    setSelectedEquipment(null);
    setExperiments([]);
    fetchEquipment();
    fetchSavedLabs();
  }, [subjectId]);

  const handleSelectEquipment = async (eq: any) => {
    setSelectedEquipment(eq);
    try {
      if (String(eq.id).startsWith('local_') || String(eq.id).startsWith('builtin_')) {
        setExperiments(buildDefaultExperiments(eq));
        return;
      }
      const { data } = await supabase
        .from('chembase_experiment_knowledge')
        .select('*')
        .eq('equipment_id', eq.id)
        .order('name');
      setExperiments(data && data.length > 0 ? data : buildDefaultExperiments(eq));
    } catch {
      setExperiments(buildDefaultExperiments(eq));
    }
  };

  // Add Custom Equipment Logic
  const [isAddEquipmentModalOpen, setIsAddEquipmentModalOpen] = useState(false);
  const [newEqName, setNewEqName] = useState('');
  const [newEqDesc, setNewEqDesc] = useState('');
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);

  const handleAddCustomEquipment = async () => {
    if (!newEqName.trim()) return;
    setIsGeneratingProfile(true);
    try {
      const fallbackProfile = {
        working_principle: newEqDesc.trim() || `${newEqName.trim()} operates by transferring momentum, heat, or mass under controlled laboratory conditions for ${title}.`,
        operating_principle: `Verify calibration, establish steady-state flow/temperature, record replicate readings, and perform uncertainty analysis.`,
        main_components: ['Primary Process Section', 'Flow / Pressure Instrumentation', 'Control Valve & Bypass', 'Data Acquisition Sensor'],
        operating_parameters: ['Flow Rate', 'Pressure Drop (ΔP)', 'Temperature (T)', 'Efficiency / Conversion'],
        safety_hazards: ['Pressurized lines — inspect fittings before startup', 'Wear safety goggles and lab coat at all times']
      };

      let profile = fallbackProfile;
      try {
        const res = await sendAutoRoutedChat({
          systemPrompt: 'You are a chemical engineering lab equipment expert. Return ONLY valid JSON.',
          messages: [
            {
              role: 'user',
              content: `Generate a JSON profile for chemical engineering lab equipment "${newEqName}" in "${title}". Description: "${newEqDesc}". Keys: working_principle, operating_principle, main_components[], operating_parameters[], safety_hazards[].`,
            },
          ],
          timeoutMs: 18000,
          maxTokens: 1500,
        });
        if (res.ok && res.text) {
          const parsed = extractCleanJsonObject(res.text) as Record<string, any> | null;
          if (parsed?.working_principle) profile = { ...fallbackProfile, ...parsed };
        }
      } catch {
        // Use structured engineering fallback profile
      }

      const { data: user } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
      if (user?.user) {
        const { error } = await supabase.from('chembase_equipment_knowledge').insert({
          user_id: user.user.id,
          is_custom: true,
          subject: subjectId,
          category: 'Custom',
          name: newEqName.trim(),
          description: newEqDesc.trim(),
          ...profile,
        });
        if (!error) {
          setIsAddEquipmentModalOpen(false);
          setNewEqName('');
          setNewEqDesc('');
          fetchEquipment();
          return;
        }
      }

      // Guest / offline fallback: persist cleanly in localStorage
      const existing = getLocalEquipment();
      const localItem = {
        id: `local_${Date.now()}`,
        is_custom: true,
        subject: subjectId,
        category: 'Custom',
        name: newEqName.trim(),
        description: newEqDesc.trim(),
        ...profile,
      };
      localStorage.setItem(localStorageKey, JSON.stringify([...existing, localItem]));
      setIsAddEquipmentModalOpen(false);
      setNewEqName('');
      setNewEqDesc('');
      fetchEquipment();
    } finally {
      setIsGeneratingProfile(false);
    }
  };

  const [isVivaOpen, setIsVivaOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 mt-6 relative z-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-900 border border-surface-200/50 dark:border-surface-50/10 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (selectedEquipment) {
                setSelectedEquipment(null);
                setExperiments([]);
              } else {
                navigate('/advanced/lab-assistant');
              }
            }} 
            className="p-2 bg-surface-800 hover:bg-surface-700 text-white rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {selectedEquipment ? selectedEquipment.name : title}
            </h1>
            <p className="text-surface-400 text-sm font-medium">
              {selectedEquipment ? 'Select an experiment or create a new lab' : 'Select laboratory equipment'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!selectedEquipment && (
            <button 
              onClick={() => setIsAddEquipmentModalOpen(true)}
              className="btn-tactile flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-sm shadow-[0_0_20px_rgba(138,203,193,0.3)]"
            >
              <Plus className="w-4 h-4" /> Custom Equipment
            </button>
          )}
          <button 
            onClick={() => setIsVivaOpen(true)}
            className="btn-tactile flex items-center gap-2 px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white font-semibold rounded-xl text-sm shadow-[0_0_20px_rgba(219,176,87,0.3)]"
          >
            <PlayCircle className="w-4 h-4" /> Start Viva
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {!selectedEquipment ? (
        // Equipment Selection Grid
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary-500" /> Available Equipment
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipmentList.map(eq => (
              <div 
                key={eq.id} 
                onClick={() => handleSelectEquipment(eq)}
                className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-3xl p-6 shadow-sm hover:border-primary-400 hover:shadow-xl transition-all cursor-pointer group flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Beaker className="w-6 h-6" />
                  </div>
                  {eq.is_custom && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-accent-500 bg-accent-50 dark:bg-accent-900/30 px-2 py-1 rounded-lg">Custom</span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2 group-hover:text-primary-500 transition-colors">{eq.name}</h3>
                <p className="text-sm text-surface-500 line-clamp-3 mb-6 flex-grow">{eq.description || eq.working_principle || 'No description available.'}</p>
                
                <div className="flex items-center justify-between text-xs font-bold text-primary-600 dark:text-primary-400 mt-auto">
                  <span>View Experiments</span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>

          {/* Saved Labs Section (Only show at root subject level) */}
          <div className="mt-12 pt-8 border-t border-surface-200 dark:border-surface-800">
            <h2 className="text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2 mb-6">
              <FileText className="w-6 h-6 text-accent-500" /> Saved Laboratories
            </h2>
            
            {savedLabs.length === 0 ? (
              <p className="text-surface-500 text-sm">No saved labs yet for this subject.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedLabs.map(lab => (
                  <div
                    key={lab.id}
                    onClick={() => navigate(`/advanced/lab-assistant/${subjectId}/workspace?record=${encodeURIComponent(lab.id)}`)}
                    className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl p-5 shadow-sm hover:border-accent-400 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="text-[10px] font-bold text-accent-500 uppercase tracking-wider line-clamp-1">
                        {lab.chembase_equipment_knowledge?.name || lab.equipment_name || 'Lab Equipment'} • {lab.chembase_experiment_knowledge?.name || lab.experiment_name || 'Custom Exp'}
                      </div>
                      {String(lab.id).startsWith('local_lab_') && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-700 text-surface-500 shrink-0">Local</span>
                      )}
                    </div>
                    <h4 className="font-bold text-surface-900 dark:text-white text-base mb-2 group-hover:text-accent-500 line-clamp-2">{lab.objective}</h4>
                    <div className="flex items-center justify-between text-xs text-surface-400">
                      <span>{new Date(lab.created_at).toLocaleDateString()}</span>
                      <span className="font-semibold text-primary-600 dark:text-primary-400 group-hover:translate-x-0.5 transition-transform">Open &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Equipment Details & Experiments
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-6 border-primary-200 dark:border-primary-900/50">
              <h3 className="text-sm font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Info className="w-4 h-4" /> Equipment Profile
              </h3>
              
              <div className="space-y-4 text-sm text-surface-600 dark:text-surface-300">
                <div>
                  <strong className="block text-surface-900 dark:text-white mb-1">Working Principle</strong>
                  <p>{selectedEquipment.working_principle || 'Not specified'}</p>
                </div>
                {selectedEquipment.main_components?.length > 0 && (
                  <div>
                    <strong className="block text-surface-900 dark:text-white mb-1">Main Components</strong>
                    <ul className="list-disc pl-4 space-y-1">
                      {selectedEquipment.main_components.map((c: string, i: number) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
                {selectedEquipment.safety_hazards?.length > 0 && (
                  <div>
                    <strong className="block text-rose-600 dark:text-rose-400 mb-1">Key Hazards</strong>
                    <ul className="list-disc pl-4 space-y-1 text-rose-700/80 dark:text-rose-300/80">
                      {selectedEquipment.safety_hazards.map((h: string, i: number) => <li key={i}>{h}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
                <TestTubes className="w-6 h-6 text-accent-500" /> Standard Experiments
              </h2>
              <button 
                onClick={() => navigate(`/advanced/lab-assistant/${subjectId}/workspace?eq=${selectedEquipment.id}`)}
                className="btn-tactile text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500"
              >
                + Custom Experiment
              </button>
            </div>

            {experiments.length === 0 ? (
              <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-3xl p-12 text-center shadow-sm">
                <Activity className="w-8 h-8 text-surface-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">No built-in experiments</h3>
                <p className="text-surface-500 text-sm max-w-md mx-auto mb-6">
                  You can still create a lab using this equipment by defining your own objective.
                </p>
                <button 
                  onClick={() => navigate(`/advanced/lab-assistant/${subjectId}/workspace?eq=${selectedEquipment.id}`)}
                  className="btn-tactile inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl text-sm"
                >
                  Create Custom Lab
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {experiments.map(exp => (
                  <div key={exp.id} className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl p-6 shadow-sm hover:border-primary-400 transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-surface-900 dark:text-white text-lg mb-1 group-hover:text-primary-500 transition-colors">{exp.name}</h4>
                      <p className="text-sm text-surface-500 line-clamp-2">{exp.typical_objective}</p>
                    </div>
                    <button 
                      onClick={() => navigate(`/advanced/lab-assistant/${subjectId}/workspace?eq=${selectedEquipment.id}&exp=${exp.id}`)}
                      className="btn-tactile whitespace-nowrap px-4 py-2 bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-white font-semibold rounded-xl text-sm group-hover:bg-primary-600 group-hover:text-white transition-colors"
                    >
                      Start Lab
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      )}

      {/* Viva Modal */}
      {isVivaOpen && (
        <VivaModal subject={subjectId || ''} equipment={selectedEquipment} onClose={() => setIsVivaOpen(false)} />
      )}

      {/* Add Custom Equipment Modal */}
      {isAddEquipmentModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-surface-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-surface-200 dark:border-surface-800">
            <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-4">Add Custom Equipment</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider block mb-1">Equipment Name</label>
                <input 
                  type="text" 
                  value={newEqName}
                  onChange={e => setNewEqName(e.target.value)}
                  placeholder="e.g. Orifice Meter"
                  className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider block mb-1">Description</label>
                <textarea 
                  value={newEqDesc}
                  onChange={e => setNewEqDesc(e.target.value)}
                  placeholder="Brief description of the equipment setup..."
                  className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-primary-500 resize-none h-24"
                />
              </div>
            </div>
            
            {isGeneratingProfile && (
              <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse">
                <Activity className="w-4 h-4" /> AI is generating knowledge profile...
              </div>
            )}
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setIsAddEquipmentModalOpen(false)}
                disabled={isGeneratingProfile}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddCustomEquipment}
                disabled={!newEqName.trim() || isGeneratingProfile}
                className="btn-tactile flex-1 py-2.5 rounded-xl font-bold text-sm bg-primary-600 text-white disabled:bg-surface-300 dark:disabled:bg-surface-700 disabled:cursor-not-allowed transition-colors"
              >
                {isGeneratingProfile ? 'Saving...' : 'Add Equipment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
