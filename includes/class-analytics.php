<?php
declare(strict_types=1);
/**
 * Analytics class.
 *
 * @package PRC\Platform\Quiz
 */

namespace PRC\Platform\Quiz;

use WP_Error;

/**
 * Analytics class.
 */
class Analytics {

	/**
	 * Site-local date (Y-m-d) when day-level submission logging begins.
	 *
	 * Midnight on July 31 → first day keys written on 2026-08-01.
	 */
	public const DAY_LOGGING_START_DATE = '2026-08-01';

	/**
	 * Scalar mirror of `_report['total']`.
	 *
	 * `_report` is an array, so `orderby => meta_value_num` cannot sort on it.
	 * The DataViews list sorts its Submissions column on this key instead.
	 */
	public const META_SUBMISSIONS_TOTAL = '_prc_quiz_submissions_total';

	/**
	 * Constructor.
	 *
	 * @param object $loader The loader.
	 */
	public function __construct( $loader = null ) {
		if ( null !== $loader ) {
			$loader->add_action( 'init', $this, 'init_analytics' );
			$loader->add_action( 'rest_api_init', $this, 'register_rest_fields' );
			$loader->add_action( 'prc_quiz_log_submission', $this, 'log_quiz_submission' );
		}
	}

	/**
	 * Whether day-level submission logging is enabled for the current site-local day.
	 *
	 * @return bool
	 */
	public static function is_day_logging_enabled(): bool {
		return wp_date( 'Y-m-d' ) >= self::DAY_LOGGING_START_DATE;
	}

	/**
	 * Initialize analytics.
	 */
	public function init_analytics() {
		$properties = array(
			'first_24_hours' => array(
				'type' => 'integer',
			),
			'first_week'     => array(
				'type' => 'integer',
			),
			'total'          => array(
				'type' => 'integer',
			),
		);

		// Dynamically generate year properties from 2021 to current year + 5 years.
		$current_year = (int) gmdate( 'Y' );
		$start_year   = 2021;
		$end_year     = $current_year + 5;

		for ( $year = $start_year; $year <= $end_year; $year++ ) {
			$properties[ (string) $year ] = array(
				'type' => 'array',
			);
		}

		register_post_meta(
			'quiz',
			'_report',
			array(
				'single'       => true,
				'type'         => 'array',
				'description'  => 'Audience performance metrics for this quiz post, provides a report of the number of completions by time period.',
				'show_in_rest' => array(
					'schema'        => array(
						'items' => array(
							'type'       => 'object',
							'properties' => $properties,
						),
					),
					'auth_callback' => function () {
						return current_user_can( 'edit_posts' );
					},
				),
			),
		);
	}

	/**
	 * Register REST fields.
	 */
	public function register_rest_fields() {
		register_rest_field(
			'quiz',
			'_submissions',
			array(
				'get_callback' => array( $this, 'restfully_get_submission_analytics' ),
				'schema'       => null,
			)
		);

		register_rest_field(
			'quiz',
			'_group_analytics',
			array(
				'get_callback' => array( $this, 'restfully_get_group_analytics' ),
				'schema'       => null,
			)
		);
	}

	/**
	 * Get submission analytics.
	 *
	 * @param array $object The object.
	 * @return array
	 */
	public function restfully_get_submission_analytics( $object ) {
		$post_id = (int) $object['id'];
		return self::get_report_data( $post_id );
	}

	/**
	 * Get group analytics for the editor panel.
	 *
	 * @param array $object REST object.
	 * @return array|WP_Error
	 */
	public function restfully_get_group_analytics( $object ) {
		$post_id = (int) $object['id'];

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return new WP_Error(
				'rest_forbidden',
				'You are not allowed to view group analytics for this quiz.',
				array( 'status' => 403 )
			);
		}

		return self::get_group_analytics( $post_id );
	}

	/**
	 * Get aggregate community group analytics for a quiz.
	 *
	 * @param int $quiz_id Quiz post ID.
	 * @return array|WP_Error
	 */
	public static function get_group_analytics( int $quiz_id ) {
		$cache_key = 'quiz_' . $quiz_id;
		$cached    = wp_cache_get( $cache_key, Object_Cache::GROUP_ANALYTICS_GROUP );

		if ( false !== $cached && is_array( $cached ) ) {
			return $cached;
		}

		$groups = Groups::get_all_for_quiz( $quiz_id );

		if ( is_wp_error( $groups ) ) {
			return $groups;
		}

		$total_submissions = 0;
		foreach ( $groups as $group ) {
			$total_submissions += (int) ( $group['total'] ?? 0 );
		}

		usort(
			$groups,
			static function ( $a, $b ) {
				return ( $b['total'] ?? 0 ) <=> ( $a['total'] ?? 0 );
			}
		);

		$payload = array(
			'total_groups'      => count( $groups ),
			'total_submissions' => $total_submissions,
			'groups'            => $groups,
		);

		wp_cache_set( $cache_key, $payload, Object_Cache::GROUP_ANALYTICS_GROUP, Object_Cache::GROUP_ANALYTICS_TTL );

		return $payload;
	}

	/**
	 * Get normalized quiz report data from post meta.
	 *
	 * @param int $quiz_id Quiz post ID.
	 * @return array
	 */
	public static function get_report_data( int $quiz_id ): array {
		$data = get_post_meta( $quiz_id, '_report', true );

		if ( ! is_array( $data ) ) {
			$data = array();
		}

		if ( ! array_key_exists( 'first_24_hours', $data ) ) {
			$data['first_24_hours'] = 0;
		}
		if ( ! array_key_exists( 'first_week', $data ) ) {
			$data['first_week'] = 0;
		}
		if ( ! array_key_exists( 'total', $data ) ) {
			$data['total'] = 0;
		}

		return $data;
	}

	/**
	 * Persist quiz report data to post meta.
	 *
	 * @param int   $quiz_id Quiz post ID.
	 * @param array $data    Report data.
	 */
	public static function save_report_data( int $quiz_id, array $data ): void {
		update_post_meta( $quiz_id, '_report', $data );
		update_post_meta( $quiz_id, self::META_SUBMISSIONS_TOTAL, (int) ( $data['total'] ?? 0 ) );
	}

	/**
	 * Sum archetype hit counts from Firebase for a quiz.
	 *
	 * @param int $quiz_id Quiz post ID.
	 * @return int|WP_Error
	 */
	public static function sum_archetype_hits( int $quiz_id ) {
		if ( ! class_exists( '\PRC\Platform\Firebase' ) ) {
			return new WP_Error(
				'firebase_not_available',
				'Firebase integration is not available.',
				array( 'status' => 500 )
			);
		}

		$firebase = new \PRC\Platform\Firebase();

		if ( null === $firebase->db ) {
			return new WP_Error(
				'firebase_not_configured',
				'Firebase database is not configured.',
				array( 'status' => 500 )
			);
		}

		try {
			$archetypes = $firebase->db
				->getReference( 'quiz/' . $quiz_id . '/archetypes' )
				->getValue();

			if ( empty( $archetypes ) || ! is_array( $archetypes ) ) {
				return 0;
			}

			$total_hits = 0;
			foreach ( $archetypes as $archetype ) {
				if ( is_array( $archetype ) && isset( $archetype['hits'] ) ) {
					$total_hits += (int) $archetype['hits'];
				}
			}

			return $total_hits;
		} catch ( \Exception $e ) {
			return new WP_Error(
				'firebase_error',
				'Failed to sum archetype hits from Firebase: ' . $e->getMessage(),
				array( 'status' => 500 )
			);
		}
	}

	/**
	 * Log quiz submission.
	 *
	 * @param int $quiz_id The quiz id.
	 */
	public function log_quiz_submission( $quiz_id ) {
		$date  = wp_date( 'Y-m-d' );
		$month = wp_date( 'm' );
		$year  = wp_date( 'Y' );
		$day   = wp_date( 'd' );

		$quiz_pub_date = get_the_date( 'Y-m-d', $quiz_id );

		$data = self::get_report_data( $quiz_id );

		// If the quiz was published within the last 24 hours, increment the first_24_hours counter.
		if ( $quiz_pub_date >= $date ) {
			++$data['first_24_hours'];
		}
		// If the quiz was published within the last week, increment the first_week counter.
		if ( $quiz_pub_date >= wp_date( 'Y-m-d', strtotime( '-1 week' ) ) ) {
			++$data['first_week'];
		}

		if ( ! array_key_exists( $year, $data ) ) {
			$data[ $year ] = array();
		}
		if ( ! array_key_exists( $month, $data[ $year ] ) ) {
			$data[ $year ][ $month ] = 1;
		} else {
			++$data[ $year ][ $month ];
		}

		if ( self::is_day_logging_enabled() ) {
			if ( ! isset( $data[ $year ]['_days'] ) || ! is_array( $data[ $year ]['_days'] ) ) {
				$data[ $year ]['_days'] = array();
			}
			if ( ! isset( $data[ $year ]['_days'][ $month ] ) || ! is_array( $data[ $year ]['_days'][ $month ] ) ) {
				$data[ $year ]['_days'][ $month ] = array();
			}
			if ( ! array_key_exists( $day, $data[ $year ]['_days'][ $month ] ) ) {
				$data[ $year ]['_days'][ $month ][ $day ] = 0;
			}
			++$data[ $year ]['_days'][ $month ][ $day ];
		}

		++$data['total'];

		self::save_report_data( $quiz_id, $data );
	}

	// @TODO: Rest endpoint integration into prc-analytics to offer up and endpoint for Ash to get quiz analytics. We should funnel Ash functionality to prc-analytics whenever possible so these endpoints are stable and consistent.
}
