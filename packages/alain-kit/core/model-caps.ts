export function supportsTemperature(model?: string): boolean {
  const normalized = (model || '').toLowerCase().replace(/\s+/g, '-');
  if (!normalized) return true;
  const blockedPrefixes = ['gpt-5'];
  return !blockedPrefixes.some(prefix => normalized === prefix || normalized.startsWith(`${prefix}-`));
}
