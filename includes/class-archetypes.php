<?php
/**
 * Archetypes class.
 *
 * @package PRC\Platform\Quiz
 */

namespace PRC\Platform\Quiz;

use WP_Error;

/**
 * Archetypes class.
 */
class Archetypes {
	/**
	 * Post meta key for the per-quiz archetype object-cache generation.
	 *
	 * Bumped on purge so existing positive cache entries become unreachable
	 * without enumerating Firebase children or flushing the cache group.
	 *
	 * @var string
	 */
	public const CACHE_GENERATION_META_KEY = '_prc_quiz_archetypes_cache_gen';

	/**
	 * The valid hash regex.
	 *
	 * @var string
	 */
	protected static $valid_hash_regex = '/^[a-f0-9]{32}$/';

	/**
	 * The quiz ID.
	 *
	 * @var string
	 */
	public $quiz_id;

	/**
	 * The hash.
	 *
	 * @var string
	 */
	public $hash;

	/**
	 * The database.
	 *
	 * @var \Firebase\Firebase\Database
	 */
	public $db;

	/**
	 * Constructor.
	 *
	 * @param array $args The arguments.
	 */
	public function __construct( $args ) {
		$args          = wp_parse_args(
			$args,
			array(
				'quiz_id' => null,
				'hash'    => null,
			)
		);
		$firebase      = new \PRC\Platform\Firebase();
		$this->db      = $firebase->db;
		$this->quiz_id = $args['quiz_id'];
		if ( ! $this->is_valid_hash( $args['hash'] ) ) {
			return;
		}
		$this->hash = $args['hash'];
	}

	/**
	 * Is valid hash.
	 *
	 * @param string $md5 The md5.
	 * @return bool
	 */
	public static function is_valid_hash( $md5 = false ) {
		if ( false !== $md5 ) {
			return preg_match( self::$valid_hash_regex, $md5 );
		}
		return false;
	}

	/**
	 * Whether Firebase Realtime Database is available for archetype operations.
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
	 * Setup the quiz entry.
	 *
	 * @return array|WP_Error
	 */
	public function setup_quiz_entry() {
		if ( ! $this->is_available() ) {
			return $this->firebase_unavailable_error();
		}

		$quiz_id = $this->quiz_id;
		// Check if the quiz exists in the db, if not, lets set it up.
		$quiz_entry = $this->db->getReference( 'quiz/' . $quiz_id )->getValue();
		if ( empty( $quiz_entry ) ) {
			$quiz_entry = array(
				'archetypes' => '',
			);
			$this->db->getReference( 'quiz/' . $quiz_id )->set( $quiz_entry );
		}
		return $quiz_entry;
	}

	/**
	 * Purge the archetypes.
	 *
	 * Firebase clear remains a single `set( null )`. Object-cache invalidation
	 * is O(1): bump the per-quiz generation so prior positive keys (which
	 * include the old generation) miss. Avoids downloading/deleting N hashes
	 * and avoids a broad cache-group flush.
	 *
	 * @return mixed|WP_Error
	 */
	public function purge_archetypes() {
		if ( ! $this->is_available() ) {
			return $this->firebase_unavailable_error();
		}

		$this->bump_cache_generation();

		return $this->db->getReference( 'quiz/' . $this->quiz_id . '/archetypes' )->set( null );
	}

	/**
	 * Current archetype object-cache generation for a quiz.
	 *
	 * @param mixed $quiz_id Quiz post ID.
	 * @return int
	 */
	public static function get_cache_generation( $quiz_id ): int {
		$gen = get_post_meta( (int) $quiz_id, self::CACHE_GENERATION_META_KEY, true );
		return is_numeric( $gen ) ? (int) $gen : 0;
	}

	/**
	 * Bump the per-quiz archetype cache generation (logical invalidation).
	 *
	 * @return int New generation value.
	 */
	public function bump_cache_generation(): int {
		$next = self::get_cache_generation( $this->quiz_id ) + 1;
		update_post_meta( (int) $this->quiz_id, self::CACHE_GENERATION_META_KEY, $next );
		return $next;
	}

	/**
	 * Get the archetype reference.
	 *
	 * @return string
	 */
	protected function archetype_ref() {
		return 'quiz/' . $this->quiz_id . '/archetypes/' . $this->hash;
	}

	/**
	 * Build an archetype object-cache key for a quiz + hash pair.
	 *
	 * Includes the per-quiz generation so a purge can invalidate all prior
	 * positive entries without enumerating them.
	 *
	 * @param mixed  $quiz_id Quiz post ID.
	 * @param string $hash    Archetype hash.
	 * @return string
	 */
	public static function build_cache_key( $quiz_id, string $hash ): string {
		return md5(
			wp_json_encode(
				array(
					'quiz_id' => $quiz_id,
					'hash'    => $hash,
					'gen'     => self::get_cache_generation( $quiz_id ),
				)
			)
		);
	}

	/**
	 * Get the cache key.
	 *
	 * @return string
	 */
	public function get_cache_key() {
		return self::build_cache_key( $this->quiz_id, (string) $this->hash );
	}

	/**
	 * Get an archetype for a quiz by hash from Firebase.
	 * If the archetype does not exist, return false.
	 *
	 * @param bool $return_as_array Whether to return the archetype as an array.
	 * @param bool $force_refresh Whether to force a refresh of the cache.
	 * @return array|object|false
	 */
	public function get_archetype( $return_as_array = false, $force_refresh = false ) {
		if ( ! $this->is_available() ) {
			return false;
		}

		$cache_key = $this->get_cache_key();
		$cache     = wp_cache_get( $cache_key, Object_Cache::ARCHETYPES_GROUP );
		if ( false !== $cache && false === $force_refresh ) {
			return false === $return_as_array ? (object) $cache : $cache;
		}

		$existing_archetype = $this->db->getReference( $this->archetype_ref() )->getValue();

		if ( empty( $existing_archetype ) ) {
			return false;
		}

		if ( false === $force_refresh ) {
			wp_cache_set( $cache_key, $existing_archetype, Object_Cache::ARCHETYPES_GROUP, Object_Cache::ARCHETYPES_TTL );
		}

		return false === $return_as_array ? (object) $existing_archetype : $existing_archetype;
	}

	/**
	 * Create an archetype.
	 *
	 * @param array $submission The submission.
	 * @param int   $score      The score.
	 * @return array|WP_Error
	 */
	public function create_archetype(
		$submission = null,
		$score = null,
	) {
		if ( ! $this->is_available() ) {
			return $this->firebase_unavailable_error();
		}
		if ( empty( $submission ) ) {
			return new WP_Error( 'no-submission', 'No submission provided.' );
		}
		if ( empty( $score ) ) {
			return new WP_Error( 'no-score', 'No score provided.' );
		}
		// Create a new archetype.
		$new_archetype = array(
			'score'      => $score,
			'submission' => $submission,
			'hits'       => 1,
		);
		$this->db->getReference( $this->archetype_ref() )->set( $new_archetype );
		wp_cache_delete( $this->get_cache_key(), Object_Cache::ARCHETYPES_GROUP );
		return $new_archetype;
	}

	/**
	 * Log an archetype hit.
	 * These requests bypass the cache.
	 *
	 * @return array|object|WP_Error
	 */
	public function log_archetype_hit() {
		if ( ! $this->is_available() ) {
			return $this->firebase_unavailable_error();
		}

		$existing_archetype = $this->get_archetype( false, true );
		if ( empty( $existing_archetype ) ) {
			return new WP_Error( 'no-archetype', 'No archetype found.' );
		}
		++$existing_archetype->hits;
		$this->db->getReference( $this->archetype_ref() )->set( $existing_archetype );
		return $existing_archetype;
	}
}
