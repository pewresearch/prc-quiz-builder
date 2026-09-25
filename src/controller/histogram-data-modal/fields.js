/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';

export const HISTOGRAM_ROW_FIELDS = [
	{
		id: 'correct',
		label: __('# of correct answers', 'prc-quiz'),
		type: 'integer',
	},
	{
		id: 'percent',
		label: __('% of public', 'prc-quiz'),
		type: 'integer',
	},
];

export const HISTOGRAM_ROW_FORM = {
	layout: {
		type: 'row',
		alignment: 'start',
		styles: {
			correct: { flex: '1 1 auto' },
			percent: { flex: '1 1 auto' },
		},
	},
	fields: [
		{
			id: 'correct',
			layout: { type: 'regular', labelPosition: 'none' },
		},
		{
			id: 'percent',
			layout: { type: 'regular', labelPosition: 'none' },
		},
	],
};

/**
 * DataForm field defs for one histogram population bin.
 *
 * @return {Array} Field descriptors.
 */
export function buildFields() {
	return HISTOGRAM_ROW_FIELDS;
}
