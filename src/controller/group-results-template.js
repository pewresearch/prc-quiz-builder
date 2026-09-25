/**
 * WordPress Dependencies
 */
import { createBlock } from '@wordpress/blocks';

/**
 * Internal Dependencies
 */
import { buildDefaultScoreHeadingContent } from '../bindings/score-bit';
import { buildDefaultGroupShareHeadingContent } from './group-score-share';
import { GROUP_RESULTS_BLOCK, GROUP_RESULTS_LOCK } from './group-results-sync';
import { communityGroupClassName } from '../result-table/utils';

/**
 * Default locked Group Results inner blocks for a new groups-on insert.
 *
 * @return {Object} Block instance for insertBlock.
 */
export function createGroupResultsBlock() {
	return createBlock(
		GROUP_RESULTS_BLOCK,
		{
			lock: GROUP_RESULTS_LOCK,
		},
		[
			createBlock('core/heading', {
				level: 2,
				textAlign: 'center',
				content: buildDefaultScoreHeadingContent('X'),
			}),
			createBlock('core/heading', {
				level: 3,
				textAlign: 'center',
				content: buildDefaultGroupShareHeadingContent(),
			}),
			createBlock('prc-quiz/result-table', {
				className: communityGroupClassName(),
			}),
		]
	);
}
