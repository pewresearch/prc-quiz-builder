/**
 * Keep userSubmission, readyForSubmission, and userScore in sync with
 * selectedAnswers. Answer view modules can evaluate before
 * controller/view.js, so this action is registered from both (same pattern
 * as run-animation.js).
 */
import { store, getContext } from '@wordpress/interactivity';
import {
	flattenSelectedAnswers,
	meetsAnswerThreshold,
} from './selected-answers';
import scoreQuiz from './scoring';

const { state } = store('prc-quiz/controller', {
	actions: {
		syncUserSubmission: () => {
			const context = getContext();
			const { selectedAnswers, answerThreshold, displayResults, quizId } =
				context;
			const answersArray = flattenSelectedAnswers(selectedAnswers);
			context.userSubmission = answersArray;
			context.readyForSubmission = meetsAnswerThreshold(
				selectedAnswers,
				answerThreshold
			);
			if (displayResults || !quizId || 0 === answersArray.length) {
				return;
			}
			const quizData = state[`quiz_${quizId}`];
			if (!quizData?.questions) {
				return;
			}
			const answers = Object.values(quizData.questions).reduce(
				(acc, question) => ({
					...acc,
					...question.answers,
				}),
				{}
			);
			context.userScore = scoreQuiz(
				answersArray,
				answers,
				quizData.questions
			);
		},
	},
});
