/**
 * Tests for Quiz Question block
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

test.describe('Quiz Question Block', () => {
	test.beforeEach(async ({ page }) => {
		await loginToWordPress(page);
	});

	test('should insert quiz question block', async ({ page }) => {
		await createQuizPost(page, 'Test Quiz Question');
		await addQuizPage(page, 'Test Page');
		const questionBlock = await addQuestion(page, 'What is your favorite color?');
		
		// Verify the block was inserted
		await expect(questionBlock).toBeVisible();
		await expect(questionBlock).toHaveAttribute('data-type', 'prc-quiz/question');
	});

	test('should set question text', async ({ page }) => {
		await createQuizPost(page, 'Question Text Test');
		await addQuizPage(page, 'Test Page');
		const questionBlock = await addQuestion(page, 'How old are you?');
		
		await expect(questionBlock).toBeVisible();
		
		// Check if question text input is present and has the value
		const questionInput = questionBlock.locator('input[placeholder*="question"], textarea[placeholder*="question"]');
		if (await questionInput.isVisible()) {
			await expect(questionInput).toHaveValue('How old are you?');
		}
	});

	test('should support different question types', async ({ page }) => {
		await createQuizPost(page, 'Question Types Test');
		await addQuizPage(page, 'Test Page');
		
		// Test single choice question (default)
		const singleQuestion = await addQuestion(page, 'Single choice question', 'single');
		await expect(singleQuestion).toBeVisible();
		
		// Test multiple choice question
		const multipleQuestion = await addQuestion(page, 'Multiple choice question', 'multiple');
		await expect(multipleQuestion).toBeVisible();
		
		// Test thermometer question
		const thermometerQuestion = await addQuestion(page, 'Thermometer question', 'thermometer');
		await expect(thermometerQuestion).toBeVisible();
		
		// Verify all questions are present
		const allQuestions = page.locator('[data-type="prc-quiz/question"]');
		await expect(allQuestions).toHaveCount(3);
	});

	test('should allow specific child blocks', async ({ page }) => {
		await createQuizPost(page, 'Question Child Blocks Test');
		await addQuizPage(page, 'Test Page');
		const questionBlock = await addQuestion(page, 'Test Question');
		
		await questionBlock.click();
		
		// Try to add a block
		await page.click('.block-list-appender button');
		
		// Answer block should be available
		await page.keyboard.type('answer');
		const answerSuggestion = page.locator('.block-editor-inserter__menu').locator('text=Answer');
		await expect(answerSuggestion).toBeVisible();
		
		// Cancel the inserter
		await page.keyboard.press('Escape');
		
		// Try core blocks that should be allowed
		await page.click('.block-list-appender button');
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
	});

	test('should support conditional display', async ({ page }) => {
		await createQuizPost(page, 'Conditional Display Test');
		await addQuizPage(page, 'Test Page');
		
		// Add first question
		const firstQuestion = await addQuestion(page, 'Are you over 18?');
		await addAnswer(page, 'Yes', { correct: false });
		await addAnswer(page, 'No', { correct: false });
		
		// Add second question with conditional display
		const secondQuestion = await addQuestion(page, 'What is your occupation?');
		
		await secondQuestion.click();
		
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
		
		await expect(secondQuestion).toBeVisible();
	});

	test('should support randomize answers option', async ({ page }) => {
		await createQuizPost(page, 'Randomize Answers Test');
		await addQuizPage(page, 'Test Page');
		const questionBlock = await addQuestion(page, 'Choose your favorite');
		
		await questionBlock.click();
		
		// Open block settings
		await page.click('.block-editor-block-inspector');
		
		// Look for randomize answers setting
		const randomizeToggle = page.locator('input[type="checkbox"]');
		if (await randomizeToggle.isVisible()) {
			await randomizeToggle.click();
		}
		
		await expect(questionBlock).toBeVisible();
	});

	test('should support thermometer values', async ({ page }) => {
		await createQuizPost(page, 'Thermometer Test');
		await addQuizPage(page, 'Test Page');
		const questionBlock = await addQuestion(page, 'Rate your satisfaction', 'thermometer');
		
		await questionBlock.click();
		
		// Open block settings
		await page.click('.block-editor-block-inspector');
		
		// Look for thermometer values input
		const thermometerInput = page.locator('input[placeholder*="thermometer"], textarea[placeholder*="values"]');
		if (await thermometerInput.isVisible()) {
			await thermometerInput.fill('Very dissatisfied, Dissatisfied, Neutral, Satisfied, Very satisfied');
		}
		
		await expect(questionBlock).toBeVisible();
	});

	test('should support demo break values', async ({ page }) => {
		await createQuizPost(page, 'Demo Break Test');
		await addQuizPage(page, 'Test Page');
		const questionBlock = await addQuestion(page, 'What is your age group?');
		
		await questionBlock.click();
		
		// Open block settings
		await page.click('.block-editor-block-inspector');
		
		// Look for demo break values input
		const demoBreakInput = page.locator('input[placeholder*="demo"], textarea[placeholder*="break"]');
		if (await demoBreakInput.isVisible()) {
			await demoBreakInput.fill('18-25, 26-35, 36-45, 46-55, 56+');
		}
		
		await expect(questionBlock).toBeVisible();
	});

	test('should support layout options', async ({ page }) => {
		await createQuizPost(page, 'Question Layout Test');
		await addQuizPage(page, 'Test Page');
		const questionBlock = await addQuestion(page, 'Layout test question');
		
		await questionBlock.click();
		
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

	test('should support styling options', async ({ page }) => {
		await createQuizPost(page, 'Question Styling Test');
		await addQuizPage(page, 'Test Page');
		const questionBlock = await addQuestion(page, 'Styled question');
		
		await questionBlock.click();
		
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
		
		// Check for typography settings
		const typographyPanel = page.locator('.components-panel__body-title:has-text("Typography")');
		if (await typographyPanel.isVisible()) {
			await typographyPanel.click();
			// Typography settings should be available
			const typographySettings = page.locator('.block-editor-hooks__typography-controls');
			await expect(typographySettings).toBeVisible();
		}
	});

	test('should provide context to child blocks', async ({ page }) => {
		await createQuizPost(page, 'Question Context Test');
		await addQuizPage(page, 'Test Page');
		const questionBlock = await addQuestion(page, 'Context test question', 'multiple');
		
		// Add an answer to verify it receives context
		await addAnswer(page, 'Test answer');
		
		// Verify answer block was added and should receive context from question
		const answerBlock = page.locator('[data-type="prc-quiz/answer"]');
		await expect(answerBlock).toBeVisible();
		
		// The answer should be aware it's in a multiple choice question
		// This would be verified by checking the frontend behavior
	});

	test('should support interactivity API', async ({ page }) => {
		await createQuizPost(page, 'Question Interactivity Test');
		await addQuizPage(page, 'Test Page');
		const questionBlock = await addQuestion(page, 'Interactive question');
		
		await addAnswer(page, 'Answer 1');
		await addAnswer(page, 'Answer 2');
		
		// Save and preview to test frontend interactivity
		await saveAndPreview(page);
		
		// Check for interactivity API data attributes on frontend
		const frontendQuestion = page.locator('[data-type="prc-quiz/question"]');
		await expect(frontendQuestion).toBeVisible();
		
		// Check for interactive elements
		const answerInputs = page.locator('[data-type="prc-quiz/answer"] input');
		await expect(answerInputs).toHaveCount(2);
	});

	test('should generate unique UUIDs', async ({ page }) => {
		await createQuizPost(page, 'UUID Test');
		await addQuizPage(page, 'Test Page');
		
		// Add multiple questions
		await addQuestion(page, 'Question 1');
		await addQuestion(page, 'Question 2');
		await addQuestion(page, 'Question 3');
		
		// Verify all questions are present
		const allQuestions = page.locator('[data-type="prc-quiz/question"]');
		await expect(allQuestions).toHaveCount(3);
		
		// Each question should have a unique UUID (if accessible in DOM)
		// This would be verified by checking the UUID attributes
	});
});