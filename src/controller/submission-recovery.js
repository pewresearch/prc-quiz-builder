/**
 * WordPress Dependencies
 */
import { store, getContext, withScope } from '@wordpress/interactivity';

const { wp, localStorage } = window;
const { apiFetch } = wp;

const PENDING_SUBMISSION_STORAGE_PREFIX =
	'prc-quiz-builder__pending-submission';
const SUBMISSION_RECOVERY_MESSAGE =
	'We could not save your quiz results yet. Your answers are saved in this browser. Please try saving again in a moment.';
const GROUP_SUBMISSION_RECOVERY_MESSAGE =
	'Group results could not be saved — try again. Your answers are saved in this browser.';
const SILENT_RETRY_BASE_DELAY_MS = 60000;
const SILENT_RETRY_JITTER_MS = 10000;
const scheduledSilentRetryKeys = new Set();

const showSubmissionRecoveryBanner = (
	context,
	pendingSubmission,
	message = SUBMISSION_RECOVERY_MESSAGE
) => {
	context.submissionPending = true;
	context.pendingSubmissionHash = pendingSubmission.hash;
	context.submissionErrorMessage = message;
};

const isDefinedScore = (score) => score !== undefined && score !== null;

const hasClientRenderedScore = (context, newScore) => {
	if (isDefinedScore(newScore)) {
		return true;
	}
	return isDefinedScore(context.userScore?.score);
};

const isGroupSubmission = (pendingSubmission) => {
	return Boolean(pendingSubmission?.requestArgs?.groupId);
};

const isGroupSubmissionError = (error, pendingSubmission) => {
	if (isGroupSubmission(pendingSubmission)) {
		return true;
	}
	const code = error?.code || '';
	return [
		'group-submission-error',
		'firebase_not_configured',
		'firebase_error',
	].includes(code);
};

const getPendingSubmissionStorageKey = (quizId, hash = '') => {
	return `${PENDING_SUBMISSION_STORAGE_PREFIX}:${quizId}${hash ? `:${hash}` : ''}`;
};

const getPendingSubmissionStoragePrefix = (quizId) => {
	return `${PENDING_SUBMISSION_STORAGE_PREFIX}:${quizId}:`;
};

const createSubmissionId = () => {
	if (window.crypto?.randomUUID) {
		return window.crypto.randomUUID();
	}
	return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const readPendingSubmission = (quizId, hash = null) => {
	if (!quizId) {
		return null;
	}
	if (hash) {
		try {
			const storedSubmission = localStorage.getItem(
				getPendingSubmissionStorageKey(quizId, hash)
			);
			return storedSubmission ? JSON.parse(storedSubmission) : null;
		} catch (error) {
			return null;
		}
	}
	try {
		let pendingSubmission = null;
		const storagePrefix = getPendingSubmissionStoragePrefix(quizId);
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith(storagePrefix)) {
				const storedSubmission = localStorage.getItem(key);
				const parsedSubmission = storedSubmission
					? JSON.parse(storedSubmission)
					: null;
				if (
					parsedSubmission &&
					(!pendingSubmission ||
						(parsedSubmission.updatedAt || 0) >
							(pendingSubmission.updatedAt || 0))
				) {
					pendingSubmission = parsedSubmission;
				}
			}
		}
		return pendingSubmission;
	} catch (error) {
		return null;
	}
};

const removePendingSubmission = (pendingSubmission) => {
	if (!pendingSubmission?.quizId || !pendingSubmission?.hash) {
		return false;
	}
	try {
		localStorage.removeItem(
			getPendingSubmissionStorageKey(
				pendingSubmission.quizId,
				pendingSubmission.hash
			)
		);
		return true;
	} catch (error) {
		return false;
	}
};

const writePendingSubmission = (pendingSubmission) => {
	if (!pendingSubmission?.quizId || !pendingSubmission?.hash) {
		return false;
	}
	try {
		localStorage.setItem(
			getPendingSubmissionStorageKey(
				pendingSubmission.quizId,
				pendingSubmission.hash
			),
			JSON.stringify(pendingSubmission)
		);
		return true;
	} catch (error) {
		return false;
	}
};

const parseSubmitResponse = async (response) => {
	if (!response || typeof response.json !== 'function') {
		return {};
	}
	try {
		return await response.json();
	} catch (error) {
		return {};
	}
};

const { state, actions } = store('prc-quiz/controller', {
	actions: {
		createPendingSubmission: (submission) => {
			const pendingSubmission = {
				...submission,
				requestBody: {
					...submission.requestBody,
					submissionId:
						submission.requestBody.submissionId ||
						createSubmissionId(),
				},
				attempts: submission.attempts || 0,
				createdAt: submission.createdAt || Date.now(),
				updatedAt: Date.now(),
			};
			writePendingSubmission(pendingSubmission);
			return pendingSubmission;
		},
		clearPendingSubmission: (pendingSubmission, context = getContext()) => {
			removePendingSubmission(pendingSubmission);
			context.submissionPending = false;
			context.pendingSubmissionHash = '';
			context.submissionErrorMessage = '';
		},
		getPendingSubmission: () => {
			const { quizId, pendingSubmissionHash } = getContext();
			return readPendingSubmission(quizId, pendingSubmissionHash);
		},
		restorePendingSubmission: () => {
			const context = getContext();
			const pendingSubmission = actions.getPendingSubmission();
			if (!pendingSubmission || context.displayResults) {
				return;
			}
			if (pendingSubmission.lastError) {
				const message = isGroupSubmissionError(
					pendingSubmission.lastError,
					pendingSubmission
				)
					? GROUP_SUBMISSION_RECOVERY_MESSAGE
					: SUBMISSION_RECOVERY_MESSAGE;
				showSubmissionRecoveryBanner(
					context,
					pendingSubmission,
					message
				);
			}
			actions.scheduleSilentRetry(pendingSubmission);
		},
		handleUnpersistedSubmission: (
			pendingSubmission,
			newScore = null,
			context = getContext()
		) => {
			if (isDefinedScore(newScore)) {
				context.userScore = {
					...context.userScore,
					score: newScore,
				};
			}
			context.displayResults = true;
			context.processing = false;
			context.readyForSubmission = false;
			context.submissionPending = false;
			context.submissionErrorMessage = '';

			if (
				!state.currentSessionArchetypes.includes(pendingSubmission.hash)
			) {
				state.currentSessionArchetypes.push(pendingSubmission.hash);
			}

			// Keep pending for a silent retry so a later Firebase recovery can persist.
			actions.scheduleSilentRetry(pendingSubmission);
		},
		handleRateLimitedSubmission: (
			pendingSubmission,
			newScore = null,
			context = getContext()
		) => {
			if (isDefinedScore(newScore)) {
				context.userScore = {
					...context.userScore,
					score: newScore,
				};
			}
			context.displayResults = true;
			context.processing = false;
			context.readyForSubmission = false;
			context.submissionPending = false;
			context.submissionErrorMessage = '';

			if (
				!state.currentSessionArchetypes.includes(pendingSubmission.hash)
			) {
				state.currentSessionArchetypes.push(pendingSubmission.hash);
			}

			actions.scheduleSilentRetry(pendingSubmission);
		},
		scheduleSilentRetry: (pendingSubmission) => {
			const storageKey = getPendingSubmissionStorageKey(
				pendingSubmission.quizId,
				pendingSubmission.hash
			);
			if (scheduledSilentRetryKeys.has(storageKey)) {
				return;
			}
			scheduledSilentRetryKeys.add(storageKey);

			const jitter = Math.floor(Math.random() * SILENT_RETRY_JITTER_MS);
			setTimeout(
				withScope(() => {
					const currentSubmission = readPendingSubmission(
						pendingSubmission.quizId,
						pendingSubmission.hash
					);
					if (currentSubmission) {
						actions.silentlyRetryPendingSubmission(
							currentSubmission
						);
						return;
					}
					scheduledSilentRetryKeys.delete(storageKey);
				}),
				SILENT_RETRY_BASE_DELAY_MS + jitter
			);
		},
		silentlyRetryPendingSubmission: async (pendingSubmission) => {
			const storageKey = getPendingSubmissionStorageKey(
				pendingSubmission.quizId,
				pendingSubmission.hash
			);
			const nextPendingSubmission = {
				...pendingSubmission,
				attempts: (pendingSubmission.attempts || 0) + 1,
				updatedAt: Date.now(),
			};
			writePendingSubmission(nextPendingSubmission);

			try {
				const response = await apiFetch({
					path: '/prc-api/v3/quiz/submit',
					method: 'POST',
					data: {
						...nextPendingSubmission.requestArgs,
						...nextPendingSubmission.requestBody,
					},
					parse: false,
				});
				const data = await parseSubmitResponse(response);

				// Soft success without persistence — keep pending and retry later.
				if (false === data?.persisted) {
					scheduledSilentRetryKeys.delete(storageKey);
					actions.scheduleSilentRetry(nextPendingSubmission);
					return;
				}

				scheduledSilentRetryKeys.delete(storageKey);
				actions.clearPendingSubmission(nextPendingSubmission);
				actions.clearCookie();
				if (
					!state.currentSessionArchetypes.includes(
						nextPendingSubmission.hash
					)
				) {
					state.currentSessionArchetypes.push(
						nextPendingSubmission.hash
					);
				}
			} catch (error) {
				const failedSubmission = {
					...nextPendingSubmission,
					lastError: {
						code: error?.code || '',
						message: error?.message || SUBMISSION_RECOVERY_MESSAGE,
						status: error?.status || error?.data?.status || null,
					},
					updatedAt: Date.now(),
				};
				writePendingSubmission(failedSubmission);
				scheduledSilentRetryKeys.delete(storageKey);
				const message = isGroupSubmissionError(error, failedSubmission)
					? GROUP_SUBMISSION_RECOVERY_MESSAGE
					: SUBMISSION_RECOVERY_MESSAGE;
				showSubmissionRecoveryBanner(
					getContext(),
					failedSubmission,
					message
				);
			}
		},
		handleSubmissionError: (
			error,
			pendingSubmission,
			context = getContext()
		) => {
			const failedSubmission = {
				...pendingSubmission,
				lastError: {
					code: error?.code || '',
					message: error?.message || SUBMISSION_RECOVERY_MESSAGE,
					status: error?.status || error?.data?.status || null,
				},
				updatedAt: Date.now(),
			};
			writePendingSubmission(failedSubmission);
			const message = isGroupSubmissionError(error, failedSubmission)
				? GROUP_SUBMISSION_RECOVERY_MESSAGE
				: SUBMISSION_RECOVERY_MESSAGE;
			showSubmissionRecoveryBanner(context, failedSubmission, message);
			context.displayResults = false;
			context.processing = false;
			context.readyForSubmission = false;
		},
		submitPendingSubmission: async (
			pendingSubmission,
			newScore = null,
			context = getContext()
		) => {
			const nextPendingSubmission = {
				...pendingSubmission,
				attempts: (pendingSubmission.attempts || 0) + 1,
				updatedAt: Date.now(),
			};
			writePendingSubmission(nextPendingSubmission);

			try {
				const response = await apiFetch({
					path: '/prc-api/v3/quiz/submit',
					method: 'POST',
					data: {
						...nextPendingSubmission.requestArgs,
						...nextPendingSubmission.requestBody,
					},
					parse: false,
				});
				const data = await parseSubmitResponse(response);

				// Firebase unavailable: show same-session results, skip /results/ navigation.
				if (false === data?.persisted) {
					actions.handleUnpersistedSubmission(
						nextPendingSubmission,
						newScore,
						context
					);
					return;
				}

				if (isDefinedScore(newScore)) {
					context.userScore = {
						...context.userScore,
						score: newScore,
					};
				}
				context.displayResults = true;
				context.processing = false;
				context.readyForSubmission = false;
				actions.clearPendingSubmission(nextPendingSubmission, context);
				actions.clearCookie();
				if (
					!state.currentSessionArchetypes.includes(
						nextPendingSubmission.hash
					)
				) {
					state.currentSessionArchetypes.push(
						nextPendingSubmission.hash
					);
				}

				if (hasClientRenderedScore(context, newScore)) {
					const router =
						await import('@wordpress/interactivity-router');
					router.actions.navigate(
						nextPendingSubmission.destinationUrl
					);
				} else {
					window.location.assign(
						nextPendingSubmission.destinationUrl
					);
				}
			} catch (error) {
				const status = error?.status || error?.data?.status || null;
				if (429 === status) {
					// Group quizzes must not reveal results until the group write succeeds.
					if (isGroupSubmission(nextPendingSubmission)) {
						actions.handleSubmissionError(
							error,
							nextPendingSubmission,
							context
						);
						return;
					}
					actions.handleRateLimitedSubmission(
						nextPendingSubmission,
						newScore,
						context
					);
					return;
				}
				actions.handleSubmissionError(
					error,
					nextPendingSubmission,
					context
				);
			}
		},
		retryPendingSubmission: async (context = getContext()) => {
			const pendingSubmission = readPendingSubmission(
				context.quizId,
				context.pendingSubmissionHash
			);
			if (!pendingSubmission) {
				return;
			}
			context.processing = true;
			context.submissionErrorMessage = '';
			await actions.submitPendingSubmission(
				pendingSubmission,
				null,
				context
			);
		},
	},
});
