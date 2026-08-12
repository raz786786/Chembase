// Admin AI Model Governance Utility
// Allows Super Admin to enable/disable specific AI models from appearing in users' Settings Pipeline.

const MODEL_GOVERNANCE_KEY = 'chembase_disabled_models';

export type ModelGovernanceMap = Record<string, boolean>; // key format: "provider:modelId" -> true if disabled

export function getDisabledModels(): ModelGovernanceMap {
  try {
    const saved = localStorage.getItem(MODEL_GOVERNANCE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return {};
}

export function saveDisabledModels(disabledMap: ModelGovernanceMap): void {
  localStorage.setItem(MODEL_GOVERNANCE_KEY, JSON.stringify(disabledMap));
  window.dispatchEvent(new Event('chembase-model-governance-updated'));
}

export function isModelEnabledForUser(provider: string, modelId: string): boolean {
  const disabledMap = getDisabledModels();
  return !disabledMap[`${provider}:${modelId}`];
}
