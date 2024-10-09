/**
 * External Dependencies
 */
import classNames from 'classnames';

/**
 * WordPress Dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import {
	useBlockProps,
	RichText,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal Dependencies
 */
// eslint-disable-next-line import/no-relative-packages
import { onBlockCreation } from '@prc/quiz-components';
import NewPageKeyboardHandler from './NewPageKeyboardHandler';
import Actions from './Actions';

const TEMPLATE = [['prc-quiz/question', {}]];
const ALLOWED_BLOCKS = [
	'prc-quiz/question',
	'core/image',
	'core/paragraph',
	'core/heading',
	'core/table',
];
// a version of allowed_blocks without the questino block
const ALLOWED_BLOCKS_INTRO_PAGE = [
	'core/image',
	'core/paragraph',
	'core/cover',
	'core/group',
	'core/heading',
	'core/table',
	'core/post-title',
	'prc-block/bylines-display',
	'prc-block/bylines-query',
	'prc-block/related-query',
];

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @param            attributes.attributes
 * @param {Object}   attributes               Available block attributes.
 * @param {Function} setAttributes            Function that updates individual attributes.
 * @param {string}   className                Class name.
 * @param {Object}   context                  Context.
 * @param            attributes.setAttributes
 * @param            attributes.className
 * @param            attributes.context
 * @param            attributes.clientId
 * @param            attributes.isSelected
 * @param {string}   clientId                 Client ID.
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
	const { title, uuid, introductionPage, introductionNote } = attributes;

	const groupsEnabled = context['prc-quiz/groupsEnabled'] || false;
	const quizType = context['prc-quiz/type'] || 'quiz';

	const blockProps = useBlockProps({
		className: classNames(className, {
			introduction: introductionPage,
		}),
	});

	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'wp-block-prc-quiz-page__innerblocks',
		},
		{
			allowedBlocks: introductionPage
				? ALLOWED_BLOCKS_INTRO_PAGE
				: ALLOWED_BLOCKS,
			orientation: 'vertical',
			templateLock: false,
			template: TEMPLATE,
		}
	);

	const { pageIndex } = useSelect((select) => {
		const rootClientId =
			select(blockEditorStore).getBlockRootClientId(clientId);
		return {
			pageIndex:
				select(blockEditorStore).getBlockIndex(clientId, rootClientId) +
				1,
		};
	});

	useEffect(() => {
		onBlockCreation(clientId, uuid, setAttributes);
		// Set default title to be "Question X of Y" where X is the current question number and Y is the total number of questions.
		if (!title) {
			setAttributes({
				title: sprintf('Question %1$d of X', pageIndex - 1),
			});
		}
	}, []);

	return (
		<div {...blockProps}>
			<NewPageKeyboardHandler clientId={clientId}>
				<RichText
					tagName="h3"
					value={title}
					className="page-title"
					onChange={(value) => setAttributes({ title: value })}
					placeholder={__('Question 1 of …', 'prc-quiz')}
					multiline={false}
				/>
				<div {...innerBlocksProps} />
			</NewPageKeyboardHandler>
			<Actions
				{...{
					isFirstPage: introductionPage,
					quizType,
					groupsEnabled,
				}}
			/>
			{introductionPage && (
				<RichText
					className="introduction--note"
					value={introductionNote}
					onChange={(value) =>
						setAttributes({ introductionNote: value })
					}
					placeholder="Add a note to your quiz"
				/>
			)}
		</div>
	);
}
