/**
 * Sounds for the quiz start, next page, submit, and reset buttons. A touch
 * plays the effect on pointerdown; the click handler then skips it.
 */
import {
	store,
	getContext,
	getElement,
	withSyncEvent,
} from '@wordpress/interactivity';
import {
	SOUND_EFFECT,
	consumePointerDownSound,
	playQuizSound,
	playQuizSoundOnPointerDown,
} from './sound-effects';

const BUTTON_SOUNDS = [
	['prc-quiz-start-button', SOUND_EFFECT.start],
	['prc-quiz-next-page-button', SOUND_EFFECT.nextPage],
	['prc-quiz-submit-button', SOUND_EFFECT.submit],
	['prc-quiz-reset-button', SOUND_EFFECT.reset],
];

/**
 * @param {Element|null} ref Button element with a prc-quiz-*-button class.
 * @return {string|null} Sprite key for the button.
 */
export function getButtonSoundKey(ref) {
	const match = BUTTON_SOUNDS.find(([className]) =>
		ref?.classList?.contains(className)
	);
	return match ? match[1] : null;
}

/**
 * Play a button's effect unless pointerdown already played it. Call from a
 * click action so getElement and getContext resolve to the button.
 *
 * @param {Event}  event Click event.
 * @param {string} key   Sprite key.
 */
export function playButtonClickSound(event, key) {
	const { ref } = getElement();
	if (consumePointerDownSound(ref, key, event)) {
		return;
	}
	playQuizSound(getContext(), key, event.target);
}

store('prc-quiz/controller', {
	actions: {
		onQuizButtonPointerDown: withSyncEvent((event) => {
			const { ref } = getElement();
			const key = getButtonSoundKey(ref);
			if (!key) {
				return;
			}
			playQuizSoundOnPointerDown({
				event,
				context: getContext(),
				key,
				element: ref,
			});
		}),
	},
});
