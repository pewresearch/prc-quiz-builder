/**
 * External Dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo, useCallback } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import {
	PanelBody,
	ToggleControl,
	TextControl,
	CardDivider,
	Button,
	Notice as WPComNotice,
} from '@wordpress/components';

/**
 * Internal Dependencies
 */
import getBlockByUUID from '../get-block-by-uuid';

const yellowColor = '#f0b849';

const Notice = styled(WPComNotice)`
	margin-left: 2px;
	margin-right: 2px;
	margin-top: 2px;
`;

export function ConditionalNotice({ attributes, blockType = 'question' }) {
	const { conditionalAnswerUuid } = attributes;

	const { conditionalAnswer, conditionalAnswerClientId } = useMemo(() => {
		const block = getBlockByUUID(conditionalAnswerUuid);
		return {
			conditionalAnswer: block?.attributes?.answer,
			conditionalAnswerClientId: block?.clientId,
		};
	}, [conditionalAnswerUuid]);

	const { selectBlock } = useDispatch('core/block-editor');

	const onClick = useCallback(() => {
		selectBlock(conditionalAnswerClientId);
	}, [selectBlock, conditionalAnswerClientId]);

	if (!conditionalAnswerUuid) {
		return null;
	}

	if (!conditionalAnswer) {
		return null;
	}

	const answerLabel = `"${conditionalAnswer}"`;

	return (
		<Notice status="warning" isDismissible={false}>
			<p>
				This {blockType} will only display if the user has answered{' '}
				<strong>{answerLabel}</strong> in their submission.
			</p>
			<Button onClick={onClick}>Select Answer</Button>
		</Notice>
	);
}

export function ConditionalPanel({
	attributes,
	setAttributes,
	children,
	blockType = 'question',
}) {
	const { conditionalAnswerUuid, conditionalDisplay } = attributes;

	return (
		<PanelBody title={__('Conditional Display Settings')}>
			<div>
				{conditionalDisplay && conditionalAnswerUuid && (
					<>
						<ConditionalNotice
							attributes={attributes}
							blockType={blockType}
						/>
						<CardDivider />
					</>
				)}
				{children}
				<ToggleControl
					label={conditionalDisplay ? 'Enabled' : 'Disabled'}
					checked={conditionalDisplay}
					onChange={() => {
						setAttributes({
							conditionalDisplay: !conditionalDisplay,
						});
					}}
					help={__(
						'When enabled, this question will only be visible on the frontend if the user has the specified answer in their selections.'
					)}
				/>
				{conditionalDisplay && (
					<TextControl
						label="Conditional Answer ID"
						help={__(
							`Include one answer uuid. If you want to check against a question, include the question uuid ~ this will check if any answer is selected for that question.`
						)}
						value={conditionalAnswerUuid}
						onChange={(ca) => {
							setAttributes({ conditionalAnswerUuid: ca });
						}}
					/>
				)}
			</div>
		</PanelBody>
	);
}
