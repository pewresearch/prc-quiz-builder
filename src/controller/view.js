/**
 * WordPress Dependencies
 */
import {
	store,
	getElement,
	getContext,
	getServerContext,
	getServerState,
	withScope,
	withSyncEvent,
} from '@wordpress/interactivity';

/**
 * Internal Dependencies
 */
import scoreQuiz from './scoring';

/**
 * Hoisted Dependencies
 */
const { wp, location, localStorage } = window;
const { url, apiFetch } = wp;
const { addQueryArgs, getQueryArg, getPathAndQueryString } = url;

const { state, actions } = store('prc-quiz/controller', {
	state: {
		currentSessionArchetypes: [],
		get quizId() {
			const { quizId } = getContext();
			return quizId;
		},
		get nonce() {
			const { nonce } = getContext();
			return nonce;
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
			const { displayType } = getContext();
			return 'scrollable' === displayType
				? true
				: !state.displayResults && !state.displayGroupResults;
		},
		get displayGroupResults() {
			const { displayGroupResults } = getContext();
			return displayGroupResults;
		},
		/**
		 * Check if user has given consent for functional cookies
		 */
		get hasConsentForCookies() {
			// Check if WP Consent API is available and user has given consent
			if (typeof window.wp_has_consent === 'function') {
				return window.wp_has_consent('functional');
			}
			// If consent API is not available, assume consent (for backwards compatibility)
			return true;
		},
		/**
		 * Get quiz progress data (returns JSON object if available)
		 */
		get quizProgress() {
			const data = state.cookie;
			// Check if it's a valid quiz progress object
			if (data && typeof data === 'object' && data.quiz_id) {
				return data;
			}
			return null;
		},

		/**
		 * Check if current quiz has saved progress
		 */
		get hasQuizProgress() {
			const { quizId } = getContext();
			const data = state.quizProgress;
			return data && data.quiz_id === quizId;
		},

		get cookie() {
			const name = `prc-quiz-builder`;

			// Only try to read cookie if user has consented or consent API is not available
			if (!state.hasConsentForCookies) {
				return null;
			}

			const nameEQ = name + '=';
			const ca = document.cookie.split(';');
			for (let i = 0; i < ca.length; i++) {
				let c = ca[i];
				while (c.charAt(0) === ' ') c = c.substring(1, c.length);
				if (c.indexOf(nameEQ) === 0) {
					const cookieValue = c.substring(nameEQ.length, c.length);
					const decodedValue = decodeURIComponent(cookieValue);

					// Try to parse as JSON first
					try {
						return JSON.parse(decodedValue);
					} catch (e) {
						// If JSON parsing fails, return as string
						return decodedValue;
					}
				}
			}
			return null;
		},
	},
	actions: {
		scoreQuiz: () => {
			const { userSubmission } = getContext();
			const { answers, questions } = state;
			return scoreQuiz(userSubmission, answers, questions);
		},
		/**
		 * Checks the element for any available animations and dispatches them with the animations store.
		 */
		runAnimation: () => {
			const { ref } = getElement();
			const animationStore = store('prc-block/animation');
			const animationElements = ref.querySelectorAll(
				'.wp-block-prc-block-animation'
			);
			if (animationElements.length) {
				animationElements.forEach((element) => {
					const animationId = element.getAttribute('id');
					const { parentElement } = element;
					const isHidden =
						null !== parentElement?.getAttribute('hidden');
					if (animationId && !isHidden) {
						animationStore.state[animationId].enabled = true;
					}
				});
			}
		},
		onStartQuizClick: withSyncEvent((event) => {
			const context = getContext();
			const { uuid, currentPageUuid, pages } = context;
			// Set the current page uuid to the next page uuid.
			context.currentPageUuid = pages[1];
			actions.saveQuizProgress();
		}),
		onNextPageClick: withSyncEvent((event) => {
			const context = getContext();
			const { uuid, currentPageUuid, pages } = context;
			// Find the index of the current page in the pages array.
			const currentPageIndex = pages.indexOf(currentPageUuid);
			// Set the current page uuid to the next page uuid.
			context.currentPageUuid = pages[currentPageIndex + 1];
			actions.saveQuizProgress();
		}),
		onPreviousPageClick: withSyncEvent((event) => {
			const context = getContext();
			const { uuid, currentPageUuid, pages } = context;
			// Find the index of the current page in the pages array.
			const currentPageIndex = pages.indexOf(currentPageUuid);
			// Set the current page uuid to the previous page uuid.
			context.currentPageUuid = pages[currentPageIndex - 1];
			actions.saveQuizProgress();
		}),
		onSubmitQuizClick: withSyncEvent((event) => {
			actions.submitQuiz();
		}),
		onResetQuizClick: withSyncEvent((event) => {
			const context = getContext();
			const { quizUrl, displayResults } = context;
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
			context.submitted = false;
			context.processing = false;
			context.displayResults = false;
			context.selectedAnswers = {};
			context.userSubmission = {};
			context.userScore = {};
			context.currentPageUuid = context.firstPageUuid;
		},

		clearCookie: () => {
			const name = `prc-quiz-builder`;
			document.cookie =
				name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
		},

		setCookie: (value) => {
			const { quizId } = getContext();
			const name = `prc-quiz-builder`;

			// Check consent before setting cookie
			if (!state.hasConsentForCookies) {
				return false;
			}

			// Convert value to string for storage
			let cookieValue;
			if (typeof value === 'object' && value !== null) {
				// If it's an object, JSON stringify it
				cookieValue = encodeURIComponent(JSON.stringify(value));
			} else {
				// If it's a primitive, convert to string
				cookieValue = encodeURIComponent(String(value));
			}

			// Set cookie with consent
			const d = new Date();
			d.setTime(d.getTime() + 30 * 24 * 60 * 60 * 1000);
			const expires = 'expires=' + d.toUTCString();
			document.cookie =
				name + '=' + cookieValue + ';' + expires + ';path=/';
			return true;
		},

		/**
		 * Save quiz progress data as JSON object
		 */
		saveQuizProgress: (score = null) => {
			const { selectedAnswers, currentPageUuid, quizId } = getContext();
			const quizData = {
				quiz_id: quizId,
				selectedAnswers: selectedAnswers,
				currentPageUuid: currentPageUuid,
				timestamp: Date.now(),
			};
			if (score) {
				quizData.score = score;
			}
			return actions.setCookie(quizData);
		},
		/**
		 * Navigate the user to the results view and submit the user's results to the database.
		 */
		*submitQuiz() {
			const context = getContext();
			const {
				answerThreshold,
				displayType,
				userScore,
				quizId,
				nonce,
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

			// If the user has not answered enough questions we prompt them to reset the quiz, or in the case
			// of paginated quizzes, go back to the first page.
			if (!readyForSubmission) {
				const shouldReset = confirm(
					`You must answer ${answerThreshold} questions to submit the quiz.\n\nWould you like to reset the quiz and start over?`
				);

				if (shouldReset) {
					actions.resetQuiz();
				} else if ('scrollable' !== displayType) {
					const shouldGoToFirstPage = confirm(
						`Would you like to go back to the first page to answer more questions?`
					);
					if (shouldGoToFirstPage) {
						actions.goBackToFirstPage();
					}
				}
				return; // Stop execution here.
			}

			const requestArgs = {
				quizId,
				nonce,
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
					// Always display the results page.
					context.displayResults = true;

					// If this is a preview, we don't want to submit the quiz.
					if (isPreview) {
						context.readyForSubmission = false;
						context.processing = false;
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
						context.readyForSubmission = false;
						context.processing = false;
						if (newScore) {
							context.userScore = {
								...context.userScore,
								score: newScore,
							};
						}
						return;
					}

					const router = yield import(
						'@wordpress/interactivity-router'
					);
					// Clear the cookie before navigating to the results page.
					actions.clearCookie();
					// After checking the allow submissions and clearing the cookie, navigate to the results page.
					router.actions.navigate(`${quizUrl}results/${hash}`);
					// Push the hash to the current session archetypes array.
					state.currentSessionArchetypes.push(hash);

					// Store the submission in the database, pass the requestArgs and requestBody to the
					// quiz builder REST API.
					apiFetch({
						path: addQueryArgs(
							'/prc-api/v3/quiz/submit',
							requestArgs
						),
						method: 'POST',
						data: requestBody,
					})
						.then((response) => {
							console.log('submitQuiz response ->', response);
						})
						.catch((error) => {
							console.error('submitQuiz error ->', error);
						})
						.finally(() => {
							if (newScore) {
								context.userScore = {
									...context.userScore,
									score: newScore,
								};
							}
							context.processing = false;
							context.readyForSubmission = false;
						});
				}),
				1000
			);
		},
	},
	callbacks: {
		onInit: () => {
			const context = getContext();
			context.processing = true;
			// Check if the user has a cookie for this quiz, and if so check if currentPageUuid is set, if so, set context to it.
			setTimeout(
				withScope(() => {
					context.processing = false;
					context.loaded = true;
				}),
				1500
			);
		},
		/**
		 * This runs only once, when a user has successfully crossed the answer threshold and any other readyForSubmission conditions are met.
		 */
		onScrollableSubmit: withSyncEvent(() => {
			const context = getContext();
			const { submitted, readyForSubmission, displayType, processing } =
				context;

			if (
				'scrollable' !== displayType ||
				!readyForSubmission ||
				processing
			) {
				return;
			}

			setTimeout(
				withScope(() => {
					actions.submitQuiz();
				}),
				1200
			);
		}),
		/**
		 * Constructs a flat array of the user's selected answers for submission.
		 */
		updateUserSubmission: () => {
			const context = getContext();
			const { selectedAnswers, answerThreshold } = context;

			// selectedAnswers structure: { questionUuid: [answerUuid1, answerUuid2, ...], ... }
			// API expects: { answers: [answerUuid1, answerUuid2, answerUuid3, ...] }
			// Flatten all selected answers from all questions into a single array
			const answersArray = Object.values(selectedAnswers || {}).flat();

			context.userSubmission = answersArray;

			// If the user has exceeded or met the answerThreshold we want to signal readyForSubmission.
			if (answersArray.length >= answerThreshold) {
				context.readyForSubmission = true;
			}
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

			const before = context.userScore;

			const after = actions.scoreQuiz();

			context.userScore = after;
		},
	},
});
