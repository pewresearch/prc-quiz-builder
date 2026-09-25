/**
 * Whether the Pages block (and progress bar) should be visible.
 *
 * Group-results URLs always hide pages so only aggregate results show,
 * including native scrollable and fluid quizzes. Native scrollable
 * quizzes still show pages on individual-results URLs so inline
 * submit-as-you-go results can sit under the questions.
 *
 * @param {Object}  args
 * @param {string}  args.displayType           Resolved display type.
 * @param {string}  args.configuredDisplayType Author-configured display type.
 * @param {boolean} args.displayResults        Individual results URL/state.
 * @param {boolean} args.displayGroupResults   Group-results URL/state.
 * @return {boolean} True when pages should be shown.
 */
export function shouldDisplayPages({
	displayType,
	configuredDisplayType,
	displayResults,
	displayGroupResults,
}) {
	if (displayGroupResults) {
		return false;
	}
	if ('scrollable' === displayType && 'fluid' !== configuredDisplayType) {
		return true;
	}
	return !displayResults;
}
