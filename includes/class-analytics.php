<?php
/**
 * Analytics class.
 *
 * @package PRC\Platform\Quiz
 */
namespace PRC\Platform\Quiz;

/**
 * Analytics class.
 */
class Analytics {

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
	}

	/**
	 * Get submission analytics.
	 *
	 * @param array $object The object.
	 * @return array
	 */
	public function restfully_get_submission_analytics( $object ) {
		$post_id = (int) $object['id'];
		return get_post_meta( $post_id, '_report', true );
	}

	/**
	 * Log quiz submission.
	 *
	 * @param int $quiz_id The quiz id.
	 */
	public function log_quiz_submission( $quiz_id ) {
		// Get todays date.
		$date = gmdate( 'Y-m-d' );
		// Get todays month.
		$month = gmdate( 'm' );
		// Get todays year.
		$year = gmdate( 'Y' );

		$quiz_pub_date = get_the_date( 'Y-m-d', $quiz_id );

		$data = get_post_meta( $quiz_id, '_report', true );

		if ( ! $data ) {
			$data = array(
				'first_24_hours' => 0,
				'first_week'     => 0,
				'total'          => 0,
			);
		}

		// If the quiz was published within the last 24 hours, increment the first_24_hours counter.
		if ( $quiz_pub_date >= $date ) {
			++$data['first_24_hours'];
		}
		// If the quiz was published within the last week, increment the first_week counter.
		if ( $quiz_pub_date >= gmdate( 'Y-m-d', strtotime( '-1 week' ) ) ) {
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

		++$data['total'];

		update_post_meta( $quiz_id, '_report', $data );
	}

	// @TODO: Rest endpoint integration into prc-analytics to offer up and endpoint for Ash to get quiz analytics. We should funnel Ash functionality to prc-analytics whenever possible so these endpoints are stable and consistent.
}
