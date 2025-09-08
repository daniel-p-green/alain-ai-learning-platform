import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tutorialsDB } from './db';
import { create } from './create';
import { addStep } from './add_step';
import { updateStep } from './update_step';
import { deleteStep } from './delete_step';
import { reorderSteps } from './reorder_steps';
import { getStep } from './get_step';
import { listSteps } from './list_steps';

describe('Step CRUD Operations', () => {
  let tutorialId: number;

  beforeEach(async () => {
    await tutorialsDB.exec`DELETE FROM user_progress WHERE user_id LIKE 'test_%'`;
    await tutorialsDB.exec`DELETE FROM tutorial_steps WHERE tutorial_id IN (SELECT id FROM tutorials WHERE title LIKE 'Test%')`;
    await tutorialsDB.exec`DELETE FROM tutorials WHERE title LIKE 'Test%'`;

    const tutorial = await create({
      title: 'Test Tutorial',
      description: 'A test tutorial for step CRUD operations',
      model: 'gpt-3.5-turbo',
      provider: 'openai',
      difficulty: 'beginner',
      tags: ['test']
    });
    tutorialId = tutorial.id;
  });

  afterEach(async () => {
    await tutorialsDB.exec`DELETE FROM user_progress WHERE user_id LIKE 'test_%'`;
    await tutorialsDB.exec`DELETE FROM tutorial_steps WHERE tutorial_id = ${tutorialId}`;
    await tutorialsDB.exec`DELETE FROM tutorials WHERE id = ${tutorialId}`;
  });

  describe('addStep', () => {
    it('should add a step to an empty tutorial', async () => {
      const step = await addStep({
        tutorialId,
        stepOrder: 1,
        title: 'First Step',
        content: 'This is the first step content',
        codeTemplate: 'print("Hello, World!")',
        expectedOutput: 'Hello, World!',
        modelParams: { temperature: 0.7 }
      });

      expect(step.id).toBeDefined();
      expect(step.tutorial_id).toBe(tutorialId);
      expect(step.step_order).toBe(1);
      expect(step.title).toBe('First Step');
      expect(step.content).toBe('This is the first step content');
      expect(step.code_template).toBe('print("Hello, World!")');
      expect(step.expected_output).toBe('Hello, World!');
      expect(step.model_params).toEqual({ temperature: 0.7 });
    });

    it('should add multiple steps in sequence', async () => {
      await addStep({
        tutorialId,
        stepOrder: 1,
        title: 'Step 1',
        content: 'First step',
      });

      await addStep({
        tutorialId,
        stepOrder: 2,
        title: 'Step 2',
        content: 'Second step',
      });

      const steps = await listSteps({ tutorialId });
      expect(steps.steps).toHaveLength(2);
      expect(steps.steps[0].step_order).toBe(1);
      expect(steps.steps[1].step_order).toBe(2);
    });

    it('should validate required fields', async () => {
      await expect(addStep({
        tutorialId,
        stepOrder: 1,
        title: '',
        content: 'Valid content',
      })).rejects.toThrow('step title cannot be empty');

      await expect(addStep({
        tutorialId,
        stepOrder: 1,
        title: 'Valid title',
        content: '',
      })).rejects.toThrow('step content cannot be empty');

      await expect(addStep({
        tutorialId,
        stepOrder: 0,
        title: 'Valid title',
        content: 'Valid content',
      })).rejects.toThrow('step order must be at least 1');
    });
  });

  describe('updateStep', () => {
    let stepId: number;

    beforeEach(async () => {
      const step = await addStep({
        tutorialId,
        stepOrder: 1,
        title: 'Original Title',
        content: 'Original content',
        codeTemplate: 'original code',
        expectedOutput: 'original output',
        modelParams: { temperature: 0.5 }
      });
      stepId = step.id;
    });

    it('should update step title', async () => {
      const updated = await updateStep({
        stepId,
        title: 'Updated Title'
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.content).toBe('Original content');
    });

    it('should validate step exists', async () => {
      await expect(updateStep({
        stepId: 99999,
        title: 'Updated title'
      })).rejects.toThrow('tutorial step with ID 99999 not found');
    });
  });

  describe('deleteStep', () => {
    it('should delete a step and reorder remaining steps', async () => {
      const step1 = await addStep({ tutorialId, stepOrder: 1, title: 'Step 1', content: 'First' });
      const step2 = await addStep({ tutorialId, stepOrder: 2, title: 'Step 2', content: 'Second' });
      const step3 = await addStep({ tutorialId, stepOrder: 3, title: 'Step 3', content: 'Third' });

      const result = await deleteStep({ stepId: step2.id });

      expect(result.success).toBe(true);
      expect(result.deletedStep.title).toBe('Step 2');
      expect(result.reorderedSteps).toBe(1);

      const steps = await listSteps({ tutorialId });
      expect(steps.steps).toHaveLength(2);
      expect(steps.steps[0].title).toBe('Step 1');
      expect(steps.steps[0].step_order).toBe(1);
      expect(steps.steps[1].title).toBe('Step 3');
      expect(steps.steps[1].step_order).toBe(2);
    });

    it('should prevent deletion of the only step', async () => {
      const step = await addStep({ tutorialId, stepOrder: 1, title: 'Only Step', content: 'Only content' });

      await expect(deleteStep({ stepId: step.id }))
        .rejects.toThrow('cannot delete the only step in tutorial');
    });
  });

  describe('reorderSteps', () => {
    let step1Id: number, step2Id: number, step3Id: number;

    beforeEach(async () => {
      const s1 = await addStep({ tutorialId, stepOrder: 1, title: 'Step 1', content: 'First' });
      const s2 = await addStep({ tutorialId, stepOrder: 2, title: 'Step 2', content: 'Second' });
      const s3 = await addStep({ tutorialId, stepOrder: 3, title: 'Step 3', content: 'Third' });
      step1Id = s1.id;
      step2Id = s2.id;
      step3Id = s3.id;
    });

    it('should reorder all steps completely', async () => {
      const result = await reorderSteps({
        tutorialId,
        stepOrders: [
          { stepId: step3Id, newOrder: 1 },
          { stepId: step1Id, newOrder: 2 },
          { stepId: step2Id, newOrder: 3 }
        ]
      });

      expect(result.success).toBe(true);
      expect(result.reorderedSteps).toHaveLength(3);

      const steps = await listSteps({ tutorialId });
      expect(steps.steps[0].title).toBe('Step 3');
      expect(steps.steps[1].title).toBe('Step 1');
      expect(steps.steps[2].title).toBe('Step 2');
    });

    it('should validate duplicate step IDs', async () => {
      await expect(reorderSteps({
        tutorialId,
        stepOrders: [
          { stepId: step1Id, newOrder: 2 },
          { stepId: step1Id, newOrder: 3 }
        ]
      })).rejects.toThrow('duplicate step IDs found');
    });
  });
});
