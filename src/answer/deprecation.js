/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';

import { quizBuilderBinding } from '../bindings/binding-fields';

/**
 * Initialize the deprecation.
 *
 * @param {Object}   attributes The attributes of the block.
 * @param {Object}   supports   The supports of the block.
 * @param {Function} save       The save function of the block.
 */
export function initDeprecation(attributes, supports, save) {
	return [
		{
			attributes,
			supports,
			save,
			migrate: (blockAttributes, innerBlocks) => {
				const answerBinding = createBlock('core/paragraph', {
					placeholder: __(
						'Start typing your answer here…',
						'prc-quiz'
					),
					metadata: {
						bindings: {
							content: quizBuilderBinding('answer-text'),
						},
					},
				});
				if (innerBlocks.length <= 0 || !Array.isArray(innerBlocks)) {
					innerBlocks = [answerBinding];
				}
				return [blockAttributes, innerBlocks];
			},
			isEligible: (_blockAttributes, innerBlocks) => {
				return innerBlocks.length <= 0 || !Array.isArray(innerBlocks);
			},
		},
	];
}
