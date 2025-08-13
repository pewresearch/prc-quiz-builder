/**
 * WordPress Dependencies
 */
import {
	store,
	getContext,
	getElement,
	withSyncEvent,
} from '@wordpress/interactivity';

const { state, actions } = store('prc-quiz/controller', {
	state: {
		get isPageVisible() {
			const context = getContext();
			const { uuid, currentPageUuid, displayType } = context;
			if ('paged' !== displayType) {
				return true;
			}
			return uuid === currentPageUuid;
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
			if (uuid === currentPageUuid) {
				actions.runAnimation();
			}
		},
		onLastPageScroll: withSyncEvent((event) => {
			const context = getContext();
			const { uuid, currentPageUuid, displayType } = context;
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
