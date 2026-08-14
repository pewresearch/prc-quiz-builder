import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Button,
	ExternalLink,
	Flex,
	Modal,
	Notice,
	Spinner,
	Tooltip,
} from '@wordpress/components';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';

import { formatAnalyticsDate, formatCompactNumber } from './utils';

const DEFAULT_VIEW = {
	type: 'table',
	search: '',
	filters: [],
	page: 1,
	perPage: 50,
	sort: {
		field: 'total',
		direction: 'desc',
	},
	titleField: 'name',
	fields: ['name', 'total', 'created', 'last_updated', 'results_url'],
	layout: {
		primaryField: 'name',
		styles: {
			name: { width: '30%' },
			total: { width: 110, align: 'right' },
			created: { width: 120 },
			last_updated: { width: 120 },
			results_url: { width: 100 },
		},
	},
};

const DEFAULT_LAYOUTS = {
	table: {
		layout: {
			primaryField: 'name',
			styles: DEFAULT_VIEW.layout.styles,
		},
	},
};

function SubmissionsCell({ item }) {
	const numericValue = item.total || 0;
	return (
		<Tooltip text={numericValue.toLocaleString()}>
			<span className="quiz-group-analytics__submissions" tabIndex={0}>
				{formatCompactNumber(numericValue)}
			</span>
		</Tooltip>
	);
}

function ResultsLinkCell({ item }) {
	if (!item.results_url) {
		return <span>—</span>;
	}

	return (
		<ExternalLink href={item.results_url}>
			{__('View', 'prc-quiz-builder')}
		</ExternalLink>
	);
}

/**
 * Fullscreen DataViews modal listing all community groups for a quiz.
 *
 * @param {Object}   props
 * @param {Function} props.onClose
 * @param {Object}   props.groupAnalytics Aggregated group analytics payload.
 * @param {boolean}  props.isLoading
 * @param {string}   props.error
 */
export default function GroupAnalyticsModal({
	onClose,
	groupAnalytics,
	isLoading,
	error,
}) {
	const [view, setView] = useState(DEFAULT_VIEW);

	const handleChangeView = useCallback((newView) => {
		setView(newView);
	}, []);

	const groups = useMemo(
		() => groupAnalytics?.groups ?? [],
		[groupAnalytics]
	);

	const fields = useMemo(
		() => [
			{
				id: 'name',
				type: 'text',
				label: __('Group name', 'prc-quiz-builder'),
				enableSorting: true,
				enableGlobalSearch: true,
				enableHiding: false,
				getValue: ({ item }) => item.name || '',
			},
			{
				id: 'total',
				type: 'integer',
				label: __('Submissions', 'prc-quiz-builder'),
				enableSorting: true,
				enableGlobalSearch: false,
				getValue: ({ item }) => item.total ?? 0,
				render: ({ item }) => <SubmissionsCell item={item} />,
			},
			{
				id: 'created',
				label: __('Created', 'prc-quiz-builder'),
				enableSorting: true,
				enableGlobalSearch: false,
				getValue: ({ item }) => item.created || '',
				render: ({ item }) => (
					<span>{formatAnalyticsDate(item.created)}</span>
				),
			},
			{
				id: 'last_updated',
				label: __('Last updated', 'prc-quiz-builder'),
				enableSorting: true,
				enableGlobalSearch: false,
				getValue: ({ item }) => item.last_updated || '',
				render: ({ item }) => (
					<span>{formatAnalyticsDate(item.last_updated)}</span>
				),
			},
			{
				id: 'results_url',
				label: __('Results', 'prc-quiz-builder'),
				enableSorting: false,
				enableGlobalSearch: false,
				getValue: ({ item }) => item.results_url || '',
				render: ({ item }) => <ResultsLinkCell item={item} />,
			},
		],
		[]
	);

	const { data: processedData, paginationInfo } = useMemo(
		() => filterSortAndPaginate(groups, view, fields),
		[groups, view, fields]
	);

	const handleClickItem = useCallback((item) => {
		if (item.results_url) {
			window.open(item.results_url, '_blank', 'noopener,noreferrer');
		}
	}, []);

	return (
		<Modal
			title={__('Community Group Analytics', 'prc-quiz-builder')}
			onRequestClose={onClose}
			isFullScreen
			className="quiz-group-analytics-modal"
		>
			{error && (
				<Notice status="error" isDismissible={false}>
					{error}
				</Notice>
			)}
			{isLoading ? (
				<Flex justify="center" style={{ padding: '32px' }}>
					<Spinner />
				</Flex>
			) : (
				<DataViews
					data={processedData}
					fields={fields}
					view={view}
					onChangeView={handleChangeView}
					defaultLayouts={DEFAULT_LAYOUTS}
					paginationInfo={paginationInfo}
					isLoading={isLoading}
					search
					searchLabel={__('Search groups…', 'prc-quiz-builder')}
					getItemId={(item) => item.id}
					isItemClickable={(item) => !!item.results_url}
					onClickItem={handleClickItem}
				/>
			)}
			<div className="quiz-group-analytics-modal__footer">
				<Button variant="secondary" onClick={onClose}>
					{__('Close', 'prc-quiz-builder')}
				</Button>
			</div>
		</Modal>
	);
}
