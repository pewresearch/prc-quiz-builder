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
import GroupForm from './GroupForm';

const ActionsWrapper = styled.div`
	display: flex;
	font-family: var(--wp--preset--font-family--sans-serif);
	flex-wrap: wrap;
	gap: ${(props) => (props.isFirstPage ? '3em' : '1em')};
	margin-top: ${(props) => (props.isFirstPage ? '3em' : '1em')};
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

const ResetButton = styled(PreviousButton)`
	text-align: right !important;
`;

export default function Actions({
	quizType = 'quiz',
	groupsEnabled = false,
	onNext = () => {},
	onPrevious = () => {},
	onReset = () => {},
	isLastPage = false,
	isFirstPage = false,
	canSubmit = false,
	canReset = false,
}) {
	const submitLabel = __('Submit', 'prc-quiz');
	const nextLabel = __('Next >', 'prc-quiz');
	const previousLabel = __('< Go Back to Previous Question', 'prc-quiz');
	const resetLabel = __('Reset', 'prc-quiz');
	const startQuizLabel = __('Start Quiz', 'prc-quiz');

	const nextButtonText = isLastPage ? submitLabel : nextLabel;
	return (
		<ActionsWrapper isFirstPage={isFirstPage}>
			{!isFirstPage && (
				<Fragment>
					<NextButton
						className={classNames({
							'is-disabled': isLastPage && !canSubmit,
						})}
						onClick={onNext}
					>
						{nextButtonText}
					</NextButton>
					<PreviousButton onClick={onPrevious}>
						{previousLabel}
					</PreviousButton>
					{canReset && (
						<ResetButton onClick={onReset}>
							{resetLabel}
						</ResetButton>
					)}
				</Fragment>
			)}
			{isFirstPage && (
				<Fragment>
					<StartQuizButton onClick={onNext}>
						{startQuizLabel}
					</StartQuizButton>
					<GroupForm {...{ quizType, groupsEnabled }} />
				</Fragment>
			)}
		</ActionsWrapper>
	);
}
