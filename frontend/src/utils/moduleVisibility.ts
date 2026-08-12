// Governance utility for disabling/enabling Advanced Engineering Modules and specific Sub-Tools

export interface ModuleGovernance {
  disabledModules: Record<string, boolean>; // e.g. { 'thermodynamics': true }
  disabledTools: Record<string, boolean>;   // e.g. { 'thermodynamics:nrtl': true }
}

const STORAGE_KEY = 'chembase_module_governance_v1';

const defaultGovernance: ModuleGovernance = {
  disabledModules: {},
  disabledTools: {},
};

export function getModuleGovernance(): ModuleGovernance {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultGovernance;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading module governance:', err);
    return defaultGovernance;
  }
}

export function saveModuleGovernance(governance: ModuleGovernance): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(governance));
    // Dispatch custom event for real-time reactivity across components
    window.dispatchEvent(new Event('chembase-governance-updated'));
  } catch (err) {
    console.error('Error saving module governance:', err);
  }
}

export function isModuleEnabled(moduleId: string): boolean {
  const gov = getModuleGovernance();
  return !gov.disabledModules[moduleId];
}

export function isToolEnabled(moduleId: string, toolId: string): boolean {
  const gov = getModuleGovernance();
  if (gov.disabledModules[moduleId]) return false;
  const key = `${moduleId}:${toolId}`;
  return !gov.disabledTools[key];
}
