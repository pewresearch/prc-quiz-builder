/**
 * External Dependencies
 */

/**
 * WordPress Dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	InnerBlocks,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

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
 * @param {Object}   props               Properties passed to the function.
 * @param {Object}   props.attributes    Available block attributes.
 * @param            props.context
 * @param            props.clientId
 * @param            props.isSelected
 * @param {Function} props.setAttributes Function that updates individual attributes.
 *
 * @return {WPElement} Element to render.
 */
export default function Edit({
	attributes,
	setAttributes,
	context,
	clientId,
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
		// 							source: 'prc-quiz/page-title',
		// 						},
		// 					},
		// 				},
		// 			},
		// 		],
		// 		['prc-quiz/question', {}],
		// 	],
		// },
	});

	return <div {...innerBlocksProps} />;
}
