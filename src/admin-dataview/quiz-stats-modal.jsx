/**
 * External Dependencies
 */
import {
	QuizAnalyticsContent,
	QuizGroupAnalyticsContent,
} from '@prc/quiz-components';

/**
 * WordPress Dependencies
 */
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function QuizStatsModal({ quiz, onClose }) {
	if (!quiz) {
		return null;
	}

	const title = quiz.title?.trim() || __('Untitled quiz', 'prc-quiz-builder');

	return (
		<Modal
			title={title}
			onRequestClose={onClose}
			className="prc-quiz-library-stats-modal"
			size="medium"
		>
			<div className="prc-quiz-library-stats-modal__section">
				<h3>{__('Quiz Analytics', 'prc-quiz-builder')}</h3>
				<QuizAnalyticsContent
					postId={quiz.id}
					idPrefix="quiz-library-stats"
				/>
			</div>
			<div className="prc-quiz-library-stats-modal__section">
				<h3>{__('Group Analytics', 'prc-quiz-builder')}</h3>
				<QuizGroupAnalyticsContent
					postId={quiz.id}
					groupsEnabled={!!quiz.groups_enabled}
				/>
			</div>
		</Modal>
	);
}
