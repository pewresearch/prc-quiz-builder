/**
 * Inline editor for the group-bucket-share bit.
 *
 * Authors pick one controller score bucket. The bit prints that bucket's
 * group percent.
 */

import { __ } from '@wordpress/i18n';
import { useState, useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { Button, Flex, FlexItem, SelectControl } from '@wordpress/components';
import { parseScoreBuckets } from '../controller/score-buckets';
import { GROUP_SCORE_SHARE_FALLBACK } from '../controller/group-score-share';

export default function GroupBucketShareEdit({
	attributes,
	onCommit,
	onCancel,
}) {
	const [scoreBucketId, setScoreBucketId] = useState(
		attributes.scoreBucketId ?? ''
	);

	const scoreBuckets = useSelect((select) => {
		const {
			getSelectedBlockClientId,
			getBlockParentsByBlockName,
			getBlock,
		} = select(blockEditorStore);
		const clientId = getSelectedBlockClientId();
		if (!clientId) {
			return [];
		}
		const [controllerId] = getBlockParentsByBlockName(
			clientId,
			'prc-quiz/controller'
		);
		const controller = controllerId ? getBlock(controllerId) : null;
		return parseScoreBuckets(controller?.attributes?.scoreBuckets);
	}, []);

	const options = [
		{
			label: __('Select a score bucket…', 'prc-quiz-builder'),
			value: '',
		},
		...scoreBuckets.map((bucket) => ({
			label: `${bucket.label} (${bucket.min}–${bucket.max})`,
			value: bucket.id,
		})),
	];

	const handleCommit = useCallback(() => {
		onCommit({
			attributes: { scoreBucketId },
			innerHTML: GROUP_SCORE_SHARE_FALLBACK,
		});
	}, [scoreBucketId, onCommit]);

	return (
		<div
			className="prc-quiz-group-bucket-share__editor"
			style={{ minWidth: 280, padding: 16, maxWidth: 360 }}
		>
			<SelectControl
				label={__('Score bucket', 'prc-quiz-builder')}
				value={scoreBucketId}
				options={options}
				onChange={setScoreBucketId}
				help={
					0 === scoreBuckets.length
						? __(
								'Define score buckets on the Quiz Controller first.',
								'prc-quiz-builder'
							)
						: undefined
				}
				__nextHasNoMarginBottom
				__next40pxDefaultSize
			/>
			<Flex justify="flex-end" gap={2} style={{ marginTop: 12 }}>
				<FlexItem>
					<Button
						variant="tertiary"
						onClick={onCancel}
						__next40pxDefaultSize
					>
						{__('Cancel', 'prc-quiz-builder')}
					</Button>
				</FlexItem>
				<FlexItem>
					<Button
						variant="primary"
						onClick={handleCommit}
						disabled={'' === scoreBucketId}
						__next40pxDefaultSize
					>
						{__('Insert', 'prc-quiz-builder')}
					</Button>
				</FlexItem>
			</Flex>
		</div>
	);
}
