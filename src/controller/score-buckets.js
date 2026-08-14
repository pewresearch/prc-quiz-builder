/**
 * Score bucket catalog helpers.
 *
 * Buckets are exclusive closed ranges: [min, max] must not intersect.
 *
 * @typedef {{ id: string, label: string, min: number, max: number }} ScoreBucket
 */

/**
 * @param {unknown} value
 * @return {ScoreBucket[]}
 */
export function parseScoreBuckets(value) {
	if (Array.isArray(value)) {
		return normalizeBuckets(value);
	}
	if (typeof value !== 'string' || !value) {
		return [];
	}
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? normalizeBuckets(parsed) : [];
	} catch {
		return [];
	}
}

/**
 * @param {unknown[]} raw
 * @return {ScoreBucket[]}
 */
function normalizeBuckets(raw) {
	return raw
		.map((item, index) => {
			if (!item || typeof item !== 'object') {
				return null;
			}
			const min = Number(item.min);
			const max = Number(item.max);
			if (Number.isNaN(min) || Number.isNaN(max)) {
				return null;
			}
			return {
				id: String(item.id || `bucket-${index}`),
				label: String(item.label || `Group ${index + 1}`),
				min: Math.min(min, max),
				max: Math.max(min, max),
			};
		})
		.filter(Boolean);
}

/**
 * Closed-interval overlap (shared endpoints count as overlap).
 *
 * @param {ScoreBucket} a
 * @param {ScoreBucket} b
 * @return {boolean}
 */
export function rangesOverlap(a, b) {
	return a.min <= b.max && b.min <= a.max;
}

/**
 * @param {ScoreBucket[]} buckets
 * @return {{ ok: true } | { ok: false, message: string }}
 */
export function validateExclusiveBuckets(buckets) {
	for (let i = 0; i < buckets.length; i++) {
		for (let j = i + 1; j < buckets.length; j++) {
			if (rangesOverlap(buckets[i], buckets[j])) {
				return {
					ok: false,
					message: `"${buckets[i].label}" (${buckets[i].min}–${buckets[i].max}) overlaps "${buckets[j].label}" (${buckets[j].min}–${buckets[j].max}). Ranges must be exclusive.`,
				};
			}
		}
	}
	return { ok: true };
}

/**
 * First matching exclusive bucket for a score, or null.
 *
 * @param {number} score
 * @param {ScoreBucket[]} buckets
 * @return {ScoreBucket|null}
 */
export function matchScoreBucket(score, buckets) {
	const numericScore = Number(score);
	if (Number.isNaN(numericScore)) {
		return null;
	}
	return (
		buckets.find(
			(bucket) => numericScore >= bucket.min && numericScore <= bucket.max
		) || null
	);
}

/**
 * @return {string}
 */
export function createBucketId() {
	return `bucket-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
