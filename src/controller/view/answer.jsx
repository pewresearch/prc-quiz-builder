/**
 * External Dependencies
 */
import classNames from 'classnames';

/**
 * WordPress Dependencies
 */
import { Fragment, RawHTML } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import { useQuiz } from './context';

function Answer({ uuid, answer, image = false, conditional, onClick }) {
	const { userSubmission } = useQuiz();

	const classes = classNames('wp-block-prc-quiz-answer', {
		active: userSubmission.includes(uuid),
	});

	if (false !== conditional && !userSubmission.includes(conditional)) {
		// eslint-disable-next-line react/jsx-no-useless-fragment
		return <Fragment />;
	}

	return (
		<button type="button" className={classes} onClick={onClick}>
			<RawHTML>{answer}</RawHTML>
		</button>
	);
}

export default Answer;
