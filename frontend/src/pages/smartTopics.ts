export interface SmartTopic {
  id: string;
  path: string;
  keywords: string[];
  explain: string;
  equations: string[];
  practice: string;
  links: { to: string; label: string }[];
}


export const SMART_TOPICS: SmartTopic[] = [
  {
    id: 'reflux-distillation',
    path: 'Separation → Distillation → McCabe-Thiele',
    keywords: ['reflux ratio', 'reflux', 'distillation', 'mccabe', 'thiele', 'stages', 'trays', 'rectifying', 'stripping', 'q-line', 'feed line', 'azeotrope', 'relative volatility'],
    explain: 'Raising the reflux ratio sends more liquid back down the column, increasing the driving force for separation on every tray. Each tray then achieves more enrichment, so fewer trays are needed — but the reboiler duty (energy) rises because more liquid must be re-vaporised.',
    equations: ['R = L/D  (reflux ratio)', 'N/R trade-off: N ↓ as R ↑, energy ↑ as R ↑', 'y = αx / (1 + (α−1)x)  (equilibrium line)', 'R_min from q-line intersection → design R ≈ 1.2–1.5 R_min'],
    practice: 'A benzene/toluene column runs at R = 1.5. If R is raised to 2.5, what happens to (a) number of stages, (b) reboiler duty, (c) product purity? Sketch the McCabe-Thiele step change.',
    links: [
      { to: '/advanced/separation', label: 'Separation Processes' },
      { to: '/advanced/calculators', label: 'Calculators Hub' },
      { to: '/advanced/academic-hub', label: 'Quiz Lab' },
    ],
  },
  {
    id: 'thermo-cycles',
    path: 'Thermodynamics → Power Cycles → Efficiency',
    keywords: ['carnot', 'rankine', 'entropy', 'second law', 'heat engine', 'turbine work', 'isentropic', 'throttling', 'internal energy', 'enthalpy', 'pv diagram', 'reversible'],
    explain: 'A thermodynamic cycle converts heat into work between a hot and a cold reservoir. The Carnot efficiency η = 1 − Tc/Th is the ceiling; real Rankine cycles lose efficiency to irreversibilities in the turbine and pump, and to throttling losses in the condenser.',
    equations: ['η_carnot = 1 − Tc/Th', 'η_rankine = W_net / Q_in', 'W_turbine = m·(h_in − h_out)', 'ΔS ≥ 0 for any real process'],
    practice: 'A steam Rankine cycle operates between 30 bar boiler (T_h) and 0.1 bar condenser (T_c ≈ 46°C). Compute the Carnot efficiency and explain why the real cycle sits well below it.',
    links: [
      { to: '/advanced/thermodynamics', label: 'Thermodynamics Module' },
      { to: '/advanced/calculators', label: 'Calculators Hub' },
      { to: '/advanced/visualizations', label: 'Visualizations' },
    ],
  },
  {
    id: 'heat-exchanger',
    path: 'Heat Transfer → Heat Exchangers → LMTD',
    keywords: ['heat exchanger', 'lmtd', 'overall heat transfer', 'u value', 'shell and tube', 'counterflow', 'parallel flow', 'fouling', 'ntu', 'effectiveness', 'log mean'],
    explain: 'In a heat exchanger the temperature difference between hot and cold streams changes along the length, so the average driving force is the log mean temperature difference (LMTD). Q = U·A·ΔT_lm links the duty to the area; counterflow gives a larger LMTD than parallel flow for the same terminal temperatures.',
    equations: ['ΔT_lm = (ΔT1 − ΔT2) / ln(ΔT1/ΔT2)', 'Q = U·A·ΔT_lm', 'Q = m_c·Cp_c·ΔT_c = m_h·Cp_h·ΔT_h', '1/U = 1/h_i + R_f,i + x/k + R_f,o + 1/h_o'],
    practice: 'A counterflow exchanger heats 2 kg/s water from 20°C to 60°C with oil cooling from 150°C to 90°C. U = 300 W/m²·K. Find the area using LMTD — then redo it for parallel flow and compare areas.',
    links: [
      { to: '/advanced/heat-transfer', label: 'Heat Transfer Module' },
      { to: '/advanced/calculators', label: 'Exchanger Calculators' },
      { to: '/advanced/equipment', label: 'Equipment' },
    ],
  },
  {
    id: 'pump-npsh',
    path: 'Fluid Mechanics → Pumps → NPSH & Cavitation',
    keywords: ['pump', 'npsh', 'cavitation', 'bernoulli', 'reynolds number', 'friction factor', 'darcy', 'moody', 'pressure drop', 'pipe flow', 'laminar flow', 'turbulent flow'],
    explain: "A pump adds head to a fluid, but if the pressure at the suction drops below the vapour pressure, the liquid flashes and bubbles collapse on the impeller — cavitation. The margin is NPSH: NPSH_a must stay above the pump manufacturer's NPSH_r.",
    equations: ['NPSH_a = (P_s − P_v)/ρg + v²/2g − z_s', 'NPSH_a > NPSH_r  (no cavitation)', 'Pump power: P = ρ·g·Q·H/η', 'h_f = f·(L/D)·(v²/2g)  (Darcy)'],
    practice: 'Water at 25°C is drawn from an open tank 3 m above a pump. P_v = 3.17 kPa, ρ = 997 kg/m³. With NPSH_r = 4 m, will the pump cavitate? By how much must you lower the pump or raise the tank?',
    links: [
      { to: '/advanced/fluid-mechanics', label: 'Fluid Mechanics Module' },
      { to: '/advanced/calculators', label: 'Calculators Hub' },
      { to: '/advanced/equipment', label: 'Equipment' },
    ],
  },
  {
    id: 'diffusion-fick',
    path: "Mass Transfer → Diffusion → Fick's Law",
    keywords: ['diffusion', 'fick', 'diffusivity', 'flux', 'molar flux', 'concentration gradient', 'stagnant', 'equimolar', 'film', 'mass transfer coefficient'],
    explain: "Fick's first law says the molar flux J is proportional to the concentration gradient: J = −D·dC/dx. In a stagnant film (e.g. ammonia in air) the flux is driven by the partial-pressure difference across the film thickness.",
    equations: ['J_A = −D_AB·dC_A/dx', 'J_A = D_AB·(C_A1 − C_A2)/L  (steady film)', 'Sh = k_c·L/D  (Sherwood number)', "Graham's law: D ∝ 1/√M"],
    practice: 'Ammonia diffuses through a 1 cm stagnant air film; P_NH3 = 0.1 atm at one side, ~0 at the other, D = 2.3e-5 m²/s at 1 atm, 25°C. Compute the molar flux in kmol/m²·s.',
    links: [
      { to: '/advanced/mass-transfer', label: 'Mass Transfer Module' },
      { to: '/advanced/separation', label: 'Separation Processes' },
      { to: '/advanced/calculators', label: 'Calculators Hub' },
    ],
  },
  {
    id: 'reactor-design',
    path: 'Reaction Engineering → Reactor Design → CSTR/PFR',
    keywords: ['cstr', 'pfr', 'batch', 'reactor', 'conversion', 'rate constant', 'arrhenius', 'activation energy', 'residence time', 'space time', 'first order', 'rate law', 'plug flow'],
    explain: 'Reactor design links conversion X to reactor volume through the rate law. In a CSTR the rate is evaluated at outlet conditions (V = F_A0·X/−r_A); in a PFR you integrate along the tube (V = F_A0·∫dX/−r_A). The Arrhenius law governs how temperature changes the rate constant.',
    equations: ['CSTR: V = F_A0·X/(−r_A)', 'PFR: V = F_A0·∫₀^X dX/(−r_A)', 'Batch (1st order): t = (1/k)·ln(1/(1−X))', 'k = A·exp(−Ea/RT)'],
    practice: 'A first-order reaction k = 0.05 min⁻¹ is run in a CSTR fed 10 L/min of 2 mol/L A. Find the volume for 90% conversion — then compare with the PFR volume and explain why the PFR is smaller.',
    links: [
      { to: '/advanced/reaction-eng', label: 'Reaction Eng. Module' },
      { to: '/advanced/process-simulation', label: 'Process Simulation' },
      { to: '/advanced/calculators', label: 'Calculators Hub' },
    ],
  },
  {
    id: 'control-pid',
    path: 'Process Control → Feedback → PID Tuning',
    keywords: ['pid', 'controller', 'feedback', 'control loop', 'setpoint', 'process variable', 'gain', 'integral', 'derivative', 'offset', 'stability', 'bode', 'transfer function', 'response'],
    explain: 'A feedback controller compares the measured process variable with the setpoint and computes a corrective output. P removes offset slowly, I eliminates steady-state offset, D anticipates error growth. Too much gain causes oscillation or instability.',
    equations: ['u(t) = K_c·e(t) + (K_c/τ_i)·∫e dt + K_c·τ_d·de/dt', 'Error: e = SP − PV', 'Closed-loop stability ↔ gain/phase margins', 'Ziegler-Nichols: K_u, P_u → K_c = 0.6·K_u'],
    practice: 'A level loop oscillates when K_c = 8 (ultimate gain, period 3 min). Tune a PID using Ziegler-Nichols and explain what happens if you double K_c from the tuned value.',
    links: [
      { to: '/advanced/process-control', label: 'Process Control Module' },
      { to: '/advanced/visualizations', label: 'Visualizations' },
      { to: '/advanced/calculators', label: 'Calculators Hub' },
    ],
  },
]

// ─── Detection engine: score topics against the question text ───────────────
export function detectTopics(text: string, limit = 3): SmartTopic[] {
  const q = text.toLowerCase();
  if (!q.trim()) return [];
  const scored = SMART_TOPICS
    .map(t => {
      let hits = 0;
      for (const k of t.keywords) {
        // exact whole-word match scores 1; looser substring match scores 0.5 (mutually exclusive)
        if (k.length > 3 && new RegExp('\\b' + k + '\\b').test(q)) hits += 1;
        else if (q.includes(k)) hits += 0.5;
      }
      return { t, hits };
    })
    .filter(x => x.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, limit)
    .map(x => x.t);
  return scored;
}

