/**
 * Live feedback helpers for answer highlighting.
 */

/**
 * Whether live feedback should reveal the correct answer after a wrong pick.
 * Applies to single-choice and thermometer questions only. Multiple-choice
 * stays open for additional selections, so correct answers are not revealed early.
 *
 * @param {Object}       options
 * @param {boolean}      options.liveFeedback    Controller liveFeedback flag.
 * @param {string}       options.quizType        Controller quiz type.
 * @param {string}       options.questionType    Question variation type.
 * @param {boolean}      options.hasSelection    User has selected at least one answer.
 * @param {string}       options.questionOutcome Outcome from getQuestionOutcome.
 * @param {boolean|null} options.answerCorrect   This answer's correct flag.
 * @return {boolean} True when this answer should get correct feedback styling.
 */
export function shouldRevealCorrectAnswer({
	liveFeedback,
	quizType,
	questionType,
	hasSelection,
	questionOutcome,
	answerCorrect,
}) {
	if (!liveFeedback || quizType !== 'quiz') {
		return false;
	}
	if (questionType === 'multiple') {
		return false;
	}
	if (!hasSelection) {
		return false;
	}
	if (questionOutcome !== 'incorrect') {
		return false;
	}
	return true === answerCorrect;
}
