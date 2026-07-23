/**
 * External Dependencies
 */

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, PanelColorSettings } from '@wordpress/block-editor';
import { PanelBody, RangeControl } from '@wordpress/components';

export default function Controls({
	attributes,
	setAttributes,
	colors,
	iconColor,
	setIconColor,
}) {
	const {
		rowBackgroundColor,
		setRowBackgroundColor,
		altRowBackgroundColor,
		setAltRowBackgroundColor,
		rowTextColor,
		setRowTextColor,
		altRowTextColor,
		setAltRowTextColor,
	} = colors;

	const { iconSize = 1 } = attributes;

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Icon settings', 'prc-quiz')}>
					<RangeControl
						label={__('Icon size', 'prc-quiz')}
						help={__('Size in em units', 'prc-quiz')}
						value={iconSize}
						onChange={(val) => setAttributes({ iconSize: val })}
						min={0.5}
						max={3}
						step={0.1}
						withInputField
					/>
				</PanelBody>
			</InspectorControls>
			<InspectorControls group="styles">
				<PanelColorSettings
					__experimentalHasMultipleOrigins
					__experimentalIsRenderedInSidebar
					title={__('Colors')}
					disableCustomColors
					colorSettings={[
						{
							value: rowBackgroundColor.color,
							onChange: setRowBackgroundColor,
							label: __('Row Background'),
						},
						{
							value: rowTextColor.color,
							onChange: setRowTextColor,
							label: __('Row Text'),
						},
						{
							value: altRowBackgroundColor.color,
							onChange: setAltRowBackgroundColor,
							label: __('Alt Row Background'),
						},
						{
							value: altRowTextColor.color,
							onChange: setAltRowTextColor,
							label: __('Alt Row Text'),
						},
						{
							value: iconColor?.color,
							onChange: setIconColor,
							label: __('Icon'),
						},
					]}
				/>
			</InspectorControls>
		</>
	);
}
