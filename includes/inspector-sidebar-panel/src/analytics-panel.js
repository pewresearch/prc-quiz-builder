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
}) {
	const months = [
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
					key={index}
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

	const total = useMemo(() => {
		return data.reduce((acc, curr) => acc + curr, 0);
	}, [data]);

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
							onChange={setSelectedYear}
						/>
						<BaseControl
							id="quiz-analytics-monthly"
							help={`Monthly Total: ${formatCompactNumber(total)}`}
						>
							<CalendarChart values={data} />
						</BaseControl>
					</>
				)}
			</PanelBody>
			<GroupAnalyticsPanel postId={postId} />
		</>
	);
}
