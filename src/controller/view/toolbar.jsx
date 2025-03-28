/* eslint-disable import/no-relative-packages */
/**
 * External Dependencies
 */
import classNames from 'classnames';
import styled from '@emotion/styled';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import { Icon } from '@prc/icons';
import { useQuiz } from './context';

import GroupCreation from './group-creation';

const ActionsWrapper = styled.div`
	display: flex;
	font-family: var(--wp--preset--font-family--sans-serif);
	flex-wrap: wrap;
	gap: ${(props) => (props.isFirstPage ? '3em' : '1em')};
	margin-top: ${(props) => (props.isFirstPage ? '3em' : '1em')};
	padding-top: ${(props) => (props.isFirstPage ? '0' : '1em')};
	border-top: ${(props) =>
		props.isFirstPage ? 'none' : '1px solid #dededf'};

	${(props) =>
		!props.isFirstPage &&
		`
		margin-left: auto;
		margin-right: auto;
		max-width: 640px!important;
		width: 100%;
		`}
`;

const Button = styled.button`
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
	display: inline-block;
`;

const StartQuizButton = styled(Button)`
	background-color: #e4cb84;
	color: black;
	border: 1px solid black;
	text-transform: uppercase;
	font-weight: bold;
	font-size: 18px;
	width: 260px;
	height: 62px;
	display: block;
	margin-left: auto;
	margin-right: auto;
`;

const NextButton = styled(Button)`
	font-size: 24px;
	width: 100%;
	background-color: #a5673f;
	color: #fff;
	&.is-disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}
`;

const PreviousButton = styled.button`
	line-height: 1.15;
	margin-top: 8px;
	border: none;
	background: #fff;
	color: #000;
	cursor: pointer;
	font-family: var(--wp--preset--font-family--sans-serif);
	font-size: 0.9285714286rem;
	letter-spacing: 0.1em;
	padding-left: 0;
	text-align: left;
	text-transform: uppercase;
	display: inline-block;
	flex-grow: 1;
`;

const GroupFormWrapper = styled.div`
	display: block;
`;

const ResetButton = styled(PreviousButton)`
	text-align: right !important;
`;

const Spinner = ({ label = '' }) => {
	return (
		<Fragment>
			<Icon icon="spinner" library="light" />
			<span aria-busy>{`${label}`}</span>
		</Fragment>
	);
};

// Maybe we should create a local session with a cookie for each user when they visit, when they submit we clear the local storage. So if cookie not present then set, if cookie is present and local storage is not then treat as a new quiz. If cookie present and local storage present then load the quiz state from local storage.

function Toolbar() {
	const {
		handleNextButton,
		handlePrevButton,
		userSubmission,
		resetUserSubmission,
		isLastPage,
		isFirstPage,
		canSubmit,
		groupsEnabled,
		quizType,
		threshold,
		processing,
	} = useQuiz();

	const submitLabel = __('Submit', 'prc-quiz');
	const nextLabel = __('Next >', 'prc-quiz');
	const previousLabel = __('< Go Back to Previous Question', 'prc-quiz');
	const resetLabel = __('Reset', 'prc-quiz');
	const startQuizLabel = __('Start Quiz', 'prc-quiz');
	let nextButtonText = isLastPage ? submitLabel : nextLabel;
	nextButtonText = processing ? (
		<Spinner label="Processing..." />
	) : (
		nextButtonText
	);

	return (
		<ActionsWrapper isFirstPage={isFirstPage}>
			{!isFirstPage && (
				<Fragment>
					<NextButton
						className={classNames({
							'is-disabled': isLastPage && !canSubmit,
						})}
						onClick={handleNextButton}
					>
						{nextButtonText}
					</NextButton>
					<PreviousButton onClick={handlePrevButton}>
						{previousLabel}
					</PreviousButton>
					{0 < userSubmission.length && (
						<ResetButton onClick={resetUserSubmission}>
							{resetLabel}
						</ResetButton>
					)}
				</Fragment>
			)}
			{isFirstPage && (
				<Fragment>
					<StartQuizButton onClick={handleNextButton}>
						{startQuizLabel}
					</StartQuizButton>
					{'typology' === quizType && true === groupsEnabled && (
						<GroupFormWrapper>
							<p>
								<strong>
									Want to see how your classroom or community
									compares to the general public?
								</strong>{' '}
								Create a group quiz. You’ll receive a unique
								link to share with members of your group. As
								they complete the quiz, you can view the group’s
								results (no individual results are provided).
								See our{' '}
								<a
									href="https://www.pewresearch.org/typology-group-quiz-help-center/"
									target="_blank"
									rel="noreferrer"
								>
									Group Quiz FAQ
								</a>{' '}
								for more information.
							</p>
							<GroupCreation />
						</GroupFormWrapper>
					)}
				</Fragment>
			)}
		</ActionsWrapper>
	);
}

export default Toolbar;
