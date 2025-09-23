# ALAIN-Kit v0.2b: Simplified & Optimized Prompts

**Version:** 0.2b  
**Date:** September 20, 2025  
**Target Model:** gpt-oss-20b (optimized for reliability)

## Overview

ALAIN-Kit v0.2b addresses critical issues identified in the original Harmony-based prompts:

- **Simplified tool calling** - No complex Harmony format tokens
- **Focused scope** - Single-responsibility prompts instead of monolithic ones  
- **Strategic output formats** - JSON for structured data, Markdown for content
- **gpt-oss-20b optimized** - Designed for model's actual capabilities and limitations

## Key Improvements

### 🔧 **Technical Fixes**
- Removed unreliable Harmony channel system (`<|constrain|>`, `<|channel|>`)
- Simplified function calling to direct JSON schema instructions
- Reduced prompt complexity and token count
- Added explicit fallback handling for JSON parsing failures

### 📊 **Strategic Output Design**
- **JSON Output**: Research findings, outlines, validation reports
- **Markdown Output**: Tutorial sections, explanations, code examples
- **Clear format specifications** with examples and validation rules

### 🎯 **Focused Prompts**
- **Research** (01-research.txt): Model intelligence gathering only
- **Outline** (02-outline.txt): Learning structure planning only  
- **Section** (03-section.txt): Individual content generation only
- **Validate** (04-validate.txt): Quality assessment only

## Directory Structure

```
alain-kit-v0.2b/
├── core/                    # Main workflow prompts
│   ├── 00-orchestrator.txt  # Workflow coordination
│   ├── 01-research.txt      # Model intelligence (JSON)
│   ├── 02-outline.txt       # Learning structure (JSON)
│   ├── 03-section.txt       # Content generation (Markdown)
│   └── 04-validate.txt      # Quality assessment (JSON)
├── utils/                   # Supporting utilities
│   ├── json-repair.txt      # Fix malformed JSON responses
│   └── content-assembler.txt # Merge sections into final tutorial
├── docs/                    # Documentation and examples
│   ├── examples/            # Sample inputs/outputs
│   └── migration-guide.md   # Upgrading from v0.1 (Harmony)
└── README.md               # This file
```

## Quick Start

### 1. Research Phase
```bash
# Use 01-research.txt with model URL
# Input: Hugging Face model URL
# Output: Structured JSON with technical specs and educational context
```

### 2. Outline Phase  
```bash
# Use 02-outline.txt with research JSON
# Input: Research findings from step 1
# Output: Complete tutorial outline with steps, objectives, assessments
```

### 3. Section Generation
```bash
# Use 03-section.txt iteratively for each step
# Input: Outline + section number + previous context
# Output: Markdown content for one tutorial section
```

### 4. Validation
```bash
# Use 04-validate.txt with complete content
# Input: Assembled tutorial + design specification  
# Output: Quality scores and improvement recommendations
```

## Integration with ALAIN Platform

### Backend Changes Required
```typescript
// Update prompt loading to use v0.2b
const promptPath = 'resources/prompts/alain-kit-v0.2b/core/';

// Add JSON repair fallback
async function generateWithFallback(prompt: string, input: any) {
  const response = await teacherGenerate(prompt, input);
  
  try {
    return JSON.parse(response.content);
  } catch (error) {
    // Use json-repair.txt to fix malformed JSON
    const repaired = await repairJSON(response.content);
    return JSON.parse(repaired);
  }
}
```

### Output Format Handling
```typescript
// Handle different output formats strategically
const phaseOutputFormats = {
  research: 'json',
  outline: 'json', 
  section: 'markdown',
  validate: 'json'
};
```

## Performance Improvements

Based on gpt-oss-20b research and testing:

- **Reduced token count**: 60-80% smaller prompts
- **Higher success rate**: Simplified instructions improve reliability
- **Better JSON parsing**: Clear schemas with validation rules
- **Faster execution**: Focused prompts reduce processing time

## Migration from v0.1 (Harmony)

See `docs/migration-guide.md` for detailed upgrade instructions.

Key changes:
1. Replace Harmony prompts with v0.2b equivalents
2. Update output format handling (JSON vs Markdown)
3. Implement JSON repair fallback system
4. Adjust workflow to use iterative section generation

## Quality Assurance

### Testing Strategy
1. **A/B Testing**: Compare v0.2b vs v0.1 success rates
2. **JSON Parsing**: Monitor parsing failure rates
3. **Content Quality**: Validate educational effectiveness
4. **Performance**: Measure response times and token efficiency

### Success Metrics
- JSON parsing success rate > 95%
- Content quality scores > 80/100
- Response time improvement > 30%
- User satisfaction scores > 4.0/5.0

## Known Limitations

1. **Model Dependency**: Optimized specifically for gpt-oss-20b
2. **Iterative Process**: Section generation requires multiple API calls
3. **Context Management**: Previous sections must be tracked manually
4. **Fallback Overhead**: JSON repair adds processing time

## Support & Troubleshooting

### Common Issues
1. **JSON Parsing Failures**: Use `utils/json-repair.txt`
2. **Content Quality Issues**: Check input data quality and prompt parameters
3. **Token Limit Exceeded**: Reduce section scope or split into smaller chunks
4. **Inconsistent Output**: Verify input format matches expected schema

### Debug Tools
- Enable audit logging to capture raw responses
- Use thinking text analysis for prompt optimization
- Monitor API response patterns and error rates

## Contributing

When adding new prompts to v0.2b:
1. Follow single-responsibility principle
2. Keep token count under 2000
3. Specify clear output format (JSON schema or Markdown structure)
4. Include fallback instructions for error cases
5. Test with gpt-oss-20b specifically

## License

Part of the ALAIN open-source project under MIT License.
