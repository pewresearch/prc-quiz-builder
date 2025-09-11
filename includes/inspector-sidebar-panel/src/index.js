/**
 * External Dependencies
 */
import { Icon, chartBar as icon } from '@wordpress/icons';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from 'react';
import { registerPlugin } from '@wordpress/plugins';
import {
	PluginSidebar,
	PluginSidebarMoreMenuItem,
	store as editorStore,
} from '@wordpress/editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal Dependencies
 */
import AnalyticsPanel from './analytics-panel';

const PLUGIN_NAME = 'prc-quiz-builder-analytics-panel';

function QuizAnalyticsSidebar() {
	const { postType, postId } = useSelect((select) => {
		const currentPostType = select(editorStore).getCurrentPostType();
		const currentPostId = select(editorStore).getCurrentPostId();
		return {
			postType: currentPostType,
			postId: currentPostId,
		};
	}, []);

	// Only show for quiz post type
	if (postType !== 'quiz') {
		return null;
	}

	return (
		<Fragment>
			<PluginSidebarMoreMenuItem target={PLUGIN_NAME} icon={icon}>
				{__('Quiz Analytics')}
			</PluginSidebarMoreMenuItem>
			<PluginSidebar
				name={PLUGIN_NAME}
				title="Quiz Analytics"
				icon={<Icon icon={icon} size={16} />}
			>
				<AnalyticsPanel postId={postId} />
			</PluginSidebar>
		</Fragment>
	);
}

registerPlugin(PLUGIN_NAME, {
	render: QuizAnalyticsSidebar,
});
