/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, RangeControl, ToggleControl } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import {
	SOUND_EFFECT,
	SOUND_VOLUME_DEFAULT,
	SOUND_VOLUME_MAX,
	SOUND_VOLUME_MIN,
	clampSoundVolume,
	getSoundSettings,
} from './sound-effects';

const SOUND_TOGGLES = [
	[SOUND_EFFECT.start, __('Start', 'prc-quiz')],
	[SOUND_EFFECT.nextPage, __('Next page', 'prc-quiz')],
	[SOUND_EFFECT.submit, __('Submit', 'prc-quiz')],
	[SOUND_EFFECT.reset, __('Reset', 'prc-quiz')],
	[SOUND_EFFECT.hoverResponse, __('Hover over response', 'prc-quiz')],
	[SOUND_EFFECT.clickResponse, __('Click response', 'prc-quiz')],
	[SOUND_EFFECT.correctResponse, __('Correct response', 'prc-quiz')],
	[SOUND_EFFECT.incorrectResponse, __('Incorrect response', 'prc-quiz')],
	[SOUND_EFFECT.notSureResponse, __('Not sure response', 'prc-quiz')],
	[SOUND_EFFECT.countdown, __('Countdown to results', 'prc-quiz')],
];

/**
 * Sound settings for the quiz controller inspector.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes    Controller attributes.
 * @param {Function} props.setAttributes Attribute setter.
 * @return {Element} Inspector panel.
 */
export default function SoundSettingsControls({ attributes, setAttributes }) {
	const settings = getSoundSettings(attributes.soundSettings);

	const setSoundSetting = (key, value) => {
		setAttributes({
			soundSettings: {
				...settings,
				[key]: value,
			},
		});
	};

	return (
		<PanelBody title={__('Sound settings', 'prc-quiz')} initialOpen={false}>
			<p>
				{__(
					'Each sound is off until you turn it on. Add the class no-sound to a block to keep that block silent.',
					'prc-quiz'
				)}
			</p>
			{SOUND_TOGGLES.map(([key, label]) => (
				<ToggleControl
					key={key}
					__nextHasNoMarginBottom
					label={label}
					checked={settings[key]}
					help={
						SOUND_EFFECT.countdown === key
							? __(
									'Plays only when the Results block transition is Countdown. It starts when the countdown begins.',
									'prc-quiz'
								)
							: undefined
					}
					onChange={(value) => setSoundSetting(key, value)}
				/>
			))}
			<RangeControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={__('Volume', 'prc-quiz')}
				help={__(
					'Sets the volume for every sound that is turned on. 0 is silent. 100 is full volume.',
					'prc-quiz'
				)}
				min={SOUND_VOLUME_MIN}
				max={SOUND_VOLUME_MAX}
				step={1}
				value={settings.volume}
				allowReset
				resetFallbackValue={SOUND_VOLUME_DEFAULT}
				onChange={(value) =>
					setSoundSetting('volume', clampSoundVolume(value))
				}
			/>
		</PanelBody>
	);
}
