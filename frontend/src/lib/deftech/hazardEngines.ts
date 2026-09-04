import { DefenseCompound } from '../../types/deftech';

export function evaluateStorageSafety(c1: DefenseCompound, c2: DefenseCompound): { status: string; message: string } {
  const isOxidizerAndFuel = 
    (c1.explosiveClass === 'Oxidizer' && c2.explosiveClass === 'Fuel') || 
    (c1.explosiveClass === 'Fuel' && c2.explosiveClass === 'Oxidizer');

  if (isOxidizerAndFuel) {
    return { 
      status: 'FORBIDDEN', 
      message: 'CRITICAL: Hypergolic/Combustion Risk. Violates STANAG 4145.' 
    };
  }

  return { 
    status: 'SAFE', 
    message: 'STANAG 4145 Compliant Co-location.' 
  };
}

export function calculateBlastStandoff(massKg: number): string {
  return (4.5 * Math.pow(massKg, 1/3)).toFixed(2);
}
