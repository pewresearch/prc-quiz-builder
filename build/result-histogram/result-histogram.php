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
		// $attributes                       = \PRC\Platform\Block_Utils\get_block_attributes( 'prc-quiz/result-histogram', $attributes );
		// $attributes['barColor']           = \PRC\Platform\Block_Utils\get_color_by_slug( $attributes['barColor'] )['hex'];
		// $attributes['isHighlightedColor'] = \PRC\Platform\Block_Utils\get_color_by_slug( $attributes['isHighlightedColor'] )['hex'];

		$message = array_key_exists( 'message', $attributes ) ? $attributes['message'] : "I scored %s on a Pew Research Center's " . get_the_title() . ' quiz.';
		$data    = json_decode( $attributes['histogramData'] );

		$block_id = wp_unique_id( 'prc-quiz-result-histogram-' );

		$block_attrs = get_block_wrapper_attributes(
			array(
				'id'              => $block_id,
				'data-wp-context' => wp_json_encode(
					array(
						'histogramData'      => $data ?? array(),
						'width'              => $attributes['width'] ?? 100,
						'height'             => $attributes['height'] ?? 300,
						'barWidth'           => $attributes['barWidth'] ?? 24,
						'barLabelPosition'   => $attributes['barLabelPosition'] ?? 0,
						'barLabelCutoff'     => $attributes['barLabelCutoff'] ?? 0,
						'barColor'           => $attributes['barColor'] ?? '#000000',
						'isHighlightedColor' => $attributes['isHighlightedColor'] ?? '#000000',
						'yAxisDomain'        => $attributes['yAxisDomain'] ?? 100,
						'xAxisLabel'         => $attributes['xAxisLabel'] ?? 'Score',
						'message'            => $message,
					) 
				),
			) 
		);

		$histogram_chart_template = '<div class="bars" role="img" aria-label="Distribution of public scores">'
			. '<template data-wp-each--bar="state.histogramBars">'
			. '<div class="bar" data-wp-class--is-highlighted="context.bar.isHighlighted" data-wp-bind--aria-label="context.bar.ariaLabel" data-wp-bind--style="state.getBarStyle">'
			. '<span class="bar__label" data-wp-text="context.bar.label"></span>'
			. '<span class="bar__x" data-wp-text="context.bar.xLabel"></span>'
			. '</div>'
			. '</template>'
			. '</div>';

		return wp_sprintf(
			'<div %1$s><div id="score"><h2>You answered <span data-wp-text="state.answeredCorrectly"></span> questions correctly</h2><h3>You scored better than <span data-wp-text="state.betterThan"></span> of the public, below <span data-wp-text="state.lowerThan"></span> of the public and the same as <span data-wp-text="state.sameAs"></span>.</h3></div><div id="bar-chart" data-wp-on--mount="actions.prepareHistogram">%2$s</div><div class="x-axis-label" data-wp-text="context.xAxisLabel"></div></div>',
			$block_attrs,
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
