/**
 * External Dependencies
 */

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

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
					introductionPage: true,
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
	const { allowedBlocks } = attributes;

	const blockProps = useBlockProps();

	const innerBlocksProps = useInnerBlocksProps(blockProps, {
		allowedBlocks,
		orientation: 'vertical',
		template: TEMPLATE,
	});

	return (
		<Fragment>
			<Controls attributes={attributes} setAttributes={setAttributes} />
			<div {...innerBlocksProps} />
		</Fragment>
	);
}
