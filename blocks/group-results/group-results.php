<?php
namespace PRC\Platform\Quiz;
/**
 * Block Name:        Group Results
 * Version:           0.1.0
 * Requires at least: 6.1
 * Requires PHP:      8.0
 * Author:            Seth Rubenstein
 *
 * @package           prc-quiz
 */

class Group_Results {
	public static $version = '0.1.0';
	public static $dir = __DIR__;

	public function __construct( $loader ) {
		$loader->add_action('init', $this, 'block_init');
	}

	/**
	* Registers the block using the metadata loaded from the `block.json` file.
	* Behind the scenes, it registers also all assets so they can be enqueued
	* through the block editor in the corresponding context.
	*
	* @see https://developer.wordpress.org/reference/functions/register_block_type/
	*/
	public function block_init() {
		register_block_type( self::$dir . '/build' );
	}
}
