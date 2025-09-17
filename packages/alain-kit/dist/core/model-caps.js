export function supportsTemperature(model) {
    const normalized = (model || '').toLowerCase().replace(/\s+/g, '-');
    if (!normalized)
        return true;
    const blockedPrefixes = ['gpt-5'];
    return !blockedPrefixes.some(prefix => normalized === prefix || normalized.startsWith(`${prefix}-`));
}
//# sourceMappingURL=model-caps.js.map