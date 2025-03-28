<?php
namespace PRC\Platform\Quiz;

use WP_REST_Request, WP_Error;

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
			$loader->add_filter( 'prc_api_endpoints', $this, 'register_rest_endpoints' );
		}
	}

	/**
	 * Verify a nonce.
	 *
	 * @param string $quiz_id The quiz id.
	 * @param string $key The key.
	 * @param string $nonce The nonce.
	 * @return bool|WP_Error
	 */
	public function verify_nonce( $quiz_id, $key, $nonce ) {
		if ( wp_verify_nonce( $nonce, $key . $quiz_id ) ) {
			return true;
		} else {
			return new \WP_Error( 'invalid_nonce', 'Unauthorized access, NONCE invalid. ERROR CODE: 403', array( 'status' => 403 ) );
		}
	}

	/**
	 * Register REST endpoints.
	 *
	 * @param array $endpoints The endpoints.
	 * @return array
	 */
	public function register_rest_endpoints( $endpoints ) {
		$create_group = array(
			'route'               => 'quiz/create-group',
			'methods'             => 'POST',
			'callback'            => array( $this, 'restfully_create_group' ),
			'args'                => array(
				'quizId' => array(
					'validate_callback' => function ( $param, $request, $key ) {
						return is_string( $param );
					},
				),
				'nonce'  => array(
					'validate_callback' => function ( $param, $request, $key ) {
						return is_string( $param );
					},
				),
			),
			'permission_callback' => function () {
				return true;
			},
		);

		$get_quiz_data = array(
			'route'               => 'quiz/get',
			'methods'             => 'GET',
			'callback'            => array( $this, 'restfully_get_quiz' ),
			'args'                => array(
				'quizId'  => array(
					'validate_callback' => function ( $param, $request, $key ) {
						return is_string( $param );
					},
				),
				'nonce'   => array(
					'validate_callback' => function ( $param, $request, $key ) {
						return is_string( $param );
					},
				),
				'groupId' => array(
					'validate_callback' => function ( $param, $request, $key ) {
						return is_string( $param );
					},
				),
			),
			'permission_callback' => function () {
				return true;
			},
		);

		$quiz_submit = array(
			'route'               => 'quiz/submit',
			'methods'             => 'POST',
			'callback'            => array( $this, 'restfully_submit_quiz' ),
			'args'                => array(
				'quizId'  => array(
					'validate_callback' => function ( $param, $request, $key ) {
						return is_string( $param );
					},
				),
				'groupId' => array(
					'validate_callback' => function ( $param, $request, $key ) {
						return is_string( $param );
					},
				),
				'nonce'   => array(
					'validate_callback' => function ( $param, $request, $key ) {
						return is_string( $param );
					},
				),
			),
			'permission_callback' => function () {
				return true;
			},
		);

		$get_group = array(
			'route'               => 'quiz/get-group',
			'methods'             => 'GET',
			'callback'            => array( $this, 'restfully_get_quiz_group' ),
			'args'                => array(
				'groupId' => array(
					'validate_callback' => function ( $param, $request, $key ) {
						return is_string( $param );
					},
				),
				'nonce'   => array(
					'validate_callback' => function ( $param, $request, $key ) {
						return is_string( $param );
					},
				),
			),
			'permission_callback' => function () {
				return true;
			},
		);

		$endpoints[] = $create_group;
		$endpoints[] = $get_quiz_data;
		$endpoints[] = $quiz_submit;
		$endpoints[] = $get_group;

		return $endpoints;
	}

	/**
	 * Create a group.
	 *
	 * @param string $group_name The group name.
	 * @param int    $owner_id The owner id.
	 * @param int    $quiz_id The quiz id.
	 * @param array  $typology_groups The typology groups.
	 * @return string|WP_Error
	 */
	public function create_group( $group_name, $owner_id, $quiz_id = false, $typology_groups = array() ) {
		if ( false === $quiz_id ) {
			return new WP_Error(
				'invalid_quiz_id',
				'Invalid quiz id. ERROR CODE: 400',
				array( 'status' => 400 )
			);
		}
		if ( empty( $typology_groups ) ) {
			return new WP_Error(
				'no_typology_groups',
				'No typology groups found',
				array( 'status' => 404 )
			);
		}

		$api       = new API( $quiz_id );
		$quiz_data = $api->get_quiz_data( false );

		$groups = new Groups(
			array(
				'quiz_id'    => $quiz_id,
				'group_name' => $group_name,
				'owner_id'   => $owner_id,
			)
		);

		$new_group_id = $groups->create_group(
			$quiz_data,
			$typology_groups,
		);

		return $new_group_id;
	}

	/**
	 * Update a group.
	 *
	 * @param string $quiz_id The quiz id.
	 * @param string $group_id The group id.
	 * @param array  $submission The submission.
	 * @param int    $score The score.
	 * @return bool|WP_Error
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
				'Group not found. ERROR CODE: 404',
				array( 'status' => 404 )
			);
		}

		$success = $groups->update_group( $submission, $score );

		if ( false === $success ) {
			return new WP_Error(
				'group_not_updated',
				'Group could not be updated, please contact technical support. Give technical support this error code: 0006 and this id: ' . $group_id,
				array( 'status' => 500 )
			);
		}

		return true;
	}

	/**
	 * Create a group.
	 *
	 * @param WP_REST_Request $request
	 * @return string|false
	 */
	public function restfully_create_group( \WP_REST_Request $request ) {
		$quiz_id     = $request->get_param( 'quizId' );
		$nonce_param = $request->get_param( 'nonce' );
		$nonce       = $this->verify_nonce( $quiz_id, 'prc_quiz_submission_nonce--', $nonce_param );

		if ( true !== $nonce ) {
			return $nonce;
		}

		$data       = json_decode( $request->get_body(), true );
		$group_name = $data['name'];
		$owner_id   = $data['owner']['id'];
		// You must pass through your typology group id's as an array with values set to 0 to initialize the group.
		$typology_groups = apply_filters( 'prc_quiz_community_group_clusters', array(), $quiz_id );

		return $this->create_group(
			$group_name,
			$owner_id,
			$quiz_id,
			$typology_groups
		);
	}

	/**
	 * Get a quiz.
	 *
	 * @param WP_REST_Request $request
	 * @return string|false
	 */
	public function restfully_get_quiz( \WP_REST_Request $request ) {
		$quiz_id = $request->get_param( 'quizId' );
		$nonce   = $this->verify_nonce( $quiz_id, 'prc_quiz_nonce--', $request->get_param( 'nonce' ) );

		if ( true !== $nonce ) {
			return $nonce;
		}
		$api  = new API( $quiz_id );
		$data = $api->get_quiz_data( true );
		return $data;
	}

	/**
	 * Handle scoring the user submission, return hash id.
	 *
	 * @param WP_REST_Request $request
	 * @return string|false
	 */
	public function restfully_submit_quiz( \WP_REST_Request $request ) {
		if ( true === self::$rest_disabled ) {
			return new \WP_Error(
				'quiz-submission-error',
				'Quiz submissions are currently disabled. Your submission has been saved locally, please wait and try again at a later time.'
			);
		}
		$start_time = microtime( true );

		$success = false;

		$quiz_id     = $request->get_param( 'quizId' );
		$nonce_param = $request->get_param( 'nonce' );
		$nonce       = $this->verify_nonce( $quiz_id, 'prc_quiz_submission_nonce--', $nonce_param );

		if ( true !== $nonce ) {
			return $nonce;
		}

		$group_id   = $request->get_param( 'groupId' );
		$is_group   = ! empty( $group_id ) && is_string( $group_id );
		$submission = json_decode( $request->get_body(), true );
		$hash       = md5( wp_json_encode( $submission ) );
		
		$api  = new API( $quiz_id );
		$data = $api->get_quiz_data( false );
		$type = $data['type'];

		$archetypes = new Archetypes(
			array(
				'quiz_id' => $quiz_id,
				'hash'    => $hash,
			)
		);

		// Perform calculation of score, only if there is no submission and OR if this is a group that needs to be updated.
		$score = false;
		
		if ( false === $archetypes->get_archetype() || $is_group ) {
			$score = $api->score_quiz(
				array(
					'quizId'     => $quiz_id,
					'data'       => $data,
					'submission' => $submission,
					'type'       => $type,
				) 
			);
		}

		// If the quiz is a group quiz, we need to update the group results.
		if ( ! empty( $group_id ) && is_string( $group_id ) ) { 
			$updated = $this->update_group( $quiz_id, $group_id, $submission, $score );
			if ( true !== $updated ) {
				// If this is a group and it wasnt updated then we should not update the archetype and stop.
				return new \WP_Error( 'group-submission-error', 'An error occured when updating this group. We have saved your answers and your place. Wait a few minutes and try again, if you still encounter issues please contact technical support. Give technical support this error code: 0004 and this id: ' . $group_id );
			}
		}

		// If there isn't an archetype yet create one, otherwise just update the hits counter.
		if ( false === $archetypes->get_archetype() ) {
			$success = $archetypes->create_archetype( $submission, $score );
		} else {
			$success = $archetypes->log_archetype_hit();
		}

		if ( is_wp_error( $success ) ) {
			return new \WP_Error( 'quiz-submission-error', 'An error occured when submitting your quiz. We have saved your answers and your place in the quiz. Wait a few minutes, refresh the page, and try submitting again. If you still encounter issues please contact technical support. Give support this error code 0003 and this id: ' . $hash, $success );
		}

		do_action( 'prc_quiz_log_submission', $quiz_id );

		$end_time       = microtime( true ); // Get the end time in seconds with microseconds
		$execution_time = ( $end_time - $start_time ) / 60;

		return rest_ensure_response(
			array(
				'hash' => $hash,
				'time' => $execution_time,
			) 
		);
	}

	/**
	 * Get a quiz group.
	 *
	 * @param WP_REST_Request $request
	 * @return string|false
	 */
	public function restfully_get_quiz_group( \WP_REST_Request $request ) {
		$group_id = $request->get_param( 'groupId' );
		// $nonce = $this->verify_nonce( $group_id, 'prc_quiz_group_nonce--', $request->get_param( 'nonce' ) );

		// if ( true !== $nonce ) {
		// return $nonce;
		// }
	
		$group = $this->get_group( $group_id );

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
			return new \WP_Error( 'group_results_url_error', 'Could not get permalink for quiz id: ' . $quiz_id );
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
			return new \WP_Error( 'group_not_found', 'Group ' . $group_id . ' not found, please check the url you were given by your group administrator.', array( 'status' => 404 ) );
		}
		if ( null === get_post( $group->quiz_id ) ) {
			return new \WP_Error( 'quiz_not_found', 'Quiz ' . $group->quiz_id . ' not found, please contact technical support.', array( 'status' => 404 ) );
		}

		$typology_groups = json_decode( $group->typology_groups, true );
		$answers         = json_decode( $group->answers, true );

		$api  = new API( $group->quiz_id );
		$data = $api->get_quiz_data( true );

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
			'quiz_data'       => $data,
			'results_url'     => is_wp_error( $group_results_url ) ? null : $group_results_url,
			'group_url'       => get_permalink( $group->quiz_id ) . '?group=' . $group->group_id,
			'quiz_name'       => get_the_title( $group->quiz_id ),
		);
	}
}
