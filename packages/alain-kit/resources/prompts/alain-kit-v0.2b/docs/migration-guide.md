# Migration Guide: ALAIN-Kit v0.1 → v0.2b

## Overview

This guide helps you migrate from the original Harmony-based ALAIN-Kit prompts (v0.1, formerly “v1.x”) to the simplified, gpt-oss-20b optimized v0.2b prompts.

## Key Changes Summary

| Aspect | v0.1 (Harmony) | v0.2b (Simplified) |
|--------|----------------|-------------------|
| **Format** | Complex Harmony tokens | Direct instructions |
| **Tool Calling** | `<\|constrain\|>json` | JSON schema examples |
| **Prompt Scope** | Monolithic (900+ lines) | Focused (200-400 lines) |
| **Output Strategy** | All JSON functions | Strategic JSON/Markdown mix |
| **Token Count** | 3000-4500 per prompt | 800-1500 per prompt |
| **Success Rate** | ~70% JSON parsing | Target >95% JSON parsing |

## Step-by-Step Migration

### 1. Update Prompt Loading

**Before (v0.1):**
```typescript
const harmonyPrompt = loadHarmonyPrompt('develop.harmony.txt');
const response = await teacherGenerate({
  model: 'GPT-OSS-20B',
  messages: [{ role: 'user', content: harmonyPrompt }],
  task: 'lesson_generation'
});
```

**After (v0.2b):**
```typescript
const promptPath = 'resources/prompts/alain-kit-v0.2b/core/';
const researchPrompt = readFileSync(join(promptPath, '01-research.txt'), 'utf8');
const response = await teacherGenerate({
  model: 'gpt-oss-20b',
  messages: [
    { role: 'system', content: extractSystemMessage(researchPrompt) },
    { role: 'user', content: modelUrl }
  ]
});
```

### 2. Implement Output Format Routing

**New Pattern:**
```typescript
const phaseOutputFormats = {
  research: 'json',
  outline: 'json',
  section: 'markdown', 
  validate: 'json'
};

const processResponse = async (phase: string, rawResponse: string) => {
  if (phaseOutputFormats[phase] === 'json') {
    try {
      return JSON.parse(rawResponse);
    } catch (error) {
      // Fallback to JSON repair
      const repaired = await repairJSON(rawResponse);
      return JSON.parse(repaired);
    }
  } else {
    return rawResponse; // Return markdown as-is
  }
};
```

### 3. Replace Monolithic Workflow

**Before (v0.1):**
```typescript
// Single massive prompt doing everything
const result = await generateLesson(harmonyDevelopPrompt, modelUrl);
```

**After (v0.2b):**
```typescript
// Sequential focused prompts
const research = await runPhase('01-research.txt', { modelUrl });
const outline = await runPhase('02-outline.txt', { research });

const sections = [];
for (let i = 0; i < outline.steps.length; i++) {
  const section = await runPhase('03-section.txt', { 
    outline, 
    sectionNumber: i + 1,
    previousSections: sections 
  });
  sections.push(section);
}

const validation = await runPhase('04-validate.txt', { outline, sections });
```

### 4. Add JSON Repair Fallback

**Implementation:**
```typescript
const repairJSON = async (malformedJson: string): Promise<string> => {
  const repairPrompt = readFileSync(
    'resources/prompts/alain-kit-v0.2b/utils/json-repair.txt', 
    'utf8'
  );
  
  const response = await teacherGenerate({
    model: 'gpt-oss-20b',
    messages: [
      { role: 'system', content: repairPrompt },
      { role: 'user', content: malformedJson }
    ],
    temperature: 0.1 // Low temperature for deterministic repair
  });
  
  return response.content;
};
```

### 5. Update Quality Gates

**Before (v0.1):**
```typescript
// Harmony function calls
const validation = parseHarmonyResponse(response.content);
```

**After (v0.2b):**
```typescript
// Direct JSON validation
const validation = await runPhase('04-validate.txt', { 
  notebook: assembledContent,
  design: outlineData 
});

if (validation.overall_score < 80) {
  // Trigger remediation workflow
  await remediateContent(validation.recommendations);
}
```

## Prompt Mapping

| v0.1 Harmony File | v0.2b Replacement | Notes |
|-------------------|-------------------|-------|
| `orchestrator.harmony.txt` | `00-orchestrator.txt` | Simplified workflow coordination |
| `research.harmony.txt` | `01-research.txt` | Direct JSON schema, no channels |
| `design.harmony.txt` | `02-outline.txt` | Focused on structure only |
| `develop.harmony.txt` | `03-section.txt` | Iterative content generation |
| `validate.harmony.txt` | `04-validate.txt` | Streamlined quality assessment |
| `util/json_repair.harmony.txt` | `utils/json-repair.txt` | Removed Harmony overhead |

## Configuration Updates

### Environment Variables
```bash
# Update prompt version
ALAIN_PROMPT_VERSION=v0.2b

# Add JSON repair timeout
JSON_REPAIR_TIMEOUT=5000

# Enable audit logging for comparison
ENABLE_PROMPT_AUDIT=true
```

### Backend Configuration
```typescript
// config/prompts.ts
export const promptConfig = {
  version: 'v0.2b',
  basePath: 'resources/prompts/alain-kit-v0.2b',
  fallbackEnabled: true,
  auditEnabled: process.env.ENABLE_PROMPT_AUDIT === 'true',
  qualityThreshold: 80,
  maxRetries: 3
};
```

## Testing Migration

### A/B Testing Setup
```typescript
const runMigrationTest = async (modelUrl: string) => {
  const [v0_1Results, v2Results] = await Promise.all([
    runWorkflowV0_1(modelUrl),
    runWorkflowV2(modelUrl)
  ]);
  
  return {
    v0_1: {
      success: v0_1Results.success,
      parseRate: v0_1Results.jsonParseSuccessRate,
      responseTime: v0_1Results.avgResponseTime,
      qualityScore: v0_1Results.avgQualityScore
    },
    v2: {
      success: v2Results.success,
      parseRate: v2Results.jsonParseSuccessRate, 
      responseTime: v2Results.avgResponseTime,
      qualityScore: v2Results.avgQualityScore
    },
    improvement: {
      parseRate: v2Results.jsonParseSuccessRate - v0_1Results.jsonParseSuccessRate,
      speed: (v0_1Results.avgResponseTime - v2Results.avgResponseTime) / v0_1Results.avgResponseTime,
      quality: v2Results.avgQualityScore - v0_1Results.avgQualityScore
    }
  };
};
```

### Validation Checklist

- [ ] JSON parsing success rate >95%
- [ ] Response time improvement >30%
- [ ] Content quality maintained (>80/100)
- [ ] All workflow phases complete successfully
- [ ] Error handling works for edge cases
- [ ] Audit logs capture necessary debugging info

## Common Migration Issues

### 1. JSON Parsing Failures
**Symptom:** High rate of JSON.parse() errors
**Solution:** Implement json-repair fallback, check prompt formatting

### 2. Content Quality Regression  
**Symptom:** Lower educational effectiveness scores
**Solution:** Adjust section generation parameters, add more context

### 3. Token Limit Exceeded
**Symptom:** API errors due to token limits
**Solution:** Reduce section scope, split into smaller chunks

### 4. Workflow Coordination Issues
**Symptom:** Missing dependencies between phases
**Solution:** Implement proper state management, validate inputs

## Rollback Plan

If migration issues occur:

1. **Immediate Rollback:**
   ```typescript
   // Switch back to v0.1
   const promptVersion = process.env.ROLLBACK_MODE ? 'v0.1' : 'v0.2b';
   ```

2. **Gradual Migration:**
   ```typescript
   // Migrate one phase at a time
   const useV2ForPhase = (phase: string) => {
     const migratedPhases = ['research']; // Start with research only
     return migratedPhases.includes(phase);
   };
   ```

3. **Feature Flags:**
   ```typescript
   const features = {
     useV2Prompts: process.env.FEATURE_V2_PROMPTS === 'true',
     enableJsonRepair: process.env.FEATURE_JSON_REPAIR === 'true',
     auditMode: process.env.FEATURE_AUDIT_MODE === 'true'
   };
   ```

## Performance Expectations

### Expected Improvements
- **JSON Parsing Success**: 70% → 95%+
- **Response Time**: 8s → 3s average per phase
- **Token Efficiency**: 3x reduction in prompt tokens
- **Maintenance Overhead**: 60% reduction in prompt complexity

### Monitoring Metrics
```typescript
const migrationMetrics = {
  jsonParseSuccessRate: 0.95,
  avgResponseTimeMs: 3000,
  contentQualityScore: 85,
  userSatisfactionScore: 4.2,
  errorRate: 0.02
};
```

## Support & Troubleshooting

### Debug Tools
1. **Audit Logging**: Enable detailed request/response logging
2. **Prompt Comparison**: Side-by-side v0.1 vs v0.2b testing
3. **JSON Validation**: Real-time parsing success monitoring
4. **Performance Profiling**: Response time and token usage tracking

### Getting Help
- Check the troubleshooting section in README.md
- Review example inputs/outputs in docs/examples/
- Enable audit mode for detailed debugging information
- Compare with known working examples from the test suite
