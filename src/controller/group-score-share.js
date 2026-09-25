/**
 * Community group share of a score cluster: viewer-matched or author-pinned.
 */

/**
 * Internal Dependencies
 */
import { resolveClusterKey } from './group-capability';
import { GROUP_SCORE_SHARE_BIT } from '../bindings/bit-names.js';

export const GROUP_SCORE_SHARE_FALLBACK = 'X%';

export const SHARE_KIND = {
	MISSING_SCORE: 'missing-score',
	MISSING_GROUP: 'missing-group',
	UNMATCHED: 'unmatched',
	READY: 'ready',
};

export const BUCKET_SHARE_KIND = {
	MISSING_BUCKET: 'missing-bucket',
	MISSING_GROUP: 'missing-group',
	READY: 'ready',
};

/**
 * @typedef {'missing-score' | 'missing-group' | 'unmatched' | 'ready'} GroupScoreShareKind
 * @typedef {{ kind: 'missing-score' } | { kind: 'missing-group' } | { kind: 'unmatched' } | { kind: 'ready', percent: number, clusterKey: string }} GroupScoreShare
 * @typedef {'missing-bucket' | 'missing-group' | 'ready'} GroupBucketShareKind
 * @typedef {{ kind: 'missing-bucket' } | { kind: 'missing-group' } | { kind: 'ready', percent: number, clusterKey: string }} GroupBucketShare
 * @typedef {{ total: number, clusters: Record<string, number> }} GroupTally
 * @typedef {{ total: number, answers: Record<string, number> }} GroupAnswerTally
 */

/**
 * @param {unknown} score Viewer score from userScore.
 * @return {boolean} Whether a score is present, including zero.
 */
export function hasViewerScore(score) {
	if ('number' === typeof score) {
		return Number.isFinite(score);
	}
	if ('string' === typeof score) {
		return '' !== score.trim();
	}
	return false;
}

/**
 * Parse Firebase group tallies into a tally object.
 *
 * @param {unknown} raw groupData from group-results context.
 * @return {GroupTally|null} Parsed tally, or null when unusable.
 */
export function parseGroupTally(raw) {
	if (!raw || 'object' !== typeof raw) {
		return null;
	}
	const total = Number(raw.total);
	if (!Number.isFinite(total) || total < 0) {
		return null;
	}
	const source = raw.clusters ?? raw.typology_groups;
	if (!source || 'object' !== typeof source || Array.isArray(source)) {
		return null;
	}
	const clusters = {};
	Object.entries(source).forEach(([key, value]) => {
		const count = Number(value);
		if (Number.isFinite(count)) {
			clusters[key] = count;
		}
	});
	return { total, clusters };
}

/**
 * Parse Firebase group answer counts into a tally object.
 *
 * Missing or non-object `answers` yields an empty map. `total` of 0 is valid.
 *
 * @param {unknown} raw groupData from group-results context.
 * @return {GroupAnswerTally|null} Parsed tally, or null when unusable.
 */
export function parseGroupAnswerTally(raw) {
	if (!raw || 'object' !== typeof raw) {
		return null;
	}
	const total = Number(raw.total);
	if (!Number.isFinite(total) || total < 0) {
		return null;
	}
	const source = raw.answers;
	const answers = {};
	if (source && 'object' === typeof source && !Array.isArray(source)) {
		Object.entries(source).forEach(([key, value]) => {
			const count = Number(value);
			if (Number.isFinite(count)) {
				answers[key] = count;
			}
		});
	}
	return { total, answers };
}

/**
 * @param {unknown} groupData Firebase group payload.
 * @return {GroupTally|null} Tally when total is greater than zero.
 */
function usableGroupTally(groupData) {
	const tally = parseGroupTally(groupData);
	if (!tally || tally.total <= 0) {
		return null;
	}
	return tally;
}

/**
 * @param {unknown} groupData Firebase group payload.
 * @return {boolean} Whether clusters and a positive total are present.
 */
export function hasUsableGroupTally(groupData) {
	return Boolean(usableGroupTally(groupData));
}

/**
 * @param {number} count Cluster count.
 * @param {number} total Group total.
 * @return {number} Percent 0–100.
 */
function percentOf(count, total) {
	return Math.min(100, Math.max(0, Math.round((count / total) * 100)));
}

function clusterKeyForScore(score, capability) {
	const fallback =
		'string' === typeof score || 'number' === typeof score
			? String(score)
			: null;
	const key = resolveClusterKey(score, capability, fallback);
	return key || null;
}

/**
 * @param {Object}  args
 * @param {unknown} args.score        Viewer score.
 * @param {Object}  [args.capability] Resolved group capability.
 * @param {unknown} args.groupData    Firebase group payload.
 * @return {GroupScoreShare} Share union for the viewer and group.
 */
export function resolveGroupScoreShare({ score, capability, groupData } = {}) {
	if (!hasViewerScore(score)) {
		return { kind: SHARE_KIND.MISSING_SCORE };
	}
	const tally = usableGroupTally(groupData);
	if (!tally) {
		return { kind: SHARE_KIND.MISSING_GROUP };
	}
	const clusterKey = clusterKeyForScore(score, capability);
	if (!clusterKey) {
		return { kind: SHARE_KIND.UNMATCHED };
	}
	const count = Number(tally.clusters[clusterKey] ?? 0);
	const percent = percentOf(count, tally.total);
	return {
		kind: SHARE_KIND.READY,
		percent,
		clusterKey,
	};
}

/**
 * @param {GroupScoreShare} share
 * @return {string} Cache-safe fragment such as "13%".
 */
export function formatGroupScoreShareLabel(share) {
	if (!share || SHARE_KIND.READY !== share.kind) {
		return GROUP_SCORE_SHARE_FALLBACK;
	}
	return `${share.percent}%`;
}

/**
 * Read the author-chosen bucket id from a bit span's iAPI attributes.
 *
 * Use `getElement().attributes`, not `ref.dataset`. `ref.current` is null
 * on the first computed, and a static `groupData` context does not re-run it.
 *
 * @param {Record<string, string>|null|undefined} attributes
 * @return {string} Bucket id, or empty string when absent.
 */
export function readBucketIdFromAttributes(attributes) {
	if (!attributes || 'object' !== typeof attributes) {
		return '';
	}
	const raw = attributes['data-score-bucket-id'];
	return 'string' === typeof raw ? raw : '';
}

/**
 * @param {Object}  args
 * @param {unknown} args.bucketId  Author-chosen score bucket id.
 * @param {unknown} args.groupData Firebase group payload.
 * @return {GroupBucketShare} Share union for a pinned bucket and group.
 */
export function resolveGroupBucketShare({ bucketId, groupData } = {}) {
	const clusterKey = 'string' === typeof bucketId ? bucketId.trim() : '';
	if ('' === clusterKey) {
		return { kind: BUCKET_SHARE_KIND.MISSING_BUCKET };
	}
	const tally = usableGroupTally(groupData);
	if (!tally) {
		return { kind: BUCKET_SHARE_KIND.MISSING_GROUP };
	}
	const count = Number(tally.clusters[clusterKey] ?? 0);
	const percent = percentOf(count, tally.total);
	return {
		kind: BUCKET_SHARE_KIND.READY,
		percent,
		clusterKey,
	};
}

/**
 * @param {GroupBucketShare} share
 * @return {string} Cache-safe fragment such as "13%".
 */
export function formatGroupBucketShareLabel(share) {
	if (!share || BUCKET_SHARE_KIND.READY !== share.kind) {
		return GROUP_SCORE_SHARE_FALLBACK;
	}
	return `${share.percent}%`;
}

/**
 * Default Group Results heading with an inline share bit.
 *
 * @return {string} RichText content for core/heading.
 */
export function buildDefaultGroupShareHeadingContent() {
	return `<span class="prc-block-bit" data-prc-block-bit="${GROUP_SCORE_SHARE_BIT}">${GROUP_SCORE_SHARE_FALLBACK}</span> of people in your group receive this score`;
}
