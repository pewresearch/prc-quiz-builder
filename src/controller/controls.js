/**
 * External Dependencies
 */

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import {
	BlockControls,
	InspectorControls,
	InspectorAdvancedControls,
} from '@wordpress/block-editor';
import {
	BaseControl,
	PanelBody,
	ToggleControl,
	SelectControl,
	TextControl,
	ToolbarGroup,
	ToolbarButton,
	__experimentalNumberControl as NumberControl,
	Button,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { table, chartBar, percent } from '@wordpress/icons';

/**
 * Internal Dependencies
 */
// eslint-disable-next-line import/no-relative-packages
import QuizQuickEditModal from './quick-edit-modal';
import QuizResultsDataModal from './results-data-modal';
import QuizHistogramDataModal from './histogram-data-modal';
import ScoreBucketsControl from './score-buckets-control';
import { resolveGroupCapability } from './group-capability';
import CommunityGroupsPanel from './community-groups-panel';
import PageTransitionControls from './page-transition-controls';

function Controls({
	attributes,
	setAttributes,
	clientId,
	groupResultsClientId,
	removeGroupResults,
}) {
	const {
		groupsEnabled,
		threshold,
		displayType,
		allowSubmissions,
		liveFeedback,
		correctOutcomeLabel,
		incorrectOutcomeLabel,
		unsureOutcomeLabel,
		scoreBuckets,
		type: quizType,
	} = attributes;

	const { postId } = useSelect((select) => ({
		postId: select('core/editor').getCurrentPostId(),
	}));

	const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
	const [isResultsDataOpen, setIsResultsDataOpen] = useState(false);
	const [isHistogramDataOpen, setIsHistogramDataOpen] = useState(false);
	const [isPurgingArchetypes, setIsPurgingArchetypes] = useState(false);
	const groupCapability = resolveGroupCapability({
		quizType,
		scoreBuckets,
	});

	useEffect(() => {
		if (!groupCapability.allowed && groupsEnabled) {
			setAttributes({ groupsEnabled: false });
		}
	}, [groupCapability.allowed, groupsEnabled, setAttributes]);

	const purgeArchetypes = () => {
		setIsPurgingArchetypes(true);
		apiFetch({
			path: `/prc-api/v3/quiz/purge-archetypes?quizId=${postId}`,
			method: 'POST',
		})
			.then(() => {
				setIsPurgingArchetypes(false);
			})
			.catch(() => {
				setIsPurgingArchetypes(false);
			});
	};

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						icon={table}
						label={__('Quick Edit Content', 'prc-quiz')}
						onClick={() => setIsQuickEditOpen(true)}
					/>
					<ToolbarButton
						icon={chartBar}
						label={__('Edit Results Table Data', 'prc-quiz')}
						onClick={() => setIsResultsDataOpen(true)}
					/>
					<ToolbarButton
						icon={percent}
						label={__('Edit Histogram Data', 'prc-quiz')}
						onClick={() => setIsHistogramDataOpen(true)}
					/>
				</ToolbarGroup>
			</BlockControls>
			{isQuickEditOpen && (
				<QuizQuickEditModal
					clientId={clientId}
					onClose={() => setIsQuickEditOpen(false)}
				/>
			)}
			{isResultsDataOpen && (
				<QuizResultsDataModal
					clientId={clientId}
					onClose={() => setIsResultsDataOpen(false)}
				/>
			)}
			{isHistogramDataOpen && (
				<QuizHistogramDataModal
					clientId={clientId}
					onClose={() => setIsHistogramDataOpen(false)}
				/>
			)}
			<InspectorAdvancedControls>
				<BaseControl
					id="prc-quiz-purge-archetypes"
					label="Purge Quiz Archetypes"
					help="Purge the quiz archetypes. This will remove all the archetypes for the quiz."
				>
					<Button
						variant="primary"
						isDestructive={true}
						isBusy={isPurgingArchetypes}
						__next40pxDefaultSize
						style={{ width: '100%', justifyContent: 'center' }}
						text={
							isPurgingArchetypes
								? 'Purging...'
								: 'Purge Archetypes'
						}
						onClick={() => {
							purgeArchetypes();
						}}
					/>
				</BaseControl>
			</InspectorAdvancedControls>
			<InspectorControls>
				<PanelBody title={__('Quiz Settings')}>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label="Display Type"
						help="Select the display type for the quiz. Paged shows one page at a time. Scrollable shows all questions in a single scrollable view. Fluid uses paged on desktop (≥782px) and scrollable on smaller screens, updating when the viewport is resized."
						options={[
							{ label: 'Paged', value: 'paged' },
							{ label: 'Scrollable', value: 'scrollable' },
							{ label: 'Fluid', value: 'fluid' },
						]}
						value={displayType}
						onChange={(value) => {
							setAttributes({ displayType: value });
						}}
					/>
					<PageTransitionControls
						attributes={attributes}
						setAttributes={setAttributes}
					/>
					<ToggleControl
						label="Allow Submissions"
						help="Allow users to submit the quiz. If disabled, users will not be able to submit the quiz and will only be able to view the results. This means the results will not be shareable with the public."
						checked={allowSubmissions}
						onChange={() => {
							setAttributes({
								allowSubmissions: !allowSubmissions,
							});
						}}
					/>
					<NumberControl
						label="Answer Threshold"
						help="Number of selected answers needed to complete the quiz."
						value={threshold}
						isShiftStepEnabled={true}
						isDragEnabled={true}
						onChange={(t) => {
							setAttributes({
								threshold: Math.round(parseFloat(t) || 0),
							});
						}}
						min={1}
						max={15}
						type="number"
					/>
					{'quiz' === quizType && (
						<>
							<ToggleControl
								label={__('Live Feedback', 'prc-quiz')}
								help={__(
									'Immediately show whether an answer is correct or incorrect. Once selected, the answer cannot be changed.',
									'prc-quiz'
								)}
								checked={!!liveFeedback}
								onChange={() => {
									setAttributes({
										liveFeedback: !liveFeedback,
									});
								}}
							/>
							<TextControl
								__next40pxDefaultSize
								label={__('Correct outcome label', 'prc-quiz')}
								help={__(
									'Default text for the Correct / Incorrect bit when the answer is correct. Individual bits can override this.',
									'prc-quiz'
								)}
								value={correctOutcomeLabel ?? 'Correct'}
								onChange={(value) => {
									setAttributes({
										correctOutcomeLabel: value,
									});
								}}
							/>
							<TextControl
								__next40pxDefaultSize
								label={__(
									'Incorrect outcome label',
									'prc-quiz'
								)}
								help={__(
									'Default text for the Correct / Incorrect bit when the answer is incorrect. Individual bits can override this.',
									'prc-quiz'
								)}
								value={incorrectOutcomeLabel ?? 'Incorrect'}
								onChange={(value) => {
									setAttributes({
										incorrectOutcomeLabel: value,
									});
								}}
							/>
							<TextControl
								__next40pxDefaultSize
								label={__('Not sure outcome label', 'prc-quiz')}
								help={__(
									'Default text for the Correct / Incorrect bit when the answer is Not sure. Individual bits can override this.',
									'prc-quiz'
								)}
								value={unsureOutcomeLabel ?? 'Not sure'}
								onChange={(value) => {
									setAttributes({
										unsureOutcomeLabel: value,
									});
								}}
							/>
						</>
					)}
				</PanelBody>
				<CommunityGroupsPanel
					groupsEnabled={groupsEnabled}
					groupCapability={groupCapability}
					setAttributes={setAttributes}
					groupResultsClientId={groupResultsClientId}
					removeGroupResults={removeGroupResults}
				/>
				<PanelBody title={__('Score Buckets')} initialOpen={false}>
					<ScoreBucketsControl
						value={scoreBuckets}
						onChange={(next) => {
							setAttributes({ scoreBuckets: next });
						}}
					/>
				</PanelBody>
			</InspectorControls>
		</>
	);
}

export default Controls;
