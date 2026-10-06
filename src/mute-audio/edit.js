/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import { SpeakerIcon } from './icons';

/**
 * Editor preview of the mute control. The button itself runs on the frontend.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes    Block attributes.
 * @param {Function} props.setAttributes Attribute setter.
 * @return {Element} Preview.
 */
export default function Edit({ attributes, setAttributes }) {
	const startMuted = !!attributes.startMuted;
	const blockProps = useBlockProps();
	const label = startMuted
		? __('Unmute', 'prc-quiz')
		: __('Mute', 'prc-quiz');

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Mute settings', 'prc-quiz')}>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={__('Default state', 'prc-quiz')}
						help={__(
							'Choose whether audio is muted or unmuted when the page loads.',
							'prc-quiz'
						)}
						value={startMuted ? 'muted' : 'unmuted'}
						options={[
							{
								label: __('Unmuted', 'prc-quiz'),
								value: 'unmuted',
							},
							{
								label: __('Muted', 'prc-quiz'),
								value: 'muted',
							},
						]}
						onChange={(value) =>
							setAttributes({ startMuted: 'muted' === value })
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div {...blockProps}>
				<span className="wp-block-prc-quiz-mute-audio__icon">
					<SpeakerIcon muted={startMuted} />
				</span>
				<span className="wp-block-prc-quiz-mute-audio__label">
					{label}
				</span>
			</div>
		</>
	);
}
