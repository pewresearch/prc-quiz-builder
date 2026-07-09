import { registerBlockVariation } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

import registerQuizBuilderBindings from './quiz-builder-bindings';
import {
	QUIZ_BUILDER_SOURCE,
	isQuizBuilderBindingActive,
} from './binding-fields';

export default function registerQuestionBinding() {
	registerQuizBuilderBindings();

	registerBlockVariation('core/paragraph', {
		name: 'prc-quiz-question-text',
		title: __('Question Text', 'prc-quiz'),
		description: __('Displays the question text.', 'prc-quiz'),
		attributes: {
			fontSize: 'medium',
			metadata: {
				bindings: {
					content: {
						source: QUIZ_BUILDER_SOURCE,
						args: { field: 'question-text' },
					},
				},
			},
		},
		isActive: (blockAttributes, variationAttributes) => {
			const binding = blockAttributes.metadata?.bindings?.content;
			return isQuizBuilderBindingActive(
				binding,
				'prc-quiz/question',
				'question-text'
			);
		},
	});
}
