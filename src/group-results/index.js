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

import registerCommunityGroupNameBinding from './community-group-name-binding';
import registerCommunityGroupResponseCountBinding from './community-group-response-count-binding';
import registerCommunityGroupResultsUrlBinding from './community-group-results-url-binding';

import metadata from './block.json';

const { name } = metadata;

registerCommunityGroupNameBinding();
registerCommunityGroupResponseCountBinding();
registerCommunityGroupResultsUrlBinding();

const settings = {
	icon,
	edit,
	save,
};

registerBlockType(name, { ...metadata, ...settings });
