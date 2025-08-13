/**
 * WordPress Dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

/**
 * Internal Dependencies
 */
import createGroupFormAction from './create-group-form-action';

const { state, actions } = store('prc-quiz/controller', {
	state: {
		get communityGroupResultsUrl() {
			const context = getContext();
			const { groupId, quizUrl } = context;
			if (!groupId) {
				return false;
			}
			return `${quizUrl}/group/${groupId}/results`;
		},
		get groupAnswers() {
			const context = getContext();
			const { groupsEnabled, quizId } = context;
			if (!groupsEnabled) {
				return;
			}
			const quizData = state[`quiz_${quizId}`];
			if (!quizData) {
				return;
			}
			const { questions } = quizData;
			// Loop through each question and get it's answer key
			let answerKeys = Object.values(questions).map((question) => {
				return Object.values(question.answers).map(
					(answer) => answer.uuid
				);
			});
			// Flatten the array of arrays into a single array.
			answerKeys = answerKeys.flat();
			// Now map as an object the answerkeys with a value of 0
			const answers = answerKeys.reduce((acc, key) => {
				acc[key] = 0;
				return acc;
			}, {});

			return answers;
		},
		get groupClusters() {
			const context = getContext();
			const { groupsEnabled, quizId } = context;
			if (!groupsEnabled) {
				return;
			}
			const quizData = state[`quiz_${quizId}`];
			if (!quizData) {
				return;
			}
			const { clusters } = quizData;
			return clusters;
		},
	},
	actions: {
		/**
		 * Create a new group.
		 * @param {Object} formFields - The form fields.
		 * @returns {Promise<object>} - The create group response.
		 */
		createGroup: async (formFields) => {
			const { nonce, quizId } = state;
			const { groupAnswers, groupClusters } = state;
			console.log('createGroup Request::', {
				formFields,
				nonce,
				quizId,
				groupAnswers,
				groupClusters,
			});
			const ownerId = await store(
				'prc-user-accounts/content-gate'
			).actions.getUserIdFromCookie();
			console.log('createGroup Owner ID', ownerId);
			if (
				!Object.keys(groupAnswers).length ||
				!Object.keys(groupClusters).length
			) {
				throw new Error(
					'Answers and clusters are required to create a group.'
				);
			}
			if (!ownerId) {
				throw new Error('Owner ID is required to create a group.');
			}
			if (!quizId) {
				throw new Error('Quiz ID is required to create a group.');
			}
			try {
				return await createGroupFormAction(
					quizId,
					ownerId,
					formFields,
					groupAnswers,
					groupClusters,
					nonce
				);
			} catch (error) {
				throw error;
			}
		},
	},
	callbacks: {
		onGroupsInit: () => {
			const context = getContext();
			const { groupsEnabled, groupData, groupDomain, groupId, quizId } =
				context;
			if (!groupsEnabled) {
				return;
			}
			const quizData = state[`quiz_${quizId}`];
			if (!quizData) {
				return;
			}
			// console.log('onGroupsInit::', {
			// 	...quizData,
			// 	groupAnswers: state.groupAnswers,
			// 	groupClusters: state.groupClusters,
			// });
		},
	},
});
