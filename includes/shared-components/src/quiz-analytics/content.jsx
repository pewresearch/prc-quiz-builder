import { useEffect, useMemo, useState } from '@wordpress/element';
import {
	BaseControl,
	Button,
	Tooltip,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import {
	AnalyticsPeriodControls,
	CalendarHeatmap,
	MONTH_LABELS,
} from '@prc/components';

import GroupAnalyticsModal from './group-analytics-modal';
import { useGroupAnalytics, useQuizAnalytics } from './use-analytics';
import { formatCompactNumber } from './utils';

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
			<SummaryStat
				label={__('First 24 Hours', 'prc-quiz-builder')}
				value={first24Hours}
			/>
			<SummaryStat
				label={__('First Week', 'prc-quiz-builder')}
				value={firstWeek}
			/>
			<SummaryStat
				label={__('Total', 'prc-quiz-builder')}
				value={total}
			/>
		</div>
	);
}

/**
 * Submission analytics for a quiz, without any surrounding panel or modal chrome.
 *
 * Rendered inside a `PanelBody` by the editor inspector panel and inside a
 * `Modal` by the Quizzes DataViews list.
 *
 * @param {Object} props
 * @param {number} props.postId   Quiz post ID.
 * @param {string} props.idPrefix Prefix for generated control IDs, so the panel
 *                                and the modal can render at the same time.
 */
export function QuizAnalyticsContent({ postId, idPrefix = 'quiz-analytics' }) {
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

	if (!quizAnalytics) {
		return <p>{__('Loading analytics data…', 'prc-quiz-builder')}</p>;
	}

	return (
		<>
			<SummaryStats
				first24Hours={quizAnalytics.first_24_hours}
				firstWeek={quizAnalytics.first_week}
				total={quizAnalytics.total}
			/>

			{years.length > 0 && (
				<VStack spacing={4}>
					<AnalyticsPeriodControls
						years={years}
						selectedYear={selectedYear}
						onYearChange={setSelectedYear}
						selectedMonth={selectedMonth}
						onMonthChange={setSelectedMonth}
						yearLabel={__('Select Year', 'prc-quiz-builder')}
						monthLabel={__('Select Month', 'prc-quiz-builder')}
						allMonthsLabel={__('All months', 'prc-quiz-builder')}
					/>
					{!selectedMonth && (
						<BaseControl
							id={`${idPrefix}-monthly`}
							help={sprintf(
								/* translators: %s: monthly submission total */
								__('Monthly Total: %s', 'prc-quiz-builder'),
								formatCompactNumber(total)
							)}
						>
							<CalendarHeatmap
								values={data}
								getTooltipText={(v) => v.toLocaleString()}
								renderValue={(v) => formatCompactNumber(v)}
							/>
						</BaseControl>
					)}
					{selectedMonth && (
						<BaseControl
							id={`${idPrefix}-daily`}
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
								<CalendarHeatmap
									values={dayData}
									labels={dayLabels}
									getTooltipText={(v) => v.toLocaleString()}
									renderValue={(v) => formatCompactNumber(v)}
								/>
							)}
						</BaseControl>
					)}
				</VStack>
			)}
		</>
	);
}

/**
 * Community group analytics for a quiz, without any surrounding panel chrome.
 *
 * `groupsEnabled` is a prop rather than derived from the block editor store, so
 * this renders outside the editor (the DataViews list passes the value the
 * quiz list meta already carries).
 *
 * @param {Object}  props
 * @param {number}  props.postId        Quiz post ID.
 * @param {boolean} props.groupsEnabled Whether the controller enables groups.
 */
export function QuizGroupAnalyticsContent({ postId, groupsEnabled }) {
	if (!groupsEnabled) {
		return (
			<p className="quiz-group-analytics-panel__help">
				{__(
					'Enable community groups on the Quiz Controller block to see group analytics.',
					'prc-quiz-builder'
				)}
			</p>
		);
	}

	return <GroupAnalyticsEnabled postId={postId} />;
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

function GroupAnalyticsEnabled({ postId }) {
	const { data: groupAnalytics, error } = useGroupAnalytics(postId);
	const [isModalOpen, setIsModalOpen] = useState(false);

	if (!groupAnalytics && !error) {
		return <p>{__('Loading group analytics…', 'prc-quiz-builder')}</p>;
	}

	const totalGroups = groupAnalytics?.total_groups ?? 0;
	const totalSubmissions = groupAnalytics?.total_submissions ?? 0;

	return (
		<>
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
					__next40pxDefaultSize
					style={{ width: '100%', justifyContent: 'center' }}
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
		</>
	);
}
