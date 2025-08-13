/* eslint-disable import/no-relative-packages */
/**
 * External Dependencies
 */

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment, useEffect, useCallback } from '@wordpress/element';
import { InspectorControls, BlockControls } from '@wordpress/block-editor';
import {
	Button,
	PanelBody,
	BaseControl,
	__experimentalNumberControl as NumberControl,
	TextareaControl,
} from '@wordpress/components';

/**
 * Internal Dependencies
 */
import { UUIDCopyToClipboard, ConditionalPanel } from '@prc/quiz-components';

export default function Controls({
	attributes,
	clientId,
	context,
	setAttributes,
	handleToggleCorrect,
}) {
	const { uuid, points, correct, resultsLabel, answer } = attributes;

	const quizType = context['prc-quiz/type'];

	// Memoize onChange handlers to prevent unnecessary re-renders
	const handleAnswerChange = useCallback(
		(value) => {
			setAttributes({ answer: value });
		},
		[setAttributes]
	);

	const handlePointsChange = useCallback(
		(p) => {
			setAttributes({ points: Number(p) });
		},
		[setAttributes]
	);

	const handleResultsLabelChange = useCallback(
		(r) => {
			setAttributes({ resultsLabel: r });
		},
		[setAttributes]
	);

	return (
		<InspectorControls>
			<PanelBody title={__('Answer Settings')}>
				<TextareaControl
					label={__('Answer Text', 'prc-quiz')}
					value={answer}
					onChange={handleAnswerChange}
					placeholder={__('Enter answer text here...')}
				/>
				{'freeform' !== quizType && (
					<BaseControl
						help={__(
							'Marking an answer as correct will automatically assign 1 point to the answer. Marking an answer as incorrect will automatically assign 0 points to the answer. You can modify these after initially marking the answer as correct or incorrect.'
						)}
					>
						<Button
							variant="secondary"
							onClick={handleToggleCorrect}
						>
							{correct
								? __('Mark as Incorrect', 'prc-quiz')
								: __('Mark as Correct', 'prc-quiz')}
						</Button>
					</BaseControl>
				)}
				<NumberControl
					label="Points"
					help={`How many points this answer is worth?`}
					value={points}
					onChange={handlePointsChange}
					min={'freeform' === quizType ? -Infinity : 0}
				/>
				<TextareaControl
					label="Results Label"
					help={__(
						`Use this as alternative text for the answer on the results page. You can elaborate on the message here. For example, the Results Table block will display this text for each answer instead of the answer text itself.`
					)}
					value={resultsLabel}
					onChange={handleResultsLabelChange}
				/>
			</PanelBody>
			<ConditionalPanel
				attributes={attributes}
				setAttributes={setAttributes}
				blockType="answer"
			>
				<UUIDCopyToClipboard uuid={uuid} label={__('Answer ID')} />
			</ConditionalPanel>
		</InspectorControls>
	);
}
