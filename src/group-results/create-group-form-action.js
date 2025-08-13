/**
 * External Dependencies
 */
const {
	apiFetch,
	url: { addQueryArgs },
} = window.wp;

export default async function createGroupFormAction(
	quizId,
	ownerId,
	formFields,
	answers,
	clusters,
	nonce
) {
	// We need to get the answers which is an initial array of answer uuids set to 0 this will be provided by the group results block available at state.groups.answers
	// We need to the clusters, which the group results block will add into state available at state.groups.clusters
	return new Promise((resolve, reject) => {
		console.log('createGroupFormAction', {
			quizId,
			ownerId,
			formFields,
			answers,
			clusters,
			nonce,
		});
		// Find the group name from the form fields.
		const groupName = formFields.find(
			(field) => field.name === 'groupName'
		)?.value;
		if (!nonce) {
			return reject({
				message: 'Nonce is required',
				status: 'error',
			});
		}
		if (!groupName) {
			return reject({
				message: 'Group name is required',
				status: 'error',
			});
		}
		if (!ownerId) {
			return reject({
				message: 'Owner ID is required',
				status: 'error',
			});
		}
		if (!Object.keys(answers).length || !Object.keys(clusters).length) {
			return reject({
				message: 'Answers and clusters are required to create a group.',
				status: 'error',
			});
		}
		console.log('createGroupFormAction do api fetch');
		// Create the group.
		apiFetch({
			path: addQueryArgs('prc-api/v3/quiz/create-group', {
				nonce: nonce,
				quizId: quizId,
			}),
			method: 'POST',
			data: {
				groupName,
				ownerId,
				answers: answers,
				clusters: clusters,
			},
		})
			.then((group) => {
				console.log('Group created successfully', group);
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
				}
				return reject({
					message: errorMessage,
					data: error,
					status: 'error',
				});
			});
	});
}
