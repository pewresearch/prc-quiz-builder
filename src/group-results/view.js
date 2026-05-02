/**
 * WordPress Dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

/**
 * Internal Dependencies
 */
import createGroupFormAction from './create-group-form-action';

const { state } = store('prc-quiz/controller', {
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
		 * @return {Promise<object>} - The create group response.
		 */
		createGroup: async (formFields) => {
			const { nonce, quizId } = state;
			const { groupAnswers, groupClusters } = state;
			const ownerId = await store(
				'prc-user-accounts/content-gate'
			).actions.getUserIdFromCookie();
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

		/**
		 * Create a new group from the results page, seeding it with the owner's
		 * own quiz submission so they are automatically the first member.
		 *
		 * The user's submission data lives in the results block context as
		 * `userScore`, which is populated server-side by class-results.php when
		 * the user lands on the results URL.  It is also set client-side by
		 * submitQuiz() after the user finishes the quiz in the same page load.
		 *
		 * @param {Object} formFields - The form fields (must contain groupName).
		 * @return {Promise<object>} - The create group response.
		 */
		createGroupFromResults: async (formFields) => {
			const { nonce, quizId } = state;
			const { groupAnswers, groupClusters } = state;
			const context = getContext();
			const { userScore } = context;

			const ownerId = await store(
				'prc-user-accounts/content-gate'
			).actions.getUserIdFromCookie();

			if (!ownerId) {
				throw new Error('Owner ID is required to create a group.');
			}
			if (!quizId) {
				throw new Error('Quiz ID is required to create a group.');
			}
			if (
				!groupAnswers ||
				!groupClusters ||
				!Object.keys(groupAnswers).length ||
				!Object.keys(groupClusters).length
			) {
				throw new Error(
					'Answers and clusters are required to create a group.'
				);
			}

			// Gather the owner's submission to seed the group.
			const ownerSubmission = userScore?.userSubmission?.length
				? userScore.userSubmission
				: null;
			const ownerScore =
				userScore?.score !== undefined && userScore?.score !== null
					? userScore.score
					: null;

			try {
				return await createGroupFormAction(
					quizId,
					ownerId,
					formFields,
					groupAnswers,
					groupClusters,
					nonce,
					ownerSubmission,
					ownerScore
				);
			} catch (error) {
				throw error;
			}
		},
	},
	callbacks: {
		onGroupsInit: () => {
			const context = getContext();
			const { groupsEnabled, quizId } = context;
			if (!groupsEnabled) {
				return;
			}
			// Ensure quiz data is available before doing any group initialization.
			const _quizData = state[`quiz_${quizId}`];
			void _quizData;
		},
	},
});
