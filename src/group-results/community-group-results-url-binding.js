import {
	registerBlockBindingsSource,
	registerBlockVariation,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

export default function registerCommunityGroupResultsUrlBinding() {
	registerBlockBindingsSource({
		name: 'prc-quiz/community-group-results-url',
		label: __('Community Group Results URL', 'prc-quiz'),
		usesContext: ['prc-quiz/group/results-url'],
		getValues({ context }) {
			const resultsUrl = context['prc-quiz/group/results-url'];
			if (resultsUrl) {
				return {
					url: resultsUrl,
				};
			}

			return {
				placeholder: __(
					'Group results URL (available on group quiz URLs)',
					'prc-quiz'
				),
			};
		},
		canUserEditValue() {
			return false;
		},
	});

	registerBlockVariation('core/button', {
		name: 'prc-quiz-community-group-results-link',
		title: __('Community Group Results Link', 'prc-quiz'),
		description: __(
			'Links to the community group aggregate results page.',
			'prc-quiz'
		),
		attributes: {
			text: __('View group results', 'prc-quiz'),
			className: 'prc-quiz-community-group-results-link',
			metadata: {
				bindings: {
					url: {
						source: 'prc-quiz/community-group-results-url',
					},
				},
			},
		},
		ancestor: ['prc-quiz/controller'],
		isActive: (blockAttributes, variationAttributes) => {
			return (
				blockAttributes.metadata?.bindings?.url?.source ===
				variationAttributes.metadata?.bindings.url.source
			);
		},
	});
}
