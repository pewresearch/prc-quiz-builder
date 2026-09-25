/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	BaseControl,
	PanelBody,
	ToggleControl,
	Button,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis -- ConfirmDialog is the standard destructive confirm pattern in WP packages.
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { store as editPostStore } from '@wordpress/edit-post';

export default function CommunityGroupsPanel({
	groupsEnabled,
	groupCapability,
	setAttributes,
	groupResultsClientId,
	removeGroupResults,
}) {
	const [pendingRemovalClientId, setPendingRemovalClientId] = useState(null);
	const { openGeneralSidebar } = useDispatch(editPostStore);

	return (
		<>
			<PanelBody title={__('Community Groups')} initialOpen={false}>
				<BaseControl
					id="community-groups"
					label={__('Community Groups')}
				>
					<ToggleControl
						label={groupsEnabled ? 'Enabled' : 'Disabled'}
						help={__(
							'Freeform and typology quizzes can use community groups. Knowledge quizzes need score buckets first.',
							'prc-quiz'
						)}
						checked={groupsEnabled}
						disabled={!groupCapability.allowed}
						onChange={() => {
							const nextEnabled = !groupsEnabled;
							setAttributes({
								groupsEnabled: nextEnabled,
							});
							if (!nextEnabled && groupResultsClientId) {
								setPendingRemovalClientId(groupResultsClientId);
							}
						}}
					/>
					{true === groupsEnabled && (
						<>
							<p className="components-base-control__help">
								{__(
									'Build a Mandrill audience of people who created groups for this quiz, then open a transactional email draft, from the Quiz Analytics sidebar.',
									'prc-quiz'
								)}
							</p>
							<Button
								variant="secondary"
								__next40pxDefaultSize
								style={{
									width: '100%',
									justifyContent: 'center',
								}}
								onClick={() =>
									openGeneralSidebar(
										'prc-quiz-builder-analytics-panel/prc-quiz-builder-analytics-panel'
									)
								}
							>
								{__(
									'Manage group-creator audience',
									'prc-quiz'
								)}
							</Button>
						</>
					)}
				</BaseControl>
			</PanelBody>
			<ConfirmDialog
				isOpen={Boolean(pendingRemovalClientId)}
				onConfirm={() => {
					removeGroupResults();
					setPendingRemovalClientId(null);
				}}
				onCancel={() => {
					setPendingRemovalClientId(null);
				}}
				confirmButtonText={__('Delete Group Results', 'prc-quiz')}
				cancelButtonText={__('Leave as is', 'prc-quiz')}
			>
				{__(
					'Groups are off. Delete the Group Results block, or leave it in the quiz?',
					'prc-quiz'
				)}
			</ConfirmDialog>
		</>
	);
}
