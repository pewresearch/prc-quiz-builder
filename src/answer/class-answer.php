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

		$entry = Quiz_State::answer_entry( $attributes, $question_uuid );
		if ( null !== $entry ) {
			Quiz_State::merge( $quiz_id, array( 'questions' => array( $question_uuid => array( 'answers' => array( $attributes['uuid'] => $entry ) ) ) ) );
		}

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
		$tag->set_attribute( 'data-wp-on--pointerdown', 'actions.onAnswerPointerDown' );
		$tag->set_attribute( 'data-wp-on--mouseenter', 'actions.onAnswerMouseEnter' );
		$tag->set_attribute( 'data-wp-class--is-active', 'state.isAnswerSelected' );
		$tag->set_attribute( 'data-wp-class--is-feedback-correct', 'state.isFeedbackCorrectHighlight' );
		$tag->set_attribute( 'data-wp-class--is-feedback-incorrect', 'state.isFeedbackIncorrect' );
		$tag->set_attribute( 'data-wp-bind--disabled', 'state.isAnswerDisabled' );
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
	 * Register the answer block from metadata.
	 *
	 * @return void
	 */
	public function block_init() {
		register_block_type_from_metadata(
			PRC_QUIZ_DIR . '/build/answer',
			array(
				'render_callback' => array( $this, 'render_block_callback' ),
			)
		);
	}
}
