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
import registerPageTitleBinding from './page-title-binding';
import registerButtonVariations from './button-variations';
import metadata from './block.json';

const { name } = metadata;

const settings = {
	icon,
	edit,
	save,
	__experimentalLabel: ({ title }) => `Page: ${title}` || 'Page',
};

registerPageTitleBinding();
registerButtonVariations();
registerBlockType(name, { ...metadata, ...settings });
