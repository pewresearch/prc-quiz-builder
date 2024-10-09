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
		name: 'quiz',
		isDefault: true,
		title: __('Knowledge Quiz'),
		description: __(
			`A "knowledge" quiz, where the user is asked a series of questions with single and multiple choice answers. The user's answers are scored and a result is displayed at the end of the quiz.`,
		),
		attributes: { type: 'quiz' },
		scope: ['inserter', 'transform'],
		isActive: (blockAttributes) => 'quiz' === blockAttributes.type,
	},
	{
		name: 'typology',
		title: __('Typology Quiz'),
		description: __(
			`A "personality" or "survey" quiz, where the user is asked a series of questions with single, multiple choice, and "thermometer" type answers. The user's answers are calculated against a matrix, usually logarithmic probability or eucledian distance and the user is placed in a typology group and a result is displayed at the end of the quiz.`,
		),
		icon: <Icon variant="typology" />,
		attributes: {
			type: 'typology',
			allowedBlocks: [
				'prc-quiz/pages',
				'prc-quiz/results',
				'prc-quiz/group-results',
			],
		},
		scope: ['inserter', 'transform'],
		isActive: (blockAttributes) => 'typology' === blockAttributes.type,
	},
];
