<?php
/**
 * Groups class.
 *
 * @package PRC\Platform\Quiz
 */

namespace PRC\Platform\Quiz;

use WP_Error;

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
	 * Child of a group that holds one node per submission:
	 * quiz/{quizId}/groups/{groupId}/submissions/{submissionId}.
	 *
	 * @var string
	 */
	public const SUBMISSIONS_KEY = 'submissions';

	/**
	 * Separates the cluster from the answer codes in a submission node.
	 *
	 * A cluster is a path segment (letters, digits, `_`, `-`), so it never holds this character.
	 *
	 * @var string
	 */
	public const NODE_SEPARATOR = ':';

	/**
	 * Length of the code that stands for one answer uuid in a submission node.
	 *
	 * @var int
	 */
	public const ANSWER_CODE_LENGTH = 8;

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
		$db            = $firebase->get_database(
			null,
			array(
				'timeout'         => Archetypes::HTTP_TIMEOUT,
				'connect_timeout' => Archetypes::HTTP_CONNECT_TIMEOUT,
			)
		);
		$this->db      = is_wp_error( $db ) ? null : $db;
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
	 * Whether Firebase Realtime Database is available for group operations.
	 *
	 * @return bool
	 */
	public function is_available() {
		return null !== $this->db;
	}

	/**
	 * WP_Error returned when Firebase is not configured.
	 *
	 * @return WP_Error
	 */
	protected function firebase_unavailable_error() {
		return new WP_Error(
			'firebase_not_configured',
			'Firebase database is not configured.',
			array( 'status' => 503 )
		);
	}

	/**
	 * Get the group.
	 * If the group does not exist, return false.
	 *
	 * One read returns the group. The stored counters are the base. Each submission
	 * node under the group adds one to `total`, to its cluster, and to each of its
	 * answers (see `answer_code()` for how a node names an answer). The nodes are
	 * not part of the returned group. Pass
	 * `$include_tally = false` to return the stored counters as they are.
	 *
	 * @param bool $return_as_array Whether to return the group as an array or an object.
	 * @param bool $include_tally   Whether to add the submission nodes to the counters.
	 * @return array|object|false|WP_Error
	 */
	public function get_group( $return_as_array = false, $include_tally = true ) {
		// Firebase groups live under quiz/{quiz_id}/groups/{group_id}; quiz_id is required.
		if ( empty( $this->quiz_id ) || empty( $this->group_id ) ) {
			return false;
		}

		if ( ! $this->is_available() ) {
			return $this->firebase_unavailable_error();
		}

		try {
			$existing_group = $this->db->getReference( 'quiz/' . $this->quiz_id . '/groups/' . $this->group_id )->getValue();
		} catch ( \Kreait\Firebase\Exception\DatabaseException $e ) {
			return new WP_Error(
				'firebase_error',
				'Group lookup failed.',
				array( 'status' => 503 )
			);
		}
		if ( empty( $existing_group ) || ! is_array( $existing_group ) ) {
			return false;
		}
		// Check if $existing_group has typology_groups if so convert it clusters.
		if ( ! empty( $existing_group['typology_groups'] ) && ! array_key_exists( 'clusters', $existing_group ) ) {
			$existing_group['clusters'] = $existing_group['typology_groups'];
		}
		// Backfill quiz_id when the RTDB document omits it (avoids stdClass::$quiz_id warnings).
		if ( empty( $existing_group['quiz_id'] ) ) {
			$existing_group['quiz_id'] = (int) $this->quiz_id;
		}
		if ( empty( $existing_group['group_id'] ) ) {
			$existing_group['group_id'] = $this->group_id;
		}
		$nodes = $existing_group[ self::SUBMISSIONS_KEY ] ?? array();
		unset( $existing_group[ self::SUBMISSIONS_KEY ] );
		if ( $include_tally ) {
			$existing_group = self::add_submission_tally( $existing_group, is_array( $nodes ) ? $nodes : array() );
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
		if ( ! $this->is_available() ) {
			return $this->firebase_unavailable_error();
		}
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
		$existing_group        = $this->get_group( false, false );
		if ( is_wp_error( $existing_group ) ) {
			return $existing_group;
		}
		if ( false !== $existing_group ) {
			$duplicate_name_exists = true;
			// We'll generate a new group id if the group already exists, in the event someone makes an identical group name.
			$this->group_id = $this->generate_group_id( $created_timestamp );
		}

		$group_name = $duplicate_name_exists ? $this->group_name . ' (' . $created_pretty . ')' : $this->group_name;

		try {
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
		} catch ( \Kreait\Firebase\Exception\DatabaseException $e ) {
			return new WP_Error(
				'firebase_error',
				'Group creation failed.',
				array( 'status' => 503 )
			);
		}

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
	 * Add one submission to a group.
	 *
	 * With a `$submission_id` the submission is written as one node at
	 * `quiz/{quizId}/groups/{groupId}/submissions/{submissionId}`, next to the
	 * group's counters, in a single multi-path update with the group's
	 * `last_updated`. The node is one short string, `{cluster}:{code}{code}...`,
	 * with one fixed-width code per answer (see `answer_code()`). The write sets
	 * the node, so a replay of the same submission id writes the same node and the
	 * group tally does not change. `get_group()` adds the nodes to the stored
	 * counters.
	 *
	 * Without a `$submission_id` each counter (total, cluster, answer) is
	 * incremented atomically with Firebase's `.sv` increment, in one multi-path update.
	 *
	 * @param array       $submission    Flat array of answer UUID strings.
	 * @param string      $score         Cluster/archetype identifier.
	 * @param string|null $submission_id Client-generated submission id, or null for a counter increment.
	 * @return true|WP_Error
	 */
	public function update_group( $submission, $score, $submission_id = null ) {
		if ( ! $this->is_available() ) {
			return $this->firebase_unavailable_error();
		}
		if ( ! is_array( $submission ) ) {
			return new WP_Error( 'invalid_submission', 'Submission must be an array.', array( 'status' => 400 ) );
		}
		if ( ! is_string( $score ) || '' === $score ) {
			return new WP_Error( 'invalid_score', 'Score must be a non-empty string.', array( 'status' => 400 ) );
		}

		// Validate all values used as Firebase path segments.
		$segments = array(
			array( $this->quiz_id, 'quiz ID' ),
			array( $this->group_id, 'group ID' ),
			array( $score, 'score' ),
		);
		if ( null !== $submission_id ) {
			$segments[] = array( $submission_id, 'submission ID' );
		}
		foreach ( $segments as list( $val, $label ) ) {
			$valid = self::validate_path_segment( $val, $label );
			if ( is_wp_error( $valid ) ) {
				return $valid;
			}
		}

		$answers = array();
		foreach ( $submission as $answer_uuid ) {
			if ( ! is_string( $answer_uuid ) ) {
				continue;
			}
			$valid = self::validate_path_segment( $answer_uuid, 'answer UUID' );
			if ( is_wp_error( $valid ) ) {
				return $valid;
			}
			$answers[ $answer_uuid ] = $answer_uuid;
		}
		$answers = array_values( $answers );

		$group_path = 'quiz/' . $this->quiz_id . '/groups/' . $this->group_id;

		try {
			if ( null !== $submission_id ) {
				$this->db->getReference()->update(
					array(
						$group_path . '/' . self::SUBMISSIONS_KEY . '/' . $submission_id => self::encode_submission_node( $score, $answers ),
						$group_path . '/last_updated' => gmdate( 'Y-m-d H:i:s' ),
					)
				);
				return true;
			}

			$increment = array( '.sv' => array( 'increment' => 1 ) );
			$updates   = array(
				'total'                     => $increment,
				'clusters/' . $score        => $increment,
				'typology_groups/' . $score => $increment,
				'last_updated'              => gmdate( 'Y-m-d H:i:s' ),
			);
			foreach ( $answers as $answer_uuid ) {
				$updates[ 'answers/' . $answer_uuid ] = $increment;
			}
			$this->db->getReference( $group_path )->update( $updates );
		} catch ( \Kreait\Firebase\Exception\DatabaseException $e ) {
			return new WP_Error(
				'firebase_error',
				'Group update failed.',
				array( 'status' => 503 )
			);
		}

		return true;
	}

	/**
	 * Whether the group exists.
	 *
	 * A shallow read: it returns the keys of the group and none of its submission
	 * nodes, so its size does not grow with the group.
	 *
	 * @return bool|WP_Error
	 */
	public function group_exists() {
		if ( empty( $this->quiz_id ) || empty( $this->group_id ) ) {
			return false;
		}
		if ( ! $this->is_available() ) {
			return $this->firebase_unavailable_error();
		}
		try {
			$this->db->getReference( 'quiz/' . $this->quiz_id . '/groups/' . $this->group_id )->getChildKeys();
			return true;
		} catch ( \OutOfRangeException $e ) {
			return false;
		} catch ( \Kreait\Firebase\Exception\DatabaseException $e ) {
			return new WP_Error(
				'firebase_error',
				'Group lookup failed.',
				array( 'status' => 503 )
			);
		}
	}

	/**
	 * Read a stored counter map that may be an array (Firebase) or a legacy JSON string.
	 *
	 * @param mixed $value Raw field value.
	 * @return array
	 */
	protected static function decode_counter_field( $value ): array {
		if ( is_array( $value ) ) {
			return $value;
		}
		if ( is_string( $value ) && '' !== $value ) {
			$decoded = json_decode( $value, true );
			return is_array( $decoded ) ? $decoded : array();
		}
		return array();
	}

	/**
	 * The code that stands for an answer uuid in a submission node.
	 *
	 * It is a fixed-width base 36 string cut from the md5 of the uuid (40 bits), so
	 * a node needs no separator between answers and the write needs no lookup.
	 * `get_group()` maps a code back to an uuid with the answers the group stores.
	 *
	 * @param string $answer_uuid The answer uuid.
	 * @return string
	 */
	public static function answer_code( string $answer_uuid ): string {
		return str_pad( base_convert( substr( md5( $answer_uuid ), 0, 10 ), 16, 36 ), self::ANSWER_CODE_LENGTH, '0', STR_PAD_LEFT );
	}

	/**
	 * Build the stored value of one submission node.
	 *
	 * @param string $cluster The cluster key.
	 * @param array  $answers Answer uuids, without repeats.
	 * @return string `{cluster}:{code}{code}...`
	 */
	protected static function encode_submission_node( string $cluster, array $answers ): string {
		return $cluster . self::NODE_SEPARATOR . implode( '', array_map( array( self::class, 'answer_code' ), $answers ) );
	}

	/**
	 * Add submission nodes to the stored counters of a group.
	 *
	 * An answer code that matches none of the answers the group stores adds to
	 * `total` and to the cluster, and to no answer.
	 *
	 * @param array $group Group record from Firebase.
	 * @param array $nodes Submission nodes for the group, keyed by submission id.
	 * @return array The group with `total`, `clusters`, `typology_groups` and `answers` raised.
	 */
	protected static function add_submission_tally( array $group, array $nodes ): array {
		$counters = array(
			'total'           => (int) ( $group['total'] ?? 0 ),
			'clusters'        => self::decode_counter_field( $group['clusters'] ?? null ),
			'typology_groups' => self::decode_counter_field( $group['typology_groups'] ?? null ),
			'answers'         => self::decode_counter_field( $group['answers'] ?? null ),
		);

		$clusters = array();
		$codes    = '';
		foreach ( $nodes as $node ) {
			if ( ! is_string( $node ) ) {
				continue;
			}
			$split = strpos( $node, self::NODE_SEPARATOR );
			if ( false === $split ) {
				continue;
			}
			++$counters['total'];
			$cluster = substr( $node, 0, $split );
			if ( '' !== $cluster ) {
				$clusters[] = $cluster;
			}
			$answer_codes = substr( $node, $split + 1 );
			if ( 0 === strlen( $answer_codes ) % self::ANSWER_CODE_LENGTH ) {
				$codes .= $answer_codes;
			}
		}

		foreach ( array_count_values( $clusters ) as $cluster => $count ) {
			$counters['clusters'][ $cluster ]        = (int) ( $counters['clusters'][ $cluster ] ?? 0 ) + $count;
			$counters['typology_groups'][ $cluster ] = (int) ( $counters['typology_groups'][ $cluster ] ?? 0 ) + $count;
		}

		if ( '' !== $codes ) {
			$answer_by_code = array();
			foreach ( array_keys( $counters['answers'] ) as $answer_uuid ) {
				$answer_by_code[ self::answer_code( (string) $answer_uuid ) ] ??= (string) $answer_uuid;
			}
			foreach ( array_count_values( str_split( $codes, self::ANSWER_CODE_LENGTH ) ) as $code => $count ) {
				$answer_uuid = $answer_by_code[ $code ] ?? null;
				if ( null !== $answer_uuid ) {
					$counters['answers'][ $answer_uuid ] = (int) ( $counters['answers'][ $answer_uuid ] ?? 0 ) + $count;
				}
			}
		}

		return array_merge( $group, $counters );
	}

	/**
	 * Fetch and normalize all community groups for a quiz from Firebase.
	 *
	 * @param int $quiz_id Quiz post ID.
	 * @return array|WP_Error List of editor-safe group rows, or error.
	 */
	public static function get_all_for_quiz( int $quiz_id ) {
		if ( ! class_exists( '\PRC\Platform\Firebase' ) ) {
			return new WP_Error(
				'firebase_not_available',
				'Firebase integration is not available.',
				array( 'status' => 500 )
			);
		}

		$firebase = new \PRC\Platform\Firebase();
		$db       = $firebase->get_database(
			null,
			array(
				'timeout'         => Archetypes::HTTP_TIMEOUT,
				'connect_timeout' => Archetypes::HTTP_CONNECT_TIMEOUT,
			)
		);

		if ( null === $db || is_wp_error( $db ) ) {
			return new WP_Error(
				'firebase_not_configured',
				'Firebase database is not configured.',
				array( 'status' => 500 )
			);
		}

		try {
			$groups = $db
				->getReference( 'quiz/' . $quiz_id . '/groups' )
				->getValue();

			if ( empty( $groups ) || ! is_array( $groups ) ) {
				return array();
			}

			$permalink  = get_permalink( $quiz_id );
			$normalized = array();

			foreach ( $groups as $group_id => $group_data ) {
				if ( ! is_array( $group_data ) ) {
					continue;
				}

				$normalized[] = array(
					'id'           => (string) $group_id,
					'name'         => (string) ( $group_data['name'] ?? '' ),
					'total'        => (int) ( $group_data['total'] ?? 0 ) + ( is_array( $group_data[ self::SUBMISSIONS_KEY ] ?? null ) ? count( $group_data[ self::SUBMISSIONS_KEY ] ) : 0 ),
					'created'      => (string) ( $group_data['created'] ?? '' ),
					'last_updated' => (string) ( $group_data['last_updated'] ?? '' ),
					'results_url'  => wp_sprintf( '%sgroup/%s/results/', $permalink, $group_id ),
				);
			}

			return $normalized;
		} catch ( \Exception $e ) {
			return new WP_Error(
				'firebase_error',
				'Failed to retrieve quiz groups from Firebase: ' . $e->getMessage(),
				array( 'status' => 500 )
			);
		}
	}
}
