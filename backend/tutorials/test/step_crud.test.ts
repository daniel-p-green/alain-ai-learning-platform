import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tutorialsDB } from '../db';
import { create } from '../create';
import { addStep } from '../add_step';
import { updateStep } from '../update_step';
import { deleteStep } from '../delete_step';
import { reorderSteps } from '../reorder_steps';
import { getStep } from '../get_step';
import { listSteps } from '../list_steps';

describe('Step CRUD Operations', () => {
  let tutorialId: number;

  beforeEach(async () => {
    // Clean up any existing test data
    await tutorialsDB.exec`DELETE FROM user_progress WHERE user_id LIKE 'test_%'`;
    await tutorialsDB.exec`DELETE FROM tutorial_steps WHERE tutorial_id IN (SELECT id FROM tutorials WHERE title LIKE 'Test%')`;
    await tutorialsDB.exec`DELETE FROM tutorials WHERE title LIKE 'Test%'`;

    // Create a test tutorial
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
    // Clean up test data
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

    it('should insert step in the middle and reorder existing steps', async () => {
      // Add initial steps
      await addStep({ tutorialId, stepOrder: 1, title: 'Step 1', content: 'First' });
      await addStep({ tutorialId, stepOrder: 2, title: 'Step 2', content: 'Second' });
      await addStep({ tutorialId, stepOrder: 3, title: 'Step 3', content: 'Third' });

      // Insert in the middle
      await addStep({ tutorialId, stepOrder: 2, title: 'New Step', content: 'Inserted step' });

      const steps = await listSteps({ tutorialId });
      expect(steps.steps).toHaveLength(4);
      expect(steps.steps[0].title).toBe('Step 1');
      expect(steps.steps[1].title).toBe('New Step');
      expect(steps.steps[2].title).toBe('Step 2');
      expect(steps.steps[3].title).toBe('Step 3');
      
      // Check step orders
      expect(steps.steps[0].step_order).toBe(1);
      expect(steps.steps[1].step_order).toBe(2);
      expect(steps.steps[2].step_order).toBe(3);
      expect(steps.steps[3].step_order).toBe(4);
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

    it('should validate tutorial exists', async () => {
      await expect(addStep({
        tutorialId: 99999,
        stepOrder: 1,
        title: 'Valid title',
        content: 'Valid content',
      })).rejects.toThrow('tutorial with ID 99999 not found');
    });

    it('should validate step order is not too high', async () => {
      await addStep({ tutorialId, stepOrder: 1, title: 'Step 1', content: 'First' });
      
      await expect(addStep({
        tutorialId,
        stepOrder: 5, // Too high (max should be 2)
        title: 'Invalid step',
        content: 'This should fail',
      })).rejects.toThrow('step order 5 is invalid');
    });

    it('should validate model parameters', async () => {
      await expect(addStep({
        tutorialId,
        stepOrder: 1,
        title: 'Valid title',
        content: 'Valid content',
        modelParams: "invalid json"
      })).rejects.toThrow('invalid model parameters');
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
      expect(updated.content).toBe('Original content'); // Should remain unchanged
    });

    it('should update step content', async () => {
      const updated = await updateStep({
        stepId,
        content: 'Updated content'
      });

      expect(updated.content).toBe('Updated content');
      expect(updated.title).toBe('Original Title'); // Should remain unchanged
    });

    it('should update multiple fields', async () => {
      const updated = await updateStep({
        stepId,
        title: 'New Title',
        content: 'New content',
        codeTemplate: 'new code',
        expectedOutput: 'new output',
        modelParams: { temperature: 0.8, max_tokens: 100 }
      });

      expect(updated.title).toBe('New Title');
      expect(updated.content).toBe('New content');
      expect(updated.code_template).toBe('new code');
      expect(updated.expected_output).toBe('new output');
      expect(updated.model_params).toEqual({ temperature: 0.8, max_tokens: 100 });
    });

    it('should validate step exists', async () => {
      await expect(updateStep({
        stepId: 99999,
        title: 'Updated title'
      })).rejects.toThrow('tutorial step with ID 99999 not found');
    });

    it('should validate empty fields', async () => {
      await expect(updateStep({
        stepId,
        title: ''
      })).rejects.toThrow('step title cannot be empty');

      await expect(updateStep({
        stepId,
        content: '   '
      })).rejects.toThrow('step content cannot be empty');
    });

    it('should require at least one field to update', async () => {
      await expect(updateStep({
        stepId
      })).rejects.toThrow('at least one field must be provided for update');
    });

    it('should handle null values correctly', async () => {
      const updated = await updateStep({
        stepId,
        codeTemplate: null,
        expectedOutput: null,
        modelParams: null
      });

      expect(updated.code_template).toBeNull();
      expect(updated.expected_output).toBeNull();
      expect(updated.model_params).toBeNull();
    });
  });

  describe('deleteStep', () => {
    it('should delete a step and reorder remaining steps', async () => {
      // Add multiple steps
      const step1 = await addStep({ tutorialId, stepOrder: 1, title: 'Step 1', content: 'First' });
      const step2 = await addStep({ tutorialId, stepOrder: 2, title: 'Step 2', content: 'Second' });
      const step3 = await addStep({ tutorialId, stepOrder: 3, title: 'Step 3', content: 'Third' });

      // Delete the middle step
      const result = await deleteStep({ stepId: step2.id });

      expect(result.success).toBe(true);
      expect(result.deletedStep.title).toBe('Step 2');
      expect(result.reorderedSteps).toBe(1); // Step 3 was reordered

      // Check remaining steps
      const steps = await listSteps({ tutorialId });
      expect(steps.steps).toHaveLength(2);
      expect(steps.steps[0].title).toBe('Step 1');
      expect(steps.steps[0].step_order).toBe(1);
      expect(steps.steps[1].title).toBe('Step 3');
      expect(steps.steps[1].step_order).toBe(2); // Should be reordered from 3 to 2
    });

    it('should prevent deletion of the only step', async () => {
      const step = await addStep({ tutorialId, stepOrder: 1, title: 'Only Step', content: 'Only content' });

      await expect(deleteStep({ stepId: step.id }))
        .rejects.toThrow('cannot delete the only step in tutorial');
    });

    it('should prevent deletion if users have progress on the step', async () => {
      const step1 = await addStep({ tutorialId, stepOrder: 1, title: 'Step 1', content: 'First' });
      const step2 = await addStep({ tutorialId, stepOrder: 2, title: 'Step 2', content: 'Second' });

      // Add user progress
      await tutorialsDB.exec`
        INSERT INTO user_progress (user_id, tutorial_id, current_step, completed_steps)
        VALUES ('test_user', ${tutorialId}, 2, ARRAY[1])
      `;

      await expect(deleteStep({ stepId: step2.id }))
        .rejects.toThrow('cannot delete step "Step 2" as 1 user(s) have progress on this step');
    });

    it('should validate step exists', async () => {
      await expect(deleteStep({ stepId: 99999 }))
        .rejects.toThrow('tutorial step with ID 99999 not found');
    });

    it('should update user progress when deleting steps', async () => {
      // Add steps
      const step1 = await addStep({ tutorialId, stepOrder: 1, title: 'Step 1', content: 'First' });
      const step2 = await addStep({ tutorialId, stepOrder: 2, title: 'Step 2', content: 'Second' });
      const step3 = await addStep({ tutorialId, stepOrder: 3, title: 'Step 3', content: 'Third' });
      const step4 = await addStep({ tutorialId, stepOrder: 4, title: 'Step 4', content: 'Fourth' });

      // Add user progress on later steps
      await tutorialsDB.exec`
        INSERT INTO user_progress (user_id, tutorial_id, current_step, completed_steps)
        VALUES ('test_user', ${tutorialId}, 3, ARRAY[1, 2])
      `;

      // Delete step 2
      await deleteStep({ stepId: step2.id });

      // Check updated user progress
      const progress = await tutorialsDB.queryRow<{ current_step: number; completed_steps: number[] }>`
        SELECT current_step, completed_steps
        FROM user_progress
        WHERE user_id = 'test_user' AND tutorial_id = ${tutorialId}
      `;

      expect(progress?.current_step).toBe(2); // Was 3, now 2 (adjusted for deleted step)
      expect(progress?.completed_steps).toEqual([1]); // Step 2 removed, step 1 remains
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

    it('should handle partial reordering', async () => {
      // Only reorder step 1 to position 3
      const result = await reorderSteps({
        tutorialId,
        stepOrders: [
          { stepId: step1Id, newOrder: 4 } // Move to end
        ]
      });

      expect(result.success).toBe(true);
      expect(result.reorderedSteps).toHaveLength(1);

      const steps = await listSteps({ tutorialId });
      expect(steps.steps[0].title).toBe('Step 2');
      expect(steps.steps[0].step_order).toBe(2);
      expect(steps.steps[1].title).toBe('Step 3');
      expect(steps.steps[1].step_order).toBe(3);
      expect(steps.steps[2].title).toBe('Step 1');
      expect(steps.steps[2].step_order).toBe(4);
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

    it('should validate duplicate new orders', async () => {
      await expect(reorderSteps({
        tutorialId,
        stepOrders: [
          { stepId: step1Id, newOrder: 2 },
          { stepId: step2Id, newOrder: 2 }
        ]
      })).rejects.toThrow('duplicate new step orders found');
    });

    it('should validate step orders are positive', async () => {
      await expect(reorderSteps({
        tutorialId,
        stepOrders: [
          { stepId: step1Id, newOrder: 0 }
        ]
      })).rejects.toThrow('all step orders must be positive integers');
    });

    it('should validate complete sequence when reordering all steps', async () => {
      await expect(reorderSteps({
        tutorialId,
        stepOrders: [
          { stepId: step1Id, newOrder: 1 },
          { stepId: step2Id, newOrder: 2 },
          { stepId: step3Id, newOrder: 5 } // Gap in sequence
        ]
      })).rejects.toThrow('when reordering all steps, new orders must form a complete sequence');
    });

    it('should validate steps belong to tutorial', async () => {
      await expect(reorderSteps({
        tutorialId,
        stepOrders: [
          { stepId: 99999, newOrder: 1 }
        ]
      })).rejects.toThrow('do not belong to tutorial');
    });

    it('should update user progress during reordering', async () => {
      // Add user progress
      await tutorialsDB.exec`
        INSERT INTO user_progress (user_id, tutorial_id, current_step, completed_steps)
        VALUES ('test_user', ${tutorialId}, 2, ARRAY[1])
      `;

      // Swap steps 1 and 2
      await reorderSteps({
        tutorialId,
        stepOrders: [
          { stepId: step1Id, newOrder: 2 },
          { stepId: step2Id, newOrder: 1 }
        ]
      });

      // Check updated progress
      const progress = await tutorialsDB.queryRow<{ current_step: number; completed_steps: number[] }>`
        SELECT current_step, completed_steps
        FROM user_progress
        WHERE user_id = 'test_user' AND tutorial_id = ${tutorialId}
      `;

      expect(progress?.current_step).toBe(1); // Was on step 2, now step 2 is at position 1
      expect(progress?.completed_steps).toEqual([2]); // Was step 1, now step 1 is at position 2
    });

    it('should validate tutorial exists', async () => {
      await expect(reorderSteps({
        tutorialId: 99999,
        stepOrders: [
          { stepId: step1Id, newOrder: 1 }
        ]
      })).rejects.toThrow('tutorial with ID 99999 not found');
    });

    it('should handle empty stepOrders array', async () => {
      await expect(reorderSteps({
        tutorialId,
        stepOrders: []
      })).rejects.toThrow('stepOrders array cannot be empty');
    });
  });

  describe('cascade deletions', () => {
    it('should cascade delete steps when tutorial is deleted', async () => {
      // Add steps to tutorial
      await addStep({ tutorialId, stepOrder: 1, title: 'Step 1', content: 'First' });
      await addStep({ tutorialId, stepOrder: 2, title: 'Step 2', content: 'Second' });

      // Verify steps exist
      const stepsBefore = await listSteps({ tutorialId });
      expect(stepsBefore.steps).toHaveLength(2);

      // Delete tutorial
      await tutorialsDB.exec`DELETE FROM tutorials WHERE id = ${tutorialId}`;

      // Verify steps are also deleted
      const stepsAfter = await tutorialsDB.queryAll`
        SELECT * FROM tutorial_steps WHERE tutorial_id = ${tutorialId}
      `;
      expect(stepsAfter).toHaveLength(0);
    });

    it('should cascade delete user progress when tutorial is deleted', async () => {
      // Add user progress
      await tutorialsDB.exec`
        INSERT INTO user_progress (user_id, tutorial_id, current_step, completed_steps)
        VALUES ('test_user', ${tutorialId}, 1, ARRAY[]::INTEGER[])
      `;

      // Verify progress exists
      const progressBefore = await tutorialsDB.queryAll`
        SELECT * FROM user_progress WHERE tutorial_id = ${tutorialId}
      `;
      expect(progressBefore).toHaveLength(1);

      // Delete tutorial
      await tutorialsDB.exec`DELETE FROM tutorials WHERE id = ${tutorialId}`;

      // Verify progress is also deleted
      const progressAfter = await tutorialsDB.queryAll`
        SELECT * FROM user_progress WHERE tutorial_id = ${tutorialId}
      `;
      expect(progressAfter).toHaveLength(0);
    });
  });

  describe('data integrity', () => {
    it('should maintain unique step orders within tutorial', async () => {
      await addStep({ tutorialId, stepOrder: 1, title: 'Step 1', content: 'First' });
      
      // Try to add another step with the same order
      await expect(
        tutorialsDB.exec`
          INSERT INTO tutorial_steps (tutorial_id, step_order, title, content)
          VALUES (${tutorialId}, 1, 'Duplicate', 'Should fail')
        `
      ).rejects.toThrow();
    });

    it('should allow same step order across different tutorials', async () => {
      // Create second tutorial
      const tutorial2 = await create({
        title: 'Test Tutorial 2',
        description: 'Second test tutorial',
        model: 'gpt-3.5-turbo',
        provider: 'openai',
        difficulty: 'beginner',
        tags: ['test']
      });

      // Add step with order 1 to both tutorials
      await addStep({ tutorialId, stepOrder: 1, title: 'Step 1A', content: 'First in tutorial 1' });
      await addStep({ tutorialId: tutorial2.id, stepOrder: 1, title: 'Step 1B', content: 'First in tutorial 2' });

      // Both should succeed
      const steps1 = await listSteps({ tutorialId });
      const steps2 = await listSteps({ tutorialId: tutorial2.id });
      
      expect(steps1.steps).toHaveLength(1);
      expect(steps2.steps).toHaveLength(1);
      expect(steps1.steps[0].title).toBe('Step 1A');
      expect(steps2.steps[0].title).toBe('Step 1B');

      // Cleanup
      await tutorialsDB.exec`DELETE FROM tutorials WHERE id = ${tutorial2.id}`;
    });

    it('should preserve user progress integrity during complex operations', async () => {
      // Add multiple steps
      const step1 = await addStep({ tutorialId, stepOrder: 1, title: 'Step 1', content: 'First' });
      const step2 = await addStep({ tutorialId, stepOrder: 2, title: 'Step 2', content: 'Second' });
      const step3 = await addStep({ tutorialId, stepOrder: 3, title: 'Step 3', content: 'Third' });
      const step4 = await addStep({ tutorialId, stepOrder: 4, title: 'Step 4', content: 'Fourth' });

      // Add user progress
      await tutorialsDB.exec`
        INSERT INTO user_progress (user_id, tutorial_id, current_step, completed_steps)
        VALUES ('test_user', ${tutorialId}, 3, ARRAY[1, 2])
      `;

      // Perform complex reordering (reverse order)
      await reorderSteps({
        tutorialId,
        stepOrders: [
          { stepId: step4.id, newOrder: 1 },
          { stepId: step3.id, newOrder: 2 },
          { stepId: step2.id, newOrder: 3 },
          { stepId: step1.id, newOrder: 4 }
        ]
      });

      // Check user progress is correctly updated
      const progress = await tutorialsDB.queryRow<{ current_step: number; completed_steps: number[] }>`
        SELECT current_step, completed_steps
        FROM user_progress
        WHERE user_id = 'test_user' AND tutorial_id = ${tutorialId}
      `;

      expect(progress?.current_step).toBe(2); // Step 3 is now at position 2
      expect(progress?.completed_steps).toEqual([4, 3]); // Steps 1,2 are now at positions 4,3
    });

    it('should handle concurrent step operations safely', async () => {
      // Add initial step
      await addStep({ tutorialId, stepOrder: 1, title: 'Step 1', content: 'First' });

      // Simulate concurrent operations
      const operations = [
        addStep({ tutorialId, stepOrder: 2, title: 'Step 2A', content: 'Concurrent A' }),
        addStep({ tutorialId, stepOrder: 2, title: 'Step 2B', content: 'Concurrent B' }),
        addStep({ tutorialId, stepOrder: 2, title: 'Step 2C', content: 'Concurrent C' })
      ];

      // All operations should complete, with proper ordering
      await Promise.all(operations);

      const steps = await listSteps({ tutorialId });
      expect(steps.steps).toHaveLength(4);
      
      // Check that step orders are sequential
      const orders = steps.steps.map(s => s.step_order).sort((a, b) => a - b);
      expect(orders).toEqual([1, 2, 3, 4]);
    });
  });
});
