/**
 * WordPress Dependencies
 */
import { useBlockProps, withColors } from '@wordpress/block-editor';

/**
 * Internal Dependencies
 */
import Controls from './controls';
import { resolveHistogramBins } from '../controller/histogram-population';

const DEFAULT_BAR_COLOR = 'var(--wp--preset--color--oatmeal, #c8b8a0)';
const DEFAULT_HIGHLIGHT_COLOR = 'var(--wp--preset--color--mustard, #e0b500)';

function hasChartData(bins) {
	return (bins || []).some((bin) => Number(bin?.percent) > 0);
}

function HistogramPreview({ bins, attributes, barColor, isHighlightedColor }) {
	const { height, barLabelCutoff = 0, barWidth, xAxisLabel } = attributes;
	const padded = bins || [];
	const maxY = Math.max(1, ...padded.map((bin) => bin.percent));
	const guessed = padded.length
		? padded.reduce(
				(max, bin) => (bin.percent > max.percent ? bin : max),
				padded[0]
			).correct
		: null;

	return (
		<div className="histogram-preview">
			<div className="bars" style={{ height }}>
				{padded.map((bin) => {
					const heightPct = (bin.percent / maxY) * 100;
					const isHighlighted =
						guessed !== null && bin.correct === guessed;
					let label = `${Math.round(bin.percent)}%`;
					if (bin.percent <= 0) {
						label = '';
					} else if (bin.percent < 1) {
						label = '<1%';
					}
					const backgroundColor = isHighlighted
						? isHighlightedColor?.color || DEFAULT_HIGHLIGHT_COLOR
						: barColor?.color || DEFAULT_BAR_COLOR;
					const labelStyle = {};
					if (bin.percent <= barLabelCutoff) {
						labelStyle.top = '-22px';
						labelStyle.color = '#000';
					}
					return (
						<div
							key={bin.correct}
							className={`bar${isHighlighted ? ' is-highlighted' : ''}`}
							style={{
								height: `${Math.max(heightPct, bin.percent > 0 ? 4 : 2)}%`,
								backgroundColor,
								width: `${barWidth}px`,
							}}
						>
							<span className="bar__label" style={labelStyle}>
								{label}
							</span>
							<span className="bar__x">
								{String(bin.correct)}
							</span>
						</div>
					);
				})}
			</div>
			<div className="x-axis-label">{xAxisLabel}</div>
		</div>
	);
}

function Edit({
	attributes,
	setAttributes,
	context,
	barColor,
	setBarColor,
	isHighlightedColor,
	setIsHighlightedColor,
}) {
	const { height } = attributes;
	const bins = resolveHistogramBins(
		context['prc-quiz/histogram-population'],
		attributes.histogramData
	);
	const displayChart = hasChartData(bins);
	const barCss = barColor?.color || DEFAULT_BAR_COLOR;
	const highlightCss = isHighlightedColor?.color || DEFAULT_HIGHLIGHT_COLOR;
	const blockProps = useBlockProps({
		className: displayChart ? 'has-chart' : 'has-no-chart',
		style: {
			'--prc-quiz-histogram-bar-color': barCss,
			'--prc-quiz-histogram-highlight-color': highlightCss,
			...(displayChart ? { '--histogram-height': `${height}px` } : {}),
		},
	});

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
				{displayChart ? (
					<div id="bar-chart">
						<HistogramPreview
							bins={bins}
							attributes={attributes}
							barColor={barColor}
							isHighlightedColor={isHighlightedColor}
						/>
					</div>
				) : (
					<p className="histogram-empty">
						Edit histogram data on the Quiz Controller to show the
						chart.
					</p>
				)}
			</div>
		</>
	);
}

export default withColors(
	{ barColor: 'bar-color' },
	{ isHighlightedColor: 'highlight-color' }
)(Edit);
