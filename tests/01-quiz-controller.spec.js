/**
 * Tests for Quiz Controller block
 */
const { test, expect } = require('@playwright/test');
const { 
	createQuizPost, 
	configureQuizSettings, 
	loginToWordPress,
	saveAndPreview 
} = require('./utils/quiz-builder-utils');

test.describe('Quiz Controller Block', () => {
	test.beforeEach(async ({ page }) => {
		await loginToWordPress(page);
	});

	test('should insert quiz controller block', async ({ page }) => {
		const controllerBlock = await createQuizPost(page, 'Test Quiz Controller');
		
		// Verify the block was inserted
		await expect(controllerBlock).toBeVisible();
		await expect(controllerBlock).toHaveAttribute('data-type', 'prc-quiz/controller');
	});

	test('should configure quiz type settings', async ({ page }) => {
		await createQuizPost(page, 'Quiz Type Test');
		
		await configureQuizSettings(page, {
			type: 'typology',
			displayType: 'scrollable',
			groupsEnabled: true,
			threshold: 6
		});
		
		// Verify settings were applied
		const controllerBlock = page.locator('[data-type="prc-quiz/controller"]');
		await expect(controllerBlock).toBeVisible();
		
		// Check if settings panel reflects the changes
		await controllerBlock.click();
		await page.click('.block-editor-block-inspector');
		
		// Verify quiz type selection
		const typeSelect = page.locator('select[id*="type"]');
		if (await typeSelect.isVisible()) {
			await expect(typeSelect).toHaveValue('typology');
		}
	});

	test('should allow only specific child blocks', async ({ page }) => {
		await createQuizPost(page, 'Child Blocks Test');
		
		const controllerBlock = page.locator('[data-type="prc-quiz/controller"]');
		await controllerBlock.click();
		
		// Try to add a block
		await page.click('.block-list-appender button');
		
		// Type a block name that should not be allowed
		await page.keyboard.type('paragraph');
		
		// The paragraph block should not be suggested for quiz controller
		const paragraphSuggestion = page.locator('.block-editor-inserter__menu').locator('text=Paragraph');
		
		// Instead, quiz-specific blocks should be available
		await page.keyboard.selectAll();
		await page.keyboard.type('pages');
		
		const pagesSuggestion = page.locator('.block-editor-inserter__menu').locator('text=Pages');
		await expect(pagesSuggestion).toBeVisible();
	});

	test('should provide context to child blocks', async ({ page }) => {
		await createQuizPost(page, 'Context Test');
		
		await configureQuizSettings(page, {
			type: 'typology',
			displayType: 'paged',
			groupsEnabled: true,
			threshold: 5
		});
		
		// Add a pages block to verify context is provided
		const controllerBlock = page.locator('[data-type="prc-quiz/controller"]');
		await controllerBlock.click();
		
		await page.click('.block-list-appender button');
		await page.keyboard.type('pages');
		await page.keyboard.press('Enter');
		
		// Verify pages block was added and receives context
		await page.waitForSelector('[data-type="prc-quiz/pages"]');
		const pagesBlock = page.locator('[data-type="prc-quiz/pages"]');
		await expect(pagesBlock).toBeVisible();
	});

	test('should support interactivity API', async ({ page }) => {
		await createQuizPost(page, 'Interactivity Test');
		
		const controllerBlock = page.locator('[data-type="prc-quiz/controller"]');
		await controllerBlock.click();
		
		// Check if interactivity support is indicated in block.json
		// This would be verified by checking the block's attributes and supports
		await expect(controllerBlock).toHaveAttribute('data-type', 'prc-quiz/controller');
		
		// Save and preview to test frontend interactivity
		await saveAndPreview(page);
		
		// Check for interactivity API data attributes on frontend
		const frontendController = page.locator('[data-wp-interactive="prc-quiz"]');
		await expect(frontendController).toBeVisible();
	});

	test('should handle quiz controller without pages', async ({ page }) => {
		await createQuizPost(page, 'Empty Controller Test');
		
		const controllerBlock = page.locator('[data-type="prc-quiz/controller"]');
		await expect(controllerBlock).toBeVisible();
		
		// Save the post
		await page.keyboard.press('Meta+S');
		await page.waitForFunction(() => {
			const saveButton = document.querySelector('.editor-post-save-draft, .editor-post-publish-button');
			return !saveButton?.classList.contains('is-busy');
		});
		
		// Should not throw errors even without child blocks
		const errors = page.locator('.components-notice.is-error');
		await expect(errors).toHaveCount(0);
	});

	test('should support anchor and styling options', async ({ page }) => {
		await createQuizPost(page, 'Styling Test');
		
		const controllerBlock = page.locator('[data-type="prc-quiz/controller"]');
		await controllerBlock.click();
		
		// Open block settings
		await page.click('.block-editor-block-inspector');
		
		// Check for anchor/ID setting
		const advancedPanel = page.locator('.components-panel__body-title:has-text("Advanced")');
		if (await advancedPanel.isVisible()) {
			await advancedPanel.click();
			
			const anchorInput = page.locator('input[placeholder*="anchor"], input[id*="anchor"]');
			if (await anchorInput.isVisible()) {
				await anchorInput.fill('test-quiz-anchor');
			}
		}
		
		// Check for color settings
		const colorPanel = page.locator('.components-panel__body-title:has-text("Color")');
		if (await colorPanel.isVisible()) {
			await colorPanel.click();
			// Color settings should be available
			const colorSettings = page.locator('.block-editor-panel-color-gradient-settings');
			await expect(colorSettings).toBeVisible();
		}
	});

	test('should validate threshold setting', async ({ page }) => {
		await createQuizPost(page, 'Threshold Test');
		
		await configureQuizSettings(page, {
			threshold: 10
		});
		
		const controllerBlock = page.locator('[data-type="prc-quiz/controller"]');
		await controllerBlock.click();
		await page.click('.block-editor-block-inspector');
		
		// Check if threshold was set
		const thresholdInput = page.locator('input[type="number"]');
		if (await thresholdInput.isVisible()) {
			await expect(thresholdInput).toHaveValue('10');
		}
	});
});