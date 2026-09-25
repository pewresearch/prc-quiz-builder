/**
 * WordPress Dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Legacy save that persisted the power table inner block.
 *
 * @return {Element} Saved inner blocks.
 */
export default function v1Save() {
	return <InnerBlocks.Content />;
}
