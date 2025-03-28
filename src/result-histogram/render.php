<?php
/**
 * Render result histogram.
 *
 * @package PRC\Platform\Quiz
 */

// $attributes (array): The block attributes.
// $content (string): The block default content.
// $block (WP_Block): The block instance.

if ( ! array_key_exists( 'prc-quiz/results/score', $block->context ) || ! is_numeric( $block->context['prc-quiz/results/score'] ) ) {
	return;
}

$attributes['barColor']           = PRC\Platform\Block_Utils\get_color_by_slug( $attributes['barColor'] )['hex'];
$attributes['isHighlightedColor'] = PRC\Platform\Block_Utils\get_color_by_slug( $attributes['isHighlightedColor'] )['hex'];

$score   = $block->context['prc-quiz/results/score'];
$message = array_key_exists( 'message', $attributes ) ? $attributes['message'] : "I scored %s on a Pew Research Center's " . get_the_title() . ' quiz.';
$data    = json_decode( $attributes['histogramData'] );

// loop through $data and find value that matches $score
foreach ( $data as $index => $value ) {
	if ( $value->x === $score ) {
		$value->isHighlighted = true;
		break;
	}
}

$block_attrs = get_block_wrapper_attributes(
	array(
		'id'                      => md5( wp_json_encode( $attributes ) ),
		'data-histogram-data'     => wp_json_encode( $data ),
		'data-width'              => $attributes['width'],
		'data-height'             => $attributes['height'],
		'data-bar-width'          => $attributes['barWidth'],
		'data-bar-label-position' => $attributes['barLabelPosition'],
		'data-bar-label-cutoff'   => $attributes['barLabelCutoff'],
		'data-bar-color'          => $attributes['barColor'],
		'data-highlighted-color'  => $attributes['isHighlightedColor'],
		'data-y-axis-domain'      => $attributes['yAxisDomain'],
		'data-x-axis-label'       => $attributes['xAxisLabel'],
	) 
);

// Filter the array, pulling out nested arrays with same as, better than, or lower
// x values than $score, and reindex result by wrapping in array_values

$same_as = array_values(
	array_filter(
		$data,
		function ( $item ) use ( $score ) {
			return ( $item->x === $score );
		}
	)
);

$better_than = array_values(
	array_filter(
		$data,
		function ( $item ) use ( $score ) {
			return ( $item->x < $score );
		}
	)
);

$below = array_values(
	array_filter(
		$data,
		function ( $item ) use ( $score ) {
			return ( $item->x > $score );
		}
	)
);


// Find the total percentages for better than & below distributions

$better_than_sum = array_reduce(
	$better_than,
	function ( $carry, $item ) {
		$carry += $item->y;
		return $carry;
	}
);

if ( count( $better_than ) === 0 ) {
	$better_than_sum = 0;
}

$below_sum = array_reduce(
	$below,
	function ( $carry, $item ) {
		$carry += $item->y;
		return $carry;
	}
);

if ( count( $below ) === 0 ) {
	$below_sum = 0;
}

// You can use this method...
echo wp_sprintf(
	'<div %1$s><div id="score"><h2>You answered <span>%2$s</span> questions correctly</h2><h3>You scored better than %3$s%% of the public, below %4$s%% of the public and the same as %5$s%%.</div><div id="bar-chart"></div></div>',
	$block_attrs,
	$score,
	$better_than_sum,
	$below_sum,
	$same_as[0]->y
);
