import { z } from 'zod';

// Provider list
export const ProviderInfoSchema = z.object({
  name: z.string(),
  label: z.string().optional(),
  models: z.array(z.string()).optional().default([]),
});
export const ProvidersResponseSchema = z.object({
  providers: z.array(ProviderInfoSchema).default([]),
  defaultProvider: z.string().optional(),
});

// Generate (HF / Local / Text) – success envelope
const PreviewSchema = z.object({
  title: z.string().default(''),
  description: z.string().optional(),
  learning_objectives: z.array(z.string()).optional().default([]),
  first_step: z
    .object({ title: z.string().optional(), content: z.string().optional() })
    .nullish(),
});

export const GenerateSuccessSchema = z.object({
  success: z.literal(true),
  tutorialId: z.union([z.number(), z.string()]),
  meta: z
    .object({ repaired: z.boolean().optional(), reasoning_summary: z.string().optional() })
    .optional(),
  preview: PreviewSchema.optional(),
});

export const APIErrorSchema = z.object({
  code: z.string().optional(),
  message: z.string().default('Unknown error'),
  details: z.array(z.string()).optional(),
});

export const GenerateErrorEnvelope = z.object({ success: z.literal(false), error: APIErrorSchema });

export const ExportNotebookSchema = z.object({
  nbformat: z.number(),
  nbformat_minor: z.number().optional(),
  cells: z.array(z.unknown()),
  metadata: z.record(z.any()).optional(),
});

// Hugging Face Model Info (as returned by our web API proxy)
export const HFModelInfoSchema = z.object({
  license: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  downloads: z.number().nullable().optional(),
});

export type HFModelInfo = z.infer<typeof HFModelInfoSchema>;

export type ProviderInfo = z.infer<typeof ProviderInfoSchema>;
export type ProvidersResponse = z.infer<typeof ProvidersResponseSchema>;
export type GenerateSuccess = z.infer<typeof GenerateSuccessSchema>;
export type APIError = z.infer<typeof APIErrorSchema>;
export type ExportNotebook = z.infer<typeof ExportNotebookSchema>;

// Helpers
export function isSuccessEnvelope(x: unknown): x is GenerateSuccess {
  const r = GenerateSuccessSchema.safeParse(x);
  return r.success;
}
