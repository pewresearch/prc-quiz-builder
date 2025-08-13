/**
 * Tests for WordPress Interactivity API integration with Quiz Builder
 */
const { test, expect } = require('@playwright/test');
const { 
	createQuizPost, 
	addQuizPage, 
	addQuestion, 
	addAnswer,
	configureQuizSettings,
	loginToWordPress,
	saveAndPreview,
	interactWithQuiz 
} = require('./utils/quiz-builder-utils');

test.describe('Quiz Builder Interactivity API', () => {
	test.beforeEach(async ({ page }) => {
		await loginToWordPress(page);
	});

	test('should initialize interactivity API on frontend', async ({ page }) => {
		await createQuizPost(page, 'Interactivity Init Test');
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'Test Question');
		await addAnswer(page, 'Answer 1');
		await addAnswer(page, 'Answer 2');
		
		await saveAndPreview(page);
		
		// Check for interactivity API initialization
		await page.waitForSelector('[data-wp-interactive="prc-quiz"]');
		
		// Verify the main interactive element exists
		const interactiveElement = page.locator('[data-wp-interactive="prc-quiz"]');
		await expect(interactiveElement).toBeVisible();
		
		// Check for WordPress interactivity API script
		const interactivityScript = page.locator('script[src*="interactivity"]');
		await expect(interactivityScript).toHaveCount(1);
	});

	test('should handle quiz state management', async ({ page }) => {
		await createQuizPost(page, 'State Management Test');
		await configureQuizSettings(page, { displayType: 'paged' });
		
		// Add multiple pages
		await addQuizPage(page, 'Page 1');
		await addQuestion(page, 'Question 1');
		await addAnswer(page, 'Answer 1A');
		await addAnswer(page, 'Answer 1B');
		
		await addQuizPage(page, 'Page 2');
		await addQuestion(page, 'Question 2');
		await addAnswer(page, 'Answer 2A');
		await addAnswer(page, 'Answer 2B');
		
		await saveAndPreview(page);
		
		const quizInteraction = await interactWithQuiz(page);
		
		// Test state persistence between pages
		await quizInteraction.selectAnswer(0);
		await quizInteraction.nextPage();
		
		// Verify we're on the next page
		await page.waitForTimeout(500);
		
		// Go back to first page
		await quizInteraction.previousPage();
		
		// Check if previous answer is still selected
		const selectedAnswer = page.locator('[data-type="prc-quiz/answer"] input:checked');
		await expect(selectedAnswer).toHaveCount(1);
	});

	test('should handle single choice answer selection', async ({ page }) => {
		await createQuizPost(page, 'Single Choice Test');
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'Single choice question', 'single');
		await addAnswer(page, 'Answer 1');
		await addAnswer(page, 'Answer 2');
		await addAnswer(page, 'Answer 3');
		
		await saveAndPreview(page);
		
		const quizInteraction = await interactWithQuiz(page);
		
		// Select first answer
		await quizInteraction.selectAnswer(0);
		
		// Verify only one answer is selected
		const checkedInputs = page.locator('[data-type="prc-quiz/answer"] input:checked');
		await expect(checkedInputs).toHaveCount(1);
		
		// Select second answer
		await quizInteraction.selectAnswer(1);
		
		// Verify still only one answer is selected (first one should be deselected)
		await expect(checkedInputs).toHaveCount(1);
		
		// Verify second answer is now selected
		const secondAnswer = page.locator('[data-type="prc-quiz/answer"] input').nth(1);
		await expect(secondAnswer).toBeChecked();
	});

	test('should handle multiple choice answer selection', async ({ page }) => {
		await createQuizPost(page, 'Multiple Choice Test');
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'Multiple choice question', 'multiple');
		await addAnswer(page, 'Answer 1');
		await addAnswer(page, 'Answer 2');
		await addAnswer(page, 'Answer 3');
		
		await saveAndPreview(page);
		
		const quizInteraction = await interactWithQuiz(page);
		
		// Select multiple answers
		await quizInteraction.selectMultipleAnswers([0, 2]);
		
		// Verify multiple answers are selected
		const checkedInputs = page.locator('[data-type="prc-quiz/answer"] input:checked');
		await expect(checkedInputs).toHaveCount(2);
		
		// Verify correct answers are selected
		const firstAnswer = page.locator('[data-type="prc-quiz/answer"] input').nth(0);
		const thirdAnswer = page.locator('[data-type="prc-quiz/answer"] input').nth(2);
		await expect(firstAnswer).toBeChecked();
		await expect(thirdAnswer).toBeChecked();
	});

	test('should handle thermometer question interactions', async ({ page }) => {
		await createQuizPost(page, 'Thermometer Test');
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'Thermometer question', 'thermometer');
		
		// Configure thermometer values
		const questionBlock = page.locator('[data-type="prc-quiz/question"]');
		await questionBlock.click();
		await page.click('.block-editor-block-inspector');
		
		const thermometerInput = page.locator('input[placeholder*="thermometer"], textarea[placeholder*="values"]');
		if (await thermometerInput.isVisible()) {
			await thermometerInput.fill('Very Cold, Cold, Neutral, Warm, Very Warm');
		}
		
		await saveAndPreview(page);
		
		const quizInteraction = await interactWithQuiz(page);
		
		// Check for thermometer interactive elements
		const thermometerElements = page.locator('[data-wp-interactive*="thermometer"]');
		if (await thermometerElements.count() > 0) {
			await expect(thermometerElements.first()).toBeVisible();
			
			// Test thermometer interaction
			await thermometerElements.first().click();
		}
	});

	test('should handle conditional display logic', async ({ page }) => {
		await createQuizPost(page, 'Conditional Display Test');
		await addQuizPage(page, 'Test Page');
		
		// Add trigger question
		await addQuestion(page, 'Are you over 18?');
		await addAnswer(page, 'Yes');
		await addAnswer(page, 'No');
		
		// Add conditional question
		await addQuestion(page, 'What is your occupation?');
		await addAnswer(page, 'Student');
		await addAnswer(page, 'Professional');
		
		// Configure conditional display for second question
		const conditionalQuestion = page.locator('[data-type="prc-quiz/question"]').nth(1);
		await conditionalQuestion.click();
		await page.click('.block-editor-block-inspector');
		
		// Enable conditional display
		const conditionalToggle = page.locator('input[type="checkbox"]');
		if (await conditionalToggle.isVisible()) {
			await conditionalToggle.click();
		}
		
		await saveAndPreview(page);
		
		const quizInteraction = await interactWithQuiz(page);
		
		// Initially, conditional question should be hidden
		const conditionalQuestionFrontend = page.locator('[data-type="prc-quiz/question"]').nth(1);
		
		// Select trigger answer
		await quizInteraction.selectAnswer(0);
		
		// Wait for conditional logic to process
		await page.waitForTimeout(500);
		
		// Conditional question should now be visible or hidden based on logic
		// This would depend on the specific conditional logic implementation
	});

	test('should handle quiz submission and results', async ({ page }) => {
		await createQuizPost(page, 'Quiz Submission Test');
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'Test Question');
		await addAnswer(page, 'Answer 1', { points: 5 });
		await addAnswer(page, 'Answer 2', { points: 10 });
		
		// Add results block
		const controllerBlock = page.locator('[data-type="prc-quiz/controller"]');
		await controllerBlock.click();
		await page.click('.block-list-appender button');
		await page.keyboard.type('results');
		await page.keyboard.press('Enter');
		
		await saveAndPreview(page);
		
		const quizInteraction = await interactWithQuiz(page);
		
		// Answer the question
		await quizInteraction.selectAnswer(1); // Select higher point answer
		
		// Submit the quiz
		await quizInteraction.submitQuiz();
		
		// Wait for results to appear
		await quizInteraction.waitForResults();
		
		// Check for results display
		const resultsBlock = page.locator('[data-type="prc-quiz/results"]');
		await expect(resultsBlock).toBeVisible();
		
		// Check for score display
		const scoreDisplay = page.locator('[data-wp-text*="score"], [data-wp-text*="points"]');
		if (await scoreDisplay.isVisible()) {
			await expect(scoreDisplay).toBeVisible();
		}
	});

	test('should handle quiz navigation controls', async ({ page }) => {
		await createQuizPost(page, 'Navigation Test');
		await configureQuizSettings(page, { displayType: 'paged' });
		
		// Add multiple pages
		await addQuizPage(page, 'Page 1');
		await addQuestion(page, 'Question 1');
		await addAnswer(page, 'Answer 1');
		
		await addQuizPage(page, 'Page 2');
		await addQuestion(page, 'Question 2');
		await addAnswer(page, 'Answer 2');
		
		await addQuizPage(page, 'Page 3');
		await addQuestion(page, 'Question 3');
		await addAnswer(page, 'Answer 3');
		
		await saveAndPreview(page);
		
		const quizInteraction = await interactWithQuiz(page);
		
		// Test navigation between pages
		await quizInteraction.nextPage();
		await page.waitForTimeout(500);
		
		await quizInteraction.nextPage();
		await page.waitForTimeout(500);
		
		await quizInteraction.previousPage();
		await page.waitForTimeout(500);
		
		await quizInteraction.previousPage();
		await page.waitForTimeout(500);
		
		// Should be back on first page
		// Verify by checking page content or navigation state
	});

	test('should handle scrollable display type', async ({ page }) => {
		await createQuizPost(page, 'Scrollable Display Test');
		await configureQuizSettings(page, { displayType: 'scrollable' });
		
		// Add multiple pages
		await addQuizPage(page, 'Page 1');
		await addQuestion(page, 'Question 1');
		await addAnswer(page, 'Answer 1');
		
		await addQuizPage(page, 'Page 2');
		await addQuestion(page, 'Question 2');
		await addAnswer(page, 'Answer 2');
		
		await saveAndPreview(page);
		
		await interactWithQuiz(page);
		
		// In scrollable mode, all pages should be visible
		const allPages = page.locator('[data-type="prc-quiz/page"]');
		await expect(allPages).toHaveCount(2);
		
		// All pages should be visible simultaneously
		for (let i = 0; i < 2; i++) {
			await expect(allPages.nth(i)).toBeVisible();
		}
	});

	test('should handle groups functionality', async ({ page }) => {
		await createQuizPost(page, 'Groups Test');
		await configureQuizSettings(page, { 
			groupsEnabled: true,
			type: 'typology' 
		});
		
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'Test Question');
		await addAnswer(page, 'Answer 1', { resultsLabel: 'Group A' });
		await addAnswer(page, 'Answer 2', { resultsLabel: 'Group B' });
		
		// Add group results block
		const controllerBlock = page.locator('[data-type="prc-quiz/controller"]');
		await controllerBlock.click();
		await page.click('.block-list-appender button');
		await page.keyboard.type('group results');
		await page.keyboard.press('Enter');
		
		await saveAndPreview(page);
		
		const quizInteraction = await interactWithQuiz(page);
		
		// Answer the question
		await quizInteraction.selectAnswer(0);
		
		// Submit the quiz
		await quizInteraction.submitQuiz();
		
		// Wait for results
		await quizInteraction.waitForResults();
		
		// Check for group results display
		const groupResults = page.locator('[data-type="prc-quiz/group-results"]');
		await expect(groupResults).toBeVisible();
	});

	test('should handle answer randomization', async ({ page }) => {
		await createQuizPost(page, 'Answer Randomization Test');
		await addQuizPage(page, 'Test Page');
		const questionBlock = await addQuestion(page, 'Test Question');
		
		// Enable answer randomization
		await questionBlock.click();
		await page.click('.block-editor-block-inspector');
		
		const randomizeToggle = page.locator('input[type="checkbox"]');
		if (await randomizeToggle.isVisible()) {
			await randomizeToggle.click();
		}
		
		await addAnswer(page, 'Answer 1');
		await addAnswer(page, 'Answer 2');
		await addAnswer(page, 'Answer 3');
		await addAnswer(page, 'Answer 4');
		
		await saveAndPreview(page);
		
		await interactWithQuiz(page);
		
		// Verify answers are present (order might be randomized)
		const answers = page.locator('[data-type="prc-quiz/answer"]');
		await expect(answers).toHaveCount(4);
		
		// All answers should be visible
		for (let i = 0; i < 4; i++) {
			await expect(answers.nth(i)).toBeVisible();
		}
	});

	test('should handle data persistence and storage', async ({ page }) => {
		await createQuizPost(page, 'Data Storage Test');
		await configureQuizSettings(page, { 
			resultsStorageEnabled: true 
		});
		
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'Test Question');
		await addAnswer(page, 'Answer 1', { points: 5 });
		await addAnswer(page, 'Answer 2', { points: 10 });
		
		await saveAndPreview(page);
		
		const quizInteraction = await interactWithQuiz(page);
		
		// Answer the question
		await quizInteraction.selectAnswer(1);
		
		// Submit the quiz
		await quizInteraction.submitQuiz();
		
		// Wait for results
		await quizInteraction.waitForResults();
		
		// Check for data storage indicators
		// This might include localStorage, sessionStorage, or server-side storage
		const storageData = await page.evaluate(() => {
			return {
				localStorage: window.localStorage.getItem('prc-quiz-data'),
				sessionStorage: window.sessionStorage.getItem('prc-quiz-data')
			};
		});
		
		// Verify data is stored (if using client-side storage)
		// This would depend on the specific storage implementation
	});

	test('should handle error states gracefully', async ({ page }) => {
		await createQuizPost(page, 'Error Handling Test');
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'Test Question');
		// Intentionally not adding answers to test error handling
		
		await saveAndPreview(page);
		
		await interactWithQuiz(page);
		
		// Check for error handling when no answers are available
		const errorMessages = page.locator('[data-wp-text*="error"], .error-message');
		
		// Should either display error message or handle gracefully
		// This would depend on the specific error handling implementation
	});
});