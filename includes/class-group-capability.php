<?php
/**
 * Community-group capability for a quiz controller.
 *
 * @package PRC\Platform\Quiz
 */

declare(strict_types=1);

namespace PRC\Platform\Quiz;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * One result used by the editor, controller render, create-group, and submit.
 *
 * Shape:
 * - `{ allowed: true, source: 'typology' }` when type is typology
 * - `{ allowed: true, source: 'freeform' }` when type is freeform and
 *   parsed score buckets are empty
 * - `{ allowed: true, source: 'buckets', clusters, buckets }` when type is
 *   quiz or freeform and parsed score buckets are non-empty
 * - `{ allowed: false, source: 'none' }` otherwise
 */
class Group_Capability {
	/**
	 * Capability when groups are not allowed.
	 *
	 * @return array{allowed: false, source: 'none'}
	 */
	public static function none(): array {
		return array(
			'allowed' => false,
			'source'  => 'none',
		);
	}

	/**
	 * Parse the scoreBuckets JSON attribute into exclusive ranges.
	 *
	 * @param string|array $raw Raw attribute value.
	 * @return array<int, array{id: string, label: string, min: int|float, max: int|float}>
	 */
	public static function parse_score_buckets( $raw ): array {
		if ( is_array( $raw ) ) {
			$decoded = $raw;
		} elseif ( is_string( $raw ) && '' !== $raw ) {
			$decoded = json_decode( $raw, true );
		} else {
			$decoded = array();
		}
		if ( ! is_array( $decoded ) ) {
			return array();
		}

		$buckets = array();
		foreach ( $decoded as $index => $item ) {
			if ( ! is_array( $item ) ) {
				continue;
			}
			if ( ! isset( $item['min'], $item['max'] ) ) {
				continue;
			}
			$min       = (float) $item['min'];
			$max       = (float) $item['max'];
			$label     = isset( $item['label'] ) ? (string) $item['label'] : '';
			$buckets[] = array(
				'id'    => isset( $item['id'] ) ? (string) $item['id'] : 'bucket-' . $index,
				'label' => '' !== $label ? $label : 'Group ' . ( $index + 1 ),
				'min'   => min( $min, $max ),
				'max'   => max( $min, $max ),
			);
		}
		return $buckets;
	}

	/**
	 * First matching exclusive bucket for a score, or null.
	 *
	 * @param mixed $score   Numeric score.
	 * @param array $buckets Parsed buckets.
	 * @return array{id: string, label: string, min: int|float, max: int|float}|null
	 */
	public static function match_score_bucket( $score, array $buckets ): ?array {
		if ( ! is_numeric( $score ) ) {
			return null;
		}
		$numeric_score = (float) $score;
		foreach ( $buckets as $bucket ) {
			if ( $numeric_score >= $bucket['min'] && $numeric_score <= $bucket['max'] ) {
				return $bucket;
			}
		}
		return null;
	}

	/**
	 * Seed map of bucket id => 0 for Firebase clusters.
	 *
	 * @param array $buckets Parsed buckets.
	 * @return array<string, int>
	 */
	public static function clusters_from_buckets( array $buckets ): array {
		$clusters = array();
		foreach ( $buckets as $bucket ) {
			$clusters[ $bucket['id'] ] = 0;
		}
		return $clusters;
	}

	/**
	 * Resolve capability from quiz type and raw score buckets.
	 *
	 * @param string       $quiz_type     Controller type attribute.
	 * @param string|array $score_buckets Raw scoreBuckets attribute.
	 * @return array
	 */
	public static function resolve( string $quiz_type, $score_buckets = '[]' ): array {
		if ( 'typology' === $quiz_type ) {
			return array(
				'allowed' => true,
				'source'  => 'typology',
			);
		}

		if ( ! in_array( $quiz_type, array( 'quiz', 'freeform' ), true ) ) {
			return self::none();
		}

		$buckets = self::parse_score_buckets( $score_buckets );
		if ( array() !== $buckets ) {
			return array(
				'allowed'  => true,
				'source'   => 'buckets',
				'clusters' => self::clusters_from_buckets( $buckets ),
				'buckets'  => $buckets,
			);
		}

		if ( 'freeform' === $quiz_type ) {
			return array(
				'allowed' => true,
				'source'  => 'freeform',
			);
		}

		return self::none();
	}

	/**
	 * Resolve capability from controller block attributes.
	 *
	 * @param array $attributes Controller attributes.
	 * @return array
	 */
	public static function resolve_from_attributes( array $attributes ): array {
		$type = isset( $attributes['type'] ) && is_string( $attributes['type'] )
			? $attributes['type']
			: 'quiz';
		return self::resolve( $type, $attributes['scoreBuckets'] ?? '[]' );
	}

	/**
	 * Find the first quiz controller block in a parsed tree.
	 *
	 * @param array $blocks Parsed blocks.
	 * @return array|null
	 */
	public static function find_controller_block( array $blocks ): ?array {
		foreach ( $blocks as $block ) {
			if ( ! is_array( $block ) ) {
				continue;
			}
			if ( 'prc-quiz/controller' === ( $block['blockName'] ?? '' ) ) {
				return $block;
			}
			$inner = $block['innerBlocks'] ?? array();
			if ( is_array( $inner ) && array() !== $inner ) {
				$found = self::find_controller_block( $inner );
				if ( null !== $found ) {
					return $found;
				}
			}
		}
		return null;
	}

	/**
	 * Resolve capability from parsed blocks.
	 *
	 * @param array $blocks Parsed blocks.
	 * @return array
	 */
	public static function from_blocks( array $blocks ): array {
		$controller = self::find_controller_block( $blocks );
		if ( null === $controller ) {
			return self::none();
		}
		return self::resolve_from_attributes( $controller['attrs'] ?? array() );
	}

	/**
	 * Resolve capability from post content.
	 *
	 * @param string $content Post content.
	 * @return array
	 */
	public static function from_content( string $content ): array {
		if ( '' === trim( $content ) || ! function_exists( 'parse_blocks' ) ) {
			return self::none();
		}
		return self::from_blocks( parse_blocks( $content ) );
	}

	/**
	 * Resolve the Firebase cluster key for a submission score.
	 *
	 * Bucket quizzes map a numeric score to the matching bucket id and never
	 * fall back to group_id or an archetype hash. Other sources keep a
	 * non-empty string score, or the caller fallback.
	 *
	 * @param mixed $score      Submitted score.
	 * @param array $capability Capability from resolve().
	 * @param mixed $fallback   Used when source is not buckets.
	 * @return string|null
	 */
	public static function resolve_cluster_key( $score, array $capability, $fallback = null ): ?string {
		if ( 'buckets' === ( $capability['source'] ?? '' ) ) {
			$buckets = $capability['buckets'] ?? array();
			$as_id   = null === $score ? '' : (string) $score;
			foreach ( $buckets as $bucket ) {
				if ( $bucket['id'] === $as_id ) {
					return $bucket['id'];
				}
			}
			$matched = self::match_score_bucket( $score, $buckets );
			return null !== $matched ? $matched['id'] : null;
		}

		if ( is_string( $score ) && '' !== $score ) {
			return $score;
		}

		if ( is_string( $fallback ) && '' !== $fallback ) {
			return $fallback;
		}

		return null;
	}
}
