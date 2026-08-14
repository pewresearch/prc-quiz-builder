/**
 * WordPress Dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';

function getQuizData() {
	return window?.prcWpAdminDataview?.quiz || {};
}

function getElements(key) {
	return (getQuizData()[key] || []).map((option) => ({
		value: option.value,
		label: option.label,
	}));
}

function getLabel(key, value) {
	const match = (getQuizData()[key] || []).find(
		(option) => option.value === value
	);
	return match?.label || value || '—';
}

export function getDefaultVisibleFields() {
	return [
		'quizType',
		'submissions',
		'stats',
		'researchTeams',
		'status',
		'date',
	];
}

export default function getQuizFields({ onOpenStats }) {
	return [
		{
			id: 'quizType',
			label: __('Quiz Type', 'prc-quiz-builder'),
			getValue: ({ item }) => item?.quiz_type || '',
			render: ({ item }) => (
				<span>{getLabel('quizTypes', item?.quiz_type)}</span>
			),
			elements: getElements('quizTypes'),
			filterBy: {
				operators: ['isAny'],
				isPrimary: true,
			},
			enableSorting: false,
		},
		{
			id: 'submissions',
			label: __('Submissions', 'prc-quiz-builder'),
			getValue: ({ item }) => item?.submissions ?? 0,
			render: ({ item }) => (
				<span>{(item?.submissions ?? 0).toLocaleString()}</span>
			),
			enableSorting: true,
		},
		{
			id: 'stats',
			label: __('Stats', 'prc-quiz-builder'),
			getValue: ({ item }) =>
				item?.submissions || item?.groups_enabled
					? __('Available', 'prc-quiz-builder')
					: __('Unavailable', 'prc-quiz-builder'),
			render: ({ item }) => {
				const hasStats = !!item?.submissions || !!item?.groups_enabled;
				return (
					<Button
						icon={chartBar}
						label={__('View analytics', 'prc-quiz-builder')}
						size="compact"
						disabled={!hasStats}
						onClick={(event) => {
							event.stopPropagation();
							if (hasStats) {
								onOpenStats(item);
							}
						}}
					/>
				);
			},
			enableSorting: false,
			enableHiding: true,
		},
		{
			id: 'groupsEnabled',
			label: __('Groups', 'prc-quiz-builder'),
			getValue: ({ item }) => (item?.groups_enabled ? '1' : '0'),
			render: ({ item }) =>
				item?.groups_enabled
					? __('Enabled', 'prc-quiz-builder')
					: __('Disabled', 'prc-quiz-builder'),
			elements: [
				{ value: '1', label: __('Enabled', 'prc-quiz-builder') },
				{ value: '0', label: __('Disabled', 'prc-quiz-builder') },
			],
			filterBy: {
				operators: ['is'],
			},
			enableSorting: false,
		},
		{
			id: 'displayType',
			label: __('Display Type', 'prc-quiz-builder'),
			getValue: ({ item }) => item?.display_type || '',
			render: ({ item }) => (
				<span>{getLabel('displayTypes', item?.display_type)}</span>
			),
			elements: getElements('displayTypes'),
			filterBy: {
				operators: ['isAny'],
			},
			enableSorting: false,
		},
		{
			id: 'questionCount',
			label: __('Questions', 'prc-quiz-builder'),
			getValue: ({ item }) => item?.question_count ?? 0,
			render: ({ item }) => <span>{item?.question_count ?? 0}</span>,
			enableSorting: true,
		},
		{
			id: 'first24Hours',
			label: __('First 24 Hours', 'prc-quiz-builder'),
			getValue: ({ item }) => item?.first_24_hours ?? 0,
			render: ({ item }) => (
				<span>{(item?.first_24_hours ?? 0).toLocaleString()}</span>
			),
			enableSorting: false,
		},
		{
			id: 'firstWeek',
			label: __('First Week', 'prc-quiz-builder'),
			getValue: ({ item }) => item?.first_week ?? 0,
			render: ({ item }) => (
				<span>{(item?.first_week ?? 0).toLocaleString()}</span>
			),
			enableSorting: false,
		},
		{
			id: 'modified',
			type: 'datetime',
			label: __('Last Modified', 'prc-quiz-builder'),
			getValue: ({ item }) => item?.modified || '',
			enableSorting: true,
		},
	];
}
