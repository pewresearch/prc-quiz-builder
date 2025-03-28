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
 * @param {Object}   props.context
 * @param {string}   props.clientId
 * @param {boolean}  props.isSelected
 * @param {Object}   props.rowBackgroundColor
 * @param {Function} props.setRowBackgroundColor
 * @param {Object}   props.altRowBackgroundColor
 * @param {Function} props.setAltRowBackgroundColor
 * @param {Object}   props.rowTextColor
 * @param {Function} props.setRowTextColor
 * @param {Object}   props.altRowTextColor
 * @param {Function} props.setAltRowTextColor
 * @param {Function} props.setAttributes            Function that updates individual attributes.
 *
 * @return {WPElement} Element to render.
 */
function Edit({
	attributes,
	setAttributes,
	context,
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
}) {
	const blockProps = useBlockProps();
	const { data, loading } = useQuizDataModel(clientId);

	const { questions, demoBreakLabels } = data;

	console.log('demoBreakLabelsComputed', data, questions, demoBreakLabels);

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
		<Fragment>
			<Controls {...{ colors }} />
			<div {...blockProps}>
				{loading && (
					<div>
						<p>Loading data... </p>
						<Spinner />
					</div>
				)}
				{!loading && 0 >= demoBreakLabels?.length && (
					<Table {...{ questions, colors, isSelected }} />
				)}
				{!loading && 0 < demoBreakLabels?.length && (
					<TableDemoBreaks
						{...{
							questions,
							colors,
							demoBreakLabels,
							isSelected,
						}}
					/>
				)}
				<p className="wp-block-prc-quiz-result-table__instructions">
					The answers here are randomized for preview purposes only.
				</p>
			</div>
		</Fragment>
	);
}

export default withColors(
	{ rowBackgroundColor: 'color' },
	{ altRowBackgroundColor: 'color' },
	{ rowTextColor: 'color' },
	{ altRowTextColor: 'color' }
)(Edit);
