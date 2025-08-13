/**
 * External Dependencies
 */
import clsx from 'clsx';
import { useHasSelectedInnerBlock } from '@prc/hooks';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useMemo } from '@wordpress/element';
import {
	useBlockProps,
	useInnerBlocksProps,
	InnerBlocks,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal Dependencies
 */
// eslint-disable-next-line import/no-relative-packages
import Controls from './controls';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @param {Object}   props               Properties passed to the function.
 * @param {Object}   props.attributes    Available block attributes.
 * @param {Function} props.setAttributes Function that updates individual attributes.
 * @param {Object}   props.context       Block context from parent blocks.
 * @param {string}   props.clientId      Block client ID.
 *
 * @return {WPElement} Element to render.
 */
// eslint-disable-next-line max-lines-per-function
export default function Edit({
	attributes,
	setAttributes,
	context,
	clientId,
	__unstableLayoutClassNames: layoutClassNames,
}) {
	const { question, type, uuid, conditionalDisplay } = attributes;

	const quizType = context['prc-quiz/type'];
	const existingUuids = context['prc-quiz/uuids'] || [];
	const blockProps = useBlockProps({
		className: clsx(layoutClassNames),
	});

	const hasSelectedInnerBlock = useHasSelectedInnerBlock(clientId);

	// Check if there are any existing blocks
	const { hasBlocks, answerBlocks } = useSelect(
		(select) => {
			const { getBlocks, getClientIdsOfDescendants, getBlock } =
				select('core/block-editor');
			const blocks = getBlocks(clientId);
			const answerBlocks = getClientIdsOfDescendants(clientId).filter(
				(id) => {
					const block = getBlock(id);
					return block?.name === 'prc-quiz/answer';
				}
			);
			return {
				hasBlocks: blocks && blocks.length > 0,
				answerBlocks,
			};
		},
		[clientId]
	);

	const isThermometer = 'thermometer' === type;

	// eslint-disable-next-line max-len
	// If the quiz type is not freeform then we want to set the default answer block attributes to be correct: false, this will ensure the answer block is in the true|false correct state instead of "undefined" as expected with a freeform quiz.
	const DEFAULT_ANSWER_BLOCK_ATTRS =
		'freeform' !== quizType ? { correct: false } : {};

	const DEFAULT_TEMPLATE = useMemo(() => {
		return [
			[
				'core/paragraph',
				{
					fontSize: 'medium',
					placeholder: __('Enter question text', 'prc-quiz'),
					metadata: {
						bindings: {
							content: {
								source: 'prc-quiz/question',
							},
						},
					},
				},
			],
			[
				'prc-quiz/answer',
				DEFAULT_ANSWER_BLOCK_ATTRS,
				[
					[
						'core/paragraph',
						{
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
			],
		];
	}, [DEFAULT_ANSWER_BLOCK_ATTRS]);

	// eslint-disable-next-line max-len
	const innerBlocksProps = useInnerBlocksProps(blockProps, {
		templateLock: !isThermometer ? false : 'insert',
		template: DEFAULT_TEMPLATE,
		renderAppender:
			hasSelectedInnerBlock && !isThermometer
				? InnerBlocks.ButtonBlockAppender
				: undefined,
		__experimentalDefaultBlock: {
			name: 'prc-quiz/answer',
			attributes: DEFAULT_ANSWER_BLOCK_ATTRS,
			innerBlocks: [
				[
					'core/paragraph',
					{
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
		},
		__experimentalDirectInsert: !hasBlocks,
	});

	/**
	 * Iniitalize a uuid for the question block.
	 */
	useEffect(() => {
		// If a uuid is already set, check if existinguuids includes it, and if it does does it have this clientId? If not then lets set a new uuid using this clientId.
		if (
			uuid &&
			Object.keys(existingUuids).includes(uuid) &&
			existingUuids[uuid] !== clientId
		) {
			console.log('Setting new question uuid');
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

	return (
		<>
			<Controls
				attributes={attributes}
				setAttributes={setAttributes}
				clientId={clientId}
				context={context}
			/>
			<div {...innerBlocksProps} />
		</>
	);
}
