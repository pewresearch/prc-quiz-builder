/**
 * Jest configuration for prc-quiz-builder unit tests.
 * Unit tests live under monorepo root tests/prc-quiz-builder/unit/.
 */
const path = require('path');

const unitRoot = path.resolve(__dirname, '../../tests/prc-quiz-builder/unit');

module.exports = {
	...require('@wordpress/scripts/config/jest-unit.config'),
	rootDir: __dirname,
	roots: [unitRoot],
	testMatch: ['**/*.test.js'],
	testPathIgnorePatterns: [
		'/node_modules/',
		'scoring-not-sure\\.test\\.js$',
		'selected-answers\\.test\\.js$',
	],
};
