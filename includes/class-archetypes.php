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
	 * Setup the quiz entry.
	 */
	public function setup_quiz_entry() {
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
	 */
	public function purge_archetypes() {
		return $this->db->getReference( 'quiz/' . $this->quiz_id . '/archetypes' )->set( null );
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
	 * Get the cache key.
	 *
	 * @return string
	 */
	public function get_cache_key() {
		return md5(
			wp_json_encode(
				array(
					'quiz_id' => $this->quiz_id,
					'hash'    => $this->hash,
				) 
			) 
		);
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
		$cache_key = $this->get_cache_key();
		$cache     = wp_cache_get( $cache_key, 'prc_quiz_builder_archetypes' );
		if ( false !== $cache && false === $force_refresh ) {
			return false === $return_as_array ? (object) $cache : $cache;
		}

		$existing_archetype = $this->db->getReference( $this->archetype_ref() )->getValue();

		if ( empty( $existing_archetype ) ) {
			return false;
		}

		if ( false === $force_refresh ) {
			wp_cache_set( $cache_key, $existing_archetype, 'prc_quiz_builder_archetypes', 1 * DAY_IN_SECONDS );
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
		wp_cache_delete( $this->get_cache_key(), 'prc_quiz_builder_archetypes' );
		return $new_archetype;
	}

	/**
	 * Log an archetype hit.
	 * These requests bypass the cache.
	 *
	 * @return array|WP_Error
	 */
	public function log_archetype_hit() {
		$existing_archetype = $this->get_archetype( false, true );
		if ( empty( $existing_archetype ) ) {
			return new WP_Error( 'no-archetype', 'No archetype found.' );
		}
		++$existing_archetype->hits;
		$this->db->getReference( $this->archetype_ref() )->set( $existing_archetype );
		return $existing_archetype;
	}
}
