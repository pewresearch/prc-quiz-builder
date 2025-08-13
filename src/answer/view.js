/**
 * WordPress Dependencies
 */
import {
	store,
	getContext,
	getElement,
	getServerContext,
	withScope,
	withSyncEvent,
	getServerState,
} from '@wordpress/interactivity';

const { state, actions } = store('prc-quiz/controller', {
	state: {
		get isAnswerSelected() {
			const { uuid, questionUuid, selectedAnswers } = getContext();
			return selectedAnswers[questionUuid]?.includes(uuid);
		},
	},
	actions: {
		/**
		 * When an answer is clicked, we need to add the answer's uuid to the private _selectedAnswers array.
		 * The prc-quiz/question block will watch this array and update the controller's selectedAnswers context with each update.
		 */
		onAnswerClick: withSyncEvent((event) => {
			event.preventDefault();
			const context = getContext();
			const { ref } = getElement();
			const { uuid, selectedAnswers, questionType, questionUuid } =
				context;
			if (ref.hasAttribute('disabled')) {
				return;
			}

			const currentAnswers = selectedAnswers[questionUuid] || [];
			const isAlreadySelected = currentAnswers.includes(uuid);

			if (questionType === 'single' || questionType === 'thermometer') {
				if (isAlreadySelected) {
					// Remove the answer if already selected
					context.selectedAnswers[questionUuid] = [];
				} else {
					// Add the answer if not selected
					context.selectedAnswers[questionUuid] = [uuid];
				}
			} else {
				// For multiple choice questions, toggle the answer selection
				if (isAlreadySelected) {
					// Remove the answer if already selected
					context.selectedAnswers[questionUuid] =
						currentAnswers.filter((answerId) => answerId !== uuid);
				} else {
					// Add the answer if not selected
					context.selectedAnswers[questionUuid] = [
						...currentAnswers,
						uuid,
					];
				}
			}

			actions.saveQuizProgress();
		}),
	},
});
