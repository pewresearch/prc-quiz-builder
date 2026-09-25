<?php
/**
 * Quiz builder block bits registration and host stamps.
 *
 * @package PRC\Platform\Quiz
 */

declare(strict_types=1);

namespace PRC\Platform\Quiz;

use WP_HTML_Tag_Processor;

/**
 * Registers quiz inline bits and stamps host paragraph/heading markup.
 */
class Block_Bits {

	/**
	 * Constructor.
	 *
	 * @param object $loader Plugin loader.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'define_block_bits', 11 );
		$loader->add_filter( 'render_block_core/paragraph', $this, 'stamp_question_outcome_host', 110, 2 );
		$loader->add_filter( 'render_block_core/heading', $this, 'stamp_question_outcome_host', 110, 2 );
		$loader->add_filter( 'render_block_core/paragraph', $this, 'stamp_your_score_host', 110, 2 );
		$loader->add_filter( 'render_block_core/heading', $this, 'stamp_your_score_host', 110, 2 );
		$loader->add_filter( 'render_block_core/paragraph', $this, 'stamp_group_share_host', 110, 2 );
		$loader->add_filter( 'render_block_core/heading', $this, 'stamp_group_share_host', 110, 2 );
	}

	/**
	 * Register quiz bits with the platform-wide @prc/block-bits registry.
	 *
	 * The central bits walker at priority 100 emits the iAPI directives
	 * onto any saved bit span.
	 *
	 * @hook init priority 11
	 */
	public function define_block_bits(): void {
		if ( ! function_exists( '\PRC\Platform\Block_Bits\register_block_bit' ) ) {
			return;
		}

		\PRC\Platform\Block_Bits\register_block_bit(
			'prc-quiz-builder/group-results-link',
			array(
				'label'               => __( 'Quiz: View Group Results Link', 'prc-quiz-builder' ),
				'category'            => 'Quiz',
				'allowed_block_types' => array( 'core/paragraph', 'core/heading' ),
				'render_strategy'     => 'iapi',
				'iapi'                => array(
					'namespace' => 'prc-quiz/controller',
					'text'      => 'state.groupResultsLinkText',
					'bind'      => array(
						'href'   => 'state.groupResultsLinkUrl',
						'hidden' => '!state.hasGroup',
					),
					// Renders as <a> so data-wp-bind--href creates a real clickable link.
					'tag_name'  => 'a',
				),
				'default_text'        => __( "View your group's results.", 'prc-quiz-builder' ),
			)
		);

		\PRC\Platform\Block_Bits\register_block_bit(
			'prc-quiz-builder/question-outcome-label',
			array(
				'label'               => __( 'Quiz: Correct / Incorrect', 'prc-quiz-builder' ),
				'category'            => 'Quiz',
				'allowed_block_types' => array( 'core/paragraph', 'core/heading' ),
				'attributes'          => array(
					'correctLabel'   => array(
						'type'    => 'string',
						'default' => '',
					),
					'incorrectLabel' => array(
						'type'    => 'string',
						'default' => '',
					),
					'unsureLabel'    => array(
						'type'    => 'string',
						'default' => '',
					),
				),
				'render_strategy'     => 'callback',
				'render_callback'     => array( $this, 'render_question_outcome_label_bit' ),
				'default_text'        => __( 'Correct', 'prc-quiz-builder' ),
			)
		);

		\PRC\Platform\Block_Bits\register_block_bit(
			'prc-quiz-builder/matching-score-bucket',
			array(
				'label'               => __( 'Quiz: Matching Score Bucket', 'prc-quiz-builder' ),
				'category'            => 'Quiz',
				'allowed_block_types' => array( 'core/paragraph', 'core/heading' ),
				'render_strategy'     => 'iapi',
				'iapi'                => array(
					'namespace' => 'prc-quiz/controller',
					'text'      => 'state.matchedScoreBucketLabel',
					'bind'      => array(
						'hidden' => 'state.isMatchedScoreBucketLabelHidden',
					),
				),
				'default_text'        => __( 'your score group', 'prc-quiz-builder' ),
			)
		);

		\PRC\Platform\Block_Bits\register_block_bit(
			'prc-quiz-builder/your-score',
			array(
				'label'               => __( 'Quiz: Your Score', 'prc-quiz-builder' ),
				'category'            => 'Quiz',
				'allowed_block_types' => array( 'core/paragraph', 'core/heading' ),
				'render_strategy'     => 'iapi',
				'iapi'                => array(
					'namespace' => 'prc-quiz/controller',
					'text'      => 'state.score',
				),
				'default_text'        => '0',
			)
		);

		\PRC\Platform\Block_Bits\register_block_bit(
			'prc-quiz-builder/group-score-share',
			array(
				'label'               => __( 'Quiz: Group Score Share', 'prc-quiz-builder' ),
				'category'            => 'Quiz',
				'allowed_block_types' => array( 'core/paragraph', 'core/heading' ),
				'render_strategy'     => 'iapi',
				'iapi'                => array(
					'namespace' => 'prc-quiz/controller',
					'text'      => 'state.groupScoreShareLabel',
				),
				'default_text'        => 'X%',
			)
		);

		\PRC\Platform\Block_Bits\register_block_bit(
			'prc-quiz-builder/group-bucket-share',
			array(
				'label'               => __( 'Quiz: Group Bucket Share', 'prc-quiz-builder' ),
				'category'            => 'Quiz',
				'allowed_block_types' => array( 'core/paragraph', 'core/heading' ),
				'attributes'          => array(
					'scoreBucketId' => array(
						'type'    => 'string',
						'default' => '',
					),
				),
				'render_strategy'     => 'iapi',
				'iapi'                => array(
					'namespace' => 'prc-quiz/controller',
					'text'      => 'state.groupBucketShareLabel',
				),
				'default_text'        => 'X%',
			)
		);
	}

	/**
	 * Render the question-outcome-label bit with optional per-bit label overrides.
	 *
	 * Empty override attributes inherit quiz-wide outcomeLabels from the
	 * controller context. Only non-empty overrides are stamped onto the bit
	 * so they do not clobber parent defaults.
	 *
	 * @param array $attributes Sanitized attribute map (camelCase keys).
	 * @return string
	 */
	public function render_question_outcome_label_bit( array $attributes ): string {
		$overrides = array();
		foreach ( array( 'correctLabel', 'incorrectLabel', 'unsureLabel' ) as $key ) {
			$value = isset( $attributes[ $key ] ) ? trim( (string) $attributes[ $key ] ) : '';
			if ( '' !== $value ) {
				$overrides[ $key ] = $value;
			}
		}

		$fallback = __( 'Correct', 'prc-quiz-builder' );
		$tag      = new WP_HTML_Tag_Processor(
			'<span class="prc-block-bit" data-prc-block-bit="prc-quiz-builder/question-outcome-label">' . esc_html( $fallback ) . '</span>'
		);
		$tag->next_tag();
		$tag->set_attribute( 'data-wp-interactive', 'prc-quiz/controller' );
		$tag->set_attribute( 'data-wp-text', 'state.questionOutcomeLabel' );
		$tag->set_attribute( 'data-wp-bind--hidden', '!state.questionOutcomeLabel' );

		// Persist overrides as data-* attrs. The view getter reads them via
		// getElement().dataset — more reliable than same-element data-wp-context
		// for derived state on this nested interactive span.
		foreach ( $overrides as $key => $value ) {
			$tag->set_attribute( 'data-' . strtolower( (string) preg_replace( '/([a-z0-9])([A-Z])/', '$1-$2', $key ) ), $value );
		}

		return $tag->get_updated_html();
	}

	/**
	 * Stamp host paragraph/heading classes so outcome feedback stays hidden
	 * until the user has a selection for the active question.
	 *
	 * Runs after the block-bits walker (priority 110) so the rendered bit
	 * marker is already present in the HTML.
	 *
	 * @hook render_block_core/paragraph
	 * @hook render_block_core/heading
	 *
	 * @param string $block_content The block content.
	 * @param array  $block         The block data.
	 * @return string
	 */
	public function stamp_question_outcome_host( $block_content, $block ) {
		unset( $block );
		if ( ! is_string( $block_content ) || ! str_contains( $block_content, 'prc-quiz-builder/question-outcome-label' ) ) {
			return $block_content;
		}

		$tag = new WP_HTML_Tag_Processor( $block_content );
		if ( ! $tag->next_tag() ) {
			return $block_content;
		}

		$tag->add_class( 'has-prc-quiz-question-outcome' );
		// Stamp awaiting-selection up front so CSS hides the host before hydration.
		$tag->add_class( 'is-awaiting-selection' );
		$tag->set_attribute( 'data-wp-interactive', 'prc-quiz/controller' );
		$tag->set_attribute( 'data-wp-class--is-awaiting-selection', 'state.isQuestionOutcomeLabelHidden' );

		return $tag->get_updated_html();
	}

	/**
	 * Hide Your Score hosts until the viewer has a real score.
	 *
	 * Stamp `hidden` in PHP so the cached heading does not flash `0`.
	 * Interactivity removes it when `state.hasViewerScore` is true.
	 * Runs after the block-bits walker (priority 110) so the bit marker is
	 * already in the HTML.
	 *
	 * @hook render_block_core/paragraph
	 * @hook render_block_core/heading
	 *
	 * @param string $block_content The block content.
	 * @param array  $block         The block data.
	 * @return string
	 */
	public function stamp_your_score_host( $block_content, $block ) {
		unset( $block );
		if ( ! is_string( $block_content ) || ! str_contains( $block_content, 'prc-quiz-builder/your-score' ) ) {
			return $block_content;
		}

		$tag = new WP_HTML_Tag_Processor( $block_content );
		if ( ! $tag->next_tag() ) {
			return $block_content;
		}

		$tag->add_class( 'has-prc-quiz-your-score' );
		$tag->set_attribute( 'data-wp-interactive', 'prc-quiz/controller' );
		$tag->set_attribute( 'data-wp-bind--hidden', '!state.hasViewerScore' );
		$tag->set_attribute( 'hidden', 'true' );

		return $tag->get_updated_html();
	}

	/**
	 * Hide group share hosts until the matching tally is ready.
	 *
	 * Viewer Group Score Share binds `!state.hasGroupScoreShare`. Pinned
	 * Group Bucket Share binds `!state.hasUsableGroupTally`. A mixed host
	 * with Group Score Share keeps the viewer bind so the heading does not
	 * show before the viewer's cluster is ready. Your Score plus bucket
	 * share waits for both a viewer score and a usable tally. Stamp
	 * `hidden` in PHP so cached markup does not flash `X%`. Runs after
	 * the block-bits walker (priority 110).
	 *
	 * @hook render_block_core/paragraph
	 * @hook render_block_core/heading
	 *
	 * @param string $block_content The block content.
	 * @param array  $block         The block data.
	 * @return string
	 */
	public function stamp_group_share_host( $block_content, $block ) {
		unset( $block );
		if ( ! is_string( $block_content ) ) {
			return $block_content;
		}

		$has_viewer     = str_contains( $block_content, 'prc-quiz-builder/group-score-share' );
		$has_bucket     = str_contains( $block_content, 'prc-quiz-builder/group-bucket-share' );
		$has_your_score = str_contains( $block_content, 'prc-quiz-builder/your-score' );
		if ( ! $has_viewer && ! $has_bucket ) {
			return $block_content;
		}

		$tag = new WP_HTML_Tag_Processor( $block_content );
		if ( ! $tag->next_tag() ) {
			return $block_content;
		}

		if ( $has_viewer ) {
			$tag->add_class( 'has-prc-quiz-group-score-share' );
		}
		if ( $has_bucket ) {
			$tag->add_class( 'has-prc-quiz-group-bucket-share' );
		}
		$tag->set_attribute( 'data-wp-interactive', 'prc-quiz/controller' );
		if ( $has_viewer ) {
			$hidden_bind = '!state.hasGroupScoreShare';
		} elseif ( $has_your_score ) {
			$hidden_bind = '!state.hasViewerScoreAndUsableGroupTally';
		} else {
			$hidden_bind = '!state.hasUsableGroupTally';
		}
		$tag->set_attribute( 'data-wp-bind--hidden', $hidden_bind );
		$tag->set_attribute( 'hidden', 'true' );

		return $tag->get_updated_html();
	}
}
