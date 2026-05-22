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
			if (score) {
				quizData.score = score;
			}
			return actions.setCookie(quizData);
		},
	},
});
