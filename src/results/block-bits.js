/**
 * Editor-side overlay for the quiz-builder group-results-link bit.
 *
 * The PHP-side `define_block_bits()` (in class-results.php) registers the bit
 * on the platform-wide @prc/block-bits registry and projects label /
 * allowedBlockTypes / defaultText onto `window.prcBlockBits.bits` for
 * hydration. This file attaches the editor-only `title` + `icon` overlay.
 *
 * No `edit` component needed — this is a state-driven iAPI bit with no
 * author-supplied attributes; the toolbar inserts it on click.
 */

import { __ } from '@wordpress/i18n';
import { link } from '@wordpress/icons';
import { registerBlockBit } from '@prc/block-bits';

export default function registerBlockBits() {
	registerBlockBit('prc-quiz-builder/group-results-link', {
		title: __('Group Results Link', 'prc-quiz-builder'),
		icon: link,
	});
}
