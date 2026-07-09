/**
 * External Dependencies
 */
import { Icon } from '@prc/icons';

/**
 * WordPress Dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { SyncedEntityPlaceholder } from '@prc/components';

/**
 * Internal Dependencies
 */
import PlaceholderSearch from './placeholder-search';
import CreateNewQuizModal from './create-new-quiz-modal';
import { POST_TYPE_LABEL } from './constants';

const PlaceholderIcon = () => (
	<div style={{ marginRight: '4px' }}>
		<Icon icon="block-question" library="light" size={1.5} />
	</div>
);

export default function Placeholder({
	setAttributes,
	disableCreation = false,
	isNew,
	isResolving,
}) {
	return (
		<SyncedEntityPlaceholder
			setAttributes={setAttributes}
			isNew={isNew}
			isResolving={isResolving}
			disableCreation={disableCreation}
			label={__('Synced Quiz', 'prc-quiz-synced-quiz')}
			instructions={__(
				'Search for an existing quiz or create a new one.',
				'prc-quiz-synced-quiz'
			)}
			icon={() => <PlaceholderIcon />}
			loadingLabel={sprintf(
				/* translators: %s: post type label (Quiz) */
				__('Loading %s…', 'prc-quiz-synced-quiz'),
				POST_TYPE_LABEL
			)}
			createButtonLabel={sprintf(
				/* translators: %s: post type label (Quiz) */
				__('Create New %s', 'prc-quiz-synced-quiz'),
				POST_TYPE_LABEL
			)}
			renderSearch={() => (
				<PlaceholderSearch setAttributes={setAttributes} />
			)}
			renderCreateModal={(modalProps) => (
				<CreateNewQuizModal {...modalProps} hideTrigger />
			)}
		/>
	);
}
