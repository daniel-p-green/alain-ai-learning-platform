export type NBCell = {
  cell_type: "markdown" | "code";
  metadata: Record<string, any>;
  source: string[];
  outputs?: any[];
  execution_count?: number | null;
};

export type Notebook = {
  cells: NBCell[];
  metadata: Record<string, any>;
  nbformat: number;
  nbformat_minor: number;
};

export function buildNotebook(
  title: string,
  description: string,
  steps: Array<{ step_order: number; title: string; content: string; code_template: string | null }>
): Notebook {
  const cells: NBCell[] = [];
  cells.push({ cell_type: "markdown", metadata: {}, source: [`# ${title}\n`, `\n`, `${description}\n`] });
  for (const s of steps) {
    cells.push({ cell_type: "markdown", metadata: {}, source: [`## Step ${s.step_order}: ${s.title}\n`, `\n`, `${s.content}\n`] });
    if (s.code_template) {
      const src = s.code_template.endsWith("\n") ? s.code_template : s.code_template + "\n";
      cells.push({ cell_type: "code", metadata: {}, source: [src], outputs: [], execution_count: null });
    }
  }
  return {
    cells,
    metadata: {
      kernelspec: { name: "python3", language: "python", display_name: "Python 3" },
      language_info: { name: "python" }
    },
    nbformat: 4,
    nbformat_minor: 5,
  };
}

