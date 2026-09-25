/**
 * Community-group capability for a quiz controller.
 *
 * Groups are allowed on typology quizzes, on freeform quizzes, or on
 * knowledge quizzes that have a non-empty score-bucket catalog. Callers
 * ask this helper. They do not re-implement the rule.
 */

/**
 * Internal Dependencies
 */
import { matchScoreBucket, parseScoreBuckets } from './score-buckets';

/**
 * @typedef {{ id: string, label: string, min: number, max: number }} ScoreBucket
 * @typedef {{
 *   allowed: true,
 *   source: 'typology',
 * } | {
 *   allowed: true,
 *   source: 'freeform',
 * } | {
 *   allowed: true,
 *   source: 'buckets',
 *   clusters: Record<string, 0>,
 *   buckets: ScoreBucket[],
 * } | {
 *   allowed: false,
 *   source: 'none',
 * }} GroupCapability
 */

/**
 * @return {GroupCapability} Capability when groups are not allowed.
 */
function none() {
	return {
		allowed: false,
		source: 'none',
	};
}

/**
 * @param {ScoreBucket[]} buckets Parsed buckets.
 * @return {Record<string, 0>} Zeroed cluster map keyed by bucket id.
 */
export function clustersFromBuckets(buckets) {
	return buckets.reduce((clusters, bucket) => {
		clusters[bucket.id] = 0;
		return clusters;
	}, {});
}

/**
 * @param {{ quizType?: string, scoreBuckets?: unknown }} [input] Controller attributes.
 * @return {GroupCapability} Resolved capability.
 */
export function resolveGroupCapability(input = {}) {
	const quizType = input.quizType;

	if ('typology' === quizType) {
		return {
			allowed: true,
			source: 'typology',
		};
	}

	if ('quiz' !== quizType && 'freeform' !== quizType) {
		return none();
	}

	const buckets = parseScoreBuckets(input.scoreBuckets);
	if (0 !== buckets.length) {
		return {
			allowed: true,
			source: 'buckets',
			clusters: clustersFromBuckets(buckets),
			buckets,
		};
	}

	if ('freeform' === quizType) {
		return {
			allowed: true,
			source: 'freeform',
		};
	}

	return none();
}

/**
 * Resolve the Firebase cluster key for a submission score.
 *
 * Bucket quizzes map a numeric score to the matching bucket id.
 * Other sources keep a non-empty string score, or the caller fallback.
 *
 * @param {unknown}         score      Submitted score.
 * @param {GroupCapability} capability Resolved capability.
 * @param {string|null}     [fallback] Used when source is not buckets.
 * @return {string|null} Cluster key, or null when a bucket quiz has no match.
 */
export function resolveClusterKey(score, capability, fallback = null) {
	if (!capability || 'buckets' !== capability.source) {
		if ('string' === typeof score && '' !== score) {
			return score;
		}
		return fallback;
	}

	const buckets = capability.buckets || [];
	const asId = null === score || undefined === score ? '' : String(score);
	const byId = buckets.find((bucket) => bucket.id === asId);
	if (byId) {
		return byId.id;
	}

	const matched = matchScoreBucket(score, buckets);
	return matched ? matched.id : null;
}
