/**
 * External Dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo, Fragment } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import {
	PanelBody,
	ToggleControl,
	TextControl,
	CardDivider,
	Button,
	Notice as WPComNotice,
	Tooltip,
	ToolbarGroup,
} from '@wordpress/components';
import { BlockControls } from '@wordpress/block-editor';

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

function Dot({ onClick, children }) {
	return (
		<button
			type="button"
			style={{
				color: yellowColor,
				fontSize: '40px',
				position: 'absolute',
				top: 0,
				left: '-40px',
				cursor: 'pointer',
				background: 'none',
				border: 'none',
				padding: 0,
			}}
			onClick={onClick}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					onClick();
				}
			}}
		>
			{children}
		</button>
	);
}

function ToolbarButtonText({ text }) {
	return <span style={{ color: yellowColor }}>{text}</span>;
}

export function ConditionalBlockControls({ attributes }) {
	const { conditionalDisplay, conditionalAnswerUuid } = attributes;
	if (!conditionalDisplay || !conditionalAnswerUuid) {
		return null;
	}

	const { conditionalAnswerClientId } = useMemo(() => {
		const block = getBlockByUUID(conditionalAnswerUuid);
		return {
			conditionalAnswerClientId: block?.clientId,
		};
	}, [conditionalAnswerUuid]);

	const { selectBlock } = useDispatch('core/block-editor');

	const selectLabel = __('Select Conditional Block', 'prc-quiz');

	return (
		<BlockControls>
			<ToolbarGroup
				controls={[
					{
						children: (
							<ToolbarButtonText>{selectLabel}</ToolbarButtonText>
						),
						title: selectLabel,
						onClick: () => {
							selectBlock(conditionalAnswerClientId);
						},
					},
				]}
			/>
		</BlockControls>
	);
}

export function ConditionalNotice({ attributes, blockType = 'question' }) {
	const { conditionalDisplay, conditionalAnswerUuid } = attributes;
	if (!conditionalDisplay || !conditionalAnswerUuid) {
		return null;
	}

	const { conditionalAnswer } = useMemo(() => {
		const block = getBlockByUUID(conditionalAnswerUuid);
		return {
			conditionalAnswer: block?.attributes?.answer,
		};
	}, [conditionalAnswerUuid]);

	if (!conditionalAnswer) {
		return null;
	}

	const answerLabel = __(conditionalAnswer, 'prc-quiz');

	return (
		<Notice status="warning" isDismissible={false}>
			<p>
				This {blockType} will only display if the user has answered{' '}
				<strong>"{answerLabel}"</strong> in their submission.
			</p>
		</Notice>
	);
}

export function ConditionalDot({ attributes }) {
	const { conditionalDisplay, conditionalAnswerUuid } = attributes;
	if (!conditionalDisplay || !conditionalAnswerUuid) {
		return null;
	}

	const { conditionalAnswer, conditionalAnswerClientId } = useMemo(() => {
		const block = getBlockByUUID(conditionalAnswerUuid);
		return {
			conditionalAnswer: block?.attributes?.answer,
			conditionalAnswerClientId: block?.clientId,
		};
	}, [conditionalAnswerUuid]);

	const { selectBlock } = useDispatch('core/block-editor');

	return (
		<Tooltip
			text={__(
				`This will only display if the user answers: "${conditionalAnswer}".`,
				'prc-quiz'
			)}
		>
			<Dot
				onClick={() => {
					selectBlock(conditionalAnswerClientId);
				}}
			>
				&#8226;
			</Dot>
		</Tooltip>
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
					<Fragment>
						<ConditionalNotice
							attributes={attributes}
							blockType={blockType}
						/>
						<CardDivider />
					</Fragment>
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
						'When enabled, this question will only be visible on the frontend if the user has the specified answer in their submission.'
					)}
				/>
				{/**
				 * @TODO: Make this a token select box and save data accordingly
				 */}
				{conditionalDisplay && (
					<TextControl
						label="Conditional Answer ID"
						help={__(
							`You can comma seperate these to include multiple values.`
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
