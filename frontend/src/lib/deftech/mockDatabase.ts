import { DefenseCompound } from '../../types/deftech';

export const MOCK_DEFENSE_DB: DefenseCompound[] = [
  {
    id: 'comp-1',
    name: 'Triethanolamine',
    casNumber: '102-71-6',
    unNumber: 'UN3334',
    cwcSchedule: 'Schedule 3',
    explosiveClass: 'Fuel',
    currentStockKg: 800,
    maxPermittedKg: 1000
  },
  {
    id: 'comp-2',
    name: 'Thiodiglycol',
    casNumber: '111-48-8',
    unNumber: 'UN3334',
    cwcSchedule: 'Schedule 2',
    explosiveClass: 'Fuel',
    currentStockKg: 550,
    maxPermittedKg: 500
  },
  {
    id: 'comp-3',
    name: 'HTPB',
    casNumber: '69102-90-5',
    unNumber: 'UN3082',
    cwcSchedule: 'None',
    explosiveClass: 'Fuel',
    currentStockKg: 2000,
    maxPermittedKg: 5000
  },
  {
    id: 'comp-4',
    name: 'Ammonium Perchlorate',
    casNumber: '7790-98-9',
    unNumber: 'UN1442',
    cwcSchedule: 'None',
    explosiveClass: 'Oxidizer',
    currentStockKg: 1500,
    maxPermittedKg: 2000
  },
  {
    id: 'comp-5',
    name: 'Nitromethane',
    casNumber: '75-52-5',
    unNumber: 'UN1261',
    cwcSchedule: 'None',
    explosiveClass: '1.1',
    currentStockKg: 400,
    maxPermittedKg: 500
  },
  {
    id: 'comp-6',
    name: 'Aluminum Powder',
    casNumber: '7429-90-5',
    unNumber: 'UN1396',
    cwcSchedule: 'None',
    explosiveClass: 'Fuel',
    currentStockKg: 2500,
    maxPermittedKg: 3000
  }
];
