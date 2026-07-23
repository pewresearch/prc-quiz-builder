<?php
/**
 * Result histogram class.
 *
 * @package PRC\Platform\Quiz
 */

namespace PRC\Platform\Quiz;

/**
 * Result histogram class.
 *
 * @package PRC\Platform\Quiz
 */
class Result_Histogram {
	/**
	 * Default comparison sentence template.
	 *
	 * @var string
	 */
	const DEFAULT_COMPARISON_TEXT = 'You scored better than {betterThan} of the public, below {lowerThan} of the public and the same as {sameAs}.';

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
		$message = array_key_exists( 'message', $attributes ) ? $attributes['message'] : "I scored %s on a Pew Research Center's " . get_the_title() . ' quiz.';
		$data    = isset( $attributes['histogramData'] ) ? json_decode( $attributes['histogramData'] ) : array();

		$show_score_summary = array_key_exists( 'showScoreSummary', $attributes )
			? (bool) $attributes['showScoreSummary']
			: true;

		$comparison_text = array_key_exists( 'comparisonText', $attributes ) && is_string( $attributes['comparisonText'] ) && '' !== trim( $attributes['comparisonText'] )
			? $attributes['comparisonText']
			: self::DEFAULT_COMPARISON_TEXT;

		$top_performer_text    = array_key_exists( 'topPerformerText', $attributes ) ? (string) $attributes['topPerformerText'] : '';
		$lower_performer_text  = array_key_exists( 'lowerPerformerText', $attributes ) ? (string) $attributes['lowerPerformerText'] : '';
		$top_performer_threshold    = array_key_exists( 'topPerformerThreshold', $attributes ) ? (int) $attributes['topPerformerThreshold'] : 75;
		$lower_performer_threshold  = array_key_exists( 'lowerPerformerThreshold', $attributes ) ? (int) $attributes['lowerPerformerThreshold'] : 25;

		$block_id = wp_unique_id( 'prc-quiz-result-histogram-' );

		$height    = $attributes['height'] ?? 300;
		$bar_width = $attributes['barWidth'] ?? 24;

		$block_attrs = get_block_wrapper_attributes(
			array(
				'id'              => $block_id,
				'data-wp-interactive' => 'prc-quiz/controller',
				'style'           => sprintf( '--histogram-height: %dpx;', (int) $height ),
				'data-wp-context' => wp_json_encode(
					array(
						'histogramData'           => $data ?? array(),
						'width'                   => $attributes['width'] ?? 100,
						'height'                  => sprintf( '%dpx', (int) $height ),
						'barWidth'                => $bar_width,
						'barLabelPosition'        => $attributes['barLabelPosition'] ?? 0,
						'barLabelCutoff'          => $attributes['barLabelCutoff'] ?? 0,
						'barColor'                => $attributes['barColor'] ?? 'oatmeal',
						'isHighlightedColor'      => $attributes['isHighlightedColor'] ?? 'mustard',
						'yAxisDomain'             => $attributes['yAxisDomain'] ?? 100,
						'xAxisLabel'              => $attributes['xAxisLabel'] ?? 'Score',
						'message'                 => $message,
						'showScoreSummary'        => $show_score_summary,
						'comparisonText'          => $comparison_text,
						'topPerformerText'        => $top_performer_text,
						'lowerPerformerText'      => $lower_performer_text,
						'topPerformerThreshold'   => $top_performer_threshold,
						'lowerPerformerThreshold' => $lower_performer_threshold,
					)
				),
			)
		);

		$histogram_chart_template = '<div class="bars" role="img" aria-label="Distribution of public scores" data-wp-style--height="context.height">'
			. '<template data-wp-each--bar="state.histogramBars">'
			. '<div class="bar" data-wp-class--is-highlighted="context.bar.isHighlighted" data-wp-bind--aria-label="context.bar.ariaLabel" data-wp-bind--style="state.getBarStyle">'
			. '<span class="bar__label" data-wp-text="context.bar.label" data-wp-class--is-outside="context.bar.showOutside"></span>'
			. '<span class="bar__x" data-wp-text="context.bar.xLabel"></span>'
			. '</div>'
			. '</template>'
			. '</div>';

		$score_summary = '';
		if ( $show_score_summary ) {
			$score_summary = '<h2>You answered <span data-wp-text="state.answeredCorrectly"></span> questions correctly</h2>';
		}

		return wp_sprintf(
			'<div %1$s><div id="score">%2$s<h3 data-wp-text="state.comparisonSentence"></h3></div><div id="bar-chart">%3$s</div><div class="x-axis-label" data-wp-text="context.xAxisLabel"></div></div>',
			$block_attrs,
			$score_summary,
			$histogram_chart_template
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
			PRC_QUIZ_DIR . '/build/result-histogram',
			array(
				'render_callback' => array( $this, 'render_block_callback' ),
			)
		);
	}
}
