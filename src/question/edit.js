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
 * @param {Object}   props                            Properties passed to the function.
 * @param {Object}   props.attributes                 Available block attributes.
 * @param {Function} props.setAttributes              Function that updates individual attributes.
 * @param {Object}   props.context                    Block context from parent blocks.
 * @param {string}   props.clientId                   Block client ID.
 * @param {string}   props.__unstableLayoutClassNames Layout class names from the block editor.
 *
 * @return {Element} Element to render.
 */
// eslint-disable-next-line max-lines-per-function
export default function Edit({
	attributes,
	setAttributes,
	context,
	clientId,
	__unstableLayoutClassNames: layoutClassNames,
}) {
	const { type, uuid } = attributes;

	const quizType = context['prc-quiz/type'];
	const existingUuids = context['prc-quiz/uuids'] || [];
	const blockProps = useBlockProps({
		className: clsx(layoutClassNames),
	});

	const hasSelectedInnerBlock = useHasSelectedInnerBlock(clientId);

	// Check if there are any existing blocks
	const { hasBlocks } = useSelect(
		(select) => {
			const { getBlocks } = select('core/block-editor');
			const blocks = getBlocks(clientId);
			return {
				hasBlocks: blocks && blocks.length > 0,
			};
		},
		[clientId]
	);

	const isThermometer = 'thermometer' === type;

	const defaultAnswerBlockAttrs = useMemo(
		() => ('freeform' !== quizType ? { correct: false } : {}),
		[quizType]
	);

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
				defaultAnswerBlockAttrs,
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
	}, [defaultAnswerBlockAttrs]);

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
			attributes: defaultAnswerBlockAttrs,
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
				context={context}
			/>
			<div {...innerBlocksProps} />
		</>
	);
}
