<?php
/**
 * Progress bar class.
 *
 * @package PRC\Platform\Quiz
 */

declare(strict_types=1);

namespace PRC\Platform\Quiz;

/**
 * Progress bar class.
 *
 * @package PRC\Platform\Quiz
 */
class Progress_Bar {
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
	 * @param string   $content    The block content.
	 * @param WP_Block $block      The block instance.
	 * @return string The block content.
	 */
	public function render_block_callback( $attributes, $content, $block ) {
		unset( $attributes, $content, $block );

		$wrapper_attrs = get_block_wrapper_attributes(
			array(
				'class'               => 'wp-block-prc-quiz-progress-bar',
				'data-wp-interactive' => 'prc-quiz/controller',
				'data-wp-bind--hidden' => '!state.displayPages',
				'role'                => 'progressbar',
				'data-wp-bind--aria-valuenow' => 'state.progressPercentage',
				'aria-valuemin'       => '0',
				'aria-valuemax'       => '100',
				'data-wp-bind--aria-valuetext' => 'state.progressLabel',
			)
		);

		return wp_sprintf(
			'<div %1$s><span class="wp-block-prc-quiz-progress-bar__label" data-wp-text="state.progressLabel"></span><div class="wp-block-prc-quiz-progress-bar__track"><div class="wp-block-prc-quiz-progress-bar__fill" data-wp-style--width="state.progressBarWidth"></div></div></div>',
			$wrapper_attrs
		);
	}

	/**
	 * Registers the block using the metadata loaded from the `block.json` file.
	 *
	 * @see https://developer.wordpress.org/reference/functions/register_block_type/
	 */
	public function block_init() {
		register_block_type_from_metadata(
			PRC_QUIZ_DIR . '/build/progress-bar',
			array(
				'render_callback' => array( $this, 'render_block_callback' ),
			)
		);
	}
}
