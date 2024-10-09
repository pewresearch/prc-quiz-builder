/**
 * External Dependencies
 */
const { join } = require('path');

const DEFAULT_SUPPORTS = {
	anchor: true,
	html: false,
}

const EXTRA_SUPPORTS = {
	color: {
		background: true,
		text: true,
		link: true,
	},
	spacing: {
		blockGap: true,
		margin: ['top', 'bottom'],
		padding: true
	},
	typography: {
		fontSize: true,
		__experimentalFontFamily: true
	},
}

module.exports = {
	defaultValues: {
		namespace: 'prc-quiz',
		author: 'Seth Rubenstein',
		pluginURI: `https://github.com/pewresearch/pewresearch-org/blob/main/plugins/prc-quiz/`,
		category: 'prc-quiz',
		render: 'file:./render.php',
		attributes: {
			allowedBlocks: {
				type: 'array',
			},
			orientation: {
				type: 'string',
				default: 'vertical',
			}
		},
		supports: {
			...DEFAULT_SUPPORTS,
			...EXTRA_SUPPORTS,
		},
	},
	pluginTemplatesPath: join(__dirname, 'plugin-templates'),
	blockTemplatesPath: join(__dirname, 'block-templates'),
	assetsPath: join(__dirname, 'assets'),
};
