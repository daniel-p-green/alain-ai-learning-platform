"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ModelPref, ProviderConfig } from "./types";
import { useSettings } from "./useSettings";

type UiDraft = {
  theme: "light" | "dark" | "system";
  brandLogo: "blue" | "yellow";
  promptMode: "openai" | "poe";
};

const stripSecrets = (providers: ProviderConfig[]): ProviderConfig[] =>
  providers.map((provider) => ({
    ...provider,
    apiKey: undefined,
  }));

const serialiseProviders = (providers: ProviderConfig[]): string =>
  JSON.stringify(
    providers
      .map((provider) => ({
        id: provider.id,
        enabled: !!provider.enabled,
        baseUrl: provider.baseUrl || "",
        name: provider.name,
      }))
      .sort((a, b) => a.id.localeCompare(b.id))
  );

const serialiseModels = (models: ModelPref): string =>
  JSON.stringify({
    defaultModel: models.defaultModel || "",
    recent: Array.isArray(models.recent) ? models.recent : [],
  });

const serialiseUi = (ui: UiDraft): string =>
  JSON.stringify({
    theme: ui.theme,
    brandLogo: ui.brandLogo,
    promptMode: ui.promptMode,
  });

export function useSettingsDraft() {
  const settings = useSettings();

  const [providersDraft, setProvidersDraft] = useState<ProviderConfig[]>(() => stripSecrets(settings.providers));
  const [modelsDraft, setModelsDraft] = useState<ModelPref>(() => ({ ...settings.models }));
  const [uiDraft, setUiDraft] = useState<UiDraft>(() => ({
    theme: settings.theme,
    brandLogo: settings.brandLogo,
    promptMode: settings.promptMode,
  }));

  useEffect(() => {
    setProvidersDraft(stripSecrets(settings.providers));
  }, [settings.providers]);

  useEffect(() => {
    setModelsDraft({ ...settings.models });
  }, [settings.models]);

  useEffect(() => {
    setUiDraft({
      theme: settings.theme,
      brandLogo: settings.brandLogo,
      promptMode: settings.promptMode,
    });
  }, [settings.theme, settings.brandLogo, settings.promptMode]);

  const providersDirty = useMemo(() => {
    return serialiseProviders(providersDraft) !== serialiseProviders(stripSecrets(settings.providers));
  }, [providersDraft, settings.providers]);

  const modelsDirty = useMemo(() => {
    return serialiseModels(modelsDraft) !== serialiseModels(settings.models);
  }, [modelsDraft, settings.models]);

  const uiDirty = useMemo(() => {
    return serialiseUi(uiDraft) !== serialiseUi({
      theme: settings.theme,
      brandLogo: settings.brandLogo,
      promptMode: settings.promptMode,
    });
  }, [uiDraft, settings.theme, settings.brandLogo, settings.promptMode]);

  const updateProviderDraft = useCallback((id: ProviderConfig["id"], patch: Partial<ProviderConfig>) => {
    setProvidersDraft((prev) =>
      prev.map((provider) => (provider.id === id ? { ...provider, ...patch, apiKey: undefined } : provider))
    );
  }, []);

  const updateModelsDraft = useCallback((patch: Partial<ModelPref>) => {
    setModelsDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateUiDraft = useCallback((patch: Partial<UiDraft>) => {
    setUiDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const saveProviders = useCallback(() => {
    settings.setProviders(stripSecrets(providersDraft));
  }, [providersDraft, settings]);

  const saveModels = useCallback(() => {
    settings.setModels({ ...modelsDraft });
  }, [modelsDraft, settings]);

  const saveUi = useCallback(() => {
    settings.setTheme(uiDraft.theme);
    settings.setBrandLogo(uiDraft.brandLogo);
    settings.setPromptMode(uiDraft.promptMode);
  }, [settings, uiDraft]);

  const resetProviders = useCallback(() => {
    setProvidersDraft(stripSecrets(settings.providers));
  }, [settings.providers]);

  const resetModels = useCallback(() => {
    setModelsDraft({ ...settings.models });
  }, [settings.models]);

  const resetUi = useCallback(() => {
    setUiDraft({
      theme: settings.theme,
      brandLogo: settings.brandLogo,
      promptMode: settings.promptMode,
    });
  }, [settings.brandLogo, settings.promptMode, settings.theme]);

  const saveAll = useCallback(() => {
    saveProviders();
    saveModels();
    saveUi();
  }, [saveModels, saveProviders, saveUi]);

  const resetAll = useCallback(() => {
    resetProviders();
    resetModels();
    resetUi();
  }, [resetModels, resetProviders, resetUi]);

  return {
    providersDraft,
    updateProviderDraft,
    setProvidersDraft,
    modelsDraft,
    updateModelsDraft,
    setModelsDraft,
    uiDraft,
    updateUiDraft,
    setUiDraft,
    dirty: {
      providers: providersDirty,
      models: modelsDirty,
      ui: uiDirty,
    },
    isDirty: providersDirty || modelsDirty || uiDirty,
    save: {
      providers: saveProviders,
      models: saveModels,
      ui: saveUi,
      all: saveAll,
    },
    reset: {
      providers: resetProviders,
      models: resetModels,
      ui: resetUi,
      all: resetAll,
    },
    live: {
      providers: settings.providers,
      models: settings.models,
      theme: settings.theme,
      brandLogo: settings.brandLogo,
      promptMode: settings.promptMode,
    },
    actions: {
      testProvider: settings.testProvider,
      clearAll: settings.clearAll,
      exportSettings: settings.exportSettings,
      importSettings: settings.importSettings,
    },
    raw: settings,
  };
}
