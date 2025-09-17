export function encodeNotebookId(id: string): string {
  return encodeURIComponent(id);
}

export function decodeNotebookParam(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
