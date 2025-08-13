/**
 * External Dependencies
 */

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import {
	useBlockProps,
	RichText,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal Dependencies
 */

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @param {Object}   props               Properties passed to the function.
 * @param {Object}   props.attributes    Available block attributes.
 * @param {Function} props.setAttributes Function that updates individual attributes.
 * @param {Object}   props.context       Context object.
 * @param {string}   props.clientId      The block's client ID.
 * @param {boolean}  props.isSelected    Whether the block is selected.
 *
 * @return {WPElement} Element to render.
 */
export default function Edit({
	attributes,
	setAttributes,
	context,
	clientId,
	isSelected,
}) {
	const { numberOfQuestions } = attributes;

	const blockProps = useBlockProps({});

	const { numberOfQuestionBlocks } = useSelect(
		(select) => {
			// Get the parent controller block, then count the number of question blocks inside.
			const { getBlocksByName } = select(blockEditorStore);
			const questionBlocks = getBlocksByName('prc-quiz/question');
			return {
				numberOfQuestionBlocks: questionBlocks.length || 0,
			};
		},
		[clientId]
	);

	return (
		<h1 {...blockProps}>
			You answered{' '}
			<strong>
				{__('{score}')} of{' '}
				<RichText
					tagName="span"
					value={numberOfQuestions}
					onChange={(val) =>
						setAttributes({ numberOfQuestions: val })
					}
					placeholder={numberOfQuestionBlocks}
					allowedFormats={[]}
					keepPlaceholderOnFocus
				/>
			</strong>{' '}
			questions correctly.
		</h1>
	);
}
