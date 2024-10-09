<?php
// PHP file to use when rendering the block type on the server to show on the front end.
// The following variables are exposed to this file:

// $attributes (array): The block attributes.
// $content (string): The block default content.
// $block (WP_Block): The block instance.

$block_wrapper_attrs = get_block_wrapper_attributes();
$user_icon = \PRC\Platform\Icons\Render('light', 'user-plus');
$thumbs_icon = \PRC\Platform\Icons\Render('light', 'thumbs-up');
$envelope_icon = \PRC\Platform\Icons\Render('light', 'envelope-open');

ob_start();
?>
<div class="ui horizontal list">
	<div class="item"><a href="//twitter.com/pewresearch" class="ui basic large button"><?echo $user_icon ;?> Follow</a></div>
	<div class="item"><a href="//www.facebook.com/pewresearch" class="ui basic large button"><?echo $thumbs_icon ;?> Like</a></div>
	<div class="item"><a href="//www.pewresearch.org/follow-us/" class="ui basic large button"><? echo $envelope_icon ;?> Sign Up</a></div>
</div>
<?php
$list = ob_get_clean();

echo wp_sprintf(
	'<aside %1$s<p>For more research and analysis, follow Pew Research Center<br/>on Twitter, Facebook, or sign up for our weekly newsletter:</p>%2$s</aside>',
	$block_wrapper_attrs,
	$list,
);
