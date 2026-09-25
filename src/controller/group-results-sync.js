/**
 * Keep `groupsEnabled` and the Group Results inner block in one legal shape.
 *
 * Presence:
 *   absent   — no `prc-quiz/group-results` child
 *   unlocked — child exists, `lock.remove` is not true
 *   locked   — child exists, `lock.remove` is true
 *
 * Invariants:
 *   groupsEnabled true  → locked (insert if missing)
 *   groupsEnabled false → not locked
 *
 * Legal leftovers after disable:
 *   unlocked (author kept the block)
 *   absent   (author never had one, or confirmed delete)
 */

export const GROUP_RESULTS_BLOCK = 'prc-quiz/group-results';
export const RESULTS_BLOCK = 'prc-quiz/results';
export const GROUP_RESULTS_LOCK = { remove: true };

/**
 * @typedef {'absent' | 'unlocked' | 'locked'} GroupResultsKind
 * @typedef {{ kind: 'absent' } | { kind: 'unlocked' | 'locked', clientId: string }} GroupResultsPresence
 * @typedef {{
 *   action: 'none' | 'insert-and-lock' | 'lock' | 'unlock',
 *   clientId?: string,
 *   insertIndex?: number,
 * }} GroupResultsPlan
 */

/**
 * @param {Array<{ name?: string, clientId?: string, attributes?: { lock?: { remove?: boolean } } }>} innerBlocks
 * @return {GroupResultsPresence} Presence of the Group Results child.
 */
export function getGroupResultsPresence(innerBlocks = []) {
	const block = innerBlocks.find(
		(candidate) => GROUP_RESULTS_BLOCK === candidate?.name
	);
	if (!block?.clientId) {
		return { kind: 'absent' };
	}
	if (true === block.attributes?.lock?.remove) {
		return { kind: 'locked', clientId: block.clientId };
	}
	return { kind: 'unlocked', clientId: block.clientId };
}

/**
 * @param {Array<{ name?: string }>} innerBlocks
 * @return {number} Index after Results, or the end of the list.
 */
export function insertIndexForGroupResults(innerBlocks = []) {
	const resultsIndex = innerBlocks.findIndex(
		(block) => RESULTS_BLOCK === block?.name
	);
	return -1 === resultsIndex ? innerBlocks.length : resultsIndex + 1;
}

/**
 * @param {{ groupsEnabled: boolean, innerBlocks?: Array<Object> }} input
 * @return {GroupResultsPlan} Editor mutation needed to restore the invariant.
 */
export function planGroupResultsSync({ groupsEnabled, innerBlocks = [] }) {
	const presence = getGroupResultsPresence(innerBlocks);

	if (groupsEnabled) {
		if ('absent' === presence.kind) {
			return {
				action: 'insert-and-lock',
				insertIndex: insertIndexForGroupResults(innerBlocks),
			};
		}
		if ('unlocked' === presence.kind) {
			return { action: 'lock', clientId: presence.clientId };
		}
		return { action: 'none' };
	}

	if ('locked' === presence.kind) {
		return { action: 'unlock', clientId: presence.clientId };
	}

	return { action: 'none' };
}
