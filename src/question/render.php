<?php
/**
 * Render question.
 *
 * @package PRC\Platform\Quiz
 */

// $attributes (array): The block attributes.

if ( ! isset( $attributes['uuid'] ) ) {
	return;
}

$block_wrapper_attrs = get_block_wrapper_attributes(
	array(
		'data-uuid' => $attributes['uuid'],
	)
);

echo wp_sprintf(
	'<div %1$s><div class="question-label">%2$s</div><div class="question-answers" data-type="%3$s">%4$s</div></div>',
	$block_wrapper_attrs,
	$attributes['question'],
	$attributes['type'],
	$content,
);
