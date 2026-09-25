import { registerBlockVariation } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

import registerQuizBuilderBindings from './quiz-builder-bindings';
import {
	isQuizBuilderBindingActive,
	quizBuilderBinding,
} from './binding-fields';

const FIELD = 'adults-receiving-this-score';
const FALLBACK = __('X% of U.S. adults receive this score', 'prc-quiz');

const VARIATION_ATTRIBUTES = {
	metadata: {
		bindings: {
			content: quizBuilderBinding(FIELD),
		},
	},
	content: FALLBACK,
};

function isAdultsReceivingScoreVariation(blockAttributes) {
	return isQuizBuilderBindingActive(
		blockAttributes.metadata?.bindings?.content,
		'prc-quiz/adults-receiving-this-score',
		FIELD
	);
}

export default function registerAdultsReceivingScoreBinding() {
	registerQuizBuilderBindings();

	registerBlockVariation('core/paragraph', {
		name: 'prc-quiz-adults-receiving-this-score',
		title: __('Adults Receiving This Score', 'prc-quiz'),
		description: __(
			'Shows the share of U.S. adults who received the participant’s score.',
			'prc-quiz'
		),
		attributes: VARIATION_ATTRIBUTES,
		ancestor: ['prc-quiz/results'],
		isActive: (blockAttributes) =>
			isAdultsReceivingScoreVariation(blockAttributes),
	});

	registerBlockVariation('core/heading', {
		name: 'prc-quiz-adults-receiving-this-score-heading',
		title: __('Adults Receiving This Score', 'prc-quiz'),
		description: __(
			'Shows the share of U.S. adults who received the participant’s score.',
			'prc-quiz'
		),
		attributes: {
			...VARIATION_ATTRIBUTES,
			level: 3,
		},
		ancestor: ['prc-quiz/results'],
		isActive: (blockAttributes) =>
			isAdultsReceivingScoreVariation(blockAttributes),
	});
}
