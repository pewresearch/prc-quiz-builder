/**
 * WordPress Dependencies
 */
import { registerBlockType, createBlock } from '@wordpress/blocks';

/**
 * Internal Dependencies
 */
import edit from './edit';
import icon from './icon';
import metadata from './block.json';

const { name } = metadata;

const LEGACY_BLOCK_NAME = 'prc-quiz/embeddable';

const settings = {
	icon,
	edit,
};

registerBlockType(name, { ...metadata, ...settings });

registerBlockType(LEGACY_BLOCK_NAME, {
	...metadata,
	name: LEGACY_BLOCK_NAME,
	title: metadata.title,
	description: metadata.description,
	supports: {
		...metadata.supports,
		inserter: false,
	},
	icon,
	edit,
	transforms: {
		to: [
			{
				type: 'block',
				blocks: [name],
				transform: (attributes) => createBlock(name, attributes),
			},
		],
	},
});
