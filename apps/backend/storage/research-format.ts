export function buildResearchMarkdowns(data: any): Record<string, string> {
  const files: Record<string, string> = {};
  try {
    // Model card (already markdown)
    const modelCard = get(data, ['model_card', 'markdown']) || get(data, ['model_card_markdown']) || get(data, ['hf', 'model_card_markdown']);
    if (typeof modelCard === 'string' && modelCard.trim()) {
      files['model-card.md'] = modelCard.trim();
    }

    // Hugging Face info summary
    const hfInfo = get(data, ['hf', 'info']) || get(data, ['huggingface', 'info']) || get(data, ['hf_info']);
    if (hfInfo && typeof hfInfo === 'object') {
      files['huggingface-info.md'] = formatHuggingFaceInfo(hfInfo);
    }

    // OpenAI cookbook / resources
    const resources = get(data, ['resources']) || get(data, ['openai_cookbook']) || get(data, ['links']);
    if (Array.isArray(resources) && resources.length) {
      files['openai-cookbook.md'] = formatResourceList(resources, 'OpenAI Cookbook & Related Resources');
    }

    // Unsloth notebooks/examples
    const unsloth = get(data, ['unsloth', 'examples']) || get(data, ['unsloth_examples']);
    if (Array.isArray(unsloth) && unsloth.length) {
      files['unsloth-content.md'] = formatResourceList(unsloth, 'Unsloth Examples');
    }

    // If nothing matched, provide a minimal overview
    if (Object.keys(files).length === 0) {
      files['overview.md'] = `# Research Summary\n\nNo markdown-specific sections detected. See research-data.json for full structure.`;
    }

    // Also render V2 summary if present
    const v2 = get(data, ['summary_v2']);
    if (v2 && typeof v2 === 'object') {
      const lines: string[] = ['# Model Configuration'];
      const param = v2?.architecture?.parameter_scale;
      if (param) lines.push(`- Parameters: ${param}`);
      const ctx = v2?.architecture?.context_length;
      if (typeof ctx === 'number') lines.push(`- Context length: ${ctx}`);
      const quant = Array.isArray(v2?.quantization) ? v2.quantization : [];
      if (quant.length) lines.push(`- Quantization: ${quant.join(', ')}`);
      files['configs.md'] = (files['configs.md'] || '') + (lines.join('\n') + '\n');

      if (Array.isArray(v2?.benchmarks) && v2.benchmarks.length) {
        const b = ['# Benchmarks', '', ...v2.benchmarks.map((x: any) => `- ${x.dataset}: ${x.metric} = ${x.value}`)].join('\n');
        files['benchmarks.md'] = (files['benchmarks.md'] || '') + b + '\n';
      }

      const usage: string[] = ['# Usage Examples'];
      if (v2?.usage_examples?.hf_snippet) {
        usage.push('## Transformers');
        usage.push('```python');
        usage.push(String(v2.usage_examples.hf_snippet));
        usage.push('```');
      }
      if (v2?.usage_examples?.openai_compatible_snippet) {
        usage.push('## OpenAI-compatible');
        usage.push('```python');
        usage.push(String(v2.usage_examples.openai_compatible_snippet));
        usage.push('```');
      }
      files['usage-examples.md'] = usage.join('\n') + '\n';
    }
  } catch {
    // Safe fallback
  }
  return files;
}

function get(obj: any, path: (string|number)[]) {
  return path.reduce((acc, key) => (acc && typeof acc === 'object') ? acc[key] : undefined, obj);
}

function formatHuggingFaceInfo(info: any): string {
  const license = info?.license ?? 'unknown';
  const downloads = info?.downloads ?? info?.likes ?? null;
  const tags = Array.isArray(info?.tags) ? info.tags : [];
  const siblings = Array.isArray(info?.siblings) ? info.siblings : [];
  const tasks = Array.isArray(info?.pipeline_tag) ? info.pipeline_tag : (info?.pipeline_tag ? [info.pipeline_tag] : []);
  const header = `# Hugging Face Repository Info\n\n- License: ${license}\n${downloads !== null ? `- Downloads/Likes: ${downloads}\n` : ''}- Tags: ${tags.join(', ') || 'none'}\n- Tasks: ${tasks.join(', ') || 'n/a'}\n`;
  const files = siblings.length ? `\n## Files\n\n${siblings.map((s: any) => `- ${s?.rfilename || s}`).join('\n')}` : '';
  return header + files + '\n';
}

function formatResourceList(items: any[], title: string): string {
  const lines = (items || []).map((it) => {
    if (typeof it === 'string') return `- ${it}`;
    const t = it?.title || it?.name || it?.id || 'Untitled';
    const url = it?.url || it?.link || it?.html_url || '';
    const brief = it?.description || it?.summary || '';
    return `- ${url ? `[${escapeMd(t)}](${url})` : escapeMd(t)}${brief ? ` — ${escapeMd(brief)}` : ''}`;
  });
  return `# ${escapeMd(title)}\n\n${lines.join('\n')}\n`;
}

function escapeMd(s: string): string {
  return String(s || '').replace(/\|/g, '\\|');
}
