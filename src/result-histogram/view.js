/**
 * WordPress Dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

/**
 * Quiz Results Histogram Interactivity
 */
/**
 * Clamp a numeric value into a range.
 *
 * @param {number} value Input value.
 * @param {number} min   Minimum.
 * @param {number} max   Maximum.
 * @return {number} Clamped value.
 */
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Coerce a value to a finite number, otherwise 0.
 *
 * @param {*} v Input value.
 * @return {number} Numeric value.
 */
const toNumber = (v) => {
	const n = Number(v);
	return Number.isFinite(n) ? n : 0;
};

const DEFAULT_COMPARISON =
	'You scored better than {betterThan} of the public, below {lowerThan} of the public and the same as {sameAs}.';

const normalizeBins = (raw, questionCount = 0) => {
	const source = Array.isArray(raw) ? raw : [];
	const mapped = source
		.map((d) => ({ x: toNumber(d.x), y: toNumber(d.y) }))
		.filter((d) => Number.isFinite(d.x) && Number.isFinite(d.y));

	const byX = new Map();
	mapped.forEach((b) => {
		byX.set(b.x, b.y);
	});

	const maxFromData = mapped.length ? Math.max(...mapped.map((b) => b.x)) : 0;
	const maxX = Math.max(maxFromData, toNumber(questionCount), 0);

	const bins = [];
	for (let x = 0; x <= maxX; x += 1) {
		bins.push({ x, y: byX.has(x) ? byX.get(x) : 0 });
	}
	return bins;
};

const formatPct = (n) => `${clamp(Math.round(n), 0, 100)}%`;

const parsePct = (formatted) => {
	const n = Number(String(formatted).replace('%', ''));
	return Number.isFinite(n) ? n : 0;
};

const fillTemplate = (template, values) => {
	let out = String(template || DEFAULT_COMPARISON);
	Object.entries(values).forEach(([key, value]) => {
		out = out.split(`{${key}}`).join(String(value));
	});
	return out;
};

const { state, actions } = store('prc-quiz/controller', {
	state: {
		get answeredCorrectly() {
			return toNumber(state.score);
		},
		get sameAs() {
			const { histogramData } = getContext();
			const bins = normalizeBins(
				histogramData,
				state.numberOfQuestionsTotal
			);
			const s = toNumber(state.score);
			const found = bins.find((b) => b.x === s);
			return formatPct(found?.y ?? 0);
		},
		get betterThan() {
			const { histogramData } = getContext();
			const bins = normalizeBins(
				histogramData,
				state.numberOfQuestionsTotal
			);
			const s = toNumber(state.score);
			const sum = bins.reduce((acc, b) => (b.x < s ? acc + b.y : acc), 0);
			return formatPct(sum);
		},
		get lowerThan() {
			const { histogramData } = getContext();
			const bins = normalizeBins(
				histogramData,
				state.numberOfQuestionsTotal
			);
			const s = toNumber(state.score);
			const sum = bins.reduce((acc, b) => (b.x > s ? acc + b.y : acc), 0);
			return formatPct(sum);
		},
		get comparisonSentence() {
			const context = getContext();
			const {
				comparisonText = DEFAULT_COMPARISON,
				topPerformerText = '',
				lowerPerformerText = '',
				topPerformerThreshold = 75,
				lowerPerformerThreshold = 25,
			} = context;
			const values = {
				betterThan: state.betterThan,
				lowerThan: state.lowerThan,
				sameAs: state.sameAs,
			};
			const better = parsePct(state.betterThan);
			if (topPerformerText && better >= toNumber(topPerformerThreshold)) {
				return fillTemplate(topPerformerText, values);
			}
			if (
				lowerPerformerText &&
				better <= toNumber(lowerPerformerThreshold)
			) {
				return fillTemplate(lowerPerformerText, values);
			}
			return fillTemplate(comparisonText || DEFAULT_COMPARISON, values);
		},
		get getBarStyle() {
			const context = getContext();
			const { bar } = context;
			const { background, height, width } = bar;
			return `height: ${height}; width: ${width}; background-color: ${background}; background: ${background};`;
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
			const bins = normalizeBins(
				histogramData,
				state.numberOfQuestionsTotal
			);
			const maxY = Math.max(1, ...bins.map((b) => b.y));
			const highlightedBarColorResolved =
				actions.getColor(isHighlightedColor) ||
				'var(--wp--preset--color--mustard, #e0b500)';
			const barColorResolved =
				actions.getColor(barColor) ||
				'var(--wp--preset--color--oatmeal, #c8b8a0)';
			return bins.map((b) => {
				const heightPct = (b.y / maxY) * 100;
				const isHighlighted = b.x === s;
				let label = `${Math.round(b.y)}%`;
				if (b.y <= 0) {
					label = '';
				} else if (b.y < 1) {
					label = '<1%';
				}
				const ariaLabel = `${b.x} correct: ${Math.round(b.y)}%`;
				return {
					x: b.x,
					xLabel: String(b.x),
					y: b.y,
					height: `${Math.max(heightPct, b.y > 0 ? 4 : 2)}%`,
					background: isHighlighted
						? highlightedBarColorResolved
						: barColorResolved,
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
			if (typeof color !== 'string' || !color) {
				return '';
			}
			const trimmed = color.trim();
			const isHex = /^#([0-9A-F]{3}){1,2}$/i.test(trimmed);
			if (isHex) {
				return trimmed;
			}
			// withColors may store a CSS var already.
			if (trimmed.startsWith('var(') || trimmed.startsWith('rgb')) {
				return trimmed;
			}
			return `var(--wp--preset--color--${trimmed})`;
		},
	},
	callbacks: {},
});
