/**
 * WordPress Dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { SyncedEntityIsolationControls } from '@prc/components';

/**
 * Internal Dependencies
 */
import { POST_TYPE_LABEL } from './constants';

export default function Controls({
	attributes,
	entityTitle = '',
	permalink = '',
}) {
	return (
		<SyncedEntityIsolationControls
			attributes={attributes}
			panelTitle={sprintf(
				/* translators: %s: post type label */
				__('Synced %s', 'prc-quiz-synced-quiz'),
				POST_TYPE_LABEL
			)}
			entityTitle={entityTitle}
			entityTitleLabel={sprintf(
				/* translators: %s: post type label */
				__('%s Title', 'prc-quiz-synced-quiz'),
				POST_TYPE_LABEL
			)}
			previewLink={permalink}
			labels={{
				edit: __('Edit quiz in isolation', 'prc-quiz-synced-quiz'),
				preview: __(
					'Preview quiz in isolation',
					'prc-quiz-synced-quiz'
				),
			}}
		/>
	);
}
