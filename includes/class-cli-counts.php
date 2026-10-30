<?php
/**
 * WP-CLI command: wp prc quiz counts
 *
 * One-time migration of quiz submission counts from the `_report` and
 * `_prc_quiz_submissions_total` post meta into Firebase Realtime Database.
 *
 * Rollout order: migrate --dry-run, migrate, verify, soak, cleanup.
 *
 * `migrate` and `verify` never write postmeta, so they never touch core's
 * `posts` last_changed salt. `cleanup` deletes postmeta; it suppresses the
 * per-delete bump and bumps the salt once at the end (see `cleanup()`).
 *
 * @package PRC\Platform\Quiz
 */

declare(strict_types=1);

namespace PRC\Platform\Quiz;

use WP_CLI;
use WP_CLI_Command;
use WP_CLI\Utils;

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	return;
}

/**
 * Migrate quiz submission counts from post meta to Firebase.
 */
class CLI_Counts extends WP_CLI_Command {

	/**
	 * Quizzes loaded per query when collecting IDs.
	 */
	private const ID_BATCH_SIZE = 500;

	/**
	 * Hooks core uses to bump the site-wide `posts` last_changed salt on meta writes.
	 */
	private const POST_META_VERSION_HOOKS = array( 'added_post_meta', 'updated_post_meta', 'deleted_post_meta' );

	/**
	 * Copy existing post meta counts into Firebase as the `legacy` baseline.
	 *
	 * Writes only `legacy` (and the totals index `legacy`); live submit
	 * increments are never touched. Re-running writes the same values, so it is
	 * idempotent and safe while submits continue. Reads postmeta, writes none.
	 *
	 * ## OPTIONS
	 *
	 * [--quiz-id=<id>]
	 * : Migrate a single quiz. Default: every quiz with `_report` meta.
	 *
	 * [--batch-size=<n>]
	 * : Quizzes per Firebase update.
	 * ---
	 * default: 50
	 * ---
	 *
	 * [--dry-run]
	 * : Print what would change and write nothing.
	 *
	 * ## EXAMPLES
	 *
	 *     wp prc quiz counts migrate --dry-run
	 *     wp prc quiz counts migrate --quiz-id=313764
	 *     wp prc quiz counts migrate
	 *
	 * @param array $args       Positional arguments (unused).
	 * @param array $assoc_args Associative arguments.
	 */
	public function migrate( array $args, array $assoc_args ): void {
		self::assert_ready();

		$dry_run    = (bool) Utils\get_flag_value( $assoc_args, 'dry-run', false );
		$batch_size = self::resolve_batch_size( $assoc_args );
		$quiz_ids   = self::resolve_quiz_ids( $assoc_args );

		if ( array() === $quiz_ids ) {
			WP_CLI::success( 'No quizzes with legacy submission meta. Nothing to migrate.' );
			return;
		}

		$rows    = array();
		$written = 0;

		foreach ( array_chunk( $quiz_ids, $batch_size ) as $batch ) {
			$reports = array();
			foreach ( $batch as $quiz_id ) {
				$report = Submission_Counts::get_meta_report( $quiz_id );
				if ( array() === $report ) {
					continue;
				}
				$reports[ $quiz_id ] = $report;

				$existing = Submission_Counts::fetch_legacy_summary( $quiz_id );
				if ( is_wp_error( $existing ) ) {
					WP_CLI::error( $existing->get_error_message() );
				}

				$meta_total = (int) ( $report['total'] ?? 0 );
				$fb_total   = array_key_exists( 'total', $existing ) ? (int) $existing['total'] : null;

				$rows[] = array(
					'quiz_id'        => $quiz_id,
					'meta_total'     => $meta_total,
					'firebase_total' => null === $fb_total ? '-' : $fb_total,
					'action'         => $meta_total === $fb_total ? 'rewrite (same)' : 'write',
				);
			}

			if ( $dry_run || array() === $reports ) {
				continue;
			}

			$result = Submission_Counts::write_legacy( $reports );
			if ( is_wp_error( $result ) ) {
				WP_CLI::error( $result->get_error_message() );
			}
			$written += count( $reports );
			WP_CLI::log( sprintf( 'Wrote legacy counts for %d quizzes (%d total).', count( $reports ), $written ) );
		}

		Utils\format_items( 'table', $rows, array( 'quiz_id', 'meta_total', 'firebase_total', 'action' ) );

		if ( $dry_run ) {
			WP_CLI::success( sprintf( 'Dry run complete: %d quizzes would be written. No changes made.', count( $rows ) ) );
			return;
		}

		WP_CLI::success( sprintf( 'Migrated %d quizzes. Run `wp prc quiz counts verify` next.', $written ) );
	}

	/**
	 * Compare Firebase legacy counts with the post meta they were copied from.
	 *
	 * Deep-compares every month and day bucket plus the totals index. Exits
	 * non-zero on any mismatch. Live counts are not compared: they only exist
	 * in Firebase.
	 *
	 * ## OPTIONS
	 *
	 * [--quiz-id=<id>]
	 * : Verify a single quiz. Default: every quiz with `_report` meta.
	 *
	 * ## EXAMPLES
	 *
	 *     wp prc quiz counts verify
	 *     wp prc quiz counts verify --quiz-id=313764
	 *
	 * @param array $args       Positional arguments (unused).
	 * @param array $assoc_args Associative arguments.
	 */
	public function verify( array $args, array $assoc_args ): void {
		self::assert_ready();

		$quiz_ids = self::resolve_quiz_ids( $assoc_args );
		if ( array() === $quiz_ids ) {
			WP_CLI::success( 'No quizzes with legacy submission meta. Nothing to verify.' );
			return;
		}

		$rows      = array();
		$mismatch  = 0;
		$unmatched = array();

		foreach ( $quiz_ids as $quiz_id ) {
			$result = self::compare_quiz( $quiz_id );
			if ( is_wp_error( $result ) ) {
				WP_CLI::error( $result->get_error_message() );
			}
			if ( null === $result ) {
				continue;
			}

			$rows[] = array(
				'quiz_id'  => $quiz_id,
				'status'   => $result['match'] ? 'match' : 'MISMATCH',
				'meta'     => $result['meta_total'],
				'firebase' => $result['firebase_total'],
			);

			if ( ! $result['match'] ) {
				++$mismatch;
				$unmatched[] = $quiz_id;
			}
		}

		Utils\format_items( 'table', $rows, array( 'quiz_id', 'status', 'meta', 'firebase' ) );

		if ( $mismatch > 0 ) {
			WP_CLI::error(
				sprintf(
					'%d of %d quizzes do not match: %s. Re-run `wp prc quiz counts migrate`.',
					$mismatch,
					count( $rows ),
					implode( ', ', $unmatched )
				)
			);
		}

		WP_CLI::success( sprintf( 'All %d quizzes match.', count( $rows ) ) );
	}

	/**
	 * Delete the old post meta once Firebase holds the same counts.
	 *
	 * A separate, explicit step. Deletes `_report` and
	 * `_prc_quiz_submissions_total` only for quizzes where verify matches;
	 * mismatched quizzes are skipped and reported.
	 *
	 * Impact on caching: each `delete_post_meta` would bump core's `posts`
	 * last_changed salt (a site-wide WP_Query cache flush). This command holds
	 * those bumps back and bumps the salt once at the end, so a full run costs
	 * one cold-cache event no matter how many quizzes it cleans. Run it in a
	 * low-traffic window.
	 *
	 * ## OPTIONS
	 *
	 * [--quiz-id=<id>]
	 * : Clean a single quiz. Default: every quiz with legacy meta.
	 *
	 * [--dry-run]
	 * : Print what would be deleted and delete nothing.
	 *
	 * [--yes]
	 * : Skip the confirmation prompt.
	 *
	 * ## EXAMPLES
	 *
	 *     wp prc quiz counts cleanup --dry-run
	 *     wp prc quiz counts cleanup --yes
	 *
	 * @param array $args       Positional arguments (unused).
	 * @param array $assoc_args Associative arguments.
	 */
	public function cleanup( array $args, array $assoc_args ): void {
		self::assert_ready();

		$dry_run  = (bool) Utils\get_flag_value( $assoc_args, 'dry-run', false );
		$quiz_ids = self::resolve_quiz_ids( $assoc_args );

		if ( array() === $quiz_ids ) {
			WP_CLI::success( 'No quizzes with legacy submission meta. Nothing to clean up.' );
			return;
		}

		$eligible = array();
		$skipped  = array();

		foreach ( $quiz_ids as $quiz_id ) {
			$result = self::compare_quiz( $quiz_id );
			if ( is_wp_error( $result ) ) {
				WP_CLI::error( $result->get_error_message() );
			}
			if ( null !== $result && $result['match'] ) {
				$eligible[] = $quiz_id;
			} else {
				$skipped[] = $quiz_id;
			}
		}

		WP_CLI::log(
			sprintf(
				'%d quizzes verified and eligible. %d skipped (no report or mismatch).',
				count( $eligible ),
				count( $skipped )
			)
		);
		if ( array() !== $skipped ) {
			WP_CLI::warning( 'Skipped: ' . implode( ', ', $skipped ) );
		}

		if ( $dry_run ) {
			WP_CLI::success( sprintf( 'Dry run complete: would delete legacy meta on %d quizzes. No changes made.', count( $eligible ) ) );
			return;
		}

		if ( array() === $eligible ) {
			WP_CLI::success( 'Nothing eligible to delete.' );
			return;
		}

		WP_CLI::confirm(
			sprintf( 'Delete `_report` and `_prc_quiz_submissions_total` on %d quizzes? Firebase holds the counts now.', count( $eligible ) ),
			$assoc_args
		);

		$hooks   = self::hold_back_posts_salt();
		$deleted = 0;
		try {
			foreach ( $eligible as $quiz_id ) {
				delete_post_meta( $quiz_id, Analytics::META_REPORT );
				delete_post_meta( $quiz_id, Analytics::META_SUBMISSIONS_TOTAL );
				++$deleted;
			}
		} finally {
			self::restore_posts_salt( $hooks, $deleted );
		}

		WP_CLI::success(
			sprintf(
				'Deleted legacy meta on %d quizzes. The `posts` cache salt was bumped once.',
				$deleted
			)
		);
	}

	/**
	 * Compare one quiz's meta against its Firebase legacy counts.
	 *
	 * @param int $quiz_id Quiz post ID.
	 * @return array{match: bool, meta_total: int, firebase_total: int|string}|WP_Error|null Null when the quiz has no `_report` meta.
	 */
	private static function compare_quiz( int $quiz_id ) {
		$report = Submission_Counts::get_meta_report( $quiz_id );
		if ( array() === $report ) {
			return null;
		}

		$node = Submission_Counts::fetch_counts_node( $quiz_id );
		if ( is_wp_error( $node ) ) {
			return $node;
		}
		$summary = Submission_Counts::fetch_legacy_summary( $quiz_id );
		if ( is_wp_error( $summary ) ) {
			return $summary;
		}

		$expected = Submission_Counts::normalize_counts( Submission_Counts::report_to_counts( $report ) );
		$legacy   = is_array( $node['legacy'] ?? null ) ? $node['legacy'] : null;
		$actual   = null === $legacy ? null : Submission_Counts::normalize_counts( $legacy );

		$expected_summary = array();
		foreach ( Submission_Counts::SUMMARY_FIELDS as $field ) {
			$expected_summary[ $field ] = (int) ( $expected[ $field ] ?? 0 );
		}
		$actual_summary = array();
		foreach ( Submission_Counts::SUMMARY_FIELDS as $field ) {
			$actual_summary[ $field ] = (int) ( $summary[ $field ] ?? 0 );
		}

		return array(
			'match'          => null !== $actual && $expected === $actual && $expected_summary === $actual_summary,
			'meta_total'     => (int) ( $expected['total'] ?? 0 ),
			'firebase_total' => null === $legacy ? '-' : (int) ( $actual['total'] ?? 0 ),
		);
	}

	/**
	 * Remove core's per-meta-write `posts` salt bump.
	 *
	 * @return array<string, int> Hook name => priority that was removed.
	 */
	private static function hold_back_posts_salt(): array {
		$hooks = array();
		foreach ( self::POST_META_VERSION_HOOKS as $hook ) {
			$priority = has_action( $hook, 'wp_cache_set_posts_last_changed' );
			if ( false !== $priority ) {
				remove_action( $hook, 'wp_cache_set_posts_last_changed', $priority );
				$hooks[ $hook ] = $priority;
			}
		}
		return $hooks;
	}

	/**
	 * Restore the salt hooks and bump once if anything was deleted.
	 *
	 * @param array<string, int> $hooks   Output of `hold_back_posts_salt()`.
	 * @param int                $deleted Quizzes changed.
	 */
	private static function restore_posts_salt( array $hooks, int $deleted ): void {
		foreach ( $hooks as $hook => $priority ) {
			add_action( $hook, 'wp_cache_set_posts_last_changed', $priority );
		}
		if ( $deleted > 0 ) {
			wp_cache_set_posts_last_changed();
		}
	}

	/**
	 * Quiz IDs to process: the one given, or every quiz with legacy meta.
	 *
	 * @param array $assoc_args Associative arguments.
	 * @return int[]
	 */
	private static function resolve_quiz_ids( array $assoc_args ): array {
		$quiz_id = (int) Utils\get_flag_value( $assoc_args, 'quiz-id', 0 );
		if ( $quiz_id > 0 ) {
			$post = get_post( $quiz_id );
			if ( ! $post || Plugin::$post_type !== $post->post_type ) {
				WP_CLI::error( sprintf( 'Quiz post %d not found.', $quiz_id ) );
			}
			return array( $quiz_id );
		}

		$ids      = array();
		$paged    = 1;
		$has_more = true;
		while ( $has_more ) {
			$query    = new \WP_Query(
				array(
					'post_type'              => Plugin::$post_type,
					'post_status'            => 'any',
					'posts_per_page'         => self::ID_BATCH_SIZE,
					'paged'                  => $paged,
					'fields'                 => 'ids',
					'orderby'                => 'ID',
					'order'                  => 'ASC',
					'no_found_rows'          => true,
					'ignore_sticky_posts'    => true,
					'update_post_meta_cache' => false,
					'update_post_term_cache' => false,
					// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
					'meta_query'             => array(
						'relation' => 'OR',
						array(
							'key'     => Analytics::META_REPORT,
							'compare' => 'EXISTS',
						),
						array(
							'key'     => Analytics::META_SUBMISSIONS_TOTAL,
							'compare' => 'EXISTS',
						),
					),
				)
			);
			$ids      = array_merge( $ids, array_map( 'intval', $query->posts ) );
			$has_more = count( $query->posts ) === self::ID_BATCH_SIZE;
			++$paged;
		}

		return $ids;
	}

	/**
	 * Validate --batch-size.
	 *
	 * @param array $assoc_args Associative arguments.
	 * @return int
	 */
	private static function resolve_batch_size( array $assoc_args ): int {
		$size = (int) Utils\get_flag_value( $assoc_args, 'batch-size', 50 );
		if ( $size < 1 || $size > 500 ) {
			WP_CLI::error( '--batch-size must be between 1 and 500.' );
		}
		return $size;
	}

	/**
	 * Assert the caller may run this and Firebase is configured.
	 */
	private static function assert_ready(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			WP_CLI::error( 'You do not have permission to migrate quiz counts (manage_options required).' );
		}
		if ( null === Submission_Counts::ref() ) {
			WP_CLI::error( 'Firebase database is not configured. Nothing was read or written.' );
		}
	}
}

WP_CLI::add_command( 'prc quiz counts', '\\PRC\\Platform\\Quiz\\CLI_Counts' );
