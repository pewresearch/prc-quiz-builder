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

$permalink  = get_permalink( (int) $attributes['ref'] );
$iframe_url = add_query_arg(
	array(
		'iframe'    => true,
		'quizEmbed' => true,
	),
	$permalink 
);
$content    = function_exists( 'prc_get_post_as_iframe' ) ? prc_get_post_as_iframe( (int) $attributes['ref'], $iframe_url ) : 'Quiz cannot be embedded at this time.';

// We need to pass the embed option down to the quiz... regardless if the embed option is enabled or not..

// You can use this method...
echo wp_sprintf(
	'<div %1$s>%2$s</div>',
	$block_wrapper_attrs,
	$content,
);
