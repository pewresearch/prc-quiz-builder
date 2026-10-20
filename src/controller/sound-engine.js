/**
 * Web Audio playback for quiz sound effects: one shared AudioContext, the
 * decoded sprite, unlock on the first gesture, and page mute.
 * sound-effects.js decides which effect plays; this file plays it.
 */

const SOUND_ENGINE_KEY = '__prcQuizBuilderSound';

/**
 * About -50 dBFS. Quieter samples at the start of a region count as silence.
 */
export const SOUND_ONSET_THRESHOLD = 0.003;

/**
 * Keep a little lead-in so the attack of the sound is not clipped.
 */
const SOUND_ONSET_PRE_ROLL = 0.002;

const VOICE_FADE_SECONDS = 0.015;

/**
 * Activation-triggering events. A mouse press unlocks desktop audio at once;
 * a touch pointerdown does not count, so touch unlocks on the lift.
 */
const AUDIO_UNLOCK_EVENTS = [
	'mousedown',
	'pointerup',
	'touchend',
	'click',
	'keydown',
];

function createSoundEngine() {
	return {
		audioContext: null,
		decodeContext: null,
		masterGain: null,
		muted: false,
		mediaMuteReady: false,
		unlockArmed: false,
		unlockHandler: null,
		stateListenerContext: null,
		spritePromise: null,
		spriteBuffer: null,
		spriteUrl: '',
		onsets: new Map(),
	};
}

/**
 * One engine for every copy of this module. The answer and controller view
 * scripts can each bundle this file.
 *
 * @return {Object} Shared playback state.
 */
function getSoundEngine() {
	if ('undefined' === typeof window) {
		return createSoundEngine();
	}
	if (!window[SOUND_ENGINE_KEY]) {
		window[SOUND_ENGINE_KEY] = createSoundEngine();
	}
	return window[SOUND_ENGINE_KEY];
}

/**
 * @return {AudioContext|null} Shared audio context.
 */
export function getAudioContext() {
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
 * Resume a context that is suspended, or interrupted on iOS after the page
 * was in the background. Safe to call on every gesture.
 *
 * @param {AudioContext} contextNode Audio context.
 */
export function resumeAudioContext(contextNode) {
	if (!contextNode || 'running' === contextNode.state) {
		return;
	}
	if ('closed' === contextNode.state) {
		return;
	}
	const pending = contextNode.resume();
	if (pending && 'function' === typeof pending.catch) {
		pending.catch(() => {});
	}
	// iOS: a one-sample silent buffer wakes the output inside the gesture.
	try {
		const source = contextNode.createBufferSource();
		source.buffer = contextNode.createBuffer(1, 1, contextNode.sampleRate);
		source.connect(contextNode.destination);
		source.start(0);
	} catch {
		// The resume above still applies.
	}
}

/**
 * Create the shared context when the quiz loads. Where the browser already
 * allows audio (earlier interaction on the page, a same-origin navigation, or
 * media engagement), it runs before the first click. Elsewhere it waits,
 * suspended, for the unlock gesture.
 */
export function warmAudioContext() {
	const contextNode = getAudioContext();
	if (!contextNode) {
		return;
	}
	watchAudioState(contextNode);
	const hasBeenActive =
		'undefined' !== typeof window &&
		!!window.navigator?.userActivation?.hasBeenActive;
	if (hasBeenActive) {
		resumeAudioContext(contextNode);
	}
}

/**
 * @return {boolean} True when the shared context exists and is running.
 */
export function isSoundEngineRunning() {
	return 'running' === getSoundEngine().audioContext?.state;
}

/**
 * Unlock audio on the first gesture anywhere on the page, before the tap that
 * plays a sound. The listeners detach once the context runs, and attach again
 * when iOS suspends or interrupts it (for example, after backgrounding).
 */
export function installAudioUnlock() {
	const engine = getSoundEngine();
	if (engine.unlockArmed || 'undefined' === typeof document) {
		return;
	}
	if (isSoundEngineRunning()) {
		watchAudioState(engine.audioContext);
		return;
	}
	engine.unlockArmed = true;
	const unlock = () => {
		const contextNode = getAudioContext();
		if (!contextNode) {
			return;
		}
		watchAudioState(contextNode);
		resumeAudioContext(contextNode);
		if ('running' === contextNode.state) {
			disarmAudioUnlock();
		}
	};
	engine.unlockHandler = unlock;
	AUDIO_UNLOCK_EVENTS.forEach((type) => {
		document.addEventListener(type, unlock, {
			capture: true,
			passive: true,
		});
	});
}

function disarmAudioUnlock() {
	const engine = getSoundEngine();
	if (!engine.unlockArmed || 'undefined' === typeof document) {
		return;
	}
	AUDIO_UNLOCK_EVENTS.forEach((type) => {
		document.removeEventListener(type, engine.unlockHandler, {
			capture: true,
		});
	});
	engine.unlockArmed = false;
	engine.unlockHandler = null;
}

/**
 * @param {AudioContext} contextNode Audio context.
 */
function watchAudioState(contextNode) {
	const engine = getSoundEngine();
	if (
		!contextNode ||
		engine.stateListenerContext === contextNode ||
		'function' !== typeof contextNode.addEventListener
	) {
		return;
	}
	engine.stateListenerContext = contextNode;
	contextNode.addEventListener('statechange', () => {
		if ('running' === contextNode.state) {
			disarmAudioUnlock();
		} else if ('closed' !== contextNode.state) {
			installAudioUnlock();
		}
	});
}

/**
 * Decode without the page's audio context, so the sprite can load before the
 * first gesture. An AudioBuffer plays in any context.
 *
 * @return {BaseAudioContext|null} Context used for decodeAudioData.
 */
function getDecodeContext() {
	const engine = getSoundEngine();
	if (engine.decodeContext) {
		return engine.decodeContext;
	}
	if ('undefined' !== typeof window) {
		const OfflineAudioContext =
			window.OfflineAudioContext || window.webkitOfflineAudioContext;
		if (OfflineAudioContext) {
			try {
				engine.decodeContext = new OfflineAudioContext(1, 1, 44100);
				return engine.decodeContext;
			} catch {
				// Use the page's audio context below.
			}
		}
	}
	return getAudioContext();
}

/**
 * @param {string} url Sprite file URL.
 * @return {Promise<AudioBuffer|null>} Decoded buffer, or null when the file is missing.
 */
export function loadSpriteBuffer(url) {
	if (!url || 'function' !== typeof fetch) {
		return Promise.resolve(null);
	}
	const engine = getSoundEngine();
	if (engine.spritePromise && engine.spriteUrl === url) {
		return engine.spritePromise;
	}
	const decodeContext = getDecodeContext();
	if (!decodeContext) {
		return Promise.resolve(null);
	}
	engine.spriteUrl = url;
	engine.spriteBuffer = null;
	engine.onsets = new Map();
	engine.spritePromise = fetch(url)
		.then((response) => {
			if (!response.ok) {
				throw new Error('Quiz sound sprite is unavailable.');
			}
			return response.arrayBuffer();
		})
		.then((data) => decodeContext.decodeAudioData(data))
		.then((buffer) => {
			if (engine.spriteUrl === url) {
				engine.spriteBuffer = buffer;
			}
			return buffer;
		})
		.catch(() => null);
	return engine.spritePromise;
}

/**
 * First time in a sprite region where the sound is louder than the threshold.
 *
 * @param {Object} buffer    Decoded audio (AudioBuffer or the same shape).
 * @param {number} start     Region start in seconds.
 * @param {number} duration  Region length in seconds.
 * @param {number} threshold Absolute sample level from 0 to 1.
 * @return {number} Start of the sound in seconds, or start when the region is silent.
 */
export function findSoundOnset(
	buffer,
	start,
	duration,
	threshold = SOUND_ONSET_THRESHOLD
) {
	const { sampleRate, numberOfChannels } = buffer || {};
	if (!sampleRate || !numberOfChannels) {
		return start;
	}
	const channels = [];
	for (let channel = 0; channel < numberOfChannels; channel++) {
		channels.push(buffer.getChannelData(channel));
	}
	const length = channels[0].length;
	const from = Math.max(0, Math.floor(start * sampleRate));
	const to = Math.min(length, Math.ceil((start + duration) * sampleRate));
	for (let index = from; index < to; index++) {
		for (let channel = 0; channel < channels.length; channel++) {
			if (Math.abs(channels[channel][index]) > threshold) {
				return Math.max(
					start,
					index / sampleRate - SOUND_ONSET_PRE_ROLL
				);
			}
		}
	}
	return start;
}

/**
 * @param {AudioBuffer} buffer   Decoded sprite.
 * @param {number}      start    Region start in seconds.
 * @param {number}      duration Region length in seconds.
 * @return {number} Cached onset for this region.
 */
function getSpriteOnset(buffer, start, duration) {
	const engine = getSoundEngine();
	const cacheKey = `${start}:${duration}`;
	if (engine.spriteBuffer === buffer && engine.onsets.has(cacheKey)) {
		return engine.onsets.get(cacheKey);
	}
	const onset = findSoundOnset(buffer, start, duration);
	if (engine.spriteBuffer === buffer) {
		engine.onsets.set(cacheKey, onset);
	}
	return onset;
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

function getTimeMs() {
	return 'undefined' !== typeof performance &&
		'function' === typeof performance.now
		? performance.now()
		: Date.now();
}

/**
 * @param {string}  url                   Sprite file URL.
 * @param {Object}  playback              Resolved playback.
 * @param {number}  playback.start        Offset in seconds.
 * @param {number}  playback.duration     Length in seconds.
 * @param {number}  playback.gain         Gain from 0 to 1.
 * @param {boolean} playback.trimSilence  Skip silence at the start of the region.
 * @param {number}  playback.maxLatencyMs Drop the sound when the sprite is ready later than this.
 * @return {{stop: Function}} Voice handle.
 */
export function startSpritePlayback(url, playback) {
	const engine = getSoundEngine();
	if (engine.spriteBuffer && engine.spriteUrl === url) {
		return playSpriteRegion(engine.spriteBuffer, playback) || SILENT_VOICE;
	}
	const requestedAt = getTimeMs();
	let cancelled = false;
	let voice = null;
	loadSpriteBuffer(url).then((buffer) => {
		if (!buffer || cancelled) {
			return;
		}
		if (getTimeMs() - requestedAt > playback.maxLatencyMs) {
			return;
		}
		voice = playSpriteRegion(buffer, playback);
	});
	return {
		stop() {
			cancelled = true;
			voice?.stop();
		},
	};
}

const SILENT_VOICE = { stop() {} };

/**
 * @param {AudioBuffer} buffer   Decoded sprite.
 * @param {Object}      playback Resolved playback.
 * @return {{stop: Function}|null} Voice handle, or null when nothing plays.
 */
function playSpriteRegion(buffer, playback) {
	const contextNode = getAudioContext();
	if (!contextNode) {
		return null;
	}
	const regionEnd = Math.min(
		playback.start + playback.duration,
		buffer.duration
	);
	const offset = Math.min(
		playback.trimSilence
			? getSpriteOnset(buffer, playback.start, playback.duration)
			: playback.start,
		buffer.duration
	);
	const duration = regionEnd - offset;
	if (duration <= 0) {
		return null;
	}
	resumeAudioContext(contextNode);
	// Start at the clock's current time. start(0) plays from time 0 and
	// keeps the default full gain instead of the slider value.
	const startAt = contextNode.currentTime;
	const source = contextNode.createBufferSource();
	const voiceGain = contextNode.createGain();
	source.buffer = buffer;
	voiceGain.gain.setValueAtTime(playback.gain, startAt);
	source.connect(voiceGain);
	voiceGain.connect(getMasterGain(contextNode));
	try {
		source.start(startAt, offset, duration);
	} catch {
		// Autoplay policy or a detached buffer. The quiz continues.
		return null;
	}
	let stopped = false;
	return {
		stop() {
			if (stopped) {
				return;
			}
			stopped = true;
			const stopAt = contextNode.currentTime;
			try {
				voiceGain.gain.cancelScheduledValues(stopAt);
				voiceGain.gain.setValueAtTime(voiceGain.gain.value, stopAt);
				voiceGain.gain.linearRampToValueAtTime(
					0,
					stopAt + VOICE_FADE_SECONDS
				);
				source.stop(stopAt + VOICE_FADE_SECONDS);
			} catch {
				// Already ended.
			}
		},
	};
}
