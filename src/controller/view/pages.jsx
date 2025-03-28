/**
 * WordPress Dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import { useQuiz } from './context';
import Page from './page';

function Pages() {
	const { quizData } = useQuiz();

	if (undefined === quizData) {
		// eslint-disable-next-line react/jsx-no-useless-fragment
		return <Fragment />;
	}

	return (
		<div className="prc-quiz--pages">
			{quizData.map((p) => (
				<Page key={p.uuid} uuid={p.uuid} />
			))}
		</div>
	);
}

export default Pages;
