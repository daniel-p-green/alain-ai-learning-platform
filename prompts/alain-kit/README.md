# ALAIN-Kit Harmony Prompts

This directory contains the complete set of OpenAI Harmony-formatted prompts that implement the ALAIN-Kit methodology for systematic AI model educational content generation.

## Overview

ALAIN-Kit is a four-phase methodology that transforms AI model information into comprehensive, interactive educational notebooks:

1. **Research Phase** (`research.harmony.txt`) - Gather comprehensive model intelligence
2. **Design Phase** (`design.harmony.txt`) - Plan structured learning experiences
3. **Development Phase** (`develop.harmony.txt`) - Build functional interactive notebooks
4. **Validation Phase** (`validate.harmony.txt`) - Test and validate implementations
5. **Orchestrator** (`orchestrator.harmony.txt`) - Coordinate the complete workflow

## Quick Start

### Using Individual Phase Prompts

1. **Research Phase**: Start with model intelligence gathering
   ```bash
   # Use research.harmony.txt with GPT-OSS-20B
   # Input: Hugging Face model URL or technical specifications
   # Output: Comprehensive research findings via emit_research_findings function
   ```

2. **Design Phase**: Transform research into learning architecture
   ```bash
   # Use design.harmony.txt with research findings
   # Input: Research data and target difficulty level
   # Output: Complete learning experience design via emit_learning_design function
   ```

3. **Development Phase**: Build interactive notebook implementation
   ```bash
   # Use develop.harmony.txt with design specifications
   # Input: Learning design and technical requirements
   # Output: Complete notebook implementation via emit_notebook_implementation function
   ```

4. **Validation Phase**: Test and validate final implementation
   ```bash
   # Use validate.harmony.txt with notebook implementation
   # Input: Complete notebook and validation criteria
   # Output: Comprehensive validation report via emit_validation_report function
   ```

### Using the Master Orchestrator

For end-to-end automation, use `orchestrator.harmony.txt`:

```bash
# Complete ALAIN-Kit workflow orchestration
# Input: Model URL and requirements
# Output: Final deployment-ready notebook via emit_workflow_report function
```

## Harmony Format Structure

Each prompt follows the OpenAI Harmony response format:

### System Message
```text
You are ChatGPT, a large language model trained by OpenAI.
Knowledge cutoff: 2024-06
Current date: 2025-08-21

Reasoning: high

# Valid channels: analysis, commentary, final. Channel must be included for every message.
Calls to these tools must go to the commentary channel: 'functions'.
```

### Developer Message
- Contains comprehensive instructions for each phase
- Defines function schemas for structured output
- Includes quality standards and validation criteria

### Function Definitions
Each phase defines specific functions for structured output:
- `emit_research_findings()` - Research phase output
- `emit_learning_design()` - Design phase output
- `emit_notebook_implementation()` - Development phase output
- `emit_validation_report()` - Validation phase output
- `emit_workflow_report()` - Orchestrator final output

## Integration with ALAIN Platform

### Backend Integration

The prompts are designed to work with the ALAIN backend:

```typescript
// Example usage in backend/execution/lesson-generator.ts
const teacherPrompt = loadHarmonyPrompt('research.harmony.txt');
const response = await teacherGenerate({
  model: 'GPT-OSS-20B',
  messages: [{ role: 'user', content: lessonPrompt }],
  task: 'lesson_generation'
});
```

### Frontend Integration

The structured function outputs can be directly consumed by the frontend:

```typescript
// Example: Processing research findings
const researchData = parseHarmonyResponse(response.content);
const lessonDesign = await generateDesign(researchData);
// ... continue through phases
```

## Quality Assurance

### Validation Standards

Each phase includes comprehensive quality checks:

- **Research**: Accuracy, completeness, educational value
- **Design**: Learning alignment, engagement, technical feasibility
- **Development**: Code execution, widget functionality, cross-platform support
- **Validation**: Technical excellence, educational effectiveness, user experience

### Error Handling

The prompts include robust error handling:
- Invalid input validation
- Resource constraint handling
- Platform compatibility checks
- Educational quality verification

## Platform Compatibility

### Supported Environments

The generated notebooks are optimized for:

- **Google Colab**: Cloud-based execution with collaborative features
- **Jupyter Notebook**: Local execution with full functionality
- **Jupyter Lab**: Advanced features and extensions
- **Standalone HTML**: Export and sharing capabilities

### Performance Optimization

Each phase includes platform-specific optimizations:
- Memory usage optimization
- Execution time benchmarks
- Resource requirement specifications
- Fallback mechanisms for limited environments

## Customization

### Adapting for Different Models

The prompts can be customized for different AI model types:

```typescript
// Example: Customizing for specific model types
const customPrompt = adaptHarmonyPrompt('research.harmony.txt', {
  modelType: 'vision-language',
  additionalRequirements: ['multimodal capabilities', 'image processing']
});
```

### Scaling for Different Skill Levels

The design phase automatically adapts for different learner levels:

```typescript
const designConfig = {
  difficulty: 'intermediate',
  prerequisites: ['basic Python', 'transformer concepts'],
  learningObjectives: ['advanced prompting', 'fine-tuning', 'deployment']
};
```

## Monitoring and Analytics

### Quality Metrics

Track generation quality across phases:

```typescript
const qualityMetrics = {
  research: {
    completeness: 0.95,
    accuracy: 0.92,
    educationalValue: 0.88
  },
  design: {
    learningAlignment: 0.91,
    engagement: 0.86,
    feasibility: 0.94
  },
  development: {
    functionality: 0.89,
    performance: 0.93,
    accessibility: 0.87
  },
  validation: {
    overallQuality: 0.90
  }
};
```

### Usage Analytics

Monitor prompt effectiveness:

```typescript
const analytics = {
  phaseCompletion: {
    research: 0.98,
    design: 0.95,
    development: 0.92,
    validation: 0.96
  },
  userSatisfaction: 0.88,
  learningOutcomes: 0.91,
  technicalIssues: 0.04
};
```

## Troubleshooting

### Common Issues

1. **Harmony Format Errors**
   - Ensure proper channel specification
   - Validate function call formatting
   - Check special token usage

2. **Model Response Issues**
   - Verify GPT-OSS model availability
   - Check Poe API connectivity
   - Validate prompt token limits

3. **Platform Compatibility**
   - Test widget rendering across environments
   - Verify dependency installations
   - Check browser compatibility

### Debugging Tools

```typescript
// Debug Harmony responses
const debugResponse = (response: string) => {
  console.log('Harmony Channels:', parseChannels(response));
  console.log('Function Calls:', extractFunctionCalls(response));
  console.log('Content Validation:', validateHarmonyFormat(response));
};
```

## Future Enhancements

### Planned Improvements

1. **Advanced Orchestration**
   - Parallel phase execution
   - Conditional branching based on results
   - Dynamic quality gate adjustments

2. **Enhanced Validation**
   - Automated testing integration
   - Real-time quality monitoring
   - User feedback incorporation

3. **Extended Platform Support**
   - VS Code notebooks
   - DeepNote integration
   - Additional cloud platforms

4. **Adaptive Learning**
   - Personalized content generation
   - Dynamic difficulty adjustment
   - Learning path optimization

## Contributing

### Adding New Prompts

1. Follow the established Harmony format structure
2. Include comprehensive function definitions
3. Add quality validation standards
4. Test across all supported platforms
5. Update documentation and examples

### Improving Existing Prompts

1. Enhance function schemas with additional validation
2. Add platform-specific optimizations
3. Improve error handling and recovery
4. Update quality standards based on user feedback

## Support

For issues or questions about the ALAIN-Kit Harmony prompts:

- Check the [ALAIN-Kit methodology documentation](../../leap-hack-2025/alain-kit/alain-kit-methodology.md)
- Review the [Harmony format guide](../../leap-hack-2025/gpt-oss/OpenAI_harmony.md)
- Open an issue in the main repository

## License

These prompts are part of the ALAIN open-source project and are available under the MIT License.
