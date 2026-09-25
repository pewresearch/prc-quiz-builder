/**
 * Pure helpers for the paged-quiz page transition. No DOM access.
 */

export const PAGE_TRANSITION_NONE = 'none';
export const PAGE_TRANSITION_HORIZONTAL_PARALLAX = 'horizontal-parallax';

export const PARALLAX_STRENGTH_MIN = 0.1;
export const PARALLAX_STRENGTH_MAX = 0.9;
export const PARALLAX_STRENGTH_DEFAULT = 0.5;

export const SWIPE_MIN_DISTANCE_PX = 50;
export const SWIPE_MAX_DURATION_MS = 800;
export const SWIPE_AXIS_RATIO = 1.5;

/**
 * Clamp the author-set parallax strength into the supported range.
 *
 * @param {*} value Raw attribute value.
 * @return {number} Strength between the min and max.
 */
export function clampParallaxStrength(value) {
	const number = Number(value);
	if (!Number.isFinite(number)) {
		return PARALLAX_STRENGTH_DEFAULT;
	}
	return Math.min(
		PARALLAX_STRENGTH_MAX,
		Math.max(PARALLAX_STRENGTH_MIN, number)
	);
}

/**
 * Whether the author enabled horizontal parallax and the quiz currently pages.
 *
 * Fluid quizzes resolve to `scrollable` on narrow viewports, which turns it off.
 *
 * @param {Object} args
 * @param {string} args.displayType    Resolved display type.
 * @param {string} args.pageTransition Author-configured page transition.
 * @return {boolean} True when paged navigation uses the horizontal parallax setting.
 */
export function isHorizontalParallax({ displayType, pageTransition }) {
	return (
		'paged' === displayType &&
		PAGE_TRANSITION_HORIZONTAL_PARALLAX === pageTransition
	);
}

/**
 * The transition to run for a page change right now.
 *
 * @param {Object}  args
 * @param {string}  args.displayType          Resolved display type.
 * @param {string}  args.pageTransition       Author-configured page transition.
 * @param {boolean} args.prefersReducedMotion Reader asked for reduced motion.
 * @return {string} `none` or `horizontal-parallax`.
 */
export function resolvePageTransition({
	displayType,
	pageTransition,
	prefersReducedMotion,
}) {
	if (
		prefersReducedMotion ||
		!isHorizontalParallax({ displayType, pageTransition })
	) {
		return PAGE_TRANSITION_NONE;
	}
	return PAGE_TRANSITION_HORIZONTAL_PARALLAX;
}

/**
 * Direction of travel between two pages, by their order in the quiz.
 *
 * @param {Array}  pages    Page uuids in order.
 * @param {string} fromUuid Current page uuid.
 * @param {string} toUuid   Target page uuid.
 * @return {'forward'|'backward'|null} Null when either page is unknown or they match.
 */
export function getNavigationDirection(pages, fromUuid, toUuid) {
	if (!Array.isArray(pages)) {
		return null;
	}
	const from = pages.indexOf(fromUuid);
	const to = pages.indexOf(toUuid);
	if (from < 0 || to < 0 || from === to) {
		return null;
	}
	return to > from ? 'forward' : 'backward';
}

/**
 * Whether the background layer holds still or moves with parallax.
 *
 * Only background images count. Pages with the same image (or both without
 * one) hold; anything else moves.
 *
 * @param {Object} pageBackgrounds Map of page uuid to `{ key, url }`.
 * @param {string} fromUuid        Leaving page uuid.
 * @param {string} toUuid          Entering page uuid.
 * @return {'hold'|'parallax'} Background motion.
 */
export function getBackgroundMotion(pageBackgrounds, fromUuid, toUuid) {
	const fromKey = pageBackgrounds?.[fromUuid]?.key || '';
	const toKey = pageBackgrounds?.[toUuid]?.key || '';
	return fromKey === toKey ? 'hold' : 'parallax';
}

/**
 * @param {number} percent Percentage of the element's own width.
 * @return {string} CSS transform.
 */
function translateX(percent) {
	const rounded = Math.round(percent * 100) / 100;
	return `translateX(${0 === rounded ? 0 : rounded}%)`;
}

/**
 * Keyframes for the four moving layers of a page transition.
 *
 * Each background layer sits inside its page and translates against it. A
 * factor of 1 cancels the page travel, so the background stands still; the
 * parallax strength cancels part of it, so the background moves slower.
 *
 * @param {Object}               args
 * @param {'forward'|'backward'} args.direction  Direction of travel.
 * @param {'hold'|'parallax'}    args.background Background motion.
 * @param {number}               args.strength   Parallax strength.
 * @return {{leavingPage: Array, leavingBackground: Array, enteringPage: Array, enteringBackground: Array}} Keyframes per layer.
 */
export function getTransitionKeyframes({ direction, background, strength }) {
	const sign = 'backward' === direction ? -1 : 1;
	const factor = 'hold' === background ? 1 : clampParallaxStrength(strength);
	return {
		leavingPage: [
			{ transform: translateX(0) },
			{ transform: translateX(-sign * 100) },
		],
		leavingBackground: [
			{ transform: translateX(0) },
			{ transform: translateX(sign * factor * 100) },
		],
		enteringPage: [
			{ transform: translateX(sign * 100) },
			{ transform: translateX(0) },
		],
		enteringBackground: [
			{ transform: translateX(-sign * factor * 100) },
			{ transform: translateX(0) },
		],
	};
}

/**
 * Map a finished touch gesture to a page navigation.
 *
 * @param {Object} args
 * @param {number} args.dx Horizontal travel in px (end minus start).
 * @param {number} args.dy Vertical travel in px.
 * @param {number} args.dt Gesture duration in ms.
 * @return {'next'|'previous'|null} Null when the gesture is not a page swipe.
 */
export function getSwipeNavigation({ dx, dy, dt }) {
	if (
		!Number.isFinite(dx) ||
		Math.abs(dx) < SWIPE_MIN_DISTANCE_PX ||
		Math.abs(dx) < SWIPE_AXIS_RATIO * Math.abs(dy || 0) ||
		dt > SWIPE_MAX_DURATION_MS
	) {
		return null;
	}
	return dx < 0 ? 'next' : 'previous';
}

/**
 * Uuids of the pages next to the given page.
 *
 * @param {Array}  pages Page uuids in order.
 * @param {string} uuid  Page uuid.
 * @return {Array} Previous and next uuids that exist.
 */
export function getNeighborPageUuids(pages, uuid) {
	if (!Array.isArray(pages)) {
		return [];
	}
	const index = pages.indexOf(uuid);
	if (index < 0) {
		return [];
	}
	return [pages[index - 1], pages[index + 1]].filter(Boolean);
}
