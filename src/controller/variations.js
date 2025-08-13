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
			`A knowledge quiz includes a series of questions with single, multiple-choice, or thermometer-type answers. Users receive scores based on their responses, which are either correct or incorrect. Correct answers contribute points to the total score at the end of the quiz, incorrect answers do not.`
		),
		attributes: { type: 'quiz' },
		scope: ['inserter', 'transform'],
		isActive: (blockAttributes) => 'quiz' === blockAttributes.type,
	},
	{
		name: 'freeform',
		title: __('Freeform Quiz'),
		description: __(
			`A freeform quiz presents users with a series of questions, including single-choice, multiple-choice, and thermometer-type answers. Users responses are scored based on point values rather than correct or incorrect answers. The score can generate various result configurations or custom result pages with tailored score calculations, such as in a political freeform quiz.`
		),
		icon: <Icon variant="freeform" />,
		attributes: {
			type: 'freeform',
		},
		scope: ['inserter', 'transform'],
		isActive: (blockAttributes) => 'freeform' === blockAttributes.type,
	},
];
