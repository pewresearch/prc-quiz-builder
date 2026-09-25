/**
 * WordPress Dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal Dependencies
 */
import {
	binsForEditor,
	nextHistogramCorrect,
	parseHistogramPopulation,
	serializeHistogramPopulation,
} from '../histogram-population';

/**
 * Histogram population bins for the DataForm modal.
 *
 * @param {string} controllerClientId Controller block client ID.
 * @return {Object} Rows and writers.
 */
export default function useHistogramData(controllerClientId) {
	const { updateBlockAttributes } = useDispatch(blockEditorStore);

	const { bins, questionCount } = useSelect(
		(select) => {
			const { getBlock, getClientIdsOfDescendants } =
				select(blockEditorStore);
			const controller = getBlock(controllerClientId);
			const descendants = getClientIdsOfDescendants(controllerClientId);
			const questionCountFromTree = descendants.filter(
				(id) => getBlock(id)?.name === 'prc-quiz/question'
			).length;

			let parsed = parseHistogramPopulation(
				controller?.attributes?.histogramPopulation
			);
			if (!parsed.length) {
				const histogramBlock = descendants
					.map((id) => getBlock(id))
					.find(
						(block) =>
							block?.name === 'prc-quiz/result-histogram' &&
							block?.attributes?.histogramData
					);
				parsed = parseHistogramPopulation(
					histogramBlock?.attributes?.histogramData
				);
			}

			return {
				bins: binsForEditor(parsed, questionCountFromTree),
				questionCount: questionCountFromTree,
			};
		},
		[controllerClientId]
	);

	const persist = useCallback(
		(next) => {
			updateBlockAttributes(controllerClientId, {
				histogramPopulation: serializeHistogramPopulation(next),
			});
		},
		[controllerClientId, updateBlockAttributes]
	);

	const updateRow = useCallback(
		(index, updates) => {
			if (index < 0 || index >= bins.length) {
				return;
			}
			persist(
				bins.map((bin, binIndex) =>
					binIndex === index ? { ...bin, ...updates } : bin
				)
			);
		},
		[bins, persist]
	);

	const addRow = useCallback(() => {
		persist([...bins, { correct: nextHistogramCorrect(bins), percent: 0 }]);
	}, [bins, persist]);

	const removeRow = useCallback(
		(index) => {
			if (index < 0 || index >= bins.length) {
				return;
			}
			persist(bins.filter((_, binIndex) => binIndex !== index));
		},
		[bins, persist]
	);

	const rows = useMemo(
		() =>
			bins.map((bin, index) => ({
				id: `row-${index}`,
				correct: bin.correct,
				percent: bin.percent,
			})),
		[bins]
	);

	return { rows, questionCount, updateRow, addRow, removeRow };
}
