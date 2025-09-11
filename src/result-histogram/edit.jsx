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

// Simple editor-only histogram preview (no external chart lib)
function HistogramPreview({ attributes, barColor, isHighlightedColor }) {
	const {
		histogramData,
		height,
		barLabelCutoff = 0,
		barWidth,
		xAxisLabel,
	} = attributes;
	let bins = [];
	try {
		const parsed =
			typeof histogramData === 'string'
				? JSON.parse(histogramData || '[]')
				: histogramData;
		bins = Array.isArray(parsed)
			? parsed
					.map((d) => ({ x: Number(d.x), y: Number(d.y) }))
					.filter((d) => Number.isFinite(d.x) && Number.isFinite(d.y))
			: [];
	} catch (e) {
		bins = [];
	}

	const maxY = Math.max(1, ...bins.map((b) => b.y));
	const guessed = bins.length
		? bins.reduce((m, b) => (b.y > m.y ? b : m), bins[0]).x
		: null;

	return (
		<div className="histogram-preview">
			<div className="bars" style={{ height }}>
				{bins.map((b) => {
					const heightPct = (b.y / maxY) * 100;
					const isHighlighted = guessed !== null && b.x === guessed;
					const label = b.y < 1 ? '<1%' : `${Math.round(b.y)}%`;
					const backgroundColor = isHighlighted
						? isHighlightedColor?.color || '#e0b500'
						: barColor?.color || '#000';
					const labelStyle = {};
					if (b.y <= barLabelCutoff) {
						labelStyle.top = '-22px';
						labelStyle.color = '#000';
					}
					return (
						<div
							key={b.x}
							className={`bar${isHighlighted ? ' is-highlighted' : ''}`}
							style={{
								height: `${heightPct}%`,
								backgroundColor,
								width: `${barWidth}px`,
							}}
						>
							<span className="bar__label" style={labelStyle}>
								{label}
							</span>
							<span className="bar__x">{String(b.x)}</span>
						</div>
					);
				})}
			</div>
			<div className="x-axis-label">{xAxisLabel}</div>
		</div>
	);
}

const TABLE_TEMPLATE = [
	[
		'prc-block/table',
		{
			className: 'histogram-data-table test-class',
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
						{ content: '0', tag: 'td' },
						{ content: '10', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: '1', tag: 'td' },
						{ content: '20', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: '2', tag: 'td' },
						{ content: '30', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: '3', tag: 'td' },
						{ content: '20', tag: 'td' },
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
	} = attributes;

	const blockProps = useBlockProps();

	const innerBlocksProps = useInnerBlocksProps(blockProps, {
		template: TABLE_TEMPLATE,
		templateLock: 'all',
		allowedBlocks: ['prc-block/table'],
	});

	const tableBlock = useSelect(
		(select) =>
			select('core/block-editor')
				.getBlocks(clientId)
				.find((block) => 'prc-block/table' === block.name),
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
		<>
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
				<div id="bar-chart">
					<HistogramPreview
						{...{
							attributes,
							barColor,
							isHighlightedColor,
						}}
					/>
				</div>
			</div>
		</>
	);
}

export default withColors(
	{ barColor: 'color' },
	{ isHighlightedColor: 'color' }
)(Edit);
