/**
 * Shared field manifest for prc-quiz/builder bindings.
 */
import { __ } from '@wordpress/i18n';

export const QUIZ_BUILDER_SOURCE = 'prc-quiz/builder';

/** @type {Record<string, string>} Legacy source name → consolidated field key (mirrors PHP). */
export const LEGACY_SOURCE_FIELDS = {
	'prc-quiz/question': 'question-text',
	'prc-quiz/answer': 'answer-text',
	'prc-quiz/page-title': 'page-title-text',
	'prc-quiz/community-group-name': 'community-group-name',
	'prc-quiz/community-group-response-count': 'community-group-response-count',
	'prc-quiz/community-group-results-url': 'community-group-results-url',
	'prc-quiz/share-quiz-url': 'share-quiz-url',
};

/** @type {Record<string, string>} */
export const LEGACY_SOURCE_LABELS = {
	'prc-quiz/question': __('Quiz Question', 'prc-quiz'),
	'prc-quiz/answer': __('Quiz Answer', 'prc-quiz'),
	'prc-quiz/page-title': __('Quiz Page', 'prc-quiz'),
	'prc-quiz/community-group-name': __('Community Group Name', 'prc-quiz'),
	'prc-quiz/community-group-response-count': __(
		'Community Group Response Count',
		'prc-quiz'
	),
	'prc-quiz/community-group-results-url': __(
		'Community Group Results URL',
		'prc-quiz'
	),
	'prc-quiz/share-quiz-url': __('Quiz Share URL', 'prc-quiz'),
};

/** @type {string[]} */
export const QUIZ_BUILDER_USES_CONTEXT = [
	'prc-quiz/id',
	'prc-quiz/question/text',
	'prc-quiz/question/uuid',
	'prc-quiz/answer/text',
	'prc-quiz/answer/uuid',
	'prc-quiz/page/title',
	'prc-quiz/page/uuid',
	'prc-quiz/group/name',
	'prc-quiz/group/response-count',
	'prc-quiz/group/results-url',
];

/** @type {Array<{label: string, type: string, args: {field: string}}>} */
export const QUIZ_BUILDER_BINDING_FIELDS = [
	{
		label: __('Question Text', 'prc-quiz'),
		type: 'string',
		args: { field: 'question-text' },
	},
	{
		label: __('Answer Text', 'prc-quiz'),
		type: 'string',
		args: { field: 'answer-text' },
	},
	{
		label: __('Page Title Text', 'prc-quiz'),
		type: 'string',
		args: { field: 'page-title-text' },
	},
	{
		label: __('Community Group Name', 'prc-quiz'),
		type: 'string',
		args: { field: 'community-group-name' },
	},
	{
		label: __('Community Group Response Count', 'prc-quiz'),
		type: 'string',
		args: { field: 'community-group-response-count' },
	},
	{
		label: __('Community Group Results URL', 'prc-quiz'),
		type: 'string',
		args: { field: 'community-group-results-url' },
	},
	{
		label: __('Quiz Share URL', 'prc-quiz'),
		type: 'string',
		args: { field: 'share-quiz-url' },
	},
];

const FIELD_CONTEXT_KEYS = {
	'question-text': ['prc-quiz/question/text', 'prc-quiz/question/uuid'],
	'answer-text': ['prc-quiz/answer/text', 'prc-quiz/answer/uuid'],
	'page-title-text': ['prc-quiz/page/title', 'prc-quiz/page/uuid'],
	'community-group-name': ['prc-quiz/group/name'],
	'community-group-response-count': ['prc-quiz/group/response-count'],
	'community-group-results-url': ['prc-quiz/group/results-url'],
	'share-quiz-url': ['prc-quiz/id'],
};

const EDITABLE_FIELDS = new Set([
	'question-text',
	'answer-text',
	'page-title-text',
]);

/**
 * Return panel fields available for the Bindings connect panel.
 *
 * @return {typeof QUIZ_BUILDER_BINDING_FIELDS}
 */
export function getQuizBuilderFieldsForContext() {
	return QUIZ_BUILDER_BINDING_FIELDS;
}

/**
 * Resolve the active binding field key from editor bindings metadata.
 *
 * @param {Record<string, {args?: {field?: string}}>} bindings Active bindings.
 * @return {string|undefined}
 */
export function getQuizBuilderBindingField(bindings = {}) {
	const fromKnownAttribute =
		bindings.content?.args?.field ?? bindings.url?.args?.field;
	if (fromKnownAttribute) {
		return fromKnownAttribute;
	}

	for (const binding of Object.values(bindings)) {
		if (binding?.args?.field) {
			return binding.args.field;
		}
	}

	return undefined;
}

/**
 * Map a legacy source name to a consolidated field key.
 *
 * @param {string} sourceName Legacy binding source name.
 * @return {string|undefined}
 */
export function legacyFieldForSource(sourceName) {
	return LEGACY_SOURCE_FIELDS[sourceName];
}

/**
 * Legacy source names retained for editor and render compatibility.
 *
 * @return {string[]}
 */
export function getLegacySourceNames() {
	return Object.keys(LEGACY_SOURCE_FIELDS);
}

/**
 * Block context keys required by a consolidated field.
 *
 * @param {string} field Consolidated field key.
 * @return {string[]}
 */
export function getUsesContextForField(field) {
	return FIELD_CONTEXT_KEYS[field] ?? [];
}

/**
 * Whether a saved binding targets a quiz builder field.
 *
 * @param {{source?: string, args?: {field?: string}}} binding Saved binding metadata.
 * @param {string} legacySource Legacy source name.
 * @param {string} field Consolidated field key.
 * @return {boolean}
 */
export function isQuizBuilderBindingActive(binding, legacySource, field) {
	if (!binding) {
		return false;
	}

	if (binding.source === legacySource) {
		return true;
	}

	return (
		binding.source === QUIZ_BUILDER_SOURCE && binding.args?.field === field
	);
}

export { EDITABLE_FIELDS };
