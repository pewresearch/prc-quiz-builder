/**
 * External Dependencies
 */

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import {
	InspectorControls,
	InspectorAdvancedControls,
} from '@wordpress/block-editor';
import {
	BaseControl,
	CardDivider,
	PanelBody,
	ToggleControl,
	TextControl,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';

/**
 * Internal Dependencies
 */
// eslint-disable-next-line import/no-relative-packages
import { JSONSortableList } from '@prc/quiz-components';

function Controls({ attributes, setAttributes }) {
	const { groups, type, gaTracking, demoBreakLabels, threshold } = attributes;

	return (
		<Fragment>
			<InspectorControls>
				<PanelBody title={__('Quiz Settings')}>
					<NumberControl
						label="Answer Threshold"
						help="The number of correct answers required to pass the quiz."
						value={threshold}
						onChange={(t) => {
							setAttributes({ threshold: t });
						}}
						min={1}
						max={15}
					/>
					{'typology' === type && (
						<BaseControl
							id="community-groups"
							label={__('Community Groups')}
						>
							<ToggleControl
								label={groups ? 'Enabled' : 'Disabled'}
								checked={groups}
								onChange={() => {
									setAttributes({ groups: !groups });
								}}
							/>
							{true === groups && (
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
					)}
				</PanelBody>
			</InspectorControls>
			<InspectorAdvancedControls>
				<BaseControl
					id="prc-quiz-ga-tracking"
					label={__('Google Analytics Tracking', 'prc-quiz')}
					help={__(
						'Enable Google Analytics tracking for this quiz. This will track the number of times a quiz is started and number of pages progressed. This will not track any user data. We always track quiz completions in the PRC API.',
						'prc-quiz'
					)}
				>
					<ToggleControl
						label={
							gaTracking
								? 'Tracking Enabled'
								: 'Tracking Disabled'
						}
						checked={gaTracking}
						onChange={() => {
							setAttributes({ gaTracking: !gaTracking });
						}}
					/>
				</BaseControl>
				{'quiz' === type && (
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
				)}
				<CardDivider />
				<CardDivider />
			</InspectorAdvancedControls>
		</Fragment>
	);
}

export default Controls;
