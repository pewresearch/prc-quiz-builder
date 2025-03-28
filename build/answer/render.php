<?php
if ( ! isset( $attributes['uuid'] ) ) {
	return;
}

$block_wrapper_attrs = get_block_wrapper_attributes(
	array(
		'data-uuid' => $attributes['uuid'],
	)
);

echo wp_sprintf(
	'<div %1$s>%2$s</div>',
	$block_wrapper_attrs,
	array_key_exists( 'answer', $attributes ) ? $attributes['answer'] : null,
);
