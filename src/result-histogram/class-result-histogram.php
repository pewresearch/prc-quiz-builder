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
	 * Resolve a color slug or hex to a CSS value.
	 *
	 * @param string $color         Color slug, hex, rgb(), or var().
	 * @param string $fallback_slug Preset slug when $color is empty.
	 * @return string
	 */
	private function resolve_color( $color, $fallback_slug ) {
		$color = is_string( $color ) ? trim( $color ) : '';
		if ( '' === $color ) {
			$color = $fallback_slug;
		}
		if ( preg_match( '/^#([0-9A-F]{3}){1,2}$/i', $color ) ) {
			return $color;
		}
		if ( str_starts_with( $color, 'var(' ) || str_starts_with( $color, 'rgb' ) ) {
			return $color;
		}
		return 'var(--wp--preset--color--' . sanitize_title( $color ) . ')';
	}

	/**
	 * Whether histogram data contains at least one positive percent.
	 *
	 * @param array $bins Parsed bins.
	 * @return bool
	 */
	private function has_chart_data( array $bins ) {
		foreach ( $bins as $bin ) {
			$percent = is_array( $bin ) ? ( $bin['percent'] ?? $bin['y'] ?? 0 ) : 0;
			if ( is_numeric( $percent ) && (float) $percent > 0 ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Resolve population bins from controller context, then the saved attribute.
	 *
	 * @param array    $attributes Block attributes.
	 * @param WP_Block $block      Block instance.
	 * @return array
	 */
	private function resolve_bins( $attributes, $block ) {
		$from_context = Histogram_Population::parse( $block->context['prc-quiz/histogram-population'] ?? array() );
		if ( ! empty( $from_context ) ) {
			return $from_context;
		}
		return Histogram_Population::parse( $attributes['histogramData'] ?? '[]' );
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
		unset( $content );
		$bins       = $this->resolve_bins( $attributes, $block );
		$show_chart = $this->has_chart_data( $bins );
		$block_id   = wp_unique_id( 'prc-quiz-result-histogram-' );
		$height     = $attributes['height'] ?? 300;
		$bar_width  = $attributes['barWidth'] ?? 24;

		$bar_color       = ! empty( $attributes['customBarColor'] )
			? $attributes['customBarColor']
			: ( $attributes['barColor'] ?? 'oatmeal' );
		$highlight_color = ! empty( $attributes['customIsHighlightedColor'] )
			? $attributes['customIsHighlightedColor']
			: ( $attributes['isHighlightedColor'] ?? 'mustard' );

		$bar_css       = $this->resolve_color( $bar_color, 'oatmeal' );
		$highlight_css = $this->resolve_color( $highlight_color, 'mustard' );

		$style_parts = array(
			sprintf( '--prc-quiz-histogram-bar-color: %s;', $bar_css ),
			sprintf( '--prc-quiz-histogram-highlight-color: %s;', $highlight_css ),
		);
		if ( $show_chart ) {
			$style_parts[] = sprintf( '--histogram-height: %dpx;', (int) $height );
		}

		$block_attrs = get_block_wrapper_attributes(
			array(
				'id'                  => $block_id,
				'class'               => $show_chart ? 'has-chart' : 'has-no-chart',
				'data-wp-interactive' => 'prc-quiz/controller',
				'style'               => implode( ' ', $style_parts ),
				'data-wp-context'     => wp_json_encode(
					array(
						'histogramData'      => $bins,
						'height'             => sprintf( '%dpx', (int) $height ),
						'barWidth'           => $bar_width,
						'barLabelCutoff'     => $attributes['barLabelCutoff'] ?? 0,
						'barColor'           => $bar_color,
						'isHighlightedColor' => $highlight_color,
						'xAxisLabel'         => $attributes['xAxisLabel'] ?? 'Score',
						'showChart'          => $show_chart,
					)
				),
			)
		);

		if ( ! $show_chart ) {
			return wp_sprintf( '<div %1$s></div>', $block_attrs );
		}

		$chart        = '<div id="bar-chart"><div class="bars" role="img" aria-label="Distribution of public scores" data-wp-style--height="context.height">'
			. '<template data-wp-each--bar="state.histogramBars">'
			. '<div class="bar" data-wp-class--is-highlighted="context.bar.isHighlighted" data-wp-bind--aria-label="context.bar.ariaLabel" data-wp-bind--style="state.getBarStyle">'
			. '<span class="bar__label" data-wp-text="context.bar.label" data-wp-class--is-outside="context.bar.showOutside"></span>'
			. '<span class="bar__x" data-wp-text="context.bar.xLabel"></span>'
			. '</div>'
			. '</template>'
			. '</div></div>';
		$x_axis_label = '<div class="x-axis-label" data-wp-text="context.xAxisLabel"></div>';

		return wp_sprintf( '<div %1$s>%2$s%3$s</div>', $block_attrs, $chart, $x_axis_label );
	}

	/**
	 * Registers the block using the metadata loaded from the `block.json` file.
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
