/**
 * WordPress Dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

/**
 * Internal Dependencies
 */
import { parseJsonArray } from './utils';
import {
	COMPLEX_TABLE_MODE,
	buildComplexTableRows,
	buildSimpleTableRows,
} from './table-rows';
import { parseGroupAnswerTally } from '../controller/group-score-share';

const ELEMENT_NODE = 1;

/**
 * Allow a small set of rich-text tags in question copy for results display.
 * Strips everything else before injecting via the watch callback.
 *
 * @param {string} html Raw question HTML.
 * @return {string} Sanitized HTML.
 */
const sanitizeQuestionHtml = (html) => {
	if (typeof html !== 'string' || !html) {
		return '';
	}
	if (typeof document === 'undefined') {
		return html;
	}
	const template = document.createElement('template');
	template.innerHTML = html;
	const allowed = new Set([
		'STRONG',
		'B',
		'EM',
		'I',
		'A',
		'BR',
		'SPAN',
		'SUP',
		'SUB',
	]);
	const walk = (node) => {
		[...node.childNodes].forEach((child) => {
			if (child.nodeType === ELEMENT_NODE) {
				if (!allowed.has(child.tagName)) {
					while (child.firstChild) {
						node.insertBefore(child.firstChild, child);
					}
					node.removeChild(child);
					return;
				}
				[...child.attributes].forEach((attr) => {
					const name = attr.name.toLowerCase();
					if (
						name.startsWith('on') ||
						(name === 'href' &&
							!/^(https?:|mailto:|#)/i.test(attr.value))
					) {
						child.removeAttribute(attr.name);
					} else if (name !== 'href' && name !== 'class') {
						child.removeAttribute(attr.name);
					}
				});
				walk(child);
			}
		});
	};
	walk(template.content);
	return template.innerHTML;
};

const { state } = store('prc-quiz/controller', {
	state: {
		get demoBreakHeaders() {
			const context = getContext();
			const { quizId } = context;
			const quizData = state[`quiz_${quizId}`];

			if (!quizData) {
				return [];
			}

			return parseJsonArray(quizData.demoBreakLabels);
		},
		get resultsTableRows() {
			if (!state.displayResults) {
				return [];
			}
			const context = getContext();
			const { quizId, userScore } = context;
			const { userSubmission } = userScore;
			const quizData = state[`quiz_${quizId}`];
			if (!quizData?.questions) {
				return [];
			}

			return buildSimpleTableRows({
				questions: quizData.questions,
				userSubmission,
				sanitizeQuestion: sanitizeQuestionHtml,
			});
		},
		get complexTableRows() {
			const context = getContext();
			const { quizId, userScore, resultTableMode, groupData } = context;
			const isCommunityGroup =
				COMPLEX_TABLE_MODE.COMMUNITY_GROUP === resultTableMode;
			if (isCommunityGroup && !state.displayGroupResults) {
				return [];
			}
			if (!isCommunityGroup && !state.displayResults) {
				return [];
			}
			const { userSubmission } = userScore || {};
			const quizData = state[`quiz_${quizId}`];
			if (!quizData?.questions) {
				return [];
			}

			return buildComplexTableRows({
				questions: quizData.questions,
				userSubmission,
				demoBreakLabels: parseJsonArray(quizData.demoBreakLabels),
				mode: isCommunityGroup
					? COMPLEX_TABLE_MODE.COMMUNITY_GROUP
					: COMPLEX_TABLE_MODE.PERSONAL,
				groupTally: isCommunityGroup
					? parseGroupAnswerTally(groupData)
					: null,
				sanitizeQuestion: sanitizeQuestionHtml,
			});
		},
	},
	callbacks: {
		/**
		 * Render sanitized question HTML into the results-table cell.
		 * Interactivity API has no data-wp-html directive; use a watch instead.
		 */
		renderQuestionHtml() {
			const { ref } = getElement();
			if (!ref) {
				return;
			}
			const context = getContext();
			const html = context?.row?.question ?? '';
			if (ref.innerHTML !== html) {
				ref.innerHTML = html;
			}
		},
	},
});
