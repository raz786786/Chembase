/**
 * RealGasEngine.ts
 * Centralized property engine for real gases (cubic equations of state).
 * Supports Peng-Robinson (PR), Soave-Redlich-Kwong (SRK), and van der Waals (vdW).
 */

export interface ComponentProps {
  id: string;
  name: string;
  tc: number; // Critical temperature in K
  pc: number; // Critical pressure in bar
  w: number;  // Acentric factor
}

export type EOSType = 'PR' | 'SRK' | 'VDW';

export interface EOSResult {
  Zv: number; // Vapor compressibility
  Zl: number; // Liquid compressibility
  phi_v: number; // Vapor fugacity coefficient
  phi_l: number; // Liquid fugacity coefficient
  Vv: number; // Vapor molar volume (m^3/mol)
  Vl: number; // Liquid molar volume (m^3/mol)
  phase: string;
}

export class RealGasEngine {
  static R = 8.31446261815324; // J/(mol K)

  /**
   * Solve cubic equation Z^3 + c2*Z^2 + c1*Z + c0 = 0 using Cardano's analytical method
   */
  private static solveCubic(c2: number, c1: number, c0: number): number[] {
    const Q = (3 * c1 - c2 * c2) / 9;
    const R_c = (9 * c2 * c1 - 27 * c0 - 2 * c2 * c2 * c2) / 54;
    const D = Q * Q * Q + R_c * R_c;

    const roots: number[] = [];
    if (D < 0) {
      // 3 Real Roots
      const theta = Math.acos(R_c / Math.sqrt(-Q * Q * Q));
      const sqrtQ = Math.sqrt(-Q);
      roots.push(2 * sqrtQ * Math.cos(theta / 3) - c2 / 3);
      roots.push(2 * sqrtQ * Math.cos((theta + 2 * Math.PI) / 3) - c2 / 3);
      roots.push(2 * sqrtQ * Math.cos((theta + 4 * Math.PI) / 3) - c2 / 3);
    } else {
      // 1 Real Root
      const S = Math.cbrt(R_c + Math.sqrt(D));
      const T_val = Math.cbrt(R_c - Math.sqrt(D));
      roots.push(S + T_val - c2 / 3);
    }
    return roots.sort((a, b) => a - b);
  }

  /**
   * Peng-Robinson Equation of State
   */
  static solvePR(comp: ComponentProps, T: number, P_bar: number): EOSResult {
    const P_pa = P_bar * 100000;
    const Pc_pa = comp.pc * 100000;
    const Tr = T / comp.tc;
    const kappa = 0.37464 + 1.54226 * comp.w - 0.26992 * comp.w * comp.w;
    const alpha = Math.pow(1 + kappa * (1 - Math.sqrt(Tr)), 2);

    const a = (0.45724 * this.R * this.R * comp.tc * comp.tc * alpha) / Pc_pa;
    const b = (0.07780 * this.R * comp.tc) / Pc_pa;

    const A = (a * P_pa) / (this.R * this.R * T * T);
    const B = (b * P_pa) / (this.R * T);

    const c2 = -(1 - B);
    const c1 = A - 3 * B * B - 2 * B;
    const c0 = -(A * B - B * B - B * B * B);

    const roots = this.solveCubic(c2, c1, c0).filter(z => z > B);
    
    let Zl = NaN, Zv = NaN;
    let phase = '';

    if (roots.length === 3) {
      Zl = roots[0];
      Zv = roots[2];
      phase = 'Two-Phase (VLE Region)';
    } else if (roots.length === 1) {
      Zv = roots[0];
      Zl = roots[0];
      phase = Tr > 1.0 ? 'Supercritical Gas' : (Zv > 0.5 ? 'Vapor Phase' : 'Liquid Phase');
    }

    const calcPhi = (Z: number) => {
      if (isNaN(Z)) return NaN;
      const term1 = Z - 1 - Math.log(Z - B);
      const term2 = (A / (2 * Math.sqrt(2) * B)) * Math.log((Z + (1 + Math.sqrt(2)) * B) / (Z + (1 - Math.sqrt(2)) * B));
      return Math.exp(term1 - term2);
    };

    return {
      Zv,
      Zl,
      phi_v: calcPhi(Zv),
      phi_l: calcPhi(Zl),
      Vv: (Zv * this.R * T) / P_pa,
      Vl: (Zl * this.R * T) / P_pa,
      phase
    };
  }

  // To be expanded with SRK and vdW later
}
