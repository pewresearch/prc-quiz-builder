/**
 * External Dependencies
 */

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, PanelColorSettings } from '@wordpress/block-editor';
import {
	RangeControl,
	__experimentalNumberControl as NumberControl,
	TextareaControl,
	PanelBody,
	TextControl,
	ToggleControl,
} from '@wordpress/components';

const DEFAULT_COMPARISON =
	'You scored better than {betterThan} of the public, below {lowerThan} of the public and the same as {sameAs}.';

export default function Controls({ attributes, setAttributes, colors }) {
	const {
		message,
		height,
		barLabelCutoff,
		barWidth,
		xAxisLabel,
		showScoreSummary = true,
		comparisonText = DEFAULT_COMPARISON,
		topPerformerText = '',
		lowerPerformerText = '',
		topPerformerThreshold = 75,
		lowerPerformerThreshold = 25,
	} = attributes;
	const { barColor, setBarColor, isHighlightedColor, setIsHighlightedColor } =
		colors;
	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Histogram Settings')}>
					<ToggleControl
						label={__('Show score summary above chart', 'prc-quiz')}
						help={__(
							'Turn off to avoid duplicating the Result Score block.',
							'prc-quiz'
						)}
						checked={!!showScoreSummary}
						onChange={(val) =>
							setAttributes({ showScoreSummary: val })
						}
					/>
					<TextareaControl
						label={__('Comparison sentence', 'prc-quiz')}
						help={__(
							'Use {betterThan}, {lowerThan}, and {sameAs} placeholders.',
							'prc-quiz'
						)}
						value={comparisonText}
						onChange={(val) =>
							setAttributes({ comparisonText: val })
						}
					/>
					<TextareaControl
						label={__(
							'Top performer sentence (optional)',
							'prc-quiz'
						)}
						help={__(
							'Shown when betterThan is at or above the top threshold.',
							'prc-quiz'
						)}
						value={topPerformerText}
						onChange={(val) =>
							setAttributes({ topPerformerText: val })
						}
					/>
					<RangeControl
						label={__('Top performer threshold (%)', 'prc-quiz')}
						value={topPerformerThreshold}
						onChange={(val) =>
							setAttributes({ topPerformerThreshold: val })
						}
						min={50}
						max={100}
					/>
					<TextareaControl
						label={__(
							'Lower performer sentence (optional)',
							'prc-quiz'
						)}
						help={__(
							'Shown when betterThan is at or below the lower threshold.',
							'prc-quiz'
						)}
						value={lowerPerformerText}
						onChange={(val) =>
							setAttributes({ lowerPerformerText: val })
						}
					/>
					<RangeControl
						label={__('Lower performer threshold (%)', 'prc-quiz')}
						value={lowerPerformerThreshold}
						onChange={(val) =>
							setAttributes({ lowerPerformerThreshold: val })
						}
						min={0}
						max={50}
					/>
					<TextareaControl
						label="Score Message"
						help={__(
							'You can add the score to your share message by using %s'
						)}
						value={message}
						onChange={(newMessage) => {
							setAttributes({ message: newMessage });
						}}
					/>
					<RangeControl
						label="Histogram Height"
						help={__('Height defaults to 300px')}
						value={height}
						onChange={(newHeight) => {
							setAttributes({ height: newHeight });
						}}
						min={150}
						max={600}
					/>
					<RangeControl
						label="Bar Width"
						help={__('Width defaults to 24px')}
						value={barWidth}
						onChange={(newWidth) => {
							setAttributes({ barWidth: newWidth });
						}}
						min={10}
						max={40}
					/>
					<NumberControl
						label="Bar Label Cut Off"
						help={__('Number at which to show label outside bar')}
						value={barLabelCutoff}
						onChange={(newCutOff) => {
							setAttributes({
								barLabelCutoff: Number(newCutOff) || 0,
							});
						}}
						min={0}
						max={100}
					/>
					<TextControl
						label="X Axis Label"
						value={xAxisLabel}
						onChange={(newLabel) => {
							setAttributes({ xAxisLabel: newLabel });
						}}
					/>
				</PanelBody>
			</InspectorControls>
			<InspectorControls group="colors">
				<PanelColorSettings
					__experimentalHasMultipleOrigins
					__experimentalIsRenderedInSidebar
					title={__('Colors')}
					disableCustomColors={false}
					colorSettings={[
						{
							value: barColor.color,
							onChange: setBarColor,
							label: __('Bar'),
						},
						{
							value: isHighlightedColor.color,
							onChange: setIsHighlightedColor,
							label: __('Highlight'),
						},
					]}
				/>
			</InspectorControls>
		</>
	);
}
