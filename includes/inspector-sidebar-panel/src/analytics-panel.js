import { useSelect } from '@wordpress/data';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	QuizAnalyticsContent,
	QuizGroupAnalyticsContent,
	findGroupsEnabled,
} from '@prc/quiz-components';

import AudiencePanel from './audience-panel';
import './analytics-panel.scss';

/**
 * Quiz analytics panels for the editor inspector sidebar.
 *
 * The panel bodies are the only editor-specific part; the analytics UI itself is
 * shared with the Quizzes DataViews list screen via `@prc/quiz-components`.
 *
 * @param {Object} props
 * @param {number} props.postId Quiz post ID.
 */
export default function AnalyticsPanel({ postId }) {
	const groupsEnabled = useSelect((select) => {
		const blocks = select('core/block-editor').getBlocks();
		return findGroupsEnabled(blocks);
	}, []);

	return (
		<>
			<PanelBody title={__('Quiz Analytics', 'prc-quiz-builder')}>
				<QuizAnalyticsContent
					postId={postId}
					idPrefix="quiz-analytics-panel"
				/>
			</PanelBody>
			<PanelBody title={__('Group Analytics', 'prc-quiz-builder')}>
				<QuizGroupAnalyticsContent
					postId={postId}
					groupsEnabled={groupsEnabled}
				/>
			</PanelBody>
			<AudiencePanel postId={postId} groupsEnabled={groupsEnabled} />
		</>
	);
}
