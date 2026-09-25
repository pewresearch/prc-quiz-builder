/**
 * Histogram population bins: how many people scored each number of
 * correct answers. Stored on the Quiz Controller and read by the
 * histogram chart and the Adults Receiving This Score binding.
 */

export const ADULTS_RECEIVING_SCORE_FALLBACK =
	'X% of U.S. adults receive this score';

/**
 * @typedef {Object} HistogramBin
 * @property {number} correct Number of correct answers.
 * @property {number} percent Share of the public who scored that many (0–100).
 */

/**
 * Parse stored histogram population data.
 * Accepts a JSON string or array. Legacy `{x, y}` rows map to
 * `{correct, percent}`.
 *
 * @param {string|Array|null|undefined} raw Stored value.
 * @return {HistogramBin[]} Parsed bins, not yet padded.
 */
export function parseHistogramPopulation(raw) {
	let source = raw;
	if (typeof raw === 'string') {
		try {
			source = JSON.parse(raw || '[]');
		} catch {
			return [];
		}
	}
	if (!Array.isArray(source)) {
		return [];
	}
	return source
		.map((row) => {
			const correct = Number(row?.correct ?? row?.x);
			const percent = Number(row?.percent ?? row?.y);
			if (!Number.isFinite(correct) || !Number.isFinite(percent)) {
				return null;
			}
			return { correct, percent };
		})
		.filter(Boolean);
}

/**
 * Pad bins into a contiguous 0..maxCorrect series.
 *
 * @param {HistogramBin[]} bins          Parsed bins.
 * @param {number}         questionCount Question total (inclusive max).
 * @return {HistogramBin[]} Padded bins.
 */
export function normalizeHistogramBins(bins, questionCount = 0) {
	const byCorrect = new Map(
		(bins || []).map((bin) => [bin.correct, bin.percent])
	);
	const maxFromData = bins?.length
		? Math.max(...bins.map((bin) => bin.correct))
		: 0;
	const maxCorrect = Math.max(maxFromData, Number(questionCount) || 0, 0);
	const padded = [];
	for (let correct = 0; correct <= maxCorrect; correct += 1) {
		padded.push({
			correct,
			percent: byCorrect.has(correct) ? byCorrect.get(correct) : 0,
		});
	}
	return padded;
}

/**
 * Bins shown in the histogram editor.
 * Stored rows as-is; empty data seeds 0..questionCount.
 *
 * @param {HistogramBin[]} parsed        Parsed stored bins.
 * @param {number}         questionCount Question total (inclusive max).
 * @return {HistogramBin[]} Editor rows.
 */
export function binsForEditor(parsed, questionCount = 0) {
	if (parsed?.length) {
		return parsed;
	}
	return normalizeHistogramBins([], questionCount);
}

/**
 * Next unused correct-answer count for an added row.
 *
 * @param {HistogramBin[]} bins Editor rows.
 * @return {number} Next correct value.
 */
export function nextHistogramCorrect(bins) {
	if (!bins?.length) {
		return 0;
	}
	return Math.max(...bins.map((bin) => Number(bin.correct) || 0)) + 1;
}

/**
 * Prefer controller bins; fall back to legacy histogram-block data
 * when the controller value is empty.
 *
 * @param {string|Array|null|undefined} primary       Controller value.
 * @param {string|Array|null|undefined} fallback      Histogram-block value.
 * @param {number}                      questionCount Question total (inclusive max).
 * @return {HistogramBin[]} Padded bins.
 */
export function resolveHistogramBins(primary, fallback, questionCount = 0) {
	const fromPrimary = parseHistogramPopulation(primary);
	const parsed = fromPrimary.length
		? fromPrimary
		: parseHistogramPopulation(fallback);
	return normalizeHistogramBins(parsed, questionCount);
}

/**
 * Serialize bins for the controller attribute.
 *
 * @param {HistogramBin[]} bins Bins to store.
 * @return {string} JSON string.
 */
export function serializeHistogramPopulation(bins) {
	return JSON.stringify(
		(bins || []).map((bin) => ({
			correct: Number(bin.correct) || 0,
			percent: Number(bin.percent) || 0,
		}))
	);
}

/**
 * Public share for a given score.
 *
 * @param {HistogramBin[]} bins  Normalized bins.
 * @param {number}         score Participant score.
 * @return {number} Percent 0–100.
 */
export function percentForScore(bins, score) {
	const found = (bins || []).find((bin) => bin.correct === Number(score));
	const percent = Number(found?.percent);
	return Number.isFinite(percent) ? percent : 0;
}

/**
 * Format the bound Adults Receiving This Score sentence.
 *
 * @param {number} percent Share of the public (0–100).
 * @return {string} Sentence with a rounded percent.
 */
export function formatAdultsReceivingThisScore(percent) {
	const n = Number(percent);
	if (!Number.isFinite(n)) {
		return ADULTS_RECEIVING_SCORE_FALLBACK;
	}
	const rounded = Math.min(100, Math.max(0, Math.round(n)));
	return `${rounded}% of U.S. adults receive this score`;
}
