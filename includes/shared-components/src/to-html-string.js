const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const DOCUMENT_FRAGMENT_NODE = 11;

/**
 * Convert a value to an HTML string safe for RawHTML and text cells.
 *
 * Bound question/answer attributes are strings after save. While the user is
 * still editing, Gutenberg can pass a live DOM node (often an `<a>`) instead.
 *
 * @param {*} value Attribute, binding, or rich-text value.
 * @return {string} HTML or plain text.
 */
export function toHtmlString(value) {
	if (typeof value === 'string') {
		return value;
	}
	if (value === null || value === undefined || typeof value === 'boolean') {
		return '';
	}
	if (typeof value === 'number') {
		return String(value);
	}
	if (Array.isArray(value)) {
		return value.map(toHtmlString).join('');
	}
	if (typeof value !== 'object') {
		return '';
	}
	if (typeof value.nodeType === 'number') {
		if (TEXT_NODE === value.nodeType) {
			return value.textContent || '';
		}
		if (ELEMENT_NODE === value.nodeType) {
			return typeof value.outerHTML === 'string' ? value.outerHTML : '';
		}
		if (DOCUMENT_FRAGMENT_NODE === value.nodeType && value.childNodes) {
			return Array.from(value.childNodes).map(toHtmlString).join('');
		}
		return value.textContent || '';
	}
	if (typeof value.length === 'number' && typeof value.item === 'function') {
		return Array.from(value, toHtmlString).join('');
	}
	if (typeof value.text === 'string') {
		return value.text;
	}
	return '';
}
