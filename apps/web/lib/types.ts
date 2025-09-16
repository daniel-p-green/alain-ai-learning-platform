export type ProviderModel = { id: string; name?: string };

export type ProviderInfo = {
  id: string;
  name: string;
  description: string;
  supportsStreaming: boolean;
  requiresAuth: boolean;
  supportsHarmonyRoles?: boolean;
  supportsTools?: boolean;
  notes?: string;
  status: 'available' | 'configuring' | 'unavailable' | 'unknown';
  models?: ProviderModel[];
};

