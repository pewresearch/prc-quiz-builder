/**
 * WordPress Dependencies
 */
import { select } from '@wordpress/data';

export default function getBlockByUUID(uuid) {
	const blocks = select('core/block-editor').getBlocks();
	console.log("getBlockByUUID", blocks);
	const quizBlock = blocks.find(block => block.name === 'prc-quiz/controller');
	if (quizBlock) {
		// Find the block, recursively, seaching innerBlocks and innerBlocks of innerBlocks, etc. till we find the block with an attribute.uuid equal to uuid.
		const findBlock = (block, uuid) => {
			if (block.attributes.uuid === uuid) {
				return block;
			}
			if (block.innerBlocks.length) {
				for (let i = 0; i < block.innerBlocks.length; i++) {
					const found = findBlock(block.innerBlocks[i], uuid);
					if (found) {
						return found;
					}
				}
			}
		}
		return findBlock(quizBlock, uuid);
	} else {
		return null;
	}
}
