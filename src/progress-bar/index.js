/**
 * WordPress Dependencies
 */
import { registerBlockType } from '@wordpress/blocks';

/**
 * Internal Dependencies
 */
import './style.scss';
import './editor.scss';
import Edit from './edit';
import Icon from './icon';
import metadata from './block.json';

const { name } = metadata;

registerBlockType(name, {
	...metadata,
	icon: Icon,
	edit: Edit,
});
