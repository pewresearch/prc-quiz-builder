/**
 * WordPress Dependencies
 */
import domReady from '@wordpress/dom-ready';
import { createRoot } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import './style.scss';
import Controller from './controller';
import { ProvideQuiz } from './context';

domReady(() => {
	const quiz = document.querySelector('.wp-block-prc-quiz-controller');
	const attach = quiz.querySelector('.wp-block-prc-quiz-controller--react-app');
	const quizId = quiz.getAttribute('data-quiz-id');
	const isEmbedded = quiz.getAttribute('data-embed') ? true : false;

	if (quiz && attach) {
		const root = createRoot(attach); // createRoot(container!) if you use TypeScript
		root.render(
			<ProvideQuiz quizId={quizId} isEmbedded={isEmbedded}>
				<Controller />
			</ProvideQuiz>
		);
	}
});
