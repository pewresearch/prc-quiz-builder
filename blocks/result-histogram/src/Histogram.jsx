/* eslint-disable max-lines-per-function */
/**
 * External Dependencies
 */
import { ChartBuilderWrapper, baseConfig } from '@prc/chart-builder';

/**
 * WordPress Dependencies
 */
import { useEffect, useState } from '@wordpress/element';

// const fallbackData = [
// 	{
// 		x: '0',
// 		y: 20,
// 	},
// 	{
// 		x: '1',
// 		y: 30,
// 	},
// 	{
// 		x: '2',
// 		y: 30,
// 	},
// ];

function Histogram({
	histogramData,
	width,
	height,
	barWidth,
	barLabelPosition,
	barLabelCutoff,
	barColor,
	isHighlightedColor,
	yAxisDomain,
	xAxisLabel,
}) {
	const [chartData, setChartData] = useState([]);
	const config = {
		...baseConfig,
		layout: {
			...baseConfig.layout,
			type: 'bar',
			orientation: 'vertical',
			theme: 'light',
			parentClass: 'wp-block-prc-quiz-result-histogram',
			width,
			height,
			padding: {
				top: 0,
				bottom: 70,
				left: 0,
				right: 0,
			},
			horizontalRules: false,
		},
		metadata: {
			...baseConfig.metadata,
			active: false,
		},
		colors: [barColor],

		independentAxis: {
			...baseConfig.independentAxis,
			active: true,
			domain: undefined,
			scale: 'linear',
			domainPadding: 50,
			offsetY: null,
			label: xAxisLabel,
			padding: 50,
			tickCount: 20,
			multiLineTickLabels: false,
			multiLineTickLabelsBreak: 1,
			abbreviateTicks: false,
			abbreviateTicksDecimals: 0,
			tickUnit: '',
			tickUnitPosition: 'end',
			customTickFormat: null,
			tickLabels: {
				...baseConfig.independentAxis.tickLabels,
				fontSize: 12,
				padding: 5,
				angle: 0,
				dx: 0,
				dy: 0,
				textAnchor: 'middle',
				verticalAnchor: 'middle',
			},
			axisLabel: {
				...baseConfig.independentAxis.axisLabel,
				fontSize: 12,
				padding: 20,
				fill: 'rgba(35, 31, 32,0.7)',
				verticalAnchor: 'middle',
				textAnchor: 'middle',
				maxWidth: 500,
			},
			axis: {
				...baseConfig.independentAxis.axis,
				stroke: '#756f6b00',
			},
			ticks: {
				...baseConfig.independentAxis.ticks,
				stroke: 'gray',
				size: 5,
				strokeWidth: 0,
			},
			grid: {
				...baseConfig.independentAxis.grid,
				stroke: '',
			},
		},
		dependentAxis: {
			...baseConfig.dependentAxis,
			active: false,
			scale: 'linear',
			padding: 20,
			domain: [0, yAxisDomain],
			domainPadding: 20,
			showZero: false,
			tickCount: 5,
			tickValues: null,
			tickFormat: null,
			multiLineTickLabels: false,
			multiLineTickLabelsBreak: 1,
			abbreviateTicks: false,
			abbreviateTicksDecimals: 0,
			tickUnit: '',
			tickUnitPosition: 'end',
			tickLabels: {
				...baseConfig.dependentAxis.tickLabels,
				fontSize: 12,
				padding: 15,
				angle: 0,
				dx: 0,
				dy: 0,
				textAnchor: 'middle',
				verticalAnchor: 'start',
			},
			axisLabel: {
				...baseConfig.dependentAxis.axisLabel,
				fontSize: 12,
				padding: 30,
				fill: 'rgba(35, 31, 32,0.7)',
			},
			ticks: {
				...baseConfig.dependentAxis.ticks,
				stroke: 'gray',
				size: 5,
				strokeWidth: 0,
			},
			axis: {
				...baseConfig.dependentAxis.axis,
				stroke: '#756f6a',
			},
			grid: {
				...baseConfig.dependentAxis.grid,
				stroke: '',
			},
			dateFormat: 'yyyy',
		},
		dataRender: {
			...baseConfig.dataRender,
			x: 'x',
			y: 'y',
			x2: null,
			y2: null,
			sortKey: 'x',
			sortOrder: 'none',
			categories: ['y'],
			xScale: 'linear',
			yScale: 'linear',
			xFormat: 'yyyy',
			yFormat: 'yyyy',
			isHighlightedColor,
			// isHighlightedColor: '#ECDBAC',
		},
		animate: {
			active: false,
			duration: 500,
		},
		tooltip: {
			...baseConfig.tooltip,
			active: false,
		},
		legend: {
			...baseConfig.legend,
			active: false,
		},
		labels: {
			...baseConfig.labels,
			active: true,
			showFirstLastPointsOnly: false,
			color: 'black',
			fontWeight: 500,
			fontSize: 12,
			labelBarPosition: 'inside',
			labelCutoff: barLabelCutoff,
			labelCutoffMobile: barLabelCutoff,
			labelPositionDX: 0,
			labelPositionDY: barLabelPosition,
			pieLabelRadius: 60,
			abbreviateValue: false,
			toFixedDecimal: 0,
			labelUnit: '%',
			labelUnitPosition: 'end',
			customLabelFormat(d) {
				return 1 < d ? `${d}%` : `<1%`;
			},
		},
	};

	useEffect(() => {
		if (histogramData) {
			const parsed = JSON.parse(histogramData);
			console.log('Chart Data Parsed =', parsed);
			const normalized = parsed.map((d) => ({
				x: `${d.x} `,
				y: parseFloat(d.y),
				__isHighlighted: {
					y: d.isHighlighted ? d.isHighlighted : false,
				},
			}));
			console.log('Chart Data Normalized =', normalized);
			setChartData([normalized]);
		}
	}, [histogramData]);

	return <ChartBuilderWrapper config={config} data={chartData} />;
}

export default Histogram;
