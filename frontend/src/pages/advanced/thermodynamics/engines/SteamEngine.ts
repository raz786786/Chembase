/**
 * SteamEngine.ts
 * Centralized property engine for steam/water thermodynamics.
 * Provides data and interpolation methods for saturated and superheated steam.
 */

// Basic saturated steam table data (Temperature based)
// T(°C), P(MPa), hf(kJ/kg), hfg(kJ/kg), hg(kJ/kg), sf(kJ/kgK), sfg(kJ/kgK), sg(kJ/kgK), vf(m3/kg), vg(m3/kg)
export const STEAM_SAT_DATA = [
  { T: 0.01, P: 0.000611, hf: 0, hfg: 2501.3, hg: 2501.3, sf: 0, sfg: 9.156, sg: 9.156, vf: 0.001000, vg: 206.1 },
  { T: 5, P: 0.000872, hf: 21.0, hfg: 2489.6, hg: 2510.6, sf: 0.0763, sfg: 8.949, sg: 9.026, vf: 0.001000, vg: 147.1 },
  { T: 10, P: 0.001228, hf: 42.0, hfg: 2477.7, hg: 2519.8, sf: 0.1511, sfg: 8.749, sg: 8.900, vf: 0.001000, vg: 106.4 },
  { T: 20, P: 0.002339, hf: 83.9, hfg: 2454.1, hg: 2538.1, sf: 0.2966, sfg: 8.371, sg: 8.667, vf: 0.001002, vg: 57.79 },
  { T: 30, P: 0.004246, hf: 125.7, hfg: 2430.5, hg: 2556.3, sf: 0.4369, sfg: 8.016, sg: 8.453, vf: 0.001004, vg: 32.89 },
  { T: 40, P: 0.007384, hf: 167.5, hfg: 2406.7, hg: 2574.3, sf: 0.5725, sfg: 7.684, sg: 8.257, vf: 0.001008, vg: 19.52 },
  { T: 50, P: 0.01235, hf: 209.3, hfg: 2382.7, hg: 2592.1, sf: 0.7038, sfg: 7.372, sg: 8.076, vf: 0.001012, vg: 12.03 },
  { T: 60, P: 0.01994, hf: 251.1, hfg: 2358.5, hg: 2609.6, sf: 0.8312, sfg: 7.078, sg: 7.909, vf: 0.001017, vg: 7.671 },
  { T: 70, P: 0.03119, hf: 293.0, hfg: 2333.8, hg: 2626.8, sf: 0.9549, sfg: 6.800, sg: 7.755, vf: 0.001023, vg: 5.042 },
  { T: 80, P: 0.04739, hf: 334.9, hfg: 2308.8, hg: 2643.7, sf: 1.0753, sfg: 6.536, sg: 7.612, vf: 0.001029, vg: 3.407 },
  { T: 90, P: 0.07014, hf: 376.9, hfg: 2283.2, hg: 2660.1, sf: 1.1925, sfg: 6.286, sg: 7.479, vf: 0.001036, vg: 2.361 },
  { T: 100, P: 0.10142, hf: 419.0, hfg: 2257.0, hg: 2676.1, sf: 1.3069, sfg: 6.048, sg: 7.355, vf: 0.001044, vg: 1.673 },
  { T: 120, P: 0.19853, hf: 503.7, hfg: 2202.6, hg: 2706.3, sf: 1.5276, sfg: 5.602, sg: 7.130, vf: 0.001060, vg: 0.892 },
  { T: 140, P: 0.3613, hf: 589.1, hfg: 2144.7, hg: 2733.9, sf: 1.7391, sfg: 5.191, sg: 6.930, vf: 0.001080, vg: 0.509 },
  { T: 160, P: 0.6178, hf: 675.5, hfg: 2082.6, hg: 2758.1, sf: 1.9427, sfg: 4.808, sg: 6.750, vf: 0.001102, vg: 0.307 },
  { T: 180, P: 1.0021, hf: 763.2, hfg: 2015.0, hg: 2778.2, sf: 2.1396, sfg: 4.446, sg: 6.586, vf: 0.001127, vg: 0.194 },
  { T: 200, P: 1.5538, hf: 852.4, hfg: 1940.7, hg: 2793.2, sf: 2.3309, sfg: 4.101, sg: 6.432, vf: 0.001157, vg: 0.127 },
  { T: 250, P: 3.973, hf: 1085.4, hfg: 1716.2, hg: 2801.5, sf: 2.7927, sfg: 3.280, sg: 6.073, vf: 0.001251, vg: 0.0501 },
  { T: 300, P: 8.581, hf: 1344.0, hfg: 1404.9, hg: 2749.0, sf: 3.2534, sfg: 2.452, sg: 5.704, vf: 0.001404, vg: 0.0217 },
  { T: 350, P: 16.513, hf: 1670.6, hfg: 893.3, hg: 2563.9, sf: 3.7777, sfg: 1.433, sg: 5.211, vf: 0.001740, vg: 0.00881 },
  { T: 374.14, P: 22.064, hf: 2099.3, hfg: 0, hg: 2099.3, sf: 4.4298, sfg: 0, sg: 4.4298, vf: 0.003106, vg: 0.003106 }
];

export type SteamProperty = keyof typeof STEAM_SAT_DATA[0];

export class SteamEngine {
  /**
   * Interpolate properties based on Temperature (°C)
   */
  static getSatPropByT(T: number, prop: SteamProperty): number {
    if (isNaN(T)) return NaN;
    const data = STEAM_SAT_DATA;
    if (T <= data[0].T) return data[0][prop];
    if (T >= data[data.length - 1].T) return data[data.length - 1][prop];
    
    for (let i = 0; i < data.length - 1; i++) {
      if (T >= data[i].T && T <= data[i + 1].T) {
        const frac = (T - data[i].T) / (data[i + 1].T - data[i].T);
        return data[i][prop] + frac * (data[i + 1][prop] - data[i][prop]);
      }
    }
    return NaN;
  }

  /**
   * Interpolate properties based on Pressure (MPa)
   */
  static getSatPropByP(P: number, prop: SteamProperty): number {
    if (isNaN(P)) return NaN;
    const data = STEAM_SAT_DATA;
    if (P <= data[0].P) return data[0][prop];
    if (P >= data[data.length - 1].P) return data[data.length - 1][prop];

    for (let i = 0; i < data.length - 1; i++) {
      if (P >= data[i].P && P <= data[i + 1].P) {
        const frac = (P - data[i].P) / (data[i + 1].P - data[i].P);
        return data[i][prop] + frac * (data[i + 1][prop] - data[i][prop]);
      }
    }
    return NaN;
  }

  /**
   * Determine steam quality (x) given T or P, and a specific property (v, h, u, or s)
   * Example: getQuality({ T: 100, h: 2000 })
   */
  static getQuality(conditions: { T?: number, P?: number, h?: number, s?: number, v?: number, u?: number }): number {
    let propVal: number | undefined;
    let propName: 'h' | 's' | 'v' | 'u' | undefined;

    if (conditions.h !== undefined) { propVal = conditions.h; propName = 'h'; }
    else if (conditions.s !== undefined) { propVal = conditions.s; propName = 's'; }
    else if (conditions.v !== undefined) { propVal = conditions.v; propName = 'v'; }

    if (propVal === undefined || propName === undefined) return NaN;
    
    let pf = 0, pg = 0;
    
    if (conditions.T !== undefined) {
      pf = this.getSatPropByT(conditions.T, `${propName}f` as any);
      pg = this.getSatPropByT(conditions.T, `${propName}g` as any);
    } else if (conditions.P !== undefined) {
      pf = this.getSatPropByP(conditions.P, `${propName}f` as any);
      pg = this.getSatPropByP(conditions.P, `${propName}g` as any);
    } else {
      return NaN;
    }

    if (propVal < pf) return 0; // Subcooled liquid
    if (propVal > pg) return 1; // Superheated vapor
    
    return (propVal - pf) / (pg - pf);
  }

  /**
   * Get mixture property given quality (x)
   */
  static getWetProperty(conditions: { T?: number, P?: number, x: number }, prop: 'h' | 's' | 'v' | 'u'): number {
    if (conditions.x < 0 || conditions.x > 1) return NaN;
    
    let pf = 0, pfg = 0;
    
    if (conditions.T !== undefined) {
      pf = this.getSatPropByT(conditions.T, `${prop}f` as any);
      if (prop === 'v') {
        const vg = this.getSatPropByT(conditions.T, 'vg');
        pfg = vg - pf;
      } else {
        pfg = this.getSatPropByT(conditions.T, `${prop}fg` as any);
      }
    } else if (conditions.P !== undefined) {
      pf = this.getSatPropByP(conditions.P, `${prop}f` as any);
      if (prop === 'v') {
        const vg = this.getSatPropByP(conditions.P, 'vg');
        pfg = vg - pf;
      } else {
        pfg = this.getSatPropByP(conditions.P, `${prop}fg` as any);
      }
    } else {
      return NaN;
    }

    return pf + conditions.x * pfg;
  }
}
