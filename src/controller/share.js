/**
 * Share actions for the quiz controller.
 *
 * Powers the "Share Quiz" and "Share Results" core/button variations,
 * invoking the native share sheet via navigator.share with a clipboard
 * fallback for unsupported browsers.
 *
 * WordPress Dependencies
 */
import {
	store,
	getContext,
	getElement,
	withSyncEvent,
} from '@wordpress/interactivity';

/**
 * Invoke the native share sheet for a payload, falling back to copying
 * the share URL to the clipboard on browsers without navigator.share
 * (e.g. desktop Firefox).
 *
 * @param {Object}  payload       Share payload.
 * @param {string}  payload.title Share title.
 * @param {string}  payload.text  Share text.
 * @param {string}  payload.url   Share URL.
 * @param {Element} ref           The button element, used for copy feedback.
 */
async function sharePayload(payload, ref) {
	// navigator.share rejects on empty members; strip them.
	const cleaned = Object.fromEntries(
		Object.entries(payload).filter(([, value]) => !!value)
	);
	if (window.navigator?.share) {
		try {
			await window.navigator.share(cleaned);
		} catch {
			// The user dismissed the share sheet; nothing to do.
		}
		return;
	}
	if (!cleaned.url || !window.navigator?.clipboard?.writeText) {
		return;
	}
	await window.navigator.clipboard.writeText(cleaned.url);
	if (ref) {
		const originalNodes = Array.from(ref.childNodes);
		ref.replaceChildren(document.createTextNode('Link copied'));
		setTimeout(() => {
			ref.replaceChildren(...originalNodes);
		}, 2000);
	}
}

const { actions } = store('prc-quiz/controller', {
	actions: {
		/**
		 * Share the quiz itself, using the social share metadata
		 * (prc-schema-seo) provided in context.shareData.
		 */
		onShareQuizClick: withSyncEvent((event) => {
			event.preventDefault();
			const { shareData, quizTitle, quizUrl } = getContext();
			const { ref } = getElement();
			sharePayload(
				{
					title: shareData?.title || quizTitle,
					text: shareData?.text || '',
					url: shareData?.url || quizUrl,
				},
				ref
			);
		}),
		/**
		 * Share the user's quiz results. The URL is built from quizUrl and
		 * userScore.hash so sharing works before client navigation updates
		 * the address bar. Other plugins (e.g. Political Typology) can
		 * inject a synchronous `actions.getResultsShareData( defaults )`
		 * into the controller store to override the title/text/url.
		 */
		onShareResultsClick: withSyncEvent((event) => {
			event.preventDefault();
			const context = getContext();
			const { shareData, shareText, quizTitle, quizUrl, userScore } =
				context;
			const { ref } = getElement();
			const score = userScore?.score ?? '';
			const hash = userScore?.hash;
			let payload = {
				title: shareData?.title || quizTitle,
				text: (shareText || '')
					.replace('%score%', score)
					.replace('%title%', quizTitle),
				url:
					hash && quizUrl
						? `${quizUrl}results/${hash}`
						: window.location.href,
			};
			if (actions.getResultsShareData) {
				payload = actions.getResultsShareData(payload) || payload;
			}
			sharePayload(payload, ref);
		}),
	},
});
