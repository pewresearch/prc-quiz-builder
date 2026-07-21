import { useMemo, useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { useSelect } from '@wordpress/data';
import {
	PanelBody,
	BaseControl,
	SelectControl,
	Tooltip,
	Button,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

import {
	ANALYTICS_POLL_INTERVAL_MS,
	findGroupsEnabled,
	formatCompactNumber,
} from './analytics-utils';
import GroupAnalyticsModal from './group-analytics-modal';

import './analytics-panel.scss';

async function fetchQuizAnalytics(postId) {
	const response = await apiFetch({
		path: `/wp/v2/quiz/${postId}?_fields=_submissions`,
		method: 'GET',
	});

	return {
		success: true,
		...response._submissions,
	};
}

async function fetchGroupAnalytics(postId) {
	const response = await apiFetch({
		path: `/wp/v2/quiz/${postId}?_fields=_group_analytics`,
		method: 'GET',
	});

	return response._group_analytics;
}

function usePollAnalytics(postId, fetcher) {
	const [data, setData] = useState(null);
	const [error, setError] = useState('');

	useEffect(() => {
		if (!postId) {
			return undefined;
		}

		let isMounted = true;

		const loadAnalytics = () => {
			fetcher(postId)
				.then((nextData) => {
					if (isMounted) {
						setData(nextData);
						setError('');
					}
				})
				.catch((fetchError) => {
					if (isMounted) {
						setError(
							fetchError?.message ||
								__(
									'Unable to load analytics data.',
									'prc-quiz-builder'
								)
						);
					}
					// eslint-disable-next-line no-console
					console.error({ fetchError });
				});
		};

		loadAnalytics();

		const pollIntervalId = window.setInterval(
			loadAnalytics,
			ANALYTICS_POLL_INTERVAL_MS
		);

		return () => {
			isMounted = false;
			window.clearInterval(pollIntervalId);
		};
	}, [postId, fetcher]);

	return { data, error };
}

function useQuizAnalytics(postId) {
	return usePollAnalytics(postId, fetchQuizAnalytics);
}

function useGroupAnalytics(postId) {
	return usePollAnalytics(postId, fetchGroupAnalytics);
}

function CalendarChart({
	values = [30, 60, 90, 60, 100, 50, 45, 20, 70, 80, 90, 40],
	labels,
}) {
	const months = labels || [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
	];

	const getHeatLevel = (value) => {
		const max = Math.max(...values);
		const percentage = max > 0 ? (value / max) * 100 : 0;
		if (value === 0) return 'none';
		if (percentage <= 25) return 'low';
		if (percentage <= 50) return 'medium';
		if (percentage <= 75) return 'high';
		return 'very-high';
	};

	return (
		<div className="calendar-chart">
			{values.map((value, index) => (
				<div
					key={months[index] || index}
					className="calendar-chart-item"
					data-month={months[index]}
					data-heat={getHeatLevel(value)}
				>
					<Tooltip text={value.toLocaleString()}>
						<span className="value" tabIndex={0}>
							{formatCompactNumber(value)}
						</span>
					</Tooltip>
				</div>
			))}
		</div>
	);
}

function SummaryStat({ label, value }) {
	const numericValue = value || 0;
	return (
		<div className="summary-stat">
			<span className="stat-label">{label}</span>
			<Tooltip text={numericValue.toLocaleString()}>
				<span className="stat-value" tabIndex={0}>
					{formatCompactNumber(numericValue)}
				</span>
			</Tooltip>
		</div>
	);
}

function SummaryStats({ first24Hours, firstWeek, total }) {
	return (
		<div className="analytics-summary">
			<SummaryStat label="First 24 Hours" value={first24Hours} />
			<SummaryStat label="First Week" value={firstWeek} />
			<SummaryStat label="Total" value={total} />
		</div>
	);
}

function GroupSummaryStats({ totalGroups, totalSubmissions }) {
	return (
		<div className="analytics-summary">
			<SummaryStat
				label={__('Total Groups', 'prc-quiz-builder')}
				value={totalGroups}
			/>
			<SummaryStat
				label={__('Group Submissions', 'prc-quiz-builder')}
				value={totalSubmissions}
			/>
		</div>
	);
}

function GroupAnalyticsPanelEnabled({ postId }) {
	const { data: groupAnalytics, error } = useGroupAnalytics(postId);
	const [isModalOpen, setIsModalOpen] = useState(false);

	if (!groupAnalytics && !error) {
		return (
			<PanelBody title={__('Group Analytics', 'prc-quiz-builder')}>
				<p>{__('Loading group analytics…', 'prc-quiz-builder')}</p>
			</PanelBody>
		);
	}

	const totalGroups = groupAnalytics?.total_groups ?? 0;
	const totalSubmissions = groupAnalytics?.total_submissions ?? 0;

	return (
		<PanelBody title={__('Group Analytics', 'prc-quiz-builder')}>
			{error && (
				<p className="quiz-group-analytics-panel__error">{error}</p>
			)}
			<GroupSummaryStats
				totalGroups={totalGroups}
				totalSubmissions={totalSubmissions}
			/>
			{totalGroups > 0 ? (
				<Button
					variant="secondary"
					onClick={() => setIsModalOpen(true)}
					className="quiz-group-analytics-panel__open-button"
				>
					{sprintf(
						/* translators: %d: number of community groups */
						__('View all groups (%d)', 'prc-quiz-builder'),
						totalGroups
					)}
				</Button>
			) : (
				<p className="quiz-group-analytics-panel__help">
					{__(
						'No community groups have been created for this quiz yet.',
						'prc-quiz-builder'
					)}
				</p>
			)}
			{isModalOpen && (
				<GroupAnalyticsModal
					onClose={() => setIsModalOpen(false)}
					groupAnalytics={groupAnalytics}
					isLoading={!groupAnalytics}
					error={error}
				/>
			)}
		</PanelBody>
	);
}

function GroupAnalyticsPanel({ postId }) {
	const groupsEnabled = useSelect((select) => {
		const blocks = select('core/block-editor').getBlocks();
		return findGroupsEnabled(blocks);
	}, []);

	if (!groupsEnabled) {
		return (
			<PanelBody title={__('Group Analytics', 'prc-quiz-builder')}>
				<p className="quiz-group-analytics-panel__help">
					{__(
						'Enable community groups on the Quiz Controller block to see group analytics.',
						'prc-quiz-builder'
					)}
				</p>
			</PanelBody>
		);
	}

	return <GroupAnalyticsPanelEnabled postId={postId} />;
}

const MONTH_LABELS = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec',
];

export default function AnalyticsPanel({ postId }) {
	const { data: quizAnalytics } = useQuizAnalytics(postId);

	const currentYear = new Date().getFullYear();

	const years = useMemo(() => {
		if (!quizAnalytics) return [];
		const yearKeys = Object.keys(quizAnalytics).filter(
			(key) => /^\d{4}$/.test(key) // Filter for 4-digit year keys
		);
		return yearKeys.sort((a, b) => b - a); // Sort descending
	}, [quizAnalytics]);

	const [selectedYear, setSelectedYear] = useState(currentYear);
	const [selectedMonth, setSelectedMonth] = useState('');

	// Update selectedYear when data loads
	useEffect(() => {
		if (years.length > 0 && !years.includes(selectedYear.toString())) {
			setSelectedYear(parseInt(years[0]));
		}
	}, [years, selectedYear]);

	const data = useMemo(() => {
		if (!quizAnalytics || !selectedYear) return [];
		const dataForYear = quizAnalytics[selectedYear] || {};

		// Ensure that dataForYear has properties 01 through 12
		const monthlyData = {};
		for (let i = 1; i <= 12; i++) {
			const monthKey = i.toString().padStart(2, '0');
			monthlyData[monthKey] = dataForYear[monthKey] || 0;
		}

		// Return sorted monthly data
		const sortedData = Object.keys(monthlyData).sort((a, b) => a - b);
		return sortedData.map((key) => monthlyData[key]);
	}, [quizAnalytics, selectedYear]);

	const dayData = useMemo(() => {
		if (!quizAnalytics || !selectedYear || !selectedMonth) return [];
		const yearData = quizAnalytics[selectedYear] || {};
		const days = yearData._days?.[selectedMonth] || {};
		const daysInMonth = new Date(
			Number(selectedYear),
			Number(selectedMonth),
			0
		).getDate();
		const values = [];
		for (let d = 1; d <= daysInMonth; d++) {
			const dayKey = String(d).padStart(2, '0');
			values.push(Number(days[dayKey] || days[String(d)] || 0));
		}
		return values;
	}, [quizAnalytics, selectedYear, selectedMonth]);

	const dayLabels = useMemo(() => {
		return dayData.map((_, i) => String(i + 1).padStart(2, '0'));
	}, [dayData]);

	const total = useMemo(() => {
		return data.reduce((acc, curr) => acc + curr, 0);
	}, [data]);

	const dayTotal = useMemo(() => {
		return dayData.reduce((acc, curr) => acc + curr, 0);
	}, [dayData]);

	const monthOptions = useMemo(() => {
		return [
			{ label: __('All months', 'prc-quiz-builder'), value: '' },
			...MONTH_LABELS.map((label, index) => ({
				label,
				value: String(index + 1).padStart(2, '0'),
			})),
		];
	}, []);

	if (!quizAnalytics) {
		return (
			<>
				<PanelBody title="Quiz Analytics">
					<p>Loading analytics data...</p>
				</PanelBody>
				<GroupAnalyticsPanel postId={postId} />
			</>
		);
	}

	return (
		<>
			<PanelBody title="Quiz Analytics">
				<SummaryStats
					first24Hours={quizAnalytics.first_24_hours}
					firstWeek={quizAnalytics.first_week}
					total={quizAnalytics.total}
				/>

				{years.length > 0 && (
					<>
						<SelectControl
							label="Select Year"
							value={selectedYear}
							options={years.map((year) => ({
								label: year,
								value: parseInt(year),
							}))}
							onChange={(value) => {
								setSelectedYear(value);
								setSelectedMonth('');
							}}
						/>
						<SelectControl
							label={__('Select Month', 'prc-quiz-builder')}
							value={selectedMonth}
							options={monthOptions}
							onChange={setSelectedMonth}
						/>
						{!selectedMonth && (
							<BaseControl
								id="quiz-analytics-monthly"
								help={`Monthly Total: ${formatCompactNumber(total)}`}
							>
								<CalendarChart values={data} />
							</BaseControl>
						)}
						{selectedMonth && (
							<BaseControl
								id="quiz-analytics-daily"
								help={sprintf(
									/* translators: 1: month label 2: day total */
									__(
										'Daily total for %1$s: %2$s',
										'prc-quiz-builder'
									),
									MONTH_LABELS[Number(selectedMonth) - 1],
									formatCompactNumber(dayTotal)
								)}
							>
								{dayTotal === 0 ? (
									<p>
										{__(
											'No daily submission data for this month yet.',
											'prc-quiz-builder'
										)}
									</p>
								) : (
									<CalendarChart
										values={dayData}
										labels={dayLabels}
									/>
								)}
							</BaseControl>
						)}
					</>
				)}
			</PanelBody>
			<GroupAnalyticsPanel postId={postId} />
		</>
	);
}
