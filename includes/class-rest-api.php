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
				'permission_callback' => array( $this, 'check_token_header' ),
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
		register_rest_route(
			'prc-api/v3',
			'quiz/library',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'restfully_get_quiz_library' ),
				'args'                => array(
					'page'           => array(
						'type'    => 'integer',
						'default' => 1,
					),
					'per_page'       => array(
						'type'    => 'integer',
						'default' => 20,
					),
					'search'         => array(
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'status'         => array(
						'type'              => 'string',
						'default'           => 'publish,draft,pending,private',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'orderby'        => array(
						'type'    => 'string',
						'default' => 'date',
						'enum'    => array( 'date', 'modified', 'title', 'submissions', 'questions' ),
					),
					'order'          => array(
						'type'    => 'string',
						'default' => 'desc',
						'enum'    => array( 'asc', 'desc', 'ASC', 'DESC' ),
					),
					'quiz_type'      => array(
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'display_type'   => array(
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'research_team'  => array(
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'groups_enabled' => array(
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'permission_callback' => function () {
					return current_user_can( Quiz_List::get_capability() );
				},
			)
		);
		register_rest_route(
			'prc-api/v3',
			'quiz/audiences',
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( $this, 'restfully_list_audiences' ),
					'args'                => array(
						'quiz_id' => array(
							'required' => true,
							'type'     => 'integer',
						),
					),
					'permission_callback' => array( $this, 'can_edit_quiz_from_request' ),
				),
				array(
					'methods'             => 'DELETE',
					'callback'            => array( $this, 'restfully_delete_audience' ),
					'args'                => array(
						'quiz_id'      => array(
							'required' => true,
							'type'     => 'integer',
						),
						'verification' => array(
							'required' => false,
							'type'     => 'string',
						),
						'key'          => array(
							'required' => false,
							'type'     => 'string',
						),
					),
					'permission_callback' => array( $this, 'can_edit_quiz_from_request' ),
				),
			)
		);
		register_rest_route(
			'prc-api/v3',
			'quiz/build-audience',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'restfully_build_audience' ),
				'args'                => array(
					'quiz_id'      => array(
						'required' => true,
						'type'     => 'integer',
					),
					'verification' => array(
						'required' => false,
						'type'     => 'string',
						'default'  => 'verified',
					),
				),
				'permission_callback' => array( $this, 'can_edit_quiz_from_request' ),
			)
		);
	}

	/**
	 * Whether the current user can edit the quiz named in the request.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return bool
	 */
	public function can_edit_quiz_from_request( WP_REST_Request $request ): bool {
		$quiz_id = (int) $request->get_param( 'quiz_id' );
		return $quiz_id > 0 && current_user_can( 'edit_post', $quiz_id );
	}

	/**
	 * GET quiz/audiences
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function restfully_list_audiences( WP_REST_Request $request ) {
		$quiz_id = (int) $request->get_param( 'quiz_id' );
		$post    = get_post( $quiz_id );
		if ( ! $post || Plugin::$post_type !== $post->post_type ) {
			return new WP_Error(
				'invalid_quiz',
				'Quiz not found.',
				array( 'status' => 404 )
			);
		}

		return rest_ensure_response( Audience_Service::list_for_quiz( $quiz_id ) );
	}

	/**
	 * POST quiz/build-audience
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function restfully_build_audience( WP_REST_Request $request ) {
		$quiz_id      = (int) $request->get_param( 'quiz_id' );
		$verification = (string) ( $request->get_param( 'verification' ) ?: 'verified' );

		$result = Audience_Service::build( $quiz_id, $verification );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return rest_ensure_response( $result );
	}

	/**
	 * DELETE quiz/audiences
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function restfully_delete_audience( WP_REST_Request $request ) {
		$quiz_id      = (int) $request->get_param( 'quiz_id' );
		$verification = $request->get_param( 'verification' );
		$key          = $request->get_param( 'key' );

		if ( empty( $verification ) && empty( $key ) ) {
			return new WP_Error(
				'missing_audience_identity',
				'Provide verification or key.',
				array( 'status' => 400 )
			);
		}

		$result = Audience_Service::delete(
			$quiz_id,
			is_string( $verification ) ? $verification : null,
			is_string( $key ) ? $key : null
		);
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return rest_ensure_response( $result );
	}

	/**
	 * Permission callback — ensures the X-PRC-User-Token header is present.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return bool|WP_Error
	 */
	public function check_token_header( WP_REST_Request $request ) {
		$token = $request->get_header( 'X-PRC-User-Token' );
		if ( empty( $token ) ) {
			return new WP_Error(
				'missing_token',
				'ERROR: group_create/401. X-PRC-User-Token header is required.',
				array( 'status' => 401 )
			);
		}
		return true;
	}

	/**
	 * Extract a Turnstile captcha token from a create-group request body.
	 *
	 * @param array $data Decoded JSON body.
	 */
	protected function get_captcha_token_from_request_data( array $data ): string {
		$token = isset( $data['captchaToken'] ) ? (string) $data['captchaToken'] : '';
		if ( '' !== $token ) {
			return $token;
		}

		if (
			isset( $data['fields'] ) &&
			is_array( $data['fields'] ) &&
			function_exists( '\\PRC\\Platform\\find_captcha_token_in_form_fields' )
		) {
			return \PRC\Platform\find_captcha_token_in_form_fields( $data['fields'] );
		}

		return '';
	}

	/**
	 * Verify a Turnstile captcha token for group-create requests.
	 *
	 * Off-platform (missing helper) or unconfigured Turnstile secrets allow
	 * continuation — matching the shared platform contract.
	 *
	 * @param string $token Client-supplied captcha token.
	 * @return true|WP_Error
	 */
	protected function verify_group_create_captcha( string $token ) {
		if ( ! function_exists( '\\PRC\\Platform\\verify_captcha' ) ) {
			return true;
		}

		$remote_ip = function_exists( '\\PRC\\Platform\\get_client_ip' )
			? \PRC\Platform\get_client_ip()
			: '';

		if ( ! \PRC\Platform\verify_captcha( $token, '' !== $remote_ip ? $remote_ip : null ) ) {
			return new WP_Error(
				'captcha_failed',
				'ERROR: group_create/403. Captcha verification failed.',
				array( 'status' => 403 )
			);
		}

		return true;
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

		if ( is_wp_error( $new_group_id ) ) {
			return $new_group_id;
		}

		// Clear any short-lived missing sentinel so early URL visitors recover.
		Object_Cache::invalidate_group_data( (string) $new_group_id );

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

		if ( is_wp_error( $existing_group ) ) {
			return $existing_group;
		}

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

		Object_Cache::invalidate_group_data( (string) $group_id );

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

		return wp_cache_add( $cache_key, time(), Object_Cache::SUBMISSIONS_GROUP, MINUTE_IN_SECONDS );
	}

	/**
	 * Release an in-flight submission lock.
	 *
	 * @param string $quiz_id The quiz id.
	 * @param string $submission_id The client-generated submission id.
	 */
	protected function release_submission_processing_lock( $quiz_id, $submission_id ) {
		$cache_key = $this->get_submission_processing_key( $quiz_id, $submission_id );

		wp_cache_delete( $cache_key, Object_Cache::SUBMISSIONS_GROUP );
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
		$processed = wp_cache_get( $cache_key, Object_Cache::SUBMISSIONS_GROUP );

		if ( false !== $processed ) {
			return $processed;
		}

		$processed = get_transient( $cache_key );

		if ( false !== $processed ) {
			wp_cache_set( $cache_key, $processed, Object_Cache::SUBMISSIONS_GROUP, DAY_IN_SECONDS );
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

		wp_cache_set( $cache_key, $data, Object_Cache::SUBMISSIONS_GROUP, DAY_IN_SECONDS );
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
		if ( empty( $data ) || ! is_array( $data ) ) {
			return new \WP_Error( 'invalid_data', 'ERROR: group_create/400. Invalid data.', array( 'status' => 400 ) );
		}

		$captcha_check = $this->verify_group_create_captcha(
			$this->get_captcha_token_from_request_data( $data )
		);
		if ( is_wp_error( $captcha_check ) ) {
			return $captcha_check;
		}

		$token    = $request->get_header( 'X-PRC-User-Token' );
		$firebase = new \PRC\Platform\Firebase();

		if ( ! $firebase->auth ) {
			return new \WP_Error(
				'firebase_unavailable',
				'ERROR: group_create/503. Firebase is not configured.',
				array( 'status' => 503 )
			);
		}

		try {
			$verified_token = $firebase->auth->verifyIdToken( $token );
			$owner_id       = $verified_token->claims()->get( 'sub' );
		} catch ( \Exception $e ) {
			return new \WP_Error(
				'invalid_token',
				'ERROR: group_create/401. Invalid authentication token.',
				array( 'status' => 401 )
			);
		}

		if ( empty( $owner_id ) ) {
			return new \WP_Error(
				'invalid_token',
				'ERROR: group_create/401. Invalid authentication token.',
				array( 'status' => 401 )
			);
		}

		$group_name = $data['groupName'];
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
			// Runs after idempotent replay / lock acquisition so replays do not
			// consume throttle slots. Fail open when the platform helper is absent.
			if ( function_exists( '\\PRC\\Platform\\rate_limit_hit' ) ) {
				$client_ip = function_exists( '\\PRC\\Platform\\get_client_ip' )
					? \PRC\Platform\get_client_ip()
					: '';
				if ( '' === $client_ip ) {
					$client_ip = 'unknown';
				}
				$throttle_key = 'prc_quiz_submit_' . md5( $client_ip . '_' . $quiz_id );
				if ( \PRC\Platform\rate_limit_hit(
					$throttle_key,
					Object_Cache::THROTTLE_LIMIT,
					Object_Cache::THROTTLE_WINDOW,
					Object_Cache::THROTTLE_GROUP
				) ) {
					return new \WP_Error(
						'rate_limited',
						'Too many submissions. Please try again later.',
						array( 'status' => 429 )
					);
				}
			}

			$group_id = $request->get_param( 'groupId' );
			$is_group = ! empty( $group_id ) && is_string( $group_id );

			$archetypes = new Archetypes(
				array(
					'quiz_id' => $quiz_id,
					'hash'    => $archetype_hash,
				)
			);

			$firebase_available = $archetypes->is_available();

			// Group quizzes require Firebase to update shared tallies — hard-fail when unavailable.
			if ( $is_group && ! $firebase_available ) {
				return new \WP_Error(
					'group-submission-error',
					'Group results could not be saved because the results service is temporarily unavailable. Please try again in a few minutes.',
					array( 'status' => 503 )
				);
			}

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

			$end_time = microtime( true );
			// Get the end time in seconds with microseconds.
			$execution_time = ( $end_time - $start_time ) / 60;
			$response_data  = array(
				'hash' => $archetype_hash,
				'time' => $execution_time,
			);

			// Normal quizzes can still show in-session results without Firebase persistence.
			if ( ! $firebase_available ) {
				$response_data['persisted'] = false;

				if ( null !== $submission_id ) {
					$this->mark_submission_processed( $quiz_id, $submission_id, $response_data );
				}

				return rest_ensure_response( $response_data );
			}

			// If there isn't an archetype yet create one, otherwise just update the hits counter.
			// WP_Error from get means RTDB failed — do not create (would wipe hits if a later write succeeds).
			$existing_archetype = $archetypes->get_archetype();
			if ( is_wp_error( $existing_archetype ) ) {
				$success = $existing_archetype;
			} elseif ( false === $existing_archetype ) {
				$success = $archetypes->create_archetype( $submission, $score );
			} else {
				$success = $archetypes->log_archetype_hit();
			}

			if ( is_wp_error( $success ) ) {
				return new \WP_Error( 'quiz-submission-error', 'ERROR: quiz_submit/500. ' . $success->get_error_message(), array( 'status' => 500 ) );
			}

			$response_data['persisted'] = true;

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
		if ( is_wp_error( $group ) ) {
			return $group;
		}
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

		if ( is_wp_error( $purge_result ) ) {
			return $purge_result;
		}

		return rest_ensure_response(
			array(
				'message'      => 'Archetypes purged successfully for quiz: ' . $quiz_id,
				'purge_result' => $purge_result,
			)
		);
	}

	/**
	 * List quizzes for the DataViews admin screen.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return \WP_REST_Response
	 */
	public function restfully_get_quiz_library( WP_REST_Request $request ) {
		$per_page = max( 1, min( 100, (int) $request->get_param( 'per_page' ) ) );
		$page     = max( 1, (int) $request->get_param( 'page' ) );

		$statuses = array_values(
			array_filter(
				array_map( 'sanitize_key', explode( ',', (string) $request->get_param( 'status' ) ) )
			)
		);
		if ( empty( $statuses ) ) {
			$statuses = array( 'publish', 'draft', 'pending', 'private' );
		}

		$query_args = array(
			'post_type'              => Plugin::$post_type,
			'post_status'            => $statuses,
			'perm'                   => 'editable',
			'posts_per_page'         => $per_page,
			'paged'                  => $page,
			's'                      => (string) $request->get_param( 'search' ),
			'no_found_rows'          => false,
			'ignore_sticky_posts'    => true,
			'update_post_meta_cache' => true,
			'update_post_term_cache' => true,
		);

		$order   = 'asc' === strtolower( (string) $request->get_param( 'order' ) ) ? 'ASC' : 'DESC';
		$orderby = (string) $request->get_param( 'orderby' );

		switch ( $orderby ) {
			case 'submissions':
				$query_args['orderby']  = 'meta_value_num';
				$query_args['meta_key'] = Analytics::META_SUBMISSIONS_TOTAL; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				break;
			case 'questions':
				$query_args['orderby']  = 'meta_value_num';
				$query_args['meta_key'] = Quiz_List::META_QUESTION_COUNT; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				break;
			case 'title':
			case 'modified':
				$query_args['orderby'] = $orderby;
				break;
			default:
				$query_args['orderby'] = 'date';
				break;
		}
		$query_args['order'] = $order;

		$meta_query = $this->build_library_meta_query( $request );
		if ( ! empty( $meta_query ) ) {
			$query_args['meta_query'] = $meta_query; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
		}

		// Sorting or filtering on mirrored meta keys would hide quizzes whose
		// meta has not been written yet.
		if ( isset( $query_args['meta_key'] ) || ! empty( $meta_query ) ) {
			Quiz_List::run_backfill_batch();
		}

		$research_team = (string) $request->get_param( 'research_team' );
		if ( '' !== $research_team && taxonomy_exists( 'research-teams' ) ) {
			$slugs = array_values(
				array_filter( array_map( 'sanitize_title', explode( ',', $research_team ) ) )
			);
			if ( ! empty( $slugs ) ) {
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query
				$query_args['tax_query'] = array(
					array(
						'taxonomy' => 'research-teams',
						'field'    => 'slug',
						'terms'    => $slugs,
					),
				);
			}
		}

		$query = new \WP_Query( $query_args );

		$rows = array_map(
			array( $this, 'shape_library_row' ),
			$query->posts
		);

		$response = rest_ensure_response( $rows );
		$response->header( 'X-WP-Total', (string) (int) $query->found_posts );
		$response->header( 'X-WP-TotalPages', (string) (int) $query->max_num_pages );

		return $response;
	}

	/**
	 * Build the meta_query for the library list filters.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return array
	 */
	private function build_library_meta_query( WP_REST_Request $request ): array {
		$meta_query = array();

		$quiz_type = array_values(
			array_filter( array_map( 'sanitize_key', explode( ',', (string) $request->get_param( 'quiz_type' ) ) ) )
		);
		if ( ! empty( $quiz_type ) ) {
			$meta_query[] = array(
				'key'     => Quiz_List::META_TYPE,
				'value'   => $quiz_type,
				'compare' => 'IN',
			);
		}

		$display_type = array_values(
			array_filter( array_map( 'sanitize_key', explode( ',', (string) $request->get_param( 'display_type' ) ) ) )
		);
		if ( ! empty( $display_type ) ) {
			$meta_query[] = array(
				'key'     => Quiz_List::META_DISPLAY_TYPE,
				'value'   => $display_type,
				'compare' => 'IN',
			);
		}

		$groups_enabled = (string) $request->get_param( 'groups_enabled' );
		if ( '' !== $groups_enabled ) {
			$meta_query[] = array(
				'key'     => Quiz_List::META_GROUPS_ENABLED,
				'value'   => in_array( $groups_enabled, array( '1', 'true' ), true ) ? '1' : '0',
				'compare' => '=',
			);
		}

		return $meta_query;
	}

	/**
	 * Shape a quiz post into a library row for the DataViews UI.
	 *
	 * Falls back to parsing block markup when the list meta has not been synced
	 * yet, and stores the result so later requests read it from meta.
	 *
	 * @param \WP_Post $post The quiz post.
	 * @return array
	 */
	private function shape_library_row( \WP_Post $post ): array {
		$type = (string) get_post_meta( $post->ID, Quiz_List::META_TYPE, true );

		if ( '' === $type ) {
			$parsed = Quiz_List::parse_list_meta( (string) $post->post_content );
			Quiz_List::store_list_meta( $post->ID, $parsed );
			$type           = $parsed['type'];
			$display_type   = $parsed['display_type'];
			$groups_enabled = (bool) $parsed['groups_enabled'];
			$question_count = (int) $parsed['question_count'];
		} else {
			$display_type   = (string) get_post_meta( $post->ID, Quiz_List::META_DISPLAY_TYPE, true );
			$groups_enabled = (bool) get_post_meta( $post->ID, Quiz_List::META_GROUPS_ENABLED, true );
			$question_count = (int) get_post_meta( $post->ID, Quiz_List::META_QUESTION_COUNT, true );
		}

		$report = Analytics::get_report_data( $post->ID );

		$research_teams = array();
		if ( taxonomy_exists( 'research-teams' ) ) {
			$terms = get_the_terms( $post, 'research-teams' );
			if ( is_array( $terms ) ) {
				$research_teams = array_map(
					static fn( \WP_Term $term ) => array(
						'slug'  => $term->slug,
						'label' => $term->name,
					),
					$terms
				);
			}
		}

		return array(
			'id'             => (int) $post->ID,
			'title'          => get_the_title( $post ),
			'status'         => $post->post_status,
			'date'           => mysql2date( 'c', $post->post_date, false ),
			'modified'       => mysql2date( 'c', $post->post_modified, false ),
			'edit_url'       => (string) get_edit_post_link( $post->ID, 'raw' ),
			'view_url'       => (string) get_permalink( $post->ID ),
			'author'         => (string) get_the_author_meta( 'display_name', $post->post_author ),
			'quiz_type'      => $type,
			'display_type'   => $display_type,
			'groups_enabled' => $groups_enabled,
			'question_count' => $question_count,
			'submissions'    => (int) ( $report['total'] ?? 0 ),
			'first_24_hours' => (int) ( $report['first_24_hours'] ?? 0 ),
			'first_week'     => (int) ( $report['first_week'] ?? 0 ),
			'research_teams' => $research_teams,
		);
	}
}
