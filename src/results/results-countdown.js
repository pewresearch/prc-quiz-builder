/**
 * Results countdown shown on the quiz controller after a reader finishes.
 * The skip-spinner key is read in the controller onInit.
 */
import {
	SOUND_EFFECT,
	isInteractionMuted,
	playQuizSound,
} from '../controller/sound-effects';

export const RESULTS_TRANSITION_DEFAULT = 'default';
export const RESULTS_TRANSITION_COUNTDOWN = 'countdown';
export const RESULTS_COUNTDOWN_START = 3;
export const RESULTS_COUNTDOWN_STEP_MS = 1000;
export const SKIP_RESULTS_SPINNER_PREFIX =
	'prc-quiz-builder__skip-results-spinner:';

/**
 * @param {number|string} quizId Quiz post id.
 * @return {string} sessionStorage key.
 */
export function getSkipResultsSpinnerKey(quizId) {
	return `${SKIP_RESULTS_SPINNER_PREFIX}${quizId}`;
}

/**
 * @param {string} value Results transition attribute.
 * @return {boolean} True when the author chose Countdown.
 */
export function isCountdownResultsTransition(value) {
	return RESULTS_TRANSITION_COUNTDOWN === value;
}

/**
 * Next number in the 3, 2, 1 sequence. Null means the countdown is finished.
 *
 * @param {number|string|null} current Current displayed number.
 * @return {number|null} Next number, or null when the countdown should end.
 */
export function getNextResultsCountdown(current) {
	const count = Number(current);
	if (!Number.isInteger(count) || count <= 1) {
		return null;
	}
	return count - 1;
}

/**
 * @param {number|string} quizId Quiz post id.
 * @return {Element|null} Controller element for this quiz.
 */
export function findControllerElement(quizId) {
	if ('undefined' === typeof document) {
		return null;
	}
	const match = document.querySelector(
		`.wp-block-prc-quiz-controller[quiz-id="${quizId}"]`
	);
	return match || document.querySelector('.wp-block-prc-quiz-controller');
}

/**
 * @param {number|string} quizId Quiz post id.
 * @return {boolean} True when this quiz's results block uses the countdown.
 */
export function usesResultsCountdown(quizId) {
	const root = findControllerElement(quizId);
	return !!root?.querySelector('[data-results-transition="countdown"]');
}

/**
 * Hide the loading spinner and count from 3 to 1. Results stay closed.
 *
 * @param {Object} context Controller context. The same object submit captured.
 * @return {Promise<void>} Resolves when the countdown finishes.
 */
export function runResultsCountdown(context) {
	return new Promise((resolve) => {
		if (!context || context.resultsCountdown) {
			resolve();
			return;
		}
		context.displayResults = false;
		context.resultsCountdown = RESULTS_COUNTDOWN_START;
		playCountdownSound(context);

		const step = () => {
			const next = getNextResultsCountdown(context.resultsCountdown);
			if (null === next) {
				context.resultsCountdown = null;
				resolve();
				return;
			}
			context.resultsCountdown = next;
			window.setTimeout(step, RESULTS_COUNTDOWN_STEP_MS);
		};
		window.setTimeout(step, RESULTS_COUNTDOWN_STEP_MS);
	});
}

/**
 * Element that can opt the countdown sound out with the no-sound class.
 *
 * @param {number|string} quizId Quiz post id.
 * @return {Element|null} Results block or countdown element.
 */
export function getCountdownSoundElement(quizId) {
	const root = findControllerElement(quizId);
	if (!root) {
		return null;
	}
	const results = root.querySelector('[data-results-transition="countdown"]');
	if (isInteractionMuted(results)) {
		return results;
	}
	const countdown = root.querySelector(
		'.wp-block-prc-quiz-controller-results-countdown'
	);
	if (isInteractionMuted(countdown)) {
		return countdown;
	}
	return countdown || results;
}

/**
 * Start the countdown effect when this quiz uses the countdown transition.
 *
 * @param {Object} context Controller context.
 */
function playCountdownSound(context) {
	if (!usesResultsCountdown(context?.quizId)) {
		return;
	}
	playQuizSound(
		context,
		SOUND_EFFECT.countdown,
		getCountdownSoundElement(context.quizId),
		true
	);
}

/**
 * Play the countdown when this quiz uses it, then show the results.
 *
 * @param {Object} context Controller context.
 * @return {Promise<boolean>} True when the countdown played.
 */
export async function revealResults(context) {
	const playCountdown = usesResultsCountdown(context?.quizId);
	if (playCountdown) {
		await runResultsCountdown(context);
	}
	context.displayResults = true;
	context.processing = false;
	return playCountdown;
}

/**
 * The next results page should skip the loading spinner. The countdown
 * already played on the quiz page.
 *
 * @param {number|string} quizId Quiz post id.
 */
export function markSkipResultsSpinner(quizId) {
	if (!quizId || 'undefined' === typeof window) {
		return;
	}
	try {
		window.sessionStorage.setItem(getSkipResultsSpinnerKey(quizId), '1');
	} catch (error) {
		// Private browsing can block sessionStorage.
	}
}

/**
 * @param {number|string} quizId Quiz post id.
 * @return {boolean} True when this page load should skip the results spinner.
 */
export function consumeSkipResultsSpinner(quizId) {
	if (!quizId || 'undefined' === typeof window) {
		return false;
	}
	const key = getSkipResultsSpinnerKey(quizId);
	try {
		const armed = window.sessionStorage.getItem(key) === '1';
		if (armed) {
			window.sessionStorage.removeItem(key);
		}
		return armed;
	} catch (error) {
		return false;
	}
}
