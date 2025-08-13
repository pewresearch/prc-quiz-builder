import {
	registerBlockBindingsSource,
	registerBlockVariation,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';

export default function registerQuestionBinding() {
	registerBlockBindingsSource({
		name: 'prc-quiz/question',
		label: __('Quiz Question', 'prc-quiz'),
		usesContext: ['prc-quiz/question/text', 'prc-quiz/question/uuid'],
		getValues({ select, context }) {
			const question = context['prc-quiz/question/text'];
			if (question) {
				return {
					content: question,
				};
			}

			return {};
		},
		setValues({ select, dispatch, context, bindings }) {
			const { newValue } = bindings.content;
			const { getSelectedBlockClientId, getBlockRootClientId } =
				select(blockEditorStore);
			const { updateBlockAttributes } = dispatch(blockEditorStore);

			// Get the currently selected paragraph block.
			const selectedBlockClientId = getSelectedBlockClientId();
			// Find the root, question block.
			const questionBlockClientId = getBlockRootClientId(
				selectedBlockClientId
			);

			updateBlockAttributes(questionBlockClientId, {
				question: newValue,
			});
		},
		canUserEditValue({ select, context }) {
			return true;
		},
	});

	registerBlockVariation('core/paragraph', {
		name: 'prc-quiz-question-text',
		title: __('Question Text', 'prc-quiz'),
		description: __('Displays the question text.', 'prc-quiz'),
		attributes: {
			fontSize: 'medium',
			metadata: {
				bindings: {
					content: {
						source: 'prc-quiz/question',
					},
				},
			},
		},
		isActive: (blockAttributes, variationAttributes) => {
			return (
				blockAttributes.metadata?.bindings?.content?.source ===
				variationAttributes.metadata?.bindings.content.source
			);
		},
	});
}
