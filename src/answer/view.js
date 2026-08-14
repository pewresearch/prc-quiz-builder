/**
 * WordPress Dependencies
 */
import {
	store,
	getContext,
	getElement,
	withSyncEvent,
} from '@wordpress/interactivity';

/**
 * Internal Dependencies
 */
import { getQuestionOutcome } from '../controller/question-outcome';

function isLiveFeedbackActive(context) {
	return !!context.liveFeedback && context.quizType === 'quiz';
}

const { state, actions } = store('prc-quiz/controller', {
	state: {
		get isAnswerSelected() {
			const { uuid, questionUuid, selectedAnswers } = getContext();
			return selectedAnswers[questionUuid]?.includes(uuid);
		},
		get isQuestionLocked() {
			const context = getContext();
			if (!isLiveFeedbackActive(context)) {
				return false;
			}
			const { questionUuid, selectedAnswers, questionType } = context;
			// Multiple-choice needs several selections; only lock single/thermometer.
			if (questionType === 'multiple') {
				return false;
			}
			return (selectedAnswers[questionUuid] || []).length > 0;
		},
		get isAnswerDisabled() {
			const context = getContext();
			// Results URLs set displayResults and/or displayGroupResults; both must
			// keep answers disabled so data-wp-bind does not clear PHP's disabled.
			if (context.displayResults || context.displayGroupResults) {
				return true;
			}
			return state.isQuestionLocked;
		},
		get isFeedbackCorrect() {
			const context = getContext();
			if (!isLiveFeedbackActive(context) || !state.isAnswerSelected) {
				return false;
			}
			const { uuid, questionUuid, quizId } = context;
			const answer =
				state[`quiz_${quizId}`]?.questions?.[questionUuid]?.answers?.[
					uuid
				];
			return true === answer?.correct;
		},
		get isFeedbackIncorrect() {
			const context = getContext();
			if (!isLiveFeedbackActive(context) || !state.isAnswerSelected) {
				return false;
			}
			const { uuid, questionUuid, quizId } = context;
			const answer =
				state[`quiz_${quizId}`]?.questions?.[questionUuid]?.answers?.[
					uuid
				];
			return false === answer?.correct;
		},
		get questionOutcome() {
			const context = getContext();
			const { questionUuid, selectedAnswers, quizId } = context;
			const question = state[`quiz_${quizId}`]?.questions?.[questionUuid];
			return getQuestionOutcome(
				question,
				selectedAnswers[questionUuid] || []
			);
		},
		/**
		 * Label for the question-outcome block bit (Correct / Incorrect / Not sure).
		 * Quiz Controller outcomeLabels are the defaults. Per-bit overrides live on
		 * the bit span as data-correct-label / data-incorrect-label /
		 * data-unsure-label and are read from getElement().dataset when present.
		 * Empty when unanswered so the bit and host paragraph stay hidden.
		 */
		get questionOutcomeLabel() {
			const context = getContext();
			const { ref } = getElement();
			const defaults = context.outcomeLabels || {};
			const dataset = ref?.dataset || {};
			const labels = {
				correct:
					dataset.correctLabel ||
					context.correctLabel ||
					defaults.correct ||
					'Correct',
				incorrect:
					dataset.incorrectLabel ||
					context.incorrectLabel ||
					defaults.incorrect ||
					'Incorrect',
				unsure:
					dataset.unsureLabel ||
					context.unsureLabel ||
					defaults.unsure ||
					'Not sure',
			};
			const outcome = state.questionOutcome;
			if (outcome === 'correct') {
				return labels.correct;
			}
			if (outcome === 'incorrect') {
				return labels.incorrect;
			}
			if (outcome === 'unsure') {
				return labels.unsure;
			}
			return '';
		},
		get isQuestionOutcomeLabelHidden() {
			return '' === state.questionOutcomeLabel;
		},
	},
	actions: {
		/**
		 * When an answer is clicked, add its uuid to selectedAnswers for the question.
		 * With live feedback enabled, the first selection locks single/thermometer
		 * questions; multiple-choice stays open for additional selections.
		 */
		onAnswerClick: withSyncEvent((event) => {
			event.preventDefault();
			const context = getContext();
			const { ref } = getElement();
			const { uuid, selectedAnswers, questionType, questionUuid } =
				context;
			if (ref.hasAttribute('disabled') || state.isAnswerDisabled) {
				return;
			}

			const currentAnswers = selectedAnswers[questionUuid] || [];
			const isAlreadySelected = currentAnswers.includes(uuid);

			if (questionType === 'single' || questionType === 'thermometer') {
				if (isAlreadySelected) {
					context.selectedAnswers[questionUuid] = [];
				} else {
					context.selectedAnswers[questionUuid] = [uuid];
				}
			} else if (isAlreadySelected) {
				context.selectedAnswers[questionUuid] = currentAnswers.filter(
					(answerId) => answerId !== uuid
				);
			} else {
				context.selectedAnswers[questionUuid] = [
					...currentAnswers,
					uuid,
				];
			}

			actions.saveQuizProgress();
		}),
	},
});
