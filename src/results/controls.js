/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import {
	RESULTS_TRANSITION_COUNTDOWN,
	RESULTS_TRANSITION_DEFAULT,
} from './results-countdown';

/**
 * Results block inspector panel.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes    Block attributes.
 * @param {Function} props.setAttributes Attribute setter.
 * @return {Element} Inspector controls.
 */
export default function Controls({ attributes, setAttributes }) {
	const { resultsTransition = RESULTS_TRANSITION_DEFAULT } = attributes;

	return (
		<InspectorControls>
			<PanelBody title={__('Results settings', 'prc-quiz')}>
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={__('Results transition', 'prc-quiz')}
					help={__(
						'What readers see when they finish the quiz and their results are about to appear. Countdown shows 3, 2, 1 and the message "Finding your best fit" instead of the loading spinner. Results stay hidden until the countdown ends. It plays once, on that first visit. It does not play when a reader returns to the results or opens a shared results link.',
						'prc-quiz'
					)}
					options={[
						{
							label: __('Default', 'prc-quiz'),
							value: RESULTS_TRANSITION_DEFAULT,
						},
						{
							label: __('Countdown', 'prc-quiz'),
							value: RESULTS_TRANSITION_COUNTDOWN,
						},
					]}
					value={resultsTransition}
					onChange={(value) =>
						setAttributes({ resultsTransition: value })
					}
				/>
			</PanelBody>
		</InspectorControls>
	);
}
