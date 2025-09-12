// Simple in-memory store suitable for demo/preview deployments.
// Replace with backend persistence (DB + object storage) for production.

export type NotebookMeta = {
  id: string;
  title: string;
  sourceType: "company" | "user";
  sourceOrg?: string;
  tags: string[];
  remixOfId?: string;
  createdAt: string;
};

export type NotebookRecord = {
  meta: NotebookMeta;
  nb: any; // nbformat JSON
};

const store = new Map<string, NotebookRecord>();

export function putNotebook(rec: NotebookRecord) {
  store.set(rec.meta.id, rec);
}

export function getNotebook(id: string): NotebookRecord | undefined {
  return store.get(id);
}

export function cloneNotebook(id: string, newId: string): NotebookRecord | undefined {
  const orig = store.get(id);
  if (!orig) return undefined;
  const cloned: NotebookRecord = {
    meta: {
      ...orig.meta,
      id: newId,
      remixOfId: id,
      title: `${orig.meta.title} (Remix)`
    },
    nb: JSON.parse(JSON.stringify(orig.nb)),
  };
  store.set(newId, cloned);
  return cloned;
}

