/**
 * Editor-side overlay for the quiz-builder group-results-link bit.
 *
 * The PHP-side `define_block_bits()` (in class-results.php) registers the bit
 * on the platform-wide @prc/block-bits registry and projects label /
 * allowedBlockTypes / defaultText onto `window.prcBlockBits.bits` for
 * hydration. This file attaches the editor-only `title` + `icon` overlay.
 *
 * The question-outcome-label bit includes an `edit` popover for optional
 * per-bit Correct / Incorrect / Not sure label overrides.
 */

import { __ } from '@wordpress/i18n';
import { link, check } from '@wordpress/icons';
import { registerBlockBit } from '@prc/block-bits';
import QuestionOutcomeLabelEdit from './question-outcome-label-edit';

export default function registerBlockBits() {
	registerBlockBit('prc-quiz-builder/group-results-link', {
		title: __("View Your Group's Results", 'prc-quiz-builder'),
		icon: link,
	});
	registerBlockBit('prc-quiz-builder/question-outcome-label', {
		title: __('Correct / Incorrect', 'prc-quiz-builder'),
		icon: check,
		edit: QuestionOutcomeLabelEdit,
	});
	registerBlockBit('prc-quiz-builder/matching-score-bucket', {
		title: __('Matching Score Bucket', 'prc-quiz-builder'),
		icon: check,
	});
}
