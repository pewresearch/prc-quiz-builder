/**
 * WordPress Dependencies
 */
import { useMemo, useCallback } from '@wordpress/element';
import {
	useSelect,
	useDispatch,
	select as staticSelect,
} from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal Dependencies
 */
import { useQuizDataModel } from '@prc/quiz-components';
import {
	parseJsonArray,
	padDemoBreakValues,
	moveIndex,
	permuteByOrder,
	isCompleteIndexPermutation,
} from '../../result-table/utils';

/**
 * Flatten quiz answers for the results-data DataViews modal and
 * write population / demographic values back to block attributes.
 *
 * @param {string} controllerClientId Controller block client ID.
 * @return {Object} Rows and mutation helpers.
 */
export default function useResultsData(controllerClientId) {
	const { data, loading } = useQuizDataModel(controllerClientId);
	const { updateBlockAttributes } = useDispatch(blockEditorStore);

	const demoBreakLabelsJson = useSelect(
		(select) => {
			const { getBlock } = select(blockEditorStore);
			const controllerBlock = getBlock(controllerClientId);
			return controllerBlock?.attributes?.demoBreakLabels ?? '';
		},
		[controllerClientId]
	);
	const demoBreakLabels = useMemo(
		() => parseJsonArray(demoBreakLabelsJson),
		[demoBreakLabelsJson]
	);

	const answerClientIds = useMemo(() => {
		if (!data?.questions) {
			return [];
		}
		return data.questions.flatMap((q) =>
			q.answers.map((a) => a.clientId).filter(Boolean)
		);
	}, [data]);

	const rows = useMemo(() => {
		if (!data?.questions) {
			return [];
		}
		let globalQuestionIndex = 0;
		return data.questions.flatMap((q) => {
			const qIdx = globalQuestionIndex++;
			return q.answers.map((a, aIdx) => ({
				id: `${q.clientId}-${a.uuid || aIdx}`,
				questionIndex: qIdx,
				questionClientId: q.clientId,
				questionText: q.question || '',
				answerIndex: aIdx,
				answerClientId: a.clientId,
				answerText: a.answer || '',
				populationPercent: a.populationPercent || '',
				demoBreakValues: padDemoBreakValues(
					a.demoBreakValues,
					demoBreakLabels.length
				),
				pageTitle: q.pageTitle || '',
			}));
		});
	}, [data, demoBreakLabels.length]);

	const updateAnswerAttr = useCallback(
		(clientId, attr, value) => {
			updateBlockAttributes(clientId, { [attr]: value });
		},
		[updateBlockAttributes]
	);

	const updatePopulationPercent = useCallback(
		(answerClientId, value) => {
			updateAnswerAttr(answerClientId, 'populationPercent', value);
		},
		[updateAnswerAttr]
	);

	const readDemoBreakValues = useCallback((answerClientId, labelCount) => {
		const { getBlock } = staticSelect(blockEditorStore);
		const block = getBlock(answerClientId);
		return padDemoBreakValues(
			parseJsonArray(block?.attributes?.demoBreakValues),
			labelCount
		);
	}, []);

	const syncAnswerDemoBreaks = useCallback(
		(labelCount, transform) => {
			answerClientIds.forEach((answerClientId) => {
				const current = readDemoBreakValues(
					answerClientId,
					demoBreakLabels.length
				);
				const next = transform(current);
				updateAnswerAttr(
					answerClientId,
					'demoBreakValues',
					JSON.stringify(padDemoBreakValues(next, labelCount))
				);
			});
		},
		[
			answerClientIds,
			demoBreakLabels.length,
			readDemoBreakValues,
			updateAnswerAttr,
		]
	);

	const updateDemoBreakValue = useCallback(
		(answerClientId, labelIndex, value) => {
			const current = readDemoBreakValues(
				answerClientId,
				demoBreakLabels.length
			);
			const next = [...current];
			next[labelIndex] = value;
			updateAnswerAttr(
				answerClientId,
				'demoBreakValues',
				JSON.stringify(next)
			);
		},
		[demoBreakLabels.length, readDemoBreakValues, updateAnswerAttr]
	);

	const addDemoBreakLabel = useCallback(
		(label) => {
			const trimmed = (label || '').trim();
			if (!trimmed) {
				return;
			}
			const nextLabels = [...demoBreakLabels, trimmed];
			updateBlockAttributes(controllerClientId, {
				demoBreakLabels: JSON.stringify(nextLabels),
			});
			syncAnswerDemoBreaks(nextLabels.length, (current) => [
				...current,
				'',
			]);
		},
		[
			controllerClientId,
			demoBreakLabels,
			syncAnswerDemoBreaks,
			updateBlockAttributes,
		]
	);

	const renameDemoBreakLabel = useCallback(
		(index, label) => {
			const next = [...demoBreakLabels];
			next[index] = label;
			updateBlockAttributes(controllerClientId, {
				demoBreakLabels: JSON.stringify(next),
			});
		},
		[controllerClientId, demoBreakLabels, updateBlockAttributes]
	);

	const removeDemoBreakLabel = useCallback(
		(index) => {
			const nextLabels = demoBreakLabels.filter((_, i) => i !== index);
			updateBlockAttributes(controllerClientId, {
				demoBreakLabels: JSON.stringify(nextLabels),
			});
			syncAnswerDemoBreaks(nextLabels.length, (current) =>
				current.filter((_, i) => i !== index)
			);
		},
		[
			controllerClientId,
			demoBreakLabels,
			syncAnswerDemoBreaks,
			updateBlockAttributes,
		]
	);

	const applyDemoBreakOrder = useCallback(
		(order) => {
			if (!isCompleteIndexPermutation(order, demoBreakLabels.length)) {
				return;
			}
			if (order.every((index, i) => index === i)) {
				return;
			}
			const nextLabels = permuteByOrder(demoBreakLabels, order);
			updateBlockAttributes(controllerClientId, {
				demoBreakLabels: JSON.stringify(nextLabels),
			});
			syncAnswerDemoBreaks(nextLabels.length, (current) =>
				permuteByOrder(current, order)
			);
		},
		[
			controllerClientId,
			demoBreakLabels,
			syncAnswerDemoBreaks,
			updateBlockAttributes,
		]
	);

	const reorderDemoBreakLabels = useCallback(
		(fromIndex, toIndex) => {
			applyDemoBreakOrder(
				moveIndex(
					demoBreakLabels.map((_, i) => i),
					fromIndex,
					toIndex
				)
			);
		},
		[applyDemoBreakOrder, demoBreakLabels]
	);

	return {
		rows,
		loading,
		demoBreakLabels,
		updatePopulationPercent,
		updateDemoBreakValue,
		addDemoBreakLabel,
		renameDemoBreakLabel,
		removeDemoBreakLabel,
		reorderDemoBreakLabels,
		applyDemoBreakOrder,
	};
}
