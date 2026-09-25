/**
 * WordPress Dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useDispatch, useSelect, select } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal Dependencies
 */
import {
	GROUP_RESULTS_LOCK,
	getGroupResultsPresence,
	planGroupResultsSync,
} from './group-results-sync';
import { createGroupResultsBlock } from './group-results-template';

/**
 * Repair Group Results presence so it matches `groupsEnabled`.
 *
 * @param {Object}  props
 * @param {string}  props.clientId      Controller client id.
 * @param {boolean} props.groupsEnabled Controller groupsEnabled attribute.
 * @return {{ groupResultsClientId: string|null, removeGroupResults: Function }} Client id of the Group Results child, plus a remover.
 */
export default function useGroupResultsSync({ clientId, groupsEnabled }) {
	const innerBlocks = useSelect(
		(selectStore) => selectStore(blockEditorStore).getBlocks(clientId),
		[clientId]
	);
	const { insertBlock, updateBlockAttributes, removeBlock } =
		useDispatch(blockEditorStore);
	const insertingRef = useRef(false);

	const presence = getGroupResultsPresence(innerBlocks);

	useEffect(() => {
		const latestBlocks = select(blockEditorStore).getBlocks(clientId);
		const latestPlan = planGroupResultsSync({
			groupsEnabled,
			innerBlocks: latestBlocks,
		});

		if ('insert-and-lock' === latestPlan.action) {
			if (insertingRef.current) {
				return;
			}
			insertingRef.current = true;
			insertBlock(
				createGroupResultsBlock(),
				latestPlan.insertIndex,
				clientId,
				false
			);
			return;
		}

		insertingRef.current = false;

		if ('lock' === latestPlan.action) {
			updateBlockAttributes(latestPlan.clientId, {
				lock: GROUP_RESULTS_LOCK,
			});
			return;
		}

		if ('unlock' === latestPlan.action) {
			updateBlockAttributes(latestPlan.clientId, {
				lock: { remove: false },
			});
		}
	}, [
		groupsEnabled,
		presence.kind,
		presence.clientId,
		clientId,
		insertBlock,
		updateBlockAttributes,
	]);

	const groupResultsClientId =
		'absent' === presence.kind ? null : presence.clientId;

	return {
		groupResultsClientId,
		removeGroupResults: () => {
			if (groupResultsClientId) {
				removeBlock(groupResultsClientId, false);
			}
		},
	};
}
