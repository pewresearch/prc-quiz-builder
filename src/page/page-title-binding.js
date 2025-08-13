import {
	registerBlockBindingsSource,
	registerBlockVariation,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';

export default function registerPageTitleBinding() {
	registerBlockBindingsSource({
		name: 'prc-quiz/page-title',
		label: __('Quiz Page Title', 'prc-quiz'),
		usesContext: ['prc-quiz/page/title', 'prc-quiz/page/uuid'],
		getValues({ select, context }) {
			const pageTitle = context['prc-quiz/page/title'];
			if (pageTitle) {
				return {
					content: pageTitle,
				};
			}

			return {
				placeholder: __('Enter page title', 'prc-quiz'),
			};
		},
		setValues({ select, dispatch, context, bindings }) {
			const { newValue } = bindings.content;
			const { getSelectedBlockClientId, getBlockRootClientId } =
				select(blockEditorStore);
			const { updateBlockAttributes } = dispatch(blockEditorStore);

			// Get the currently selected paragraph block.
			const selectedBlockClientId = getSelectedBlockClientId();
			// Find the root, page title block.
			const pageTitleBlockClientId = getBlockRootClientId(
				selectedBlockClientId
			);

			updateBlockAttributes(pageTitleBlockClientId, {
				title: newValue,
			});
		},
		canUserEditValue({ select, context }) {
			return true;
		},
	});

	registerBlockVariation('core/paragraph', {
		name: 'prc-quiz-page-title-text',
		title: __('Page Title Text', 'prc-quiz'),
		description: __('Displays the page title text.', 'prc-quiz'),
		attributes: {
			fontSize: 'large',
			metadata: {
				bindings: {
					content: {
						source: 'prc-quiz/page-title',
					},
				},
			},
		},
		ancestor: ['prc-quiz/page'],
		isActive: (blockAttributes, variationAttributes) => {
			return (
				blockAttributes.metadata?.bindings?.content?.source ===
				variationAttributes.metadata?.bindings.content.source
			);
		},
	});
}
