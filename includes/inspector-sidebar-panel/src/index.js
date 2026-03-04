/**
 * External Dependencies
 */
import { Icon, chartBar as icon } from '@wordpress/icons';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from 'react';
import { useCommand } from '@wordpress/commands';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editPostStore } from '@wordpress/edit-post';
import { registerPlugin } from '@wordpress/plugins';
import {
	PluginSidebar,
	PluginSidebarMoreMenuItem,
	store as editorStore,
} from '@wordpress/editor';

/**
 * Internal Dependencies
 */
import AnalyticsPanel from './analytics-panel';

const PLUGIN_NAME = 'prc-quiz-builder-analytics-panel';

function QuizAnalyticsSidebar() {
	const { openGeneralSidebar } = useDispatch(editPostStore);

	useCommand({
		name: 'prc/show-quiz-analytics',
		label: __('Show Quiz Analytics', 'prc-quiz-builder'),
		icon,
		category: 'view',
		keywords: ['quiz', 'analytics', 'chart'],
		callback: ({ close }) => {
			openGeneralSidebar(`${PLUGIN_NAME}/${PLUGIN_NAME}`);
			close();
		},
	});

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
