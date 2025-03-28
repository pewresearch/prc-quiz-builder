/**
 * External Dependencies
 */
import classnames from 'classnames';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment, useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useBlockProps,
	RichText,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal Dependencies
 */
// eslint-disable-next-line import/no-relative-packages
import { onBlockCreation, ConditionalDot } from '@prc/quiz-components';
import Controls from './controls';
import CorrectToggleWatcher from './correct-toggle';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @param {Object}   props                   Properties passed to the function.
 * @param {Object}   props.attributes        Available block attributes.
 * @param            props.className
 * @param            props.clientId
 * @param            props.context
 * @param            props.isSelected
 * @param            props.insertBlocksAfter
 * @param {Function} props.setAttributes     Function that updates individual attributes.
 *
 * @return {WPElement} Element to render.
 */
export default function Edit({
	attributes,
	className,
	clientId,
	context,
	setAttributes,
	isSelected,
	insertBlocksAfter,
}) {
	const { answer, correct, uuid, conditionalDisplay } = attributes;

	const { selectNextBlock } = useDispatch(blockEditorStore);
	const quizType = context['prc-quiz/type'];

	const { nextIndex, nextAnswerClientId, questionClientId } = useSelect(
		(select) => {
			// Get the parentBlock clientId and then the parentBlock itself
			const parentClientId =
				select(blockEditorStore).getBlockRootClientId(clientId);
			const parentBlock =
				select(blockEditorStore).getBlock(parentClientId);
			if ('prc-quiz/question' !== parentBlock.name) {
				return {
					questionClientId: null,
					nextIndex: null,
					nextAnswerClientId: null,
				};
			}

			// Remove this block from the list of our parent's innerblocks
			const innerBlocks = parentBlock.innerBlocks.filter(
				(block) => block.clientId !== clientId
			);
			return {
				questionClientId: parentClientId,
				nextIndex: innerBlocks.length + 1,
				nextAnswerClientId:
					select(blockEditorStore).getAdjacentBlockClientId(clientId),
			};
		},
		[correct]
	);

	// Generates a new answer block after the current one.
	const insertNewBlock = () => {
		const attrs = {};
		if ('typology' !== quizType) {
			attrs.correct = false;
		}
		return insertBlocksAfter(createBlock('prc-quiz/answer', attrs));
	};

	const blockProps = useBlockProps({
		className: classnames(className, {
			'is-correct': correct,
		}),
	});

	const onNextAnswerKeyShortcut = () => {
		if (null !== nextAnswerClientId) {
			selectNextBlock(clientId);
		} else {
			insertNewBlock();
		}
	};

	useEffect(() => {
		onBlockCreation(clientId, uuid, setAttributes);
	}, []);

	return (
		<Fragment>
			<Controls
				attributes={attributes}
				clientId={clientId}
				context={context}
				setAttributes={setAttributes}
			/>
			<div {...blockProps}>
				<ConditionalDot {...{ attributes }} />
				{'typology' === quizType && (
					<RichText
						tagName="div"
						value={answer}
						onChange={(value) => setAttributes({ answer: value })}
						multiline={false}
						allowedFormats={['core/bold', 'core/italic']}
						placeholder={__('Answer text here…')}
						__unstableOnSplitAtEnd={() => onNextAnswerKeyShortcut()}
					/>
				)}
				{'typology' !== quizType && (
					<CorrectToggleWatcher
						clientId={clientId}
						context={context}
						attributes={attributes}
						setAttributes={setAttributes}
					>
						<RichText
							tagName="div"
							value={answer}
							onChange={(value) =>
								setAttributes({ answer: value })
							}
							multiline={false}
							allowedFormats={['core/bold', 'core/italic']}
							placeholder={__('Answer text here…')}
							__unstableOnSplitAtEnd={() =>
								onNextAnswerKeyShortcut()
							}
						/>
					</CorrectToggleWatcher>
				)}
			</div>
		</Fragment>
	);
}
