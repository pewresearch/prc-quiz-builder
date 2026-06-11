<?php
/**
 * The REST API class.
 *
 * This class is responsible for registering and handling the REST API endpoints for the quiz plugin.
 *
 * @package PRC\Platform\Quiz
 * @since 1.0.0
 * @version 1.0.0
 */

namespace PRC\Platform\Quiz;

use WP_REST_Request, WP_Error;

/**
 * The REST API class.
 *
 * This class is responsible for registering and handling the REST API endpoints for the quiz plugin.
 *
 * @package PRC\Platform\Quiz
 * @since 1.0.0
 * @version 1.0.0
 */
class Rest_API {
	/**
	 * Quickly disable the REST API in emergency situations.
	 *
	 * @var bool
	 */
	public static $rest_disabled = false;

	/**
	 * Constructor.
	 *
	 * @param object $loader The loader.
	 */
	public function __construct( $loader ) {
		if ( null !== $loader ) {
			$loader->add_action( 'rest_api_init', $this, 'register_rest_endpoints' );
		}
	}

	/**
	 * Validate a quiz post ID.
	 *
	 * @param mixed $param The REST parameter value.
	 * @return bool
	 */
	private function is_valid_quiz_id( $param ) {
		return is_numeric( $param ) && 0 < absint( $param );
	}

	/**
	 * Ensure a quiz post exists, is the quiz post type, and is published.
	 *
	 * @param int $quiz_id The quiz id.
	 * @return true|WP_Error
	 */
	private function validate_quiz_post( int $quiz_id ) {
		$post = get_post( $quiz_id );
		if ( ! $post || Plugin::$post_type !== $post->post_type || 'publish' !== $post->post_status ) {
			return new \WP_Error(
				'quiz_not_found',
				'ERROR: quiz/404. Quiz not found.',
				array( 'status' => 404 )
			);
		}

		return true;
	}

	/**
	 * Register REST endpoints.
	 *
	 * @hook rest_api_init
	 */
	public function register_rest_endpoints() {
		register_rest_route(
			'prc-api/v3',
			'quiz/create-group',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'restfully_create_group' ),
				'args'                => array(
					'quizId' => array(
						'validate_callback' => function ( $param ) {
							return $this->is_valid_quiz_id( $param );
						},
					),
				),
				'permission_callback' => function () {
					return true;
				},
			)
		);
		register_rest_route(
			'prc-api/v3',
			'quiz/get-group',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'restfully_get_quiz_group' ),
				'args'                => array(
					'groupId' => array(
						'validate_callback' => function ( $param ) {
							return is_string( $param );
						},
					),
				),
				'permission_callback' => function () {
					return true;
				},
			)
		);
		register_rest_route(
			'prc-api/v3',
			'quiz/submit',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'restfully_submit_quiz' ),
				'args'                => array(
					'quizId'  => array(
						'validate_callback' => function ( $param ) {
							return $this->is_valid_quiz_id( $param );
						},
					),
					'groupId' => array(
						'validate_callback' => function ( $param ) {
							return is_string( $param );
						},
					),
				),
				'permission_callback' => function () {
					return true;
				},
			)
		);
		register_rest_route(
			'prc-api/v3',
			'quiz/purge-archetypes',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'restfully_purge_archetypes' ),
				'args'                => array(
					'quizId' => array(
						'validate_callback' => function ( $param ) {
							return $this->is_valid_quiz_id( $param );
						},
					),
				),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);
	}

	/**
	 * Create a group.
	 *
	 * @param string $group_name The group name.
	 * @param int    $owner_id The owner id.
	 * @param int    $quiz_id The quiz id.
	 * @param array  $clusters The clusters data.
	 * @param array  $answers All answer uuids for the quiz.
	 * @return string|WP_Error
	 */
	public function create_group( $group_name, $owner_id, $quiz_id = false, $clusters = array(), $answers = array() ) {
		if ( false === $quiz_id ) {
			return new WP_Error(
				'invalid_quiz_id',
				'ERROR: group_create/400. Invalid quiz id.',
				array( 'status' => 400 )
			);
		}
		if ( empty( $clusters ) ) {
			return new WP_Error(
				'no_clusters',
				'ERROR: group_create/404. No clusters found.',
				array( 'status' => 404 )
			);
		}

		$groups = new Groups(
			array(
				'quiz_id'    => $quiz_id,
				'group_name' => $group_name,
				'owner_id'   => $owner_id,
			)
		);

		$new_group_id = $groups->create_group(
			$clusters,
			$answers,
		);

		$group_url = $groups->generate_group_url();

		return array(
			'group_id'  => $new_group_id,
			'group_url' => $group_url,
		);
	}

	/**
	 * Update a group.
	 *
	 * @param string $quiz_id The quiz id.
	 * @param string $group_id The group id.
	 * @param array  $submission The submission.
	 * @param string $score The score / cluster identifier.
	 * @return true|WP_Error
	 */
	public function update_group( $quiz_id, $group_id, $submission, $score ) {
		$groups = new Groups(
			array(
				'quiz_id'  => $quiz_id,
				'group_id' => $group_id,
			)
		);

		$existing_group = $groups->get_group();

		if ( false === $existing_group ) {
			return new WP_Error(
				'group_not_found',
				'Group not found.',
				array( 'status' => 404 )
			);
		}

		$success = $groups->update_group( $submission, $score );

		if ( is_wp_error( $success ) ) {
			return $success;
		}

		if ( true !== $success ) {
			return new WP_Error(
				'group_not_updated',
				'Group could not be updated.',
				array( 'status' => 500 )
			);
		}

		wp_cache_delete( $group_id, 'prc_quiz_group_data' );

		return true;
	}

	/**
	 * Get the cache key for a processed submission id.
	 *
	 * @param string $quiz_id The quiz id.
	 * @param string $submission_id The client-generated submission id.
	 * @return string
	 */
	protected function get_submission_idempotency_key( $quiz_id, $submission_id ) {
		return 'prc_quiz_submission_' . md5( $quiz_id . ':' . $submission_id );
	}

	/**
	 * Get the cache key for an in-flight submission id.
	 *
	 * @param string $quiz_id The quiz id.
	 * @param string $submission_id The client-generated submission id.
	 * @return string
	 */
	protected function get_submission_processing_key( $quiz_id, $submission_id ) {
		return $this->get_submission_idempotency_key( $quiz_id, $submission_id ) . '_processing';
	}

	/**
	 * Acquire an in-flight submission lock.
	 *
	 * @param string $quiz_id The quiz id.
	 * @param string $submission_id The client-generated submission id.
	 * @return bool
	 */
	protected function acquire_submission_processing_lock( $quiz_id, $submission_id ) {
		$cache_key = $this->get_submission_processing_key( $quiz_id, $submission_id );

		return wp_cache_add( $cache_key, time(), 'prc_quiz_submissions', MINUTE_IN_SECONDS );
	}

	/**
	 * Release an in-flight submission lock.
	 *
	 * @param string $quiz_id The quiz id.
	 * @param string $submission_id The client-generated submission id.
	 */
	protected function release_submission_processing_lock( $quiz_id, $submission_id ) {
		$cache_key = $this->get_submission_processing_key( $quiz_id, $submission_id );

		wp_cache_delete( $cache_key, 'prc_quiz_submissions' );
	}

	/**
	 * Get a processed submission marker.
	 *
	 * @param string $quiz_id The quiz id.
	 * @param string $submission_id The client-generated submission id.
	 * @return array|false
	 */
	protected function get_processed_submission( $quiz_id, $submission_id ) {
		$cache_key = $this->get_submission_idempotency_key( $quiz_id, $submission_id );
		$processed = wp_cache_get( $cache_key, 'prc_quiz_submissions' );

		if ( false !== $processed ) {
			return $processed;
		}

		$processed = get_transient( $cache_key );

		if ( false !== $processed ) {
			wp_cache_set( $cache_key, $processed, 'prc_quiz_submissions', DAY_IN_SECONDS );
		}

		return $processed;
	}

	/**
	 * Mark a submission id as processed.
	 *
	 * @param string $quiz_id The quiz id.
	 * @param string $submission_id The client-generated submission id.
	 * @param array  $data The response data to return for duplicate retries.
	 */
	protected function mark_submission_processed( $quiz_id, $submission_id, $data ) {
		$cache_key = $this->get_submission_idempotency_key( $quiz_id, $submission_id );

		wp_cache_set( $cache_key, $data, 'prc_quiz_submissions', DAY_IN_SECONDS );
		set_transient( $cache_key, $data, DAY_IN_SECONDS );
	}

	/**
	 * Validate a client-generated submission id.
	 *
	 * @param mixed $submission_id The submission id.
	 * @return bool
	 */
	protected function is_valid_submission_id( $submission_id ) {
		return is_string( $submission_id ) && 1 === preg_match( '/^[a-zA-Z0-9_-]{8,128}$/', $submission_id );
	}

	/**
	 * Create a group.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return string|false
	 */
	public function restfully_create_group( WP_REST_Request $request ) {
		$quiz_id = absint( $request->get_param( 'quizId' ) );
		$valid   = $this->validate_quiz_post( $quiz_id );

		if ( true !== $valid ) {
			return $valid;
		}

		$data = json_decode( $request->get_body(), true );
		if ( empty( $data ) ) {
			return new \WP_Error( 'invalid_data', 'ERROR: group_create/400. Invalid data.', array( 'status' => 400 ) );
		}
		$group_name = $data['groupName'];
		$owner_id   = $data['ownerId'];
		$answers    = $data['answers'];
		$clusters   = $data['clusters'];

		$result = $this->create_group(
			$group_name,
			$owner_id,
			$quiz_id,
			$clusters,
			$answers
		);

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		// Optionally seed the group with the owner's own submission when creating
		// a group from the results page (owner_submission and owner_score present).
		$owner_submission = isset( $data['ownerSubmission'] ) && is_array( $data['ownerSubmission'] ) ? $data['ownerSubmission'] : null;
		$owner_score      = isset( $data['ownerScore'] ) ? $data['ownerScore'] : null;

		if ( ! empty( $owner_submission ) && ! empty( $owner_score ) ) {
			$group_cluster = is_string( $owner_score ) ? $owner_score : (string) $result['group_id'];
			$this->update_group( $quiz_id, $result['group_id'], $owner_submission, $group_cluster );
		}

		return $result;
	}

	/**
	 * Handle scoring the user submission, return hash id.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return string|false
	 */
	public function restfully_submit_quiz( WP_REST_Request $request ) {
		$start_time = microtime( true );
		$success    = false;
		$quiz_id    = absint( $request->get_param( 'quizId' ) );

		if ( true === self::$rest_disabled ) {
			return new \WP_Error(
				'quiz-submission-error',
				'ERROR: quiz_submit/403. QUIZ_ID: ' . $quiz_id . '. Quiz submissions are currently disabled. Your submission has been saved locally, please wait and try again at a later time.'
			);
		}

		$valid = $this->validate_quiz_post( $quiz_id );

		if ( true !== $valid ) {
			return $valid;
		}

		$user_data = json_decode( $request->get_body(), true );

		if ( ! is_array( $user_data ) ) {
			return new \WP_Error(
				'invalid_data',
				'ERROR: quiz_submit/400. Invalid submission data.',
				array( 'status' => 400 )
			);
		}

		$archetype_hash = $user_data['hash'] ?? null;
		$submission     = $user_data['userSubmission'] ?? null;
		$score          = $user_data['score'] ?? null;
		$submission_id  = isset( $user_data['submissionId'] )
			? sanitize_text_field( (string) $user_data['submissionId'] )
			: null;

		if ( ! Archetypes::is_valid_hash( $archetype_hash ) || ! is_array( $submission ) ) {
			return new \WP_Error(
				'invalid_submission',
				'ERROR: quiz_submit/400. Invalid quiz submission.',
				array( 'status' => 400 )
			);
		}

		if ( null !== $submission_id && ! $this->is_valid_submission_id( $submission_id ) ) {
			return new \WP_Error(
				'invalid_submission_id',
				'ERROR: quiz_submit/400. Invalid submission id.',
				array( 'status' => 400 )
			);
		}

		if ( null !== $submission_id ) {
			$processed_submission = $this->get_processed_submission( $quiz_id, $submission_id );

			if ( false !== $processed_submission ) {
				return rest_ensure_response(
					array_merge(
						$processed_submission,
						array(
							'idempotent' => true,
						)
					)
				);
			}

			if ( ! $this->acquire_submission_processing_lock( $quiz_id, $submission_id ) ) {
				$processed_submission = $this->get_processed_submission( $quiz_id, $submission_id );

				if ( false !== $processed_submission ) {
					return rest_ensure_response(
						array_merge(
							$processed_submission,
							array(
								'idempotent' => true,
							)
						)
					);
				}

				return new \WP_Error(
					'submission_processing',
					'ERROR: quiz_submit/409. This quiz submission is already being processed.',
					array( 'status' => 409 )
				);
			}
		}

		try {
			// Per-IP rate limiting: 100 submissions per quiz per minute (fixed window).
			// wp_cache_add only sets when key is absent, establishing the window TTL once.
			// wp_cache_incr atomically increments without resetting the TTL.
			$client_ip = function_exists( '\\PRC\\Platform\\get_client_ip' )
				? \PRC\Platform\get_client_ip()
				: '';
			if ( '' === $client_ip ) {
				$client_ip = 'unknown';
			}
			$throttle_key = 'prc_quiz_submit_' . md5( $client_ip . '_' . $quiz_id );
			wp_cache_add( $throttle_key, 0, 'prc_quiz_throttle', MINUTE_IN_SECONDS );
			$recent_count = wp_cache_incr( $throttle_key, 1, 'prc_quiz_throttle' );

			if ( $recent_count > 100 ) {
				return new \WP_Error(
					'rate_limited',
					'Too many submissions. Please try again later.',
					array( 'status' => 429 )
				);
			}

			$group_id = $request->get_param( 'groupId' );
			$is_group = ! empty( $group_id ) && is_string( $group_id );

			$archetypes = new Archetypes(
				array(
					'quiz_id' => $quiz_id,
					'hash'    => $archetype_hash,
				)
			);

			// If the quiz is a group quiz, we need to update the group results.
			if ( $is_group ) {
				$group_cluster = is_string( $score ) ? $score : $archetype_hash;
				$updated       = $this->update_group( $quiz_id, $group_id, $submission, $group_cluster );
				if ( true !== $updated ) {
					if ( is_wp_error( $updated ) ) {
						return $updated;
					}
					return new \WP_Error(
						'group-submission-error',
						'An error occurred when updating this group. We have saved your answers and your place. Wait a few minutes and try again, if you still encounter issues please contact technical support.',
						array( 'status' => 500 )
					);
				}
			}

			// If there isn't an archetype yet create one, otherwise just update the hits counter.
			if ( false === $archetypes->get_archetype() ) {
				$success = $archetypes->create_archetype( $submission, $score );
			} else {
				$success = $archetypes->log_archetype_hit();
			}

			if ( is_wp_error( $success ) ) {
				return new \WP_Error( 'quiz-submission-error', 'ERROR: quiz_submit/500. ' . $success->get_error_message(), array( 'status' => 500 ) );
			}

			$end_time = microtime( true );
			// Get the end time in seconds with microseconds.
			$execution_time = ( $end_time - $start_time ) / 60;
			$response_data  = array(
				'hash' => $archetype_hash,
				'time' => $execution_time,
			);

			if ( null !== $submission_id ) {
				$this->mark_submission_processed( $quiz_id, $submission_id, $response_data );
			}

			do_action( 'prc_quiz_log_submission', $quiz_id );

			return rest_ensure_response( $response_data );
		} finally {
			if ( null !== $submission_id ) {
				$this->release_submission_processing_lock( $quiz_id, $submission_id );
			}
		}
	}

	/**
	 * Get a quiz group.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return string|false
	 */
	public function restfully_get_quiz_group( WP_REST_Request $request ) {
		$group_id = $request->get_param( 'groupId' );
		$group    = $this->get_group( $group_id );

		return rest_ensure_response( $group );
	}

	/**
	 * Get a group results url.
	 *
	 * @param string $group_id The group id.
	 * @param string $quiz_id The quiz id.
	 * @return string|WP_Error
	 */
	protected function get_group_results_url( $group_id, $quiz_id ) {
		$permalink = get_permalink( $quiz_id );
		if ( ! $permalink ) {
			return new \WP_Error( 'group_results_url_error', 'ERROR: group_results_url/404. QUIZ_ID: ' . $quiz_id . '. Could not get permalink for quiz id: ' . $quiz_id );
		}
		return $permalink . 'results/?group=' . $group_id;
	}

	/**
	 * Get a group.
	 *
	 * @param string $group_id The group id.
	 * @return string|WP_Error
	 */
	public function get_group( $group_id ) {
		$groups = new Groups(
			array(
				'group_id' => $group_id,
			)
		);
		$group  = $groups->get_group();
		if ( ! $group ) {
			return new \WP_Error( 'group_not_found', 'ERROR: group_get/404. GROUP_ID: ' . $group_id . '. Group not found, please check the url you were given by your group administrator.', array( 'status' => 404 ) );
		}
		// Ensure group is cast as an object.

		$group = (object) $group;
		if ( null === get_post( $group->quiz_id ) ) {
			return new \WP_Error( 'quiz_not_found', 'ERROR: group_get/404. QUIZ_ID: ' . $group->quiz_id . '. Quiz not found, please contact technical support.', array( 'status' => 404 ) );
		}

		$typology_groups = json_decode( $group->typology_groups, true );
		$answers         = json_decode( $group->answers, true );

		$group_results_url = $this->get_group_results_url( $group_id, $group->quiz_id );

		return array(
			'group_id'        => $group->group_id,
			'name'            => $group->name,
			'quiz_id'         => $group->quiz_id,
			'created'         => $group->created,
			'owner'           => $group->owner,
			'typology_groups' => $typology_groups,
			'answers'         => $answers,
			'total'           => $group->total,
			'results_url'     => is_wp_error( $group_results_url ) ? null : $group_results_url,
			'group_url'       => get_permalink( $group->quiz_id ) . '?group=' . $group->group_id,
			'quiz_name'       => get_the_title( $group->quiz_id ),
		);
	}

	/**
	 * Purge the archetypes.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return string|WP_Error
	 */
	public function restfully_purge_archetypes( WP_REST_Request $request ) {
		$quiz_id = absint( $request->get_param( 'quizId' ) );
		// Check user has manage_options capability.
		if ( ! current_user_can( 'manage_options' ) ) {
			return new \WP_Error( 'purge_archetypes_error', 'ERROR: purge_archetypes/403. You do not have permission to purge archetypes.', array( 'status' => 403 ) );
		}
		// Check if quiz id is valid.
		if ( empty( $quiz_id ) ) {
			return new \WP_Error( 'purge_archetypes_error', 'ERROR: purge_archetypes/400. Quiz ID is required.', array( 'status' => 400 ) );
		}
		// Check that post exists and is of quiz type.
		$post = get_post( $quiz_id );
		if ( ! $post || Plugin::$post_type !== $post->post_type ) {
			return new \WP_Error( 'purge_archetypes_error', 'ERROR: purge_archetypes/404. Quiz not found.', array( 'status' => 404 ) );
		}

		$archetypes   = new Archetypes(
			array(
				'quiz_id' => $quiz_id,
			)
		);
		$purge_result = $archetypes->purge_archetypes();

		return rest_ensure_response(
			array(
				'message'      => 'Archetypes purged successfully for quiz: ' . $quiz_id,
				'purge_result' => $purge_result,
			)
		);
	}
}
