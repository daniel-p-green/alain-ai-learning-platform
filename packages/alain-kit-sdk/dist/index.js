import * as integrationModule from 'alain-kit/validation/integration';
import * as qualityModule from 'alain-kit/validation/quality-validator';
import * as colabModule from 'alain-kit/validation/colab-validator';
import * as outlineModule from 'alain-kit/core/outline-generator';
import * as sectionModule from 'alain-kit/core/section-generator';
import * as notebookBuilderModule from 'alain-kit/core/notebook-builder';
const integration = integrationModule?.default ?? integrationModule;
const quality = qualityModule?.default ?? qualityModule;
const colab = colabModule?.default ?? colabModule;
const outline = outlineModule?.default ?? outlineModule;
const section = sectionModule?.default ?? sectionModule;
const builder = notebookBuilderModule?.default ?? notebookBuilderModule;
export const { ALAINKit, generateNotebook } = integration;
export const { QualityValidator } = quality;
export const { ColabValidator } = colab;
export const { OutlineGenerator } = outline;
export const { SectionGenerator } = section;
export const { NotebookBuilder } = builder;
//# sourceMappingURL=index.js.map