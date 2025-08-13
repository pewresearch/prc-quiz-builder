<?php
/**
 * Answer class.
 *
 * @package PRC\Platform\Quiz
 */

namespace PRC\Platform\Quiz;

use WP_HTML_Tag_Processor;

/**
 * Answer class.
 */
class Answer {
	/**
	 * Constructor.
	 *
	 * @param object $loader The loader.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'block_init' );
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
		if ( ! isset( $attributes['uuid'] ) ) {
			return '';
		}
		// Get some quiz data from context.
		$quiz_id = isset( $block->context['prc-quiz/id'] ) ? $block->context['prc-quiz/id'] : false;
		// Get the question data from context.
		$question_type = isset( $block->context['prc-quiz/question/type'] ) ? $block->context['prc-quiz/question/type'] : 'single';
		$question_uuid = isset( $block->context['prc-quiz/question/uuid'] ) ? $block->context['prc-quiz/question/uuid'] : false;

		if ( ! $question_uuid && ! $quiz_id ) {
			return '';
		}

		// Add the answer to the question's answers array in quiz state.
		$state = wp_interactivity_state( 'prc-quiz/controller', array() );
		$state[ 'quiz_' . $quiz_id ]['questions'][ $question_uuid ]['answers'][ $attributes['uuid'] ] = array(
			'uuid'                  => $attributes['uuid'],
			'text'                  => $attributes['answer'],
			'correct'               => array_key_exists( 'correct', $attributes ) ? (bool) $attributes['correct'] : false,
			'points'                => array_key_exists( 'points', $attributes ) ? $attributes['points'] : 0,
			'resultsLabel'          => array_key_exists( 'resultsLabel', $attributes ) ? $attributes['resultsLabel'] : null,
			'conditional'           => array_key_exists( 'conditionalDisplay', $attributes ) ? $attributes['conditionalDisplay'] : false,
			'conditionalAnswerUuid' => array_key_exists( 'conditionalAnswerUuid', $attributes ) ? $attributes['conditionalAnswerUuid'] : false,
			'questionUuid'          => $question_uuid,
		);
		wp_interactivity_state( 'prc-quiz/controller', $state );

		// Add interactivity directives to markup.
		$tag = new WP_HTML_Tag_Processor( $content );
		$tag->next_tag();
		$tag->set_attribute( 'data-wp-interactive', 'prc-quiz/controller' );
		$tag->set_attribute(
			'data-wp-context',
			wp_json_encode(
				array(
					'uuid'                  => $attributes['uuid'],
					'answerUuid'            => $attributes['uuid'],
					'questionUuid'          => $question_uuid,
					'questionType'          => $question_type,
					'conditionalDisplay'    => array_key_exists( 'conditionalDisplay', $attributes ) ? $attributes['conditionalDisplay'] : false,
					'conditionalAnswerUuid' => array_key_exists( 'conditionalAnswerUuid', $attributes ) ? $attributes['conditionalAnswerUuid'] : false,
				)
			)
		);
		$tag->set_attribute( 'data-wp-on--click', 'actions.onAnswerClick' );
		$tag->set_attribute( 'data-wp-class--is-active', 'state.isAnswerSelected' );
		if ( array_key_exists( 'conditionalDisplay', $attributes ) && $attributes['conditionalDisplay'] ) {
			$tag->add_class( 'is-conditional' );
			$tag->set_attribute( 'data-wp-bind--hidden', '!state.isConditionalAnswerSelected' );
		}
		// If the answer is being loaded after the quiz has been submitted, disable it.
		if ( get_query_var( 'quizShowResults', false ) ) {
			$tag->set_attribute( 'disabled', 'true' );
		}
		$tag->set_attribute( 'role', 'button' );
		$tag->set_attribute( 'tabindex', '0' );
		$content = $tag->get_updated_html();
		return $content;
	}

	/**
	 * Register the answer binding.
	 *
	 * @return void
	 */
	public function register_answer_binding() {
		register_block_bindings_source(
			'prc-quiz/answer',
			array(
				'label'              => __( 'Quiz Answer', 'prc-quiz' ),
				'get_value_callback' => function ( array $source_args, $block_instance ) {
					return $block_instance->context['prc-quiz/answer/text'];
				},
				'uses_context'       => array( 'prc-quiz/answer/text', 'prc-quiz/answer/uuid' ),
			)
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
			PRC_QUIZ_DIR . '/build/answer',
			array(
				'render_callback' => array( $this, 'render_block_callback' ),
			)
		);
		$this->register_answer_binding();
	}
}
