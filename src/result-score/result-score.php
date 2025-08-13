<?php
/**
 * Result score class.
 *
 * @package PRC\Platform\Quiz
 */

namespace PRC\Platform\Quiz;

/**
 * Result score class.
 *
 * @package PRC\Platform\Quiz
 */

class Result_Score {
	/**
	 * Constructor.
	 *
	 * @param object $loader The loader.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'block_init' );
	}

	/**
	 * Render the block callback.
	 *
	 * @param array    $attributes The block attributes.
	 * @param string   $content The block content.
	 * @param WP_Block $block The block instance.
	 * @return string The block content.
	 */
	public function render_block_callback( $attributes, $content, $block ) {
		$block_wrapper_attrs = get_block_wrapper_attributes();

		return wp_sprintf(
			'<h1 %1$s>You answered <strong><span data-wp-text="state.score"></span> out of %2$s</strong> questions correctly.</h1>',
			$block_wrapper_attrs,
			array_key_exists( 'numberOfQuestions', $attributes ) ? $attributes['numberOfQuestions'] : __( 'N/A', 'prc-quiz' )
		);
	}

	/**
	 * Registers the block using the metadata loaded from the `block.json` file.
	 * Behind the scenes, it registers also all assets so they can be enqueued
	 * through the block editor in the corresponding context.
	 *
	 * @see https://developer.wordpress.org/reference/functions/register_block_type/
	 */
	public function block_init() {
		register_block_type_from_metadata(
			PRC_QUIZ_DIR . '/build/result-score',
			array(
				'render_callback' => array( $this, 'render_block_callback' ),
			)
		);
	}
}
