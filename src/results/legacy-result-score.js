/**
 * WordPress Dependencies
 */
import { useBlockProps, RichText } from '@wordpress/block-editor';
import {
	getBlockType,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * PHP still registers `prc-quiz/result-score` for frontend render. This
 * branch removed the original editor files, so saved instances had no
 * `edit` component and crashed the canvas (React #130). Keep a hidden
 * client type so existing quizzes still preview.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes
 * @param {Function} props.setAttributes
 */
function Edit({ attributes, setAttributes }) {
	const { numberOfQuestions } = attributes;
	const blockProps = useBlockProps();

	return (
		<h1 {...blockProps}>
			{__('You answered', 'prc-quiz')}{' '}
			<strong>{__('[Your Score]', 'prc-quiz')}</strong>{' '}
			{__('out of', 'prc-quiz')}{' '}
			<RichText
				tagName="span"
				placeholder="##"
				value={numberOfQuestions}
				allowedFormats={[]}
				onChange={(value) =>
					setAttributes({
						numberOfQuestions: value,
					})
				}
			/>{' '}
			{__('questions correctly.', 'prc-quiz')}
		</h1>
	);
}

export default function registerLegacyResultScoreBlock() {
	const existing = getBlockType('prc-quiz/result-score');
	if (existing) {
		if (existing.edit) {
			return;
		}
		unregisterBlockType('prc-quiz/result-score');
	}

	registerBlockType('prc-quiz/result-score', {
		apiVersion: 3,
		title: __('Results Score', 'prc-quiz'),
		description: __(
			'Legacy score heading. Hidden from the inserter. Replace with a heading plus the Your Score block bit.',
			'prc-quiz'
		),
		category: 'prc-quiz',
		parent: ['prc-quiz/results'],
		attributes: {
			numberOfQuestions: {
				type: 'string',
			},
			questionsToCheck: {
				type: 'array',
			},
		},
		supports: {
			anchor: true,
			html: false,
			interactivity: true,
			multiple: false,
			inserter: false,
			color: {
				background: true,
				text: true,
			},
			spacing: {
				margin: ['top', 'bottom'],
				padding: true,
			},
			typography: {
				fontSize: true,
				__experimentalFontFamily: true,
			},
		},
		edit: Edit,
		save: () => null,
	});
}
