/**
 * WordPress Dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { select } from '@wordpress/data';

const onBlockCreation = (clientId, uuid = null, setAttributes = false) => {
	if (null === uuid && false !== setAttributes) {
		// We will use the first client id assigned as a uuid.
		const newUuid = clientId;
		setAttributes({ uuid: newUuid });
	}
};

const countTotalQuestionBlocks = (clientId) => {
	const { getBlockRootClientId, getBlockIndex, getBlockName } =
		select(blockEditorStore);
	const blockName = getBlockName(clientId);
	if (blockName === 'prc-quiz/question') {
		return 1;
	}
	return 0;
};

export { onBlockCreation, countTotalQuestionBlocks };
