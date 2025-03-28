/**
 * External Dependencies
 */
import classNames from 'classnames';
import { useHasSelectedInnerBlock } from '@prc/hooks';
import { MediaDropZone } from '@prc/components';
import { Button } from 'semantic-ui-react';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment, useEffect } from '@wordpress/element';
import {
	useBlockProps,
	RichText,
	useInnerBlocksProps,
	InnerBlocks,
} from '@wordpress/block-editor';

/**
 * Internal Dependencies
 */
// eslint-disable-next-line import/no-relative-packages
import { onBlockCreation, ConditionalDot } from '@prc/quiz-components';
import Controls from './controls';

const ALLOWED_BLOCKS = ['prc-quiz/answer'];

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
export default function Edit({ attributes, setAttributes, context, clientId }) {
	const {
		question,
		type,
		imageId,
		imageOnTop,
		uuid,
		allowedBlocks,
		conditionalDisplay,
	} = attributes;

	const quizType = context['prc-quiz/type'];

	const blockProps = useBlockProps({
		className: classNames({
			'is-style-image-on-top': imageOnTop,
		}),
	});

	const hasSelectedInnerBlock = useHasSelectedInnerBlock(clientId);
	console.log('hasSelectedInnerBlock', hasSelectedInnerBlock);

	// eslint-disable-next-line max-len
	// If the quiz type is not typology then we want to set the default answer block attributes to be correct: false, this will ensure the answer block is in the true|false correct state instead of "undefined" as expected with a typology quiz.
	const DEFAULT_ANSWER_BLOCK_ATTRS =
		'typology' !== quizType ? { correct: false } : {};
	const TEMPLATE = [['prc-quiz/answer', DEFAULT_ANSWER_BLOCK_ATTRS]];
	// eslint-disable-next-line max-len
	// By defining a allowedBlocks attribute any block can now customize what inner blocks are allowed.
	// This gives us a good way to ensure greater template and pattern control.
	// eslint-disable-next-line max-len
	// By default if nothing is defined in the "allowedBlocks" attribute this will default to the constant ALLOWED_BLOCKS found under "Internal Dependencies" ^.
	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'wp-block-prc-question--answers',
		},
		{
			allowedBlocks: allowedBlocks || ALLOWED_BLOCKS,
			templateLock: false,
			template: TEMPLATE,
			renderAppender: hasSelectedInnerBlock
				? InnerBlocks.ButtonBlockAppender
				: undefined,
			__experimentalDefaultBlock: {
				name: 'prc-quiz/answer',
				attributes: DEFAULT_ANSWER_BLOCK_ATTRS,
			},
			__experimentalDirectInsert: 'typology' !== quizType,
		}
	);

	useEffect(() => {
		onBlockCreation(clientId, uuid, setAttributes);
	}, []);

	return (
		<Fragment>
			<Controls
				{...{
					attributes,
					setAttributes,
					clientId,
					context,
				}}
			/>
			<div {...blockProps}>
				<ConditionalDot {...{ attributes }} />
				<RichText
					tagName="h3"
					className="wp-block-prc-quiz-question--label"
					value={question}
					allowedFormats={['core/bold', 'core/italic']}
					onChange={(q) => setAttributes({ question: q })}
					placeholder={__('Question…')}
				/>
				<div className="wp-block-prc-quiz-question--image">
					<MediaDropZone
						label="Choose an image"
						attachmentId={0 === imageId ? false : imageId}
						disabled={!hasSelectedInnerBlock}
						mediaType={['image']}
						mediaSize="640-wide"
						onUpdate={(image) => {
							setAttributes({
								imageId: image.id,
							});
						}}
						onClear={() => {
							console.log('Clearing...');
							setAttributes({
								imageId: false,
							});
						}}
					/>
				</div>
				{'thermometer' !== type && <div {...innerBlocksProps} />}
				{'thermometer' === type && (
					<div className="wp-block-prc-quiz-question--thermometer">
						<Button.Group fluid basic>
							{[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
								(e, index) => (
									<Button variant="secondary" key={e}>
										{`${0 === index ? index : index * 10}`}
									</Button>
								)
							)}
						</Button.Group>
					</div>
				)}
			</div>
		</Fragment>
	);
}
