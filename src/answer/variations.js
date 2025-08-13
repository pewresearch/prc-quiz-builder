/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import Icon from './icon';

export default [
	{
		name: 'answer',
		title: __('Answer'),
		description: __(
			'An answer with neither a correct nor an incorrect choice.'
		),
		isDefault: true,
		icon: <Icon />,
		scope: ['inserter'],
		innerBlocks: [
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
		isActive: (blockAttributes) =>
			undefined === blockAttributes.correct &&
			!blockAttributes.conditionalDisplay,
	},
	{
		name: 'answer-correct',
		title: __('Correct Answer'),
		description: __('A correct answer.'),
		icon: <Icon variant="correct" />,
		attributes: { correct: false },
		scope: [],
		isActive: (blockAttributes) =>
			true === blockAttributes.correct &&
			!blockAttributes.conditionalDisplay,
	},
	{
		name: 'answer-incorrect',
		title: __('Incorrect Answer'),
		description: __('An incorrect answer'),
		icon: <Icon variant="incorrect" />,
		attributes: { correct: true },
		scope: [],
		isActive: (blockAttributes) =>
			false === blockAttributes.correct &&
			!blockAttributes.conditionalDisplay,
	},
	{
		name: 'conditional-answer',
		title: __('Answer'),
		description: __(
			'An answer, neither incorrect nor correct. It is only shown if a previous question is answered with a specific answer.'
		),
		icon: <Icon variant="conditional" />,
		attributes: { conditionalDisplay: true },
		scope: [],
		isActive: (blockAttributes) =>
			undefined === blockAttributes.correct &&
			blockAttributes.conditionalDisplay,
	},
	{
		name: 'conditional-answer-correct',
		title: __('Correct Answer'),
		description: __(
			'An answer that is correct. It is only shown if a previous question is answered with a specific answer.'
		),
		icon: <Icon variant="conditionalCorrect" />,
		attributes: { correct: true, conditionalDisplay: true },
		scope: [],
		isActive: (blockAttributes) =>
			true === blockAttributes.correct &&
			blockAttributes.conditionalDisplay,
	},
	{
		name: 'conditional-answer-incorrect',
		title: __('Incorrect Answer'),
		description: __(
			'An answer that is incorrect. It is only shown if a previous question is answered with a specific answer.'
		),
		icon: <Icon variant="conditionalIncorrect" />,
		attributes: { correct: false, conditionalDisplay: true },
		scope: [],
		isActive: (blockAttributes) =>
			false === blockAttributes.correct &&
			blockAttributes.conditionalDisplay,
	},
];
