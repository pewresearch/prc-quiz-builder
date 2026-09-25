/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	InnerBlocks,
} from '@wordpress/block-editor';
import { Placeholder } from '@wordpress/components';

/**
 * Internal Dependencies
 */
const TEMPLATE = [['prc-quiz/page', {}]];

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @param {Object}  props                            Properties passed to the function.
 * @param {Object}  props.attributes                 Available block attributes.
 * @param {boolean} props.isSelected                 Whether the block is selected.
 * @param {string}  props.__unstableLayoutClassNames Layout class names from the block editor.
 *
 * @return {Element} Element to render.
 */
export default function Edit({
	attributes,
	isSelected,
	__unstableLayoutClassNames: layoutClassNames,
}) {
	const blockProps = useBlockProps({
		className: layoutClassNames,
	});
	const { orientation } = attributes;

	const innerBlocksProps = useInnerBlocksProps(blockProps, {
		orientation: orientation || 'vertical',
		templateLock: false,
		template: TEMPLATE,
		renderAppender: isSelected
			? InnerBlocks.ButtonBlockAppender
			: undefined,
		// __experimentalDirectInsert: true,
		// __experimentalDefaultBlock: {
		// 	name: 'prc-quiz/page',
		// 	attributes: {},
		// 	innerBlocks: [
		// 		[
		// 			'core/paragraph',
		// 			{
		// 				placeholder: __('Enter page title', 'prc-quiz'),
		// 				metadata: {
		// 					bindings: {
		// 						content: {
		// 							source: 'prc-quiz/builder',
		// 							args: { field: 'page-title-text' },
		// 						},
		// 					},
		// 				},
		// 			},
		// 		],
		// 		['prc-quiz/question', {}],
		// 	],
		// },
	});

	return (
		<div {...blockProps}>
			<Placeholder
				label={__('Pages', 'prc-quiz')}
				instructions={__(
					'Contains the pages, questions, and answers of the quiz. This is the main content and interactive application of the quiz.',
					'prc-quiz'
				)}
			/>
			{innerBlocksProps.children}
		</div>
	);
}
