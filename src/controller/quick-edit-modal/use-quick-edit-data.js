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
import { createBlock } from '@wordpress/blocks';

/**
 * Internal Dependencies
 */
import { useQuizDataModel } from '@prc/quiz-components';

/**
 * Builds a prc-quiz/page block containing one question with the given
 * number of answer blocks, each wired up with block bindings.
 *
 * @param {string} quizType    The quiz type ('quiz', 'typology', 'freeform').
 * @param {number} questionNum Human-readable question number for the page title.
 * @param {number} answerCount Number of answer blocks to create.
 * @return {Object} A WPBlock instance ready for insertion.
 */
function buildQuestionPage(quizType, questionNum, answerCount = 3) {
	const defaultAnswerAttrs =
		quizType !== 'freeform' ? { correct: false } : {};

	const answerBlocks = Array.from({ length: answerCount }, () =>
		createBlock('prc-quiz/answer', defaultAnswerAttrs, [
			createBlock('core/paragraph', {
				metadata: {
					bindings: {
						content: { source: 'prc-quiz/answer' },
					},
				},
			}),
		])
	);

	const questionBlock = createBlock('prc-quiz/question', { type: 'single' }, [
		createBlock('core/paragraph', {
			fontSize: 'medium',
			metadata: {
				bindings: {
					content: { source: 'prc-quiz/question' },
				},
			},
		}),
		...answerBlocks,
	]);

	return createBlock('prc-quiz/page', { title: `Question ${questionNum}` }, [
		questionBlock,
	]);
}

/**
 * Flattens the nested quiz data model into one-row-per-answer for DataViews,
 * and provides mutation callbacks that write back to block attributes.
 *
 * @param {string} controllerClientId - The clientId of the prc-quiz/controller block.
 * @return {Object} { rows, loading, updateQuestion, updateAnswer, updateAnswerAttr, addQuestion }
 */
export default function useQuickEditData(controllerClientId) {
	const { data, loading } = useQuizDataModel(controllerClientId);
	const { updateBlockAttributes, insertBlock } =
		useDispatch(blockEditorStore);

	const { quizType, pagesClientId, pageCount } = useSelect(
		(select) => {
			const { getBlock } = select(blockEditorStore);
			const controllerBlock = getBlock(controllerClientId);
			const pagesBlock = controllerBlock?.innerBlocks?.find(
				(b) => b.name === 'prc-quiz/pages'
			);
			return {
				quizType: controllerBlock?.attributes?.type || 'quiz',
				pagesClientId: pagesBlock?.clientId,
				pageCount: pagesBlock?.innerBlocks?.length ?? 0,
			};
		},
		[controllerClientId]
	);

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
				questionUuid: q.uuid,
				questionType: q.type,
				answerIndex: aIdx,
				answerClientId: a.clientId,
				answerText: a.answer || '',
				answerUuid: a.uuid,
				correct: a.correct,
				points: a.points,
				resultsLabel: a.resultsLabel || '',
				pageTitle: q.pageTitle || '',
				pageIndex: q.pageIndex ?? 0,
			}));
		});
	}, [data]);

	const updateQuestion = useCallback(
		(clientId, text) => {
			updateBlockAttributes(clientId, { question: text });
		},
		[updateBlockAttributes]
	);

	const updateAnswer = useCallback(
		(clientId, text) => {
			updateBlockAttributes(clientId, { answer: text });
		},
		[updateBlockAttributes]
	);

	const updateAnswerAttr = useCallback(
		(clientId, attr, value) => {
			updateBlockAttributes(clientId, { [attr]: value });
		},
		[updateBlockAttributes]
	);

	/**
	 * Cycle true → null → false → true for knowledge-quiz answers.
	 * Unset (undefined) is treated like null / Not sure.
	 */
	const toggleCorrect = useCallback(
		(answerClientId, questionClientId, questionType, currentCorrect) => {
			if (quizType === 'freeform') {
				return;
			}
			let newCorrect;
			if (true === currentCorrect) {
				newCorrect = null;
			} else if (false === currentCorrect) {
				newCorrect = true;
			} else {
				// null or undefined (default inserter / unset)
				newCorrect = false;
			}

			if (questionType === 'single' && true === newCorrect) {
				const { getClientIdsOfDescendants, getBlock } =
					staticSelect(blockEditorStore);
				const descendants = getClientIdsOfDescendants(questionClientId);
				// Demote only currently Correct answers; preserve Not sure (null).
				descendants.forEach((id) => {
					const block = getBlock(id);
					if (
						block?.name === 'prc-quiz/answer' &&
						id !== answerClientId &&
						true === block?.attributes?.correct
					) {
						updateBlockAttributes(id, {
							correct: false,
							points: 0,
						});
					}
				});
			}

			updateBlockAttributes(answerClientId, {
				correct: newCorrect,
				points: true === newCorrect ? 1 : 0,
			});
		},
		[quizType, updateBlockAttributes]
	);

	const addQuestion = useCallback(() => {
		if (!pagesClientId) {
			return;
		}
		const questionNum = (data?.questions?.length ?? 0) + 1;
		const newPage = buildQuestionPage(quizType, questionNum);
		insertBlock(newPage, pageCount, pagesClientId);
	}, [pagesClientId, pageCount, quizType, data, insertBlock]);

	return {
		rows,
		loading,
		quizType,
		updateQuestion,
		updateAnswer,
		updateAnswerAttr,
		toggleCorrect,
		addQuestion,
	};
}
