/**
 * DOM side of the page transition: Web Animations on the leaving and entering
 * pages and their background layers.
 */

/**
 * Internal Dependencies
 */
import { getTransitionKeyframes } from './page-transition';

const DURATION_MS = 600;
const EASING = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
const BACKGROUND_LAYER_SELECTOR =
	':scope > .wp-block-prc-quiz-page__background';

const runningAnimations = new WeakMap();
const preloadedUrls = new Set();

/**
 * @return {boolean} True when the reader asked the OS for reduced motion.
 */
export function prefersReducedMotion() {
	return (
		'undefined' !== typeof window &&
		!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
	);
}

/**
 * The Pages block element that owns the given element.
 *
 * @param {Element|null} element Element inside the quiz.
 * @return {Element|null} Pages block element.
 */
export function findPagesElement(element) {
	return (
		element?.closest('.wp-block-prc-quiz-pages') ||
		element
			?.closest('.wp-block-prc-quiz-controller')
			?.querySelector('.wp-block-prc-quiz-pages') ||
		null
	);
}

/**
 * Jump any running transition inside the Pages element to its end state.
 *
 * @param {Element} pagesElement Pages block element.
 */
export function finishPageTransition(pagesElement) {
	const animations = runningAnimations.get(pagesElement);
	runningAnimations.delete(pagesElement);
	animations?.forEach((animation) => animation.finish());
}

/**
 * Start the transition between two pages.
 *
 * The entering page may still be `display: none` here; its animation applies
 * from the first frame it renders.
 *
 * @param {Element} pagesElement    Pages block element.
 * @param {Object}  args
 * @param {string}  args.fromUuid   Leaving page uuid.
 * @param {string}  args.toUuid     Entering page uuid.
 * @param {string}  args.direction  `forward` or `backward`.
 * @param {string}  args.background `hold` or `parallax`.
 * @param {number}  args.strength   Parallax strength.
 * @return {Promise|null} Resolves when every layer finished; null when nothing animates.
 */
export function animatePageTransition(
	pagesElement,
	{ fromUuid, toUuid, direction, background, strength }
) {
	finishPageTransition(pagesElement);
	const from = pagesElement.querySelector(`[data-page-uuid="${fromUuid}"]`);
	const to = pagesElement.querySelector(`[data-page-uuid="${toUuid}"]`);
	if (!from || !to || 'function' !== typeof to.animate) {
		return null;
	}
	const frames = getTransitionKeyframes({ direction, background, strength });
	const animations = [
		[from, frames.leavingPage],
		[
			from.querySelector(BACKGROUND_LAYER_SELECTOR),
			frames.leavingBackground,
		],
		[to, frames.enteringPage],
		[
			to.querySelector(BACKGROUND_LAYER_SELECTOR),
			frames.enteringBackground,
		],
	]
		.filter(([element]) => element)
		.map(([element, keyframes]) =>
			element.animate(keyframes, {
				duration: DURATION_MS,
				easing: EASING,
			})
		);
	runningAnimations.set(pagesElement, animations);
	return Promise.all(
		animations.map((animation) => animation.finished.catch(() => {}))
	).then(() => {
		if (animations === runningAnimations.get(pagesElement)) {
			runningAnimations.delete(pagesElement);
		}
	});
}

/**
 * Warm the cache for background images of pages that are about to enter.
 *
 * Browsers skip `background-image` on `display: none` pages until they show.
 *
 * @param {Array<string>} urls Image URLs.
 */
export function preloadImages(urls) {
	if ('undefined' === typeof window) {
		return;
	}
	urls.forEach((url) => {
		if (!url || preloadedUrls.has(url)) {
			return;
		}
		preloadedUrls.add(url);
		const image = new window.Image();
		image.src = url;
	});
}
