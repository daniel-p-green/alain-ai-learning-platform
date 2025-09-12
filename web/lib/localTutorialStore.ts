export type Step = {
  id: number;
  step_order: number;
  title: string;
  content: string;
  code_template?: string | null;
  model_params?: any;
};

export type Tutorial = {
  id: string; // allow non-numeric ids
  title: string;
  description: string;
  model: string;
  provider: "poe" | "openai-compatible";
  difficulty: string;
  tags: string[];
  steps: Step[];
  model_maker?: { name:string; org_type:string; homepage?:string|null; license?:string|null; repo?:string|null } | null;
};

const mem = new Map<string, Tutorial>();

export function putLocalTutorial(t: Tutorial) { mem.set(t.id, t); }
export function getLocalTutorial(id: string): Tutorial | null { return mem.get(id) || null; }
