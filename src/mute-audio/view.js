/**
 * WordPress Dependencies
 */
import { store, getElement } from '@wordpress/interactivity';

/**
 * Internal Dependencies
 */
import { setPageAudioMuted } from '../controller/sound-effects';

const { state } = store('prc-quiz/controller', {
	state: {
		audioMuted: false,
		get isAudioMuted() {
			return !!state.audioMuted;
		},
		get muteAudioLabel() {
			const { ref } = getElement();
			const dataset = ref?.dataset || {};
			if (state.audioMuted) {
				return dataset.unmuteLabel || 'Unmute';
			}
			return dataset.muteLabel || 'Mute';
		},
	},
	actions: {
		toggleAudioMute() {
			state.audioMuted = !state.audioMuted;
			setPageAudioMuted(state.audioMuted);
		},
	},
	callbacks: {
		onMuteAudioInit() {
			const { ref } = getElement();
			if ('true' !== ref?.dataset.startMuted) {
				return;
			}
			state.audioMuted = true;
			setPageAudioMuted(true);
		},
	},
});
