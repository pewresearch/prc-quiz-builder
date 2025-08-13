/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';

/**
 * Initialize the deprecation.
 *
 * @param {Object} attributes - The attributes of the block.
 * @param {Object} supports - The supports of the block.
 * @param {Function} save - The save function of the block.
 */
export function initDeprecation(attributes, supports, save) {
	return [
		{
			attributes,
			supports,
			save,
			migrate: (attributes, innerBlocks) => {
				const answerBinding = createBlock('core/paragraph', {
					placeholder: __(
						'Start typing your answer here...',
						'prc-quiz'
					),
					metadata: {
						bindings: {
							content: {
								source: 'prc-quiz/answer',
							},
						},
					},
				});
				if (innerBlocks.length <= 0 || !Array.isArray(innerBlocks)) {
					innerBlocks = [answerBinding];
				}
				return [attributes, innerBlocks];
			},
			isEligible: (attributes, innerBlocks) => {
				return innerBlocks.length <= 0 || !Array.isArray(innerBlocks);
			},
		},
	];
}
