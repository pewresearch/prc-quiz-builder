/**
 * WordPress Dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal Dependencies
 */
import {
	parseHistogramPopulation,
	serializeHistogramPopulation,
} from './histogram-population';

/**
 * Copy legacy histogram-block data onto the controller once.
 *
 * @param {string} clientId Controller block client ID.
 */
export default function useSeedHistogramPopulation(clientId) {
	const { updateBlockAttributes } = useDispatch(blockEditorStore);
	const payload = useSelect(
		(select) => {
			const { getBlock, getClientIdsOfDescendants } =
				select(blockEditorStore);
			const controller = getBlock(clientId);
			if (
				parseHistogramPopulation(
					controller?.attributes?.histogramPopulation
				).length
			) {
				return null;
			}
			const descendants = getClientIdsOfDescendants(clientId);
			for (const id of descendants) {
				const block = getBlock(id);
				if (block?.name !== 'prc-quiz/result-histogram') {
					continue;
				}
				const parsed = parseHistogramPopulation(
					block.attributes?.histogramData
				);
				if (parsed.length) {
					return serializeHistogramPopulation(parsed);
				}
			}
			return null;
		},
		[clientId]
	);

	useEffect(() => {
		if (!payload) {
			return;
		}
		updateBlockAttributes(clientId, { histogramPopulation: payload });
	}, [clientId, payload, updateBlockAttributes]);
}
