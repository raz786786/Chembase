export interface RawMaterial {
  name: string;
  purpose: string;
  properties: string;
  entryPoint: string; // The process where it enters
}

export interface Product {
  name: string;
  purpose: string;
  productionRoute: string;
}

export interface OperatingParameter {
  name: string;
  importance: string;
  tooHigh: string;
  tooLow: string;
}

export interface ProcessControlLoop {
  controlledVariable: string;
  manipulatedVariable: string;
  sensor: string;
  valve: string;
  controller: string;
}

export interface ProcessHazard {
  type: string;
  description: string;
  precautions: string;
  ppe: string[];
}

export interface IndustrialProcess {
  id: string;
  name: string;
  purpose: string;
  workingPrinciple: string;
  inputs: { materials: string[]; utilities: string[]; energy: string[] };
  outputs: { products: string[]; byproducts: string[]; waste: string[] };
  typicalConditions: Record<string, string>;
  chemicalReactions: string[]; // List of equations or text
  massBalanceDesc: string;
  energyBalanceDesc: string;
  equipmentIds: string[]; // References to equipment DB
  instruments: string[];
  control: ProcessControlLoop[];
  hazards: ProcessHazard[];
  environmentalImpact: { emissions: string[]; waste: string[]; controlTech: string[] };
  commonProblems: string[];
  troubleshooting: TroubleshootingCase[];
  relatedSubjects: string[];
  // For the flowchart:
  nextProcessIds: string[]; 
}

export interface TroubleshootingCase {
  id: string;
  symptom: string;
  possibleCauses: string[];
  whatToCheckFirst: string;
  diagnosticQuestions: string[];
  possibleSolutions: string[];
  safetyConsiderations: string;
}

export interface EngineeringChallenge {
  id: string;
  scenario: string;
  options: { text: string; feedback: string; score: number }[];
  correctApproach: string;
}

export interface IndustryRole {
  title: string;
  responsibilities: string[];
  skills: string[];
  typicalProblems: string[];
}

export interface Industry {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  rawMaterials: RawMaterial[];
  products: Product[];
  roles: IndustryRole[];
  processes: IndustrialProcess[]; // Ordered or graph of processes
  challenges: EngineeringChallenge[];
  relatedSubjects: { subjectId: string; application: string }[];
}

export interface IndustrialEquipment {
  id: string;
  name: string;
  type: string;
  purpose: string;
  workingPrinciple: string;
  mainComponents: string[];
  operatingParameters: OperatingParameter[];
  commonFailures: string[];
  maintenance: string[];
  hazards: ProcessHazard[];
  relatedLabs: string[]; // e.g. "lab-pump-performance"
  relatedCalculators: string[]; // e.g. "calc-pump-power"
  vivaQuestions: { q: string; a: string }[];
}
