import {
	registerBlockBindingsSource,
	registerBlockVariation,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';

export default function registerButtonVariations() {
	registerBlockVariation('core/buttons', {
		name: 'prc-quiz-next-page-button',
		title: __('(Quiz)Next Page Button', 'prc-quiz'),
		description: __(
			'Displays the next page button with accompanying go back to previous page button.',
			'prc-quiz'
		),
		attributes: {
			className: 'prc-quiz-next-page-button-wrapper',
			fontFamily: 'sans-serif',
			style: {
				spacing: {
					blockGap: {
						top: '0',
					},
				},
			},
			layout: {
				type: 'flex',
				orientation: 'vertical',
				justifyContent: 'stretch',
			},
		},
		innerBlocks: [
			[
				'core/button',
				{
					text: __('Next', 'prc-quiz'),
					backgroundColor: 'ui-brown-dark',
					width: 100,
					className: 'prc-quiz-next-page-button',
					style: {
						typography: {
							textTransform: 'uppercase',
							letterSpacing: '1px',
						},
					},
					fontSize: 'large',
				},
				[],
			],
			[
				'core/button',
				{
					text: __('Go back to previous question', 'prc-quiz'),
					className: 'prc-quiz-previous-page-button',
					tagName: 'button',
					textAlign: 'left',
					backgroundColor: 'ui-white',
					textColor: 'ui-black',
					style: {
						elements: {
							link: {
								color: {
									text: 'var:preset|color|ui-black',
								},
							},
						},
					},
				},
				[],
			],
			[
				'core/button',
				{
					text: __('Reset', 'prc-quiz'),
					className: 'prc-quiz-reset-button',
					tagName: 'button',
					textAlign: 'left',
					backgroundColor: 'ui-white',
					textColor: 'ui-black',
					style: {
						elements: {
							link: {
								color: {
									text: 'var:preset|color|ui-black',
								},
							},
						},
					},
				},
				[],
			],
		],
		isActive: (blockAttributes, variationAttributes) => {
			return blockAttributes?.className?.includes(
				variationAttributes.className
			);
		},
	});

	registerBlockVariation('core/buttons', {
		name: 'prc-quiz-reset-button',
		title: __('(Quiz) Reset Button', 'prc-quiz'),
		description: __(
			'Displays the reset button. This will reset the quiz to the start.',
			'prc-quiz'
		),
		attributes: {
			className: 'prc-quiz-reset-button-wrapper',
			fontFamily: 'sans-serif',
			layout: {
				type: 'flex',
				justifyContent: 'center',
			},
		},
		innerBlocks: [
			[
				'core/button',
				{
					backgroundColor: 'ui-white',
					textColor: 'ui-black',
					className: 'is-style-icon__arrows-rotate',
					style: {
						elements: {
							link: {
								color: {
									text: 'var:preset|color|ui-black',
								},
							},
						},
						border: {
							radius: '5px',
							width: '1px',
						},
						typography: {
							fontStyle: 'normal',
							fontWeight: '600',
						},
					},
					fontFamily: 'sans-serif',
					borderColor: 'ui-black',
				},
				[],
			],
		],
		ancestor: [
			'prc-quiz/page',
			'prc-quiz/results',
			'prc-quiz/group-results',
		],
		isActive: (blockAttributes, variationAttributes) => {
			return blockAttributes?.className?.includes(
				variationAttributes.className
			);
		},
	});

	registerBlockVariation('core/buttons', {
		name: 'prc-quiz-start-button',
		title: __('(Quiz) Start Button', 'prc-quiz'),
		description: __('Displays the start quiz button.', 'prc-quiz'),
		attributes: {
			className: 'prc-quiz-start-button-wrapper',
			fontFamily: 'sans-serif',
			layout: {
				type: 'flex',
				orientation: 'vertical',
				justifyContent: 'stretch',
			},
		},
		innerBlocks: [
			[
				'core/button',
				{
					textColor: 'ui-black',
					borderColor: 'ui-gray-very-dark',
					text: __('Start', 'prc-quiz'),
					width: 100,
					className: 'prc-quiz-start-button',
					style: {
						color: {
							background: '#fff1be',
						},
						typography: {
							textTransform: 'uppercase',
							letterSpacing: '1px',
						},
						border: {
							width: '1px',
						},
					},
					fontSize: 'large',
				},
			],
		],
		ancestor: ['prc-quiz/page'],
		isActive: (blockAttributes, variationAttributes) => {
			return blockAttributes?.className?.includes(
				variationAttributes.className
			);
		},
	});

	registerBlockVariation('core/buttons', {
		name: 'prc-quiz-submit-button',
		title: __('(Quiz) Submit Button', 'prc-quiz'),
		description: __('Displays the submit button.', 'prc-quiz'),
		attributes: {
			className: 'prc-quiz-submit-button-wrapper',
			fontFamily: 'sans-serif',
			style: {
				spacing: {
					blockGap: {
						top: '0',
					},
				},
			},
			layout: {
				type: 'flex',
				orientation: 'vertical',
				justifyContent: 'stretch',
			},
		},
		innerBlocks: [
			[
				'core/button',
				{
					text: __('Submit', 'prc-quiz'),
					backgroundColor: 'ui-brown-dark',
					width: 100,
					className: 'prc-quiz-submit-button',
					style: {
						typography: {
							textTransform: 'uppercase',
							letterSpacing: '1px',
						},
					},
					fontSize: 'large',
				},
			],
			[
				'core/button',
				{
					text: __('Go back to previous question', 'prc-quiz'),
					className: 'prc-quiz-previous-page-button',
					tagName: 'button',
					textAlign: 'left',
					backgroundColor: 'ui-white',
					textColor: 'ui-black',
					style: {
						elements: {
							link: {
								color: {
									text: 'var:preset|color|ui-black',
								},
							},
						},
					},
				},
				[],
			],
		],
		ancestor: ['prc-quiz/page'],
		isActive: (blockAttributes, variationAttributes) => {
			return blockAttributes?.className?.includes(
				variationAttributes.className
			);
		},
	});
}
