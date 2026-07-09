import { registerBlockVariation } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

import registerQuizBuilderBindings from './quiz-builder-bindings';
import {
	QUIZ_BUILDER_SOURCE,
	isQuizBuilderBindingActive,
} from './binding-fields';

export default function registerAnswerBinding() {
	registerQuizBuilderBindings();

	registerBlockVariation('core/paragraph', {
		name: 'prc-quiz-answer-text',
		title: __('Answer Text', 'prc-quiz'),
		description: __('Displays the answer text.', 'prc-quiz'),
		attributes: {
			placeholder: __('Start typing your answer here...', 'prc-quiz'),
			metadata: {
				bindings: {
					content: {
						source: QUIZ_BUILDER_SOURCE,
						args: { field: 'answer-text' },
					},
				},
			},
		},
		ancestor: ['prc-quiz/answer'],
		isActive: (blockAttributes, variationAttributes) => {
			const binding = blockAttributes.metadata?.bindings?.content;
			return isQuizBuilderBindingActive(
				binding,
				'prc-quiz/answer',
				'answer-text'
			);
		},
	});
}
