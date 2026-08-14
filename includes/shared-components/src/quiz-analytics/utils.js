export { MONTH_LABELS } from '@prc/components';

export const ANALYTICS_POLL_INTERVAL_MS = 5 * 60 * 1000;

// Condense large counts (e.g. 193983 -> "193k"). Truncates rather than rounds
// so the abbreviation reflects the floor of the value; the full number is
// surfaced separately in a hover tooltip.
export function formatCompactNumber(value) {
	const num = Number(value) || 0;
	const abs = Math.abs(num);
	if (abs < 1000) {
		return String(num);
	}
	const units = [
		{ t: 1e9, s: 'b' },
		{ t: 1e6, s: 'm' },
		{ t: 1e3, s: 'k' },
	];
	const { t, s } = units.find((u) => abs >= u.t);
	const scaled = num / t;
	const display =
		Math.abs(scaled) >= 100
			? Math.trunc(scaled)
			: Math.trunc(scaled * 10) / 10;
	return `${display}${s}`;
}

export function formatAnalyticsDate(value) {
	if (!value) {
		return '—';
	}
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}
	return date.toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}

/**
 * Recursively find whether community groups are enabled on the quiz controller.
 *
 * @param {Array} blocks Block editor blocks.
 * @return {boolean} True when a controller block has groups enabled.
 */
export function findGroupsEnabled(blocks = []) {
	for (const block of blocks) {
		if (block.name === 'prc-quiz/controller') {
			return !!block.attributes?.groupsEnabled;
		}
		if (block.innerBlocks?.length) {
			const enabled = findGroupsEnabled(block.innerBlocks);
			if (enabled) {
				return true;
			}
		}
	}
	return false;
}
