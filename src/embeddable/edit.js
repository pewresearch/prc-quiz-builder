/* eslint-disable @wordpress/no-unsafe-wp-apis */
/**
 * WordPress Dependencies
 */
import { withNotices } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { useEntityBlockEditor, useEntityRecord } from '@wordpress/core-data';
import {
	useInnerBlocksProps,
	__experimentalRecursionProvider as RecursionProvider,
	__experimentalUseHasRecursion as useHasRecursion,
	InnerBlocks,
	useBlockProps,
	Warning,
} from '@wordpress/block-editor';

/**
 * Internal Dependencies
 */
import Controls from './controls';
import Placeholder from './placeholder';
import { POST_TYPE, ALLOWED_BLOCKS } from './constants';

function SyncedEntityEdit({
	attributes,
	setAttributes,
	clientId,
	noticeOperations,
	noticeUI,
}) {
	const { ref } = attributes;
	const isNew = !ref;
	const hasAlreadyRendered = useHasRecursion(ref);
	const { record, hasResolved } = useEntityRecord('postType', POST_TYPE, ref);
	const isResolving = !hasResolved;
	const isMissing = hasResolved && !record && !isNew;

	const [blocks, onInput, onChange] = useEntityBlockEditor(
		'postType',
		POST_TYPE,
		{ id: ref }
	);

	const blockProps = useBlockProps();

	const innerBlocksProps = useInnerBlocksProps(blockProps, {
		value: blocks,
		onInput,
		onChange,
		renderAppender: blocks?.length
			? undefined
			: InnerBlocks.ButtonBlockAppender,
	});

	if (hasAlreadyRendered) {
		return (
			<div {...blockProps}>
				<Warning>
					{`${POST_TYPE} cannot be rendered inside itself.`}
				</Warning>
			</div>
		);
	}

	if (isMissing) {
		return (
			<div {...blockProps}>
				<Warning>
					{`${POST_TYPE} has been deleted or is unavailable.`}
				</Warning>
			</div>
		);
	}

	if (isResolving || isNew) {
		return (
			<div {...blockProps}>
				<Placeholder
					{...{
						attributes,
						setAttributes,
						clientId,
						isResolving,
						isNew,
					}}
				/>
			</div>
		);
	}

	return (
		<RecursionProvider uniqueId={ref}>
			<Controls
				{...{
					attributes,
					clientId,
					blocks,
				}}
			/>
			<div {...innerBlocksProps} />
		</RecursionProvider>
	);
}

export default withNotices(SyncedEntityEdit);
