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
			$loader->add_filter( 'prc_api_endpoints', $this, 'register_rest_endpoints' );
		}
	}

	/**
	 * Verify a quiz nonce.
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
			return new \WP_Error( 'invalid_nonce', 'ERROR: verify_nonce/403. Unauthorized access, NONCE invalid.', array( 'status' => 403 ) );
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

		$purge_archetypes = array(
			'route'               => 'quiz/purge-archetypes',
			'methods'             => 'POST',
			'callback'            => array( $this, 'restfully_purge_archetypes' ),
			'args'                => array(
				'quizId' => array(
					'validate_callback' => function ( $param, $request, $key ) {
						return is_string( $param );
					},
				),
			),
			'permission_callback' => function () {
				return current_user_can( 'manage_options' );
			},
		);

		$endpoints[] = $create_group;
		$endpoints[] = $get_group;
		$endpoints[] = $quiz_submit;
		$endpoints[] = $purge_archetypes;

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
				'ERROR: group_update/404. GROUP_ID: ' . $group_id . '. Group not found.',
				array( 'status' => 404 )
			);
		}

		$success = $groups->update_group( $submission, $score );

		if ( false === $success ) {
			return new WP_Error(
				'group_not_updated',
				'ERROR: group_update/500. GROUP_ID: ' . $group_id . '. Group could not be updated, please contact technical support.',
				array( 'status' => 500 )
			);
		}

		return true;
	}

	/**
	 * Create a group.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return string|false
	 */
	public function restfully_create_group( \WP_REST_Request $request ) {
		$quiz_id     = $request->get_param( 'quizId' );
		$nonce_param = $request->get_param( 'nonce' );
		$nonce       = $this->verify_nonce( $quiz_id, 'prc_quiz_nonce--', $nonce_param );

		if ( true !== $nonce ) {
			return $nonce;
		}

		$data = json_decode( $request->get_body(), true );
		if ( empty( $data ) ) {
			return new \WP_Error( 'invalid_data', 'ERROR: group_create/400. Invalid data.', array( 'status' => 400 ) );
		}
		$group_name = $data['groupName'];
		$owner_id   = $data['ownerId'];
		$answers    = $data['answers'];
		$clusters   = $data['clusters'];

		return $this->create_group(
			$group_name,
			$owner_id,
			$quiz_id,
			$clusters,
			$answers
		);
	}

	/**
	 * Handle scoring the user submission, return hash id.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return string|false
	 */
	public function restfully_submit_quiz( \WP_REST_Request $request ) {
		$start_time = microtime( true );
		$success    = false;
		$quiz_id    = $request->get_param( 'quizId' );

		if ( true === self::$rest_disabled ) {
			return new \WP_Error(
				'quiz-submission-error',
				'ERROR: quiz_submit/403. QUIZ_ID: ' . $quiz_id . '. Quiz submissions are currently disabled. Your submission has been saved locally, please wait and try again at a later time.'
			);
		}
		$nonce_param = $request->get_param( 'nonce' );
		$nonce       = $this->verify_nonce( $quiz_id, 'prc_quiz_nonce--', $nonce_param );

		if ( true !== $nonce ) {
			return $nonce;
		}

		$group_id = $request->get_param( 'groupId' );
		$is_group = ! empty( $group_id ) && is_string( $group_id );

		$user_data = json_decode( $request->get_body(), true );
		
		$archetype_hash = $user_data['hash'];
		$submission     = $user_data['userSubmission'];
		$score          = $user_data['score'];

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
				// If this is a group and it wasnt updated then we should not update the archetype and stop.
				return new \WP_Error( 'group-submission-error', 'ERROR: group_update/500. GROUP_ID: ' . $group_id . '. An error occured when updating this group. We have saved your answers and your place. Wait a few minutes and try again, if you still encounter issues please contact technical support.', array( 'status' => 500 ) );
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

		return rest_ensure_response(
			array(
				'hash' => $archetype_hash,
				'time' => $execution_time,
			) 
		);
	}

	/**
	 * Get a quiz group.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return string|false
	 */
	public function restfully_get_quiz_group( \WP_REST_Request $request ) {
		$group_id = $request->get_param( 'groupId' );
		$nonce    = $this->verify_nonce( $group_id, 'prc_quiz_nonce--', $request->get_param( 'nonce' ) );

		if ( true !== $nonce ) {
			return $nonce;
		}
	
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
	public function restfully_purge_archetypes( \WP_REST_Request $request ) {
		$quiz_id = $request->get_param( 'quizId' );
		// Check user has manage_options capability.
		if ( ! current_user_can( 'manage_options' ) ) {
			return new \WP_Error( 'purge_archetypes_error', 'ERROR: purge_archetypes/403. You do not have permission to purge archetypes.', array( 'status' => 403 ) );
		}
		// Check if quiz id is valid.       
		if ( empty( $quiz_id ) ) {
			return new \WP_Error( 'purge_archetypes_error', 'ERROR: purge_archetypes/400. Quiz ID is required.', array( 'status' => 400 ) );
		}
		// Check that post exists and is of quiz type
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
