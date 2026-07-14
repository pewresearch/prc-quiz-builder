/**
 * External Dependencies
 */
const {
	apiFetch,
	url: { addQueryArgs },
} = window.wp;

export default async function createGroupFormAction(
	quizId,
	headers,
	formFields,
	answers,
	clusters,
	ownerSubmission = null,
	ownerScore = null
) {
	// We need to get the answers which is an initial array of answer uuids set to 0 this will be provided by the group results block available at state.groups.answers
	// We need to the clusters, which the group results block will add into state available at state.groups.clusters
	return new Promise((resolve, reject) => {
		// Find the group name from the form fields.
		const groupName = formFields.find(
			(field) => field.name === 'groupName'
		)?.value;
		if (!groupName) {
			return reject({
				message: 'Group name is required',
				status: 'error',
			});
		}
		if (!headers) {
			return reject({
				message: 'You must be logged in to create a group.',
				status: 'error',
			});
		}
		if (!Object.keys(answers).length || !Object.keys(clusters).length) {
			return reject({
				message: 'Answers and clusters are required to create a group.',
				status: 'error',
			});
		}

		const postData = {
			groupName,
			answers,
			clusters,
		};

		// When creating a group from the results page, include the owner's
		// submission so the backend can seed the group with their result.
		if (
			ownerSubmission &&
			Array.isArray(ownerSubmission) &&
			ownerSubmission.length
		) {
			postData.ownerSubmission = ownerSubmission;
		}
		if (ownerScore !== null && ownerScore !== undefined) {
			postData.ownerScore = ownerScore;
		}

		// Create the group. Owner identity is derived server-side from the
		// verified Firebase token in X-PRC-User-Token.
		apiFetch({
			path: addQueryArgs('prc-api/v3/quiz/create-group', {
				quizId,
			}),
			method: 'POST',
			headers,
			data: postData,
		})
			.then((group) => {
				return resolve({
					message: `Group created successfully. You can now share this url: ${group.group_url} with your group members. For group: ${group.group_id}`,
					data: group,
					status: 'success',
				});
			})
			.catch((error) => {
				const errorCode = error.code;
				let errorMessage = 'Error creating group. Please try again.';
				if ('rest_invalid_param' === errorCode) {
					errorMessage =
						'Invalid group name. Please check your group name and try again.';
				} else if (
					'missing_token' === errorCode ||
					'invalid_token' === errorCode
				) {
					errorMessage =
						'You must be logged in to create a group. Please sign in and try again.';
				}
				return reject({
					message: errorMessage,
					data: error,
					status: 'error',
				});
			});
	});
}
