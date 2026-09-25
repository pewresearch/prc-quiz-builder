/**
 * WordPress Dependencies
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
	getNeighborPageUuids,
	getSwipeNavigation,
} from '../controller/page-transition';
import { preloadImages } from '../controller/page-transition-runner';
import '../controller/page-navigation';

// Horizontal drags on these mean something else (sliders, text selection).
const SWIPE_IGNORE_SELECTOR =
	'input, textarea, select, [role="slider"], [contenteditable]';
const SWIPE_TARGETS = {
	next: {
		step: 1,
		buttonSelector: '.prc-quiz-next-page-button, .prc-quiz-start-button',
	},
	previous: {
		step: -1,
		buttonSelector: '.prc-quiz-previous-page-button',
	},
};

const touchStarts = new WeakMap();

const { state, actions } = store('prc-quiz/controller', {
	state: {
		get isPageTransitioning() {
			return !!getContext().pageTransitionState;
		},
	},
	actions: {
		onPagesTouchStart: (event) => {
			const { ref } = getElement();
			if (!state.isHorizontalParallax || 1 !== event.touches?.length) {
				touchStarts.delete(ref);
				return;
			}
			if (event.target?.closest?.(SWIPE_IGNORE_SELECTOR)) {
				touchStarts.delete(ref);
				return;
			}
			const [touch] = event.touches;
			touchStarts.set(ref, {
				x: touch.clientX,
				y: touch.clientY,
				time: event.timeStamp,
			});
		},
		/**
		 * Swipe left runs Next and swipe right runs Previous, only when the
		 * current page offers that button.
		 *
		 * @param {TouchEvent} event Touch end event.
		 */
		onPagesTouchEnd: (event) => {
			const { ref } = getElement();
			const start = touchStarts.get(ref);
			touchStarts.delete(ref);
			const touch = event.changedTouches?.[0];
			if (!start || !touch || !state.isHorizontalParallax) {
				return;
			}
			const navigation = getSwipeNavigation({
				dx: touch.clientX - start.x,
				dy: touch.clientY - start.y,
				dt: event.timeStamp - start.time,
			});
			if (!navigation) {
				return;
			}
			const { step, buttonSelector } = SWIPE_TARGETS[navigation];
			const { currentPageUuid, pages } = getContext();
			const currentPage = ref.querySelector(
				`[data-page-uuid="${currentPageUuid}"]`
			);
			const button = currentPage?.querySelector(buttonSelector);
			if (!button || button.closest('[hidden]')) {
				return;
			}
			const targetUuid = pages[pages.indexOf(currentPageUuid) + step];
			if (!targetUuid) {
				return;
			}
			actions.goToPage(targetUuid);
			actions.saveQuizProgress();
		},
	},
	callbacks: {
		onPagesInit: () => {
			const context = getContext();
			// Check if the user has a cookie for this quiz, and if so check if currentPageUuid is set, if so, set context to it.
			setTimeout(
				withScope(() => {
					// If the user started a quiz, but did not complete it, we want to set the currentPageUuid to the last page they were on.
					const { quizProgress, hasQuizProgress } = state;
					if (hasQuizProgress) {
						const { currentPageUuid, selectedAnswers } =
							quizProgress;
						if (
							currentPageUuid &&
							currentPageUuid !== context.currentPageUuid
						) {
							state.suppressPageScroll = true;
							context.currentPageUuid = currentPageUuid;
						}
						if (selectedAnswers) {
							context.selectedAnswers = selectedAnswers;
						}
					}
					if (state.isHorizontalParallax) {
						preloadImages(
							[
								context.currentPageUuid,
								...getNeighborPageUuids(
									context.pages,
									context.currentPageUuid
								),
							].map(
								(uuid) => context.pageBackgrounds?.[uuid]?.url
							)
						);
					}
				}),
				1505
			);
		},
		storeCurrentPageUuid: () => {},
	},
});
