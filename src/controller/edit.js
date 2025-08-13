/**
 * External Dependencies
 */
import clsx from 'clsx';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import {
	useBlockProps,
	useInnerBlocksProps,
	BlockContextProvider,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal Dependencies
 */
import Controls from './controls';
import { GenerateQuizButton } from '../utils/ai-generators';

const TEMPLATE = [
	[
		'prc-quiz/pages',
		{},
		[
			[
				'prc-quiz/page',
				{
					title: __('Introduction', 'prc-quiz'),
				},
				[
					['core/post-title', {}],
					[
						'core/paragraph',
						{ placeholder: 'Introduction page content here...' },
					],
				],
			],
			[
				'prc-quiz/page',
				{
					title: __('Question 1 of X', 'prc-quiz'),
				},
			],
		],
	],
	['prc-quiz/results', {}, [['prc-quiz/result-score']]],
];

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @param {Object}   props               Properties passed to the function.
 * @param {string}   props.className     Class name.
 * @param {Object}   props.context       Context.
 * @param {string}   props.clientId      Block client ID.
 * @param {boolean}  props.isSelected    Whether the block is selected.
 * @param {Object}   props.attributes    Available block attributes.
 * @param {Function} props.setAttributes Function that updates individual attributes.
 *
 * @return {WPElement} Element to render.
 */
export default function Edit({
	attributes,
	setAttributes,
	className,
	context,
	clientId,
	isSelected,
}) {
	const { allowedBlocks, displayType } = attributes;

	const blockProps = useBlockProps({
		className: clsx(className, {
			'is-scrollable': displayType === 'scrollable',
			'is-paged': displayType === 'paged',
		}),
	});

	const innerBlocksProps = useInnerBlocksProps(blockProps, {
		allowedBlocks,
		orientation: 'vertical',
		template: TEMPLATE,
	});

	/**
	 * Recursively get all UUIDs from question, answer, and page blocks inside this controller block
	 * We then pass these UUID's via Block Context so that answer, question, and page blocks
	 * can access them and utilize them when copying and pasting blocks in order to generate new unique id's for
	 * the new blocks.
	 */
	const existingUuids = useSelect(
		(select) => {
			const { getClientIdsOfDescendants, getBlock } =
				select('core/block-editor');

			// Get all descendant client IDs
			const descendantClientIds = getClientIdsOfDescendants(clientId);

			// Get all blocks and filter for the ones we want
			const relevantBlocks = descendantClientIds
				.map((id) => ({ block: getBlock(id), clientId: id }))
				.filter(
					({ block }) =>
						block?.name === 'prc-quiz/page' ||
						block?.name === 'prc-quiz/question' ||
						block?.name === 'prc-quiz/answer'
				);

			// Create object with uuid as key and clientId as value, filtering out blocks without uuids
			return relevantBlocks.reduce((acc, { block, clientId }) => {
				const uuid = block.attributes.uuid;
				if (uuid) {
					acc[uuid] = clientId;
				}
				return acc;
			}, {});
		},
		[clientId]
	);

	return (
		<>
			<Controls
				attributes={attributes}
				setAttributes={setAttributes}
				clientId={clientId}
			/>
			<div {...innerBlocksProps}>
				<BlockContextProvider
					value={{
						'prc-quiz/uuids': existingUuids,
					}}
				>
					<div {...innerBlocksProps} />
				</BlockContextProvider>
			</div>
		</>
	);
}
