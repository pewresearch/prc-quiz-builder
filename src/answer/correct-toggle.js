/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { dispatch, useSelect } from '@wordpress/data';
import { KeyboardShortcuts, Toolbar } from '@wordpress/components';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal Dependencies
 */
import Icon from './icon';

/**
 * Handle the toggling of the correct attribute depending on the quiz type and
 * question type.
 *
 * @param {Object}   context       The block context.
 * @param {Array}    otherAnswers  The other answers in this question.
 * @param {Object}   attributes    The block attributes.
 * @param {Function} setAttributes The setAttributes function.
 *
 * @return {void}
 */
function handleCorrectToggle(context, otherAnswers, attributes, setAttributes) {
	const { correct } = attributes;
	const quizType = context['prc-quiz/type'];
	const questionType = context['prc-quiz/question/type'];

	if ('typology' === quizType) {
		return;
	}

	if ('multiple' === questionType) {
		setAttributes({ correct: !correct });
	} else {
		const { updateBlockAttributes } = dispatch(blockEditorStore);
		// Filter other answers to find ones that are also set to correct === true
		const otherTrueAnswers = otherAnswers.filter(
			(block) => true === block.attributes.correct
		);
		// Strip out their clientId's
		const otherClientIds = otherTrueAnswers.map((block) => block.clientId);
		// Set other answers in this question with correct === true to correct === false
		otherClientIds.forEach((id, index) => {
			updateBlockAttributes(id, { correct: false });
		});

		setAttributes({ correct: !correct });
	}
}

function CorrectToolbar({ attributes, setAttributes, context, otherAnswers }) {
	const { correct } = attributes;
	return (
		<Toolbar
			controls={[
				{
					icon: <Icon variant={correct ? `correct` : 'incorrect'} />,
					title: correct
						? __('Correct Answer')
						: __('Incorrect Answer'),
					isActive: correct,
					onClick: () => {
						handleCorrectToggle(
							context,
							otherAnswers,
							attributes,
							setAttributes
						);
					},
				},
			]}
		/>
	);
}

function CorrectKeyboardShortcutWathcer({
	attributes,
	setAttributes,
	context,
	otherAnswers,
	children,
}) {
	const onCorrectKeyShortcut = () =>
		handleCorrectToggle(context, otherAnswers, attributes, setAttributes);

	return (
		<KeyboardShortcuts
			shortcuts={{
				'mod+e': onCorrectKeyShortcut,
			}}
			bindGlobal
		>
			{children}
		</KeyboardShortcuts>
	);
}

function CorrectToggleWatcher({
	clientId,
	context,
	attributes,
	setAttributes,
	children,
	variant = 'keyboard-shortcut',
}) {
	const { correct } = attributes;

	const { otherAnswers = [] } = useSelect(
		(select) => {
			// Get the parentBlock clientId and then the parentBlock itself
			const parentClientId =
				select(blockEditorStore).getBlockRootClientId(clientId);
			const parentBlock =
				select(blockEditorStore).getBlock(parentClientId);
			if ('prc-quiz/question' !== parentBlock.name) {
				return {
					otherAnswers: [],
				};
			}
			// if no parent block
			if (!parentBlock || !parentBlock.innerBlocks) {
				return {
					otherAnswers: [],
				};
			}

			// Remove this block from the list of our parent's innerblocks
			const innerBlocks = parentBlock.innerBlocks.filter(
				(block) => block.clientId !== clientId
			);
			return {
				otherAnswers: innerBlocks,
			};
		},
		[correct]
	);

	if ('toolbar' === variant) {
		return (
			<CorrectToolbar
				attributes={attributes}
				setAttributes={setAttributes}
				context={context}
				otherAnswers={otherAnswers}
			/>
		);
	}

	return (
		<CorrectKeyboardShortcutWathcer
			attributes={attributes}
			setAttributes={setAttributes}
			context={context}
			otherAnswers={otherAnswers}
		>
			{children}
		</CorrectKeyboardShortcutWathcer>
	);
}

export default CorrectToggleWatcher;
