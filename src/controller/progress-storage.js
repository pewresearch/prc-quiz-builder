/**
 * WordPress Dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

const getQuizCookie = () => {
	const name = 'prc-quiz-builder';
	const nameEQ = `${name}=`;
	const ca = document.cookie.split(';');
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) === ' ') {
			c = c.substring(1, c.length);
		}
		if (0 === c.indexOf(nameEQ)) {
			const cookieValue = c.substring(nameEQ.length, c.length);
			const decodedValue = decodeURIComponent(cookieValue);
			try {
				return JSON.parse(decodedValue);
			} catch (error) {
				return decodedValue;
			}
		}
	}
	return null;
};

const { state, actions } = store('prc-quiz/controller', {
	state: {
		/**
		 * Check if user has given consent for functional cookies.
		 */
		get hasConsentForCookies() {
			if (typeof window.wp_has_consent === 'function') {
				return window.wp_has_consent('functional');
			}
			return true;
		},
		/**
		 * Get quiz progress data.
		 */
		get quizProgress() {
			const data = state.cookie;
			if (data && typeof data === 'object' && data.quiz_id) {
				return data;
			}
			return null;
		},
		/**
		 * Check if current quiz has saved progress.
		 */
		get hasQuizProgress() {
			const { quizId } = getContext();
			const data = state.quizProgress;
			return data && data.quiz_id === quizId;
		},
		get cookie() {
			if (!state.hasConsentForCookies) {
				return null;
			}
			return getQuizCookie();
		},
	},
	actions: {
		clearCookie: () => {
			const name = 'prc-quiz-builder';
			document.cookie =
				name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
		},
		/**
		 * Drop in-progress answers after a persisted submit. Keep `score` when
		 * groups are on so a later group-results visit can hydrate the viewer.
		 *
		 * @param {unknown} [score]   Score from this submission.
		 * @param {Object}  [context] Interactivity context captured before any await.
		 * @return {boolean|undefined} Whether a cookie was written.
		 */
		saveSubmittedScore: (score = null, context = getContext()) => {
			const { quizId, groupsEnabled } = context;
			const resolvedScore =
				undefined !== score && null !== score
					? score
					: state.quizProgress?.score;
			if (
				groupsEnabled &&
				undefined !== resolvedScore &&
				null !== resolvedScore &&
				'' !== resolvedScore
			) {
				return actions.setCookie({
					quiz_id: quizId,
					score: resolvedScore,
					timestamp: Date.now(),
				});
			}
			return actions.clearCookie();
		},
		setCookie: (value) => {
			if (!state.hasConsentForCookies) {
				return false;
			}

			const name = 'prc-quiz-builder';
			let cookieValue;
			if (typeof value === 'object' && value !== null) {
				cookieValue = encodeURIComponent(JSON.stringify(value));
			} else {
				cookieValue = encodeURIComponent(String(value));
			}

			const d = new Date();
			d.setTime(d.getTime() + 30 * 24 * 60 * 60 * 1000);
			const expires = `expires=${d.toUTCString()}`;
			document.cookie = `${name}=${cookieValue};${expires};path=/`;
			return true;
		},
		saveQuizProgress: (score = null) => {
			const { selectedAnswers, currentPageUuid, quizId } = getContext();
			const quizData = {
				quiz_id: quizId,
				selectedAnswers,
				currentPageUuid,
				timestamp: Date.now(),
			};
			const resolvedScore =
				undefined !== score && null !== score
					? score
					: state.quizProgress?.score;
			if (
				undefined !== resolvedScore &&
				null !== resolvedScore &&
				'' !== resolvedScore
			) {
				quizData.score = resolvedScore;
			}
			return actions.setCookie(quizData);
		},
	},
});
