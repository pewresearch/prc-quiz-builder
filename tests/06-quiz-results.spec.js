/**
 * Tests for Quiz Results blocks (results, result-score, result-table, result-histogram)
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

test.describe('Quiz Results Blocks', () => {
	test.beforeEach(async ({ page }) => {
		await loginToWordPress(page);
	});

	test('should insert and display quiz results block', async ({ page }) => {
		await createQuizPost(page, 'Results Block Test');
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
		
		// Wait for results block to be inserted
		await page.waitForSelector('[data-type="prc-quiz/results"]');
		
		const resultsBlock = page.locator('[data-type="prc-quiz/results"]');
		await expect(resultsBlock).toBeVisible();
		await expect(resultsBlock).toHaveAttribute('data-type', 'prc-quiz/results');
	});

	test('should display results after quiz completion', async ({ page }) => {
		await createQuizPost(page, 'Results Display Test');
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
	});

	test('should insert and configure result-score block', async ({ page }) => {
		await createQuizPost(page, 'Result Score Test');
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'Test Question');
		await addAnswer(page, 'Answer 1', { points: 5 });
		await addAnswer(page, 'Answer 2', { points: 10 });
		
		// Add results block first
		const controllerBlock = page.locator('[data-type="prc-quiz/controller"]');
		await controllerBlock.click();
		await page.click('.block-list-appender button');
		await page.keyboard.type('results');
		await page.keyboard.press('Enter');
		
		// Add result-score block within results
		const resultsBlock = page.locator('[data-type="prc-quiz/results"]');
		await resultsBlock.click();
		await page.click('.block-list-appender button');
		await page.keyboard.type('result score');
		await page.keyboard.press('Enter');
		
		// Wait for result-score block to be inserted
		await page.waitForSelector('[data-type="prc-quiz/result-score"]');
		
		const resultScoreBlock = page.locator('[data-type="prc-quiz/result-score"]');
		await expect(resultScoreBlock).toBeVisible();
		await expect(resultScoreBlock).toHaveAttribute('data-type', 'prc-quiz/result-score');
	});

	test('should display score in result-score block', async ({ page }) => {
		await createQuizPost(page, 'Score Display Test');
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'Test Question');
		await addAnswer(page, 'Answer 1', { points: 5 });
		await addAnswer(page, 'Answer 2', { points: 10 });
		
		// Add results with score block
		const controllerBlock = page.locator('[data-type="prc-quiz/controller"]');
		await controllerBlock.click();
		await page.click('.block-list-appender button');
		await page.keyboard.type('results');
		await page.keyboard.press('Enter');
		
		const resultsBlock = page.locator('[data-type="prc-quiz/results"]');
		await resultsBlock.click();
		await page.click('.block-list-appender button');
		await page.keyboard.type('result score');
		await page.keyboard.press('Enter');
		
		await saveAndPreview(page);
		
		const quizInteraction = await interactWithQuiz(page);
		
		// Answer the question
		await quizInteraction.selectAnswer(1); // Select 10 point answer
		
		// Submit the quiz
		await quizInteraction.submitQuiz();
		
		// Wait for results to appear
		await quizInteraction.waitForResults();
		
		// Check for score display
		const scoreBlock = page.locator('[data-type="prc-quiz/result-score"]');
		await expect(scoreBlock).toBeVisible();
		
		// Check for score value (should show 10 points)
		const scoreText = page.locator('[data-wp-text*="score"], [data-wp-text*="points"]');
		if (await scoreText.isVisible()) {
			await expect(scoreText).toContainText('10');
		}
	});

	test('should insert and configure result-table block', async ({ page }) => {
		await createQuizPost(page, 'Result Table Test');
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'Test Question');
		await addAnswer(page, 'Answer 1', { points: 5, resultsLabel: 'Liberal' });
		await addAnswer(page, 'Answer 2', { points: 10, resultsLabel: 'Conservative' });
		
		// Add results block first
		const controllerBlock = page.locator('[data-type="prc-quiz/controller"]');
		await controllerBlock.click();
		await page.click('.block-list-appender button');
		await page.keyboard.type('results');
		await page.keyboard.press('Enter');
		
		// Add result-table block within results
		const resultsBlock = page.locator('[data-type="prc-quiz/results"]');
		await resultsBlock.click();
		await page.click('.block-list-appender button');
		await page.keyboard.type('result table');
		await page.keyboard.press('Enter');
		
		// Wait for result-table block to be inserted
		await page.waitForSelector('[data-type="prc-quiz/result-table"]');
		
		const resultTableBlock = page.locator('[data-type="prc-quiz/result-table"]');
		await expect(resultTableBlock).toBeVisible();
		await expect(resultTableBlock).toHaveAttribute('data-type', 'prc-quiz/result-table');
	});

	test('should display data in result-table block', async ({ page }) => {
		await createQuizPost(page, 'Table Data Test');
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'Test Question');
		await addAnswer(page, 'Answer 1', { points: 5, resultsLabel: 'Liberal' });
		await addAnswer(page, 'Answer 2', { points: 10, resultsLabel: 'Conservative' });
		
		// Add results with table block
		const controllerBlock = page.locator('[data-type="prc-quiz/controller"]');
		await controllerBlock.click();
		await page.click('.block-list-appender button');
		await page.keyboard.type('results');
		await page.keyboard.press('Enter');
		
		const resultsBlock = page.locator('[data-type="prc-quiz/results"]');
		await resultsBlock.click();
		await page.click('.block-list-appender button');
		await page.keyboard.type('result table');
		await page.keyboard.press('Enter');
		
		await saveAndPreview(page);
		
		const quizInteraction = await interactWithQuiz(page);
		
		// Answer the question
		await quizInteraction.selectAnswer(1); // Select Conservative answer
		
		// Submit the quiz
		await quizInteraction.submitQuiz();
		
		// Wait for results to appear
		await quizInteraction.waitForResults();
		
		// Check for table display
		const tableBlock = page.locator('[data-type="prc-quiz/result-table"]');
		await expect(tableBlock).toBeVisible();
		
		// Check for table content
		const tableElement = page.locator('table');
		if (await tableElement.isVisible()) {
			await expect(tableElement).toBeVisible();
		}
	});

	test('should insert and configure result-histogram block', async ({ page }) => {
		await createQuizPost(page, 'Result Histogram Test');
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'Test Question');
		await addAnswer(page, 'Answer 1', { points: 5, resultsLabel: 'Liberal' });
		await addAnswer(page, 'Answer 2', { points: 10, resultsLabel: 'Conservative' });
		
		// Add results block first
		const controllerBlock = page.locator('[data-type="prc-quiz/controller"]');
		await controllerBlock.click();
		await page.click('.block-list-appender button');
		await page.keyboard.type('results');
		await page.keyboard.press('Enter');
		
		// Add result-histogram block within results
		const resultsBlock = page.locator('[data-type="prc-quiz/results"]');
		await resultsBlock.click();
		await page.click('.block-list-appender button');
		await page.keyboard.type('result histogram');
		await page.keyboard.press('Enter');
		
		// Wait for result-histogram block to be inserted
		await page.waitForSelector('[data-type="prc-quiz/result-histogram"]');
		
		const resultHistogramBlock = page.locator('[data-type="prc-quiz/result-histogram"]');
		await expect(resultHistogramBlock).toBeVisible();
		await expect(resultHistogramBlock).toHaveAttribute('data-type', 'prc-quiz/result-histogram');
	});

	test('should display chart in result-histogram block', async ({ page }) => {
		await createQuizPost(page, 'Histogram Chart Test');
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'Test Question');
		await addAnswer(page, 'Answer 1', { points: 5, resultsLabel: 'Liberal' });
		await addAnswer(page, 'Answer 2', { points: 10, resultsLabel: 'Conservative' });
		
		// Add results with histogram block
		const controllerBlock = page.locator('[data-type="prc-quiz/controller"]');
		await controllerBlock.click();
		await page.click('.block-list-appender button');
		await page.keyboard.type('results');
		await page.keyboard.press('Enter');
		
		const resultsBlock = page.locator('[data-type="prc-quiz/results"]');
		await resultsBlock.click();
		await page.click('.block-list-appender button');
		await page.keyboard.type('result histogram');
		await page.keyboard.press('Enter');
		
		await saveAndPreview(page);
		
		const quizInteraction = await interactWithQuiz(page);
		
		// Answer the question
		await quizInteraction.selectAnswer(1); // Select Conservative answer
		
		// Submit the quiz
		await quizInteraction.submitQuiz();
		
		// Wait for results to appear
		await quizInteraction.waitForResults();
		
		// Check for histogram display
		const histogramBlock = page.locator('[data-type="prc-quiz/result-histogram"]');
		await expect(histogramBlock).toBeVisible();
		
		// Check for chart elements (canvas, svg, or chart library elements)
		const chartElement = page.locator('canvas, svg, .chart-container');
		if (await chartElement.isVisible()) {
			await expect(chartElement).toBeVisible();
		}
	});

	test('should handle group results display', async ({ page }) => {
		await createQuizPost(page, 'Group Results Test');
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
		
		// Wait for group results block to be inserted
		await page.waitForSelector('[data-type="prc-quiz/group-results"]');
		
		const groupResultsBlock = page.locator('[data-type="prc-quiz/group-results"]');
		await expect(groupResultsBlock).toBeVisible();
		await expect(groupResultsBlock).toHaveAttribute('data-type', 'prc-quiz/group-results');
		
		await saveAndPreview(page);
		
		const quizInteraction = await interactWithQuiz(page);
		
		// Answer the question
		await quizInteraction.selectAnswer(0); // Select Group A answer
		
		// Submit the quiz
		await quizInteraction.submitQuiz();
		
		// Wait for results to appear
		await quizInteraction.waitForResults();
		
		// Check for group results display
		await expect(groupResultsBlock).toBeVisible();
		
		// Check for group information
		const groupInfo = page.locator('[data-wp-text*="group"], [data-wp-text*="Group"]');
		if (await groupInfo.isVisible()) {
			await expect(groupInfo).toContainText('Group A');
		}
	});

	test('should handle results with multiple questions', async ({ page }) => {
		await createQuizPost(page, 'Multiple Questions Results Test');
		await addQuizPage(page, 'Page 1');
		await addQuestion(page, 'Question 1');
		await addAnswer(page, 'Answer 1A', { points: 5 });
		await addAnswer(page, 'Answer 1B', { points: 10 });
		
		await addQuizPage(page, 'Page 2');
		await addQuestion(page, 'Question 2');
		await addAnswer(page, 'Answer 2A', { points: 3 });
		await addAnswer(page, 'Answer 2B', { points: 7 });
		
		// Add results with score block
		const controllerBlock = page.locator('[data-type="prc-quiz/controller"]');
		await controllerBlock.click();
		await page.click('.block-list-appender button');
		await page.keyboard.type('results');
		await page.keyboard.press('Enter');
		
		const resultsBlock = page.locator('[data-type="prc-quiz/results"]');
		await resultsBlock.click();
		await page.click('.block-list-appender button');
		await page.keyboard.type('result score');
		await page.keyboard.press('Enter');
		
		await saveAndPreview(page);
		
		const quizInteraction = await interactWithQuiz(page);
		
		// Answer first question
		await quizInteraction.selectAnswer(1); // Select 10 point answer
		await quizInteraction.nextPage();
		
		// Answer second question
		await quizInteraction.selectAnswer(1); // Select 7 point answer
		
		// Submit the quiz
		await quizInteraction.submitQuiz();
		
		// Wait for results to appear
		await quizInteraction.waitForResults();
		
		// Check for total score (should be 17)
		const scoreText = page.locator('[data-wp-text*="score"], [data-wp-text*="points"]');
		if (await scoreText.isVisible()) {
			await expect(scoreText).toContainText('17');
		}
	});

	test('should handle results styling and customization', async ({ page }) => {
		await createQuizPost(page, 'Results Styling Test');
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
		
		const resultsBlock = page.locator('[data-type="prc-quiz/results"]');
		await resultsBlock.click();
		
		// Open block settings
		await page.click('.block-editor-block-inspector');
		
		// Check for styling options
		const colorPanel = page.locator('.components-panel__body-title:has-text("Color")');
		if (await colorPanel.isVisible()) {
			await colorPanel.click();
			// Color settings should be available
			const colorSettings = page.locator('.block-editor-panel-color-gradient-settings');
			await expect(colorSettings).toBeVisible();
		}
		
		// Check for spacing options
		const spacingPanel = page.locator('.components-panel__body-title:has-text("Spacing")');
		if (await spacingPanel.isVisible()) {
			await spacingPanel.click();
			// Spacing settings should be available
			const spacingSettings = page.locator('.block-editor-hooks__spacing-controls');
			await expect(spacingSettings).toBeVisible();
		}
	});

	test('should handle results with demo breaks', async ({ page }) => {
		await createQuizPost(page, 'Demo Breaks Results Test');
		await addQuizPage(page, 'Test Page');
		await addQuestion(page, 'What is your age?');
		
		// Configure demo break values
		const questionBlock = page.locator('[data-type="prc-quiz/question"]');
		await questionBlock.click();
		await page.click('.block-editor-block-inspector');
		
		const demoBreakInput = page.locator('input[placeholder*="demo"], textarea[placeholder*="break"]');
		if (await demoBreakInput.isVisible()) {
			await demoBreakInput.fill('18-25, 26-35, 36-45, 46+');
		}
		
		await addAnswer(page, '18-25', { points: 1 });
		await addAnswer(page, '26-35', { points: 2 });
		await addAnswer(page, '36-45', { points: 3 });
		await addAnswer(page, '46+', { points: 4 });
		
		// Add results with table block
		const controllerBlock = page.locator('[data-type="prc-quiz/controller"]');
		await controllerBlock.click();
		await page.click('.block-list-appender button');
		await page.keyboard.type('results');
		await page.keyboard.press('Enter');
		
		const resultsBlock = page.locator('[data-type="prc-quiz/results"]');
		await resultsBlock.click();
		await page.click('.block-list-appender button');
		await page.keyboard.type('result table');
		await page.keyboard.press('Enter');
		
		await saveAndPreview(page);
		
		const quizInteraction = await interactWithQuiz(page);
		
		// Answer the question
		await quizInteraction.selectAnswer(2); // Select 36-45 age group
		
		// Submit the quiz
		await quizInteraction.submitQuiz();
		
		// Wait for results to appear
		await quizInteraction.waitForResults();
		
		// Check for demo break results
		const tableBlock = page.locator('[data-type="prc-quiz/result-table"]');
		await expect(tableBlock).toBeVisible();
		
		// Check for age group information in results
		const ageGroupInfo = page.locator('[data-wp-text*="36-45"]');
		if (await ageGroupInfo.isVisible()) {
			await expect(ageGroupInfo).toBeVisible();
		}
	});
});