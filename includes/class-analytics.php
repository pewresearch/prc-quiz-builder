<?php
/**
 * Analytics class.
 *
 * @package PRC\Platform\Quiz
 */

declare(strict_types=1);

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
	 * Legacy report meta key. Frozen: nothing writes it any more.
	 *
	 * Submission counts live in Firebase (see `Submission_Counts`). This key is
	 * only read as the fallback until `wp prc quiz counts cleanup` removes it.
	 */
	public const META_REPORT = '_report';

	/**
	 * Legacy scalar mirror of `_report['total']`. Frozen like `META_REPORT`.
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
		// Frozen legacy counters, kept registered only until `wp prc quiz counts cleanup`
		// has run everywhere. Keep this out of REST meta: the editor writes back every
		// exposed key on save, which clobbers values and fails once the stored value
		// stops matching a schema. Read counts through the `_submissions` REST field.
		register_post_meta(
			'quiz',
			self::META_REPORT,
			array(
				'single'       => true,
				'type'         => 'array',
				'description'  => 'Audience performance metrics for this quiz post, provides a report of the number of completions by time period.',
				'show_in_rest' => false,
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
	 * Get quiz submission report data.
	 *
	 * Reads Firebase through the cached `Submission_Counts` layer and returns
	 * the same shape the `_report` meta used to have.
	 *
	 * @param int $quiz_id Quiz post ID.
	 * @return array
	 */
	public static function get_report_data( int $quiz_id ): array {
		return Submission_Counts::get_report( $quiz_id );
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
	 * Sends one atomic Firebase update after the response is flushed. Writes no
	 * postmeta and no posts, so it never bumps core's `posts` last_changed salt.
	 *
	 * @param int $quiz_id The quiz id.
	 */
	public function log_quiz_submission( $quiz_id ) {
		Submission_Counts::defer_increment( (int) $quiz_id );
	}

	// @TODO: Rest endpoint integration into prc-analytics to offer up and endpoint for Ash to get quiz analytics. We should funnel Ash functionality to prc-analytics whenever possible so these endpoints are stable and consistent.
}
