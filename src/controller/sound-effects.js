/**
 * Quiz sound effects.
 *
 * Effects play from one sprite sheet:
 * plugins/prc-quiz-builder/assets/quiz_sound_sprite.mp3
 *
 * Each entry's start and duration are seconds. A duration of 0 keeps that
 * effect silent until timing values are filled in. Silence at the start of a
 * region is skipped at play time (see findSoundOnset), so a start value may
 * sit a little before the sound itself.
 */

import {
	getAudioContext,
	installAudioUnlock,
	isSoundEngineRunning,
	loadSpriteBuffer,
	resumeAudioContext,
	startSpritePlayback,
	warmAudioContext,
} from './sound-engine';

export {
	SOUND_ONSET_THRESHOLD,
	findSoundOnset,
	isSoundEngineRunning,
	setPageAudioMuted,
	syncHtmlMediaMuted,
} from './sound-engine';

export const SOUND_SPRITE_FILE = 'assets/quiz_sound_sprite.mp3';

export const NO_SOUND_CLASS = 'no-sound';

export const SOUND_VOLUME_MIN = 0;
export const SOUND_VOLUME_MAX = 100;
export const SOUND_VOLUME_DEFAULT = 100;

export const SOUND_EFFECT = {
	start: 'start',
	nextPage: 'nextPage',
	submit: 'submit',
	reset: 'reset',
	hoverResponse: 'hoverResponse',
	clickResponse: 'clickResponse',
	correctResponse: 'correctResponse',
	incorrectResponse: 'incorrectResponse',
	notSureResponse: 'notSureResponse',
	countdown: 'countdown',
};

export const SOUND_SPRITE_MAP = {
	[SOUND_EFFECT.start]: { start: 2.525, duration: 0.855 },
	[SOUND_EFFECT.nextPage]: { start: 0, duration: 0.5 },
	[SOUND_EFFECT.submit]: { start: 5.15, duration: 0.85 },
	[SOUND_EFFECT.reset]: { start: 18.02, duration: 0.48 },
	[SOUND_EFFECT.hoverResponse]: { start: 19.92, duration: 0.48 },
	[SOUND_EFFECT.clickResponse]: { start: 22.7, duration: 0.48 },
	[SOUND_EFFECT.correctResponse]: { start: 7.725, duration: 0.975 },
	[SOUND_EFFECT.incorrectResponse]: { start: 22.095, duration: 0.405 },
	[SOUND_EFFECT.notSureResponse]: { start: 22.095, duration: 0.405 },
	[SOUND_EFFECT.countdown]: { start: 27.34, duration: 8.9 },
};

export const DEFAULT_SOUND_SETTINGS = {
	[SOUND_EFFECT.start]: false,
	[SOUND_EFFECT.nextPage]: false,
	[SOUND_EFFECT.submit]: false,
	[SOUND_EFFECT.reset]: false,
	[SOUND_EFFECT.hoverResponse]: false,
	[SOUND_EFFECT.clickResponse]: false,
	[SOUND_EFFECT.correctResponse]: false,
	[SOUND_EFFECT.incorrectResponse]: false,
	[SOUND_EFFECT.notSureResponse]: false,
	[SOUND_EFFECT.countdown]: false,
	volume: SOUND_VOLUME_DEFAULT,
};

/**
 * A touch that moves farther than this is a scroll or swipe, not a tap.
 */
const TAP_SLOP_PX = 10;

/**
 * A click later than this after pointerdown plays its own sound again.
 */
const POINTER_DOWN_SOUND_TTL_MS = 1500;

/**
 * A sound that is ready later than this after the tap is dropped. Late
 * feedback feels worse than none.
 */
const MAX_SOUND_LATENCY_MS = 150;

/**
 * @param {number|string|null|undefined} value Raw volume.
 * @return {number} Volume from 0 to 100.
 */
export function clampSoundVolume(value) {
	const volume = Number(value);
	if (!Number.isFinite(volume)) {
		return SOUND_VOLUME_DEFAULT;
	}
	return Math.min(
		SOUND_VOLUME_MAX,
		Math.max(SOUND_VOLUME_MIN, Math.round(volume))
	);
}

/**
 * Map the 0-100 slider to a gain from 0 to 1.
 * The position is squared so the middle of the slider is clearly quieter.
 * A straight map leaves 50 close to full loudness.
 *
 * @param {number} volume Volume from 0 to 100.
 * @return {number} Gain from 0 to 1.
 */
export function soundVolumeToGain(volume) {
	const level = clampSoundVolume(volume) / SOUND_VOLUME_MAX;
	return level * level;
}

/**
 * @param {Object|null|undefined} settings Saved sound settings.
 * @return {Object} Settings with every toggle and a clamped volume.
 */
export function getSoundSettings(settings) {
	const source = settings && 'object' === typeof settings ? settings : {};
	const next = {
		volume: clampSoundVolume(source.volume),
	};
	Object.values(SOUND_EFFECT).forEach((key) => {
		next[key] = !!source[key];
	});
	return next;
}

/**
 * @param {Object|null|undefined} settings Saved sound settings.
 * @return {boolean} True when at least one effect is enabled.
 */
export function hasEnabledSound(settings) {
	const normalized = getSoundSettings(settings);
	return Object.values(SOUND_EFFECT).some((key) => normalized[key]);
}

/**
 * True when this element, or a parent, opts out of sound.
 *
 * @param {Element|null|undefined} element Interacted element.
 * @return {boolean} True when sound should stay off.
 */
export function isInteractionMuted(element) {
	if (!element || 'function' !== typeof element.closest) {
		return false;
	}
	return Boolean(element.closest(`.${NO_SOUND_CLASS}`));
}

/**
 * Outcome effect for a selected response.
 * null is the Not sure answer. undefined means the answer is unknown.
 *
 * @param {boolean|null|undefined} correct Answer correct flag.
 * @return {string|null} Sprite key, or null when there is no outcome effect.
 */
export function getResponseSoundKey(correct) {
	if (true === correct) {
		return SOUND_EFFECT.correctResponse;
	}
	if (false === correct) {
		return SOUND_EFFECT.incorrectResponse;
	}
	if (null === correct) {
		return SOUND_EFFECT.notSureResponse;
	}
	return null;
}

/**
 * The correct flag to pass to getResponseSoundKey for an answer in quiz
 * state. State stores null both for Not sure and for answers with no
 * correct value, so the notSure flag tells them apart.
 *
 * @param {Object|null|undefined} answer Answer from quiz state.
 * @return {boolean|null|undefined} true, false, null for Not sure, or undefined.
 */
export function getAnswerSoundOutcome(answer) {
	if (answer?.notSure) {
		return null;
	}
	if ('boolean' === typeof answer?.correct) {
		return answer.correct;
	}
	return undefined;
}

/**
 * Decide whether an effect should play, and how.
 *
 * @param {Object}       args
 * @param {string}       args.key                 Sprite key.
 * @param {Object|null}  [args.settings]          Saved sound settings.
 * @param {Element|null} [args.element]           Interacted element.
 * @param {boolean}      [args.countdownSelected] Results block uses Countdown.
 * @param {Object}       [args.spriteMap]         Sprite map override.
 * @return {Object|null} Playback description, or null when the effect stays silent.
 */
export function resolveSoundPlayback({
	key,
	settings,
	element,
	countdownSelected = true,
	spriteMap = SOUND_SPRITE_MAP,
}) {
	const normalized = getSoundSettings(settings);
	if (!normalized[key]) {
		return null;
	}
	if (isInteractionMuted(element)) {
		return null;
	}
	if (SOUND_EFFECT.countdown === key && !countdownSelected) {
		return null;
	}
	const sprite = spriteMap[key];
	if (!sprite) {
		return null;
	}
	const start = Number(sprite.start);
	if (!Number.isFinite(start) || start < 0) {
		return null;
	}
	const duration = Number(sprite.duration);
	if (!Number.isFinite(duration) || duration <= 0) {
		return null;
	}
	return {
		start,
		duration,
		gain: soundVolumeToGain(normalized.volume),
	};
}

/**
 * Fetch and decode the sprite, create the audio context, and unlock audio on
 * the first gesture.
 * Call this when the quiz loads so that the first tap does not wait for the
 * download and the decode.
 *
 * @param {Object|null|undefined} context Controller context.
 */
export function preloadSoundEffects(context) {
	if (!hasEnabledSound(context?.soundSettings) || !context?.soundSpriteUrl) {
		return;
	}
	installAudioUnlock();
	warmAudioContext();
	loadSpriteBuffer(context.soundSpriteUrl);
}

/**
 * Create or resume the shared audio context during a user gesture.
 *
 * @param {Object|null|undefined} context Controller context.
 */
export function primeSoundEffects(context) {
	if (!hasEnabledSound(context?.soundSettings)) {
		return;
	}
	installAudioUnlock();
	const contextNode = getAudioContext();
	if (!contextNode) {
		return;
	}
	resumeAudioContext(contextNode);
	if (context?.soundSpriteUrl) {
		loadSpriteBuffer(context.soundSpriteUrl);
	}
}

/**
 * Play one enabled effect. Silent when the toggle is off, the element opts out,
 * or the sprite region is not mapped yet.
 *
 * @param {Object}       context           Controller context.
 * @param {string}       key               Sprite key.
 * @param {Element|null} element           Interacted element.
 * @param {boolean}      countdownSelected Results block uses Countdown.
 * @return {{stop: Function}|null} Voice handle, or null when nothing plays.
 */
export function playQuizSound(
	context,
	key,
	element = null,
	countdownSelected = true
) {
	primeSoundEffects(context);
	const playback = resolveSoundPlayback({
		key,
		settings: context?.soundSettings,
		element,
		countdownSelected,
	});
	if (!playback || playback.gain <= 0 || !context?.soundSpriteUrl) {
		return null;
	}
	// Countdown runs with the results animation, so it keeps its authored
	// start and still plays when the sprite is slow to load.
	const isTapFeedback = SOUND_EFFECT.countdown !== key;
	return startSpritePlayback(context.soundSpriteUrl, {
		...playback,
		trimSilence: isTapFeedback,
		maxLatencyMs: isTapFeedback ? MAX_SOUND_LATENCY_MS : Infinity,
	});
}

const pointerDownSounds = new WeakMap();

/**
 * Play an effect when a touch or pen lands, instead of waiting for the
 * click that follows the lift. The sound stops when the touch turns into a
 * scroll or swipe. Mouse input, and touches before audio is unlocked, wait
 * for click as before.
 *
 * @param {Object}       args
 * @param {PointerEvent} args.event   Pointer down event.
 * @param {Object}       args.context Controller context.
 * @param {string}       args.key     Sprite key.
 * @param {Element}      args.element Element that owns the click handler.
 */
export function playQuizSoundOnPointerDown({ event, context, key, element }) {
	if (!event || !element || 'mouse' === event.pointerType) {
		return;
	}
	if (false === event.isPrimary) {
		return;
	}
	// A touch pointerdown cannot unlock audio. Until a lift has resumed the
	// context, leave the sound to the click.
	if (!isSoundEngineRunning()) {
		return;
	}
	const voice = playQuizSound(context, key, event.target);
	if (!voice) {
		return;
	}
	pointerDownSounds.set(element, { key, time: event.timeStamp });
	stopOnTapCancel(element, event, voice);
}

/**
 * True when pointerdown already played this effect for the click that
 * follows it. Each pointerdown sound is consumed once.
 *
 * @param {Element} element Element that owns the click handler.
 * @param {string}  key     Sprite key.
 * @param {Event}   event   Click event.
 * @return {boolean} True when the click should not play the effect again.
 */
export function consumePointerDownSound(element, key, event) {
	const entry = element ? pointerDownSounds.get(element) : null;
	if (!entry || entry.key !== key) {
		return false;
	}
	pointerDownSounds.delete(element);
	const elapsed = (event?.timeStamp ?? entry.time) - entry.time;
	return elapsed >= 0 && elapsed <= POINTER_DOWN_SOUND_TTL_MS;
}

/**
 * @param {Element}          element Element that received pointerdown.
 * @param {PointerEvent}     event   Pointer down event.
 * @param {{stop: Function}} voice   Playing voice.
 */
function stopOnTapCancel(element, event, voice) {
	if ('function' !== typeof element.addEventListener) {
		return;
	}
	const { pointerId, clientX, clientY } = event;
	const cleanup = () => {
		element.removeEventListener('pointermove', onMove);
		element.removeEventListener('pointercancel', onCancel);
		element.removeEventListener('pointerup', onUp);
	};
	const cancel = () => {
		cleanup();
		pointerDownSounds.delete(element);
		voice.stop();
	};
	function onMove(moveEvent) {
		if (moveEvent.pointerId !== pointerId) {
			return;
		}
		const dx = moveEvent.clientX - clientX;
		const dy = moveEvent.clientY - clientY;
		if (Math.hypot(dx, dy) > TAP_SLOP_PX) {
			cancel();
		}
	}
	function onCancel(cancelEvent) {
		if (cancelEvent.pointerId === pointerId) {
			cancel();
		}
	}
	function onUp(upEvent) {
		if (upEvent.pointerId === pointerId) {
			cleanup();
		}
	}
	element.addEventListener('pointermove', onMove, { passive: true });
	element.addEventListener('pointercancel', onCancel);
	element.addEventListener('pointerup', onUp);
}

/**
 * Play the click effect, and the outcome effect when a response is selected.
 *
 * @param {Object}                 args
 * @param {Object}                 args.context       Controller context.
 * @param {Element|null}           args.element       Interacted element.
 * @param {boolean}                args.selecting     True when this click selects the response.
 * @param {boolean|null|undefined} args.correct       Answer correct flag.
 * @param {boolean}                [args.clickPlayed] True when pointerdown already played the click effect.
 */
export function playAnswerInteractionSounds({
	context,
	element,
	selecting,
	correct,
	clickPlayed = false,
}) {
	if (!clickPlayed) {
		playQuizSound(context, SOUND_EFFECT.clickResponse, element);
	}
	if (!selecting) {
		return;
	}
	const outcomeKey = getResponseSoundKey(correct);
	if (!outcomeKey) {
		return;
	}
	playQuizSound(context, outcomeKey, element);
}
