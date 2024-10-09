/**
 * WordPress dependencies
 */
import { render } from '@wordpress/element';
import domReady from '@wordpress/dom-ready';

import Histogram from './Histogram';

domReady(() => {
	if (document.querySelector('.wp-block-prc-quiz-result-histogram')) {
		const bars = document.querySelectorAll(
			'.wp-block-prc-quiz-result-histogram'
		);
		bars.forEach((bar) => {
			const barChart = bar.querySelector('#bar-chart');
			const attrs = bar.dataset;
			console.log({ attrs });
			const props = {
				histogramData: attrs.histogramData,
				width: parseFloat(attrs.width),
				height: parseFloat(attrs.height),
				barWidth: parseFloat(attrs.barWidth),
				barLabelPosition: parseFloat(attrs.barLabelPosition),
				barColor: attrs.barColor,
				isHighlightedColor: attrs.highlightedColor,
				yAxisDomain: parseFloat(attrs.yAxisDomain),
				xAxisLabel: attrs.xAxisLabel,
				barLabelCutoff: parseFloat(attrs.barLabelCutoff),
			};
			console.log({ props });
			render(<Histogram {...props} />, barChart);
		});
	}
});
