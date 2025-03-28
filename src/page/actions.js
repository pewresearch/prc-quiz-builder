/**
 * External Dependencies
 */
import classNames from 'classnames';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import GroupForm from './group-form';

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
		<div
			className={classNames('quiz-actions-wrapper', {
				'is-first-page': isFirstPage,
			})}
		>
			{!isFirstPage && (
				<Fragment>
					<button
						type="button"
						className={classNames(
							'quiz-button',
							'quiz-next-button',
							{
								'is-disabled': isLastPage && !canSubmit,
							}
						)}
						onClick={onNext}
					>
						{nextButtonText}
					</button>
					<button
						type="button"
						className="quiz-previous-button"
						onClick={onPrevious}
					>
						{previousLabel}
					</button>
					{canReset && (
						<button
							type="button"
							className="quiz-reset-button"
							onClick={onReset}
						>
							{resetLabel}
						</button>
					)}
				</Fragment>
			)}
			{isFirstPage && (
				<Fragment>
					<button
						type="button"
						className="quiz-button quiz-start-button"
						onClick={onNext}
					>
						{startQuizLabel}
					</button>
					<GroupForm {...{ quizType, groupsEnabled }} />
				</Fragment>
			)}
		</div>
	);
}
