/**
 * Shared slug and default markup for the Your Score block bit.
 */

import { YOUR_SCORE_BIT } from './bit-names.js';

export { YOUR_SCORE_BIT };

/**
 * Default Results heading markup with an inline score bit.
 *
 * @param {string} total Editorial question total (e.g. "8" or "X").
 * @return {string} RichText content for core/heading.
 */
export function buildDefaultScoreHeadingContent(total = 'X') {
	return `You answered <span class="prc-block-bit" data-prc-block-bit="${YOUR_SCORE_BIT}">0</span> out of ${total} questions correctly.`;
}
