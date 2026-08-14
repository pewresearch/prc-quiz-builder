/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';

export default function getQuizActions(actions) {
	return actions.map((action) => {
		if ('edit' === action.id) {
			return {
				...action,
				label: __('Edit Quiz', 'prc-quiz-builder'),
			};
		}

		if ('view' === action.id) {
			return {
				...action,
				label: __('View Quiz', 'prc-quiz-builder'),
				isEligible: (item) =>
					!!item?.view_url && 'publish' === item?.status,
				callback: ([item]) => {
					window.open(item.view_url, '_blank', 'noopener,noreferrer');
				},
			};
		}

		return action;
	});
}
