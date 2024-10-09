/**
 * WordPress Dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import { useQuiz } from './context';
import Pages from './pages';
import Toolbar from './toolbar';
import ReturnToQuizModal from './return-to-quiz-modal';

function Controller() {
	const { resumeQuizStateModal, loaded, isFirstPage } = useQuiz();

	if (!loaded) {
		return null;
	}

	return (
		<Fragment>
			<Pages />
			{!isFirstPage && <Toolbar />}
			{resumeQuizStateModal && (
				<ReturnToQuizModal open={resumeQuizStateModal} />
			)}
		</Fragment>
	);
}

export default Controller;
