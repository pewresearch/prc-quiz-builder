/**
 * WordPress Dependencies
 */
import { store, getContext, withScope } from '@wordpress/interactivity';

const { state, actions } = store('prc-quiz/controller', {
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
						if (currentPageUuid) {
							context.currentPageUuid = currentPageUuid;
						}
						if (selectedAnswers) {
							context.selectedAnswers = selectedAnswers;
						}
					}
				}),
				1505
			);
		},
		storeCurrentPageUuid: () => {},
	},
});
