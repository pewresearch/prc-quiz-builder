import { registerBlockVariation } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

import registerQuizBuilderBindings from './quiz-builder-bindings';
import {
	QUIZ_BUILDER_SOURCE,
	isQuizBuilderBindingActive,
} from './binding-fields';

export default function registerPageTitleBinding() {
	registerQuizBuilderBindings();

	registerBlockVariation('core/paragraph', {
		name: 'prc-quiz-page-title-text',
		title: __('Page Title Text', 'prc-quiz'),
		description: __('Displays the page title text.', 'prc-quiz'),
		attributes: {
			fontSize: 'large',
			metadata: {
				bindings: {
					content: {
						source: QUIZ_BUILDER_SOURCE,
						args: { field: 'page-title-text' },
					},
				},
			},
		},
		ancestor: ['prc-quiz/page'],
		isActive: (blockAttributes, variationAttributes) => {
			const binding = blockAttributes.metadata?.bindings?.content;
			return isQuizBuilderBindingActive(
				binding,
				'prc-quiz/page-title',
				'page-title-text'
			);
		},
	});
}
