/**
 * External Dependencies
 */

/**
 * WordPress Dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

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
	pages.forEach((page) => {
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
			};

			// Parse Answer Blocks recursively:
			const answerBlocks = findAnswerBlocks(question.innerBlocks);
			answerBlocks.forEach((answer) => {
				questionBlock.answers.push({
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
	const [loading, setLoading] = useState(true);
	const [quizDataModel, setQuizDataModel] = useState([]);

	const { controllerBlock } = useSelect(
		(select) => {
			const { getBlock, getBlockParentsByBlockName } =
				select(blockEditorStore);
			let controllerBlockClientId = clientId;
			if ('prc-quiz/controller' !== getBlock(clientId).name) {
				controllerBlockClientId = getBlockParentsByBlockName(clientId, [
					'prc-quiz/controller',
				]).pop();
			}
			return {
				controllerBlock: getBlock(controllerBlockClientId),
			};
		},
		[clientId]
	);

	useEffect(() => {
		const newData = structureData(controllerBlock);
		if (newData.questions.length > 0) {
			setQuizDataModel(newData);
			setLoading(false);
		}
	}, [controllerBlock]);

	return {
		loading,
		data: quizDataModel,
	};
}
