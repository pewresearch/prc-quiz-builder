/**
 * External Dependencies
 */
import md5 from 'md5';

/**
 * WordPress Dependencies
 */
import { getContext } from '@wordpress/interactivity';

/**
 * Get the correct answers from the flattened answers.
 * @param {Object} answers - All possible answers for the quiz.
 * @returns {Array} The correct answers.
 */
export function getCorrectAnswers(answers) {
	return Object.values(answers).filter((answer) => answer.correct);
}

/**
 * Get the incorrect answers from the flattened answers.
 * @param {Object} answers - All possible answers for the quiz.
 * @returns {Array} The incorrect answers.
 */
export function getIncorrectAnswers(answers) {
	return Object.values(answers).filter((answer) => !answer.correct);
}

/**
 * Tally the user's points based on the user's submission and the flattened answers.
 * @param {Array} userSubmission - The user's submission.
 * @param {Object} answers - All possible answers for the quiz.
 * @returns {number} The user's points.
 */
export function tallyUserPoints(userSubmission, answers) {
	return userSubmission.reduce((acc, answerUuid) => {
		const answer = answers[answerUuid];
		return acc + answer.points;
	}, 0);
}

/**
 * Construct the points matrix for each question based on the user's submission and the flattened answers. Returns an object with the question_uuid as the key and the points as the value.
 * @param {Object} quizData - The quiz data, which includes the questions object.
 * @param {Array} userSubmission - The user's submission.
 * @returns {Object} The points for each question.
 */
export function constructQuestionPointsMatrix(questions, userSubmission) {
	const questionPoints = {};
	Object.values(questions).forEach((question) => {
		const questionUuid = question.uuid;
		const internalId = question.internalId;
		// If a question has an internalId we'll prioritize that over the questionUuid.
		// This means in the case of the Political Typology a question may have an internalId of `govsize3`.
		const id = internalId || questionUuid;
		const answers = Object.values(question.answers);
		// Find the answer that the user selected.
		const userMatchingAnswer = answers.find((answer) =>
			userSubmission.includes(answer.uuid)
		);
		// If the user selected select an answer for this question award them the given points; otherwise award 0 points.
		const pointsAwardedForGivenAnswer = userMatchingAnswer?.points || 0;
		questionPoints[id] = pointsAwardedForGivenAnswer;
	});
	return questionPoints;
}

/**
 * Construct the answer points matrix for each answer based on the user's submission and the flattened answers. Returns an object with the answer_uuid as the key and the points as the value.
 * @param {Object} answers - All possible answers for the quiz.
 * @param {Array} userSubmission - The user's submission.
 * @returns {Object} The points for each answer given.
 */
export function constructAnswerPointsMatrix(answers, userSubmission) {
	const answerPoints = {};
	userSubmission.forEach((answerUuid) => {
		const answer = answers[answerUuid];
		if (!answer) {
			return;
		}
		answerPoints[answerUuid] = answer.points;
	});
	return answerPoints;
}

export default function scoreQuiz(userSubmission, answers, questions) {
	if (!answers || !questions) {
		return null;
	}

	// We need to generate a md5 hash of the userSubmission array.
	const userSubmissionHash = md5(userSubmission.join(','));

	// Construct the score.
	const SCORE = tallyUserPoints(userSubmission, answers);

	// Construct question > points matrix.
	// Mostly this is used for custom scoring by typology-like quizzes.
	const questionPointsMatrix = constructQuestionPointsMatrix(
		questions,
		userSubmission
	);

	// Construct answer > points matrix.
	const answerPointsMatrix = constructAnswerPointsMatrix(
		answers,
		userSubmission
	);

	// Return the score, hash, user submission, results and quiz data.
	const response = {
		hash: userSubmissionHash,
		score: SCORE,
		userSubmission,
		resultsData: {
			correctAnswersGiven: userSubmission.filter(
				(answerUuid) => answers[answerUuid].correct
			),
			incorrectAnswersGiven: userSubmission.filter(
				(answerUuid) => !answers[answerUuid].correct
			),
			questionPointsMatrix,
			answerPointsMatrix,
		},
		quizData: {
			correctAnswers: getCorrectAnswers(answers),
			incorrectAnswers: getIncorrectAnswers(answers),
		},
	};

	return response;
}
