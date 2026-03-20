<?php
/**
 * Groups class.
 *
 * @package PRC\Platform\Quiz
 */

namespace PRC\Platform\Quiz;

use Community_Groups_Query, WP_Error, Kreait\Firebase\Factory;

/**
 * Groups class.
 */
class Groups {
	/**
	 * The quiz id.
	 *
	 * @var int
	 */
	public $quiz_id;

	/**
	 * The quiz slug.
	 *
	 * @var string
	 */
	public $quiz_slug;

	/**
	 * The group name.
	 *
	 * @var string
	 */
	public $group_name;

	/**
	 * The owner id.
	 *
	 * @var int
	 */
	public $owner_id;

	/**
	 * The group id.
	 *
	 * @var int
	 */
	public $group_id;

	/**
	 * The database.
	 *
	 * @var \Firebase\Firebase\Database
	 */
	public $db;

	/**
	 * The groups version.
	 *
	 * @var int
	 */
	public static $groups_version = 2;

	/**
	 * Constructor.
	 *
	 * @param array $args The arguments.
	 */
	public function __construct( $args ) {
		$args = wp_parse_args(
			$args,
			array(
				'quiz_id'    => null,
				'owner_id'   => null,
				'group_id'   => false,
				'group_name' => null,
			)
		);

		$firebase      = new \PRC\Platform\Firebase();
		$this->db      = $firebase->db;
		$this->quiz_id = $args['quiz_id'];
		if ( $args['quiz_id'] ) {
			$this->quiz_slug = get_post_field( 'post_name', $args['quiz_id'] );
		}
		$this->group_name = $args['group_name'];
		$this->owner_id   = $args['owner_id'];

		if ( false === $args['group_id'] ) {
			$this->group_id = $this->generate_group_id();
		} else {
			$this->group_id = $args['group_id'];
		}
	}

	/**
	 * Generate a group id.
	 *
	 * @param string $ext The extension.
	 * @return string
	 */
	public function generate_group_id( $ext = null ) {
		return md5(
			wp_json_encode(
				array(
					$this->group_name,
					$this->owner_id,
					$this->quiz_id,
					$ext,
				)
			)
		);
	}

	/**
	 * Generate a results url.
	 *
	 * @return string
	 */
	public function generate_results_url() {
		$permalink = get_permalink( $this->quiz_id );
		return wp_sprintf( '%sgroup/%s/results/', $permalink, $this->group_id );
	}

	/**
	 * Generate a group url.
	 *
	 * @return string
	 */
	public function generate_group_url() {
		$permalink = get_permalink( $this->quiz_id );
		return wp_sprintf( '%sgroup/%s', $permalink, $this->group_id );
	}

	/**
	 * Upgrade a legacy group if it exists.
	 *
	 * @return array|false
	 */
	public function upgrade_legacy_group_if_exists() {
		$query     = new Community_Groups_Query(
			array(
				'group_id' => $this->group_id,
				'limit'    => 1,
				'fields'   => array( 'name', 'created', 'quiz_id', 'typology_groups', 'answers', 'total', 'owner' ),
			)
		);
		$result    = array_pop( $query->items );
		$to_return = false;
		// If we have a result, then we should create a new group in the new database, then remove it from the old database and then return the result we just created.
		if ( ! empty( $result ) ) {
			$this->owner_id = $result->owner;
			$to_return      = array(
				'name'            => $result->name,
				'quiz_id'         => (int) $result->quiz_id,
				'created'         => $result->created,
				'last_updated'    => gmdate( 'Y-m-d H:i:s' ),
				'owner'           => $this->owner_id,
				'clusters'        => json_decode( $result->typology_groups, true ),
				'typology_groups' => json_decode( $result->typology_groups, true ),
				'answers'         => json_decode( $result->answers, true ),
				'total'           => (int) $result->total,
			);

			// Create group.
			$this->db->getReference( 'quiz/' . $this->quiz_id . '/groups/' . $this->group_id )->set( $to_return );

			// Store record of group on the user's database.
			$this->db->getReference( 'users/' . $this->owner_id . '/groups/' . $this->group_id )->set(
				array(
					'created'   => $result->created,
					'quiz_id'   => (int) $result->quiz_id,
					'quiz_slug' => $this->quiz_slug,
					'name'      => $result->name,
					'version'   => self::$groups_version,
				)
			);

			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log, WordPress.PHP.DevelopmentFunctions.error_log_print_r
			error_log( 'UPGRADING_GROUP' . print_r( $to_return, true ) );

			return $to_return;
		}

		return $to_return;
	}

	/**
	 * Get the group.
	 * If the group does not exist, return false.
	 *
	 * @param bool $return_as_array Whether to return the group as an array or an object.
	 * @return array|object|false
	 */
	public function get_group( $return_as_array = false ) {
		$existing_group = $this->db->getReference( 'quiz/' . $this->quiz_id . '/groups/' . $this->group_id )->getValue();
		if ( empty( $existing_group ) ) {
			$existing_group = $this->upgrade_legacy_group_if_exists();
		}
		if ( empty( $existing_group ) ) {
			return false;
		}
		// Check if $existing_group has typology_groups if so convert it clusters.
		if ( ! empty( $existing_group['typology_groups'] ) && ! array_key_exists( 'clusters', $existing_group ) ) {
			$existing_group['clusters'] = $existing_group['typology_groups'];
		}
		// Get the latest data for results_url, group_Url, and quiz_name to return back here...
		// This ensures the data is always up to date.
		$dynamic_data   = array(
			'results_url' => $this->generate_results_url(),
			'group_url'   => $this->generate_group_url(),
			'quiz_name'   => get_the_title( $this->quiz_id ),
		);
		$existing_group = array_merge( $existing_group, $dynamic_data );
		return false === $return_as_array ? (object) $existing_group : $existing_group;
	}

	/**
	 * Create a group.
	 *
	 * @param array $clusters The clusters data.
	 * @param array $answers All answer uuids for the quiz.
	 * @return string|WP_Error
	 */
	public function create_group(
		$clusters = array(),
		$answers = array(),
	) {
		if ( empty( $clusters ) ) {
			return new WP_Error( 'no-clusters', 'No clusters provided.' );
		}
		if ( empty( $answers ) ) {
			return new WP_Error( 'no-answers', 'No answers provided. All answer uuids for the quiz are required to seed the group with data.' );
		}

		$created_timestamp = gmdate( 'Y-m-d H:i:s' );
		$created_pretty    = gmdate( 'Y-m-d' );

		// Check if group exists...
		$duplicate_name_exists = false;
		if ( false !== $this->get_group() ) {
			$duplicate_name_exists = true;
			// We'll generate a new group id if the group already exists, in the event someone makes an identical group name.
			$this->group_id = $this->generate_group_id( $created_timestamp );
		}

		$group_name = $duplicate_name_exists ? $this->group_name . ' (' . $created_pretty . ')' : $this->group_name;

		// Create the group in the quiz groups database.
		$this->db->getReference( 'quiz/' . $this->quiz_id . '/groups/' . $this->group_id )->set(
			array(
				'name'            => $group_name,
				'quiz_id'         => (int) $this->quiz_id,
				'created'         => $created_timestamp,
				'last_updated'    => $created_timestamp,
				'owner'           => $this->owner_id,
				'clusters'        => $clusters, // This is an array of all the clusters with values set to 0 initially. We will increment these values as the group is updated.
				'typology_groups' => $clusters, // This is the legacy field for the typology groups or "clusters" for the quiz.
				'answers'         => $answers, // This is an array of all the answer uuid's given with values set to 0 initially. We will increment these values as the group is updated.
				'total'           => 0, // This is the total number of responses posted to the group.
			)
		);

		// Store record of group on the users database.
		$this->db->getReference( 'users/' . $this->owner_id . '/groups/' . $this->group_id )->set(
			array(
				'created'   => $created_timestamp,
				'quiz_id'   => (int) $this->quiz_id,
				'quiz_slug' => $this->quiz_slug,
				'name'      => $group_name,
				'version'   => self::$groups_version,
			)
		);

		return $this->group_id;
	}

	/**
	 * Validate a value for use as a Firebase RTDB path segment.
	 *
	 * Uses a regex allowlist to reject path traversal and special characters.
	 * Intentionally does NOT transform the value (e.g. lowercase) to avoid
	 * silently writing to mismatched keys.
	 *
	 * @param mixed  $value The value to validate.
	 * @param string $label Human-readable label for error messages.
	 * @return true|WP_Error
	 */
	private static function validate_path_segment( $value, $label = 'value' ) {
		if ( ! is_string( $value ) && ! is_numeric( $value ) ) {
			return new WP_Error(
				'invalid_path_segment',
				sprintf( 'Invalid %s: must be a string or number.', $label ),
				array( 'status' => 400 )
			);
		}
		$value = (string) $value;
		if ( '' === $value ) {
			return new WP_Error(
				'invalid_path_segment',
				sprintf( 'Invalid %s: must not be empty.', $label ),
				array( 'status' => 400 )
			);
		}
		if ( ! preg_match( '/^[a-zA-Z0-9_\-]+$/', $value ) ) {
			return new WP_Error(
				'invalid_path_segment',
				sprintf( 'Invalid %s: contains disallowed characters.', $label ),
				array( 'status' => 400 )
			);
		}
		return true;
	}

	/**
	 * Update a group using atomic Firebase server-side increments.
	 *
	 * Each counter (total, cluster, answer) is incremented atomically via
	 * Firebase's .sv increment in a single multi-path update, eliminating
	 * the read-modify-write race condition.
	 *
	 * @param array  $submission Flat array of answer UUID strings.
	 * @param string $score      Cluster/archetype identifier.
	 * @return true|WP_Error
	 */
	public function update_group( $submission, $score ) {
		if ( ! is_array( $submission ) ) {
			return new WP_Error( 'invalid_submission', 'Submission must be an array.', array( 'status' => 400 ) );
		}
		if ( ! is_string( $score ) || '' === $score ) {
			return new WP_Error( 'invalid_score', 'Score must be a non-empty string.', array( 'status' => 400 ) );
		}

		// Validate all values used as Firebase path segments.
		foreach (
			array(
				array( $this->quiz_id, 'quiz ID' ),
				array( $this->group_id, 'group ID' ),
				array( $score, 'score' ),
			) as list( $val, $label )
		) {
			$valid = self::validate_path_segment( $val, $label );
			if ( is_wp_error( $valid ) ) {
				return $valid;
			}
		}

		$increment = array( '.sv' => array( 'increment' => 1 ) );

		$updates = array(
			'total'                     => $increment,
			'clusters/' . $score        => $increment,
			'typology_groups/' . $score => $increment,
			'last_updated'              => gmdate( 'Y-m-d H:i:s' ),
		);

		foreach ( $submission as $answer_uuid ) {
			if ( ! is_string( $answer_uuid ) ) {
				continue;
			}
			$valid = self::validate_path_segment( $answer_uuid, 'answer UUID' );
			if ( is_wp_error( $valid ) ) {
				return $valid;
			}
			$updates[ 'answers/' . $answer_uuid ] = $increment;
		}

		try {
			$ref = $this->db->getReference(
				'quiz/' . $this->quiz_id . '/groups/' . $this->group_id
			);
			$ref->update( $updates );
		} catch ( \Kreait\Firebase\Exception\DatabaseException $e ) {
			return new WP_Error(
				'firebase_error',
				'Group update failed.',
				array( 'status' => 500 )
			);
		}

		return true;
	}
}
