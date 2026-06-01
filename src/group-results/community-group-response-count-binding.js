import {
	registerBlockBindingsSource,
	registerBlockVariation,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Format response count for bound paragraph content.
 *
 * @param {number|string} count Response count.
 * @return {string} Formatted response count string.
 */
export function formatCommunityGroupResponseCount(count) {
	const total = Number(count) || 0;
	return `**${total}** responses`;
}

export default function registerCommunityGroupResponseCountBinding() {
	registerBlockBindingsSource({
		name: 'prc-quiz/community-group-response-count',
		label: __('Community Group Response Count', 'prc-quiz'),
		usesContext: ['prc-quiz/group/response-count'],
		getValues({ context }) {
			const responseCount = context['prc-quiz/group/response-count'];
			if (responseCount !== undefined && responseCount !== null) {
				return {
					content: formatCommunityGroupResponseCount(responseCount),
				};
			}

			return {
				placeholder: formatCommunityGroupResponseCount(0),
			};
		},
		canUserEditValue() {
			return false;
		},
	});

	registerBlockVariation('core/paragraph', {
		name: 'prc-quiz-community-group-response-count',
		title: __('Community Group Response Count', 'prc-quiz'),
		description: __(
			'Displays the number of responses for the community group.',
			'prc-quiz'
		),
		attributes: {
			metadata: {
				bindings: {
					content: {
						source: 'prc-quiz/community-group-response-count',
					},
				},
			},
		},
		ancestor: ['prc-quiz/group-results'],
		isActive: (blockAttributes, variationAttributes) => {
			return (
				blockAttributes.metadata?.bindings?.content?.source ===
				variationAttributes.metadata?.bindings.content.source
			);
		},
	});
}
