/**
 * External Dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress Dependencies
 */

const GroupFormWrapper = styled.div`
	display: block;
`;

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

export default function GroupForm({
	quizType = 'quiz',
	groupsEnabled = false,
}) {
	if (quizType !== 'typology' || true !== groupsEnabled) {
		return null;
	}

	return (
		<GroupFormWrapper>
			<p>
				<strong>
					Want to see how your classroom or community compares to the
					general public?
				</strong>{' '}
				Create a group quiz. You’ll receive a unique link to share with
				members of your group. As they complete the quiz, you can view
				the group’s results (no individual results are provided). See
				our{' '}
				<a
					href="https://www.pewresearch.org/typology-group-quiz-help-center/"
					target="_blank"
					rel="noreferrer"
				>
					Group Quiz FAQ
				</a>{' '}
				for more information.
			</p>
			<CreateGroupButton>Log In To Create A Group Quiz</CreateGroupButton>
		</GroupFormWrapper>
	);
}
