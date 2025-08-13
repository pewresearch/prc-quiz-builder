/**
 * External Dependencies
 */
import clsx from 'clsx';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch, select } from '@wordpress/data';
import {
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';

/**
 * Internal Dependencies
 */
// eslint-disable-next-line import/no-relative-packages
import Controls from './controls';
import { CorrectToolbar } from './correct-toggle';

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
	__unstableLayoutClassNames: layoutClassNames,
}) {
	const { correct, uuid, conditionalDisplay } = attributes;
	const existingUuids = context['prc-quiz/uuids'] || [];

	// Determine quiz and question types from context (stable across renders)
	const quizType = context['prc-quiz/type'];
	const questionType = context['prc-quiz/question/type'];

	// Access block editor dispatcher once (hooks must be top-level)
	const { updateBlockAttributes } = useDispatch(blockEditorStore);

	/**
	 * Handle toggling the correct state for this answer.
	 * For single-choice questions, ensures only one answer can be correct.
	 */
	const handleToggleCorrect = () => {
		if ('freeform' === quizType) {
			return;
		}
		const newCorrectState = !correct;

		// For single-choice questions, set all other answers to false first
		if (questionType === 'single' && newCorrectState === true) {
			// Find all other answer blocks in the same question
			const {
				getBlockParentsByBlockName,
				getClientIdsOfDescendants,
				getBlock,
			} = select(blockEditorStore);

			const [questionClientId] = getBlockParentsByBlockName(
				clientId,
				'prc-quiz/question'
			);

			if (questionClientId) {
				const descendantClientIds =
					getClientIdsOfDescendants(questionClientId);
				const otherAnswerClientIds = descendantClientIds.filter(
					(descendantId) => {
						const block = getBlock(descendantId);
						return (
							block?.name === 'prc-quiz/answer' &&
							descendantId !== clientId
						);
					}
				);

				// Set all other answers to false
				otherAnswerClientIds.forEach((id) => {
					updateBlockAttributes(id, { correct: false, points: 0 });
				});
			}
		}

		// Set this answer's correct state
		setAttributes({
			correct: newCorrectState,
			points: newCorrectState ? 1 : 0,
		});
	};

	const blockProps = useBlockProps({
		className: clsx(className, layoutClassNames, {
			'is-correct': correct,
		}),
	});

	const innerBlocksProps = useInnerBlocksProps(blockProps, {
		template: [
			[
				'core/paragraph',
				{
					placeholder: __(
						'Start typing your answer here...',
						'prc-quiz'
					),
					metadata: {
						bindings: {
							content: {
								source: 'prc-quiz/answer',
							},
						},
					},
				},
			],
		],
	});

	/**
	 * Iniitalize a uuid for the answer block.
	 */
	useEffect(() => {
		// If a uuid is already set, check if existinguuids includes it, and if it does does it have this clientId? If not then lets set a new uuid using this clientId.
		if (
			uuid &&
			Object.keys(existingUuids).includes(uuid) &&
			existingUuids[uuid] !== clientId
		) {
			console.log('Setting new answer uuid');
			setAttributes({
				uuid: clientId,
			});
		}
		// If the uuid is not set, set it to the clientId.
		if (!uuid) {
			setAttributes({
				uuid: clientId,
			});
		}
	}, [existingUuids]);

	/**
	 * If the quiz type changes to freeform, remove the correct attribute from the answer.
	 */
	useEffect(() => {
		if (quizType === 'freeform') {
			setAttributes({
				correct: undefined,
			});
		}
	}, [quizType]);

	/**
	 * Enforce 1|0 point value for correct|incorrect answers.
	 */
	// useEffect(() => {
	// 	// Is this is a freeform quiz do not try to set the points.
	// 	if ('freeform' === quizType) {
	// 		return;
	// 	}

	// 	// If no points are set and this answer is marked as correct then assign 1 point to this answer.
	// 	if ((undefined === points || 0 === points) && true === correct) {
	// 		setAttributes({
	// 			points: 1,
	// 		});
	// 	}
	// 	// If points are set and this answer is marked as inccorrect then remove points from this answer.
	// 	if (true !== correct && undefined !== points) {
	// 		setAttributes({
	// 			points: 0,
	// 		});
	// 	}
	// }, [correct, points, quizType, setAttributes]);

	return (
		<>
			<Controls
				attributes={attributes}
				clientId={clientId}
				context={context}
				setAttributes={setAttributes}
				handleToggleCorrect={handleToggleCorrect}
			/>
			<CorrectToolbar
				context={context}
				correct={correct}
				onToggle={handleToggleCorrect}
			/>
			<div {...innerBlocksProps}>{innerBlocksProps.children}</div>
		</>
	);
}
