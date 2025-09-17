import * as integrationModule from 'alain-kit/validation/integration';
import * as qualityModule from 'alain-kit/validation/quality-validator';
import * as colabModule from 'alain-kit/validation/colab-validator';
import * as outlineModule from 'alain-kit/core/outline-generator';
import * as sectionModule from 'alain-kit/core/section-generator';
import * as notebookBuilderModule from 'alain-kit/core/notebook-builder';

const integration = (integrationModule as any)?.default ?? integrationModule;
const quality = (qualityModule as any)?.default ?? qualityModule;
const colab = (colabModule as any)?.default ?? colabModule;
const outline = (outlineModule as any)?.default ?? outlineModule;
const section = (sectionModule as any)?.default ?? sectionModule;
const builder = (notebookBuilderModule as any)?.default ?? notebookBuilderModule;

export const { ALAINKit, generateNotebook } = integration as typeof import('alain-kit/validation/integration');
export type { ALAINKitResult } from 'alain-kit/validation/integration';
export const { QualityValidator } = quality as typeof import('alain-kit/validation/quality-validator');
export const { ColabValidator } = colab as typeof import('alain-kit/validation/colab-validator');
export const { OutlineGenerator } = outline as typeof import('alain-kit/core/outline-generator');
export type { NotebookOutline } from 'alain-kit/core/outline-generator';
export const { SectionGenerator } = section as typeof import('alain-kit/core/section-generator');
export const { NotebookBuilder } = builder as typeof import('alain-kit/core/notebook-builder');
