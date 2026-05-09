// Comprehensive Chemical Engineering Pure Component Databank
// Accurate constants sourced for rigorous equation of state and vapor pressure calculation.

export interface ChemComponent {
  id: string;
  name: string;
  formula: string;
  mw: number;     // Molecular Weight (g/mol)
  tc: number;     // Critical Temperature (K)
  pc: number;     // Critical Pressure (bar)
  w: number;      // Acentric Factor
  antoine: { A: number; B: number; C: number }; // Antoine constants for log10(P[bar]) = A - B/(T[K] + C)
  density: number; // reference liquid density at 25C (kg/m^3)
}

// Antoine Equation format: log10(P in bar) = A - (B / (T in K + C))
export const COMPONENT_DB: ChemComponent[] = [
  { id: 'water', name: 'Water', formula: 'H₂O', mw: 18.015, tc: 647.1, pc: 220.6, w: 0.344, antoine: { A: 5.11564, B: 1687.537, C: -42.98 }, density: 997 },
  { id: 'methane', name: 'Methane', formula: 'CH₄', mw: 16.04, tc: 190.6, pc: 45.99, w: 0.011, antoine: { A: 3.9895, B: 443.028, C: -0.49 }, density: 422.6 }, // Liq density at BP
  { id: 'ethane', name: 'Ethane', formula: 'C₂H₆', mw: 30.07, tc: 305.3, pc: 48.72, w: 0.099, antoine: { A: 3.95405, B: 663.72, C: -16.6 }, density: 544 },
  { id: 'propane', name: 'Propane', formula: 'C₃H₈', mw: 44.1, tc: 369.8, pc: 42.48, w: 0.152, antoine: { A: 3.92828, B: 803.997, C: -26.11 }, density: 493 },
  { id: 'n_butane', name: 'n-Butane', formula: 'C₄H₁₀', mw: 58.12, tc: 425.1, pc: 37.96, w: 0.2, antoine: { A: 3.93266, B: 935.773, C: -34.361 }, density: 573 },
  { id: 'i_butane', name: 'Isobutane', formula: 'C₄H₁₀', mw: 58.12, tc: 408.1, pc: 36.48, w: 0.181, antoine: { A: 3.95754, B: 905.748, C: -27.42 }, density: 556 },
  { id: 'n_pentane', name: 'n-Pentane', formula: 'C₅H₁₂', mw: 72.15, tc: 469.7, pc: 33.7, w: 0.252, antoine: { A: 3.97786, B: 1064.84, C: -41.136 }, density: 626 },
  { id: 'n_hexane', name: 'n-Hexane', formula: 'C₆H₁₄', mw: 86.18, tc: 507.6, pc: 30.25, w: 0.301, antoine: { A: 4.00266, B: 1171.53, C: -48.784 }, density: 659 },
  { id: 'n_heptane', name: 'n-Heptane', formula: 'C₇H₁₆', mw: 100.2, tc: 540.2, pc: 27.4, w: 0.349, antoine: { A: 4.02832, B: 1265.99, C: -56.199 }, density: 684 },
  { id: 'n_octane', name: 'n-Octane', formula: 'C₈H₁₈', mw: 114.23, tc: 568.7, pc: 24.9, w: 0.398, antoine: { A: 4.04867, B: 1355.126, C: -63.633 }, density: 703 },
  { id: 'ethylene', name: 'Ethylene', formula: 'C₂H₄', mw: 28.05, tc: 282.3, pc: 50.4, w: 0.089, antoine: { A: 3.9135, B: 595.68, C: -15.17 }, density: 568 },
  { id: 'propylene', name: 'Propylene', formula: 'C₃H₆', mw: 42.08, tc: 364.9, pc: 46.0, w: 0.14, antoine: { A: 3.95606, B: 789.624, C: -24.81 }, density: 513 },
  { id: 'benzene', name: 'Benzene', formula: 'C₆H₆', mw: 78.11, tc: 562.2, pc: 48.9, w: 0.21, antoine: { A: 4.01814, B: 1203.835, C: -53.226 }, density: 876 },
  { id: 'toluene', name: 'Toluene', formula: 'C₇H₈', mw: 92.14, tc: 591.8, pc: 41.0, w: 0.262, antoine: { A: 4.07227, B: 1343.943, C: -53.773 }, density: 867 },
  { id: 'methanol', name: 'Methanol', formula: 'CH₃OH', mw: 32.04, tc: 512.6, pc: 80.9, w: 0.564, antoine: { A: 5.20409, B: 1581.341, C: -33.5 }, density: 792 },
  { id: 'ethanol', name: 'Ethanol', formula: 'C₂H₅OH', mw: 46.07, tc: 513.9, pc: 61.4, w: 0.645, antoine: { A: 5.24677, B: 1598.673, C: -46.424 }, density: 789 },
  { id: 'ammonia', name: 'Ammonia', formula: 'NH₃', mw: 17.03, tc: 405.4, pc: 113.5, w: 0.252, antoine: { A: 4.41727, B: 925.3, C: -31.42 }, density: 681 },
  { id: 'co2', name: 'Carbon Dioxide', formula: 'CO₂', mw: 44.01, tc: 304.1, pc: 73.8, w: 0.225, antoine: { A: 6.81228, B: 1301.679, C: -3.494 }, density: 800 } // Solid/Sublimation range typical
];
