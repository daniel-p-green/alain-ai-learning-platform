// ALAIN Onboarding & Settings Types
// Brand tokens used in UI: alain-blue, alain-yellow, alain-stroke, paper-*, ink-*

export type ProviderId =
  | "openai-compatible"
  | "huggingface"
  | "ollama"
  | "lmstudio"
  | "poe";

export type ProviderStatus = "unknown" | "testing" | "ok" | "error";

export type ProviderConfig = {
  id: ProviderId;
  enabled: boolean;
  name: string;
  apiKey?: string;
  baseUrl?: string;
  status?: ProviderStatus;
  lastTestAt?: number;
  lastError?: string | null;
};

export type ModelPref = {
  defaultModel?: string;
  recent?: string[];
};

export type UISettings = {
  theme: "light" | "dark" | "system";
  density?: "comfortable" | "compact";
  brandLogo?: "blue" | "yellow"; // switches header logo variant
};

export type Settings = {
  providers: ProviderConfig[];
  models: ModelPref;
  ui: UISettings;
  demo?: {
    loadDemoData?: boolean;
  };
};

export const DEFAULT_PROVIDERS: ProviderConfig[] = [
  { id: "openai-compatible", name: "OpenAI Compatible", enabled: false, baseUrl: "https://api.openai.com/v1" },
  { id: "huggingface", name: "Hugging Face Inference", enabled: false, baseUrl: "https://router.huggingface.co/v1" },
  { id: "ollama", name: "Ollama", enabled: false, baseUrl: "http://localhost:11434/v1" },
  { id: "lmstudio", name: "LM Studio", enabled: false, baseUrl: "http://localhost:1234/v1" },
  { id: "poe", name: "Poe", enabled: false, baseUrl: "https://api.poe.com/v1" },
];

export const DEFAULT_SETTINGS: Settings = {
  providers: DEFAULT_PROVIDERS,
  models: { defaultModel: undefined, recent: [] },
  ui: { theme: "light", density: "comfortable", brandLogo: "blue" },
  demo: { loadDemoData: false },
};

// Local storage keys
export const LS = {
  onboardingCompleted: "alain.onboarding.completed",
  onboardingVersion: "alain.onboarding.version",
  providers: "alain.providers",
  models: "alain.models",
  uiTheme: "alain.ui.theme",
  uiLogo: "alain.ui.logo",
} as const;
