/**
 * External Dependencies
 */

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, PanelColorSettings } from '@wordpress/block-editor';

export default function Controls({ colors }) {
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

	return (
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
				]}
			/>
		</InspectorControls>
	);
}
