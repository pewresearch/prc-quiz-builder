/**
 * WordPress Dependencies
 */
import {
	store,
	getElement,
	getContext,
	withScope,
	withSyncEvent,
} from '@wordpress/interactivity';

/**
 * Internal Dependencies
 */
import scoreQuiz from './scoring';
import { shouldDisplayPages } from './display-pages';
import { scrollToElement } from './scroll-utils';
import {
	consumeSkipResultsSpinner,
	revealResults,
} from '../results/results-countdown';
import { SOUND_EFFECT, playQuizSound } from './sound-effects';
import './progress-storage';
import './submission-recovery';
import './share';
import './run-animation';
import './page-navigation';
import './submission-sync';

const FLUID_BREAKPOINT_PX = 782;

const { state, actions } = store('prc-quiz/controller', {
	state: {
		currentSessionArchetypes: [],
		get quizId() {
			const { quizId } = getContext();
			return quizId;
		},
		get goupId() {
			const { groupId } = getContext();
			return groupId;
		},
		get hasGroup() {
			const { groupId } = getContext();
			return groupId ? true : false;
		},
		get groupResultsLinkText() {
			const { groupId } = getContext();
			return groupId ? "View your group's results." : '';
		},
		get groupResultsLinkUrl() {
			const { groupId, quizUrl } = getContext();
			return groupId ? `${quizUrl}group/${groupId}/results/` : '';
		},
		get quizData() {
			const { quizId } = getContext();
			return state[`quiz_${quizId}`];
		},
		get questions() {
			const { quizId } = getContext();
			return state[`quiz_${quizId}`].questions;
		},
		get answers() {
			const { quizId } = getContext();
			const quizData = state[`quiz_${quizId}`];
			return Object.values(quizData.questions).reduce((acc, question) => {
				return {
					...acc,
					...question.answers,
				};
			}, {});
		},
		/**
		 * For prc-block/question and prc-block/answer blocks.
		 * This determines if the block has a conditionalDisplay flag and if the given answer is selected.
		 * If the answer is selected, the block will be displayed.
		 * If the answer is not selected, the block will be hidden.
		 */
		get isConditionalAnswerSelected() {
			const context = getContext();
			const {
				conditionalDisplay,
				conditionalAnswerUuid,
				selectedAnswers,
				uuid,
				quizId,
			} = context;
			if (!conditionalDisplay || !conditionalAnswerUuid) return false;
			// Check if the conditionalAnswerUuid is actually a question uuid, if so
			// then lets just check to see if the question has any selected answers.
			if (state[`quiz_${quizId}`].questions[conditionalAnswerUuid]) {
				const questionUuids = Object.keys(
					state[`quiz_${quizId}`].questions
				);
				return (
					questionUuids.includes(conditionalAnswerUuid) &&
					selectedAnswers[conditionalAnswerUuid].length > 0
				);
			}
			// construct a flat array of selected answers
			const selectedAnswersArray = Object.values(selectedAnswers).flat();
			return (
				selectedAnswersArray.includes(conditionalAnswerUuid) ||
				selectedAnswersArray.includes(uuid)
			);
		},
		get displayResults() {
			const { displayResults } = getContext();
			return displayResults;
		},
		get displayPages() {
			const {
				displayType,
				configuredDisplayType,
				displayResults,
				displayGroupResults,
			} = getContext();
			return shouldDisplayPages({
				displayType,
				configuredDisplayType,
				displayResults,
				displayGroupResults,
			});
		},
		get displayGroupResults() {
			const { displayGroupResults } = getContext();
			return displayGroupResults;
		},
	},
	actions: {
		scoreQuiz: () => {
			const { userSubmission } = getContext();
			const { answers, questions } = state;
			return scoreQuiz(userSubmission, answers, questions);
		},
		applyDisplayType: () => {
			const context = getContext();
			const { ref } = getElement();
			const root = ref?.closest('.wp-block-prc-quiz-controller') || ref;
			const { configuredDisplayType } = context;

			let resolvedType = configuredDisplayType;
			if ('fluid' === configuredDisplayType) {
				resolvedType =
					window.innerWidth < FLUID_BREAKPOINT_PX
						? 'scrollable'
						: 'paged';
			}

			const hideNextButtons = 'scrollable' === resolvedType;
			context.displayType = resolvedType;

			root?.querySelectorAll(
				'.prc-quiz-next-page-button-wrapper'
			).forEach((el) => {
				if (hideNextButtons) {
					el.setAttribute('hidden', 'true');
				} else {
					el.removeAttribute('hidden');
				}
			});
		},
		onStartQuizClick: withSyncEvent((event) => {
			const context = getContext();
			const { ref } = getElement();
			playQuizSound(context, SOUND_EFFECT.start, event.target);
			const { pages, displayType, configuredDisplayType } = context;
			const root = ref?.closest('.wp-block-prc-quiz-controller') || ref;
			let resolvedDisplayType = displayType;

			if ('fluid' === configuredDisplayType) {
				resolvedDisplayType =
					window.innerWidth < FLUID_BREAKPOINT_PX
						? 'scrollable'
						: 'paged';
			}
			actions.goToPage(pages[1]);
			actions.saveQuizProgress();
			if ('paged' !== resolvedDisplayType) {
				const firstPage = root?.querySelector(
					`[data-page-uuid="${pages[1]}"]`
				);
				scrollToElement(firstPage);
			}
		}),
		onNextPageClick: withSyncEvent((event) => {
			const context = getContext();
			const { currentPageUuid, pages } = context;
			playQuizSound(context, SOUND_EFFECT.nextPage, event.target);
			// Find the index of the current page in the pages array.
			const currentPageIndex = pages.indexOf(currentPageUuid);
			actions.goToPage(pages[currentPageIndex + 1]);
			actions.saveQuizProgress();
		}),
		onPreviousPageClick: withSyncEvent(() => {
			const context = getContext();
			const { currentPageUuid, pages } = context;
			// Find the index of the current page in the pages array.
			const currentPageIndex = pages.indexOf(currentPageUuid);
			actions.goToPage(pages[currentPageIndex - 1]);
			actions.saveQuizProgress();
		}),
		onSubmitQuizClick: withSyncEvent((event) => {
			const context = getContext();
			playQuizSound(context, SOUND_EFFECT.submit, event.target);
			actions.submitQuiz({ triggerMailchimp: true });
		}),
		onRetryPendingSubmissionClick: withSyncEvent((event) => {
			event.preventDefault();
			actions.retryPendingSubmission();
		}),
		onResetQuizClick: withSyncEvent((event) => {
			const context = getContext();
			const { quizUrl, displayResults } = context;
			playQuizSound(context, SOUND_EFFECT.reset, event.target);
			// If the user is on the results page, we should just go back to the quiz url.
			if (displayResults) {
				window.location.href = quizUrl;
			} else {
				actions.resetQuiz();
			}
			actions.saveQuizProgress();
		}),
		/**
		 * A softer reset, this sends the user back to the first page.
		 */
		goBackToFirstPage: () => {
			const context = getContext();
			context.processing = false;
			context.submitted = false;
			context.currentPageUuid = context.firstPageUuid;
		},
		/**
		 * Reset's the quiz state back to the initial state.
		 */
		resetQuiz: () => {
			const context = getContext();
			const pendingSubmission = actions.getPendingSubmission();
			context.submitted = false;
			context.processing = false;
			context.displayResults = false;
			context.resultsCountdown = null;
			context.readyForSubmission = false;
			context.selectedAnswers = {};
			context.userSubmission = [];
			context.userScore = {};
			context.currentPageUuid = context.firstPageUuid;
			if (pendingSubmission) {
				actions.clearPendingSubmission(pendingSubmission, context);
				return;
			}
			context.submissionPending = false;
			context.pendingSubmissionHash = '';
			context.submissionErrorMessage = '';
		},

		/**
		 * Navigate the user to the results view and submit the user's results to the database.
		 *
		 * @param {Object}  [options]
		 * @param {boolean} [options.triggerMailchimp] Submit embedded Mailchimp form when valid.
		 */
		*submitQuiz({ triggerMailchimp = false } = {}) {
			const context = getContext();

			if (context.processing) {
				return;
			}

			const {
				answerThreshold,
				displayType,
				userScore,
				quizId,
				groupsEnabled,
				groupId,
				quizUrl,
				readyForSubmission,
				allowSubmissions,
				isPreview,
			} = context;
			const { hash, userSubmission, score } = userScore;
			let newScore = null;
			let requestBody = {
				hash,
				userSubmission,
				score,
			};

			context.processing = true;
			if (undefined !== score && null !== score) {
				actions.saveQuizProgress(score);
			}

			// If the user has not answered enough questions we prompt them to reset the quiz, or in the case
			// of paginated quizzes, go back to the first page.
			if (!readyForSubmission) {
				// eslint-disable-next-line no-alert
				const shouldReset = window.confirm(
					`You must answer ${answerThreshold} questions to submit the quiz.\n\nWould you like to reset the quiz and start over?`
				);

				if (shouldReset) {
					actions.resetQuiz();
				} else if ('scrollable' !== displayType) {
					// eslint-disable-next-line no-alert
					const shouldGoToFirstPage = window.confirm(
						`Would you like to go back to the first page to answer more questions?`
					);
					if (shouldGoToFirstPage) {
						actions.goBackToFirstPage();
					}
				}
				context.processing = false;
				return; // Stop execution here.
			}

			const { currentPageUuid, pages } = context;
			const { ref } = getElement();
			const root =
				ref?.closest('.wp-block-prc-quiz-controller') || document;
			const mailchimpFormSelector =
				'[data-wp-interactive="prc-block/mailchimp-form"] form[data-wp-interactive="prc-block/form"]';
			const findMailchimpFormInPage = (pageUuid) => {
				if (!pageUuid) {
					return null;
				}
				const pageEl = root.querySelector(
					`[data-page-uuid="${pageUuid}"]`
				);
				return pageEl?.querySelector(mailchimpFormSelector) ?? null;
			};
			let formEl = findMailchimpFormInPage(currentPageUuid);
			if (!formEl && pages?.length) {
				formEl = findMailchimpFormInPage(pages[pages.length - 1]);
			}
			if (!formEl) {
				formEl = root.querySelector(mailchimpFormSelector);
			}
			const emailEl = formEl?.querySelector(
				'input[type="email"], input[name="emailAddress"], input[name="email"]'
			);
			const email = emailEl?.value?.trim() || '';
			const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
			if (!isPreview && triggerMailchimp && formEl && emailValid) {
				yield new Promise((resolve) => {
					const finish = () => {
						formEl.removeEventListener(
							'prc-form/submitted',
							onSubmitted
						);
						clearTimeout(timeoutId);
						resolve();
					};
					const onSubmitted = (event) => {
						if (event?.detail?.aborted) {
							formEl.requestSubmit();
							return;
						}
						finish();
					};
					const timeoutId = setTimeout(finish, 60000);
					formEl.addEventListener('prc-form/submitted', onSubmitted);
					if (emailEl && emailEl.value !== email) {
						emailEl.value = email;
					}
					formEl.requestSubmit();
				});
			}

			const requestArgs = {
				quizId,
			};
			if (groupsEnabled && groupId) {
				requestArgs.groupId = groupId;
			}

			// Any block, but specifically those inside results, can inject a new
			// function into the quiz controller state called parseSubmissionRequest.
			// This allows other quizzes, like Political Typology, to utilize their own
			// scoring logic.
			if (actions.parseSubmissionRequest) {
				requestBody = yield actions.parseSubmissionRequest(requestBody);
				if (score !== requestBody.score) {
					newScore = requestBody.score;
				}
			}

			setTimeout(
				withScope(function* () {
					// If this is a preview, we don't want to submit the quiz.
					if (isPreview) {
						yield revealResults(context);
						context.readyForSubmission = false;
						if (newScore) {
							context.userScore = {
								...context.userScore,
								score: newScore,
							};
						}
						return;
					}

					// Stop execution if this user has already submitted a quiz with the same archetype
					// OR if the quiz does not allow submissions.
					if (
						state.currentSessionArchetypes.includes(hash) ||
						!allowSubmissions
					) {
						yield revealResults(context);
						context.readyForSubmission = false;
						if (newScore) {
							context.userScore = {
								...context.userScore,
								score: newScore,
							};
						}
						return;
					}

					const existingPendingSubmission =
						actions.getPendingSubmission();
					const pendingSubmission =
						existingPendingSubmission?.hash === hash
							? existingPendingSubmission
							: actions.createPendingSubmission({
									quizId,
									hash,
									requestArgs,
									requestBody,
									destinationUrl: `${quizUrl}results/${hash}`,
								});

					yield actions.submitPendingSubmission(
						pendingSubmission,
						newScore
					);
				}),
				1000
			);
		},
	},
	callbacks: {
		onInit: () => {
			const { ref } = getElement();
			const context = getContext();
			// The countdown already played before this results page opened.
			// Always consume the flag so a later visit cannot skip the spinner.
			const skipResultsSpinner = consumeSkipResultsSpinner(
				context.quizId
			);
			if (!context.displayResults || !skipResultsSpinner) {
				context.processing = true;
			}

			const root =
				ref?.closest('.wp-block-prc-quiz-controller') || document;
			const embeddedForm = root.querySelector(
				'[data-wp-interactive="prc-block/mailchimp-form"] form[data-wp-interactive="prc-block/form"]'
			);
			if (embeddedForm) {
				embeddedForm.addEventListener('keydown', (event) => {
					if (event.key !== 'Enter') {
						return;
					}
					if ('TEXTAREA' === event.target?.tagName) {
						return;
					}
					event.preventDefault();
				});
			}

			actions.applyDisplayType();

			if (context.displayResults && skipResultsSpinner) {
				actions.restorePendingSubmission();
				context.loaded = true;
				return;
			}

			// Check if the user has a cookie for this quiz, and if so check if currentPageUuid is set, if so, set context to it.
			setTimeout(
				withScope(() => {
					actions.restorePendingSubmission();
					context.processing = false;
					context.loaded = true;
				}),
				1500
			);
		},
		onFluidViewportChange: () => {
			const { configuredDisplayType } = getContext();
			if ('fluid' !== configuredDisplayType) {
				return;
			}
			actions.applyDisplayType();
		},
		/**
		 * This runs only once, when a user has successfully crossed the answer threshold and any other readyForSubmission conditions are met.
		 */
		onScrollableSubmit: withSyncEvent(() => {
			const context = getContext();
			const {
				readyForSubmission,
				displayType,
				processing,
				submissionPending,
				allowSubmissions,
			} = context;

			if (
				'scrollable' !== displayType ||
				allowSubmissions ||
				!readyForSubmission ||
				processing ||
				submissionPending
			) {
				return;
			}

			setTimeout(
				withScope(() => {
					const currentContext = getContext();
					const {
						readyForSubmission: isReady,
						displayType: currentDisplayType,
						processing: isProcessing,
						submissionPending: isPending,
						allowSubmissions: submissionsEnabled,
					} = currentContext;

					if (
						'scrollable' !== currentDisplayType ||
						submissionsEnabled ||
						!isReady ||
						isProcessing ||
						isPending
					) {
						return;
					}

					actions.submitQuiz();
				}),
				1200
			);
		}),
		updateUserSubmission: () => {
			actions.syncUserSubmission();
		},
		/**
		 * As the user updates their answers, we calculate a new score.
		 */
		updateUserScore: () => {
			const context = getContext();
			const { userSubmission, quizId, displayResults } = context;
			// If displayResults is set to true we don't need to keep calculating the score.
			if (displayResults) {
				return;
			}
			if (!userSubmission) {
				return;
			}
			if (!quizId) {
				return;
			}
			// If the user has not answered any questions, don't calculate a score yet, why bother.
			if (0 === userSubmission.length) {
				return;
			}

			const after = actions.scoreQuiz();

			context.userScore = after;
		},
	},
});
