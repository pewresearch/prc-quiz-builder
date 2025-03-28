/**
 * WordPress Dependencies
 */

import { KeyboardShortcuts } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

export default function NewPageKeyboardHandler({
	attributes,
	context,
	clientId,
	children,
}) {
	const { insertBlock } = useDispatch(blockEditorStore);
	const { pagesClientId, nextBlockIndex } = useSelect((select) => {
		const { getBlockRootClientId, getBlockIndex, getBlockName } = select(blockEditorStore);
		const blockName = getBlockName(clientId);
		let pageClientId = clientId;
		if (blockName === 'prc-quiz/question') {
			pageClientId = getBlockRootClientId(clientId);
		}
		if (blockName === 'prc-quiz/answer') {
			const questionClientId = getBlockRootClientId(clientId);
			pageClientId = getBlockRootClientId(questionClientId);
		}
		return {
			pagesClientId: getBlockRootClientId(pageClientId),
			nextBlockIndex: getBlockIndex(pageClientId) + 1,
		};
	}, []);

	const onNewPageShortcut = (event, combo) => {
		event.preventDefault();
		console.log('new page shortcut...', event, combo, clientId);
		const newPageBlock = createBlock('prc-quiz/page', {}, []);
		insertBlock(newPageBlock, nextBlockIndex, pagesClientId);
	};

	return (
		<KeyboardShortcuts
			key="new-page-shortcut"
			shortcuts={{
				'mod+d': onNewPageShortcut,
			}}
			bindGlobal
		>
			{children}
		</KeyboardShortcuts>
	);
}
