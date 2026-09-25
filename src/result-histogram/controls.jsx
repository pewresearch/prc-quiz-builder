/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, PanelColorSettings } from '@wordpress/block-editor';
import {
	RangeControl,
	__experimentalNumberControl as NumberControl,
	PanelBody,
	TextControl,
} from '@wordpress/components';

export default function Controls({ attributes, setAttributes, colors }) {
	const { height, barLabelCutoff, barWidth, xAxisLabel } = attributes;
	const { barColor, setBarColor, isHighlightedColor, setIsHighlightedColor } =
		colors;
	const colorSettings = [
		{
			value: barColor?.color,
			onChange: setBarColor,
			label: __('Bar'),
		},
		{
			value: isHighlightedColor?.color,
			onChange: setIsHighlightedColor,
			label: __('Highlight'),
		},
	];
	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Histogram Settings')}>
					<PanelColorSettings
						__experimentalHasMultipleOrigins
						__experimentalIsRenderedInSidebar
						title={__('Histogram colors', 'prc-quiz')}
						disableCustomColors={false}
						colorSettings={colorSettings}
					/>
					<RangeControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
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
						__next40pxDefaultSize
						__nextHasNoMarginBottom
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
						__next40pxDefaultSize
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
						__next40pxDefaultSize
						__nextHasNoMarginBottom
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
					colorSettings={colorSettings}
				/>
			</InspectorControls>
		</>
	);
}
