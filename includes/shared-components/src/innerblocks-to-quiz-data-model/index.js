/**
 * External Dependencies
 */

/**
 * WordPress Dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import apiFetch from '@wordpress/api-fetch';

function structureData(controllerBlock) {
	const dataToReturn = {
		demoBreakLabels: controllerBlock.attributes.demoBreakLabels ? JSON.parse(controllerBlock.attributes.demoBreakLabels) : [],
		questions: [],
	};

	let pages = controllerBlock.innerBlocks.filter(
		block => block.name === 'prc-quiz/pages'
	);
	if (pages.length === 0) {
		return dataToReturn;
	}
	pages = pages.pop().innerBlocks;

	// get all `prc-quiz/question` blocks and their children
	pages.forEach(page =>
		page.innerBlocks.forEach(question => {
			if (question.name === 'prc-quiz/question') {
				const questionInternalId = question.attributes.internalId || null;
				if (undefined !== question.attributes.imageId) {
					apiFetch({
						path: `/wp/v2/media/${question.attributes.imageId}`,
					}).then(image => {
						console.log("IMAGE...", image);
					});
				}
				// Parse Question Block:
				const questionBlock = {
					clientId: question.clientId,
					uuid: question.attributes.uuid,
					question: question.attributes.question,
					questionId: questionInternalId,
					imageId: question.attributes.imageId,
					type: question.attributes.type,
					conditional: question.attributes.conditional,
					name: 'prc-quiz/question',
					answers: [],
					randomize: false,
					demoBreakValues: question.attributes.demoBreakValues ? JSON.parse(question.attributes.demoBreakValues) : [],
				};
				// Parse Answer Blocks:
				question.innerBlocks.forEach(answer => {
					if (answer.name === 'prc-quiz/answer') {
						questionBlock.answers.push({
							uuid: answer.attributes.uuid,
							answer: answer.attributes.answer,
							questionId: questionInternalId,
							imageId: answer.attributes.imageId,
							name: 'prc-quiz/answer',
							correct: answer.attributes.correct,
							points: answer.attributes.points,
							resultsLabel: answer.attributes.resultsLabel,
						});
					}
				});

				dataToReturn.questions.push(questionBlock);
			}
		})
	);
	return dataToReturn;
}

export function useQuizDataModel(clientId) {
	const [loading, setLoading] = useState(true);
	const [quizDataModel, setQuizDataModel] = useState([]);

	const { controllerBlock } = useSelect((select) => {
		const { getBlock, getBlockParentsByBlockName } = select(blockEditorStore);
		let controllerBlockClientId = clientId;
		if ( 'prc-quiz/controller' !== getBlock(clientId).name ) {
			controllerBlockClientId = getBlockParentsByBlockName(
				clientId,
				["prc-quiz/controller"]
			).pop();
		}
		const controllerBlock = getBlock(controllerBlockClientId);
		return {
			controllerBlock
		}
	}, []);

	useEffect(() => {
		const newData = structureData(controllerBlock);
		if ( newData.questions.length > 0 ) {
			setQuizDataModel(newData);
			setLoading(false);
		}
	}, [controllerBlock]);

	return {
		loading,
		data: quizDataModel,
	};
}

// We could maybe construct a Redux data store for this and register a proper wordpress data store for a quiz, accessible both on the front and backend??
