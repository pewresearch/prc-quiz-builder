<?php
/**
 * Quiz Interactivity API state for questions and answers.
 *
 * @package PRC\Platform\Quiz
 */

declare(strict_types=1);

namespace PRC\Platform\Quiz;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Builds the `prc-quiz/controller` state entries that the question and answer
 * blocks publish, from block attributes alone.
 *
 * The Question and Answer render callbacks call the same builders, so a quiz
 * whose pages are not rendered (see Pages::skip_hidden_pages()) publishes the
 * same `questions` map that scoring and the results blocks read.
 */
final class Quiz_State {
	/**
	 * Interactivity API store namespace.
	 *
	 * @var string
	 */
	public const STORE = 'prc-quiz/controller';

	/**
	 * Blocks that can hold question blocks the parsed tree does not contain,
	 * for example a synced pattern. A tree with one of these cannot be seeded
	 * without rendering it.
	 *
	 * @var string[]
	 */
	private const OPAQUE_BLOCKS = array(
		'core/block',
		'core/pattern',
		'core/template-part',
		'core/post-content',
		'core/shortcode',
		'core/freeform',
	);

	/**
	 * State entry for a question, without its answers.
	 *
	 * @param array $attributes Question attributes, defaults applied.
	 * @return array|null Null when the question has no uuid.
	 */
	public static function question_entry( array $attributes ): ?array {
		if ( empty( $attributes['uuid'] ) ) {
			return null;
		}
		return array(
			'uuid'                  => $attributes['uuid'],
			'text'                  => $attributes['question'] ?? null,
			'internalId'            => $attributes['internalId'] ?? null,
			'conditionalDisplay'    => array_key_exists( 'conditionalDisplay', $attributes ) ? $attributes['conditionalDisplay'] : false,
			'conditionalAnswerUuid' => array_key_exists( 'conditionalAnswerUuid', $attributes ) ? $attributes['conditionalAnswerUuid'] : null,
			'answers'               => array(),
		);
	}

	/**
	 * State entry for an answer.
	 *
	 * @param array       $attributes    Answer attributes, defaults applied.
	 * @param string|bool $question_uuid Uuid of the question the answer belongs to.
	 * @return array|null Null when the answer has no uuid.
	 */
	public static function answer_entry( array $attributes, $question_uuid ): ?array {
		if ( ! isset( $attributes['uuid'] ) ) {
			return null;
		}

		// Preserve null ("Not sure"): (bool) null would collapse to false.
		// A missing correct (unset default variation) is also neutral, not incorrect.
		$correct = null;
		if ( array_key_exists( 'correct', $attributes ) && null !== $attributes['correct'] ) {
			$correct = (bool) $attributes['correct'];
		}

		$demo_break_values = array();
		if ( ! empty( $attributes['demoBreakValues'] ) ) {
			$parsed = json_decode( $attributes['demoBreakValues'], true );
			if ( is_array( $parsed ) ) {
				$demo_break_values = $parsed;
			}
		}

		$population_percent = '';
		if ( array_key_exists( 'populationPercent', $attributes ) && is_string( $attributes['populationPercent'] ) ) {
			$population_percent = $attributes['populationPercent'];
		}

		return array(
			'uuid'                  => $attributes['uuid'],
			'text'                  => wp_strip_all_tags( (string) ( $attributes['answer'] ?? '' ) ),
			'correct'               => $correct,
			'notSure'               => array_key_exists( 'correct', $attributes ) && null === $attributes['correct'],
			'points'                => array_key_exists( 'points', $attributes ) ? $attributes['points'] : 0,
			'resultsLabel'          => array_key_exists( 'resultsLabel', $attributes ) ? $attributes['resultsLabel'] : null,
			'populationPercent'     => $population_percent,
			'demoBreakValues'       => $demo_break_values,
			'conditional'           => array_key_exists( 'conditionalDisplay', $attributes ) ? $attributes['conditionalDisplay'] : false,
			'conditionalAnswerUuid' => array_key_exists( 'conditionalAnswerUuid', $attributes ) ? $attributes['conditionalAnswerUuid'] : false,
			'questionUuid'          => $question_uuid,
		);
	}

	/**
	 * Merge a patch into one quiz's state.
	 *
	 * @param int|string $quiz_id Quiz post ID.
	 * @param array      $patch   Keys to merge into `quiz_{id}`.
	 */
	public static function merge( $quiz_id, array $patch ): void {
		wp_interactivity_state( self::STORE, array( 'quiz_' . $quiz_id => $patch ) );
	}

	/**
	 * Publish the questions, answers and start-muted flag a parsed block tree
	 * would publish if it rendered, without rendering it.
	 *
	 * @param int|string $quiz_id Quiz post ID.
	 * @param array      $blocks  Parsed blocks, for example `innerBlocks` of the Pages block.
	 * @return bool False when the tree holds a block that can hide questions
	 *              from the parsed tree. Nothing is published then.
	 */
	public static function seed_from_blocks( $quiz_id, array $blocks ): bool {
		$questions = array();
		$muted     = false;
		if ( ! self::collect( $blocks, false, $questions, $muted ) ) {
			return false;
		}

		if ( array() !== $questions ) {
			self::merge( $quiz_id, array( 'questions' => $questions ) );
		}
		if ( $muted ) {
			wp_interactivity_state( self::STORE, array( 'audioMuted' => true ) );
		}
		return true;
	}

	/**
	 * Walk a parsed block tree and collect the state its blocks would publish.
	 *
	 * @param array       $blocks        Parsed blocks.
	 * @param string|bool $question_uuid Uuid of the enclosing question, or false.
	 * @param array       $questions     Collected question entries by uuid, by reference.
	 * @param bool        $muted         Whether a mute button starts muted, by reference.
	 * @return bool False when an opaque block was found.
	 */
	private static function collect( array $blocks, $question_uuid, array &$questions, bool &$muted ): bool {
		foreach ( $blocks as $block ) {
			$name = $block['blockName'] ?? null;
			if ( ! is_string( $name ) ) {
				continue;
			}
			if ( in_array( $name, self::OPAQUE_BLOCKS, true ) ) {
				return false;
			}

			$child_question_uuid = $question_uuid;
			if ( 'prc-quiz/question' === $name ) {
				$entry = self::question_entry( self::prepare_attributes( $name, $block ) );
				if ( null !== $entry ) {
					$questions[ $entry['uuid'] ] = $entry;
					$child_question_uuid         = $entry['uuid'];
				}
			} elseif ( 'prc-quiz/answer' === $name && $question_uuid ) {
				$entry = self::answer_entry( self::prepare_attributes( $name, $block ), $question_uuid );
				if ( null !== $entry ) {
					$questions[ $question_uuid ]['answers'][ $entry['uuid'] ] = $entry;
				}
			} elseif ( 'prc-quiz/mute-audio' === $name && ! empty( $block['attrs']['startMuted'] ) ) {
				$muted = true;
			}

			$inner = $block['innerBlocks'] ?? array();
			if ( is_array( $inner ) && array() !== $inner && ! self::collect( $inner, $child_question_uuid, $questions, $muted ) ) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Block attributes with the block.json defaults applied, as a render callback receives them.
	 *
	 * @param string $name  Block name.
	 * @param array  $block Parsed block.
	 * @return array
	 */
	private static function prepare_attributes( string $name, array $block ): array {
		$attrs      = is_array( $block['attrs'] ?? null ) ? $block['attrs'] : array();
		$block_type = \WP_Block_Type_Registry::get_instance()->get_registered( $name );
		return null === $block_type ? $attrs : $block_type->prepare_attributes_for_render( $attrs );
	}
}
