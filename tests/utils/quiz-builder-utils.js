/**
 * Utilities for testing PRC Quiz Builder blocks
 */

const { expect } = require('@playwright/test');

/**
 * Create a new post with quiz builder blocks
 * @param {import('@playwright/test').Page} page 
 * @param {string} title - Post title
 * @param {Object} options - Configuration options
 */
async function createQuizPost(page, title = 'Test Quiz', options = {}) {
	await page.goto('/wp-admin/post-new.php');
	
	// Wait for the editor to load
	await page.waitForSelector('.edit-post-visual-editor');
	
	// Set the post title
	await page.fill('.wp-block-post-title', title);
	
	// Insert Quiz Controller block
	await page.click('.block-editor-default-block-appender__content');
	await page.keyboard.type('/quiz controller');
	await page.keyboard.press('Enter');
	
	// Wait for the Quiz Controller block to be inserted
	await page.waitForSelector('[data-type="prc-quiz/controller"]');
	
	return page.locator('[data-type="prc-quiz/controller"]');
}

/**
 * Add a quiz page to the controller
 * @param {import('@playwright/test').Page} page
 * @param {string} pageTitle - Title for the quiz page
 */
async function addQuizPage(page, pageTitle = 'Quiz Page') {
	// Click the Quiz Controller block to select it
	await page.click('[data-type="prc-quiz/controller"]');
	
	// Look for the appender or add page button
	await page.click('.block-list-appender button, [aria-label="Add block"]');
	
	// Search for and insert Quiz Page block
	await page.keyboard.type('quiz page');
	await page.keyboard.press('Enter');
	
	// Wait for the page block to be inserted
	await page.waitForSelector('[data-type="prc-quiz/page"]');
	
	// Set the page title if provided
	if (pageTitle) {
		const pageBlock = page.locator('[data-type="prc-quiz/page"]').last();
		await pageBlock.click();
		
		// Find and fill the page title input
		const titleInput = pageBlock.locator('input[placeholder*="title"], input[placeholder*="Title"]');
		if (await titleInput.isVisible()) {
			await titleInput.fill(pageTitle);
		}
	}
	
	return page.locator('[data-type="prc-quiz/page"]').last();
}

/**
 * Add a question to a quiz page
 * @param {import('@playwright/test').Page} page
 * @param {string} questionText - The question text
 * @param {string} questionType - Type of question ('single', 'multiple', 'thermometer')
 */
async function addQuestion(page, questionText, questionType = 'single') {
	// Find the last quiz page block
	const pageBlock = page.locator('[data-type="prc-quiz/page"]').last();
	await pageBlock.click();
	
	// Add question block
	await pageBlock.locator('.block-list-appender button, [aria-label="Add block"]').click();
	await page.keyboard.type('question');
	await page.keyboard.press('Enter');
	
	// Wait for question block to be inserted
	await page.waitForSelector('[data-type="prc-quiz/question"]');
	
	const questionBlock = page.locator('[data-type="prc-quiz/question"]').last();
	
	// Set question text
	if (questionText) {
		await questionBlock.click();
		const textInput = questionBlock.locator('input[placeholder*="question"], textarea[placeholder*="question"]');
		if (await textInput.isVisible()) {
			await textInput.fill(questionText);
		}
	}
	
	// Set question type if not single
	if (questionType !== 'single') {
		await questionBlock.click();
		// Look for question type selector in the sidebar
		await page.click('[data-label="Question Type"], [aria-label="Question Type"]');
		await page.click(`[value="${questionType}"]`);
	}
	
	return questionBlock;
}

/**
 * Add an answer to a question
 * @param {import('@playwright/test').Page} page
 * @param {string} answerText - The answer text
 * @param {Object} options - Answer options (correct, points, etc.)
 */
async function addAnswer(page, answerText, options = {}) {
	const { correct = false, points = 0, resultsLabel = '' } = options;
	
	// Find the last question block
	const questionBlock = page.locator('[data-type="prc-quiz/question"]').last();
	await questionBlock.click();
	
	// Add answer block
	await questionBlock.locator('.block-list-appender button, [aria-label="Add block"]').click();
	await page.keyboard.type('answer');
	await page.keyboard.press('Enter');
	
	// Wait for answer block to be inserted
	await page.waitForSelector('[data-type="prc-quiz/answer"]');
	
	const answerBlock = page.locator('[data-type="prc-quiz/answer"]').last();
	
	// Set answer text
	if (answerText) {
		await answerBlock.click();
		const textInput = answerBlock.locator('input[placeholder*="answer"], textarea[placeholder*="answer"]');
		if (await textInput.isVisible()) {
			await textInput.fill(answerText);
		}
	}
	
	// Set answer properties
	if (correct) {
		await answerBlock.click();
		const correctToggle = page.locator('[data-label="Correct Answer"], [aria-label="Correct Answer"]');
		if (await correctToggle.isVisible()) {
			await correctToggle.click();
		}
	}
	
	if (points !== 0) {
		await answerBlock.click();
		const pointsInput = page.locator('input[placeholder*="points"], input[type="number"]');
		if (await pointsInput.isVisible()) {
			await pointsInput.fill(points.toString());
		}
	}
	
	if (resultsLabel) {
		await answerBlock.click();
		const resultsLabelInput = page.locator('input[placeholder*="results"], input[placeholder*="label"]');
		if (await resultsLabelInput.isVisible()) {
			await resultsLabelInput.fill(resultsLabel);
		}
	}
	
	return answerBlock;
}

/**
 * Configure quiz controller settings
 * @param {import('@playwright/test').Page} page
 * @param {Object} settings - Quiz settings
 */
async function configureQuizSettings(page, settings = {}) {
	const {
		type = 'quiz',
		displayType = 'paged',
		groupsEnabled = false,
		resultsStorageEnabled = true,
		threshold = 4
	} = settings;
	
	// Select the quiz controller block
	await page.click('[data-type="prc-quiz/controller"]');
	
	// Open block settings in sidebar
	await page.click('.block-editor-block-inspector');
	
	// Set quiz type
	if (type !== 'quiz') {
		const typeSelector = page.locator('[data-label="Quiz Type"], select[id*="type"]');
		if (await typeSelector.isVisible()) {
			await typeSelector.selectOption(type);
		}
	}
	
	// Set display type
	if (displayType !== 'paged') {
		const displayTypeSelector = page.locator('[data-label="Display Type"], select[id*="display"]');
		if (await displayTypeSelector.isVisible()) {
			await displayTypeSelector.selectOption(displayType);
		}
	}
	
	// Configure other settings
	const groupsToggle = page.locator('[data-label="Groups Enabled"], input[type="checkbox"]');
	if (await groupsToggle.isVisible()) {
		const isChecked = await groupsToggle.isChecked();
		if (isChecked !== groupsEnabled) {
			await groupsToggle.click();
		}
	}
	
	const resultsToggle = page.locator('[data-label="Results Storage"], input[type="checkbox"]');
	if (await resultsToggle.isVisible()) {
		const isChecked = await resultsToggle.isChecked();
		if (isChecked !== resultsStorageEnabled) {
			await resultsToggle.click();
		}
	}
	
	if (threshold !== 4) {
		const thresholdInput = page.locator('input[placeholder*="threshold"], input[type="number"]');
		if (await thresholdInput.isVisible()) {
			await thresholdInput.fill(threshold.toString());
		}
	}
}

/**
 * Save and preview the quiz post
 * @param {import('@playwright/test').Page} page
 */
async function saveAndPreview(page) {
	// Save the post
	await page.keyboard.press('Meta+S'); // Cmd+S on Mac, Ctrl+S on Windows/Linux
	await page.waitForSelector('.editor-post-save-draft, .editor-post-publish-button');
	
	// Wait for save to complete
	await page.waitForFunction(() => {
		const saveButton = document.querySelector('.editor-post-save-draft, .editor-post-publish-button');
		return !saveButton?.classList.contains('is-busy');
	});
	
	// Click preview button
	await page.click('.editor-post-preview');
	
	// Wait for preview to load
	await page.waitForLoadState('networkidle');
}

/**
 * Interact with quiz on frontend
 * @param {import('@playwright/test').Page} page
 */
async function interactWithQuiz(page) {
	// Wait for quiz to load
	await page.waitForSelector('[data-wp-interactive="prc-quiz"]');
	
	// Start quiz if start button is present
	const startButton = page.locator('button:has-text("Start")');
	if (await startButton.isVisible()) {
		await startButton.click();
	}
	
	// Wait for first question to appear
	await page.waitForSelector('[data-type="prc-quiz/question"]');
	
	return {
		selectAnswer: async (answerIndex = 0) => {
			const answers = page.locator('[data-type="prc-quiz/answer"] input[type="radio"], [data-type="prc-quiz/answer"] input[type="checkbox"]');
			await answers.nth(answerIndex).click();
		},
		
		selectMultipleAnswers: async (answerIndices = []) => {
			for (const index of answerIndices) {
				const answer = page.locator('[data-type="prc-quiz/answer"] input[type="checkbox"]').nth(index);
				await answer.click();
			}
		},
		
		nextPage: async () => {
			const nextButton = page.locator('button:has-text("Next")');
			await nextButton.click();
		},
		
		previousPage: async () => {
			const prevButton = page.locator('button:has-text("Previous")');
			await prevButton.click();
		},
		
		submitQuiz: async () => {
			const submitButton = page.locator('button:has-text("Submit")');
			await submitButton.click();
		},
		
		waitForResults: async () => {
			await page.waitForSelector('[data-type="prc-quiz/results"]');
		}
	};
}

/**
 * Login to WordPress admin
 * @param {import('@playwright/test').Page} page
 * @param {string} username
 * @param {string} password
 */
async function loginToWordPress(page, username = 'admin', password = 'password') {
	await page.goto('/wp-admin/');
	
	// Check if already logged in
	if (page.url().includes('wp-admin') && !page.url().includes('wp-login')) {
		return;
	}
	
	// Login
	await page.fill('#user_login', username);
	await page.fill('#user_pass', password);
	await page.click('#wp-submit');
	
	// Wait for dashboard to load
	await page.waitForURL('**/wp-admin/**');
}

module.exports = {
	createQuizPost,
	addQuizPage,
	addQuestion,
	addAnswer,
	configureQuizSettings,
	saveAndPreview,
	interactWithQuiz,
	loginToWordPress
};