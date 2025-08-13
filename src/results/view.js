import {
	store,
	getContext,
	getServerContext,
	getServerState,
	getElement,
	withScope,
	withSyncEvent,
} from '@wordpress/interactivity';

/**
 * Internal Dependencies
 */

const { state, actions } = store('prc-quiz/controller', {
	state: {
		get score() {
			const context = getContext();
			const { userScore } = context;
			return userScore?.score || 0;
		},
		get displayResultInnerBlockScore() {
			return state.score;
		},
		get displayResultInnerBlock() {
			const context = getContext();
			const { resultsDisplay } = context;
			const {
				mode,
				exactPoints,
				minPoints,
				maxPoints,
				thresholdPoints,
				thresholdDirection,
				exactPointsString,
			} = resultsDisplay;
			const score = state.displayResultInnerBlockScore;
			if (mode === 'always') {
				return true;
			}
			if (mode === 'exact') {
				return score === exactPoints;
			}
			if (mode === 'exactString') {
				return score === exactPointsString;
			}
			if (mode === 'min') {
				return score >= minPoints;
			}
			if (mode === 'max') {
				return score <= maxPoints;
			}
			if (mode === 'range') {
				return score >= minPoints && score <= maxPoints;
			}
			if (mode === 'threshold') {
				if (thresholdDirection === 'above') {
					return score >= thresholdPoints;
				}
				return score <= thresholdPoints;
			}
			return false;
		},
	},
	actions: {
		onShareClick: withSyncEvent((event) => {
			event.preventDefault();
			const context = getContext();
			let newShareText = context.shareText.replace(
				'%score%',
				state.score
			);
			newShareText = newShareText.replace('%title%', context.quizTitle);
			navigator.share({
				title: newShareText,
				url: context.quizUrl,
			});
		}),
	},
	callbacks: {
		*onResultsDisplay() {
			const context = getContext();
			const { displayResults } = context;
			if (!displayResults) {
				return;
			}
			const { ref } = getElement();
			// When results become available, scroll to the top of the element.
			ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
			actions.runAnimation();
		},
	},
});
