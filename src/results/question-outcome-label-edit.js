/**
 * Inline editor for the question-outcome-label bit.
 *
 * Optional Correct / Incorrect / Not sure overrides. Empty fields inherit
 * quiz-wide defaults from the Quiz Controller.
 */

import { __ } from '@wordpress/i18n';
import { useState, useCallback } from '@wordpress/element';
import { Button, Flex, FlexItem, TextControl } from '@wordpress/components';

function escapeHtml(input) {
	return String(input)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function buildPreviewHTML(correctLabel, incorrectLabel, unsureLabel) {
	const preview =
		correctLabel.trim() ||
		incorrectLabel.trim() ||
		unsureLabel.trim() ||
		__('Correct', 'prc-quiz-builder');
	return escapeHtml(preview);
}

export default function QuestionOutcomeLabelEdit({
	attributes,
	onCommit,
	onCancel,
}) {
	const [correctLabel, setCorrectLabel] = useState(
		attributes.correctLabel ?? ''
	);
	const [incorrectLabel, setIncorrectLabel] = useState(
		attributes.incorrectLabel ?? ''
	);
	const [unsureLabel, setUnsureLabel] = useState(
		attributes.unsureLabel ?? ''
	);

	const handleCommit = useCallback(() => {
		onCommit({
			attributes: {
				correctLabel: correctLabel.trim(),
				incorrectLabel: incorrectLabel.trim(),
				unsureLabel: unsureLabel.trim(),
			},
			innerHTML: buildPreviewHTML(
				correctLabel,
				incorrectLabel,
				unsureLabel
			),
		});
	}, [correctLabel, incorrectLabel, unsureLabel, onCommit]);

	return (
		<div
			className="prc-quiz-question-outcome-label__editor"
			style={{ minWidth: 280, padding: 16, maxWidth: 360 }}
		>
			<TextControl
				label={__('Correct label (optional)', 'prc-quiz-builder')}
				value={correctLabel}
				onChange={setCorrectLabel}
				placeholder={__('Use quiz default', 'prc-quiz-builder')}
				help={__(
					'Leave blank to use the Quiz Controller Correct outcome label.',
					'prc-quiz-builder'
				)}
				__nextHasNoMarginBottom
			/>
			<TextControl
				label={__('Incorrect label (optional)', 'prc-quiz-builder')}
				value={incorrectLabel}
				onChange={setIncorrectLabel}
				placeholder={__('Use quiz default', 'prc-quiz-builder')}
				help={__(
					'Leave blank to use the Quiz Controller Incorrect outcome label.',
					'prc-quiz-builder'
				)}
				__nextHasNoMarginBottom
			/>
			<TextControl
				label={__('Not sure label (optional)', 'prc-quiz-builder')}
				value={unsureLabel}
				onChange={setUnsureLabel}
				placeholder={__('Use quiz default', 'prc-quiz-builder')}
				help={__(
					'Leave blank to use the Quiz Controller Not sure outcome label.',
					'prc-quiz-builder'
				)}
				__nextHasNoMarginBottom
			/>
			<Flex justify="flex-end" gap={2} style={{ marginTop: 12 }}>
				<FlexItem>
					<Button variant="tertiary" onClick={onCancel}>
						{__('Cancel', 'prc-quiz-builder')}
					</Button>
				</FlexItem>
				<FlexItem>
					<Button variant="primary" onClick={handleCommit}>
						{__('Insert', 'prc-quiz-builder')}
					</Button>
				</FlexItem>
			</Flex>
		</div>
	);
}
