/**
 * Internal Dependencies
 */
import {
	formatPercent,
	padDemoBreakValues,
	toAnswersArray,
	toHtmlString,
	toQuestionsArray,
} from './utils';

/**
 * Resolve question copy from editor or frontend data shapes.
 *
 * @param {Object} question Question record.
 * @return {string} Question HTML or text.
 */
function questionText(question) {
	return toHtmlString(question?.text || question?.question);
}

/**
 * Resolve answer copy from editor or frontend data shapes.
 *
 * @param {Object} answer Answer record.
 * @return {string} Answer display text.
 */
function answerText(answer) {
	return toHtmlString(answer?.resultsLabel || answer?.text || answer?.answer);
}

/**
 * Whether the user's selection matches the correct answers exactly.
 *
 * @param {Array} correctAnswers      Answers marked correct.
 * @param {Array} userSelectedAnswers Answers the user selected.
 * @return {boolean|null} True, false, or null for Not sure.
 */
export function isQuestionCorrect(correctAnswers, userSelectedAnswers) {
	if (
		userSelectedAnswers.length > 0 &&
		userSelectedAnswers.every((answer) => null === answer.correct)
	) {
		return null;
	}

	if (correctAnswers.length === 0) {
		return false;
	}

	const correctUuids = correctAnswers.map((answer) => answer.uuid).sort();
	const selectedUuids = userSelectedAnswers
		.map((answer) => answer.uuid)
		.sort();

	return (
		correctUuids.length === selectedUuids.length &&
		correctUuids.every(
			(correctUuid, index) => correctUuid === selectedUuids[index]
		)
	);
}

/**
 * Build one-row-per-question data for the Simple results table.
 *
 * @param {Object}       args                    Builder args.
 * @param {Array|Object} args.questions          Quiz questions.
 * @param {Array}        args.userSubmission     Selected answer UUIDs.
 * @param {Function}     [args.sanitizeQuestion] Optional HTML sanitizer.
 * @return {Array} Simple table rows.
 */
export function buildSimpleTableRows({
	questions,
	userSubmission = [],
	sanitizeQuestion = (html) => html || '',
}) {
	const submission = Array.isArray(userSubmission) ? userSubmission : [];

	return toQuestionsArray(questions).map((question) => {
		const answers = toAnswersArray(question.answers);
		const correctAnswers = answers.filter(
			(answer) => true === answer.correct
		);
		const userSelectedAnswers = answers.filter((answer) =>
			submission.includes(answer.uuid)
		);
		const correct = isQuestionCorrect(correctAnswers, userSelectedAnswers);

		return {
			uuid: question.uuid,
			correct,
			showCorrectIcon: true === correct,
			showIncorrectIcon: false === correct,
			question: sanitizeQuestion(questionText(question)),
			selectedAnswer: formatAnswerList(userSelectedAnswers),
			correctAnswer: formatAnswerList(correctAnswers, true),
			demoBreakValues: question.demoBreakValues || [],
		};
	});
}

export const COMPLEX_TABLE_MODE = {
	PERSONAL: 'personal',
	COMMUNITY_GROUP: 'community-group',
};

/**
 * Format a group answer share from a count and submission total.
 *
 * @param {number} count Answer selection count.
 * @param {number} total Group submission total.
 * @return {string} Display percent, or empty when total is not usable.
 */
export function formatGroupPercent(count, total) {
	if (!Number.isFinite(total) || total <= 0) {
		return '';
	}
	const safeCount = Number.isFinite(count) ? count : 0;
	const percent = Math.min(
		100,
		Math.max(0, Math.round((safeCount / total) * 100))
	);
	return formatPercent(percent);
}

/**
 * Count of times a group selected an answer.
 *
 * @param {Object|null} groupTally Parsed group answer tally.
 * @param {string}      answerUuid Answer UUID.
 * @return {number} Count, or 0 when missing.
 */
function groupAnswerCount(groupTally, answerUuid) {
	if (!groupTally || !answerUuid) {
		return 0;
	}
	const count = Number(groupTally.answers?.[answerUuid] ?? 0);
	return Number.isFinite(count) ? count : 0;
}

/**
 * Highest group count among a question's answers.
 *
 * @param {Array}       answers    Answer records.
 * @param {Object|null} groupTally Parsed group answer tally.
 * @return {number} Max count.
 */
function maxGroupAnswerCount(answers, groupTally) {
	return answers.reduce((max, answer) => {
		const count = groupAnswerCount(groupTally, answer.uuid);
		return count > max ? count : max;
	}, 0);
}

/**
 * Build one-row-per-answer data for the Complex results table.
 *
 * @param {Object}       args                    Builder args.
 * @param {Array|Object} args.questions          Quiz questions.
 * @param {Array}        args.userSubmission     Selected answer UUIDs.
 * @param {Array}        args.demoBreakLabels    Extra demographic column labels.
 * @param {string}       [args.mode]             `personal` or `community-group`.
 * @param {Object|null}  [args.groupTally]       Parsed group answer tally.
 * @param {Function}     [args.sanitizeQuestion] Optional HTML sanitizer.
 * @return {Array} Complex table rows.
 */
export function buildComplexTableRows({
	questions,
	userSubmission = [],
	demoBreakLabels = [],
	mode = COMPLEX_TABLE_MODE.PERSONAL,
	groupTally = null,
	sanitizeQuestion = (html) => html || '',
}) {
	const submission = Array.isArray(userSubmission) ? userSubmission : [];
	const labels = Array.isArray(demoBreakLabels) ? demoBreakLabels : [];
	const isCommunityGroup = COMPLEX_TABLE_MODE.COMMUNITY_GROUP === mode;

	return toQuestionsArray(questions).flatMap((question) => {
		const answers = toAnswersArray(question.answers);
		const correctAnswers = answers.filter(
			(answer) => true === answer.correct
		);
		const userSelectedAnswers = answers.filter((answer) =>
			submission.includes(answer.uuid)
		);
		const questionCorrect = isQuestionCorrect(
			correctAnswers,
			userSelectedAnswers
		);
		const sanitizedQuestion = sanitizeQuestion(questionText(question));
		const pluralityCount = isCommunityGroup
			? maxGroupAnswerCount(answers, groupTally)
			: 0;

		return answers.map((answer, index) => {
			const isSelected = submission.includes(answer.uuid);
			const isCorrectSelection =
				!isCommunityGroup && isSelected && true === answer.correct;
			const isIncorrectSelection =
				!isCommunityGroup && isSelected && false === answer.correct;
			const count = isCommunityGroup
				? groupAnswerCount(groupTally, answer.uuid)
				: 0;
			const isGroupPlurality =
				isCommunityGroup &&
				pluralityCount > 0 &&
				count === pluralityCount;

			const row = {
				uuid: answer.uuid,
				questionUuid: question.uuid,
				question: sanitizedQuestion,
				isFirst: 0 === index,
				isLast: index === answers.length - 1,
				answerText: answerText(answer),
				isSelected,
				isCorrectSelection,
				isIncorrectSelection,
				showCorrectIcon: isCorrectSelection,
				showIncorrectIcon: isIncorrectSelection,
				questionCorrect,
				populationPercent: formatPercent(answer.populationPercent),
				demoBreakValues: padDemoBreakValues(
					answer.demoBreakValues,
					labels.length
				).map((value, labelIndex) => ({
					id: `${answer.uuid || index}-demo-${labelIndex}`,
					label: labels[labelIndex] || '',
					value: formatPercent(value),
				})),
			};

			if (isCommunityGroup) {
				row.isGroupPlurality = isGroupPlurality;
				row.showGroupAnswerIcon = isGroupPlurality;
				row.groupPercent = formatGroupPercent(count, groupTally?.total);
			}

			return row;
		});
	});
}

/**
 * Join answer labels for the Simple table cells.
 *
 * @param {Array}   answers          Answer records.
 * @param {boolean} [emptyIsCorrect] Whether an empty list means no correct answer.
 * @return {string} Display text.
 */
function formatAnswerList(answers, emptyIsCorrect = false) {
	if (!answers.length) {
		return emptyIsCorrect ? 'No correct answer' : 'No answer selected';
	}
	return answers.map(answerText).join(', ');
}
