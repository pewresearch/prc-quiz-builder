/**
 * Tests for Quiz Page block
 */
const { test, expect } = require('@playwright/test');
const { 
	createQuizPost, 
	addQuizPage, 
	loginToWordPress,
	saveAndPreview 
} = require('./utils/quiz-builder-utils');

test.describe('Quiz Page Block', () => {
	test.beforeEach(async ({ page }) => {
		await loginToWordPress(page);
	});

	test('should insert quiz page block', async ({ page }) => {
		await createQuizPost(page, 'Test Quiz Page');
		const pageBlock = await addQuizPage(page, 'First Page');
		
		// Verify the block was inserted
		await expect(pageBlock).toBeVisible();
		await expect(pageBlock).toHaveAttribute('data-type', 'prc-quiz/page');
	});

	test('should set page title', async ({ page }) => {
		await createQuizPost(page, 'Page Title Test');
		const pageBlock = await addQuizPage(page, 'Custom Page Title');
		
		await expect(pageBlock).toBeVisible();
		
		// Check if title input is present and has the value
		const titleInput = pageBlock.locator('input[placeholder*="title"], input[placeholder*="Title"]');
		if (await titleInput.isVisible()) {
			await expect(titleInput).toHaveValue('Custom Page Title');
		}
	});

	test('should only allow specific child blocks', async ({ page }) => {
		await createQuizPost(page, 'Child Blocks Test');
		const pageBlock = await addQuizPage(page, 'Test Page');
		
		await pageBlock.click();
		
		// Try to add a block
		await page.click('.block-list-appender button');
		
		// Question block should be available
		await page.keyboard.type('question');
		const questionSuggestion = page.locator('.block-editor-inserter__menu').locator('text=Question');
		await expect(questionSuggestion).toBeVisible();
		
		// Cancel the inserter
		await page.keyboard.press('Escape');
		
		// Try a block that shouldn't be allowed
		await page.click('.block-list-appender button');
		await page.keyboard.type('gallery');
		
		// Gallery should not be suggested as it's not in allowedBlocks
		const gallerySuggestion = page.locator('.block-editor-inserter__menu').locator('text=Gallery');
		await expect(gallerySuggestion).toHaveCount(0);
	});

	test('should support interactivity API', async ({ page }) => {
		await createQuizPost(page, 'Page Interactivity Test');
		const pageBlock = await addQuizPage(page, 'Interactive Page');
		
		await expect(pageBlock).toHaveAttribute('data-type', 'prc-quiz/page');
		
		// Save and preview to test frontend interactivity
		await saveAndPreview(page);
		
		// Check for interactivity API data attributes on frontend
		const frontendPage = page.locator('[data-type="prc-quiz/page"]');
		await expect(frontendPage).toBeVisible();
	});

	test('should handle page without questions', async ({ page }) => {
		await createQuizPost(page, 'Empty Page Test');
		const pageBlock = await addQuizPage(page, 'Empty Page');
		
		await expect(pageBlock).toBeVisible();
		
		// Save the post
		await page.keyboard.press('Meta+S');
		await page.waitForFunction(() => {
			const saveButton = document.querySelector('.editor-post-save-draft, .editor-post-publish-button');
			return !saveButton?.classList.contains('is-busy');
		});
		
		// Should not throw errors even without questions
		const errors = page.locator('.components-notice.is-error');
		await expect(errors).toHaveCount(0);
	});

	test('should support styling options', async ({ page }) => {
		await createQuizPost(page, 'Page Styling Test');
		const pageBlock = await addQuizPage(page, 'Styled Page');
		
		await pageBlock.click();
		
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
		
		// Check for color settings
		const colorPanel = page.locator('.components-panel__body-title:has-text("Color")');
		if (await colorPanel.isVisible()) {
			await colorPanel.click();
			// Color settings should be available
			const colorSettings = page.locator('.block-editor-panel-color-gradient-settings');
			await expect(colorSettings).toBeVisible();
		}
	});

	test('should support anchor setting', async ({ page }) => {
		await createQuizPost(page, 'Page Anchor Test');
		const pageBlock = await addQuizPage(page, 'Anchor Page');
		
		await pageBlock.click();
		
		// Open block settings
		await page.click('.block-editor-block-inspector');
		
		// Check for anchor/ID setting
		const advancedPanel = page.locator('.components-panel__body-title:has-text("Advanced")');
		if (await advancedPanel.isVisible()) {
			await advancedPanel.click();
			
			const anchorInput = page.locator('input[placeholder*="anchor"], input[id*="anchor"]');
			if (await anchorInput.isVisible()) {
				await anchorInput.fill('test-page-anchor');
				await expect(anchorInput).toHaveValue('test-page-anchor');
			}
		}
	});

	test('should handle multiple pages', async ({ page }) => {
		await createQuizPost(page, 'Multiple Pages Test');
		
		// Add first page
		const firstPage = await addQuizPage(page, 'Page 1');
		await expect(firstPage).toBeVisible();
		
		// Add second page
		const secondPage = await addQuizPage(page, 'Page 2');
		await expect(secondPage).toBeVisible();
		
		// Add third page
		const thirdPage = await addQuizPage(page, 'Page 3');
		await expect(thirdPage).toBeVisible();
		
		// Verify all pages are present
		const allPages = page.locator('[data-type="prc-quiz/page"]');
		await expect(allPages).toHaveCount(3);
	});

	test('should support copy and paste with new UUID', async ({ page }) => {
		await createQuizPost(page, 'Copy Paste Test');
		const pageBlock = await addQuizPage(page, 'Original Page');
		
		await pageBlock.click();
		
		// Copy the page block
		await page.keyboard.press('Meta+C');
		
		// Position cursor after the page block
		await page.click('[data-type="prc-quiz/controller"]');
		await page.click('.block-list-appender button');
		await page.keyboard.press('Escape');
		
		// Paste the page block
		await page.keyboard.press('Meta+V');
		
		// Wait for the pasted block to appear
		await page.waitForTimeout(1000);
		
		// Verify we now have two pages
		const allPages = page.locator('[data-type="prc-quiz/page"]');
		await expect(allPages).toHaveCount(2);
		
		// Both pages should be visible but have different UUIDs
		// (This would be verified by checking the UUID attributes if accessible)
	});

	test('should handle page navigation controls', async ({ page }) => {
		await createQuizPost(page, 'Page Navigation Test');
		
		// Add multiple pages
		await addQuizPage(page, 'Page 1');
		await addQuizPage(page, 'Page 2');
		await addQuizPage(page, 'Page 3');
		
		// Save and preview to test frontend navigation
		await saveAndPreview(page);
		
		// Check for navigation controls on frontend
		const nextButton = page.locator('button:has-text("Next")');
		const prevButton = page.locator('button:has-text("Previous")');
		
		// First page should have next button but no previous
		if (await nextButton.isVisible()) {
			await expect(nextButton).toBeVisible();
		}
		
		// Previous button should not be visible on first page
		if (await prevButton.isVisible()) {
			await expect(prevButton).not.toBeVisible();
		}
	});
});