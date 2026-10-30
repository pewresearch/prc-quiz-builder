<?php
/**
 * Quiz submission counts stored in Firebase Realtime Database.
 *
 * Counts used to live in the `_report` and `_prc_quiz_submissions_total` post
 * meta. Every postmeta write bumps core's site-wide `posts` last_changed salt,
 * which invalidates every WP_Query result cache on the site, so a busy quiz
 * caused cold-cache bursts everywhere. A submit now writes zero postmeta.
 *
 * Data layout (all paths are relative to `Submission_Counts::ref()`):
 *
 *   quiz/{id}/counts/legacy/   Written only by `wp prc quiz counts migrate` and
 *                              `wp prc quiz report set|add`. Snapshot of the
 *                              old `_report` meta.
 *   quiz/{id}/counts/live/     Server-side `.sv` increments only, from submits.
 *   quizTotals/{id}/legacy     { total, first_24_hours, first_week } mirror of
 *   quizTotals/{id}/live       the above. A flat index so the DataViews list
 *                              and its sort need one GET instead of one per quiz.
 *
 * Each of `legacy` and `live` holds:
 *   total, first_24_hours, first_week,
 *   months/{YYYY}/{MM}, days/{YYYY}/{MM}/{DD}, last_submission (live only).
 *
 * Reads return legacy + live, rebuilt into the exact shape the old `_report`
 * meta had, so the editor panel, stats modal, and DataViews need no JS change.
 * Because the migration only ever writes `legacy` and submits only ever
 * increment `live`, the migration can be re-run while submits continue.
 *
 * PRC-138: the per-feature database move changes `ref()` only (the handle and
 * the `{siteId}/` prefix). The counts paths above must also be added to the
 * PRC-138 copy inventory, or increments written after the copy are lost.
 *
 * @package PRC\Platform\Quiz
 */

declare(strict_types=1);

namespace PRC\Platform\Quiz;

use WP_Error;

/**
 * Submission counts store, read layer, and deferred writer.
 */
class Submission_Counts {

	/**
	 * Total request timeout for any counts call (seconds).
	 */
	public const TIMEOUT = 3.0;

	/**
	 * Connect timeout for any counts call (seconds).
	 */
	public const CONNECT_TIMEOUT = 1.0;

	/**
	 * Scalar fields mirrored into the totals index.
	 */
	public const SUMMARY_FIELDS = array( 'total', 'first_24_hours', 'first_week' );

	/**
	 * Object-cache key for the whole totals index.
	 */
	private const INDEX_CACHE_KEY = 'index';

	/**
	 * Object-cache key for the "store unavailable" marker.
	 */
	private const UNAVAILABLE_CACHE_KEY = 'unavailable';

	/**
	 * Tasks queued to run after the response is flushed.
	 *
	 * @var callable[]
	 */
	private static array $deferred = array();

	/**
	 * Whether the shutdown hook is registered.
	 *
	 * @var bool
	 */
	private static bool $shutdown_hooked = false;

	/**
	 * The single accessor for the counts location in Firebase.
	 *
	 * Every read and write goes through the reference this returns. Pass a
	 * path relative to the counts root, or none for the root itself (used for
	 * multi-path updates). Paths are joined onto the base path and resolved
	 * on the database handle directly: Kreait's `Reference::getChild()` on the
	 * root yields a `//path` URL that reads as empty, so it is not used here.
	 *
	 * To move counts to the per-feature database (PRC-138), change the two
	 * marked lines: the database handle and the base path.
	 *
	 * @param string $path Path relative to the counts root.
	 * @return object|null Kreait Reference, or null when Firebase is unavailable.
	 */
	public static function ref( string $path = '' ) {
		$db = self::connect(); // PRC-138: replace with \PRC\Platform\Firebase::get_database( 'quiz-builder' ).
		if ( null === $db ) {
			return null;
		}
		$base_path = ''; // PRC-138: replace with $site_id . '/'.
		return $db->getReference( trim( $base_path . '/' . $path, '/' ) );
	}

	/**
	 * Resolve a Firebase database handle with short timeouts.
	 *
	 * Uses the service account's default database, the same one the rest of
	 * the quiz code uses today.
	 *
	 * @return object|null Kreait Database, or null when Firebase is not configured.
	 */
	private static function connect() {
		/**
		 * Filters the Firebase database used for submission counts.
		 *
		 * Lets tests and the future per-feature database registry supply a handle.
		 *
		 * @param object|null $db Database handle, or null to use the platform default.
		 */
		$db = apply_filters( 'prc_quiz_submission_counts_database', null );
		if ( null !== $db ) {
			return $db;
		}

		if ( ! class_exists( '\PRC\Platform\Firebase' ) ) {
			return null;
		}

		$firebase = new \PRC\Platform\Firebase();
		if ( null === $firebase->db ) {
			return null;
		}

		$options_class = '\Kreait\Firebase\Http\HttpClientOptions';
		if ( null !== $firebase->instance && class_exists( $options_class ) ) {
			try {
				$options = $options_class::default()
					->withConnectTimeout( self::CONNECT_TIMEOUT )
					->withTimeout( self::TIMEOUT );
				return $firebase->instance->withHttpClientOptions( $options )->createDatabase();
			} catch ( \Throwable $e ) {
				self::log_failure( 'connect', $e );
			}
		}

		return $firebase->db;
	}

	/**
	 * Build the multi-path update for one submit.
	 *
	 * Pure function of its inputs so it can be tested without Firebase. Every
	 * counter uses a server-side increment, so concurrent submits never lose
	 * a count.
	 *
	 * @param int $quiz_id      Quiz post ID.
	 * @param int $now          Submit time (unix timestamp).
	 * @param int $published_at Quiz publish time (unix timestamp, 0 when unknown).
	 * @return array<string, mixed> Map of relative path to value.
	 */
	public static function build_increment_updates( int $quiz_id, int $now, int $published_at ): array {
		$increment = array( '.sv' => array( 'increment' => 1 ) );
		$live      = 'quiz/' . $quiz_id . '/counts/live';
		$index     = 'quizTotals/' . $quiz_id . '/live';

		$year  = wp_date( 'Y', $now );
		$month = wp_date( 'm', $now );
		$day   = wp_date( 'd', $now );

		$updates = array(
			$live . '/total'                          => $increment,
			$live . '/months/' . $year . '/' . $month => $increment,
			$live . '/last_submission'                => array( '.sv' => 'timestamp' ),
			$index . '/total'                         => $increment,
		);

		if ( Analytics::is_day_logging_enabled() ) {
			$updates[ $live . '/days/' . $year . '/' . $month . '/' . $day ] = $increment;
		}

		// Elapsed time since publish. The old check compared calendar days, so a
		// quiz published at 11pm stopped counting "first 24 hours" an hour later.
		$age = $now - $published_at;
		if ( $published_at > 0 && $age >= 0 ) {
			if ( $age < DAY_IN_SECONDS ) {
				$updates[ $live . '/first_24_hours' ]  = $increment;
				$updates[ $index . '/first_24_hours' ] = $increment;
			}
			if ( $age < WEEK_IN_SECONDS ) {
				$updates[ $live . '/first_week' ]  = $increment;
				$updates[ $index . '/first_week' ] = $increment;
			}
		}

		return $updates;
	}

	/**
	 * Count one submit now (blocking). Use `defer_increment()` on the request path.
	 *
	 * @param int $quiz_id Quiz post ID.
	 * @return true|WP_Error
	 */
	public static function increment( int $quiz_id ) {
		return self::write_updates(
			self::build_increment_updates( $quiz_id, time(), self::get_published_at( $quiz_id ) )
		);
	}

	/**
	 * Count one submit after the response has been sent to the visitor.
	 *
	 * Time-sensitive inputs (submit time, publish time) are captured now so the
	 * day bucket is correct even if the flush runs later.
	 *
	 * @param int $quiz_id Quiz post ID.
	 */
	public static function defer_increment( int $quiz_id ): void {
		$updates = self::build_increment_updates( $quiz_id, time(), self::get_published_at( $quiz_id ) );

		self::after_response(
			static function () use ( $updates, $quiz_id ): void {
				$result = self::write_updates( $updates );
				if ( is_wp_error( $result ) ) {
					self::log_failure( 'increment quiz ' . $quiz_id, $result );
				}
			}
		);
	}

	/**
	 * Run a task after the response is flushed (shutdown + fastcgi_finish_request).
	 *
	 * Runs immediately under WP-CLI and in cron, where there is no response to
	 * wait on. Filterable so tests can run tasks inline.
	 *
	 * @param callable $task Task to run. Failures must be handled by the task.
	 */
	public static function after_response( callable $task ): void {
		/**
		 * Filters whether submission-count writes wait for the response to flush.
		 *
		 * @param bool $defer True to queue the write for shutdown.
		 */
		$defer = apply_filters(
			'prc_quiz_submission_counts_defer',
			! ( defined( 'WP_CLI' ) && WP_CLI ) && ! wp_doing_cron()
		);

		if ( ! $defer ) {
			self::run_task( $task );
			return;
		}

		self::$deferred[] = $task;

		if ( ! self::$shutdown_hooked ) {
			self::$shutdown_hooked = true;
			// Priority 100: after core flushes its output buffers at priority 1.
			add_action( 'shutdown', array( self::class, 'flush_deferred' ), 100 );
		}
	}

	/**
	 * Release the visitor, then run queued tasks.
	 *
	 * @hook shutdown
	 */
	public static function flush_deferred(): void {
		if ( array() === self::$deferred ) {
			return;
		}

		if ( function_exists( 'fastcgi_finish_request' ) ) {
			fastcgi_finish_request();
		}

		$tasks          = self::$deferred;
		self::$deferred = array();

		foreach ( $tasks as $task ) {
			self::run_task( $task );
		}
	}

	/**
	 * Run one queued task without letting a failure escape.
	 *
	 * @param callable $task Task.
	 */
	private static function run_task( callable $task ): void {
		try {
			$task();
		} catch ( \Throwable $e ) {
			self::log_failure( 'deferred task', $e );
		}
	}

	/**
	 * Log a counts failure and let monitoring hook it.
	 *
	 * @param string                     $context What was being attempted.
	 * @param \Throwable|WP_Error|string $error   The failure.
	 */
	public static function log_failure( string $context, $error ): void {
		if ( $error instanceof \Throwable ) {
			$message = $error->getMessage();
		} elseif ( is_wp_error( $error ) ) {
			$message = $error->get_error_message();
		} else {
			$message = (string) $error;
		}

		/**
		 * Fires when a submission-count write or read fails.
		 *
		 * @param string $context What was being attempted.
		 * @param string $message Failure message.
		 */
		do_action( 'prc_quiz_submission_counts_failure', $context, $message );

		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		error_log( sprintf( 'prc-quiz-builder: submission counts failure (%s): %s', $context, $message ) );
	}

	/**
	 * Send a multi-path update.
	 *
	 * @param array<string, mixed> $updates Map of relative path to value.
	 * @return true|WP_Error
	 */
	private static function write_updates( array $updates ) {
		$root = self::ref();
		if ( null === $root ) {
			return new WP_Error( 'firebase_not_configured', 'Firebase database is not configured.' );
		}

		try {
			$root->update( $updates );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'firebase_error', 'Submission counts update failed: ' . $e->getMessage() );
		}

		return true;
	}

	/**
	 * Quiz publish time as a unix timestamp (0 when unknown).
	 *
	 * @param int $quiz_id Quiz post ID.
	 * @return int
	 */
	private static function get_published_at( int $quiz_id ): int {
		$time = get_post_time( 'U', true, $quiz_id );
		return is_numeric( $time ) ? (int) $time : 0;
	}

	/**
	 * Get the full report for a quiz: legacy + live, in the old `_report` shape.
	 *
	 * Shape: `first_24_hours`, `first_week`, `total`, and per year
	 * `{ MM: n, _days: { MM: { DD: n } } }`.
	 *
	 * Reads Firebase at most once per TTL per quiz. When Firebase is down it
	 * falls back to the frozen postmeta values and sets a short marker so a
	 * burst of requests does not each wait on a failing call.
	 *
	 * @param int $quiz_id Quiz post ID.
	 * @return array
	 */
	public static function get_report( int $quiz_id ): array {
		$cache_key = 'quiz_' . $quiz_id;
		$cached    = wp_cache_get( $cache_key, Object_Cache::SUBMISSION_COUNTS_GROUP );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		$meta_report = self::get_meta_report( $quiz_id );

		if ( self::is_unavailable() ) {
			return self::counts_to_report( self::report_to_counts( $meta_report ) );
		}

		$node = self::fetch_counts_node( $quiz_id );
		if ( is_wp_error( $node ) ) {
			self::mark_unavailable( $node );
			return self::counts_to_report( self::report_to_counts( $meta_report ) );
		}

		$report = self::node_to_report( $node, $meta_report );

		wp_cache_set( $cache_key, $report, Object_Cache::SUBMISSION_COUNTS_GROUP, Object_Cache::SUBMISSION_COUNTS_TTL );

		return $report;
	}

	/**
	 * Get the full report straight from Firebase, bypassing every cache.
	 *
	 * For writers (CLI `report set|add|sync-firebase`). Writers compute a target
	 * from this report and `save_effective_report` subtracts the current live
	 * counts from it, so a stale snapshot would shift the baseline. Unlike
	 * `get_report`, this never falls back to postmeta: a failed read is an error.
	 *
	 * @param int $quiz_id Quiz post ID.
	 * @return array|WP_Error
	 */
	public static function get_fresh_report( int $quiz_id ) {
		$node = self::fetch_counts_node( $quiz_id );
		if ( is_wp_error( $node ) ) {
			return $node;
		}

		return self::node_to_report( $node, self::get_meta_report( $quiz_id ) );
	}

	/**
	 * Turn a `quiz/{id}/counts` node into a report in the old `_report` shape.
	 *
	 * @param array $node        Counts node with optional `legacy` and `live` children.
	 * @param array $meta_report Frozen `_report` postmeta, used as legacy until migrated.
	 * @return array
	 */
	private static function node_to_report( array $node, array $meta_report ): array {
		// Until the migration has run for this quiz, the frozen meta is the legacy half.
		$legacy = is_array( $node['legacy'] ?? null ) ? $node['legacy'] : self::report_to_counts( $meta_report );
		$live   = is_array( $node['live'] ?? null ) ? $node['live'] : array();

		return self::counts_to_report( self::sum_counts( $legacy, $live ) );
	}

	/**
	 * Get `{ total, first_24_hours, first_week }` for many quizzes from the totals index.
	 *
	 * One cached Firebase read serves any number of quizzes.
	 *
	 * @param int[] $quiz_ids Quiz post IDs.
	 * @return array<int, array{total: int, first_24_hours: int, first_week: int}> Keyed by quiz ID.
	 */
	public static function get_summaries( array $quiz_ids ): array {
		$quiz_ids  = array_values( array_unique( array_map( 'intval', $quiz_ids ) ) );
		$index     = self::get_index();
		$summary   = array();
		$need_meta = array();

		foreach ( $quiz_ids as $quiz_id ) {
			$entry = is_array( $index[ $quiz_id ] ?? null ) ? $index[ $quiz_id ] : array();
			if ( ! is_array( $entry['legacy'] ?? null ) ) {
				$need_meta[] = $quiz_id;
			}
			$summary[ $quiz_id ] = $entry;
		}

		if ( array() !== $need_meta ) {
			update_meta_cache( 'post', $need_meta );
		}

		$result = array();
		foreach ( $quiz_ids as $quiz_id ) {
			$entry  = $summary[ $quiz_id ];
			$legacy = is_array( $entry['legacy'] ?? null )
				? $entry['legacy']
				: self::report_to_counts( self::get_meta_report( $quiz_id ) );
			$live   = is_array( $entry['live'] ?? null ) ? $entry['live'] : array();

			$row = array();
			foreach ( self::SUMMARY_FIELDS as $field ) {
				$row[ $field ] = (int) ( $legacy[ $field ] ?? 0 ) + (int) ( $live[ $field ] ?? 0 );
			}
			$result[ $quiz_id ] = $row;
		}

		return $result;
	}

	/**
	 * Sort quiz IDs by total submissions without touching postmeta.
	 *
	 * Stable: quizzes with equal totals keep the order they arrived in.
	 *
	 * @param int[]  $quiz_ids Quiz post IDs.
	 * @param string $order    ASC or DESC.
	 * @return int[]
	 */
	public static function sort_ids_by_total( array $quiz_ids, string $order = 'DESC' ): array {
		$quiz_ids  = array_values( array_map( 'intval', $quiz_ids ) );
		$summaries = self::get_summaries( $quiz_ids );
		$direction = 'ASC' === strtoupper( $order ) ? 1 : -1;

		usort(
			$quiz_ids,
			static function ( int $a, int $b ) use ( $summaries, $direction ): int {
				return $direction * ( ( $summaries[ $a ]['total'] ?? 0 ) <=> ( $summaries[ $b ]['total'] ?? 0 ) );
			}
		);

		return $quiz_ids;
	}

	/**
	 * Read the whole totals index, cached.
	 *
	 * @return array<int, array>|null Index keyed by quiz ID, or null when Firebase is unavailable.
	 */
	private static function get_index(): ?array {
		$cached = wp_cache_get( self::INDEX_CACHE_KEY, Object_Cache::SUBMISSION_COUNTS_GROUP );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		if ( self::is_unavailable() ) {
			return null;
		}

		$ref = self::ref( 'quizTotals' );
		if ( null === $ref ) {
			self::mark_unavailable( 'Firebase database is not configured.' );
			return null;
		}

		try {
			$index = $ref->getValue();
		} catch ( \Throwable $e ) {
			self::mark_unavailable( $e );
			return null;
		}

		$index = is_array( $index ) ? $index : array();
		wp_cache_set( self::INDEX_CACHE_KEY, $index, Object_Cache::SUBMISSION_COUNTS_GROUP, Object_Cache::SUBMISSION_COUNTS_TTL );

		return $index;
	}

	/**
	 * Fetch `quiz/{id}/counts` straight from Firebase (no cache).
	 *
	 * @param int $quiz_id Quiz post ID.
	 * @return array{legacy?: array, live?: array}|WP_Error
	 */
	public static function fetch_counts_node( int $quiz_id ) {
		$ref = self::ref( 'quiz/' . $quiz_id . '/counts' );
		if ( null === $ref ) {
			return new WP_Error( 'firebase_not_configured', 'Firebase database is not configured.' );
		}

		try {
			$node = $ref->getValue();
		} catch ( \Throwable $e ) {
			return new WP_Error( 'firebase_error', 'Submission counts read failed: ' . $e->getMessage() );
		}

		return is_array( $node ) ? $node : array();
	}

	/**
	 * Fetch `quizTotals/{id}/legacy` straight from Firebase (no cache).
	 *
	 * @param int $quiz_id Quiz post ID.
	 * @return array|WP_Error
	 */
	public static function fetch_legacy_summary( int $quiz_id ) {
		$ref = self::ref( 'quizTotals/' . $quiz_id . '/legacy' );
		if ( null === $ref ) {
			return new WP_Error( 'firebase_not_configured', 'Firebase database is not configured.' );
		}

		try {
			$node = $ref->getValue();
		} catch ( \Throwable $e ) {
			return new WP_Error( 'firebase_error', 'Submission counts read failed: ' . $e->getMessage() );
		}

		return is_array( $node ) ? $node : array();
	}

	/**
	 * Write the legacy (baseline) counts for one or more quizzes.
	 *
	 * Sets `legacy` only. Live increments are never touched, so this is safe
	 * to repeat while submits continue. Idempotent: the same input writes the
	 * same values.
	 *
	 * @param array<int, array> $reports Map of quiz ID to a report in the old `_report` shape.
	 * @return true|WP_Error
	 */
	public static function write_legacy( array $reports ) {
		$updates = array();
		foreach ( $reports as $quiz_id => $report ) {
			$counts = self::report_to_counts( $report );

			$summary = array();
			foreach ( self::SUMMARY_FIELDS as $field ) {
				$summary[ $field ] = (int) $counts[ $field ];
			}

			$updates[ 'quiz/' . (int) $quiz_id . '/counts/legacy' ] = $counts;
			$updates[ 'quizTotals/' . (int) $quiz_id . '/legacy' ]  = $summary;
		}

		if ( array() === $updates ) {
			return true;
		}

		$result = self::write_updates( $updates );
		if ( true === $result ) {
			self::forget( array_map( 'intval', array_keys( $reports ) ) );
		}

		return $result;
	}

	/**
	 * Set the effective (legacy + live) report to a target by adjusting legacy.
	 *
	 * Backs `wp prc quiz report set|add|sync-firebase`, which used to rewrite
	 * the `_report` meta. Live counts are left alone; legacy absorbs the change.
	 *
	 * @param int   $quiz_id Quiz post ID.
	 * @param array $target  Desired effective report.
	 * @return true|WP_Error
	 */
	public static function save_effective_report( int $quiz_id, array $target ) {
		$node = self::fetch_counts_node( $quiz_id );
		if ( is_wp_error( $node ) ) {
			return $node;
		}

		$live   = is_array( $node['live'] ?? null ) ? $node['live'] : array();
		$legacy = self::sum_counts( self::report_to_counts( $target ), $live, -1 );

		if ( self::has_negative( $legacy ) ) {
			return new WP_Error(
				'target_below_live',
				'A requested count is lower than the submissions already counted live. Lower the live counts first or choose a higher value.'
			);
		}

		return self::write_legacy( array( $quiz_id => self::counts_to_report( $legacy ) ) );
	}

	/**
	 * Drop cached reads for quizzes whose stored counts just changed.
	 *
	 * @param int[] $quiz_ids Quiz post IDs.
	 */
	public static function forget( array $quiz_ids ): void {
		foreach ( $quiz_ids as $quiz_id ) {
			wp_cache_delete( 'quiz_' . (int) $quiz_id, Object_Cache::SUBMISSION_COUNTS_GROUP );
		}
		wp_cache_delete( self::INDEX_CACHE_KEY, Object_Cache::SUBMISSION_COUNTS_GROUP );
	}

	/**
	 * The frozen `_report` postmeta, as an array. Empty when absent.
	 *
	 * Reads only. Nothing writes this meta any more.
	 *
	 * @param int $quiz_id Quiz post ID.
	 * @return array
	 */
	public static function get_meta_report( int $quiz_id ): array {
		$data = get_post_meta( $quiz_id, Analytics::META_REPORT, true );
		return is_array( $data ) ? $data : array();
	}

	/**
	 * Whether the unavailable marker is set.
	 *
	 * @return bool
	 */
	private static function is_unavailable(): bool {
		return false !== wp_cache_get( self::UNAVAILABLE_CACHE_KEY, Object_Cache::SUBMISSION_COUNTS_GROUP );
	}

	/**
	 * Set the short unavailable marker and log why.
	 *
	 * @param \Throwable|WP_Error|string $error Failure.
	 */
	private static function mark_unavailable( $error ): void {
		wp_cache_set( self::UNAVAILABLE_CACHE_KEY, 1, Object_Cache::SUBMISSION_COUNTS_GROUP, Object_Cache::SUBMISSION_COUNTS_UNAVAILABLE_TTL );
		self::log_failure( 'read', $error );
	}

	/**
	 * Convert a stored counts node into the old `_report` shape.
	 *
	 * @param array $counts Counts node (`total`, `months`, `days`, ...).
	 * @return array
	 */
	public static function counts_to_report( array $counts ): array {
		$report = array(
			'first_24_hours' => (int) ( $counts['first_24_hours'] ?? 0 ),
			'first_week'     => (int) ( $counts['first_week'] ?? 0 ),
			'total'          => (int) ( $counts['total'] ?? 0 ),
		);

		$years = array();
		foreach ( (array) ( $counts['months'] ?? array() ) as $year => $months ) {
			if ( ! is_array( $months ) ) {
				continue;
			}
			foreach ( $months as $month => $count ) {
				$years[ (string) $year ][ self::pad( $month ) ] = (int) $count;
			}
		}
		foreach ( (array) ( $counts['days'] ?? array() ) as $year => $months ) {
			if ( ! is_array( $months ) ) {
				continue;
			}
			foreach ( $months as $month => $days ) {
				if ( ! is_array( $days ) ) {
					continue;
				}
				foreach ( $days as $day => $count ) {
					$years[ (string) $year ]['_days'][ self::pad( $month ) ][ self::pad( $day ) ] = (int) $count;
				}
			}
		}

		ksort( $years );
		foreach ( $years as $year => $buckets ) {
			ksort( $buckets );
			if ( isset( $buckets['_days'] ) ) {
				ksort( $buckets['_days'] );
				foreach ( $buckets['_days'] as $month => $days ) {
					ksort( $days );
					$buckets['_days'][ $month ] = $days;
				}
			}
			$report[ $year ] = $buckets;
		}

		return $report;
	}

	/**
	 * Convert an old-shape `_report` into a stored counts node.
	 *
	 * @param array $report Report (`total`, `{YYYY}: { MM: n, _days: {...} }`).
	 * @return array
	 */
	public static function report_to_counts( array $report ): array {
		$counts = array(
			'total'          => (int) ( $report['total'] ?? 0 ),
			'first_24_hours' => (int) ( $report['first_24_hours'] ?? 0 ),
			'first_week'     => (int) ( $report['first_week'] ?? 0 ),
		);

		foreach ( $report as $year => $buckets ) {
			if ( ! preg_match( '/^\d{4}$/', (string) $year ) || ! is_array( $buckets ) ) {
				continue;
			}
			foreach ( $buckets as $month => $value ) {
				if ( '_days' === (string) $month ) {
					if ( ! is_array( $value ) ) {
						continue;
					}
					foreach ( $value as $day_month => $days ) {
						if ( ! is_array( $days ) ) {
							continue;
						}
						foreach ( $days as $day => $count ) {
							$counts['days'][ (string) $year ][ self::pad( $day_month ) ][ self::pad( $day ) ] = (int) $count;
						}
					}
					continue;
				}
				$counts['months'][ (string) $year ][ self::pad( $month ) ] = (int) $value;
			}
		}

		return $counts;
	}

	/**
	 * Canonical form for comparing two counts nodes: ints only, zeros and empties dropped.
	 *
	 * @param array $counts Counts node.
	 * @return array
	 */
	public static function normalize_counts( array $counts ): array {
		$normalized = array();
		foreach ( self::report_to_counts( self::counts_to_report( $counts ) ) as $key => $value ) {
			if ( is_array( $value ) ) {
				$value = self::prune( $value );
				if ( array() === $value ) {
					continue;
				}
			} elseif ( 0 === (int) $value ) {
				continue;
			}
			$normalized[ $key ] = $value;
		}
		ksort( $normalized );
		return $normalized;
	}

	/**
	 * Recursively drop zero leaves and empty branches.
	 *
	 * @param array $tree Tree of ints.
	 * @return array
	 */
	private static function prune( array $tree ): array {
		foreach ( $tree as $key => $value ) {
			if ( is_array( $value ) ) {
				$value = self::prune( $value );
				if ( array() === $value ) {
					unset( $tree[ $key ] );
					continue;
				}
				$tree[ $key ] = $value;
			} elseif ( 0 === (int) $value ) {
				unset( $tree[ $key ] );
			}
		}
		return $tree;
	}

	/**
	 * Add (or subtract) two counts nodes leaf by leaf.
	 *
	 * @param array $a    Base counts.
	 * @param array $b    Counts to add.
	 * @param int   $sign 1 to add, -1 to subtract.
	 * @return array
	 */
	private static function sum_counts( array $a, array $b, int $sign = 1 ): array {
		$out = $a;
		foreach ( $b as $key => $value ) {
			if ( 'last_submission' === $key ) {
				continue;
			}
			if ( is_array( $value ) ) {
				$out[ $key ] = self::sum_counts( is_array( $out[ $key ] ?? null ) ? $out[ $key ] : array(), $value, $sign );
				continue;
			}
			$out[ $key ] = (int) ( $out[ $key ] ?? 0 ) + ( $sign * (int) $value );
		}
		return $out;
	}

	/**
	 * Whether any leaf in a counts tree is negative.
	 *
	 * @param array $tree Counts tree.
	 * @return bool
	 */
	private static function has_negative( array $tree ): bool {
		foreach ( $tree as $value ) {
			if ( is_array( $value ) ? self::has_negative( $value ) : (int) $value < 0 ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Zero-pad a month or day key. Firebase returns "05" as-is but 15 as an int.
	 *
	 * @param int|string $key Key.
	 * @return string
	 */
	private static function pad( $key ): string {
		return str_pad( (string) $key, 2, '0', STR_PAD_LEFT );
	}
}
