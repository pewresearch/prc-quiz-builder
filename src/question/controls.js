/* eslint-disable import/no-relative-packages */
/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment, useEffect, useState } from '@wordpress/element';
import {
	InspectorControls,
	InspectorAdvancedControls,
} from '@wordpress/block-editor';
import {
	PanelBody,
	BaseControl,
	ToggleControl,
	TextControl,
} from '@wordpress/components';

/**
 * Internal Dependencies
 */

import { JSONSortableList, ConditionalPanel } from '@prc/quiz-components';

function ThermometerControls({ attributes, setAttributes }) {
	const { thermometerValues } = attributes;
	const initValues =
		undefined === thermometerValues
			? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
			: thermometerValues.split(',');
	const [values, setValues] = useState(initValues);

	useEffect(() => {
		setAttributes({
			thermometerValues: values.join(','),
		});
	}, [values]);

	const onChange = (value, index) => {
		const newValues = [...values];
		newValues[index] = value;
		setValues(newValues);
	};

	return (
		<BaseControl
			id="question-thermo-values"
			label={__(`Thermometer Values`, 'prc-quiz')}
		>
			{values.map((value, index) => (
				<Fragment key={index}>
					<TextControl
						label={`Value for: ${0 === index ? index : index * 10}`}
						value={value}
						onChange={(newValue) => onChange(newValue, index)}
					/>
				</Fragment>
			))}
		</BaseControl>
	);
}

function DemographicBreaksControls({ attributes, setAttributes, labels }) {
	const { demoBreakValues } = attributes;

	// eslint-disable-next-line max-len
	// If there are no demographicBreakdown values then set to an array of empty strings matching the length of the labels array
	const initValues =
		// eslint-disable-next-line no-nested-ternary
		undefined === demoBreakValues
			? labels.map(() => '')
			: JSON.parse(demoBreakValues).length !== labels.length
				? [...JSON.parse(demoBreakValues), '']
				: JSON.parse(demoBreakValues);

	return (
		<JSONSortableList
			label={__('Demographic Break Values', 'prc-quiz')}
			help={__(
				'If there are demographic breaks set in the controller block, the corresponding fields will appear here. You can assign values to each category on a per-question basis.',
				'prc-quiz'
			)}
			values={initValues}
			labels={labels}
			onChange={(values) => {
				setAttributes({ demoBreakValues: JSON.stringify(values) });
			}}
			disableAddingItems
			allowReset
		/>
	);
}

export default function Controls({
	attributes,
	setAttributes,
	clientId,
	context,
}) {
	const {
		internalId,
		type,
		randomizeAnswers,
		conditionalDisplay,
		conditionalAnswerUuid,
		imageId,
		imageOnTop,
	} = attributes;

	const quizType = context['prc-quiz/type'];
	const demoBreakLabels = context['prc-quiz/demo-break-labels'];

	const displayAdvancedDemoBreaks =
		'quiz' === quizType &&
		undefined !== demoBreakLabels &&
		'thermometer' !== type;

	return (
		<Fragment>
			{/* <ConditionalBlockControls attributes={attributes} /> */}
			<InspectorControls>
				<PanelBody title={__('Question Settings')}>
					<ToggleControl
						label={
							imageOnTop
								? 'Image Above Question'
								: 'Image Below Question'
						}
						help={__(
							'When enabled, the image will appear above the question text.'
						)}
						checked={imageOnTop}
						onChange={() => {
							setAttributes({ imageOnTop: !imageOnTop });
						}}
					/>
					{'thermometer' !== type && (
						<ToggleControl
							label={
								randomizeAnswers
									? 'Answer Randomization Enabled'
									: 'Answer Randomization Disabled'
							}
							help={__(
								'When enabled answers will appear randomized on the frontend.'
							)}
							checked={randomizeAnswers}
							onChange={() => {
								setAttributes({
									randomizeAnswers: !randomizeAnswers,
								});
							}}
						/>
					)}
					{'thermometer' === type && (
						<ThermometerControls
							attributes={attributes}
							setAttributes={setAttributes}
						/>
					)}
				</PanelBody>
				<ConditionalPanel
					{...{ attributes, setAttributes, blockType: 'question' }}
				/>
			</InspectorControls>
			<InspectorAdvancedControls>
				{displayAdvancedDemoBreaks && (
					<DemographicBreaksControls
						attributes={attributes}
						setAttributes={setAttributes}
						labels={
							undefined === demoBreakLabels
								? []
								: JSON.parse(demoBreakLabels)
						}
					/>
				)}

				<BaseControl
					id="question-research-id"
					label={__('Research ID')}
					help={__(
						'This field is used to identify this question in the scoring process. If left empty, the auto-generated UUID for this question will be used. However, for typology quizzes, the research team often has a specific internal ID used for scoring. Use that ID here.'
					)}
				>
					<TextControl
						value={internalId}
						onChange={(value) =>
							setAttributes({ internalId: value })
						}
						placeholder={__('Enter research id e.g. "govsize3"')}
					/>
				</BaseControl>
			</InspectorAdvancedControls>
		</Fragment>
	);
}
