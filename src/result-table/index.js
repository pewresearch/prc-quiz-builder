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
import { registerBlockType, registerBlockVariation } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */

import './style.scss';
import './editor.scss';
import edit from './edit';
import icon from './icon';

import metadata from './block.json';
import { COMMUNITY_GROUP_STYLE_CLASS, communityGroupClassName } from './utils';

const { name } = metadata;

const settings = {
	icon,
	edit,
};

registerBlockType(name, { ...metadata, ...settings });

registerBlockVariation(name, {
	name: 'community-group',
	title: __('Community Group Complex', 'prc-quiz'),
	description: __(
		"Complex results table with general-population percentages and your group's answers.",
		'prc-quiz'
	),
	attributes: {
		className: communityGroupClassName(),
	},
	isActive: (blockAttributes) =>
		typeof blockAttributes?.className === 'string' &&
		blockAttributes.className.includes(COMMUNITY_GROUP_STYLE_CLASS),
	scope: ['inserter', 'transform'],
});
