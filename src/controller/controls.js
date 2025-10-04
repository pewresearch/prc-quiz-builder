/**
 * External Dependencies
 */
import { addToNexusToolbar } from '@prc/nexus';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import {
	InspectorControls,
	InspectorAdvancedControls,
} from '@wordpress/block-editor';
import {
	BaseControl,
	PanelBody,
	ToggleControl,
	SelectControl,
	TextControl,
	__experimentalNumberControl as NumberControl,
	Button,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal Dependencies
 */
// eslint-disable-next-line import/no-relative-packages
import { JSONSortableList } from '@prc/quiz-components';
import { aiGenerateKnowledgeQuiz } from '../utils/ai-generators';
import icon from './icon';

function Controls({ attributes, setAttributes, clientId }) {
	const {
		groupsEnabled,
		demoBreakLabels,
		threshold,
		displayType,
		allowSubmissions,
	} = attributes;

	const { postId } = useSelect((select) => ({
		postId: select('core/editor').getCurrentPostId(),
	}));

	const [isPurgingArchetypes, setIsPurgingArchetypes] = useState(false);

	// Register the Nexus toolbar when the component mounts.
	useEffect(() => {
		addToNexusToolbar({
			title: 'Generate Quiz',
			icon,
			toolType: 'request',
			tool: 'generate-knowledge-quiz',
			onRequest: async (
				request,
				instructions,
				tool,
				clientId,
				notices
			) => {
				try {
					const { data, metadata } = await aiGenerateKnowledgeQuiz(
						request,
						instructions
					);
					console.log('...data...', data);
					if (!data) {
						notices.createErrorNotice(
							'No data could be generated for your request.'
						);
						return;
					}
					if (data.length > 1) {
						notices.createSuccessNotice(
							'Quiz generated. Please review results.'
						);
					}

					console.log('data...', clientId, data, metadata);

					// const tableData = data.data;
					// const textData = data.text;

					// const newAttributes = {
					// 	...tableData,
					// 	caption: textData?.before,
					// 	sourceNote: textData?.after,
					// };

					// const currentAttributes = select(blockEditorStore).getBlockAttributes(clientId);

					// const payload = {
					// 	...newAttributes,
					// 	metadata: {
					// 		...currentAttributes.metadata,
					// 		_nexus: [
					// 			...((currentAttributes.metadata && currentAttributes.metadata._nexus) ?? []),
					// 			{
					// 				feature: tool,
					// 				...metadata,
					// 			},
					// 		],
					// 	},
					// };

					// updateBlockAttributes(clientId, payload);
				} catch (error) {
					notices.createErrorNotice(error?.message || String(error));
				}
			},
		});
	}, [clientId]);

	const purgeArchetypes = () => {
		console.log('purgeArchetypes', postId);
		setIsPurgingArchetypes(true);
		apiFetch({
			path: `/prc-api/v3/quiz/purge-archetypes?quizId=${postId}`,
			method: 'POST',
		})
			.then((response) => {
				console.log('response', response);
				setIsPurgingArchetypes(false);
			})
			.catch((error) => {
				console.error('error', error);
				setIsPurgingArchetypes(false);
			});
	};

	return (
		<>
			<InspectorAdvancedControls>
				<BaseControl
					label="Purge Quiz Archetypes"
					help="Purge the quiz archetypes. This will remove all the archetypes for the quiz."
				>
					<Button
						variant="primary"
						isDestructive={true}
						isBusy={isPurgingArchetypes}
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
						label="Display Type"
						help="Select the display type for the quiz. Paged will display the quiz in pages, scrollable will display the quiz as a single page with a scrollable container."
						options={[
							{ label: 'Paged', value: 'paged' },
							{ label: 'Scrollable', value: 'scrollable' },
						]}
						value={displayType}
						onChange={(value) => {
							setAttributes({ displayType: value });
						}}
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
				</PanelBody>
				<PanelBody title={__('Community Groups')} initialOpen={false}>
					<BaseControl
						id="community-groups"
						label={__('Community Groups')}
					>
						<ToggleControl
							label={groupsEnabled ? 'Enabled' : 'Disabled'}
							checked={groupsEnabled}
							onChange={() => {
								setAttributes({
									groupsEnabled: !groupsEnabled,
								});
							}}
						/>
						{true === groupsEnabled && (
							<TextControl
								label="Mailchimp List ID"
								help="Enter a Mailchimp list id that group owners will be subscribed to for future communication about this quiz."
								value={attributes.mailchimpListId}
								onChange={(value) => {
									setAttributes({
										mailchimpListId: value,
									});
								}}
							/>
						)}
					</BaseControl>
				</PanelBody>
				<PanelBody
					title={__('Demographic Breakdown')}
					initialOpen={false}
				>
					<JSONSortableList
						label={__('Demographic Breakdown Labels', 'prc-quiz')}
						help={__(
							'Set the labels/categories for demographic breakdowns. When you add values here you will be prompted per question block to add values to each category. These will appear in the results table block.',
							'prc-quiz'
						)}
						values={
							undefined === demoBreakLabels
								? []
								: JSON.parse(demoBreakLabels)
						}
						labels="Demographic Break"
						onChange={(values) => {
							setAttributes({
								demoBreakLabels: JSON.stringify(values),
							});
						}}
					/>
				</PanelBody>
			</InspectorControls>
		</>
	);
}

export default Controls;
