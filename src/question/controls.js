/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	InspectorAdvancedControls,
} from '@wordpress/block-editor';
import {
	PanelBody,
	BaseControl,
	ToggleControl,
	TextControl,
	TextareaControl,
} from '@wordpress/components';

/**
 * Internal Dependencies
 */

import { ConditionalPanel, UUIDCopyToClipboard } from '@prc/quiz-components';

export default function Controls({ attributes, setAttributes }) {
	const { uuid, internalId, type, randomizeAnswers, question } = attributes;

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Question Settings')}>
					<TextareaControl
						label={__('Question Text', 'prc-quiz')}
						value={question}
						placeholder={__('Enter question text here…')}
						onChange={(value) => setAttributes({ question: value })}
					/>
					{'thermometer' !== type && (
						<ToggleControl
							label={__('Randomize Answer Order', 'prc-quiz')}
							help={__(
								'When enabled answer order will be randomized on the frontend. When disabled, answers will appear in the order they are defined in the block editor.'
							)}
							checked={randomizeAnswers}
							onChange={() => {
								setAttributes({
									randomizeAnswers: !randomizeAnswers,
								});
							}}
						/>
					)}
				</PanelBody>
				<ConditionalPanel
					attributes={attributes}
					setAttributes={setAttributes}
					blockType="question"
				>
					<UUIDCopyToClipboard
						uuid={uuid}
						label={__('Question ID')}
					/>
				</ConditionalPanel>
			</InspectorControls>
			<InspectorAdvancedControls>
				<BaseControl
					id="question-internal-id"
					label={__('Internal ID')}
					help={__(
						'This field identifies the question in the scoring process. If left empty, an auto-generated ID will be used. For "typology" or "freeform" quizzes, research teams often have an internal ID for scoring in their Excel file. Use that ID here for consistency.'
					)}
				>
					<TextControl
						__next40pxDefaultSize
						value={internalId}
						onChange={(value) =>
							setAttributes({ internalId: value })
						}
						placeholder={__(
							'Enter internal research ID e.g. "govsize3"'
						)}
					/>
				</BaseControl>
			</InspectorAdvancedControls>
		</>
	);
}
