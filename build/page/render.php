<?php
// PHP file to use when rendering the block type on the server to show on the front end.
// The following variables are exposed to this file:

// $attributes (array): The block attributes.
// $content (string): The block default content.
// $block (WP_Block): The block instance.

$block_wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class' => \PRC\Platform\Block_Utils\classNames(
			array(
				'introduction' => array_key_exists( 'introductionPage', $attributes ) ? $attributes['introductionPage'] : false,
			)
		),
	)
);

// You can use this method...
echo wp_sprintf(
	'<div %1$s>%2$s</div>',
	$block_wrapper_attrs,
	$content,
);
