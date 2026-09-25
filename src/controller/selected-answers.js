/**
 * Flatten selectedAnswers (question UUID → answer UUID[]) to a UUID list.
 *
 * @param {Object|Array|null|undefined} selectedAnswers
 * @return {string[]} Answer UUIDs from every question key, including named keys on an Array.
 */
export function flattenSelectedAnswers(selectedAnswers) {
	if (!selectedAnswers || typeof selectedAnswers !== 'object') {
		return [];
	}
	return Object.values(selectedAnswers)
		.flat()
		.filter((uuid) => typeof uuid === 'string' && uuid.length > 0);
}

/**
 * Whether the selection set meets the controller answer threshold.
 *
 * @param {Object|Array|null|undefined}  selectedAnswers
 * @param {number|string|null|undefined} threshold
 * @return {boolean} True when the flattened selection count meets the threshold.
 */
export function meetsAnswerThreshold(selectedAnswers, threshold) {
	return flattenSelectedAnswers(selectedAnswers).length >= Number(threshold);
}
