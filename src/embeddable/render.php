<?php
/**
 * Render embeddable quiz.
 *
 * @package PRC\Platform\Quiz
 */

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
echo wp_sprintf(
	'<div %1$s>%2$s</div>', //phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	$block_wrapper_attrs, //phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	$content, //phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
);
