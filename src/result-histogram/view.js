/**
 * WordPress Dependencies
 */
import {
	store,
	getContext,
	withScope,
	withSyncEvent,
} from '@wordpress/interactivity';

/**
 * Quiz Results Histogram Interactivity
 */
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const toNumber = (v) => {
	const n = Number(v);
	return Number.isFinite(n) ? n : 0;
};

const normalizeBins = (raw) => {
	const source = Array.isArray(raw) ? raw : [];
	return source
		.map((d) => ({ x: toNumber(d.x), y: toNumber(d.y) }))
		.filter((d) => Number.isFinite(d.x) && Number.isFinite(d.y));
};

const formatPct = (n) => `${clamp(Math.round(n), 0, 100)}%`;

const { state, actions } = store('prc-quiz/controller', {
	state: {
		get answeredCorrectly() {
			return toNumber(state.score);
		},
		get sameAs() {
			const { histogramData } = getContext();
			const bins = normalizeBins(histogramData);
			const s = toNumber(state.score);
			const found = bins.find((b) => b.x === s);
			return formatPct(found?.y ?? 0);
		},
		get betterThan() {
			const { histogramData } = getContext();
			const bins = normalizeBins(histogramData);
			const s = toNumber(state.score);
			const sum = bins.reduce((acc, b) => (b.x < s ? acc + b.y : acc), 0);
			return formatPct(sum);
		},
		get lowerThan() {
			const { histogramData } = getContext();
			const bins = normalizeBins(histogramData);
			const s = toNumber(state.score);
			const sum = bins.reduce((acc, b) => (b.x > s ? acc + b.y : acc), 0);
			return formatPct(sum);
		},
		get getBarStyle() {
			const context = getContext();
			const { bar } = context;
			const { background, height, width } = bar;
			return `height: ${height}; width: ${width}; background: ${background};`;
		},
		get histogramBars() {
			const {
				histogramData,
				barLabelCutoff = 0,
				barColor,
				isHighlightedColor,
				barWidth,
			} = getContext();
			const s = toNumber(state.score);
			const bins = normalizeBins(histogramData);
			const maxY = Math.max(1, ...bins.map((b) => b.y));
			const highlightedBarColorResolved = actions.getColor(isHighlightedColor);
			const barColorResolved = actions.getColor(barColor);
			return bins.map((b) => {
				const heightPct = (b.y / maxY) * 100;
				const isHighlighted = b.x === s;
				const label = b.y < 1 ? '<1%' : `${Math.round(b.y)}%`;
				const ariaLabel = `${b.x} correct: ${Math.round(b.y)}%`;
				return {
					x: b.x,
					xLabel: String(b.x),
					y: b.y,
					height: `${heightPct}%`,
					background:
						isHighlighted && highlightedBarColorResolved
							? highlightedBarColorResolved
							: barColorResolved || '#000',
					isHighlighted,
					label,
					ariaLabel,
					barColor,
					isHighlightedColor,
					showOutside: b.y <= barLabelCutoff,
					width: `${barWidth}px`,
				};
			});
		},
	},
	actions: {
		getColor: (color) => {
			// determine if theres a hex code at the begining or if this is a string, if its a hex code let it through, if its a string wrap it in var(--)
			if (typeof color !== 'string') {
				return '';
			}
			const isHex = /^#([0-9A-F]{3}){1,2}$/i.test(color);
			return isHex ? color : `var(--wp--preset--color--${color})`;
		}
	},
	callbacks: {},
});
