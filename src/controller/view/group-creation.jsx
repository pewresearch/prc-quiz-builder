/**
 * External Dependencies
 */
import styled from '@emotion/styled';
// eslint-disable-next-line prettier/prettier, object-curly-newline
import { Button, Form, Modal, Input } from 'semantic-ui-react';

import { ProvideAuth, useAuth } from '@prc/user-accounts';

/**
 * WordPress Dependencies
 */
import { Fragment, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal Dependencies
 */
import { useQuiz } from './context';

const CreateGroupButton = styled.button`
	border: none;
	border-radius: $radius;
	cursor: pointer;
	font-family: $fontFamily;
	line-height: 1.067em;
	padding: 0.7857142857em 1.5em;
	text-align: center;
	text-decoration: none;
	text-shadow: none;
	box-shadow: inset 0 0 0 0 rgba(34, 36, 38, 0.15);
	margin: 0;
	text-transform: uppercase;
	font-weight: normal;
	display: block;
	background-color: #f2f2f2;
	color: black;
	border: 1px solid #565656;
	font-size: 15px;
	width: 260px;
	height: 62px;
	margin-top: 54px;
	margin-left: auto;
	margin-right: auto;
`;

function onSubmit({
	quizId,
	quizTitle,
	quizSlug,
	submissionNonce,
	groupName,
	user,
	newsletterOptIn,
	onSuccess,
	onFailure,
}) {
	// Create group will create the group in Firebase and
	// store a record of the group in the user's Firebase profile.
	apiFetch({
		path: `/prc-api/v3/quiz/create-group/?quizId=${quizId}&nonce=${submissionNonce}`,
		method: 'POST',
		data: {
			name: groupName,
			owner: {
				id: user.uid,
				name: user.displayName,
				email: user.email,
			},
		},
	})
		.then((newGroupId) => {
			setTimeout(() => {
				if (false !== newGroupId) {
					console.log('Success:', newGroupId, {
						groupName,
						quizTitle,
						quizSlug,
					});
					const groupUrl = addQueryArgs(window.location.href, {
						group: newGroupId,
					});
					onSuccess(groupUrl);
				}
			}, 1000);
		})
		.catch((error) => {
			console.error('Error:', error);
			onFailure(error);
		});
}

// eslint-disable-next-line max-lines-per-function
function GroupCreationModal({ open = false, onClose }) {
	const {
		quizId,
		quizSlug,
		quizTitle,
		mailChimpListEnabled,
		submissionNonce,
	} = useQuiz();
	const { user } = useAuth();
	const [groupName, setGroupName] = useState('');
	const [newsletterOptIn, toggleNewsletterOptIn] = useState(false);
	const [success, setSuccess] = useState(false);
	const [copied, toggleCopied] = useState(false);
	const [error, setError] = useState(false);

	const copyToClipboard = (text) => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				toggleCopied(true);
			})
			.catch(() => {
				toggleCopied(false);
			});
	};

	const handleChange = (e, { name, value }) => {
		setGroupName(value);
	};

	console.log('GroupCreationModal', {
		quizId,
		quizSlug,
		quizTitle,
	});

	return (
		<Modal
			open={open}
			onClose={() => {
				onClose();
			}}
			size="small"
			dimmer="inverted"
		>
			<Modal.Header>Create a Group Quiz</Modal.Header>
			<Modal.Content>
				{false === success && (
					<Form
						onSubmit={() => {
							onSubmit({
								quizId,
								quizSlug,
								quizTitle,
								submissionNonce,
								groupName,
								user,
								newsletterOptIn,
								onSuccess: (groupUrl) => {
									setSuccess(groupUrl);
								},
								onFailure: (e) => {
									setError(e);
								},
							});
						}}
					>
						<Form.Field required>
							<Form.Input
								label="Group Name"
								type="text"
								onChange={handleChange}
								required
							/>
						</Form.Field>
						<Button primary type="submit">
							Create Group
						</Button>
					</Form>
				)}
				{false !== success && (
					<Fragment>
						<h2>Group Created!</h2>
						<p>
							Your group has been created. You can now share the
							link below with your group members.
						</p>
						<p>
							You can find a list of your groups on your{' '}
							<a
								href="https://www.pewresearch.org/profile"
								target="_blank"
								rel="noreferrer"
							>
								profile
							</a>
							.
						</p>
						<Input
							fluid
							action={{
								color: 'black',
								labelPosition: 'right',
								icon: !copied ? 'copy' : 'check',
								content: !copied ? 'Copy' : 'Copied',
								onClick: () =>
									copyToClipboard(success, toggleCopied),
							}}
							value={success}
						/>
					</Fragment>
				)}
			</Modal.Content>
		</Modal>
	);
}

function GroupCreationAction() {
	const { user } = useAuth();
	const [open, toggleOpen] = useState(false);

	return (
		<Fragment>
			{false === user && (
				<CreateGroupButton
					onClick={() =>
						(window.location.href = 'www.pewresearch.org/profile')
					}
				>
					Log in to create a group quiz
				</CreateGroupButton>
			)}
			{false !== user && (
				<Fragment>
					<CreateGroupButton onClick={() => toggleOpen(true)}>
						Create a group quiz
					</CreateGroupButton>
					<GroupCreationModal
						open={open}
						onClose={() => {
							toggleOpen(false);
						}}
					/>
				</Fragment>
			)}
		</Fragment>
	);
}

export default function GroupCreation() {
	return (
		<ProvideAuth>
			<GroupCreationAction />
		</ProvideAuth>
	);
}
