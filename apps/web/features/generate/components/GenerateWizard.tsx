'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Button } from '../../../components/Button';
import type { UseGenerateLessonResult, ResearchMode } from '../hooks/useGenerateLesson';

const presetRequirements: Record<PresetId, { title: string; description: string; requirement: string; detail: string; }> = {
  hosted: {
    title: 'Fast start (Poe hosted)',
    description: 'Recommended for most users. No local setup required.',
    requirement: 'Runs on Poe infrastructure. Works on any hardware.',
    detail: 'Uses Poe for the teacher and target provider so you can generate manuals without worrying about GPU or Colab limits.',
  },
  local: {
    title: 'Local runtime (GPU/Ollama/LM Studio)',
    description: 'Use your own hardware or local runtime.',
    requirement: 'Needs a GPU (≥12GB VRAM recommended) or well-provisioned CPU runtime.',
    detail: 'Make sure LM Studio or Ollama is running and that the model identifier is available locally before generating.',
  },
  colab: {
    title: 'Google Colab / notebook export',
    description: 'Generate with export-ready settings for Colab.',
    requirement: 'Colab free tier sessions have limited runtime (≈12h) and RAM.',
    detail: 'We will optimise the manual for Colab compatibility so you can export immediately after generating.',
  },
};

type PresetId = 'hosted' | 'local' | 'colab';

type DraftState = {
  source: UseGenerateLessonResult['source'];
  hfUrl: string;
  rawTextInput: string;
  targetModel: string;
  targetProvider: string;
  teacherProvider: UseGenerateLessonResult['teacherProvider'];
  teacherModel: UseGenerateLessonResult['teacherModel'];
  researchMode: ResearchMode;
  difficulty: string;
  forceFallback: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  viewModel: UseGenerateLessonResult;
};

export function GenerateWizard({ open, onClose, viewModel }: Props) {
  const {
    availableModels,
    labelsByName,
    providers,
    researchCopy,
    submitForm,
    loading,
    SHOW_FALLBACK_UI,
    ALLOW_120B,
  } = viewModel;

  const [step, setStep] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState<PresetId | null>(null);
  const [draft, setDraft] = useState<DraftState>(() => createDraftFromViewModel(viewModel));

  useEffect(() => {
    if (open) {
      setStep(0);
      setSelectedPreset(null);
      setDraft(createDraftFromViewModel(viewModel));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const requirement = selectedPreset ? presetRequirements[selectedPreset] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-lg bg-paper-0 shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Guided Manual Setup</h2>
            <p className="text-sm text-ink-600">We’ll collect the basics in a few steps before generating your notebook.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-ink-500 transition hover:bg-paper-50 hover:text-ink-700"
            aria-label="Close wizard"
          >
            ×
          </button>
        </div>
        <div className="flex justify-between border-b border-ink-100 px-6 py-3 text-xs uppercase tracking-wide text-ink-500">
          {['Choose setup', 'Customize', 'Review'].map((label, idx) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`h-6 w-6 rounded-full text-center text-[11px] leading-6 ${idx === step ? 'bg-alain-blue text-white' : idx < step ? 'bg-alain-blue/10 text-alain-blue' : 'bg-paper-100 text-ink-500'}`}>
                {idx + 1}
              </div>
              <span className={idx === step ? 'text-ink-900 font-medium' : ''}>{label}</span>
            </div>
          ))}
        </div>
        <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {step === 0 && (
            <StepOne
              selected={selectedPreset}
              onSelect={(preset) => {
                setSelectedPreset(preset);
                setDraft((prev) => applyPresetToDraft(preset, prev));
              }}
            />
          )}
          {step === 1 && (
            <StepTwo
              draft={draft}
              setDraft={setDraft}
              availableModels={availableModels}
              labelsByName={labelsByName}
              providers={providers}
              researchCopy={researchCopy}
              requirement={selectedPreset ? presetRequirements[selectedPreset] : null}
              showFallbackUI={SHOW_FALLBACK_UI}
              allow120B={ALLOW_120B}
            />
          )}
          {step === 2 && (
            <StepThree
              draft={draft}
              researchCopy={researchCopy}
              requirement={requirement}
            />
          )}
        </div>
        <div className="flex items-center justify-between border-t border-ink-100 px-6 py-4 bg-paper-50">
          <div className="text-xs text-ink-600">
            {requirement ? requirement.requirement : 'Pick a preset to see requirements and continue.'}
          </div>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="secondary" onClick={() => setStep(step - 1)}>Back</Button>
            )}
            {step < 2 && (
              <Button
                disabled={step === 0 && !selectedPreset}
                onClick={() => setStep(step + 1)}
              >
                Next
              </Button>
            )}
            {step === 2 && (
              <Button
                disabled={loading}
                onClick={() => {
                  commitDraftToViewModel(draft, viewModel);
                  submitForm();
                  onClose();
                }}
              >
                {loading ? 'Generating…' : 'Generate manual'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type StepOneProps = {
  selected: PresetId | null;
  onSelect: (preset: PresetId) => void;
};

function StepOne({ selected, onSelect }: StepOneProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-700">Choose the environment that best matches how you plan to run the notebook. You can fine-tune the details in the next step.</p>
      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(presetRequirements) as PresetId[]).map((preset) => {
          const info = presetRequirements[preset];
          const isSelected = preset === selected;
          return (
            <button
              key={preset}
              onClick={() => onSelect(preset)}
              className={`flex h-full flex-col justify-between rounded-lg border p-4 text-left transition ${isSelected ? 'border-alain-blue bg-alain-blue/5' : 'border-ink-100 bg-white hover:border-alain-blue/60'}`}
            >
              <div className="space-y-2">
                <div className="text-sm font-semibold text-ink-900">{info.title}</div>
                <p className="text-xs text-ink-600">{info.description}</p>
              </div>
              <div className="mt-3 text-xs text-ink-700">
                <span className="font-medium text-ink-900">Requirements:</span> {info.requirement}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const providerExplainers: Record<string, { title: string; helper: string }> = {
  poe: {
    title: 'Hosted Poe (recommended)',
    helper: 'Runs fully in Poe\'s managed environment. No local setup required.'
  },
  'openai-compatible': {
    title: 'OpenAI-compatible / local runtime',
    helper: 'Uses your configured base URL (Ollama, LM Studio, vLLM). Requires credentials or a running local server.'
  },
  lmstudio: {
    title: 'LM Studio runtime',
    helper: 'Targets the LM Studio local server. Make sure models are downloaded and the server is running.'
  },
  ollama: {
    title: 'Ollama runtime',
    helper: 'Runs against an Ollama host (default http://localhost:11434). Ensure the model is pulled before generating.'
  },
};

type StepTwoProps = {
  draft: DraftState;
  setDraft: Dispatch<SetStateAction<DraftState>>;
  availableModels: string[];
  labelsByName: Record<string, string>;
  providers: UseGenerateLessonResult['providers'];
  researchCopy: UseGenerateLessonResult['researchCopy'];
  requirement: { requirement: string; detail: string; } | null;
  showFallbackUI: boolean;
  allow120B: boolean;
};

function StepTwo({ draft, setDraft, availableModels, labelsByName, providers, researchCopy, requirement, showFallbackUI, allow120B }: StepTwoProps) {
  const researchModes = (Object.keys(researchCopy) as Array<ResearchMode>).filter((mode) => showFallbackUI || mode !== 'fallback');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const activeTargetProvider = providers.find((provider) => provider.name === draft.targetProvider);
  const targetProviderHelper = activeTargetProvider?.description || providerExplainers[draft.targetProvider]?.helper;
  const teacherHelper = providerExplainers[draft.teacherProvider]?.helper;

  useEffect(() => {
    if (!showFallbackUI && draft.researchMode === 'fallback') {
      setDraft((prev) => ({ ...prev, researchMode: 'standard', forceFallback: false }));
    }
  }, [showFallbackUI, draft.researchMode, setDraft]);

  useEffect(() => {
    if (
      !showAdvanced &&
      (draft.teacherProvider !== 'poe' || draft.teacherModel !== 'GPT-OSS-20B' || draft.targetProvider !== 'poe' || draft.targetModel.trim())
    ) {
      setShowAdvanced(true);
    }
  }, [showAdvanced, draft.teacherModel, draft.teacherProvider, draft.targetModel, draft.targetProvider]);

  return (
    <div className="space-y-6">
      {requirement && (
        <div className="rounded-lg border border-ink-100 bg-paper-50 p-3 text-xs text-ink-700">
          {requirement.detail}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium text-ink-900">Where is your source?</div>
          <div className="flex flex-wrap gap-2 text-sm">
            <SelectionPill
              label="Hugging Face"
              active={draft.source === 'hf'}
              onClick={() => setDraft((prev) => ({ ...prev, source: 'hf', forceFallback: false }))}
            />
            <SelectionPill
              label="Local runtime"
              active={draft.source === 'local'}
              onClick={() => setDraft((prev) => ({ ...prev, source: 'local', forceFallback: false }))}
            />
            <SelectionPill
              label="From text"
              active={draft.source === 'text'}
              onClick={() => setDraft((prev) => ({
                ...prev,
                source: 'text',
                forceFallback: showFallbackUI && prev.researchMode === 'fallback',
              }))}
            />
          </div>
        </div>

        {draft.source === 'hf' && (
          <div className="space-y-2">
            <label className="text-xs text-ink-600">Hugging Face model URL or owner/repo</label>
            <input
              className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm"
              placeholder="https://huggingface.co/meta-llama/Meta-Llama-3.1-8B-Instruct"
              value={draft.hfUrl}
              onChange={(event) => setDraft((prev) => ({ ...prev, hfUrl: event.target.value }))}
            />
          </div>
        )}
        {draft.source === 'text' && (
          <div className="space-y-2">
            <label className="text-xs text-ink-600">Paste raw text</label>
            <textarea
              className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm"
              rows={4}
              placeholder="Paste docs, articles, or notes to turn into a lesson."
              value={draft.rawTextInput}
              onChange={(event) => setDraft((prev) => ({ ...prev, rawTextInput: event.target.value }))}
            />
          </div>
        )}
        {draft.source === 'local' && (
          <div className="space-y-2">
            <label className="text-xs text-ink-600">Local model identifier</label>
            {availableModels.length > 0 ? (
              <select
                className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm"
                value={draft.targetModel}
                onChange={(event) => setDraft((prev) => ({ ...prev, targetModel: event.target.value }))}
              >
                <option value="">Select a detected model…</option>
                {availableModels.map((model) => (
                  <option key={model} value={model}>{labelsByName[model] || model}</option>
                ))}
              </select>
            ) : (
              <input
                className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm"
                placeholder="gpt-oss-20b"
                value={draft.targetModel}
                onChange={(event) => setDraft((prev) => ({ ...prev, targetModel: event.target.value }))}
              />
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium text-ink-900">Research depth</div>
          <div className="flex flex-wrap gap-2 text-xs">
            {researchModes.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setDraft((prev) => ({
                  ...prev,
                  researchMode: mode,
                  forceFallback: mode === 'fallback' && showFallbackUI && prev.source === 'text',
                }))}
                className={`rounded-full border px-3 py-1 font-medium transition ${draft.researchMode === mode ? 'border-alain-blue bg-alain-blue/10 text-alain-blue' : 'border-ink-100 bg-white text-ink-700 hover:border-alain-blue/40'}`}
              >
                {researchCopy[mode].label}
              </button>
            ))}
          </div>
          <div className="text-xs text-ink-600">{researchCopy[draft.researchMode].note}</div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-600">Difficulty</label>
          <select
            className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm"
            value={draft.difficulty}
            onChange={(event) => setDraft((prev) => ({ ...prev, difficulty: event.target.value }))}
          >
            {['beginner', 'intermediate', 'advanced'].map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          <p className="text-xs text-ink-600">Pick the skill level you want ALAIN to write for.</p>
        </div>

        <div className="rounded-lg border border-ink-100 bg-paper-50 p-3">
          <button
            type="button"
            className="flex w-full items-center justify-between text-sm font-medium text-ink-900"
            onClick={() => setShowAdvanced((prev) => !prev)}
          >
            Advanced provider settings
            <span className="text-xs text-ink-600">{showAdvanced ? 'Hide' : 'Show'}</span>
          </button>
          {showAdvanced && (
            <div className="mt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-600">Teacher provider</label>
                <select
                  className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm"
                  value={draft.teacherProvider}
                  onChange={(event) => setDraft((prev) => ({ ...prev, teacherProvider: event.target.value as any }))}
                >
                  <option value="poe">{providerExplainers.poe.title}</option>
                  <option value="openai-compatible">{providerExplainers['openai-compatible'].title}</option>
                </select>
                <p className="text-xs text-ink-600">{teacherHelper || 'Choose where the teacher model will run.'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-600">Teacher model</label>
                <select
                  className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm"
                  value={draft.teacherModel}
                  onChange={(event) => setDraft((prev) => ({ ...prev, teacherModel: event.target.value as any }))}
                >
                  <option value="GPT-OSS-20B">GPT-OSS-20B</option>
                  {allow120B && <option value="GPT-OSS-120B">GPT-OSS-120B</option>}
                </select>
                <p className="text-xs text-ink-600">Stay on GPT-OSS-20B for the most reliable JSON output.</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-ink-600">Target provider</label>
                <select
                  className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm"
                  value={draft.targetProvider}
                  onChange={(event) => setDraft((prev) => ({ ...prev, targetProvider: event.target.value }))}
                >
                  {providers.map((provider) => (
                    <option key={provider.name} value={provider.name}>
                      {providerExplainers[provider.name]?.title || provider.name}
                    </option>
                  ))}
                </select>
                {targetProviderHelper && <p className="text-xs text-ink-600">{targetProviderHelper}</p>}
                <input
                  className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm"
                  placeholder="Optional model override (e.g. gpt-oss-20b)"
                  value={draft.targetModel}
                  onChange={(event) => setDraft((prev) => ({ ...prev, targetModel: event.target.value }))}
                />
                <p className="text-xs text-ink-600">Leave blank to use the provider\'s default deployment. Set when you need a specific model slug.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type StepThreeProps = {
  draft: DraftState;
  researchCopy: UseGenerateLessonResult['researchCopy'];
  requirement: { title: string; requirement: string; detail: string; } | null;
};

function StepThree({ draft, researchCopy, requirement }: StepThreeProps) {
  const summary = useMemo(() => [
    { label: 'Source', value: draft.source === 'hf' ? `Hugging Face (${draft.hfUrl || 'model not set'})` : draft.source === 'local' ? `Local runtime (${draft.targetModel || 'model pending'})` : 'Text input' },
    { label: 'Target provider / model', value: draft.source === 'local' ? `${draft.targetProvider} · ${draft.targetModel || 'model pending'}` : draft.targetProvider },
    { label: 'Research mode', value: researchCopy[draft.researchMode].label },
    { label: 'Difficulty', value: draft.difficulty },
    { label: 'Teacher', value: `${draft.teacherProvider} · ${draft.teacherModel}` },
  ], [draft, researchCopy]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-ink-900">Review configuration</h3>
        <p className="text-sm text-ink-600">We’ll use these settings to generate your manual. You can still make changes afterwards.</p>
      </div>
      <div className="space-y-3">
        {summary.map((item) => (
          <div key={item.label} className="flex items-start justify-between rounded-md border border-ink-100 bg-white px-4 py-2 text-sm">
            <span className="font-medium text-ink-700">{item.label}</span>
            <span className="max-w-xs text-right text-ink-600">{item.value}</span>
          </div>
        ))}
      </div>
      {requirement && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs text-ink-700">
          <div className="font-medium text-ink-900">Reminder</div>
          <p>{requirement.detail}</p>
        </div>
      )}
      <p className="text-xs text-ink-500">You can revisit the full form after generating to tweak advanced options, export to Colab, or retry with different providers.</p>
    </div>
  );
}

type SelectionPillProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function SelectionPill({ label, active, onClick }: SelectionPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${active ? 'border-alain-blue bg-alain-blue/10 text-alain-blue' : 'border-ink-100 bg-white text-ink-700 hover:border-alain-blue/40'}`}
    >
      {label}
    </button>
  );
}

function createDraftFromViewModel(viewModel: UseGenerateLessonResult): DraftState {
  const allowFallback = viewModel.SHOW_FALLBACK_UI;
  const allow120B = viewModel.ALLOW_120B;
  const normalizedResearchMode = allowFallback
    ? viewModel.researchMode
    : viewModel.researchMode === 'fallback'
      ? 'standard'
      : viewModel.researchMode;
  const normalizedForceFallback = allowFallback ? viewModel.forceFallback : false;
  const normalizedTeacherModel = allow120B ? viewModel.teacherModel : 'GPT-OSS-20B';
  return {
    source: viewModel.source,
    hfUrl: viewModel.hfUrl,
    rawTextInput: viewModel.rawTextInput,
    targetModel: viewModel.targetModel,
    targetProvider: viewModel.targetProvider,
    teacherProvider: viewModel.teacherProvider,
    teacherModel: normalizedTeacherModel,
    researchMode: normalizedResearchMode,
    difficulty: viewModel.difficulty,
    forceFallback: normalizedForceFallback,
  };
}

function applyPresetToDraft(preset: PresetId, draft: DraftState): DraftState {
  if (preset === 'hosted') {
    return {
      ...draft,
      source: 'hf',
      teacherProvider: 'poe',
      targetProvider: 'poe',
      targetModel: '',
      researchMode: 'standard',
      difficulty: 'beginner',
      teacherModel: 'GPT-OSS-20B',
      forceFallback: false,
    };
  }
  if (preset === 'local') {
    return {
      ...draft,
      source: 'local',
      teacherProvider: 'openai-compatible',
      targetProvider: 'openai-compatible',
      researchMode: 'standard',
      teacherModel: 'GPT-OSS-20B',
      forceFallback: false,
    };
  }
  return {
    ...draft,
    source: 'hf',
    teacherProvider: 'poe',
    targetProvider: 'poe',
    researchMode: 'thorough',
    difficulty: 'beginner',
    teacherModel: 'GPT-OSS-20B',
    forceFallback: false,
  };
}

function commitDraftToViewModel(draft: DraftState, viewModel: UseGenerateLessonResult) {
  const {
    setSource,
    setHfUrl,
    setRawTextInput,
    setTargetModel,
    setTargetProvider,
    setTeacherProvider,
    setTeacherModel,
    setResearchMode,
    setDifficulty,
    setForceFallback,
  } = viewModel;

  const allowFallback = viewModel.SHOW_FALLBACK_UI;
  const allow120B = viewModel.ALLOW_120B;
  const normalizedResearchMode = allowFallback
    ? draft.researchMode
    : draft.researchMode === 'fallback'
      ? 'standard'
      : draft.researchMode;
  const normalizedForceFallback = allowFallback ? draft.forceFallback : false;
  const normalizedTeacherModel = allow120B ? draft.teacherModel : 'GPT-OSS-20B';

  setSource(draft.source);
  setHfUrl(draft.hfUrl);
  setRawTextInput(draft.rawTextInput);
  setTargetModel(draft.targetModel);
  setTargetProvider(draft.targetProvider);
  setTeacherProvider(draft.teacherProvider);
  setTeacherModel(normalizedTeacherModel);
  setResearchMode(normalizedResearchMode);
  setDifficulty(draft.difficulty);
  setForceFallback(normalizedForceFallback);
}
