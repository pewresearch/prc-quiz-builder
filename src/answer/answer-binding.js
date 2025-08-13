import {
	registerBlockBindingsSource,
	registerBlockVariation,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';

export default function registerAnswerBinding() {
	registerBlockBindingsSource({
		name: 'prc-quiz/answer',
		label: __('Quiz Answer', 'prc-quiz'),
		usesContext: ['prc-quiz/answer/text', 'prc-quiz/answer/uuid'],
		getValues({ select, context }) {
			const answer = context['prc-quiz/answer/text'];
			if (answer) {
				return {
					content: answer,
				};
			}

			return {
				placeholder: __('Start typing your answer here!', 'prc-quiz'),
			};
		},
		setValues({ select, dispatch, context, bindings }) {
			const { newValue } = bindings.content;
			const { getSelectedBlockClientId, getBlockRootClientId } =
				select(blockEditorStore);
			const { updateBlockAttributes } = dispatch(blockEditorStore);

			// Get the currently selected paragraph block.
			const selectedBlockClientId = getSelectedBlockClientId();
			// Find the root, answer block.
			const answerBlockClientId = getBlockRootClientId(
				selectedBlockClientId
			);

			updateBlockAttributes(answerBlockClientId, {
				answer: newValue,
			});
		},
		canUserEditValue({ select, context }) {
			return true;
		},
	});

	registerBlockVariation('core/paragraph', {
		name: 'prc-quiz-answer-text',
		title: __('Answer Text', 'prc-quiz'),
		description: __('Displays the answer text.', 'prc-quiz'),
		attributes: {
			placeholder: __('Start typing your answer here...', 'prc-quiz'),
			metadata: {
				bindings: {
					content: {
						source: 'prc-quiz/answer',
					},
				},
			},
		},
		ancestor: ['prc-quiz/answer'],
		isActive: (blockAttributes, variationAttributes) => {
			return (
				blockAttributes.metadata?.bindings?.content?.source ===
				variationAttributes.metadata?.bindings.content.source
			);
		},
	});
}
