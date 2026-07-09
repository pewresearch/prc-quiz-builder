/**
 * Consolidated Quiz Builder binding source for the Bindings panel.
 */
import { defineBindingSource } from '@prc/functions';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';

import {
	EDITABLE_FIELDS,
	LEGACY_SOURCE_LABELS,
	QUIZ_BUILDER_SOURCE,
	QUIZ_BUILDER_USES_CONTEXT,
	getLegacySourceNames,
	getQuizBuilderBindingField,
	getQuizBuilderFieldsForContext,
	getUsesContextForField,
	legacyFieldForSource,
} from './binding-fields';

let registered = false;

/**
 * Format response count for bound paragraph content.
 *
 * @param {number|string} count Response count.
 * @return {string} Formatted response count string.
 */
export function formatCommunityGroupResponseCount(count) {
	const total = Number(count) || 0;
	return `**${total}** responses`;
}

/**
 * Map field preview values to the bound attribute keys Gutenberg passes in.
 *
 * @param {Record<string, {args?: {field?: string}}>} bindings Active bindings.
 * @param {Record<string, string>} fieldValues Preview values from getValuesForField.
 * @return {Record<string, string>}
 */
function mapFieldValuesToBindings(bindings, fieldValues) {
	const values = {};

	for (const attributeName of Object.keys(bindings ?? {})) {
		if (attributeName === 'url' && fieldValues.url !== undefined) {
			values[attributeName] = fieldValues.url;
		} else if (fieldValues.content !== undefined) {
			values[attributeName] = fieldValues.content;
		} else if (fieldValues.placeholder !== undefined) {
			values[attributeName] = fieldValues.placeholder;
		} else if (fieldValues.url !== undefined) {
			values[attributeName] = fieldValues.url;
		}
	}

	return Object.keys(values).length ? values : fieldValues;
}

/**
 * Resolve editor preview values for a consolidated quiz field.
 *
 * @param {string} field Consolidated field key.
 * @param {Record<string, unknown>} context Block context.
 * @return {Record<string, string>}
 */
function getValuesForField(field, context) {
	switch (field) {
		case 'question-text': {
			const question = context['prc-quiz/question/text'];
			return question
				? { content: question }
				: { placeholder: __('Enter question text', 'prc-quiz') };
		}
		case 'answer-text': {
			const answer = context['prc-quiz/answer/text'];
			return answer
				? { content: answer }
				: {
						placeholder: __(
							'Start typing your answer here!',
							'prc-quiz'
						),
					};
		}
		case 'page-title-text': {
			const pageTitle = context['prc-quiz/page/title'];
			return pageTitle
				? { content: pageTitle }
				: { placeholder: __('Enter page title', 'prc-quiz') };
		}
		case 'community-group-name': {
			const groupName = context['prc-quiz/group/name'];
			return groupName
				? { content: groupName }
				: { placeholder: __('Community group name', 'prc-quiz') };
		}
		case 'community-group-response-count': {
			const responseCount = context['prc-quiz/group/response-count'];
			if (responseCount !== undefined && responseCount !== null) {
				return {
					content: formatCommunityGroupResponseCount(responseCount),
				};
			}
			return {
				placeholder: formatCommunityGroupResponseCount(0),
			};
		}
		case 'community-group-results-url': {
			const resultsUrl = context['prc-quiz/group/results-url'];
			return resultsUrl
				? { url: resultsUrl }
				: {
						placeholder: __(
							'Group results URL (available on group quiz URLs)',
							'prc-quiz'
						),
					};
		}
		case 'share-quiz-url':
			return {
				placeholder: __('Quiz URL (resolved on render)', 'prc-quiz'),
			};
		default:
			return {};
	}
}

/**
 * Write editor binding values back to the parent quiz block.
 *
 * @param {string} field Consolidated field key.
 * @param {Object} args setValues callback args.
 */
function setValuesForField(field, { select, dispatch, bindings }) {
	const { newValue } = bindings.content ?? {};
	if (!EDITABLE_FIELDS.has(field) || newValue === undefined) {
		return;
	}

	const { getSelectedBlockClientId, getBlockRootClientId } =
		select(blockEditorStore);
	const { updateBlockAttributes } = dispatch(blockEditorStore);
	const selectedBlockClientId = getSelectedBlockClientId();
	const rootClientId = getBlockRootClientId(selectedBlockClientId);

	if (!rootClientId) {
		return;
	}

	if (field === 'question-text') {
		updateBlockAttributes(rootClientId, { question: newValue });
		return;
	}

	if (field === 'answer-text') {
		updateBlockAttributes(rootClientId, { answer: newValue });
		return;
	}

	if (field === 'page-title-text') {
		updateBlockAttributes(rootClientId, { title: newValue });
	}
}

/**
 * Register a legacy alias source that mirrors PHP `register_block_bindings_source()`.
 *
 * @param {string} sourceName Legacy source name.
 */
function registerLegacyBindingSource(sourceName) {
	const field = legacyFieldForSource(sourceName);
	if (!field) {
		return;
	}

	// Intentionally omit `getFieldsList` so legacy aliases stay out of the
	// Bindings connect panel (the consolidated Quiz Builder source surfaces
	// every field). Keeping getValues/setValues/canUserEditValue preserves
	// editor preview and inline editing for content saved against legacy sources.
	defineBindingSource({
		name: sourceName,
		label: LEGACY_SOURCE_LABELS[sourceName] ?? sourceName,
		usesContext: getUsesContextForField(field),
		getValues: ({ context }) => getValuesForField(field, context ?? {}),
		setValues: (args) => setValuesForField(field, args),
		canUserEditValue: () => EDITABLE_FIELDS.has(field),
	});
}

/**
 * Register the consolidated quiz builder binding source once.
 */
export default function registerQuizBuilderBindings() {
	if (registered) {
		return;
	}
	registered = true;

	defineBindingSource({
		name: QUIZ_BUILDER_SOURCE,
		label: __('Quiz Builder', 'prc-quiz'),
		usesContext: QUIZ_BUILDER_USES_CONTEXT,
		getFieldsList() {
			return getQuizBuilderFieldsForContext();
		},
		getValues({ context, bindings }) {
			const field = getQuizBuilderBindingField(bindings);
			if (!field) {
				return {};
			}

			return mapFieldValuesToBindings(
				bindings,
				getValuesForField(field, context ?? {})
			);
		},
		setValues: (args) => {
			const field = getQuizBuilderBindingField(args.bindings);
			if (field) {
				setValuesForField(field, args);
			}
		},
		canUserEditValue({ args }) {
			const field = args?.field;
			return !!field && EDITABLE_FIELDS.has(field);
		},
	});

	getLegacySourceNames().forEach(registerLegacyBindingSource);
}
