export interface DefenseCompound {
  id: string;
  name: string;
  casNumber: string;
  unNumber: string;
  cwcSchedule: 'Schedule 1' | 'Schedule 2' | 'Schedule 3' | 'None';
  explosiveClass: '1.1' | 'Oxidizer' | 'Fuel' | 'Inert';
  currentStockKg: number;
  maxPermittedKg: number;
}

export interface TelemetryFeed {
  bunkerId: string;
  tempC: number;
  humidity: number;
  vocPpm: number;
  status: 'NOMINAL' | 'WARNING' | 'CRITICAL';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  operatorTier: string;
  hash: string;
}
