/**
 * Pure helpers for the Progress Circles skip control.
 */

/**
 * Last page uuid from the quiz pages list.
 *
 * @param {Array} pages Page uuid list.
 * @return {string|null} Last uuid, or null.
 */
export function getLastPageUuid(pages) {
	if (!Array.isArray(pages) || pages.length < 1) {
		return null;
	}
	return pages[pages.length - 1] || null;
}

/**
 * Whether the skip control should render.
 *
 * @param {Array} pages Page uuid list.
 * @return {boolean} True when the quiz has at least two pages.
 */
export function showProgressSkip(pages) {
	return Array.isArray(pages) && pages.length >= 2;
}

/**
 * Whether the participant is on the last page.
 *
 * Paged quizzes use currentPageUuid. Scrollable quizzes use last-page
 * intersection because Next is hidden and currentPageUuid often stays put.
 *
 * @param {Object}  args
 * @param {string}  args.displayType     Resolved display type.
 * @param {string}  args.currentPageUuid Current page uuid.
 * @param {Array}   args.pages           Page uuid list.
 * @param {boolean} args.lastPageInView  Last page intersects the viewport.
 * @return {boolean} True when the quiz is at the last page.
 */
export function isAtQuizEnd({
	displayType,
	currentPageUuid,
	pages,
	lastPageInView,
}) {
	const lastUuid = getLastPageUuid(pages);
	if (!lastUuid) {
		return false;
	}
	if ('scrollable' === displayType) {
		return Boolean(lastPageInView);
	}
	return currentPageUuid === lastUuid;
}

/**
 * Label for the skip control.
 *
 * @param {Object}  args
 * @param {boolean} args.isAtEnd     Whether the quiz is at the last page.
 * @param {string}  args.displayType Resolved display type.
 * @param {Object}  args.labels      Translated label map.
 * @return {string} Button text.
 */
export function getProgressSkipLabel({ isAtEnd, displayType, labels = {} }) {
	const isScrollable = 'scrollable' === displayType;
	if (isAtEnd) {
		return isScrollable
			? labels.scrollToFirstPage || 'Scroll to first page'
			: labels.goToFirstPage || 'Go to first page';
	}
	return isScrollable
		? labels.scrollToEnd || 'Scroll to end'
		: labels.skipToLastPage || 'Skip to last page';
}

/**
 * Target page uuid for a skip click.
 *
 * @param {Object}  args
 * @param {boolean} args.isAtEnd       Whether the quiz is at the last page.
 * @param {string}  args.firstPageUuid First page uuid.
 * @param {Array}   args.pages         Page uuid list.
 * @return {string|null} Uuid to show or scroll to.
 */
export function getProgressSkipTargetUuid({ isAtEnd, firstPageUuid, pages }) {
	if (isAtEnd) {
		return firstPageUuid || pages?.[0] || null;
	}
	return getLastPageUuid(pages);
}
