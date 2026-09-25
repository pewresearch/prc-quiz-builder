/**
 * Internal Dependencies
 */
export { toHtmlString } from '../../includes/shared-components/src/to-html-string';

/**
 * Block style class WordPress adds when Complex is selected.
 */
export const COMPLEX_STYLE_CLASS = 'is-style-complex';

/**
 * Variation class for the community-group Complex table.
 */
export const COMMUNITY_GROUP_STYLE_CLASS = 'is-prc-quiz-community-group';

/**
 * Saved className for the community-group result-table variation.
 *
 * @return {string} Combined Complex style and variation classes.
 */
export function communityGroupClassName() {
	return `${COMPLEX_STYLE_CLASS} ${COMMUNITY_GROUP_STYLE_CLASS}`;
}

/**
 * Whether the result table uses the Complex block style.
 *
 * @param {string} className Block className attribute.
 * @return {boolean} True when the Complex style is selected.
 */
export function isComplexStyle(className = '') {
	return (
		typeof className === 'string' && className.includes(COMPLEX_STYLE_CLASS)
	);
}

/**
 * Whether the result table is the community-group Complex variation.
 *
 * @param {string} className Block className attribute.
 * @return {boolean} True when the community-group variation is selected.
 */
export function isCommunityGroupStyle(className = '') {
	return (
		typeof className === 'string' &&
		className.includes(COMMUNITY_GROUP_STYLE_CLASS)
	);
}

/**
 * Parse a JSON array attribute, returning an empty array on failure.
 *
 * @param {string|Array} value JSON string or array.
 * @return {Array} Parsed array.
 */
export function parseJsonArray(value) {
	if (Array.isArray(value)) {
		return value;
	}
	if (typeof value !== 'string' || !value) {
		return [];
	}
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

/**
 * Pad or trim demographic values to match the label count.
 *
 * @param {Array}  values     Stored values.
 * @param {number} labelCount Number of demographic labels.
 * @return {Array} Values aligned to labels.
 */
export function padDemoBreakValues(values, labelCount) {
	const current = Array.isArray(values) ? values : [];
	const count = Number.isInteger(labelCount) ? Math.max(0, labelCount) : 0;
	return Array.from({ length: count }, (_, i) =>
		typeof current[i] !== 'undefined' && null !== current[i]
			? current[i]
			: ''
	);
}

/**
 * Move an item from one index to another, returning a new array.
 *
 * @param {Array}  list      Source list.
 * @param {number} fromIndex Current index.
 * @param {number} toIndex   Destination index.
 * @return {Array} Reordered list.
 */
export function moveIndex(list, fromIndex, toIndex) {
	const items = Array.isArray(list) ? [...list] : [];
	if (
		fromIndex === toIndex ||
		fromIndex < 0 ||
		toIndex < 0 ||
		fromIndex >= items.length ||
		toIndex >= items.length
	) {
		return items;
	}
	const [item] = items.splice(fromIndex, 1);
	items.splice(toIndex, 0, item);
	return items;
}

/**
 * Field id prefix for demographic columns in the results-data DataViews.
 */
export const DEMO_BREAK_FIELD_PREFIX = 'demoBreak-';

/**
 * Stable field id for a demographic column.
 *
 * @param {number} index Column index.
 * @return {string} Field id.
 */
export function demoBreakFieldId(index) {
	return `${DEMO_BREAK_FIELD_PREFIX}${index}`;
}

/**
 * Parse a demographic field id into its column index.
 *
 * @param {string} fieldId DataViews field id.
 * @return {number|null} Index, or null when the id is not a demo field.
 */
export function parseDemoBreakFieldIndex(fieldId) {
	if (
		typeof fieldId !== 'string' ||
		!fieldId.startsWith(DEMO_BREAK_FIELD_PREFIX)
	) {
		return null;
	}
	const index = Number(fieldId.slice(DEMO_BREAK_FIELD_PREFIX.length));
	return Number.isInteger(index) ? index : null;
}

/**
 * Demographic column indices in DataViews field order.
 *
 * @param {Array} fields View field ids.
 * @return {Array} Indices.
 */
export function demoBreakOrderFromFields(fields) {
	if (!Array.isArray(fields)) {
		return [];
	}
	return fields
		.map((fieldId) => parseDemoBreakFieldIndex(fieldId))
		.filter((index) => null !== index);
}

/**
 * Whether `order` is a permutation of 0..length-1.
 *
 * @param {Array}  order  Candidate indices.
 * @param {number} length Expected length.
 * @return {boolean} True when every index appears once.
 */
export function isCompleteIndexPermutation(order, length) {
	if (!Array.isArray(order) || order.length !== length) {
		return false;
	}
	const seen = new Set(order);
	if (seen.size !== length) {
		return false;
	}
	return order.every(
		(index) => Number.isInteger(index) && index >= 0 && index < length
	);
}

/**
 * Reorder a list by a permutation of its current indices.
 *
 * @param {Array} list  Source list.
 * @param {Array} order New index order, e.g. [0, 3, 1, 2].
 * @return {Array} Reordered list, or a copy when the order is invalid.
 */
export function permuteByOrder(list, order) {
	const items = Array.isArray(list) ? list : [];
	if (!isCompleteIndexPermutation(order, items.length)) {
		return [...items];
	}
	return order.map((index) => items[index]);
}

/**
 * Permutation implied by a DataViews field list, or null when unchanged/incomplete.
 *
 * Hidden columns omit field ids, so those view changes are not a data reorder.
 *
 * @param {Array}  fields     View field ids.
 * @param {number} labelCount Number of demographic labels.
 * @return {Array|null} New index order, or null.
 */
export function demoBreakPermutationFromView(fields, labelCount) {
	const order = demoBreakOrderFromFields(fields);
	if (!isCompleteIndexPermutation(order, labelCount)) {
		return null;
	}
	if (order.every((index, i) => index === i)) {
		return null;
	}
	return order;
}

/**
 * Display a stored percentage with a trailing % when the value is numeric.
 *
 * @param {string|number} value Raw stored value.
 * @return {string} Display string.
 */
export function formatPercent(value) {
	if (value === null || value === undefined || value === '') {
		return '';
	}
	const str = String(value).trim();
	if (!str) {
		return '';
	}
	if (str.endsWith('%')) {
		return str;
	}
	return `${str}%`;
}

/**
 * Normalize questions from either an array or a UUID-keyed object.
 *
 * @param {Array|Object} questions Questions list.
 * @return {Array} Questions array.
 */
export function toQuestionsArray(questions) {
	if (!questions) {
		return [];
	}
	return Array.isArray(questions) ? questions : Object.values(questions);
}

/**
 * Normalize answers from either an array or a UUID-keyed object.
 *
 * @param {Array|Object} answers Answers list.
 * @return {Array} Answers array.
 */
export function toAnswersArray(answers) {
	if (!answers) {
		return [];
	}
	return Array.isArray(answers) ? answers : Object.values(answers);
}
