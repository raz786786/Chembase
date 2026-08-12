// Centralized System API Key Manager
// Super Admin sets system API keys centrally, hiding key inputs from regular pipeline users.

export interface SystemApiKeys {
  gemini: string;
  groq: string;
  openrouter: string;
  nvidia: string;
  nova: string;
  materials: string;
}

const KEYS_STORAGE_KEY = 'chembase_system_api_keys';

export function getSystemApiKeys(): SystemApiKeys {
  try {
    const saved = localStorage.getItem(KEYS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        gemini: parsed.gemini || import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '',
        groq: parsed.groq || import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem('groq_api_key') || '',
        openrouter: parsed.openrouter || import.meta.env.VITE_OPENROUTER_API_KEY || localStorage.getItem('openrouter_api_key') || '',
        nvidia: parsed.nvidia || import.meta.env.VITE_NVIDIA_API_KEY || localStorage.getItem('nvidia_api_key') || '',
        nova: parsed.nova || import.meta.env.VITE_NOVA_API_KEY || localStorage.getItem('nova_api_key') || '',
        materials: parsed.materials || import.meta.env.VITE_MATERIALS_API_KEY || localStorage.getItem('materials_api_key') || '',
      };
    }
  } catch { /* ignore */ }

  return {
    gemini: import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '',
    groq: import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem('groq_api_key') || '',
    openrouter: import.meta.env.VITE_OPENROUTER_API_KEY || localStorage.getItem('openrouter_api_key') || '',
    nvidia: import.meta.env.VITE_NVIDIA_API_KEY || localStorage.getItem('nvidia_api_key') || '',
    nova: import.meta.env.VITE_NOVA_API_KEY || localStorage.getItem('nova_api_key') || '',
    materials: import.meta.env.VITE_MATERIALS_API_KEY || localStorage.getItem('materials_api_key') || '',
  };
}

export function saveSystemApiKeys(keys: SystemApiKeys): void {
  localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keys));
  // Sync individual keys for backward compatibility
  if (keys.gemini) localStorage.setItem('gemini_api_key', keys.gemini);
  if (keys.groq) localStorage.setItem('groq_api_key', keys.groq);
  if (keys.openrouter) localStorage.setItem('openrouter_api_key', keys.openrouter);
  if (keys.nvidia) localStorage.setItem('nvidia_api_key', keys.nvidia);
  if (keys.nova) localStorage.setItem('nova_api_key', keys.nova);
  if (keys.materials) localStorage.setItem('materials_api_key', keys.materials);

  window.dispatchEvent(new Event('chembase-apikeys-updated'));
}

export function getSingleSystemApiKey(provider: keyof SystemApiKeys): string {
  const keys = getSystemApiKeys();
  return keys[provider] || '';
}
