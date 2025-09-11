/**
 * WordPress Dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

const { state } = store('prc-quiz/controller', {
	state: {
		get demoBreakHeaders() {
			const context = getContext();
			const { quizId, demoBreakLabels } = context;
			const quizData = state[`quiz_${quizId}`];
			
			if (!quizData || !quizData.demoBreakLabels) {
				return [];
			}
			
			return quizData.demoBreakLabels;
		},
		get resultsTableRows() {
			if (!state.displayResults) {
				return [];
			}
			const context = getContext();
			const { quizId, userScore } = context;
			const { score, userSubmission } = userScore;
			const quizData = state[`quiz_${quizId}`];
			const { questions } = quizData;

			// Convert questions object to array since questions appears to be an object with UUIDs as keys
			const questionsArray = Object.values(questions);

			return questionsArray.map((question) => {
				const { uuid, text, answers, demoBreakValues } = question;

				// Convert answers object to array if it's also an object
				const answersArray = Array.isArray(answers)
					? answers
					: Object.values(answers);

				// Get all correct answers instead of just the first one
				const correctAnswers = answersArray.filter(
					(answer) => answer.correct
				);

				// Get all user selected answers (multiple selections possible)
				const userSelectedAnswers = answersArray.filter((answer) =>
					userSubmission.includes(answer.uuid)
				);

				// console.log('userSelectedAnswers = ', userSelectedAnswers);
				// console.log('correctAnswers = ', correctAnswers);
				// console.log('question = ', question);
				// console.log('answersArray = ', answersArray);

				// Format multiple correct answers for display
				const formatCorrectAnswers = () => {
					if (correctAnswers.length === 0) {
						return 'No correct answer';
					}

					return correctAnswers
						.map((answer) => answer.resultsLabel || answer.text)
						.join(', ');
				};

				// Format multiple selected answers for display
				const formatSelectedAnswers = () => {
					if (userSelectedAnswers.length === 0) {
						return 'No answer selected';
					}

					return userSelectedAnswers
						.map((answer) => answer.resultsLabel || answer.text)
						.join(', ');
				};

				// Determine if the user got the question correct
				// This could be implemented in different ways depending on requirements:
				// 1. All correct answers must be selected (and no incorrect ones)
				// 2. At least one correct answer must be selected
				// 3. More correct than incorrect answers selected
				// For now, using approach #1: exact match of correct answers
				const isCorrect = () => {
					if (correctAnswers.length === 0) {
						return false; // No correct answers defined
					}

					// Check if user selected exactly the correct answers
					const correctUuids = correctAnswers
						.map((answer) => answer.uuid)
						.sort();
					const selectedUuids = userSelectedAnswers
						.map((answer) => answer.uuid)
						.sort();

					return (
						correctUuids.length === selectedUuids.length &&
						correctUuids.every(
							(uuid, index) => uuid === selectedUuids[index]
						)
					);
				};

				return {
					uuid,
					correct: isCorrect(),
					question: text,
					selectedAnswer: formatSelectedAnswers(),
					correctAnswer: formatCorrectAnswers(),
					demoBreakValues: demoBreakValues || [],
				};
			});
		},
	},
});
