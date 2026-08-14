/**
 * WordPress Dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import {
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	RangeControl,
	PanelBody,
	SelectControl,
	TextControl,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

const EMPTY_SCORE_BUCKETS = '';

function parseScoreBucketOptions(scoreBuckets) {
	const options = [{ label: 'Select a score bucket…', value: '' }];
	if (!scoreBuckets) {
		return options;
	}
	try {
		const buckets = JSON.parse(scoreBuckets);
		if (!Array.isArray(buckets)) {
			return options;
		}
		return [
			...options,
			...buckets.map((bucket) => ({
				label: `${bucket.label} (${bucket.min}–${bucket.max})`,
				value: bucket.id,
			})),
		];
	} catch {
		return options;
	}
}

function ResultsDisplayLogicPanel({
	attributes,
	setAttributes,
	scoreBucketOptions,
}) {
	const {
		resultsDisplayMode = 'always',
		resultsExactPoints = 50,
		resultsExactPointsString = '',
		resultsMinPoints = 0,
		resultsMaxPoints = 100,
		resultsThresholdPoints = 50,
		resultsThresholdDirection = 'above',
		resultsBucketId = '',
	} = attributes;

	const displayModeOptions = [
		{ label: 'Always Display', value: 'always' },
		{ label: 'Exact Points', value: 'exact' },
		{
			label: 'Exact Points (String)',
			value: 'exactString',
		},
		{ label: 'Points Range', value: 'range' },
		{ label: 'Above/Below Threshold', value: 'threshold' },
		{ label: 'Score Bucket', value: 'bucket' },
	];

	const thresholdDirectionOptions = [
		{ label: 'Above', value: 'above' },
		{ label: 'Below', value: 'below' },
	];

	return (
		<InspectorControls>
			<PanelBody title="Quiz Results Display Logic" initialOpen={true}>
				<SelectControl
					__nextHasNoMarginBottom
					label="Display Mode"
					help="Choose when this block should be displayed."
					value={resultsDisplayMode}
					options={displayModeOptions}
					onChange={(value) =>
						setAttributes({
							resultsDisplayMode: value,
						})
					}
				/>

				{resultsDisplayMode === 'exact' && (
					<RangeControl
						__nextHasNoMarginBottom
						label="Exact Points"
						help="Block will display only when the quiz score equals this exact value."
						value={resultsExactPoints}
						onChange={(value) =>
							setAttributes({
								resultsExactPoints: value,
							})
						}
						min={0}
						max={100}
						step={1}
					/>
				)}

				{resultsDisplayMode === 'exactString' && (
					<TextControl
						__nextHasNoMarginBottom
						label="Exact Points (String)"
						help="Block will display only when the quiz score equals this exact value."
						value={resultsExactPointsString}
						onChange={(value) =>
							setAttributes({
								resultsExactPointsString: value,
							})
						}
					/>
				)}

				{resultsDisplayMode === 'range' && (
					<>
						<RangeControl
							__nextHasNoMarginBottom
							label="Minimum Points"
							help="The minimum score required to display this block."
							value={resultsMinPoints}
							onChange={(value) =>
								setAttributes({
									resultsMinPoints: value,
								})
							}
							min={0}
							max={resultsMaxPoints - 1}
							step={1}
						/>
						<RangeControl
							__nextHasNoMarginBottom
							label="Maximum Points"
							help="The maximum score to display this block."
							value={resultsMaxPoints}
							onChange={(value) =>
								setAttributes({
									resultsMaxPoints: value,
								})
							}
							min={resultsMinPoints + 1}
							max={100}
							step={1}
						/>
					</>
				)}

				{resultsDisplayMode === 'threshold' && (
					<>
						<SelectControl
							__nextHasNoMarginBottom
							label="Display When Score Is"
							help="Choose whether to display above or below the threshold."
							value={resultsThresholdDirection}
							options={thresholdDirectionOptions}
							onChange={(value) =>
								setAttributes({
									resultsThresholdDirection: value,
								})
							}
						/>
						<RangeControl
							__nextHasNoMarginBottom
							label="Threshold Points"
							help={`Block will display when score is ${resultsThresholdDirection} this value.`}
							value={resultsThresholdPoints}
							onChange={(value) =>
								setAttributes({
									resultsThresholdPoints: value,
								})
							}
							min={0}
							max={100}
							step={1}
						/>
					</>
				)}

				{resultsDisplayMode === 'bucket' && (
					<SelectControl
						__nextHasNoMarginBottom
						label="Score Bucket"
						help="Block displays when the quiz score falls in this named bucket. Define buckets on the Quiz Controller."
						value={resultsBucketId}
						options={scoreBucketOptions}
						onChange={(value) =>
							setAttributes({
								resultsBucketId: value,
							})
						}
					/>
				)}
			</PanelBody>
		</InspectorControls>
	);
}

function withResultsPointsDisplayControls(BlockEdit) {
	return function ResultsPointsDisplayControls(props) {
		const { attributes, setAttributes, clientId } = props;
		const { isInsideResults, scoreBuckets } = useSelect(
			(select) => {
				const { getBlockParentsByBlockName, getBlock } =
					select(blockEditorStore);
				const resultsBlocks = getBlockParentsByBlockName(
					clientId,
					'prc-quiz/results'
				);
				if (resultsBlocks.length === 0) {
					return {
						isInsideResults: false,
						scoreBuckets: EMPTY_SCORE_BUCKETS,
					};
				}
				const [controllerId] = getBlockParentsByBlockName(
					clientId,
					'prc-quiz/controller'
				);
				const controller = controllerId ? getBlock(controllerId) : null;
				return {
					isInsideResults: true,
					scoreBuckets: controller?.attributes?.scoreBuckets || '[]',
				};
			},
			[clientId]
		);
		const scoreBucketOptions = useMemo(
			() => parseScoreBucketOptions(scoreBuckets),
			[scoreBuckets]
		);
		if (!isInsideResults) {
			return <BlockEdit {...props} />;
		}
		return (
			<>
				<ResultsDisplayLogicPanel
					attributes={attributes}
					setAttributes={setAttributes}
					scoreBucketOptions={scoreBucketOptions}
				/>
				<BlockEdit {...props} />
			</>
		);
	};
}

function addResultsDisplayAttributes(settings) {
	settings.attributes = {
		...settings.attributes,
		resultsDisplayMode: {
			type: 'string',
			default: 'always',
		},
		resultsExactPoints: {
			type: 'number',
			default: 50,
		},
		resultsExactPointsString: {
			type: 'string',
			default: '',
		},
		resultsMinPoints: {
			type: 'number',
			default: 0,
		},
		resultsMaxPoints: {
			type: 'number',
			default: 100,
		},
		resultsThresholdPoints: {
			type: 'number',
			default: 50,
		},
		resultsThresholdDirection: {
			type: 'string',
			default: 'above',
		},
		resultsBucketId: {
			type: 'string',
			default: '',
		},
	};
	return settings;
}

export default function registerResultsPointsDisplayFilter() {
	addFilter(
		'blocks.registerBlockType',
		'results-points-display-controls-supports',
		addResultsDisplayAttributes
	);

	addFilter(
		'editor.BlockEdit',
		'results-points-display-controls',
		createHigherOrderComponent(
			withResultsPointsDisplayControls,
			'withResultsPointsDisplayControls'
		),
		100
	);
}
