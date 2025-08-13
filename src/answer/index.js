/**
 * Registers a new block provided a unique name and an object defining its behavior.
 *
 * @see https://developer.wordpress.org/block-editor/developers/block-api/#registering-a-block
 */

/**
 * External Dependencies
 */

/**
 * WordPress Dependencies
 */
import { registerBlockType } from '@wordpress/blocks';

/**
 * Internal Dependencies
 */
import './style.scss';
import './editor.scss';
import edit from './edit';
import save from './save';
import variations from './variations';
import icon from './icon';
import registerAnswerBinding from './answer-binding';
import { initDeprecation } from './deprecation';

import metadata from './block.json';

const { name } = metadata;

const deprecated = initDeprecation(
	metadata.attributes,
	metadata.supports,
	save
);

const settings = {
	edit,
	save,
	variations,
	deprecated,
	icon,
};

registerAnswerBinding();

registerBlockType(name, { ...metadata, ...settings });
