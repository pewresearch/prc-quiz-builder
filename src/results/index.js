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
import edit from './edit';
import save from './save';
import icon from './icon';
import registerResultsPointsDisplayFilter from './results-points-display-filter';

import metadata from './block.json';

const { name } = metadata;

const settings = {
	icon,
	edit,
	save,
};

registerBlockType(name, { ...metadata, ...settings });

registerResultsPointsDisplayFilter();
