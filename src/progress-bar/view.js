/**
 * WordPress Dependencies
 */
import {
	store,
	getContext,
	getElement,
	withScope,
	withSyncEvent,
} from '@wordpress/interactivity';

/**
 * Internal Dependencies
 */
import { getQuestionOutcome } from '../controller/question-outcome';
import { scrollToElement } from '../controller/scroll-utils';
import '../controller/page-navigation';
import {
	getProgressSkipLabel,
	getProgressSkipTargetUuid,
	isAtQuizEnd as quizIsAtEnd,
	showProgressSkip as quizShowProgressSkip,
} from './progress-skip';

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

function outcomeMark(outcome) {
	if (outcome === 'correct') {
		return '✓';
	}
	if (outcome === 'incorrect') {
		return '✗';
	}
	if (outcome === 'answered') {
		return '';
	}
	return '?';
}

function outcomeLabel(outcome, labels) {
	return labels?.[outcome] || labels?.unanswered || outcome;
}

const { state, actions } = store('prc-quiz/controller', {
	state: {
		lastPageInView: false,
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
		get showProgressSkip() {
			const { pages } = getContext();
			return quizShowProgressSkip(pages);
		},
		get isAtQuizEnd() {
			const { displayType, currentPageUuid, pages } = getContext();
			return quizIsAtEnd({
				displayType,
				currentPageUuid,
				pages,
				lastPageInView: state.lastPageInView,
			});
		},
		get progressSkipLabel() {
			const { displayType } = getContext();
			return getProgressSkipLabel({
				isAtEnd: state.isAtQuizEnd,
				displayType,
				labels: state.progressSkipLabels || {},
			});
		},
		/**
		 * Per-question steps for the circles variation.
		 *
		 * Knowledge quizzes (`quizType === 'quiz'`) show correct/incorrect/unsure
		 * marks. Other quiz types only show answered vs unanswered.
		 *
		 * @return {Array<{uuid: string, outcome: string, label: string, mark: string, isCorrect: boolean, isIncorrect: boolean, isUnsure: boolean, isUnanswered: boolean}>} Step descriptors for each active question.
		 */
		get progressSteps() {
			const { selectedAnswers, quizType } = getContext();
			const isKnowledgeQuiz = quizType === 'quiz';
			const labels = state.progressStepLabels || {};
			return state.activeQuestions.map((question) => {
				const selected = selectedAnswers[question.uuid] || [];
				let outcome = 'unanswered';
				if (isKnowledgeQuiz) {
					outcome = getQuestionOutcome(question, selected);
				} else if (selected.length > 0) {
					outcome = 'answered';
				}
				return {
					uuid: question.uuid,
					outcome,
					label: outcomeLabel(outcome, labels),
					mark: outcomeMark(outcome),
					isCorrect: outcome === 'correct',
					isIncorrect: outcome === 'incorrect',
					isUnsure: outcome === 'unsure',
					isUnanswered: outcome === 'unanswered',
				};
			});
		},
	},
	actions: {
		onProgressSkipClick: withSyncEvent(() => {
			const context = getContext();
			const { displayType, pages, firstPageUuid } = context;
			const targetUuid = getProgressSkipTargetUuid({
				isAtEnd: state.isAtQuizEnd,
				firstPageUuid,
				pages,
			});
			if (!targetUuid) {
				return;
			}

			if ('scrollable' === displayType) {
				const { ref } = getElement();
				const root =
					ref?.closest('.wp-block-prc-quiz-controller') || document;
				scrollToElement(
					root.querySelector(`[data-page-uuid="${targetUuid}"]`)
				);
				return;
			}

			actions.goToPage(targetUuid);
			actions.saveQuizProgress();
		}),
	},
	callbacks: {
		onProgressBarInit: () => {
			const { pages } = getContext();
			const lastUuid = pages?.[pages.length - 1];
			if (
				!lastUuid ||
				typeof window.IntersectionObserver === 'undefined'
			) {
				return;
			}
			const { ref } = getElement();
			const root =
				ref?.closest('.wp-block-prc-quiz-controller') || document;
			const lastPage = root.querySelector(
				`[data-page-uuid="${lastUuid}"]`
			);
			if (!lastPage) {
				return;
			}
			const observer = new window.IntersectionObserver(
				withScope((entries) => {
					state.lastPageInView = Boolean(entries[0]?.isIntersecting);
				}),
				{ threshold: 0 }
			);
			observer.observe(lastPage);
		},
	},
});
