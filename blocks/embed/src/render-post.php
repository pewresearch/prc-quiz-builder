<?php
// PHP file to use when rendering the block type on the server to show on the front end.
// The following variables are exposed to this file:

// $attributes (array): The block attributes.
// $content (string): The block default content.
// $block (WP_Block): The block instance.

$block_wrapper_attrs = get_block_wrapper_attributes(
	array(
		'ref-id' => $attributes['ref'],
	)
);
$content             = get_post_field( 'post_content', (int) $attributes['ref'] );
$content             = apply_filters( 'the_content', $content );

echo wp_sprintf(
	'<div %1$s>%2$s</div>',
	esc_html( $block_wrapper_attrs ),
	$content,
);
