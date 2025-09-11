<?php
/**
 * Embeddable class.
 *
 * @package PRC\Platform\Quiz
 */

namespace PRC\Platform\Quiz;

/**
 * Embeddable class.
 *
 * @package PRC\Platform\Quiz
 */
class Embeddable {
	/**
	 * Constructor.
	 *
	 * @param object $loader The loader.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'block_init' );
	}

	/**
	 * Registers the block using the metadata loaded from the `block.json` file.
	 * Behind the scenes, it registers also all assets so they can be enqueued
	 * through the block editor in the corresponding context.
	 *
	 * @see https://developer.wordpress.org/reference/functions/register_block_type/
	 */
	public function block_init() {
		register_block_type_from_metadata( PRC_QUIZ_DIR . '/build/embeddable' );
	}
}
