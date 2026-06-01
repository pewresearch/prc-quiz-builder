/**
 * WordPress Dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

/**
 * Whether a gated question is currently reachable, mirroring the conditional
 * display rules in controller/view.js.
 *
 * @param {Object} question        Question state entry.
 * @param {Object} selectedAnswers Map of questionUuid -> answerUuid[].
 * @param {Object} allQuestions    Full questions map for the quiz.
 * @return {boolean} True when the question counts toward progress.
 */
function isQuestionActive(question, selectedAnswers, allQuestions) {
	const { conditionalDisplay, conditionalAnswerUuid, uuid } = question;

	if (!conditionalDisplay || !conditionalAnswerUuid) {
		return true;
	}

	if (allQuestions[conditionalAnswerUuid]) {
		const answers = selectedAnswers[conditionalAnswerUuid] || [];
		return answers.length > 0;
	}

	const selectedAnswersArray = Object.values(selectedAnswers || {}).flat();
	return (
		selectedAnswersArray.includes(conditionalAnswerUuid) ||
		selectedAnswersArray.includes(uuid)
	);
}

const { state } = store('prc-quiz/controller', {
	state: {
		get activeQuestions() {
			const { selectedAnswers, quizId } = getContext();
			const allQuestions =
				state[`quiz_${quizId}`]?.questions || state.questions || {};
			return Object.values(allQuestions).filter((question) =>
				isQuestionActive(question, selectedAnswers, allQuestions)
			);
		},
		get answeredQuestions() {
			const { selectedAnswers } = getContext();
			return state.activeQuestions.filter((question) => {
				const answers = selectedAnswers[question.uuid] || [];
				return answers.length > 0;
			}).length;
		},
		get totalQuestions() {
			return state.activeQuestions.length;
		},
		get progressPercentage() {
			const { totalQuestions, answeredQuestions } = state;
			if (!totalQuestions) {
				return 0;
			}
			return Math.round((answeredQuestions / totalQuestions) * 100);
		},
		get progressBarWidth() {
			return `${state.progressPercentage}%`;
		},
		get progressLabel() {
			const { answeredQuestions, totalQuestions } = state;
			return `${answeredQuestions} of ${totalQuestions} answered`;
		},
	},
});
