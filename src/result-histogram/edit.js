/**
 * External Dependencies
 */

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment, useEffect } from '@wordpress/element';
import {
	useBlockProps,
	useInnerBlocksProps,
	withColors,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal Dependencies
 */
import Controls from './controls';
import Histogram from './histogram';

const TABLE_TEMPLATE = [
	[
		'core/table',
		{
			className: 'histogram-data-table',
			head: [
				{
					cells: [
						{ content: '# of Correct Answers', tag: 'th' },
						{ content: '% of Public', tag: 'th' },
					],
				},
			],
			body: [
				{
					cells: [
						{ content: '', tag: 'td' },
						{ content: '', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: '', tag: 'td' },
						{ content: '', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: '', tag: 'td' },
						{ content: '', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: '', tag: 'td' },
						{ content: '', tag: 'td' },
					],
				},
			],
		},
	],
];

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @param {Object}   props                       Properties passed to the function.
 * @param {Object}   props.attributes            Available block attributes.
 * @param            props.context
 * @param            props.clientId
 * @param            props.isSelected
 * @param            props.barColor
 * @param            props.setBarColor
 * @param            props.isHighlightedColor
 * @param            props.setIsHighlightedColor
 * @param {Function} props.setAttributes         Function that updates individual attributes.
 *
 * @return {WPElement} Element to render.
 */
function Edit({
	attributes,
	setAttributes,
	context,
	clientId,
	isSelected,
	barColor,
	setBarColor,
	isHighlightedColor,
	setIsHighlightedColor,
}) {
	const {
		message,
		histogramData,
		width,
		height,
		barLabelPosition,
		barLabelCutoff,
		yAxisDomain,
		xAxisLabel,
	} = attributes;

	const blockProps = useBlockProps();

	const innerBlocksProps = useInnerBlocksProps(blockProps, {
		template: TABLE_TEMPLATE,
		templateLock: 'all',
		allowedBlocks: ['core/table'],
	});

	const tableBlock = useSelect(
		(select) =>
			select('core/block-editor')
				.getBlocks(clientId)
				.find((block) => 'core/table' === block.name),
		[clientId]
	);

	useEffect(() => {
		if (tableBlock) {
			const tableData = tableBlock.attributes.body;
			const obj = tableData.map((row) => ({
				x: row.cells[0].content,
				y: row.cells[1].content,
			}));
			if (histogramData !== JSON.stringify(obj)) {
				setAttributes({
					histogramData: JSON.stringify(obj),
				});
			}
		}
	}, [tableBlock]);

	return (
		<Fragment>
			<Controls
				{...{
					attributes,
					setAttributes,
					colors: {
						barColor,
						setBarColor,
						isHighlightedColor,
						setIsHighlightedColor,
					},
				}}
			/>
			<div {...blockProps}>
				<p>{message}</p>

				<div {...innerBlocksProps} />

				<div id="score">
					<h2>
						You answered <span>X</span> questions correctly
					</h2>
					<h3>
						You scored better than x% of the public, below y% of the
						public and the same as z% of the public.
					</h3>
				</div>

				<Histogram
					histogramData={histogramData}
					width={width}
					height={height}
					barLabelPosition={barLabelPosition}
					barColor={barColor.color}
					isHighlightedColor={isHighlightedColor.color}
					yAxisDomain={yAxisDomain}
					xAxisLabel={xAxisLabel}
					barLabelCutoff={barLabelCutoff}
				/>
			</div>
		</Fragment>
	);
}

export default withColors(
	{ barColor: 'color' },
	{ isHighlightedColor: 'color' }
)(Edit);
