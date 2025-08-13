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
import { useSelect, useDispatch } from '@wordpress/data';

// We're going to wrap any block that is inside the results page block with some inspector controls for setting when the block should display at what score level either at x points or below x points or above x points or between x and y points.
export default function registerResultsPointsDisplayFilter() {
	/**
	 * Add support for the results display logic attributes to blocks.
	 *
	 * @param {Object} settings Settings for the block.
	 *
	 * @return {Object} settings Modified settings.
	 */
	addFilter(
		'blocks.registerBlockType',
		`results-points-display-controls-supports`,
		(settings) => {
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
			};
			return settings;
		}
	);

	/**
	 * Add support for left and right alignment, and add transform support from prc-block/callout to group.
	 *
	 * @param {Object} settings Settings for the block.
	 *
	 * @return {Object} settings Modified settings.
	 */
	addFilter(
		'editor.BlockEdit',
		`results-points-display-controls`,
		createHigherOrderComponent(
			(BlockEdit) =>
				function ResultsPointsDisplayControls(props) {
					const { name, attributes, setAttributes, clientId } = props;
					// Check if this block is inside the results block, do this by navigating up the tree of this clientId and check if the parent is a results block.
					// If it is, we can add the points display controls.
					const isInsideResults = useSelect(
						(select) => {
							const { getBlockParentsByBlockName } =
								select(blockEditorStore);
							const resultsBlocks = getBlockParentsByBlockName(
								clientId,
								'prc-quiz/results'
							);
							// If there is a parent then return true, otherwise return false.
							return resultsBlocks.length > 0;
						},
						[clientId]
					);
					if (!isInsideResults) {
						return <BlockEdit {...props} />;
					}
					// Get current display logic settings from attributes or set defaults
					const {
						resultsDisplayMode = 'always',
						resultsExactPoints = 50,
						resultsExactPointsString = '',
						resultsMinPoints = 0,
						resultsMaxPoints = 100,
						resultsThresholdPoints = 50,
						resultsThresholdDirection = 'above',
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
					];

					const thresholdDirectionOptions = [
						{ label: 'Above', value: 'above' },
						{ label: 'Below', value: 'below' },
					];

					return (
						<>
							<InspectorControls>
								<PanelBody
									title="Quiz Results Display Logic"
									initialOpen={true}
								>
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
											__next40pxDefaultSize
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
													resultsExactPointsString:
														value,
												})
											}
										/>
									)}

									{resultsDisplayMode === 'range' && (
										<>
											<RangeControl
												__nextHasNoMarginBottom
												__next40pxDefaultSize
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
												__next40pxDefaultSize
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
												value={
													resultsThresholdDirection
												}
												options={
													thresholdDirectionOptions
												}
												onChange={(value) =>
													setAttributes({
														resultsThresholdDirection:
															value,
													})
												}
											/>
											<RangeControl
												__nextHasNoMarginBottom
												__next40pxDefaultSize
												label="Threshold Points"
												help={`Block will display when score is ${resultsThresholdDirection} this value.`}
												value={resultsThresholdPoints}
												onChange={(value) =>
													setAttributes({
														resultsThresholdPoints:
															value,
													})
												}
												min={0}
												max={100}
												step={1}
											/>
										</>
									)}
								</PanelBody>
							</InspectorControls>
							<BlockEdit {...props} />
						</>
					);
				},
			'withResultsPointsDisplayControls'
		),
		100
	);
}
