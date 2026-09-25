/**
 * Registers `goToPage` and `state.isHorizontalParallax` on the quiz controller
 * Interactivity store.
 *
 * Next, Previous, Start, progress skip, and swipe all navigate through
 * `goToPage`. Callers live in several view modules whose evaluation order is
 * not guaranteed, so each of them imports this module.
 */
import {
	store,
	getContext,
	getElement,
	withScope,
} from '@wordpress/interactivity';

/**
 * Internal Dependencies
 */
import {
	PAGE_TRANSITION_NONE,
	getBackgroundMotion,
	getNavigationDirection,
	getNeighborPageUuids,
	isHorizontalParallax,
	resolvePageTransition,
} from './page-transition';
import {
	animatePageTransition,
	findPagesElement,
	finishPageTransition,
	preloadImages,
	prefersReducedMotion,
} from './page-transition-runner';

let pageTransitionSequence = 0;

const { state } = store('prc-quiz/controller', {
	state: {
		get isHorizontalParallax() {
			const { displayType, pageTransition } = getContext();
			return isHorizontalParallax({ displayType, pageTransition });
		},
	},
	actions: {
		/**
		 * Navigate to a page, sliding it in when horizontal parallax is active.
		 *
		 * @param {string}  targetUuid        Page uuid to show.
		 * @param {Object}  [options]
		 * @param {boolean} [options.animate] Run the page transition when active.
		 */
		goToPage: (targetUuid, { animate = true } = {}) => {
			const context = getContext();
			const {
				currentPageUuid,
				pages,
				pageBackgrounds,
				displayType,
				pageTransition,
				parallaxStrength,
			} = context;
			if (!targetUuid || targetUuid === currentPageUuid) {
				return;
			}
			const pagesElement = findPagesElement(getElement().ref);
			if (pagesElement) {
				finishPageTransition(pagesElement);
			}
			context.pageTransitionState = null;

			const direction = getNavigationDirection(
				pages,
				currentPageUuid,
				targetUuid
			);
			const transition = resolvePageTransition({
				displayType,
				pageTransition,
				prefersReducedMotion: prefersReducedMotion(),
			});
			const finished =
				animate &&
				direction &&
				pagesElement &&
				PAGE_TRANSITION_NONE !== transition
					? animatePageTransition(pagesElement, {
							fromUuid: currentPageUuid,
							toUuid: targetUuid,
							direction,
							background: getBackgroundMotion(
								pageBackgrounds,
								currentPageUuid,
								targetUuid
							),
							strength: parallaxStrength,
						})
					: null;
			if (finished) {
				pageTransitionSequence += 1;
				const id = pageTransitionSequence;
				context.pageTransitionState = {
					id,
					fromUuid: currentPageUuid,
					toUuid: targetUuid,
				};
				finished.then(
					withScope(() => {
						if (id !== context.pageTransitionState?.id) {
							return;
						}
						context.pageTransitionState = null;
						pagesElement
							.querySelector(`[data-page-uuid="${targetUuid}"]`)
							?.focus({ preventScroll: true });
					})
				);
			}
			context.currentPageUuid = targetUuid;

			if (state.isHorizontalParallax) {
				preloadImages(
					getNeighborPageUuids(pages, targetUuid).map(
						(uuid) => pageBackgrounds?.[uuid]?.url
					)
				);
			}
		},
	},
});
