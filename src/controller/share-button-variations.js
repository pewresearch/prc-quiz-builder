/**
 * WordPress Dependencies
 */
import {
	registerBlockBindingsSource,
	registerBlockVariation,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

const SHARE_BUTTON_STYLE = {
	backgroundColor: 'ui-white',
	textColor: 'ui-black',
	borderColor: 'ui-gray-light',
	fontFamily: 'sans-serif',
	hasIcon: true,
	iconLibrary: 'sharp-solid',
	iconName: 'share-nodes',
	style: {
		elements: {
			link: {
				color: {
					text: 'var:preset|color|ui-black',
				},
			},
		},
		border: {
			radius: {
				topLeft: '25px',
				topRight: '25px',
				bottomLeft: '25px',
				bottomRight: '25px',
			},
			width: '1px',
		},
		spacing: {
			padding: {
				left: 'var:preset|spacing|40',
				right: 'var:preset|spacing|40',
				top: 'var:preset|spacing|20',
				bottom: 'var:preset|spacing|20',
			},
		},
	},
};

export default function registerShareButtonVariations() {
	registerBlockBindingsSource({
		name: 'prc-quiz/share-quiz-url',
		label: __('Quiz Share URL', 'prc-quiz'),
		usesContext: ['prc-quiz/id'],
		getValues() {
			return {
				placeholder: __('Quiz URL (resolved on render)', 'prc-quiz'),
			};
		},
		canUserEditValue() {
			return false;
		},
	});

	registerBlockVariation('core/button', {
		name: 'prc-quiz-share-quiz-button',
		title: __('(Quiz) Share Quiz Button', 'prc-quiz'),
		description: __(
			'Opens the device share sheet with the quiz title, description, and URL.',
			'prc-quiz'
		),
		attributes: {
			...SHARE_BUTTON_STYLE,
			text: __('Share Quiz', 'prc-quiz'),
			className: 'prc-quiz-share-quiz-button',
			metadata: {
				bindings: {
					url: {
						source: 'prc-quiz/share-quiz-url',
					},
				},
			},
		},
		ancestor: ['prc-quiz/controller'],
		isActive: (blockAttributes) =>
			!!blockAttributes?.className?.includes(
				'prc-quiz-share-quiz-button'
			),
	});

	registerBlockVariation('core/button', {
		name: 'prc-quiz-share-results-button',
		title: __('(Quiz) Share Results Button', 'prc-quiz'),
		description: __(
			'Opens the device share sheet with the results share title, text, and the resolved results URL.',
			'prc-quiz'
		),
		attributes: {
			...SHARE_BUTTON_STYLE,
			text: __('Share Results', 'prc-quiz'),
			className: 'prc-quiz-share-results-button',
			tagName: 'button',
		},
		ancestor: ['prc-quiz/results'],
		isActive: (blockAttributes) =>
			!!blockAttributes?.className?.includes(
				'prc-quiz-share-results-button'
			),
	});
}
