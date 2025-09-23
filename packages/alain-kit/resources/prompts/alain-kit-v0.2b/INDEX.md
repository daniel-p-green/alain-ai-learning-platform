# ALAIN-Kit v0.2b Prompt Index

**Version:** 0.2b  
**Date:** September 20, 2025  
**Optimization Target:** gpt-oss-20b reliability and performance

## Core Workflow Prompts

| File | Purpose | Input Format | Output Format | Token Estimate |
|------|---------|--------------|---------------|----------------|
| `00-orchestrator.txt` | Workflow coordination | Model URL + requirements | JSON workflow plan | ~800 |
| `01-research.txt` | Model intelligence gathering | Model URL/reference | JSON research findings | ~1200 |
| `02-outline.txt` | Learning structure planning | Research JSON | JSON tutorial outline | ~1000 |
| `03-section.txt` | Content generation | Outline + section # | Markdown section content | ~1500 |
| `04-validate.txt` | Quality assessment | Complete tutorial | JSON validation report | ~1100 |

## Utility Prompts

| File | Purpose | Input Format | Output Format | Token Estimate |
|------|---------|--------------|---------------|----------------|
| `utils/json-repair.txt` | Fix malformed JSON | Broken JSON string | Valid JSON | ~400 |
| `utils/content-assembler.txt` | Merge sections | Outline + sections array | Complete Markdown tutorial | ~800 |

## Usage Patterns

### Sequential Workflow
```
01-research.txt → 02-outline.txt → 03-section.txt (×N) → 04-validate.txt
```

### With Error Handling
```
01-research.txt → [json-repair if needed] → 02-outline.txt → [json-repair if needed] → ...
```

### Quality Gate Integration
```
Each phase → 04-validate.txt → [remediation if score < 80] → Continue
```

## Output Format Strategy

### JSON Outputs (Structured Data)
- **Research findings**: Technical specs, educational context
- **Tutorial outlines**: Learning objectives, step structure, assessments  
- **Validation reports**: Scores, recommendations, quality metrics
- **Workflow plans**: Phase coordination, dependencies, gates

### Markdown Outputs (Content)
- **Tutorial sections**: Explanations, code examples, exercises
- **Complete tutorials**: Assembled final content
- **Documentation**: User guides, examples, references

## Token Optimization

### v0.2b vs v0.1 Comparison
- **Average reduction**: 65% fewer tokens per prompt
- **Complexity reduction**: No Harmony format overhead
- **Focus improvement**: Single-responsibility design
- **Reliability increase**: Simplified instruction patterns

### Token Budgets by Phase
- **Research**: 1200 tokens (vs 3500 in v0.1)
- **Outline**: 1000 tokens (vs 2800 in v0.1)  
- **Section**: 1500 tokens (vs 4200 in v0.1)
- **Validate**: 1100 tokens (vs 3000 in v0.1)

## Integration Notes

### Backend Loader Changes
```typescript
// Update prompt path
const PROMPT_BASE = 'resources/prompts/alain-kit-v0.2b/core/';

// Load by phase
const loadPrompt = (phase: string) => {
  const phaseMap = {
    'research': '01-research.txt',
    'outline': '02-outline.txt', 
    'section': '03-section.txt',
    'validate': '04-validate.txt'
  };
  return readFileSync(join(PROMPT_BASE, phaseMap[phase]), 'utf8');
};
```

### Output Processing
```typescript
// Handle format-specific processing
const processResponse = (phase: string, response: string) => {
  const jsonPhases = ['research', 'outline', 'validate'];
  
  if (jsonPhases.includes(phase)) {
    try {
      return JSON.parse(response);
    } catch (error) {
      // Use json-repair utility
      return repairAndParseJSON(response);
    }
  } else {
    // Markdown phases
    return response; // Raw markdown content
  }
};
```

## Quality Gates

### Automatic Validation Triggers
- **Research**: Completeness check (all required fields present)
- **Outline**: Structure validation (4 objectives, 6-12 steps, assessments)
- **Section**: Content quality (token count, code/markdown ratio)
- **Final**: Overall score threshold (>80 to pass)

### Remediation Strategies
- **JSON parsing failure**: Auto-retry with json-repair utility
- **Content quality low**: Regenerate with additional context
- **Structure incomplete**: Request specific missing elements
- **Token count off**: Adjust scope and regenerate

## Testing & Validation

### A/B Testing Setup
```typescript
const testPromptVersions = async (modelUrl: string) => {
  const v0_1Results = await runWorkflow('alain-kit', modelUrl);
  const v2Results = await runWorkflow('alain-kit-v0.2b', modelUrl);
  
  return compareResults(v0_1Results, v2Results);
};
```

### Success Metrics
- **JSON Parse Success**: Target >95% (vs ~70% in v0.1)
- **Response Time**: Target <3s per phase (vs ~8s in v0.1)
- **Content Quality**: Target >80/100 (maintain current level)
- **Token Efficiency**: Target 3x improvement

## Migration Checklist

- [ ] Update prompt loader to use v0.2b paths
- [ ] Implement JSON repair fallback system
- [ ] Add output format routing (JSON vs Markdown)
- [ ] Update validation thresholds and criteria
- [ ] Configure A/B testing for comparison
- [ ] Update documentation and examples
- [ ] Train team on new workflow patterns

## Version History

- **v0.2b** (Sept 2025): gpt-oss-20b optimization, simplified tool calling
- **v0.2a** (Sept 2025): Initial simplification experiments
- **v0.1** (Aug 2025): Original Harmony-based implementation (formerly “v1.x”)
