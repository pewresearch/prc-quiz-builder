/**
 * WordPress Dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

/**
 * Internal Dependencies
 */
import { resolveHistogramBins } from '../controller/histogram-population';

const toNumber = (v) => {
	const n = Number(v);
	return Number.isFinite(n) ? n : 0;
};

function resolveBins(questionCount) {
	const context = getContext();
	return resolveHistogramBins(
		context.histogramPopulation,
		context.histogramData,
		questionCount
	);
}

const { state } = store('prc-quiz/controller', {
	state: {
		get getBarStyle() {
			const context = getContext();
			const { bar } = context;
			if (!bar) {
				return '';
			}
			const { height, width } = bar;
			return `height: ${height}; width: ${width};`;
		},
		get histogramBars() {
			const { barLabelCutoff = 0, barWidth } = getContext();
			const s = toNumber(state.score);
			const bins = resolveBins(state.numberOfQuestionsTotal);
			const maxY = Math.max(1, ...bins.map((bin) => bin.percent));
			return bins.map((bin) => {
				const heightPct = (bin.percent / maxY) * 100;
				const isHighlighted = bin.correct === s;
				let label = `${Math.round(bin.percent)}%`;
				if (bin.percent <= 0) {
					label = '';
				} else if (bin.percent < 1) {
					label = '<1%';
				}
				const ariaLabel = `${bin.correct} correct: ${Math.round(bin.percent)}%`;
				return {
					x: bin.correct,
					xLabel: String(bin.correct),
					y: bin.percent,
					height: `${Math.max(heightPct, bin.percent > 0 ? 4 : 2)}%`,
					isHighlighted,
					label,
					ariaLabel,
					showOutside: bin.percent <= barLabelCutoff,
					width: `${barWidth}px`,
				};
			});
		},
	},
	callbacks: {},
});
