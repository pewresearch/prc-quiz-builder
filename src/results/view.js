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
import { scrollToElement } from '../controller/scroll-utils';
import { matchScoreBucket } from '../controller/score-buckets';

const { state, actions } = store('prc-quiz/controller', {
	state: {
		get score() {
			const context = getContext();
			const { userScore } = context;
			return userScore?.score || 0;
		},
		get matchedScoreBucket() {
			const context = getContext();
			const buckets = context.scoreBuckets || [];
			return matchScoreBucket(state.score, buckets);
		},
		get matchedScoreBucketLabel() {
			return state.matchedScoreBucket?.label || '';
		},
		get isMatchedScoreBucketLabelHidden() {
			return '' === state.matchedScoreBucketLabel;
		},
		/**
		 * Total questions for the result-score denominator.
		 * Prefers the saved block attribute; falls back to quiz question count.
		 */
		get numberOfQuestionsTotal() {
			const context = getContext();
			const fromAttr = String(context?.numberOfQuestions ?? '').trim();
			if (fromAttr && fromAttr !== 'N/A') {
				return fromAttr;
			}
			const { quizId } = context;
			const quizData = quizId ? state[`quiz_${quizId}`] : null;
			const questions = quizData?.questions;
			if (questions && typeof questions === 'object') {
				const count = Object.keys(questions).length;
				if (count > 0) {
					return String(count);
				}
			}
			return '0';
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
				bucketId,
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
			if (mode === 'bucket') {
				if (!bucketId) {
					return false;
				}
				return state.matchedScoreBucket?.id === bucketId;
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
		onResultsInit: () => {
			const context = getContext();
			if (!context.displayResults) {
				return;
			}
			const { ref } = getElement();
			scrollToElement(ref);
			actions.runAnimation();
		},
		onResultsDisplay: () => {
			const context = getContext();
			const { displayResults } = context;
			if (!displayResults) {
				return;
			}
			const { ref } = getElement();
			scrollToElement(ref);
			actions.runAnimation();
		},
		/**
		 * Copy the awarded score into any prc-block/form field named "score"
		 * so sendSystemEmail (and similar) forms can submit it server-side.
		 */
		syncScoreToForm: () => {
			const { score } = state;
			// state.score defaults to 0 pre-submit; only sync a real result.
			if (!score) {
				return;
			}
			const formStore = store('prc-block/form');
			const formFields = formStore?.state?.formFields;
			if (!Array.isArray(formFields)) {
				return;
			}
			formFields.forEach((field) => {
				if ('score' === field.name && field.value !== score) {
					field.value = score;
				}
			});
		},
	},
});
