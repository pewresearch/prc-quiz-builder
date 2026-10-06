/**
 * Quiz sound effects.
 *
 * Effects play from one sprite sheet:
 * plugins/prc-quiz-builder/assets/quiz-sound-sprite.mp3
 *
 * Each entry's start and duration are seconds. A duration of 0 keeps that
 * effect silent until timing values are filled in.
 */

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
	[SOUND_EFFECT.start]: { start: 2.38, duration: 1 },
	[SOUND_EFFECT.nextPage]: { start: 0, duration: 0.5 },
	[SOUND_EFFECT.submit]: { start: 5, duration: 1 },
	[SOUND_EFFECT.reset]: { start: 17.9, duration: 0.6 },
	[SOUND_EFFECT.hoverResponse]: { start: 19.9, duration: 0.5 },
	[SOUND_EFFECT.clickResponse]: { start: 22.68, duration: 0.5 },
	[SOUND_EFFECT.correctResponse]: { start: 7.7, duration: 1 },
	[SOUND_EFFECT.incorrectResponse]: { start: 22, duration: 0.5 },
	[SOUND_EFFECT.notSureResponse]: { start: 22, duration: 0.5 },
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

const SOUND_ENGINE_KEY = '__prcQuizBuilderSound';

/**
 * One engine for every copy of this module. The answer and controller view
 * scripts can each bundle this file.
 *
 * @return {Object} Shared playback state.
 */
function getSoundEngine() {
	if ('undefined' === typeof window) {
		return {
			audioContext: null,
			masterGain: null,
			muted: false,
			mediaMuteReady: false,
			spritePromise: null,
			spriteUrl: '',
		};
	}
	if (!window[SOUND_ENGINE_KEY]) {
		window[SOUND_ENGINE_KEY] = {
			audioContext: null,
			masterGain: null,
			muted: false,
			mediaMuteReady: false,
			spritePromise: null,
			spriteUrl: '',
		};
	}
	return window[SOUND_ENGINE_KEY];
}

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
	return null;
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
 * Create the shared audio context during a user gesture.
 *
 * @param {Object|null|undefined} context Controller context.
 */
export function primeSoundEffects(context) {
	if (!hasEnabledSound(context?.soundSettings)) {
		return;
	}
	const contextNode = getAudioContext();
	if (!contextNode) {
		return;
	}
	if ('suspended' === contextNode.state) {
		contextNode.resume();
	}
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
		return;
	}
	startSpritePlayback(context.soundSpriteUrl, playback);
}

/**
 * Play the click effect, and the outcome effect when a response is selected.
 *
 * @param {Object}                 args
 * @param {Object}                 args.context   Controller context.
 * @param {Element|null}           args.element   Interacted element.
 * @param {boolean}                args.selecting True when this click selects the response.
 * @param {boolean|null|undefined} args.correct   Answer correct flag.
 */
export function playAnswerInteractionSounds({
	context,
	element,
	selecting,
	correct,
}) {
	playQuizSound(context, SOUND_EFFECT.clickResponse, element);
	if (!selecting) {
		return;
	}
	const outcomeKey = getResponseSoundKey(correct);
	if (!outcomeKey) {
		return;
	}
	playQuizSound(context, outcomeKey, element);
}

/**
 * @return {AudioContext|null} Shared audio context.
 */
function getAudioContext() {
	if ('undefined' === typeof window) {
		return null;
	}
	const AudioContext = window.AudioContext || window.webkitAudioContext;
	if (!AudioContext) {
		return null;
	}
	const engine = getSoundEngine();
	if (!engine.audioContext) {
		engine.audioContext = new AudioContext();
	}
	return engine.audioContext;
}

/**
 * @param {string} url Sprite file URL.
 * @return {Promise<AudioBuffer|null>} Decoded buffer, or null when the file is missing.
 */
function loadSpriteBuffer(url) {
	if (!url || 'function' !== typeof fetch) {
		return Promise.resolve(null);
	}
	const engine = getSoundEngine();
	if (engine.spritePromise && engine.spriteUrl === url) {
		return engine.spritePromise;
	}
	const contextNode = getAudioContext();
	if (!contextNode) {
		return Promise.resolve(null);
	}
	engine.spriteUrl = url;
	engine.spritePromise = fetch(url)
		.then((response) => {
			if (!response.ok) {
				throw new Error('Quiz sound sprite is unavailable.');
			}
			return response.arrayBuffer();
		})
		.then((data) => contextNode.decodeAudioData(data))
		.catch(() => null);
	return engine.spritePromise;
}

const PRIOR_MUTED_ATTR = 'data-prc-quiz-prior-muted';

/**
 * @param {EventTarget|null|undefined} target Event target.
 * @return {boolean} True for audio and video elements.
 */
function isMediaElement(target) {
	const tag = target?.tagName;
	return 'AUDIO' === tag || 'VIDEO' === tag;
}

/**
 * @param {HTMLMediaElement} element Media element.
 * @return {boolean} True when the element is already muted.
 */
function isMediaMuted(element) {
	return !!element.muted;
}

/**
 * Remember each element's previous muted state, then mute or restore it.
 *
 * @param {boolean} muted True to mute page media.
 */
export function syncHtmlMediaMuted(muted) {
	if ('undefined' === typeof document) {
		return;
	}
	document.querySelectorAll('audio, video').forEach((element) => {
		if (muted) {
			if (!element.hasAttribute(PRIOR_MUTED_ATTR)) {
				element.setAttribute(
					PRIOR_MUTED_ATTR,
					isMediaMuted(element) ? '1' : '0'
				);
			}
			element.muted = true;
			return;
		}
		if (!element.hasAttribute(PRIOR_MUTED_ATTR)) {
			return;
		}
		element.muted = '1' === element.getAttribute(PRIOR_MUTED_ATTR);
		element.removeAttribute(PRIOR_MUTED_ATTR);
	});
}

/**
 * Keep media that starts while the page is muted silent.
 *
 * @param {Event} event Play event.
 */
function onMediaPlay(event) {
	const engine = getSoundEngine();
	const target = event.target;
	if (!engine.muted || !isMediaElement(target)) {
		return;
	}
	if (!target.hasAttribute(PRIOR_MUTED_ATTR)) {
		target.setAttribute(PRIOR_MUTED_ATTR, isMediaMuted(target) ? '1' : '0');
	}
	target.muted = true;
}

/**
 * @return {void}
 */
function ensureMediaMuteListener() {
	const engine = getSoundEngine();
	if (engine.mediaMuteReady || 'undefined' === typeof document) {
		return;
	}
	engine.mediaMuteReady = true;
	document.addEventListener('play', onMediaPlay, true);
}

/**
 * Master gain for every quiz effect. Mute sets this to 0.
 *
 * @param {AudioContext} contextNode Audio context.
 * @return {GainNode} Master gain.
 */
function getMasterGain(contextNode) {
	const engine = getSoundEngine();
	if (!engine.masterGain || engine.masterGain.context !== contextNode) {
		engine.masterGain = contextNode.createGain();
		engine.masterGain.connect(contextNode.destination);
	}
	const now = contextNode.currentTime;
	engine.masterGain.gain.cancelScheduledValues(now);
	engine.masterGain.gain.setValueAtTime(engine.muted ? 0 : 1, now);
	return engine.masterGain;
}

/**
 * Mute or unmute quiz effects and every audio or video element on the page.
 *
 * @param {boolean} muted True to mute.
 */
export function setPageAudioMuted(muted) {
	const engine = getSoundEngine();
	engine.muted = !!muted;
	ensureMediaMuteListener();
	syncHtmlMediaMuted(engine.muted);
	const contextNode = getAudioContext();
	if (!contextNode) {
		return;
	}
	getMasterGain(contextNode);
}

/**
 * @param {string} url               Sprite file URL.
 * @param {Object} playback          Resolved playback.
 * @param {number} playback.start    Offset in seconds.
 * @param {number} playback.duration Length in seconds.
 * @param {number} playback.gain     Gain from 0 to 1.
 */
function startSpritePlayback(url, playback) {
	const contextNode = getAudioContext();
	if (!contextNode) {
		return;
	}
	loadSpriteBuffer(url).then((buffer) => {
		if (!buffer) {
			return;
		}
		const offset = Math.min(playback.start, buffer.duration);
		const duration = Math.min(
			playback.duration,
			Math.max(0, buffer.duration - offset)
		);
		if (duration <= 0) {
			return;
		}
		if ('suspended' === contextNode.state) {
			contextNode.resume();
		}
		// Start at the clock's current time. start(0) plays from time 0 and
		// keeps the default full gain instead of the slider value.
		const now = contextNode.currentTime;
		const source = contextNode.createBufferSource();
		const voiceGain = contextNode.createGain();
		source.buffer = buffer;
		voiceGain.gain.setValueAtTime(playback.gain, now);
		source.connect(voiceGain);
		voiceGain.connect(getMasterGain(contextNode));
		try {
			source.start(now, offset, duration);
		} catch {
			// Autoplay policy or a detached buffer. The quiz continues.
		}
	});
}
