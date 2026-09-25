/**
 * External Dependencies
 */

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	PanelColorSettings,
	BlockControls,
} from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	ToolbarGroup,
	ToolbarButton,
} from '@wordpress/components';
import { chartBar } from '@wordpress/icons';

export default function Controls({
	attributes,
	setAttributes,
	colors,
	iconColor,
	setIconColor,
	onEditResultsData,
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
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						icon={chartBar}
						label={__('Edit Results Table Data', 'prc-quiz')}
						onClick={onEditResultsData}
					/>
				</ToolbarGroup>
			</BlockControls>
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
						__next40pxDefaultSize
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
