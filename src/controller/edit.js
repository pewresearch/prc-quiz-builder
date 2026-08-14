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
 * @param {string}   props.clientId      Block client ID.
 * @param {Object}   props.attributes    Available block attributes.
 * @param {Function} props.setAttributes Function that updates individual attributes.
 *
 * @return {Element} Element to render.
 */
export default function Edit({
	attributes,
	setAttributes,
	className,
	clientId,
}) {
	const { allowedBlocks, displayType, groupsEnabled } = attributes;

	const blockProps = useBlockProps({
		className: clsx(className, {
			'is-scrollable': displayType === 'scrollable',
			'is-paged': displayType === 'paged' || displayType === 'fluid',
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
			return relevantBlocks.reduce(
				(acc, { block, clientId: blockClientId }) => {
					const uuid = block.attributes.uuid;
					if (uuid) {
						acc[uuid] = blockClientId;
					}
					return acc;
				},
				{}
			);
		},
		[clientId]
	);

	const { quizId, quizPermalink } = useSelect((select) => {
		const postId = select('core/editor').getCurrentPostId();
		const record = select('core').getEntityRecord(
			'postType',
			'quiz',
			postId
		);
		return {
			quizId: postId,
			quizPermalink: record?.link || '',
		};
	}, []);

	const sampleGroupId = 'sample-group-id';
	const groupBindingContext = useMemo(() => {
		if (!groupsEnabled) {
			return {};
		}

		const baseUrl = quizPermalink || '/quiz/sample-quiz/';
		const resultsUrl = `${baseUrl}group/${sampleGroupId}/results/`;

		return {
			'prc-quiz/group/name': __('Sample Community Group', 'prc-quiz'),
			'prc-quiz/group/response-count': 42,
			'prc-quiz/group/results-url': resultsUrl,
		};
	}, [groupsEnabled, quizPermalink]);

	const blockContextValue = useMemo(
		() => ({
			'prc-quiz/id': quizId,
			'prc-quiz/uuids': existingUuids,
			...groupBindingContext,
		}),
		[quizId, existingUuids, groupBindingContext]
	);

	return (
		<>
			<Controls
				attributes={attributes}
				setAttributes={setAttributes}
				clientId={clientId}
			/>
			<div {...innerBlocksProps}>
				<BlockContextProvider value={blockContextValue}>
					<div {...innerBlocksProps} />
				</BlockContextProvider>
			</div>
		</>
	);
}
