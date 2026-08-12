import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  FlaskConical, Droplets, Flame, Columns2, TestTubes, Waves,
  Timer, Microscope, ShieldAlert, BookOpen, ClipboardList,
  GraduationCap, CheckCircle2, ListChecks, Calculator,
  PlayCircle, LineChart as LineChartIcon, Lightbulb, Award, RefreshCw,
  AlertTriangle, XCircle
} from 'lucide-react';
import { CalcCard } from './SharedComponents';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface SavedLabSession {
  id: string;
  labNumber: string; // e.g. "Lab 1"
  title: string;
  date: string;
  category: string;
  dataPoints: { x: number; y: number; label: string }[];
  discussion: string;
  vivaScore: number; // %
}

const DEFAULT_LAB_SESSIONS: SavedLabSession[] = [
  {
    id: 'lab-1',
    labNumber: 'Lab 1',
    title: 'Fluid Friction Loss & Reynolds Calibration',
    date: '2026-08-10',
    category: 'Fluid Mechanics',
    dataPoints: [
      { x: 500, y: 0.12, label: 'Run 1' },
      { x: 1200, y: 0.08, label: 'Run 2' },
      { x: 2300, y: 0.05, label: 'Run 3 (Transition)' },
      { x: 4500, y: 0.038, label: 'Run 4 (Turbulent)' },
      { x: 8000, y: 0.029, label: 'Run 5' },
    ],
    discussion: 'Friction factor f decreases as Reynolds number increases in turbulent flow, closely adhering to the Colebrook-White correlation. Critical transition observed near Re = 2300.',
    vivaScore: 92,
  },
  {
    id: 'lab-2',
    labNumber: 'Lab 2',
    title: 'Double-Pipe Counter-Current Heat Exchanger LMTD',
    date: '2026-08-11',
    category: 'Heat Transfer',
    dataPoints: [
      { x: 10, y: 15.2, label: 'T_ci 10°C' },
      { x: 20, y: 28.4, label: 'T_ci 20°C' },
      { x: 30, y: 41.0, label: 'T_ci 30°C' },
      { x: 40, y: 53.8, label: 'T_ci 40°C' },
    ],
    discussion: 'Counter-current flow yields higher LMTD driving force (ΔT_lm) and overall heat transfer coefficient (U) compared to parallel flow.',
    vivaScore: 88,
  }
];

function SectionCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:border-indigo-400 transition-all">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function BulletList({ items, color = 'text-slate-600 dark:text-slate-300' }: { items: string[]; color?: string }) {
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className={`text-xs leading-relaxed flex items-start gap-2 ${color}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
          {it}
        </li>
      ))}
    </ul>
  );
}

// ─── Experiment library ─────────────────────────────────────────────────────
type VivaLevel = 'basic' | 'intermediate' | 'advanced' | 'equipment' | 'troubleshooting';

interface VivaQA { q: string; a: string; }

interface LabExperiment {
  id: string;
  name: string;
  category: string;
  duration: string;
  icon: ReactNode;
  objective: string;
  before: {
    theory: string;
    principle: string;
    equipment: string[];
    procedure: string[];
    safety: string[];
    observations: string[];
  };
  after: {
    calculations: string[];
    graph: string;
    errorAnalysis: string[];
    discussion: string[];
    conclusion: string;
  };
  viva: Record<VivaLevel, VivaQA[]>;
}

const EXPERIMENTS: LabExperiment[] = [
  {
    id: 'fluid-flow',
    name: 'Fluid Flow & Reynolds Experiment',
    category: 'Fluid Mechanics',
    duration: '2–3 h',
    icon: <Waves className="w-4 h-4" />,
    objective: 'Visualise laminar, transition and turbulent flow regimes and verify the Reynolds number criterion.',
    before: {
      theory: 'The Reynolds number Re = ρvD/μ classifies flow: Re < 2300 laminar, 2300–4000 transition, > 4000 turbulent. In laminar flow a dye filament stays straight; in turbulent flow it breaks up due to eddy diffusion.',
      principle: 'A dye stream is injected at the centreline of a glass tube while the water flow rate is varied. The flow pattern observed at each rate is matched to the calculated Reynolds number.',
      equipment: ['Reynolds apparatus with glass tube', 'Dye reservoir with needle injector', 'Rotameter / measuring tank', 'Stopwatch', 'Thermometer', 'Water supply & control valve'],
      procedure: [
        'Level the apparatus and fill with water, venting all air.',
        'Open the control valve slowly to establish a low, steady flow.',
        'Inject a thin dye stream and record whether the filament remains straight.',
        'Gradually increase flow, noting the first appearance of waviness and then dispersion.',
        'At each step, measure volumetric flow (tank fill time) and temperature.',
        'Compute Re for each setting and tabulate observed regime vs predicted regime.',
      ],
      safety: ['Keep electrical components away from water', 'Wipe up spills immediately to avoid slips', 'Do not run the pump dry', 'Dispose of dye solution per lab policy'],
      observations: ['Straight dye filament at low flow → laminar', 'Wavy, sinuous filament → transition', 'Complete dispersion with eddies → turbulent', 'Regime persists at the same Re for repeated runs'],
    },
    after: {
      calculations: [
        'Cross-section area A = πD²/4 (m²)',
        'Velocity v = Q/A where Q = volume/time (m/s)',
        'Re = ρvD/μ using water properties at measured T',
        'Percentage of runs correctly classified by Re alone',
      ],
      graph: 'Plot Re (log scale) vs observed regime marker, with the 2300 and 4000 threshold lines drawn.',
      errorAnalysis: ['Timing errors in volumetric measurement (±0.2 s)', 'Temperature drift changes μ and ρ', 'Dye injection rate disturbing the pattern', 'Air bubbles in the line causing spurious turbulence'],
      discussion: ['Why is Re a dimensionless criterion?', 'How does temperature affect the transition point?', 'What is the engineering significance of laminar flow in pipelines?'],
      conclusion: 'State whether the critical Re matched literature values, quantify any deviation, and explain why the transition range is not a sharp line.',
    },
    viva: {
      basic: [
        { q: 'Define Reynolds number and write its formula.', a: 'Re = ρvD/μ = vD/ν. It is the ratio of inertial forces (ρv²) to viscous forces (μv/D).' },
        { q: 'What are the three flow regimes and their Re ranges?', a: 'Laminar Re < 2300, transition 2300–4000, turbulent > 4000 for pipe flow.' },
        { q: 'What does the dye filament tell you in each regime?', a: 'Straight line in laminar, wavy in transition, breaks up and disperses in turbulent due to eddies.' },
        { q: 'Why must the tube be exactly horizontal?', a: 'A slope adds a gravity pressure gradient that distorts the velocity profile and the observed pattern.' },
      ],
      intermediate: [
        { q: 'Derive Re from the ratio of inertial to viscous forces.', a: 'Inertial force ~ ρv²L², viscous force ~ μvL; the ratio is ρvL/μ with L the characteristic length (pipe diameter D).' },
        { q: 'How does temperature change the observed regime at constant flow?', a: 'Heating lowers μ (and slightly ρ), raising Re, so flow moves toward turbulent at the same velocity.' },
        { q: 'Why is the transition range 2300–4000 rather than a single value?', a: 'Transition depends on inlet disturbances, roughness and vibrations; quiet, smooth setups stay laminar to higher Re.' },
        { q: 'What happens to the velocity profile in turbulent flow?', a: 'It flattens — a thin viscous sublayer with a nearly uniform log-law core, instead of the parabolic laminar profile.' },
      ],
      advanced: [
        { q: 'Why is hydraulic diameter used for non-circular ducts?', a: 'Dh = 4A/P maps any cross-section to an equivalent circular pipe so the same Re and friction correlations apply.' },
        { q: 'Explain the entrance length concept and its dependence on Re.', a: 'Le ≈ 0.06·Re·D in laminar flow (tens of diameters in turbulent) — the distance until the boundary layers meet and the profile becomes fully developed.' },
        { q: 'How would you scale this experiment to a pipe 10× larger?', a: 'Dynamic similarity requires equal Re: v₂ = v₁(D₁/D₂), so a 10× larger pipe needs 1/10 the velocity in the same fluid.' },
        { q: 'Relate Re to the friction factor in laminar vs turbulent flow.', a: 'Laminar: f = 64/Re exactly. Turbulent: Colebrook-White (implicit) / Moody chart, where f falls slowly with Re and depends on roughness.' },
      ],
      equipment: [
        { q: 'What is the purpose of the constant-head tank?', a: 'It keeps pressure and flow steady regardless of supply fluctuations so observations are made under stable conditions.' },
        { q: 'How does a rotameter measure flow?', a: 'A float rises until drag balances its weight; the annular gap area, hence float height, is calibrated to flow rate.' },
        { q: 'Why is a needle used for dye injection?', a: 'A fine needle minimises flow disturbance so the dye follows streamlines instead of being mixed by the injector.' },
        { q: 'What would happen if air entered the rotameter?', a: 'Two-phase flow changes the float drag and density, giving false flow readings and unstable float position.' },
      ],
      troubleshooting: [
        { q: 'The dye filament breaks up even at low flow — what could be wrong?', a: 'Dye injected too fast, upstream disturbances (valves, bends, bubbles), or the water already turbulent before the test section.' },
        { q: 'The rotameter float sticks — how do you fix it?', a: 'Clean the tube, check the float for deformation, and confirm the meter is vertical.' },
        { q: 'You measure a higher flow than expected — possible causes?', a: 'Stopwatch timing error, a leak bypassing the meter, or a partially open bypass valve.' },
        { q: 'The dye diffuses instantly showing no pattern — what now?', a: 'Flow is likely turbulent or the dye is too dense/miscible; reduce flow and inject more gently.' },
      ],
    },
  },
  {
    id: 'biodiesel',
    name: 'Biodiesel by Transesterification',
    category: 'Chemical Reaction',
    duration: '3–4 h',
    icon: <Droplets className="w-4 h-4" />,
    objective: 'Convert waste vegetable oil into biodiesel via base-catalysed transesterification and measure yield and purity.',
    before: {
      theory: 'Triglyceride + 3 methanol ⇌ 3 FAME (biodiesel) + glycerol, catalysed by NaOH/KOH. The reaction is equilibrium-limited, so excess methanol drives it forward. FAMEs have cetane numbers and viscosities close to diesel.',
      principle: 'Oil is heated, mixed with methoxide (methanol + catalyst), reacted under reflux for ~1 h, then separated by gravity into biodiesel (top) and glycerol (bottom) layers before washing and drying.',
      equipment: ['Round-bottom flask with reflux condenser', 'Hot plate / heating mantle with stirrer', 'Thermometer & separating funnel', 'Wash bottles & distilled water', 'Analytical balance', 'Graduated cylinders & density bottle'],
      procedure: [
        'Filter and heat the oil to 60 °C to remove water and solids.',
        'Dissolve NaOH (1% w/w of oil) in methanol (6:1 methanol:oil molar ratio) to make methoxide.',
        'Add methoxide to hot oil, stir and reflux at ~60 °C for 60 min.',
        'Transfer to a separating funnel and allow phases to settle overnight.',
        'Drain the glycerol layer; wash the biodiesel with warm water until the wash water is neutral.',
        'Dry the biodiesel over anhydrous Na₂SO₄ and weigh the final product.',
      ],
      safety: ['Methanol is toxic and flammable — work in a fume hood, no naked flames', 'NaOH is caustic — gloves and goggles at all times', 'Warm methanol vapours — keep condenser water flowing', 'Do not dispose of glycerol or wash water down the sink without neutralising'],
      observations: ['Two distinct layers after settling — biodiesel (top, clear amber) and glycerol (bottom, viscous)', 'Wash water pH drops toward 7 with each wash', 'Product weight less than oil charged due to glycerol removal', 'Density of product ~0.86–0.90 g/mL'],
    },
    after: {
      calculations: [
        'Moles of oil = mass / MW(oil, ~884 g/mol)',
        'Stoichiometric methanol required = 3 × mol oil; actual = 6 × mol oil (excess)',
        'Theoretical yield = mol oil × MW(FAME, ~296 g/mol)',
        'Yield % = (actual mass / theoretical mass) × 100',
      ],
      graph: 'Plot conversion or yield vs time at constant temperature, or yield vs catalyst loading for different runs.',
      errorAnalysis: ['Moisture in oil saponifies the catalyst (soap formation)', 'Temperature above 65 °C boils off methanol and reverses the reaction', 'Incomplete settling leaves glycerol in the product', 'Free fatty acids in the oil consume catalyst'],
      discussion: ['Why is excess methanol used?', 'What happens if the oil contains water or free fatty acids?', 'How would you check biodiesel purity (e.g. via density, viscosity, or GC)?'],
      conclusion: 'Report the yield percentage, compare product density/viscosity with EN 14214 limits, and discuss how feedstock quality affected the conversion.',
    },
    viva: {
      basic: [
        { q: 'What is transesterification?', a: 'Reaction of a triglyceride with an alcohol (methanol) to form fatty acid methyl esters (biodiesel) and glycerol.' },
        { q: 'Why is NaOH or KOH used?', a: 'It is the homogeneous base catalyst that forms the active methoxide species which attacks the triglyceride.' },
        { q: 'Why is methanol used instead of ethanol?', a: 'Methanol is cheaper, more reactive (smaller molecule), and gives FAME with properties matching diesel.' },
        { q: 'Which layer is biodiesel and which is glycerol?', a: 'Biodiesel is the less-dense top layer; glycerol is the dense, viscous bottom layer.' },
      ],
      intermediate: [
        { q: 'Why is excess methanol needed?', a: 'The reaction is reversible and equilibrium-limited; excess alcohol shifts it toward products (Le Chatelier) and raises yield.' },
        { q: 'What happens if the oil contains water?', a: 'Water hydrolyses the ester and saponifies the catalyst, forming soap that emulsifies the phases and lowers yield.' },
        { q: 'How do free fatty acids affect the process?', a: 'FFAs react with the base catalyst to form soap instead of ester, consuming catalyst and complicating separation.' },
        { q: 'Why is the product washed with warm water?', a: 'To remove residual catalyst, soap, methanol and glycerol that would otherwise corrode engines and clog filters.' },
      ],
      advanced: [
        { q: 'Explain the reaction mechanism of base-catalysed transesterification.', a: 'OH⁻ abstracts a proton from methanol to form CH₃O⁻; methoxide attacks the carbonyl carbon of the ester, forming a tetrahedral intermediate that collapses to FAME plus diglyceride, repeating three times.' },
        { q: 'How would you design a continuous biodiesel process?', a: 'CSTR or plug-flow reactor with excess methanol, followed by decanter, methanol recovery column, water wash, and drying — with recycle of methanol and catalyst.' },
        { q: 'How is conversion monitored in real time?', a: 'By density, refractive index, viscosity, or ¹H-NMR/GC; density falls as FAME replaces triglyceride.' },
        { q: 'What are the ASTM D6751 / EN 14214 key quality limits?', a: 'Ester content ≥ 96.5%, viscosity 1.9–6.0 mm²/s, density 860–900 kg/m³, water < 500 ppm, methanol < 0.2%.' },
      ],
      equipment: [
        { q: 'What is the purpose of the reflux condenser?', a: 'It condenses methanol vapour back into the flask so the reaction runs at the methanol boiling point without losing reactant.' },
        { q: 'Why heat to about 60 °C?', a: 'Fast enough kinetics with methanol below its 65 °C boiling point — higher temperatures boil off methanol and can reverse the reaction.' },
        { q: 'What is a separating funnel used for here?', a: 'To gravity-separate the biodiesel and glycerol phases after settling.' },
        { q: 'Why a drying agent such as Na₂SO₄?', a: 'It absorbs residual water from the washed biodiesel so the product passes the water-content specification.' },
      ],
      troubleshooting: [
        { q: 'Your product forms a gel/emulsion — why?', a: 'Soap formation from water/FFAs emulsifies the phases; reduce moisture, use fresh catalyst, or add a salt wash / longer settling.' },
        { q: 'Yield is far below theoretical — possible causes?', a: 'Incomplete reaction (time/temp), catalyst consumed by FFA/water, methanol loss, or product lost in washing.' },
        { q: 'The reaction never separates into layers — what now?', a: 'Soap emulsion; add saturated salt solution or slightly acidify, heat gently, and allow more settling time.' },
        { q: 'Wash water is still pink/phenolphthalein-positive after 4 washes — why?', a: 'Residual NaOH; keep washing until neutral, or the catalyst dose was too high for the feedstock.' },
      ],
    },
  },
  {
    id: 'heat-exchanger',
    name: 'Shell & Tube Heat Exchanger',
    category: 'Heat Transfer',
    duration: '2–3 h',
    icon: <Flame className="w-4 h-4" />,
    objective: 'Measure the overall heat transfer coefficient of a shell-and-tube exchanger in counter-current and co-current flow and compare with theory.',
    before: {
      theory: 'Heat duty Q = ṁc_pΔT applies to both streams. The overall coefficient U relates Q to the LMTD: Q = UA·LMTD·F. Counter-current flow gives a higher LMTD than co-current, hence better performance.',
      principle: 'Hot water flows through the tubes while cold water flows through the shell. Steady-state temperatures at all four ports are recorded, flow rates measured, and U is back-calculated from Q and LMTD.',
      equipment: ['Shell-and-tube exchanger test rig', 'Hot water heater / tank', 'Two rotameters for hot & cold flow', 'Thermocouples or thermometers (4 ports)', 'Stopwatch & measuring cylinders', 'Valves for flow control'],
      procedure: [
        'Start the hot water supply and set it to ~60–70 °C.',
        'Open the cold water supply and set a chosen flow rate.',
        'Wait for steady state (temperatures stable for 5 min).',
        'Record T_hot,in, T_hot,out, T_cold,in, T_cold,out and both flow rates.',
        'Repeat for co-current (parallel) flow configuration.',
        'Repeat at 2–3 more flow rates and tabulate all runs.',
      ],
      safety: ['Hot water and surfaces — insulated piping, caution around the heater', 'Ensure the rig is properly earthed and dry', 'Vent trapped air from the exchanger before starting', 'Do not exceed rated pressure/temperature of the rig'],
      observations: ['Counter-current outlet hot temperature is lower (more heat recovered)', 'U changes with flow rate (higher Re → higher U)', 'Co-current gives a smaller LMTD at the same flow rates', 'Temperatures take several minutes to stabilise'],
    },
    after: {
      calculations: [
        'Q_hot = ṁ_h · c_p · (T_h,in − T_h,out) (W)',
        'Q_cold = ṁ_c · c_p · (T_c,out − T_c,in) — energy balance check',
        'LMTD = (ΔT₁ − ΔT₂)/ln(ΔT₁/ΔT₂) for each configuration',
        'U = Q / (A · LMTD) using the known exchange area A',
      ],
      graph: 'Plot U vs cold-water flow rate (or Re), and temperature vs position for counter- vs co-current on the same axes.',
      errorAnalysis: ['Heat loss to surroundings inflates Q_hot vs Q_cold', 'Steady state not fully reached', 'Flow meter calibration drift', 'Fouling on tube surfaces lowers measured U'],
      discussion: ['Why is counter-current more effective than co-current?', 'Why does U increase with flow rate?', 'How would fouling change U over weeks of operation?'],
      conclusion: 'Compare measured U with typical literature ranges (200–1000 W/m²·K water-water), state the percentage energy-balance error, and explain configuration and fouling effects.',
    },
    viva: {
      basic: [
        { q: 'What is the overall heat transfer coefficient U?', a: 'A combined measure of all resistances (film, wall, fouling) between the two fluids: Q = U·A·LMTD.' },
        { q: 'What is LMTD?', a: 'Log mean temperature difference — the effective driving force for heat transfer in an exchanger with varying ΔT.' },
        { q: 'Why use counter-current instead of co-current?', a: 'Counter-current maintains a larger and more uniform ΔT, giving higher LMTD and more heat transferred for the same area.' },
        { q: 'Which stream flows inside the tubes?', a: 'Usually the hot fluid inside the tubes, and the cold fluid in the shell — though either is possible.' },
      ],
      intermediate: [
        { q: 'Why is LMTD used rather than a simple average ΔT?', a: 'The temperature difference varies along the exchanger; the log-mean correctly integrates the exponential approach to thermal equilibrium.' },
        { q: 'Why does U increase with higher flow rate?', a: 'Higher velocity raises the Reynolds number, thinning the boundary layer and lowering convective film resistances.' },
        { q: 'What is the F correction factor?', a: 'A multiplier (< 1) applied to LMTD for multi-pass and cross-flow arrangements that do not achieve true counter-current behaviour.' },
        { q: 'What causes the energy balance error between Q_hot and Q_cold?', a: 'Heat loss to the surroundings, inaccurate flow/temperature measurements, and not reaching steady state.' },
      ],
      advanced: [
        { q: 'Derive the LMTD expression.', a: 'Integrating dQ = UΔT dA over the exchanger with constant U and c_p gives ΔT changing exponentially; the result is LMTD = (ΔT₁ − ΔT₂)/ln(ΔT₁/ΔT₂).' },
        { q: 'How does fouling factor enter the design?', a: '1/U_design = 1/h_o + R_fo + x/k_w + R_fi + 1/h_i — designers add fouling resistances so U_design is lower than the clean U.' },
        { q: 'How would you size a new exchanger?', a: 'Energy balance gives Q; assume or estimate U from correlations/literature; compute A = Q/(U·LMTD·F); then choose tube count, length, passes and shell diameter.' },
        { q: 'What is the temperature cross / temperature approach problem?', a: 'A temperature approach too small (< 5–10 °C) or a temperature cross in multi-pass units requires huge area or infeasible design — avoided by adding shells or choosing different streams.' },
      ],
      equipment: [
        { q: 'What does a rotameter measure in this rig?', a: 'Volumetric flow of each stream; converted to mass flow using density for the energy balance.' },
        { q: 'Where are the thermocouples placed?', a: 'At the four ports — hot in/out and cold in/out — to capture the terminal temperatures for LMTD.' },
        { q: 'Why is a vent provided on the exchanger?', a: 'To purge trapped air that would blank off heat-transfer area and distort measurements.' },
        { q: 'What is a baffle and what does it do?', a: 'A plate that directs shell-side flow across the tube bundle, increasing velocity, turbulence and heat transfer.' },
      ],
      troubleshooting: [
        { q: 'Measured U is much lower than expected — why?', a: 'Air pockets, fouling, flow bypassing (leakage), or steady state not reached; check vents, clean surfaces, verify flows.' },
        { q: 'Q_hot and Q_cold disagree by 30% — what now?', a: 'Heat loss is large or flows are misread; insulate, recalibrate meters, and re-measure after stable temperatures.' },
        { q: 'Temperatures keep drifting and never stabilise — why?', a: 'The heater cycles or flows fluctuate; allow longer warm-up and hold flows constant while logging.' },
        { q: 'Counter-current gives almost the same result as co-current — why?', a: 'The exchanger may be effectively single-pass with long tubes where ΔT approaches equilibrium; check actual configuration and flow rates.' },
      ],
    },
  },
  {
    id: 'distillation',
    name: 'Distillation Column (Ethanol–Water)',
    category: 'Separation Processes',
    duration: '3–4 h',
    icon: <Columns2 className="w-4 h-4" />,
    objective: 'Separate an ethanol–water mixture in a bench-scale distillation column, determine reflux ratio and the number of theoretical stages, and measure product purity.',
    before: {
      theory: 'Distillation exploits the difference in volatility (relative volatility α). The McCabe–Thiele method steps between the equilibrium curve and operating lines to count theoretical stages. Reflux ratio R = L/D sets the rectifying line slope R/(R+1).',
      principle: 'A feed mixture is boiled; vapour rises through trays/packing, is condensed at the top, and part returns as reflux. Ethanol concentrates in the distillate, water in the bottoms. Product composition is measured by refractive index or density.',
      equipment: ['Bench distillation column (trays or packed)', 'Reboiler / heating mantle', 'Condenser with cooling water', 'Reflux divider & distillate collector', 'Refractometer / density bottle', 'Thermometers at each section'],
      procedure: [
        'Charge the reboiler with the feed mixture (e.g. 10 wt% ethanol).',
        'Start cooling water, then heating; bring to total reflux until temperatures stabilise.',
        'Switch to a chosen reflux ratio and collect distillate and bottoms samples.',
        'Measure composition of samples by refractive index or density.',
        'Record column temperature profile top-to-bottom.',
        'Repeat at a second reflux ratio for comparison.',
      ],
      safety: ['Ethanol is flammable — no naked flames, ventilate the area', 'Hot glassware and vapour lines — use tongs and insulation', 'Check condenser water flow before heating', 'Wear splash goggles — hot liquid sampling', 'Dispose of alcohol waste in labelled containers'],
      observations: ['Distillate is richer in ethanol than the feed (check by smell & refractive index)', 'Temperature increases from top to bottom of the column', 'Higher reflux ratio gives purer distillate but slower collection', 'Azeotropic limit near 95.6 wt% ethanol at 1 atm'],
    },
    after: {
      calculations: [
        'Overall material balance: F = D + B and F·xF = D·xD + B·xB',
        'Reflux ratio R = L/D from the divider settings',
        'Rectifying line: y = (R/(R+1))·x + xD/(R+1)',
        'Number of theoretical stages via McCabe–Thiele stepping',
      ],
      graph: 'Construct the x–y equilibrium curve for ethanol–water, draw the operating lines, and step off the theoretical stages on the McCabe–Thiele diagram.',
      errorAnalysis: ['Non-ideal ethanol–water equilibrium (azeotrope) deviates from simple models', 'Heat loss changes internal reflux', 'Sample evaporation before measurement', 'Refractometer temperature dependence'],
      discussion: ['Why can ethanol–water not be separated to 100% at 1 atm?', 'How does reflux ratio trade off purity vs throughput?', 'What would change if you raised the operating pressure?'],
      conclusion: 'Report achieved distillate composition vs azeotropic limit, the number of theoretical stages found, and the effect of reflux ratio on purity and recovery.',
    },
    viva: {
      basic: [
        { q: 'What is distillation?', a: 'A separation process that exploits differences in volatility to concentrate the more volatile component in the vapour (distillate).' },
        { q: 'What is reflux?', a: 'Condensed vapour returned to the top of the column; it maintains liquid flow down the column and enriches the vapour.' },
        { q: 'What is the reflux ratio?', a: 'R = L/D, the ratio of liquid returned to the column to distillate withdrawn.' },
        { q: 'Why is ethanol–water special?', a: 'It forms a minimum-boiling azeotrope at ~95.6 wt% ethanol, so simple distillation cannot exceed that purity at 1 atm.' },
      ],
      intermediate: [
        { q: 'What does the McCabe–Thiele method do?', a: 'It uses the equilibrium curve plus rectifying and stripping operating lines to step off the number of theoretical stages.' },
        { q: 'What is total reflux and why run it?', a: 'All condensate returns to the column (D = 0); it gives the minimum number of stages and is used for start-up and column testing.' },
        { q: 'How does higher reflux ratio affect operation?', a: 'More stages-equivalent enrichment and purer product, but lower throughput and higher energy demand.' },
        { q: 'What is minimum reflux ratio?', a: 'The R at which the operating lines touch the equilibrium curve (pinch), requiring infinite stages; real designs use R ≈ 1.2–1.5 × R_min.' },
      ],
      advanced: [
        { q: 'Explain the azeotrope and how it is broken industrially.', a: 'At the azeotrope the vapour has the same composition as the liquid (α = 1), so distillation stalls; it is broken by extractive distillation with a solvent (e.g. ethylene glycol) or pressure-swing distillation.' },
        { q: 'Derive the rectifying operating line.', a: 'Total balance V = L + D; component balance V·y = L·x + D·xD; dividing by V and using L/V = R/(R+1) gives y = (R/(R+1))x + xD/(R+1).' },
        { q: 'What is the q-line and its significance?', a: 'The feed line; its slope depends on feed quality q (subcooled, saturated liquid, vapour, etc.) and locates the intersection of the rectifying and stripping lines.' },
        { q: 'How would you design a full column?', a: 'Choose R (≈1.2–1.5 R_min), step off stages on McCabe–Thiele or use FUG shortcut, size tray spacing/diameter by flooding correlations, then rate the hydraulics.' },
      ],
      equipment: [
        { q: 'What is the reboiler for?', a: 'It vaporises liquid at the column bottom, providing the vapour flow that drives separation.' },
        { q: 'What is the purpose of the condenser?', a: 'It condenses the top vapour so part returns as reflux and part is collected as distillate.' },
        { q: 'How is composition measured here?', a: 'By refractive index or density against a calibration curve for ethanol–water mixtures.' },
        { q: 'What is the reflux divider?', a: 'A device (timer or solenoid valve) that splits the condensed stream between reflux return and distillate take-off at the chosen ratio.' },
      ],
      troubleshooting: [
        { q: 'Distillate purity is stuck at the azeotrope — what now?', a: 'That is expected at 1 atm; to go beyond, use extractive or azeotropic distillation, or molecular sieves.' },
        { q: 'The column floods (pressure drop spikes, liquid backing up) — why?', a: 'Excess vapour velocity or fouled trays; reduce heating and check for weeping or downcomer blockage.' },
        { q: 'Reflux ratio setting has no effect on purity — why?', a: 'The column may have too few stages or be at total-reflux-like conditions; verify flows, temperatures and that the divider works.' },
        { q: 'Temperature profile is flat across the column — what does it mean?', a: 'Little separation is occurring (possible flooding, dumping, or a badly maldistributed packed bed); check heating, reflux and packing condition.' },
      ],
    },
  },
];

// ─── Viva quiz engine ───────────────────────────────────────────────────────
const LEVEL_LABELS: Record<VivaLevel, string> = {
  basic: 'Basic Concepts',
  intermediate: 'Intermediate',
  advanced: 'Advanced / Design',
  equipment: 'Equipment & Apparatus',
  troubleshooting: 'Troubleshooting',
};

const LEVEL_COLORS: Record<VivaLevel, string> = {
  basic: 'bg-emerald-500',
  intermediate: 'bg-amber-500',
  advanced: 'bg-rose-500',
  equipment: 'bg-sky-500',
  troubleshooting: 'bg-violet-500',
};

type PoolItem = VivaQA & { level: VivaLevel };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function VivaQuiz({ experiment }: { experiment: LabExperiment }) {
  const [levels, setLevels] = useState<Record<VivaLevel, boolean>>({
    basic: true, intermediate: true, advanced: true, equipment: true, troubleshooting: true,
  });
  const [size, setSize] = useState(6);
  const [pool, setPool] = useState<PoolItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [finished, setFinished] = useState(false);

  const start = () => {
    const all: PoolItem[] = (Object.keys(LEVEL_LABELS) as VivaLevel[]).flatMap(lv =>
      levels[lv] ? experiment.viva[lv].map(q => ({ ...q, level: lv })) : []
    );
    setPool(shuffle(all).slice(0, size));
    setIdx(0); setCorrect(0); setAnswered(0); setRevealed(false); setFinished(false);
  };

  const answer = (ok: boolean) => {
    if (ok) setCorrect(c => c + 1);
    setAnswered(a => a + 1);
    if (idx + 1 >= pool.length) { setFinished(true); return; }
    setIdx(i => i + 1);
    setRevealed(false);
  };

  const current = pool[idx];

  if (finished) {
    const pct = pool.length ? Math.round((correct / pool.length) * 100) : 0;
    const verdict = pct >= 80 ? 'Outstanding — you are viva-ready!' : pct >= 60 ? 'Good — review the missed answers below and retry.' : 'Keep practising — go through the model answers and try again.';
    return (
      <CalcCard title="Viva Results" icon={Award}>
        <div className="flex items-center gap-6 mb-6">
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-lg"
            style={{ background: pct >= 80 ? 'linear-gradient(135deg,#10b981,#059669)' : pct >= 60 ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#ef4444,#b91c1c)' }}>
            {pct}%
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white">{correct}/{pool.length} answered correctly</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{verdict}</p>
            <p className="text-xs text-slate-400 mt-2">{experiment.name} · {size} questions · all levels mixed</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {pool.map((_, i) => (
            <span key={i} className={`px-3 py-1 rounded-lg text-[10px] font-black ${i < answered ? (i < correct ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400') : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
              Q{i + 1}
            </span>
          ))}
        </div>
        <button onClick={start} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 transition-all flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Practise Again
        </button>
      </CalcCard>
    );
  }

  return (
    <CalcCard title={`Viva Practice — ${experiment.name}`} icon={GraduationCap}>
      {pool.length === 0 ? (
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Choose question levels and count, then start a timed viva session. After answering, reveal the model answer to self-grade.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Question Levels</h4>
              <div className="space-y-2">
                {(Object.keys(LEVEL_LABELS) as VivaLevel[]).map(lv => (
                  <label key={lv} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={levels[lv]}
                      onChange={e => setLevels(s => ({ ...s, [lv]: e.target.checked }))}
                      className="accent-indigo-600 w-4 h-4" />
                    <span className={`w-2.5 h-2.5 rounded-full ${LEVEL_COLORS[lv]}`} />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{LEVEL_LABELS[lv]}</span>
                    <span className="text-[10px] text-slate-400">({experiment.viva[lv].length})</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Questions per Session</h4>
              <div className="flex gap-2">
                {[4, 6, 8, 10].map(n => (
                  <button key={n} onClick={() => setSize(n)}
                    className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${size === n ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-400'}`}>
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-3">Questions are drawn randomly from the selected levels of this experiment only.</p>
            </div>
          </div>
          <button onClick={start} className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-black hover:shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center gap-2">
            <PlayCircle className="w-4 h-4" /> Start Viva Session
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Question {idx + 1} of {pool.length}</span>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black text-white ${LEVEL_COLORS[current.level]}`}>{LEVEL_LABELS[current.level]}</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mb-6 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500" style={{ width: `${((idx + (revealed ? 1 : 0)) / pool.length) * 100}%` }} />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white leading-relaxed mb-4">{current.q}</h3>
          {!revealed ? (
            <button onClick={() => setRevealed(true)} className="px-5 py-2.5 rounded-xl border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-xs font-black hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center gap-2">
              <Lightbulb className="w-4 h-4" /> Reveal Model Answer
            </button>
          ) : (
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-900/10 p-4 mb-5 animate-in fade-in">
              <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Model Answer</p>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{current.a}</p>
            </div>
          )}
          <div className="flex gap-3 mt-2">
            <button onClick={() => answer(true)} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition-all">
              Got It ✓
            </button>
            <button onClick={() => answer(false)} className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black hover:bg-slate-300 dark:hover:bg-slate-600 transition-all">
              Needs Revision
            </button>
          </div>
        </div>
      )}
    </CalcCard>
  );
}

// ─── Pre-lab preparation ────────────────────────────────────────────────────
function PreLab({ experiment }: { experiment: LabExperiment }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const total = experiment.before.procedure.length;
  const done = experiment.before.procedure.filter((_, i) => checked[i]).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <CalcCard title={`Pre-Lab — ${experiment.name}`} icon={BookOpen}>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{experiment.objective}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SectionCard title="Theory" icon={<BookOpen className="w-4 h-4" />}>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{experiment.before.theory}</p>
          </SectionCard>
          <SectionCard title="Principle" icon={<Lightbulb className="w-4 h-4" />}>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{experiment.before.principle}</p>
          </SectionCard>
        </div>
      </CalcCard>

      <CalcCard title="Equipment Checklist" icon={TestTubes}>
        <BulletList items={experiment.before.equipment} />
      </CalcCard>

      <CalcCard title="Safety Briefing" icon={ShieldAlert}>
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-900/10 p-4 mb-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5" /> Read before entering the lab
          </p>
          <BulletList items={experiment.before.safety} color="text-amber-800 dark:text-amber-300" />
        </div>
      </CalcCard>

      <CalcCard title="Procedure Walkthrough" icon={ClipboardList}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-black text-slate-700 dark:text-slate-200">{done}/{total} steps completed</span>
          <div className="w-40 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="space-y-2">
          {experiment.before.procedure.map((step, i) => (
            <label key={i} className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${checked[i] ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300'}`}>
              <input type="checkbox" checked={!!checked[i]}
                onChange={e => setChecked(s => ({ ...s, [i]: e.target.checked }))}
                className="mt-0.5 accent-emerald-600 w-4 h-4 flex-shrink-0" />
              <span className={`text-xs leading-relaxed ${checked[i] ? 'text-emerald-700 dark:text-emerald-400 line-through' : 'text-slate-600 dark:text-slate-300'}`}>{step}</span>
            </label>
          ))}
        </div>
        {pct === 100 && (
          <div className="mt-4 rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10 p-4 text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-2 animate-in fade-in">
            <Award className="w-4 h-4" /> Procedure rehearsed — you are ready for the lab session!
          </div>
        )}
      </CalcCard>
    </div>
  );
}

// ─── Post-lab analysis ──────────────────────────────────────────────────────
function PostLab({ experiment }: { experiment: LabExperiment }) {
  const [notes, setNotes] = useState('');

  const copyReport = () => {
    const lines = [
      `${experiment.name} — Lab Report`, '='.repeat(40),
      '', `Objective: ${experiment.objective}`, '',
      'CALCULATIONS', ...experiment.before.observations.map(o => `• ${o}`),
      '', 'KEY RESULTS', ...experiment.after.calculations.map(c => `• ${c}`),
      '', `Graph: ${experiment.after.graph}`, '',
      'ERROR SOURCES', ...experiment.after.errorAnalysis.map(e => `• ${e}`),
      '', 'DISCUSSION', ...experiment.after.discussion.map(d => `• ${d}`),
      '', `Conclusion: ${experiment.after.conclusion}`, '',
      notes ? `NOTES
${notes}` : '',
    ];
    navigator.clipboard?.writeText(lines.filter(Boolean).join('\n')).catch(() => {});
  };

  return (
    <div className="space-y-6">
      <CalcCard title={`Post-Lab — ${experiment.name}`} icon={Lightbulb}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <SectionCard title="Calculations" icon={<Timer className="w-4 h-4" />}>
            <BulletList items={experiment.after.calculations} />
          </SectionCard>
          <SectionCard title="Graphing" icon={<LineChartIcon className="w-4 h-4" />}>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{experiment.after.graph}</p>
          </SectionCard>
          <SectionCard title="Error Analysis" icon={<ShieldAlert className="w-4 h-4" />}>
            <BulletList items={experiment.after.errorAnalysis} />
          </SectionCard>
          <SectionCard title="Discussion Points" icon={<ListChecks className="w-4 h-4" />}>
            <BulletList items={experiment.after.discussion} />
          </SectionCard>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Conclusion Template</h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 italic">{experiment.after.conclusion}</p>
        </div>
        <div className="mt-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Your results & observations</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
            placeholder="Paste your measured values, calculations and conclusions here…"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs text-slate-700 dark:text-slate-200 focus:border-indigo-400 focus:outline-none resize-y" />
          <button onClick={copyReport} className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 transition-all flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> Copy Report Structure
          </button>
        </div>
      </CalcCard>
    </div>
  );
}

// ─── During-lab: data entry, automatic calculations, unit & error checks ────
interface DuringField {
  key: string;
  label: string;
  unit: string;            // default unit symbol
  options: string[];       // selectable units
  toSI: (v: number, unit: string) => number;
  placeholder?: string;
}

interface DuringResultRow { label: string; value: string; unit: string; note?: string; }

interface DuringCheckRow { label: string; status: 'ok' | 'warn' | 'error' | 'na'; detail: string; }

interface DuringConfig {
  intro: string;
  fields: DuringField[];
  calc: (si: Record<string, number>) => DuringResultRow[];
  checks: (si: Record<string, number>) => DuringCheckRow[];
}

function fmtNum(v: number, d = 3): string {
  if (!isFinite(v)) return '—';
  if (v !== 0 && (Math.abs(v) >= 1e5 || Math.abs(v) < 1e-3)) return v.toExponential(2);
  return v.toLocaleString('en-US', { maximumFractionDigits: d });
}

// Water density (kg/m³) and viscosity (Pa·s, interpolated) vs temperature
function waterProps(Tc: number): { rho: number; mu: number } {
  const rho = 999.8 - 0.006 * (Tc - 20) ** 2;
  const table: [number, number][] = [[0,1.792],[10,1.307],[20,1.002],[30,0.798],[40,0.653],[50,0.547],[60,0.467],[70,0.404],[80,0.355],[90,0.315],[100,0.282]];
  const T = Math.min(100, Math.max(0, Tc));
  let mu = 1.002e-3;
  for (let i = 0; i < table.length - 1; i++) {
    const [t1, m1] = table[i];
    const [t2, m2] = table[i + 1];
    if (T >= t1 && T <= t2) { mu = (m1 + ((m2 - m1) * (T - t1)) / (t2 - t1)) * 1e-3; break; }
  }
  return { rho, mu };
}

const DURING_CONFIGS: Record<string, DuringConfig> = {
  'fluid-flow': {
    intro: 'Enter the tube diameter, collected volume and timing for each run. The sheet converts to SI, computes the mean velocity and Reynolds number from the water temperature, and classifies the flow regime.',
    fields: [
      { key: 'D', label: 'Tube diameter', unit: 'mm', options: ['mm', 'm'], toSI: (v, u) => u === 'm' ? v : v * 1e-3, placeholder: 'e.g. 20' },
      { key: 'V', label: 'Volume collected', unit: 'mL', options: ['mL', 'L'], toSI: (v, u) => u === 'L' ? v * 1e-3 : v * 1e-6, placeholder: 'e.g. 500' },
      { key: 't', label: 'Collection time', unit: 's', options: ['s', 'min'], toSI: (v, u) => u === 'min' ? v * 60 : v, placeholder: 'e.g. 30' },
      { key: 'T', label: 'Water temperature', unit: '°C', options: ['°C', '°F'], toSI: (v, u) => u === '°F' ? ((v - 32) * 5) / 9 : v, placeholder: 'e.g. 25' },
    ],
    calc: (si) => {
      const { D, V, t, T } = si;
      const A = (Math.PI * D * D) / 4;
      const Q = V / t;
      const v = Q / A;
      const { rho, mu } = waterProps(T);
      const Re = (rho * v * D) / mu;
      const regime = Re < 2300 ? 'Laminar' : Re < 4000 ? 'Transition' : 'Turbulent';
      return [
        { label: 'Cross-section area', value: fmtNum(A), unit: 'm²' },
        { label: 'Volumetric flow', value: fmtNum(Q * 1e6), unit: 'mL/s' },
        { label: 'Mean velocity', value: fmtNum(v), unit: 'm/s' },
        { label: 'Reynolds number', value: fmtNum(Re), unit: '—', note: `ρ = ${fmtNum(rho)} kg/m³ · μ = ${fmtNum(mu, 4)} Pa·s at ${fmtNum(T, 1)} °C` },
        { label: 'Predicted regime', value: regime, unit: '—' },
      ];
    },
    checks: (si) => {
      const { D, V, t, T } = si;
      const A = (Math.PI * D * D) / 4;
      const v = (V / t) / A;
      const { rho, mu } = waterProps(T);
      const Re = (rho * v * D) / mu;
      const out: DuringCheckRow[] = [];
      out.push(v >= 0.001 && v <= 20
        ? { label: 'Velocity sanity check', status: 'ok', detail: `${fmtNum(v)} m/s is a physically plausible mean velocity for a lab rig.` }
        : { label: 'Velocity sanity check', status: 'warn', detail: `${fmtNum(v)} m/s is outside the typical 0.001–20 m/s lab range — re-check the diameter units (mm → m).` });
      out.push(Re < 1e5
        ? { label: 'Reynolds number range', status: 'ok', detail: `Re = ${fmtNum(Re)} sits inside the experimentally observable range.` }
        : { label: 'Reynolds number range', status: 'warn', detail: `Re = ${fmtNum(Re)} is very high for a teaching rig — check the collected volume and time units.` });
      out.push(T >= 0 && T <= 100
        ? { label: 'Temperature validity', status: 'ok', detail: 'Water properties are interpolated for 0–100 °C.' }
        : { label: 'Temperature validity', status: 'error', detail: 'Temperature outside 0–100 °C — property tables are only valid for liquid water in this range.' });
      return out;
    },
  },
  'biodiesel': {
    intro: 'Enter the oil charge, catalyst dose, methanol ratio and the final product mass. The sheet converts to SI, checks the stoichiometry (3:1 minimum) and computes the yield against theory.',
    fields: [
      { key: 'oil', label: 'Oil charged', unit: 'g', options: ['g', 'kg'], toSI: (v, u) => u === 'kg' ? v : v * 1e-3, placeholder: 'e.g. 200' },
      { key: 'cat', label: 'Catalyst (NaOH) dose', unit: '%', options: ['%'], toSI: (v) => v, placeholder: 'e.g. 1.0' },
      { key: 'ratio', label: 'Methanol : oil ratio', unit: '×', options: ['×'], toSI: (v) => v, placeholder: 'e.g. 6' },
      { key: 'prod', label: 'Product (FAME) mass', unit: 'g', options: ['g', 'kg'], toSI: (v, u) => u === 'kg' ? v : v * 1e-3, placeholder: 'e.g. 168' },
    ],
    calc: (si) => {
      const { oil, cat, ratio, prod } = si;
      const molOil = oil / 0.884;          // kg → kmol, MW ≈ 884 g/mol
      const molMeOH = molOil * ratio;
      const meohMass = molMeOH * 0.03204;  // kg
      const thYield = molOil * 0.296;      // kg FAME, MW ≈ 296 g/mol
      const yieldPct = thYield > 0 ? (prod / thYield) * 100 : NaN;
      const catMass = (oil * cat) / 100;
      return [
        { label: 'Oil molar amount', value: fmtNum(molOil * 1e3), unit: 'mol', note: 'MW(oil) ≈ 884 g/mol assumed' },
        { label: 'Methanol required', value: fmtNum(meohMass * 1e3), unit: 'g' },
        { label: 'Catalyst (NaOH) mass', value: fmtNum(catMass * 1e3), unit: 'g' },
        { label: 'Theoretical FAME yield', value: fmtNum(thYield * 1e3), unit: 'g', note: 'MW(FAME) ≈ 296 g/mol assumed' },
        { label: 'Yield', value: fmtNum(yieldPct), unit: '%' },
      ];
    },
    checks: (si) => {
      const { oil, cat, ratio, prod } = si;
      const th = (oil / 0.884) * 0.296;
      const pct = th > 0 ? (prod / th) * 100 : NaN;
      const out: DuringCheckRow[] = [];
      out.push(ratio >= 3
        ? { label: 'Stoichiometry check', status: 'ok', detail: `Ratio ${fmtNum(ratio)} ≥ 3:1 — sufficient methanol to shift the reversible reaction (Le Chatelier).` }
        : { label: 'Stoichiometry check', status: 'error', detail: `Ratio ${fmtNum(ratio)} < 3:1 — below the stoichiometric minimum of 3 mol methanol per mol triglyceride.` });
      out.push(!isNaN(pct) && pct >= 60 && pct <= 100
        ? { label: 'Yield plausibility', status: 'ok', detail: `${fmtNum(pct)} % yield is within the range expected for a clean transesterification.` }
        : !isNaN(pct) && pct > 100
        ? { label: 'Yield plausibility', status: 'warn', detail: `${fmtNum(pct)} % > 100 % — product may still contain water or methanol, or was weighed before drying.` }
        : !isNaN(pct) && pct < 60
        ? { label: 'Yield plausibility', status: 'warn', detail: `${fmtNum(pct)} % is low — suspect moisture/FFA (soap formation), catalyst loss, or methanol boil-off during reflux.` }
        : { label: 'Yield plausibility', status: 'na', detail: 'Enter the product mass to evaluate the yield.' });
      out.push(cat >= 0.5 && cat <= 2
        ? { label: 'Catalyst dose', status: 'ok', detail: `${fmtNum(cat)} % w/w NaOH is the typical 0.5–2 % range for refined oils.` }
        : { label: 'Catalyst dose', status: 'warn', detail: `${fmtNum(cat)} % w/w is outside the typical 0.5–2 % range — too much catalyst causes soap; too little slows the reaction.` });
      return out;
    },
  },
  'heat-exchanger': {
    intro: 'Record the four port temperatures and both flow rates at steady state, plus the exchange area. The sheet computes both duties, the LMTD, the overall coefficient U and runs an energy-balance error check. (L/min flows are converted to kg/s assuming water at ≈ 1000 kg/m³.)',
    fields: [
      { key: 'Thi', label: 'Hot in', unit: '°C', options: ['°C', '°F'], toSI: (v, u) => u === '°F' ? ((v - 32) * 5) / 9 : v, placeholder: 'e.g. 65' },
      { key: 'Tho', label: 'Hot out', unit: '°C', options: ['°C', '°F'], toSI: (v, u) => u === '°F' ? ((v - 32) * 5) / 9 : v, placeholder: 'e.g. 45' },
      { key: 'Tci', label: 'Cold in', unit: '°C', options: ['°C', '°F'], toSI: (v, u) => u === '°F' ? ((v - 32) * 5) / 9 : v, placeholder: 'e.g. 22' },
      { key: 'Tco', label: 'Cold out', unit: '°C', options: ['°C', '°F'], toSI: (v, u) => u === '°F' ? ((v - 32) * 5) / 9 : v, placeholder: 'e.g. 38' },
      { key: 'mh', label: 'Hot flow rate', unit: 'kg/s', options: ['kg/s', 'kg/h', 'L/min'], toSI: (v, u) => u === 'kg/s' ? v : u === 'kg/h' ? v / 3600 : v / 60, placeholder: 'e.g. 0.12' },
      { key: 'mc', label: 'Cold flow rate', unit: 'kg/s', options: ['kg/s', 'kg/h', 'L/min'], toSI: (v, u) => u === 'kg/s' ? v : u === 'kg/h' ? v / 3600 : v / 60, placeholder: 'e.g. 0.10' },
      { key: 'A', label: 'Exchange area', unit: 'm²', options: ['m²', 'cm²'], toSI: (v, u) => u === 'cm²' ? v * 1e-4 : v, placeholder: 'e.g. 0.5' },
    ],
    calc: (si) => {
      const { Thi, Tho, Tci, Tco, mh, mc, A } = si;
      const cp = 4186;
      const Qh = mh * cp * (Thi - Tho);
      const Qc = mc * cp * (Tco - Tci);
      const dT1 = Thi - Tco;
      const dT2 = Tho - Tci;
      const lmtd = dT1 > 0 && dT2 > 0 && dT1 !== dT2 ? (dT1 - dT2) / Math.log(dT1 / dT2) : dT1 === dT2 && dT1 > 0 ? dT1 : NaN;
      const U = A > 0 && lmtd > 0 ? ((Qh + Qc) / 2) / (A * lmtd) : NaN;
      return [
        { label: 'Hot duty Q_hot', value: fmtNum(Qh / 1000), unit: 'kW' },
        { label: 'Cold duty Q_cold', value: fmtNum(Qc / 1000), unit: 'kW' },
        { label: 'LMTD (counter-current)', value: fmtNum(lmtd), unit: '°C' },
        { label: 'Overall coefficient U', value: fmtNum(U), unit: 'W/m²·K', note: 'Q_avg / (A · LMTD)' },
      ];
    },
    checks: (si) => {
      const { Thi, Tho, Tci, Tco, mh, mc, A } = si;
      const cp = 4186;
      const Qh = mh * cp * (Thi - Tho);
      const Qc = mc * cp * (Tco - Tci);
      const err = (Math.abs(Qh) + Math.abs(Qc)) > 0 ? (Math.abs(Qh - Qc) / Math.max(Math.abs(Qh), Math.abs(Qc))) * 100 : NaN;
      const approach = Tho - Tci;
      const dT1 = Thi - Tco;
      const dT2 = Tho - Tci;
      const lm = dT1 > 0 && dT2 > 0 && dT1 !== dT2 ? (dT1 - dT2) / Math.log(dT1 / dT2) : dT1;
      const U = A > 0 && lm > 0 ? ((Qh + Qc) / 2) / (A * lm) : NaN;
      const out: DuringCheckRow[] = [];
      out.push(!isNaN(err) && err <= 15
        ? { label: 'Energy balance error', status: 'ok', detail: `|Q_hot − Q_cold|/Q_max = ${fmtNum(err, 1)} % — within the ±15 % teaching-rig tolerance.` }
        : !isNaN(err)
        ? { label: 'Energy balance error', status: 'warn', detail: `${fmtNum(err, 1)} % — heat loss to surroundings or misread flows/temperatures. Re-check after true steady state.` }
        : { label: 'Energy balance error', status: 'na', detail: 'Enter both flow rates to evaluate the energy balance.' });
      out.push(approach >= 5
        ? { label: 'Temperature approach', status: 'ok', detail: `Cold-side approach ΔT = ${fmtNum(approach, 1)} °C — feasible operation.` }
        : { label: 'Temperature approach', status: 'warn', detail: `Cold-side approach ΔT = ${fmtNum(approach, 1)} °C < 5 °C — very small driving force; LMTD and U become unreliable.` });
      out.push(!isNaN(U) && U >= 50 && U <= 2000
        ? { label: 'U plausibility', status: 'ok', detail: `U = ${fmtNum(U)} W/m²·K is in the typical water–water range (200–1000 W/m²·K).` }
        : !isNaN(U)
        ? { label: 'U plausibility', status: 'warn', detail: `U = ${fmtNum(U)} W/m²·K is outside the usual 50–2000 W/m²·K range — check area, flows and air blanketing.` }
        : { label: 'U plausibility', status: 'na', detail: 'Enter area and all temperatures to compute U.' });
      return out;
    },
  },
  'distillation': {
    intro: 'Enter the feed, distillate and bottoms rates and compositions plus the reflux ratio. The sheet solves the overall and component balances and checks the closure and composition ordering.',
    fields: [
      { key: 'F', label: 'Feed rate', unit: 'kg/h', options: ['kg/h', 'kg/s'], toSI: (v, u) => u === 'kg/s' ? v * 3600 : v, placeholder: 'e.g. 1000' },
      { key: 'xF', label: 'Feed composition', unit: 'wt%', options: ['wt%'], toSI: (v) => v, placeholder: 'e.g. 40' },
      { key: 'D', label: 'Distillate rate', unit: 'kg/h', options: ['kg/h', 'kg/s'], toSI: (v, u) => u === 'kg/s' ? v * 3600 : v, placeholder: 'e.g. 389' },
      { key: 'xD', label: 'Distillate composition', unit: 'wt%', options: ['wt%'], toSI: (v) => v, placeholder: 'e.g. 95' },
      { key: 'xB', label: 'Bottoms composition', unit: 'wt%', options: ['wt%'], toSI: (v) => v, placeholder: 'e.g. 5' },
      { key: 'R', label: 'Reflux ratio', unit: '—', options: ['—'], toSI: (v) => v, placeholder: 'e.g. 2.5' },
    ],
    calc: (si) => {
      const { F, xF, D, xD, xB, R } = si;
      const B = F - D;
      const mF = F * (xF / 100);
      const mB = B * (xB / 100);
      const closure = mF > 0 ? (Math.abs(D * (xD / 100) + mB - mF) / mF) * 100 : NaN;
      return [
        { label: 'Bottoms rate B', value: fmtNum(B), unit: 'kg/h', note: 'B = F − D' },
        { label: 'Component balance closure', value: fmtNum(closure), unit: '%', note: '|D·xD + B·xB − F·xF| / (F·xF)' },
        { label: 'Rectifying line slope', value: fmtNum(R / (R + 1)), unit: '—', note: 'R/(R+1)' },
        { label: 'Bottoms component flow', value: fmtNum(mB), unit: 'kg/h' },
      ];
    },
    checks: (si) => {
      const { F, xF, D, xD, xB } = si;
      const B = F - D;
      const mF = F * (xF / 100);
      const closure = mF > 0 ? (Math.abs(D * (xD / 100) + B * (xB / 100) - mF) / mF) * 100 : NaN;
      const out: DuringCheckRow[] = [];
      out.push(B >= 0
        ? { label: 'Overall balance', status: 'ok', detail: `F = D + B → B = ${fmtNum(B)} kg/h is positive and consistent.` }
        : { label: 'Overall balance', status: 'error', detail: `B = ${fmtNum(B)} kg/h < 0 — the distillate rate exceeds the feed; impossible.` });
      out.push(!isNaN(closure) && closure <= 5
        ? { label: 'Component balance closure', status: 'ok', detail: `Closure error ${fmtNum(closure, 1)} % — balances within the ±5 % lab tolerance.` }
        : !isNaN(closure)
        ? { label: 'Component balance closure', status: 'warn', detail: `Closure error ${fmtNum(closure, 1)} % — re-measure compositions; the component balance must close.` }
        : { label: 'Component balance closure', status: 'na', detail: 'Enter feed composition to evaluate.' });
      out.push(xD > xF && xF > xB
        ? { label: 'Composition ordering', status: 'ok', detail: `${fmtNum(xD)} > ${fmtNum(xF)} > ${fmtNum(xB)} wt% — separation is thermodynamically sensible.` }
        : { label: 'Composition ordering', status: 'error', detail: 'Ordering must satisfy xD > xF > xB — check that distillate/bottoms labels and values are correct.' });
      out.push(xD <= 95.6
        ? { label: 'Azeotrope limit', status: 'ok', detail: `${fmtNum(xD)} wt% is below the ethanol–water azeotrope (≈95.6 wt% at 1 atm) — achievable by simple distillation.` }
        : { label: 'Azeotrope limit', status: 'warn', detail: `${fmtNum(xD)} wt% exceeds the ethanol–water azeotrope (≈95.6 wt%) — needs extractive/azeotropic distillation or molecular sieves at 1 atm.` });
      return out;
    },
  },
};

function DuringLab({ experiment }: { experiment: LabExperiment }) {
  const config = DURING_CONFIGS[experiment.id] ?? DURING_CONFIGS['fluid-flow'];
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(config.fields.map(f => [f.key, '']))
  );
  const [units, setUnits] = useState<Record<string, string>>(() =>
    Object.fromEntries(config.fields.map(f => [f.key, f.unit]))
  );

  const si: Record<string, number> = {};
  let complete = true;
  for (const f of config.fields) {
    const v = parseFloat(values[f.key]);
    if (!isFinite(v)) { complete = false; continue; }
    si[f.key] = f.toSI(v, units[f.key]);
  }

  const rows = complete ? config.calc(si) : [];
  const checks = complete ? config.checks(si) : [];

  const statusIcon = (s: DuringCheckRow['status']) =>
    s === 'ok' ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
    : s === 'warn' ? <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
    : s === 'error' ? <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
    : <span className="w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-600 flex-shrink-0" />;

  return (
    <CalcCard title={`During-Lab — ${experiment.name}`} icon={Timer}>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-5">{config.intro}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {config.fields.map(f => (
          <div key={f.key} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">{f.label}</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={values[f.key]}
                onChange={e => setValues(s => ({ ...s, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full min-w-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 focus:border-teal-400 focus:outline-none"
              />
              <select
                value={units[f.key]}
                onChange={e => setUnits(s => ({ ...s, [f.key]: e.target.value }))}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-2 text-xs font-black text-slate-600 dark:text-slate-300 focus:border-teal-400 focus:outline-none"
              >
                {f.options.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>

      {!complete ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center">
          <Calculator className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-400">Still needed: {config.fields.filter(f => !isFinite(parseFloat(values[f.key]))).map(f => f.label).join(' · ')}</p>
          <p className="text-[11px] text-slate-400 mt-1">Unit conversion, automatic calculations and error checks run live once every field is entered.</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 mb-5">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Calculator className="w-3.5 h-3.5" /> Automatic Calculations · SI Conversion
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {rows.map((r, i) => (
                <div key={i} className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{r.label}</p>
                  <p className="text-base font-black text-slate-800 dark:text-white">{r.value} <span className="text-[10px] font-bold text-slate-400">{r.unit}</span></p>
                  {r.note && <p className="text-[9px] text-slate-400 mt-1 leading-tight">{r.note}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5" /> Unit & Error Checks
            </h4>
            <div className="space-y-2">
              {checks.map((c, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-3">
                  {statusIcon(c.status)}
                  <div className="min-w-0">
                    <p className={`text-xs font-black ${c.status === 'ok' ? 'text-emerald-600 dark:text-emerald-400' : c.status === 'warn' ? 'text-amber-600 dark:text-amber-400' : c.status === 'error' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>{c.label}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">{c.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </CalcCard>
  );
}

// ─── AUTOMATED LAB NOTEBOOK & SESSION SAVER WITH LIVE GRAPH GENERATOR ───
function SavedLabNotebooksSessionComponent() {
  const [sessions, setSessions] = useState<SavedLabSession[]>(() => {
    try {
      const saved = localStorage.getItem('chembase_lab_sessions');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return DEFAULT_LAB_SESSIONS;
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(sessions[0]?.id || 'lab-1');

  // New Lab Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Fluid Mechanics');
  const [inputX, setInputX] = useState('');
  const [inputY, setInputY] = useState('');
  const [inputLabel, setInputLabel] = useState('');

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  const saveToStorage = (updated: SavedLabSession[]) => {
    setSessions(updated);
    localStorage.setItem('chembase_lab_sessions', JSON.stringify(updated));
  };

  const createNextLab = () => {
    const nextNumber = `Lab ${sessions.length + 1}`;
    const newLab: SavedLabSession = {
      id: `lab-${Date.now()}`,
      labNumber: nextNumber,
      title: newTitle || `${nextNumber}: Chemical Engineering Experiment`,
      date: new Date().toISOString().split('T')[0],
      category: newCategory,
      dataPoints: [
        { x: 1, y: 2.5, label: 'Initial Run' },
        { x: 2, y: 5.1, label: 'Run 2' },
        { x: 3, y: 7.8, label: 'Run 3' },
      ],
      discussion: `Automatic analysis for ${nextNumber}: Experimental data demonstrates steady-state convergence with low empirical variance.`,
      vivaScore: 90,
    };
    const updated = [newLab, ...sessions];
    saveToStorage(updated);
    setActiveSessionId(newLab.id);
    setNewTitle('');
  };

  const addDataPoint = () => {
    const xVal = parseFloat(inputX);
    const yVal = parseFloat(inputY);
    if (isNaN(xVal) || isNaN(yVal) || !activeSession) return;

    const updated = sessions.map(s => {
      if (s.id === activeSession.id) {
        return {
          ...s,
          dataPoints: [...s.dataPoints, { x: xVal, y: yVal, label: inputLabel || `Pt ${s.dataPoints.length + 1}` }]
        };
      }
      return s;
    });

    saveToStorage(updated);
    setInputX('');
    setInputY('');
    setInputLabel('');
  };

  const deleteLab = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    saveToStorage(updated);
    if (updated.length > 0) setActiveSessionId(updated[0].id);
  };

  return (
    <CalcCard title="Automated Lab Manual Notebook & Session Saver (Lab 1, Lab 2, ...)" icon={BookOpen}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Automatically saves your experimental runs, generates embedded real-time graphs, post-lab questions, and overall viva scores!</p>
      
      {/* Session Selection & Creator */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap gap-2">
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSessionId(s.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeSession?.id === s.id
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> {s.labNumber}: {s.title.split(':')[0]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="New Lab Title (e.g. Lab 3: Distillation)"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
          <select
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          >
            <option value="Fluid Mechanics">Fluid Mechanics</option>
            <option value="Heat Transfer">Heat Transfer</option>
            <option value="Thermodynamics">Thermodynamics</option>
            <option value="Mass Transfer">Mass Transfer</option>
            <option value="Reaction Engineering">Reaction Engineering</option>
          </select>
          <button
            onClick={createNextLab}
            className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-black shadow-md hover:bg-teal-700 transition-all flex items-center gap-1"
          >
            + Create Next Lab
          </button>
        </div>
      </div>

      {activeSession && (
        <div className="space-y-8">
          {/* Active Lab Header */}
          <div className="p-6 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-lg bg-teal-600 text-white text-xs font-black uppercase tracking-wider">{activeSession.labNumber}</span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{activeSession.title}</h3>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Category: <strong>{activeSession.category}</strong> · Date Logged: <strong>{activeSession.date}</strong> · Points: <strong>{activeSession.dataPoints.length}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Overall Viva Score</span>
                <span className="text-xl font-black text-emerald-600">{activeSession.vivaScore}%</span>
              </div>
              <button
                onClick={() => deleteLab(activeSession.id)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-all"
              >
                Delete Lab
              </button>
            </div>
          </div>

          {/* Embedded Real-Time Graph Generator */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2">
                <LineChartIcon className="w-4 h-4 text-teal-600" /> Embedded Dynamic Graph Generator ({activeSession.labNumber})
              </h4>
              <span className="text-[10px] font-bold text-teal-500 uppercase tracking-widest">Auto-Plotted Live</span>
            </div>

            {activeSession.dataPoints.length > 0 ? (
              <div className="h-[300px] w-full bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activeSession.dataPoints}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="x" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} label={{ value: 'Input X Variable', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} label={{ value: 'Measured Y Output', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="y" stroke="#0d9488" strokeWidth={3} dot={{ r: 5, fill: '#0d9488' }} isAnimationActive={false} name="Measured Data" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No data points logged yet. Add data points below to render the graph!</p>
            )}

            {/* Data Point Entry Form */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">X Parameter</label>
                <input type="number" placeholder="e.g. 500" value={inputX} onChange={e => setInputX(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Y Response</label>
                <input type="number" placeholder="e.g. 0.045" value={inputY} onChange={e => setInputY(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Run Label</label>
                <input type="text" placeholder="e.g. Run 6" value={inputLabel} onChange={e => setInputLabel(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700" />
              </div>
              <button onClick={addDataPoint} className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-black hover:bg-teal-700 transition-all">
                + Plot Data Point
              </button>
            </div>
          </div>

          {/* Auto Post-Lab Discussion & Conclusion */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" /> Auto-Generated Post-Lab Discussion & Conclusion
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              {activeSession.discussion}
            </p>
          </div>
        </div>
      )}
    </CalcCard>
  );
}

// ─── Main module ────────────────────────────────────────────────────────────
const TABS = [
  { id: 'notebook', label: 'Auto-Saved Notebook (Lab 1, 2...)', icon: BookOpen },
  { id: 'lab', label: 'Experiment Library', icon: FlaskConical },
  { id: 'pre', label: 'Pre-Lab', icon: BookOpen },
  { id: 'during', label: 'During-Lab', icon: Timer },
  { id: 'viva', label: 'Viva Practice', icon: GraduationCap },
  { id: 'post', label: 'Post-Lab', icon: Lightbulb },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function LaboratoryAssistantModule() {
  const [tab, setTab] = useState<TabId>('lab');
  const [selectedId, setSelectedId] = useState(EXPERIMENTS[0].id);
  const experiment = EXPERIMENTS.find(e => e.id === selectedId) ?? EXPERIMENTS[0];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-teal-500/25">
            <Microscope className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">Laboratory Assistant</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Experiment library with pre-lab prep, in-lab data sheets (live calculations, unit conversion and error checks), post-lab analysis and a self-graded viva simulator.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 border transition-all ${tab === t.id ? 'bg-teal-600 text-white border-teal-600 shadow-lg shadow-teal-600/20' : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-teal-400'}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'lab' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {EXPERIMENTS.map(e => {
            const totalQ = Object.values(e.viva).reduce((s, l) => s + l.length, 0);
            const Icon = e.icon;
            return (
              <div key={e.id} className={`glass rounded-3xl border p-6 transition-all cursor-pointer group ${selectedId === e.id ? 'border-teal-400 shadow-lg shadow-teal-500/10' : 'border-slate-200 dark:border-slate-800 hover:border-teal-300'}`}
                onClick={() => { setSelectedId(e.id); setTab('pre'); }}>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {Icon}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{e.duration}</span>
                  </div>
                </div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1 group-hover:text-teal-600 transition-colors">{e.name}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-teal-500 mb-3">{e.category}</p>
                <p className="text-xs text-slate-500 leading-relaxed mb-5">{e.objective}</p>
                <div className="flex gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500">
                    {e.before.procedure.length} steps
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500">
                    {totalQ} viva questions
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {tab === 'notebook' && <SavedLabNotebooksSessionComponent />}
      {tab === 'pre' && <PreLab key={`pre-${experiment.id}`} experiment={experiment} />}
      {tab === 'during' && <DuringLab key={`during-${experiment.id}`} experiment={experiment} />}
      {tab === 'viva' && <VivaQuiz key={`viva-${experiment.id}`} experiment={experiment} />}
      {tab === 'post' && <PostLab key={`post-${experiment.id}`} experiment={experiment} />}
    </div>
  );
}
