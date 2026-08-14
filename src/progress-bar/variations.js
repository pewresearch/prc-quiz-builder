/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';

export const CIRCLES_CLASS = 'is-style-circles';

export default [
	{
		name: 'bar',
		isDefault: true,
		title: __('Progress Bar', 'progress-bar'),
		description: __(
			'Linear bar showing quiz completion progress.',
			'progress-bar'
		),
		attributes: { className: '' },
		scope: ['inserter', 'block'],
		isActive: (blockAttributes) =>
			!blockAttributes.className?.includes(CIRCLES_CLASS),
	},
	{
		name: 'circles',
		title: __('Progress Circles', 'progress-bar'),
		description: __(
			'One circle per question: check, x, or question mark by outcome.',
			'progress-bar'
		),
		attributes: { className: CIRCLES_CLASS },
		scope: ['inserter', 'block'],
		isActive: (blockAttributes) =>
			!!blockAttributes.className?.includes(CIRCLES_CLASS),
	},
];
