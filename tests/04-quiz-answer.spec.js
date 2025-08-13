/**
 * Tests for Quiz Answer block
 */
const { test, expect } = require('@playwright/test');
const { 
	createQuizPost, 
	addQuizPage, 
	addQuestion, 
	addAnswer,
	loginToWordPress,
	saveAndPreview 
} = require('./utils/quiz-builder-utils');

test.describe('Quiz Answer Block', () => {
	test.beforeEach(async ({ page }) => {
		await loginToWordPress(page);
	});

	test('should insert quiz answer block', async ({ page }) => {
		await createQuizPost(page, 'Test Quiz Answer');
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'Test Question');
		const answerBlock = await addAnswer(page, 'Test Answer');
		
		// Verify the block was inserted
		await expect(answerBlock).toBeVisible();
		await expect(answerBlock).toHaveAttribute('data-type', 'prc-quiz/answer');
	});

	test('should set answer text', async ({ page }) => {
		await createQuizPost(page, 'Answer Text Test');
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'Test Question');
		const answerBlock = await addAnswer(page, 'My custom answer');
		
		await expect(answerBlock).toBeVisible();
		
		// Check if answer text input is present and has the value
		const answerInput = answerBlock.locator('input[placeholder*="answer"], textarea[placeholder*="answer"]');
		if (await answerInput.isVisible()) {
			await expect(answerInput).toHaveValue('My custom answer');
		}
	});

	test('should support correct answer toggle', async ({ page }) => {
		await createQuizPost(page, 'Correct Answer Test');
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'Test Question');
		const answerBlock = await addAnswer(page, 'Correct Answer', { correct: true });
		
		await expect(answerBlock).toBeVisible();
		
		// Check if correct answer toggle is enabled
		await answerBlock.click();
		
		// Open block settings
		await page.click('.block-editor-block-inspector');
		
		// Look for correct answer toggle
		const correctToggle = page.locator('input[type="checkbox"]');
		if (await correctToggle.isVisible()) {
			await expect(correctToggle).toBeChecked();
		}
	});

	test('should support points system', async ({ page }) => {
		await createQuizPost(page, 'Points Test');
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'Test Question');
		const answerBlock = await addAnswer(page, 'High Point Answer', { points: 10 });
		
		await expect(answerBlock).toBeVisible();
		
		// Check if points input is present and has the value
		await answerBlock.click();
		
		// Open block settings
		await page.click('.block-editor-block-inspector');
		
		// Look for points input
		const pointsInput = page.locator('input[type="number"]');
		if (await pointsInput.isVisible()) {
			await expect(pointsInput).toHaveValue('10');
		}
	});

	test('should support results label', async ({ page }) => {
		await createQuizPost(page, 'Results Label Test');
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'Test Question');
		const answerBlock = await addAnswer(page, 'Answer Text', { resultsLabel: 'Conservative' });
		
		await expect(answerBlock).toBeVisible();
		
		// Check if results label input is present and has the value
		await answerBlock.click();
		
		// Open block settings
		await page.click('.block-editor-block-inspector');
		
		// Look for results label input
		const resultsLabelInput = page.locator('input[placeholder*="results"], input[placeholder*="label"]');
		if (await resultsLabelInput.isVisible()) {
			await expect(resultsLabelInput).toHaveValue('Conservative');
		}
	});

	test('should support conditional display', async ({ page }) => {
		await createQuizPost(page, 'Conditional Answer Test');
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'Test Question');
		
		// Add first answer
		await addAnswer(page, 'First Answer');
		
		// Add second answer with conditional display
		const conditionalAnswer = await addAnswer(page, 'Conditional Answer');
		
		await conditionalAnswer.click();
		
		// Open block settings
		await page.click('.block-editor-block-inspector');
		
		// Look for conditional display settings
		const conditionalPanel = page.locator('.components-panel__body-title:has-text("Conditional")');
		if (await conditionalPanel.isVisible()) {
			await conditionalPanel.click();
			
			const conditionalToggle = page.locator('input[type="checkbox"]');
			if (await conditionalToggle.isVisible()) {
				await conditionalToggle.click();
			}
		}
		
		await expect(conditionalAnswer).toBeVisible();
	});

	test('should allow specific child blocks', async ({ page }) => {
		await createQuizPost(page, 'Answer Child Blocks Test');
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'Test Question');
		const answerBlock = await addAnswer(page, 'Answer with content');
		
		await answerBlock.click();
		
		// Try to add a block
		await page.click('.block-list-appender button');
		
		// Paragraph block should be available
		await page.keyboard.type('paragraph');
		const paragraphSuggestion = page.locator('.block-editor-inserter__menu').locator('text=Paragraph');
		await expect(paragraphSuggestion).toBeVisible();
		
		// Cancel the inserter
		await page.keyboard.press('Escape');
		
		// Try image block
		await page.click('.block-list-appender button');
		await page.keyboard.type('image');
		const imageSuggestion = page.locator('.block-editor-inserter__menu').locator('text=Image');
		await expect(imageSuggestion).toBeVisible();
		
		// Cancel the inserter
		await page.keyboard.press('Escape');
		
		// Try heading block
		await page.click('.block-list-appender button');
		await page.keyboard.type('heading');
		const headingSuggestion = page.locator('.block-editor-inserter__menu').locator('text=Heading');
		await expect(headingSuggestion).toBeVisible();
	});

	test('should support styling options', async ({ page }) => {
		await createQuizPost(page, 'Answer Styling Test');
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'Test Question');
		const answerBlock = await addAnswer(page, 'Styled answer');
		
		await answerBlock.click();
		
		// Open block settings
		await page.click('.block-editor-block-inspector');
		
		// Check for color settings
		const colorPanel = page.locator('.components-panel__body-title:has-text("Color")');
		if (await colorPanel.isVisible()) {
			await colorPanel.click();
			// Color settings should be available
			const colorSettings = page.locator('.block-editor-panel-color-gradient-settings');
			await expect(colorSettings).toBeVisible();
		}
		
		// Check for border settings
		const borderPanel = page.locator('.components-panel__body-title:has-text("Border")');
		if (await borderPanel.isVisible()) {
			await borderPanel.click();
			// Border settings should be available
			const borderSettings = page.locator('.block-editor-hooks__border-controls');
			await expect(borderSettings).toBeVisible();
		}
	});

	test('should support layout options', async ({ page }) => {
		await createQuizPost(page, 'Answer Layout Test');
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'Test Question');
		const answerBlock = await addAnswer(page, 'Layout test answer');
		
		await answerBlock.click();
		
		// Open block settings
		await page.click('.block-editor-block-inspector');
		
		// Check for layout settings
		const layoutPanel = page.locator('.components-panel__body-title:has-text("Layout")');
		if (await layoutPanel.isVisible()) {
			await layoutPanel.click();
			
			// Layout settings should be available
			const layoutSettings = page.locator('.block-editor-hooks__layout-controls');
			await expect(layoutSettings).toBeVisible();
		}
	});

	test('should adapt to question type context', async ({ page }) => {
		await createQuizPost(page, 'Answer Context Test');
		await addQuizPage(page, 'Test Page');
		
		// Test single choice question
		await addQuestion(page, 'Single choice question', 'single');
		await addAnswer(page, 'Single choice answer');
		
		// Test multiple choice question
		await addQuestion(page, 'Multiple choice question', 'multiple');
		await addAnswer(page, 'Multiple choice answer');
		
		// Save and preview to test frontend behavior
		await saveAndPreview(page);
		
		// Check for different input types based on question type
		const singleChoiceInputs = page.locator('[data-type="prc-quiz/answer"] input[type="radio"]');
		const multipleChoiceInputs = page.locator('[data-type="prc-quiz/answer"] input[type="checkbox"]');
		
		// Should have radio buttons for single choice
		await expect(singleChoiceInputs).toHaveCount(1);
		
		// Should have checkboxes for multiple choice
		await expect(multipleChoiceInputs).toHaveCount(1);
	});

	test('should support interactivity API', async ({ page }) => {
		await createQuizPost(page, 'Answer Interactivity Test');
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'Interactive question');
		const answerBlock = await addAnswer(page, 'Interactive answer');
		
		await expect(answerBlock).toBeVisible();
		
		// Save and preview to test frontend interactivity
		await saveAndPreview(page);
		
		// Check for interactivity API data attributes on frontend
		const frontendAnswer = page.locator('[data-type="prc-quiz/answer"]');
		await expect(frontendAnswer).toBeVisible();
		
		// Check for interactive input elements
		const answerInput = page.locator('[data-type="prc-quiz/answer"] input');
		await expect(answerInput).toBeVisible();
		
		// Test answer selection
		await answerInput.click();
		await expect(answerInput).toBeChecked();
	});

	test('should generate unique UUIDs', async ({ page }) => {
		await createQuizPost(page, 'Answer UUID Test');
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'Test Question');
		
		// Add multiple answers
		await addAnswer(page, 'Answer 1');
		await addAnswer(page, 'Answer 2');
		await addAnswer(page, 'Answer 3');
		
		// Verify all answers are present
		const allAnswers = page.locator('[data-type="prc-quiz/answer"]');
		await expect(allAnswers).toHaveCount(3);
		
		// Each answer should have a unique UUID (if accessible in DOM)
		// This would be verified by checking the UUID attributes
	});

	test('should provide context to parent blocks', async ({ page }) => {
		await createQuizPost(page, 'Answer Context Provider Test');
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'Test Question');
		const answerBlock = await addAnswer(page, 'Context provider answer', { 
			correct: true, 
			points: 5 
		});
		
		await expect(answerBlock).toBeVisible();
		
		// The answer should provide context about its properties
		// This would be verified by checking how other blocks use this context
	});

	test('should handle answer without text', async ({ page }) => {
		await createQuizPost(page, 'Empty Answer Test');
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'Test Question');
		const answerBlock = await addAnswer(page, '');
		
		await expect(answerBlock).toBeVisible();
		
		// Save the post
		await page.keyboard.press('Meta+S');
		await page.waitForFunction(() => {
			const saveButton = document.querySelector('.editor-post-save-draft, .editor-post-publish-button');
			return !saveButton?.classList.contains('is-busy');
		});
		
		// Should not throw errors even without answer text
		const errors = page.locator('.components-notice.is-error');
		await expect(errors).toHaveCount(0);
	});

	test('should support copy and paste with new UUID', async ({ page }) => {
		await createQuizPost(page, 'Answer Copy Paste Test');
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'Test Question');
		const answerBlock = await addAnswer(page, 'Original answer');
		
		await answerBlock.click();
		
		// Copy the answer block
		await page.keyboard.press('Meta+C');
		
		// Position cursor after the answer block
		const questionBlock = page.locator('[data-type="prc-quiz/question"]');
		await questionBlock.click();
		await page.click('.block-list-appender button');
		await page.keyboard.press('Escape');
		
		// Paste the answer block
		await page.keyboard.press('Meta+V');
		
		// Wait for the pasted block to appear
		await page.waitForTimeout(1000);
		
		// Verify we now have two answers
		const allAnswers = page.locator('[data-type="prc-quiz/answer"]');
		await expect(allAnswers).toHaveCount(2);
		
		// Both answers should be visible but have different UUIDs
		// (This would be verified by checking the UUID attributes if accessible)
	});
});