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
} from '@wordpress/components';

export default function Controls({ attributes, setAttributes, colors }) {
	const {
		message,
		width,
		height,
		barLabelPosition,
		barLabelCutoff,
		barWidth,
		yAxisDomain,
		xAxisLabel,
	} = attributes;
	const { barColor, setBarColor, isHighlightedColor, setIsHighlightedColor } =
		colors;
	return (
		<InspectorControls>
			<PanelBody title={__('Histogram Settings')}>
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
					label="Histogram Width"
					help={__('Width defaults to 640px')}
					value={width}
					onChange={(newWidth) => {
						setAttributes({ width: newWidth });
					}}
					min={500}
					max={800}
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
				{/* <RangeControl
					label="Bar Label Position"
					help={__('Vertical position of bar label')}
					value={barLabelPosition}
					onChange={(newPosition) => {
						setAttributes({ barLabelPosition: newPosition });
					}}
					min={-20}
					max={30}
				/>
				<NumberControl
					label="Bar Label Cut Off"
					help={__('Number at which to show label outside bar')}
					value={barLabelCutoff}
					onChange={(newCutOff) => {
						setAttributes({ barLabelCutoff: newCutOff });
					}}
					min={0}
					max={100}
				/> */}
				{/* <RangeControl
					label="Y Axis Domain"
					help={__('Set domain close to highest bar value')}
					value={yAxisDomain}
					onChange={(newDomain) => {
						setAttributes({ yAxisDomain: newDomain });
					}}
					min={0}
					max={100}
				/> */}
				<TextControl
					label="X Axis Label"
					value={xAxisLabel}
					onChange={(newLabel) => {
						setAttributes({ xAxisLabel: newLabel });
					}}
				/>
			</PanelBody>
			<PanelColorSettings
				__experimentalHasMultipleOrigins
				__experimentalIsRenderedInSidebar
				title={__('Colors')}
				disableCustomColors
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
	);
}
