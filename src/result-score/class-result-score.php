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
		$number_of_questions = array_key_exists( 'numberOfQuestions', $attributes )
			? trim( (string) $attributes['numberOfQuestions'] )
			: '';

		if ( '' === $number_of_questions || 'N/A' === $number_of_questions ) {
			$number_of_questions = '';
		}

		$block_wrapper_attrs = get_block_wrapper_attributes(
			array(
				'data-wp-interactive' => 'prc-quiz/controller',
				'data-wp-context'     => wp_json_encode(
					array(
						'numberOfQuestions' => $number_of_questions,
					)
				),
			)
		);

		return wp_sprintf(
			'<h1 %1$s>You answered <strong><span data-wp-text="state.score"></span> out of <span data-wp-text="state.numberOfQuestionsTotal"></span></strong> questions correctly.</h1>',
			$block_wrapper_attrs
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
