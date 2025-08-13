<?php
/**
 * Question class.
 *
 * @package PRC\Platform\Quiz
 */

namespace PRC\Platform\Quiz;

use WP_HTML_Tag_Processor;

/**
 * Question class.
 *
 * @package PRC\Platform\Quiz
 */
class Question {
	/**
	 * Constructor.
	 *
	 * @param object $loader The loader.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'block_init' );
	}

	/**
	 * Register the question binding.
	 *
	 * @return void
	 */
	public function register_question_binding() {
		register_block_bindings_source(
			'prc-quiz/question',
			array(
				'label'              => __( 'Quiz Question', 'prc-quiz' ),
				'get_value_callback' => function ( array $source_args, $block_instance ) {
					if ( isset( $block_instance->context['prc-quiz/question/text'] ) ) {
						return $block_instance->context['prc-quiz/question/text'];
					}
					return '';
				},
				'uses_context'       => array( 'prc-quiz/question/text', 'prc-quiz/question/uuid' ),
			)
		);
	}

	/**
	 * Render block callback.
	 *
	 * @param array  $attributes The block attributes.
	 * @param string $content The block content.
	 * @param object $block The block instance.
	 * @return string
	 */
	public function render_block_callback( $attributes, $content, $block ) {
		if ( ! isset( $attributes['uuid'] ) || ! isset( $block->context['prc-quiz/id'] ) ) {
			return '';
		}

		$quiz_id           = $block->context['prc-quiz/id'];
		$question_uuid     = array_key_exists( 'uuid', $attributes ) ? $attributes['uuid'] : false;
		$internal_id       = array_key_exists( 'internalId', $attributes ) ? $attributes['internalId'] : null;
		$randomize_answers = array_key_exists( 'randomizeAnswers', $attributes ) ? $attributes['randomizeAnswers'] : false;

		if ( ! $question_uuid ) {
			return '';
		}

		// Add the question to the quiz state.
		$state = wp_interactivity_state( 'prc-quiz/controller', array() );
		$state[ 'quiz_' . $quiz_id ]['questions'][ $question_uuid ] = array(
			'uuid'       => $question_uuid,
			'text'       => $attributes['question'],
			'internalId' => $internal_id,
			'answers'    => array(),
		);
		wp_interactivity_state( 'prc-quiz/controller', $state );

		// Add interactivity directives to markup.
		$tag = new WP_HTML_Tag_Processor( $content );
		$tag->next_tag();
		$tag->set_attribute( 'data-wp-interactive', 'prc-quiz/controller' );
		$tag->set_attribute( 'data-uuid', $attributes['uuid'] );
		$tag->set_attribute(
			'data-wp-context',
			wp_json_encode(
				array(
					'uuid'                  => $attributes['uuid'],
					'questionUuid'          => $attributes['uuid'],
					'questionType'          => $attributes['type'],
					'conditionalDisplay'    => array_key_exists( 'conditionalDisplay', $attributes ) ? $attributes['conditionalDisplay'] : false,
					'conditionalAnswerUuid' => array_key_exists( 'conditionalAnswerUuid', $attributes ) ? $attributes['conditionalAnswerUuid'] : null,
				) 
			) 
		);
		$tag->set_attribute( 'data-wp-init--on-question-init', 'callbacks.onQuestionInit' );
		if ( array_key_exists( 'conditionalDisplay', $attributes ) && $attributes['conditionalDisplay'] ) {
			$tag->add_class( 'is-conditional' );
			$tag->set_attribute( 'data-wp-bind--hidden', '!state.isConditionalAnswerSelected' );
		}
		// Randomize the order of the answers.
		if ( $randomize_answers ) {
			$tag->add_class( 'is-randomized' );
			while ( $tag->next_tag( array( 'class_name' => 'wp-block-prc-quiz-answer' ) ) ) {
				$tag->set_attribute( 'style', sprintf( 'order: %s;', rand( 50, 100 ) ) );
			}
		}
		return $tag->get_updated_html();
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
			PRC_QUIZ_DIR . '/build/question',
			array(
				'render_callback' => array( $this, 'render_block_callback' ),
			)
		);
		$this->register_question_binding();
	}
}
