/**
 * WordPress Dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

const ELEMENT_NODE = 1;

/**
 * Allow a small set of rich-text tags in question copy for results display.
 * Strips everything else before injecting via the watch callback.
 *
 * @param {string} html Raw question HTML.
 * @return {string} Sanitized HTML.
 */
const sanitizeQuestionHtml = (html) => {
	if (typeof html !== 'string' || !html) {
		return '';
	}
	if (typeof document === 'undefined') {
		return html;
	}
	const template = document.createElement('template');
	template.innerHTML = html;
	const allowed = new Set([
		'STRONG',
		'B',
		'EM',
		'I',
		'A',
		'BR',
		'SPAN',
		'SUP',
		'SUB',
	]);
	const walk = (node) => {
		[...node.childNodes].forEach((child) => {
			if (child.nodeType === ELEMENT_NODE) {
				if (!allowed.has(child.tagName)) {
					while (child.firstChild) {
						node.insertBefore(child.firstChild, child);
					}
					node.removeChild(child);
					return;
				}
				[...child.attributes].forEach((attr) => {
					const name = attr.name.toLowerCase();
					if (
						name.startsWith('on') ||
						(name === 'href' &&
							!/^(https?:|mailto:|#)/i.test(attr.value))
					) {
						child.removeAttribute(attr.name);
					} else if (name !== 'href' && name !== 'class') {
						child.removeAttribute(attr.name);
					}
				});
				walk(child);
			}
		});
	};
	walk(template.content);
	return template.innerHTML;
};

const { state } = store('prc-quiz/controller', {
	state: {
		get demoBreakHeaders() {
			const context = getContext();
			const { quizId } = context;
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
			const { userSubmission } = userScore;
			const quizData = state[`quiz_${quizId}`];
			const { questions } = quizData;

			// Convert questions object to array since questions appears to be an object with UUIDs as keys
			const questionsArray = Object.values(questions);

			return questionsArray.map((question) => {
				const {
					uuid: questionUuid,
					text,
					answers,
					demoBreakValues,
				} = question;

				// Convert answers object to array if it's also an object
				const answersArray = Array.isArray(answers)
					? answers
					: Object.values(answers);

				// Get all correct answers instead of just the first one
				const correctAnswers = answersArray.filter(
					(answer) => true === answer.correct
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

				// Determine if the user got the question correct.
				// Returns true | false | null (Not sure / neutral — neither icon).
				// Exact match of correct answers; pure Not sure selections are null.
				const isCorrect = () => {
					if (
						userSelectedAnswers.length > 0 &&
						userSelectedAnswers.every(
							(answer) => null === answer.correct
						)
					) {
						return null;
					}

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
							(correctUuid, index) =>
								correctUuid === selectedUuids[index]
						)
					);
				};

				const correct = isCorrect();

				return {
					uuid: questionUuid,
					correct,
					showCorrectIcon: true === correct,
					showIncorrectIcon: false === correct,
					question: sanitizeQuestionHtml(text),
					selectedAnswer: formatSelectedAnswers(),
					correctAnswer: formatCorrectAnswers(),
					demoBreakValues: demoBreakValues || [],
				};
			});
		},
	},
	callbacks: {
		/**
		 * Render sanitized question HTML into the results-table cell.
		 * Interactivity API has no data-wp-html directive; use a watch instead.
		 */
		renderQuestionHtml() {
			const { ref } = getElement();
			if (!ref) {
				return;
			}
			const context = getContext();
			const html = context?.row?.question ?? '';
			if (ref.innerHTML !== html) {
				ref.innerHTML = html;
			}
		},
	},
});
