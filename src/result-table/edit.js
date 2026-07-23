/**
 * External Dependencies
 */
import { useQuizDataModel } from '@prc/quiz-components';

/**
 * WordPress Dependencies
 */
import { Fragment } from '@wordpress/element';
import { useBlockProps, withColors } from '@wordpress/block-editor';
import { Spinner } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import Controls from './controls';
import Table from './table';
import TableDemoBreaks from './table-demo-breaks';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @param {Object}   props                          Properties passed to the function.
 * @param {Object}   props.attributes               Available block attributes.
 * @param {string}   props.clientId                 Block client ID.
 * @param {boolean}  props.isSelected               Whether the block is selected.
 * @param {Object}   props.rowBackgroundColor       Row background color from withColors.
 * @param {Function} props.setRowBackgroundColor    Row background color setter.
 * @param {Object}   props.altRowBackgroundColor    Alt row background color from withColors.
 * @param {Function} props.setAltRowBackgroundColor Alt row background color setter.
 * @param {Object}   props.rowTextColor             Row text color from withColors.
 * @param {Function} props.setRowTextColor          Row text color setter.
 * @param {Object}   props.altRowTextColor          Alt row text color from withColors.
 * @param {Function} props.setAltRowTextColor       Alt row text color setter.
 * @param {Object}   props.iconColor                Icon color from withColors.
 * @param {Function} props.setIconColor             Icon color setter.
 * @param {Function} props.setAttributes            Function that updates individual attributes.
 *
 * @return {Element} Element to render.
 */
function Edit({
	attributes,
	setAttributes,
	clientId,
	isSelected,
	rowBackgroundColor,
	setRowBackgroundColor,
	altRowBackgroundColor,
	setAltRowBackgroundColor,
	rowTextColor,
	setRowTextColor,
	altRowTextColor,
	setAltRowTextColor,
	iconColor,
	setIconColor,
}) {
	const blockProps = useBlockProps();
	const { data, loading } = useQuizDataModel(clientId);

	const { questions, demoBreakLabels } = data;

	const colors = {
		rowBackgroundColor,
		setRowBackgroundColor,
		altRowBackgroundColor,
		setAltRowBackgroundColor,
		rowTextColor,
		setRowTextColor,
		altRowTextColor,
		setAltRowTextColor,
	};

	return (
		<>
			<Controls
				attributes={attributes}
				setAttributes={setAttributes}
				colors={colors}
				iconColor={iconColor}
				setIconColor={setIconColor}
			/>
			<div {...blockProps}>
				{loading && (
					<div>
						<p>Loading data... </p>
						<Spinner />
					</div>
				)}
				{!loading && 0 >= demoBreakLabels?.length && (
					<Table
						questions={questions}
						colors={colors}
						isSelected={isSelected}
					/>
				)}
				{!loading && 0 < demoBreakLabels?.length && (
					<TableDemoBreaks
						questions={questions}
						colors={colors}
						demoBreakLabels={demoBreakLabels}
						isSelected={isSelected}
					/>
				)}
				<p className="wp-block-prc-quiz-result-table__instructions">
					The answers here are randomized for preview purposes only.
				</p>
			</div>
		</>
	);
}

export default withColors(
	{ rowBackgroundColor: 'color' },
	{ altRowBackgroundColor: 'color' },
	{ rowTextColor: 'color' },
	{ altRowTextColor: 'color' },
	{ iconColor: 'color' }
)(Edit);
