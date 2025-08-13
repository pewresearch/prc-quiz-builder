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
import icon from './icon';
import variations from './variations';
import registerQuestionBinding from './question-binding';

import metadata from './block.json';

const { name } = metadata;

const settings = {
	icon,
	edit,
	save,
	variations,
};

registerQuestionBinding();

registerBlockType(name, { ...metadata, ...settings });
