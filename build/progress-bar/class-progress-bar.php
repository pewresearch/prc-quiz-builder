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
	 * Class name that activates the circles variation.
	 *
	 * @var string
	 */
	public const CIRCLES_CLASS = 'is-style-circles';

	/**
	 * Constructor.
	 *
	 * @param object $loader The loader.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'block_init' );
	}

	/**
	 * Whether the block uses the circles variation.
	 *
	 * @param array $attributes Block attributes.
	 * @return bool
	 */
	private function is_circles_variation( array $attributes ): bool {
		$class_name = $attributes['className'] ?? '';
		return is_string( $class_name ) && str_contains( $class_name, self::CIRCLES_CLASS );
	}

	/**
	 * Visibility attributes shared with the Pages block.
	 *
	 * Stamps `hidden` on group-results URLs so the bar does not flash
	 * before Interactivity hydrates `state.displayPages`.
	 *
	 * @param array $context Block context.
	 * @return array<string, string>
	 */
	private function get_pages_visibility_attributes( array $context ): array {
		$attrs = array(
			'data-wp-bind--hidden' => '!state.displayPages',
		);
		if ( Group_Results::is_group_results_request( $context['prc-quiz/groupsEnabled'] ?? false ) ) {
			$attrs['hidden'] = 'true';
		}
		return $attrs;
	}

	/**
	 * Render the linear bar markup.
	 *
	 * @param array $context Block context.
	 * @return string
	 */
	private function render_bar_markup( array $context ): string {
		$wrapper_attrs = get_block_wrapper_attributes(
			array_merge(
				array(
					'class'                        => 'wp-block-prc-quiz-progress-bar',
					'data-wp-interactive'          => 'prc-quiz/controller',
					'role'                         => 'progressbar',
					'data-wp-bind--aria-valuenow'  => 'state.progressPercentage',
					'aria-valuemin'                => '0',
					'aria-valuemax'                => '100',
					'data-wp-bind--aria-valuetext' => 'state.progressLabel',
				),
				$this->get_pages_visibility_attributes( $context )
			)
		);

		return wp_sprintf(
			'<div %1$s><span class="wp-block-prc-quiz-progress-bar__label" data-wp-text="state.progressLabel"></span><div class="wp-block-prc-quiz-progress-bar__track"><div class="wp-block-prc-quiz-progress-bar__fill" data-wp-style--width="state.progressBarWidth"></div></div></div>',
			$wrapper_attrs
		);
	}

	/**
	 * Render the circles variation markup.
	 *
	 * @param array $context Block context.
	 * @return string
	 */
	private function render_circles_markup( array $context ): string {
		wp_interactivity_state(
			'prc-quiz/controller',
			array(
				'lastPageInView'     => false,
				'progressStepLabels' => array(
					'correct'    => __( 'Correct', 'progress-bar' ),
					'incorrect'  => __( 'Incorrect', 'progress-bar' ),
					'unsure'     => __( 'Not sure', 'progress-bar' ),
					'answered'   => __( 'Answered', 'progress-bar' ),
					'unanswered' => __( 'Unanswered', 'progress-bar' ),
				),
				'progressSkipLabels' => array(
					'skipToLastPage'    => __( 'Skip to last page', 'progress-bar' ),
					'goToFirstPage'     => __( 'Go to first page', 'progress-bar' ),
					'scrollToEnd'       => __( 'Scroll to end', 'progress-bar' ),
					'scrollToFirstPage' => __( 'Scroll to first page', 'progress-bar' ),
				),
			)
		);

		$wrapper_attrs = get_block_wrapper_attributes(
			array_merge(
				array(
					'class'                           => 'wp-block-prc-quiz-progress-bar is-style-circles',
					'data-wp-interactive'             => 'prc-quiz/controller',
					'data-wp-init--observe-last-page' => 'callbacks.onProgressBarInit',
				),
				$this->get_pages_visibility_attributes( $context )
			)
		);

		$skip = '<button type="button" class="wp-block-prc-quiz-progress-bar__skip" data-wp-on--click="actions.onProgressSkipClick" data-wp-text="state.progressSkipLabel" data-wp-bind--hidden="!state.showProgressSkip">' . esc_html( __( 'Skip to last page', 'progress-bar' ) ) . '</button>';

		$header = wp_sprintf(
			'<div class="wp-block-prc-quiz-progress-bar__header"><span class="wp-block-prc-quiz-progress-bar__label" data-wp-text="state.progressLabel"></span>%1$s</div>',
			$skip
		);

		$step = '<template data-wp-each--step="state.progressSteps" data-wp-each-key="context.step.uuid"><li class="wp-block-prc-quiz-progress-bar__step" data-wp-class--is-correct="context.step.isCorrect" data-wp-class--is-incorrect="context.step.isIncorrect" data-wp-class--is-unsure="context.step.isUnsure" data-wp-class--is-unanswered="context.step.isUnanswered" data-wp-text="context.step.mark" data-wp-bind--aria-label="context.step.label"></li></template>';

		return wp_sprintf(
			'<div %1$s>%2$s<ol class="wp-block-prc-quiz-progress-bar__steps" aria-label="%3$s">%4$s</ol></div>',
			$wrapper_attrs,
			$header,
			esc_attr( __( 'Quiz progress by question', 'prc-quiz' ) ),
			$step
		);
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
		unset( $content );
		$context = is_object( $block ) ? ( $block->context ?? array() ) : array();

		if ( $this->is_circles_variation( $attributes ) ) {
			return $this->render_circles_markup( $context );
		}

		return $this->render_bar_markup( $context );
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
