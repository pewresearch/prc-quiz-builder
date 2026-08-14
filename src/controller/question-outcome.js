/**
 * Per-question outcome for knowledge quizzes.
 *
 * @typedef {'correct'|'incorrect'|'unsure'|'unanswered'} QuestionOutcome
 */

/**
 * Resolve whether the user's selection for a question is correct, incorrect,
 * unsure (Not sure / null), or unanswered.
 *
 * Correct means the selected answer UUIDs exactly match the set of answers
 * marked correct: true. Selecting any null answer without a wrong answer
 * yields unsure. Anything else with a selection is incorrect.
 *
 * @param {Object}   question       Question state entry with answers map.
 * @param {string[]} selectedUuids  Selected answer UUIDs for this question.
 * @return {QuestionOutcome} Outcome label.
 */
export function getQuestionOutcome(question, selectedUuids) {
	if (!selectedUuids?.length) {
		return 'unanswered';
	}

	const answers = Object.values(question?.answers || {});
	if (!answers.length) {
		return 'unanswered';
	}

	const selected = answers.filter((answer) =>
		selectedUuids.includes(answer.uuid)
	);
	if (!selected.length) {
		return 'unanswered';
	}

	const hasIncorrect = selected.some((answer) => false === answer.correct);
	const hasUnsure = selected.some((answer) => null === answer.correct);
	const hasCorrect = selected.some((answer) => true === answer.correct);

	if (hasUnsure && !hasIncorrect && !hasCorrect) {
		return 'unsure';
	}

	const correctUuids = answers
		.filter((answer) => true === answer.correct)
		.map((answer) => answer.uuid)
		.sort();
	const selectedSorted = [...selectedUuids].sort();

	if (
		correctUuids.length > 0 &&
		correctUuids.length === selectedSorted.length &&
		correctUuids.every((uuid, index) => uuid === selectedSorted[index])
	) {
		return 'correct';
	}

	return 'incorrect';
}
