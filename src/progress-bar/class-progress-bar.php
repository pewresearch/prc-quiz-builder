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
	 * Render the linear bar markup.
	 *
	 * @return string
	 */
	private function render_bar_markup(): string {
		$wrapper_attrs = get_block_wrapper_attributes(
			array(
				'class'                         => 'wp-block-prc-quiz-progress-bar',
				'data-wp-interactive'           => 'prc-quiz/controller',
				'data-wp-bind--hidden'          => '!state.displayPages',
				'role'                          => 'progressbar',
				'data-wp-bind--aria-valuenow'   => 'state.progressPercentage',
				'aria-valuemin'                 => '0',
				'aria-valuemax'                 => '100',
				'data-wp-bind--aria-valuetext'  => 'state.progressLabel',
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
	 * @return string
	 */
	private function render_circles_markup(): string {
		wp_interactivity_state(
			'prc-quiz/controller',
			array(
				'progressStepLabels' => array(
					'correct'    => __( 'Correct', 'progress-bar' ),
					'incorrect'  => __( 'Incorrect', 'progress-bar' ),
					'unsure'     => __( 'Not sure', 'progress-bar' ),
					'answered'   => __( 'Answered', 'progress-bar' ),
					'unanswered' => __( 'Unanswered', 'progress-bar' ),
				),
			)
		);

		$wrapper_attrs = get_block_wrapper_attributes(
			array(
				'class'                => 'wp-block-prc-quiz-progress-bar is-style-circles',
				'data-wp-interactive'  => 'prc-quiz/controller',
				'data-wp-bind--hidden' => '!state.displayPages',
			)
		);

		$step = '<template data-wp-each--step="state.progressSteps" data-wp-each-key="context.step.uuid"><li class="wp-block-prc-quiz-progress-bar__step" data-wp-class--is-correct="context.step.isCorrect" data-wp-class--is-incorrect="context.step.isIncorrect" data-wp-class--is-unsure="context.step.isUnsure" data-wp-class--is-unanswered="context.step.isUnanswered" data-wp-text="context.step.mark" data-wp-bind--aria-label="context.step.label"></li></template>';

		return wp_sprintf(
			'<div %1$s><span class="wp-block-prc-quiz-progress-bar__label" data-wp-text="state.progressLabel"></span><ol class="wp-block-prc-quiz-progress-bar__steps" aria-label="%2$s">%3$s</ol></div>',
			$wrapper_attrs,
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
		unset( $content, $block );

		if ( $this->is_circles_variation( $attributes ) ) {
			return $this->render_circles_markup();
		}

		return $this->render_bar_markup();
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
