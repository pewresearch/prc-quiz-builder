/**
 * WordPress Dependencies
 */
import {
	store,
	getContext,
	getElement,
	withSyncEvent,
} from '@wordpress/interactivity';

import { scrollToElement } from '../controller/scroll-utils';
import '../controller/run-animation';

const lastCurrentPageUuidByQuiz = new Map();

const { state, actions } = store('prc-quiz/controller', {
	state: {
		suppressPageScroll: false,
		get isPageVisible() {
			const context = getContext();
			const { uuid, currentPageUuid, displayType, pageTransitionState } =
				context;
			if ('paged' !== displayType) {
				return true;
			}
			return (
				uuid === currentPageUuid ||
				uuid === pageTransitionState?.fromUuid
			);
		},
		get isPageLeaving() {
			const { uuid, pageTransitionState } = getContext();
			return uuid === pageTransitionState?.fromUuid;
		},
	},
	callbacks: {
		onPageVisibleChange: () => {
			const context = getContext();
			const { uuid, currentPageUuid, displayType } = context;
			// If the page is visible, dispatch the animation run action.
			if ('paged' !== displayType) {
				return;
			}
			if (uuid !== currentPageUuid) {
				return;
			}
			const quizKey = context.firstPageUuid;
			const lastCurrentPageUuid =
				lastCurrentPageUuidByQuiz.get(quizKey) ?? null;
			const hasNavigated =
				lastCurrentPageUuid !== null &&
				lastCurrentPageUuid !== currentPageUuid;
			const suppressScroll = state.suppressPageScroll;
			if (suppressScroll) {
				state.suppressPageScroll = false;
			}
			lastCurrentPageUuidByQuiz.set(quizKey, currentPageUuid);
			if (hasNavigated && !suppressScroll) {
				const { ref } = getElement();
				if (context.scrollOnPageChange) {
					scrollToElement(
						ref.closest('.wp-block-prc-quiz-controller')
					);
				}
				// A running page transition moves focus when it finishes.
				if (!context.pageTransitionState) {
					ref.focus({ preventScroll: true });
				}
			}
			actions.runAnimation?.();
		},
		onLastPageScroll: withSyncEvent(() => {
			const context = getContext();
			const { uuid, displayType } = context;
			if ('scrollable' !== displayType) {
				return;
			}
			// Let check if the last page is visible in the viewport...
			const lastPage = document.querySelector(
				`[data-page-uuid="${uuid}"]`
			);
			if (lastPage) {
				const rect = lastPage.getBoundingClientRect();
				if (Math.abs(rect.bottom - window.innerHeight) <= 1) {
					actions.submitQuiz();
				}
			}
		}),
	},
});
