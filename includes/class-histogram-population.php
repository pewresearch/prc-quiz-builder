<?php
/**
 * Histogram population bins stored on the Quiz Controller.
 *
 * @package PRC\Platform\Quiz
 */

declare(strict_types=1);

namespace PRC\Platform\Quiz;

/**
 * Parse and format histogram population data.
 */
class Histogram_Population {

	/**
	 * Fallback copy before Interactivity hydrates the bound sentence.
	 */
	public const ADULTS_RECEIVING_SCORE_FALLBACK = 'X% of U.S. adults receive this score';

	/**
	 * Parse stored histogram population data.
	 *
	 * Accepts a JSON string or array. Legacy `{x, y}` rows map to
	 * `{correct, percent}`.
	 *
	 * @param mixed $raw Stored value.
	 * @return array<int, array{correct: int, percent: float}>
	 */
	public static function parse( $raw ): array {
		$source = $raw;
		if ( is_string( $raw ) ) {
			$decoded = json_decode( $raw, true );
			$source  = is_array( $decoded ) ? $decoded : array();
		}
		if ( ! is_array( $source ) ) {
			return array();
		}

		$bins = array();
		foreach ( $source as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}
			$correct = $row['correct'] ?? $row['x'] ?? null;
			$percent = $row['percent'] ?? $row['y'] ?? null;
			if ( ! is_numeric( $correct ) || ! is_numeric( $percent ) ) {
				continue;
			}
			$bins[] = array(
				'correct' => (int) $correct,
				'percent' => (float) $percent,
			);
		}

		return $bins;
	}

	/**
	 * Prefer controller bins; fall back to a nested result-histogram block.
	 *
	 * @param array         $attributes Controller attributes.
	 * @param WP_Block|null $block      Controller block instance.
	 * @return array<int, array{correct: int, percent: float}>
	 */
	public static function resolve_from_controller( array $attributes, $block = null ): array {
		$from_attr = self::parse( $attributes['histogramPopulation'] ?? '[]' );
		if ( ! empty( $from_attr ) ) {
			return $from_attr;
		}
		return self::from_block_tree( $block );
	}

	/**
	 * Walk a block tree for the first non-empty histogramData attribute.
	 *
	 * @param mixed $block Block instance or list.
	 * @return array<int, array{correct: int, percent: float}>
	 */
	public static function from_block_tree( $block ): array {
		if ( $block instanceof \WP_Block ) {
			if ( 'prc-quiz/result-histogram' === $block->name ) {
				$parsed = self::parse( $block->attributes['histogramData'] ?? '[]' );
				if ( ! empty( $parsed ) ) {
					return $parsed;
				}
			}
			foreach ( $block->inner_blocks as $inner ) {
				$found = self::from_block_tree( $inner );
				if ( ! empty( $found ) ) {
					return $found;
				}
			}
			return array();
		}

		if ( is_iterable( $block ) ) {
			foreach ( $block as $inner ) {
				$found = self::from_block_tree( $inner );
				if ( ! empty( $found ) ) {
					return $found;
				}
			}
		}

		return array();
	}

	/**
	 * Public share for a given score.
	 *
	 * @param array $bins  Parsed bins.
	 * @param mixed $score Participant score.
	 * @return float
	 */
	public static function percent_for_score( array $bins, $score ): float {
		$score = is_numeric( $score ) ? (int) $score : 0;
		foreach ( $bins as $bin ) {
			if ( (int) ( $bin['correct'] ?? -1 ) === $score ) {
				return (float) ( $bin['percent'] ?? 0 );
			}
		}
		return 0.0;
	}

	/**
	 * Format the bound Adults Receiving This Score sentence.
	 *
	 * @param mixed $percent Share of the public (0–100).
	 * @return string
	 */
	public static function format_adults_receiving_this_score( $percent ): string {
		if ( ! is_numeric( $percent ) ) {
			return self::ADULTS_RECEIVING_SCORE_FALLBACK;
		}
		$rounded = (int) max( 0, min( 100, round( (float) $percent ) ) );
		return sprintf(
			/* translators: %d: percent of U.S. adults who received this score */
			__( '%d%% of U.S. adults receive this score', 'prc-quiz-builder' ),
			$rounded
		);
	}
}
