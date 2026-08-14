/**
 * WordPress Dependencies
 */
import { useMemo, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

const EMPTY_MODEL = {
	demoBreakLabels: [],
	questions: [],
};

function modelSignature(data) {
	return JSON.stringify({
		demoBreakLabels: data.demoBreakLabels,
		questions: data.questions,
	});
}

function structureData(controllerBlock) {
	const dataToReturn = {
		demoBreakLabels: controllerBlock.attributes.demoBreakLabels
			? JSON.parse(controllerBlock.attributes.demoBreakLabels)
			: [],
		questions: [],
	};

	let pages = controllerBlock.innerBlocks.filter(
		(block) => block.name === 'prc-quiz/pages'
	);
	if (pages.length === 0) {
		return dataToReturn;
	}
	pages = pages.pop().innerBlocks;

	// Recursive function to find all question blocks at any depth
	function findQuestionBlocks(blocks) {
		const questionBlocks = [];

		blocks.forEach((block) => {
			if (block.name === 'prc-quiz/question') {
				questionBlocks.push(block);
			}

			// Recursively search in nested blocks
			if (block.innerBlocks && block.innerBlocks.length > 0) {
				questionBlocks.push(...findQuestionBlocks(block.innerBlocks));
			}
		});

		return questionBlocks;
	}

	// Recursive function to find all answer blocks at any depth within a question
	function findAnswerBlocks(blocks) {
		const answerBlocks = [];

		blocks.forEach((block) => {
			if (block.name === 'prc-quiz/answer') {
				answerBlocks.push(block);
			}

			// Recursively search in nested blocks
			if (block.innerBlocks && block.innerBlocks.length > 0) {
				answerBlocks.push(...findAnswerBlocks(block.innerBlocks));
			}
		});

		return answerBlocks;
	}

	// get all `prc-quiz/question` blocks and their children from all pages
	pages.forEach((page, pageIndex) => {
		const pageTitle = page.attributes?.title || `Page ${pageIndex + 1}`;
		const questionBlocks = findQuestionBlocks(page.innerBlocks);

		questionBlocks.forEach((question) => {
			const questionInternalId = question.attributes.internalId || null;
			// Parse Question Block:
			const questionBlock = {
				clientId: question.clientId,
				uuid: question.attributes.uuid,
				question: question.attributes.question,
				questionId: questionInternalId,
				type: question.attributes.type,
				conditional: question.attributes?.conditionalDisplay,
				name: 'prc-quiz/question',
				answers: [],
				randomize: false,
				demoBreakValues: question.attributes.demoBreakValues
					? JSON.parse(question.attributes.demoBreakValues)
					: [],
				pageTitle,
				pageIndex,
			};

			// Parse Answer Blocks recursively:
			const answerBlocks = findAnswerBlocks(question.innerBlocks);
			answerBlocks.forEach((answer) => {
				questionBlock.answers.push({
					clientId: answer.clientId,
					uuid: answer.attributes.uuid,
					answer: answer.attributes.answer,
					questionId: questionInternalId,
					name: 'prc-quiz/answer',
					correct: answer.attributes?.correct,
					points: answer.attributes?.points,
					resultsLabel: answer.attributes?.resultsLabel,
				});
			});

			dataToReturn.questions.push(questionBlock);
		});
	});

	return dataToReturn;
}

export default function useQuizDataModel(clientId) {
	const controllerBlock = useSelect(
		(select) => {
			const { getBlock, getBlockParentsByBlockName } =
				select(blockEditorStore);
			const current = getBlock(clientId);
			if (!current) {
				return null;
			}
			if ('prc-quiz/controller' === current.name) {
				return current;
			}
			const controllerBlockClientId = getBlockParentsByBlockName(
				clientId,
				['prc-quiz/controller']
			).pop();
			return controllerBlockClientId
				? getBlock(controllerBlockClientId)
				: null;
		},
		[clientId]
	);

	const data = useMemo(() => {
		if (!controllerBlock) {
			return EMPTY_MODEL;
		}
		return structureData(controllerBlock);
	}, [controllerBlock]);

	const previous = useRef(null);
	const signature = modelSignature(data);
	if (!previous.current || previous.current.signature !== signature) {
		previous.current = { data, signature };
	}

	return {
		loading: !controllerBlock,
		data: previous.current.data,
	};
}
