<?php
/**
 * Render group results.
 *
 * @package PRC\Platform\Quiz
 */

// $attributes (array): The block attributes.
// $content (string): The block default content.
// $block (WP_Block): The block instance.

$block_wrapper_attrs = get_block_wrapper_attributes();
$message             = '<div class="ui warning message"><p><strong>Group results are updated every %s minutes</strong>. If you do not see recently posted results please wait and refresh the page.</p></div>';

// You can use this method...
echo wp_sprintf(
	'<div %1$s>%2$s</div>',
	$block_wrapper_attrs,
	wp_kses( wp_sprintf( $message, 15 ) . $content, 'post' ),
);
