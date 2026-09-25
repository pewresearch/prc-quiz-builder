/**
 * Editor-side overlay for quiz-builder block bits.
 *
 * The PHP-side `define_block_bits()` (in class-block-bits.php) registers the bit
 * on the platform-wide @prc/block-bits registry and projects label /
 * allowedBlockTypes / defaultText onto `window.prcBlockBits.bits` for
 * hydration. This file attaches the editor-only `title` + `icon` overlay.
 *
 * The question-outcome-label and group-bucket-share bits include an `edit`
 * popover for per-bit attributes.
 */

import { __ } from '@wordpress/i18n';
import { link, check, percent, group } from '@wordpress/icons';
import { registerBlockBit } from '@prc/block-bits';
import QuestionOutcomeLabelEdit from './question-outcome-label-edit';
import GroupBucketShareEdit from './group-bucket-share-edit';
import {
	GROUP_BUCKET_SHARE_BIT,
	GROUP_SCORE_SHARE_BIT,
	YOUR_SCORE_BIT,
} from './bit-names.js';

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
	registerBlockBit(YOUR_SCORE_BIT, {
		title: __('Your Score', 'prc-quiz-builder'),
		icon: percent,
	});
	registerBlockBit(GROUP_SCORE_SHARE_BIT, {
		title: __('Group Score Share', 'prc-quiz-builder'),
		icon: group,
	});
	registerBlockBit(GROUP_BUCKET_SHARE_BIT, {
		title: __('Group Bucket Share', 'prc-quiz-builder'),
		icon: group,
		edit: GroupBucketShareEdit,
	});
}
