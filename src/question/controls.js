/* eslint-disable import/no-relative-packages */
/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useMemo } from '@wordpress/element';
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

import {
	JSONSortableList,
	ConditionalPanel,
	UUIDCopyToClipboard,
} from '@prc/quiz-components';

function parseDemoBreakValues(demoBreakValues) {
	if (undefined === demoBreakValues) {
		return [];
	}
	try {
		const parsed = JSON.parse(demoBreakValues);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function DemographicBreaksControls({ attributes, setAttributes, labels }) {
	const { demoBreakValues } = attributes;

	useEffect(() => {
		const current = parseDemoBreakValues(demoBreakValues);
		if (current.length === labels.length) {
			return;
		}
		const next = labels.map((_, i) =>
			typeof current[i] !== 'undefined' ? current[i] : ''
		);
		setAttributes({ demoBreakValues: JSON.stringify(next) });
	}, [demoBreakValues, labels, setAttributes]);

	const values = useMemo(() => {
		const current = parseDemoBreakValues(demoBreakValues);
		if (current.length === labels.length) {
			return current;
		}
		return labels.map((_, i) =>
			typeof current[i] !== 'undefined' ? current[i] : ''
		);
	}, [demoBreakValues, labels]);

	return (
		<JSONSortableList
			label={__('Demographic Break Values', 'prc-quiz')}
			help={__(
				'If there are demographic breaks set in the controller block, the corresponding fields will appear here. You can assign values to each category on a per-question basis.',
				'prc-quiz'
			)}
			values={values}
			labels={labels}
			onChange={(nextValues) => {
				setAttributes({ demoBreakValues: JSON.stringify(nextValues) });
			}}
			disableAddingItems
			allowReset
		/>
	);
}

export default function Controls({ attributes, setAttributes, context }) {
	const { uuid, internalId, type, randomizeAnswers, question } = attributes;

	const quizType = context['prc-quiz/type'];
	const demoBreakLabels = context['prc-quiz/demo-break-labels'];
	const parsedDemoBreakLabels = useMemo(() => {
		if (undefined === demoBreakLabels) {
			return [];
		}
		try {
			const parsed = JSON.parse(demoBreakLabels);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}, [demoBreakLabels]);

	const displayAdvancedDemoBreaks =
		'quiz' === quizType &&
		undefined !== demoBreakLabels &&
		'thermometer' !== type;

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
				{displayAdvancedDemoBreaks && (
					<DemographicBreaksControls
						attributes={attributes}
						setAttributes={setAttributes}
						labels={parsedDemoBreakLabels}
					/>
				)}

				<BaseControl
					id="question-internal-id"
					label={__('Internal ID')}
					help={__(
						'This field identifies the question in the scoring process. If left empty, an auto-generated ID will be used. For "typology" or "freeform" quizzes, research teams often have an internal ID for scoring in their Excel file. Use that ID here for consistency.'
					)}
				>
					<TextControl
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
