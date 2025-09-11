import { useMemo, useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { PanelBody, BaseControl, SelectControl } from '@wordpress/components';

import './analytics-panel.scss';

// Custom hook for fetching quiz analytics
function useQuizAnalytics(postId) {
	const [analytics, setAnalytics] = useState(null);

	useEffect(() => {
		if (!postId) return;

		apiFetch({
			path: `/wp/v2/quiz/${postId}?_fields=_submissions`,
			method: 'GET',
		})
			.then((response) => {
				setAnalytics({
					success: true,
					...response._submissions,
				});
			})
			.catch((error) => {
				console.error({ error });
			});
	}, [postId]);

	return analytics;
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
					<span className="value">{value}</span>
				</div>
			))}
		</div>
	);
}

function SummaryStats({ first24Hours, firstWeek, total }) {
	return (
		<div className="analytics-summary">
			<div className="summary-stat">
				<span className="stat-label">First 24 Hours</span>
				<span className="stat-value">{first24Hours || 0}</span>
			</div>
			<div className="summary-stat">
				<span className="stat-label">First Week</span>
				<span className="stat-value">{firstWeek || 0}</span>
			</div>
			<div className="summary-stat">
				<span className="stat-label">Total</span>
				<span className="stat-value">{total || 0}</span>
			</div>
		</div>
	);
}

export default function AnalyticsPanel({ postId }) {
	const quizAnalytics = useQuizAnalytics(postId);

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
			<PanelBody title="Quiz Analytics">
				<p>Loading analytics data...</p>
			</PanelBody>
		);
	}

	return (
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
						help={`Monthly Total: ${total}`}
					>
						<CalendarChart values={data} />
					</BaseControl>
				</>
			)}
		</PanelBody>
	);
}
