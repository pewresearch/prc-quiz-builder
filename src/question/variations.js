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
		name: 'single-choice',
		isDefault: true,
		title: __('Single Choice Question'),
		description: __('A question with a single correct answer'),
		attributes: { type: 'single' },
		scope: ['inserter', 'transform'],
		isActive: (blockAttributes) =>
			'single' === blockAttributes.type &&
			!blockAttributes.conditionalDisplay,
	},
	{
		name: 'multiple-choice',
		title: __('Multiple Choice Question'),
		description: __('A question with multiple correct answers'),
		attributes: { type: 'multiple' },
		scope: ['inserter', 'transform'],
		isActive: (blockAttributes) =>
			'multiple' === blockAttributes.type &&
			!blockAttributes.conditionalDisplay,
	},
	{
		name: 'thermometer',
		title: __('Thermometer Question'),
		description: __(
			'A question with with a scale of answers, a "thermometer".'
		),
		icon: <Icon variant="thermometer" />,
		attributes: { type: 'thermometer' },
		scope: ['inserter', 'transform'],
		isActive: (blockAttributes) => 'thermometer' === blockAttributes.type,
	},
	{
		name: 'conditional-single-choice',
		title: __('Single Choice Question (Conditional)'),
		description: __(
			'A single choice question that is only shown if a previous question is answered with a specific answer.'
		),
		icon: <Icon variant="conditional" />,
		attributes: { type: 'single', conditionalDisplay: true },
		scope: ['inserter', 'transform'],
		isActive: (blockAttributes) =>
			'single' === blockAttributes.type &&
			blockAttributes.conditionalDisplay,
	},
	{
		name: 'conditional-multiple-choice',
		title: __('Multiple Choice Question (Conditional)'),
		description: __(
			'A multiple choice question that is only shown if a previous question is answered with a specific answer.'
		),
		icon: <Icon variant="conditional" />,
		attributes: { type: 'multiple', conditionalDisplay: true },
		scope: ['inserter', 'transform'],
		isActive: (blockAttributes) =>
			'multiple' === blockAttributes.type &&
			blockAttributes.conditionalDisplay,
	},
];
