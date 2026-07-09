/**
 * WordPress Dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { SyncedEntityEdit } from '@prc/components';

/**
 * Internal Dependencies
 */
import Controls from './controls';
import Placeholder from './placeholder';
import { POST_TYPE, POST_TYPE_LABEL } from './constants';

const PRESENCE_MESSAGES = {
	/* translators: %s: display name of the user currently editing the quiz */
	singular: __('%s is currently editing this quiz.', 'prc-quiz-synced-quiz'),
	/* translators: 1: comma-separated list of names, 2: last name in the list */
	plural: __(
		'%1$s and %2$s are currently editing this quiz.',
		'prc-quiz-synced-quiz'
	),
};

export default function SyncedQuizEdit(props) {
	return (
		<SyncedEntityEdit
			{...props}
			postType={POST_TYPE}
			presenceMessages={PRESENCE_MESSAGES}
			presenceNoticeClassName="synced-quiz-presence__notice"
			labels={{
				recursionWarning: sprintf(
					/* translators: %s: post type label */
					__(
						'%s cannot be rendered inside itself.',
						'prc-quiz-synced-quiz'
					),
					POST_TYPE_LABEL
				),
				deletedWarning: sprintf(
					/* translators: %s: post type label */
					__(
						'%s has been deleted or is unavailable.',
						'prc-quiz-synced-quiz'
					),
					POST_TYPE_LABEL
				),
				emptyLabel: sprintf(
					/* translators: %s: post type label */
					__('Empty %s', 'prc-quiz-synced-quiz'),
					POST_TYPE_LABEL
				),
			}}
			Controls={Controls}
			Placeholder={Placeholder}
		/>
	);
}
