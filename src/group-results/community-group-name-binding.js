import {
	registerBlockBindingsSource,
	registerBlockVariation,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

export default function registerCommunityGroupNameBinding() {
	registerBlockBindingsSource({
		name: 'prc-quiz/community-group-name',
		label: __('Community Group Name', 'prc-quiz'),
		usesContext: ['prc-quiz/group/name'],
		getValues({ context }) {
			const groupName = context['prc-quiz/group/name'];
			if (groupName) {
				return {
					content: groupName,
				};
			}

			return {
				placeholder: __('Community group name', 'prc-quiz'),
			};
		},
		canUserEditValue() {
			return false;
		},
	});

	registerBlockVariation('core/heading', {
		name: 'prc-quiz-community-group-name',
		title: __('Community Group Name', 'prc-quiz'),
		description: __('Displays the community group name.', 'prc-quiz'),
		attributes: {
			level: 1,
			metadata: {
				bindings: {
					content: {
						source: 'prc-quiz/community-group-name',
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
