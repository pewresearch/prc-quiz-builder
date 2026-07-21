<?php
declare(strict_types=1);
/**
 * WP-CLI command: wp prc quiz report
 *
 * Ad hoc read/update of quiz `_report` post meta (submission analytics).
 *
 * @package PRC\Platform\Quiz
 */

namespace PRC\Platform\Quiz;

use WP_CLI;
use WP_CLI_Command;
use WP_CLI\Utils;

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	return;
}

/**
 * Manage quiz submission analytics stored in `_report` post meta.
 */
class CLI_Report extends WP_CLI_Command {

	/**
	 * Show the current `_report` data for a quiz.
	 *
	 * ## OPTIONS
	 *
	 * --quiz-id=<id>
	 * : WordPress post ID of the quiz.
	 *
	 * [--format=<format>]
	 * : Output format. table or json.
	 * ---
	 * default: table
	 * options:
	 *   - table
	 *   - json
	 * ---
	 *
	 * ## EXAMPLES
	 *
	 *     wp prc quiz report get --quiz-id=313764
	 *     wp prc quiz report get --quiz-id=313764 --format=json
	 *
	 * @param array $args       Positional arguments (unused).
	 * @param array $assoc_args Associative arguments.
	 */
	public function get( array $args, array $assoc_args ): void {
		self::assert_capability();

		$quiz_id = self::resolve_quiz_id( $assoc_args );
		$format  = Utils\get_flag_value( $assoc_args, 'format', 'table' );

		if ( ! in_array( $format, array( 'table', 'json' ), true ) ) {
			WP_CLI::error( 'Invalid --format. Use table or json.' );
		}

		$data = Analytics::get_report_data( $quiz_id );

		if ( 'json' === $format ) {
			WP_CLI::line( wp_json_encode( $data, JSON_PRETTY_PRINT ) );
			return;
		}

		$rows = array(
			array( 'field', 'value' ),
			array( 'first_24_hours', (string) ( $data['first_24_hours'] ?? 0 ) ),
			array( 'first_week', (string) ( $data['first_week'] ?? 0 ) ),
			array( 'total', (string) ( $data['total'] ?? 0 ) ),
		);

		foreach ( $data as $key => $value ) {
			if ( ! preg_match( '/^\d{4}$/', (string) $key ) || ! is_array( $value ) ) {
				continue;
			}
			$months = $value;
			$days   = array();
			if ( isset( $months['_days'] ) && is_array( $months['_days'] ) ) {
				$days = $months['_days'];
				unset( $months['_days'] );
			}
			ksort( $months );
			foreach ( $months as $month => $count ) {
				if ( ! preg_match( '/^\d{2}$/', (string) $month ) ) {
					continue;
				}
				$rows[] = array( $key . '.' . $month, (string) $count );
			}
			foreach ( $days as $month => $day_counts ) {
				if ( ! is_array( $day_counts ) ) {
					continue;
				}
				ksort( $day_counts );
				foreach ( $day_counts as $day => $count ) {
					$rows[] = array(
						$key . '.' . $month . '.' . str_pad( (string) $day, 2, '0', STR_PAD_LEFT ),
						(string) $count,
					);
				}
			}
		}

		Utils\format_items( 'table', array_slice( $rows, 1 ), array( 'field', 'value' ) );
	}

	/**
	 * Set absolute submission counts on a quiz report.
	 *
	 * ## OPTIONS
	 *
	 * --quiz-id=<id>
	 * : WordPress post ID of the quiz.
	 *
	 * [--year=<YYYY>]
	 * : Target year. Required when setting a month count.
	 *
	 * [--month=<MM>]
	 * : Target month (01-12). Required when setting a month or day count.
	 *
	 * [--day=<DD>]
	 * : Target day (01-31). When set with --month-count, updates the day bucket instead of the month total.
	 *
	 * [--month-count=<int>]
	 * : Absolute count for the target month (or day when --day is set).
	 *
	 * [--total=<int>]
	 * : Absolute all-time total.
	 *
	 * [--dry-run]
	 * : Preview changes without writing.
	 *
	 * ## EXAMPLES
	 *
	 *     wp prc quiz report set --quiz-id=313764 --year=2026 --month=06 --month-count=125653 --total=125653 --dry-run
	 *     wp prc quiz report set --quiz-id=313764 --year=2026 --month=06 --day=15 --month-count=42
	 *
	 * @param array $args       Positional arguments (unused).
	 * @param array $assoc_args Associative arguments.
	 */
	public function set( array $args, array $assoc_args ): void {
		self::assert_capability();

		$quiz_id     = self::resolve_quiz_id( $assoc_args );
		$dry_run     = (bool) Utils\get_flag_value( $assoc_args, 'dry-run', false );
		$month_count = Utils\get_flag_value( $assoc_args, 'month-count', null );
		$total       = Utils\get_flag_value( $assoc_args, 'total', null );
		$day         = Utils\get_flag_value( $assoc_args, 'day', null );

		if ( null === $month_count && null === $total ) {
			WP_CLI::error( 'Provide at least one of --month-count or --total.' );
		}

		$data = Analytics::get_report_data( $quiz_id );
		$before = $data;

		if ( null !== $month_count ) {
			list( $year, $month ) = self::resolve_year_month( $assoc_args );
			$value = self::parse_non_negative_int( $month_count, 'month-count' );
			if ( ! isset( $data[ $year ] ) || ! is_array( $data[ $year ] ) ) {
				$data[ $year ] = array();
			}
			if ( null !== $day ) {
				$day = self::normalize_day( (string) $day );
				if ( null === $day ) {
					WP_CLI::error( '--day must be between 01 and 31.' );
				}
				if ( ! isset( $data[ $year ]['_days'] ) || ! is_array( $data[ $year ]['_days'] ) ) {
					$data[ $year ]['_days'] = array();
				}
				if ( ! isset( $data[ $year ]['_days'][ $month ] ) || ! is_array( $data[ $year ]['_days'][ $month ] ) ) {
					$data[ $year ]['_days'][ $month ] = array();
				}
				$data[ $year ]['_days'][ $month ][ $day ] = $value;
			} else {
				$data[ $year ][ $month ] = $value;
			}
		}

		if ( null !== $total ) {
			$data['total'] = self::parse_non_negative_int( $total, 'total' );
		}

		self::commit_report( $quiz_id, $before, $data, $dry_run );
	}

	/**
	 * Add a delta to submission counts on a quiz report.
	 *
	 * ## OPTIONS
	 *
	 * --quiz-id=<id>
	 * : WordPress post ID of the quiz.
	 *
	 * [--year=<YYYY>]
	 * : Target year. Required when adjusting a month count.
	 *
	 * [--month=<MM>]
	 * : Target month (01-12). Required when adjusting a month or day count.
	 *
	 * [--day=<DD>]
	 * : Target day (01-31). When set with --month-count, adjusts the day bucket instead of the month total.
	 *
	 * [--month-count=<int>]
	 * : Delta to add to the target month (or day when --day is set).
	 *
	 * [--total=<int>]
	 * : Delta to add to the all-time total.
	 *
	 * [--dry-run]
	 * : Preview changes without writing.
	 *
	 * ## EXAMPLES
	 *
	 *     wp prc quiz report add --quiz-id=313764 --year=2026 --month=06 --month-count=500 --total=500 --dry-run
	 *     wp prc quiz report add --quiz-id=313764 --year=2026 --month=06 --day=15 --month-count=10
	 *
	 * @param array $args       Positional arguments (unused).
	 * @param array $assoc_args Associative arguments.
	 */
	public function add( array $args, array $assoc_args ): void {
		self::assert_capability();

		$quiz_id     = self::resolve_quiz_id( $assoc_args );
		$dry_run     = (bool) Utils\get_flag_value( $assoc_args, 'dry-run', false );
		$month_count = Utils\get_flag_value( $assoc_args, 'month-count', null );
		$total       = Utils\get_flag_value( $assoc_args, 'total', null );
		$day         = Utils\get_flag_value( $assoc_args, 'day', null );

		if ( null === $month_count && null === $total ) {
			WP_CLI::error( 'Provide at least one of --month-count or --total.' );
		}

		$data   = Analytics::get_report_data( $quiz_id );
		$before = $data;

		if ( null !== $month_count ) {
			list( $year, $month ) = self::resolve_year_month( $assoc_args );
			$delta = self::parse_signed_int( $month_count, 'month-count' );
			if ( ! isset( $data[ $year ] ) || ! is_array( $data[ $year ] ) ) {
				$data[ $year ] = array();
			}
			if ( null !== $day ) {
				$day = self::normalize_day( (string) $day );
				if ( null === $day ) {
					WP_CLI::error( '--day must be between 01 and 31.' );
				}
				if ( ! isset( $data[ $year ]['_days'] ) || ! is_array( $data[ $year ]['_days'] ) ) {
					$data[ $year ]['_days'] = array();
				}
				if ( ! isset( $data[ $year ]['_days'][ $month ] ) || ! is_array( $data[ $year ]['_days'][ $month ] ) ) {
					$data[ $year ]['_days'][ $month ] = array();
				}
				$current = (int) ( $data[ $year ]['_days'][ $month ][ $day ] ?? 0 );
				$data[ $year ]['_days'][ $month ][ $day ] = $current + $delta;
			} else {
				$current = (int) ( $data[ $year ][ $month ] ?? 0 );
				$data[ $year ][ $month ] = $current + $delta;
			}
		}

		if ( null !== $total ) {
			$delta           = self::parse_signed_int( $total, 'total' );
			$data['total'] = (int) ( $data['total'] ?? 0 ) + $delta;
		}

		self::commit_report( $quiz_id, $before, $data, $dry_run );
	}

	/**
	 * Sync quiz report counts from Firebase archetype hits.
	 *
	 * Loads the full `quiz/{id}/archetypes` node and sums each entry's `hits`
	 * property. Large quizzes may be slow and memory-intensive.
	 *
	 * ## OPTIONS
	 *
	 * --quiz-id=<id>
	 * : WordPress post ID of the quiz.
	 *
	 * --year=<YYYY>
	 * : Target year for the month adjustment.
	 *
	 * --month=<MM>
	 * : Target month (01-12).
	 *
	 * [--mode=<mode>]
	 * : How to apply Firebase hits.
	 * ---
	 * default: delta
	 * options:
	 *   - delta
	 *   - set
	 * ---
	 *
	 * [--dry-run]
	 * : Preview changes without writing.
	 *
	 * ## EXAMPLES
	 *
	 *     wp prc quiz report sync-firebase --quiz-id=313764 --year=2026 --month=06 --dry-run
	 *     wp prc quiz report sync-firebase --quiz-id=313764 --year=2026 --month=06
	 *
	 * @param array $args       Positional arguments (unused).
	 * @param array $assoc_args Associative arguments.
	 */
	public function sync_firebase( array $args, array $assoc_args ): void {
		self::assert_capability();

		$quiz_id = self::resolve_quiz_id( $assoc_args );
		$dry_run = (bool) Utils\get_flag_value( $assoc_args, 'dry-run', false );
		$mode    = Utils\get_flag_value( $assoc_args, 'mode', 'delta' );

		if ( ! in_array( $mode, array( 'delta', 'set' ), true ) ) {
			WP_CLI::error( 'Invalid --mode. Use delta or set.' );
		}

		list( $year, $month ) = self::resolve_year_month( $assoc_args );

		$firebase_hits = Analytics::sum_archetype_hits( $quiz_id );
		if ( is_wp_error( $firebase_hits ) ) {
			WP_CLI::error( $firebase_hits->get_error_message() );
		}

		$data          = Analytics::get_report_data( $quiz_id );
		$before        = $data;
		$current_total = (int) ( $data['total'] ?? 0 );
		$current_month = (int) ( ( $data[ $year ][ $month ] ?? 0 ) );

		WP_CLI::log( sprintf( 'Firebase archetype hits: %s', number_format( $firebase_hits ) ) );
		WP_CLI::log( sprintf( 'Current total:         %s', number_format( $current_total ) ) );
		WP_CLI::log( sprintf( 'Current %s/%s:  %s', $year, $month, number_format( $current_month ) ) );

		if ( 'set' === $mode ) {
			if ( ! isset( $data[ $year ] ) || ! is_array( $data[ $year ] ) ) {
				$data[ $year ] = array();
			}
			$data[ $year ][ $month ] = $firebase_hits;
			$data['total']           = $firebase_hits;
		} else {
			$delta = $firebase_hits - $current_total;
			WP_CLI::log( sprintf( 'Delta to apply:        %s', number_format( $delta ) ) );

			if ( $delta <= 0 ) {
				WP_CLI::warning( 'Nothing to backfill (delta <= 0).' );
				return;
			}

			if ( ! isset( $data[ $year ] ) || ! is_array( $data[ $year ] ) ) {
				$data[ $year ] = array();
			}
			$data[ $year ][ $month ] = $current_month + $delta;
			$data['total']           = $current_total + $delta;
		}

		self::commit_report( $quiz_id, $before, $data, $dry_run );
	}

	/**
	 * Assert the current user can manage quiz report data.
	 */
	private static function assert_capability(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			WP_CLI::error( 'You do not have permission to manage quiz report data (manage_options required).' );
		}
	}

	/**
	 * Resolve and validate quiz ID from CLI args.
	 *
	 * @param array $assoc_args Associative arguments.
	 * @return int
	 */
	private static function resolve_quiz_id( array $assoc_args ): int {
		$quiz_id = (int) Utils\get_flag_value( $assoc_args, 'quiz-id', 0 );
		if ( $quiz_id <= 0 ) {
			WP_CLI::error( '--quiz-id is required and must be a positive integer.' );
		}

		$post = get_post( $quiz_id );
		if ( ! $post || Plugin::$post_type !== $post->post_type ) {
			WP_CLI::error( sprintf( 'Quiz post %d not found.', $quiz_id ) );
		}

		return $quiz_id;
	}

	/**
	 * Resolve and validate year/month from CLI args.
	 *
	 * @param array $assoc_args Associative arguments.
	 * @return array{0: string, 1: string}
	 */
	private static function resolve_year_month( array $assoc_args ): array {
		$year = Utils\get_flag_value( $assoc_args, 'year', null );
		$month = Utils\get_flag_value( $assoc_args, 'month', null );

		if ( null === $year || null === $month ) {
			WP_CLI::error( '--year and --month are required when adjusting monthly counts.' );
		}

		$year = (string) $year;
		if ( ! preg_match( '/^\d{4}$/', $year ) ) {
			WP_CLI::error( '--year must be a four-digit year.' );
		}

		$month = self::normalize_month( (string) $month );
		if ( null === $month ) {
			WP_CLI::error( '--month must be between 01 and 12.' );
		}

		return array( $year, $month );
	}

	/**
	 * Normalize a month value to zero-padded 01-12.
	 *
	 * @param string $month Raw month input.
	 * @return string|null
	 */
	private static function normalize_month( string $month ): ?string {
		if ( preg_match( '/^\d{1,2}$/', $month ) ) {
			$month_int = (int) $month;
			if ( $month_int >= 1 && $month_int <= 12 ) {
				return str_pad( (string) $month_int, 2, '0', STR_PAD_LEFT );
			}
			return null;
		}

		if ( preg_match( '/^(0[1-9]|1[0-2])$/', $month ) ) {
			return $month;
		}

		return null;
	}

	/**
	 * Normalize a day value to zero-padded 01-31.
	 *
	 * @param string $day Raw day input.
	 * @return string|null
	 */
	private static function normalize_day( string $day ): ?string {
		if ( ! preg_match( '/^\d{1,2}$/', $day ) ) {
			return null;
		}
		$day_int = (int) $day;
		if ( $day_int < 1 || $day_int > 31 ) {
			return null;
		}
		return str_pad( (string) $day_int, 2, '0', STR_PAD_LEFT );
	}

	/**
	 * Parse a non-negative integer CLI flag.
	 *
	 * @param mixed  $value Raw value.
	 * @param string $flag  Flag name for error messages.
	 * @return int
	 */
	private static function parse_non_negative_int( $value, string $flag ): int {
		if ( ! is_numeric( $value ) ) {
			WP_CLI::error( sprintf( '--%s must be an integer.', $flag ) );
		}

		$int = (int) $value;
		if ( $int < 0 ) {
			WP_CLI::error( sprintf( '--%s must be zero or greater.', $flag ) );
		}

		return $int;
	}

	/**
	 * Parse a signed integer CLI flag.
	 *
	 * @param mixed  $value Raw value.
	 * @param string $flag  Flag name for error messages.
	 * @return int
	 */
	private static function parse_signed_int( $value, string $flag ): int {
		if ( ! is_numeric( $value ) ) {
			WP_CLI::error( sprintf( '--%s must be an integer.', $flag ) );
		}

		return (int) $value;
	}

	/**
	 * Print before/after summary and optionally persist report data.
	 *
	 * @param int   $quiz_id Quiz post ID.
	 * @param array $before  Report before changes.
	 * @param array $after   Report after changes.
	 * @param bool  $dry_run Whether to skip writing.
	 */
	private static function commit_report( int $quiz_id, array $before, array $after, bool $dry_run ): void {
		$rows = array(
			array(
				'field'  => 'total',
				'before' => (string) ( $before['total'] ?? 0 ),
				'after'  => (string) ( $after['total'] ?? 0 ),
			),
		);

		foreach ( $after as $key => $value ) {
			if ( ! preg_match( '/^\d{4}$/', (string) $key ) || ! is_array( $value ) ) {
				continue;
			}
			foreach ( $value as $month => $count ) {
				$before_count = (string) ( $before[ $key ][ $month ] ?? 0 );
				$after_count  = (string) $count;
				if ( $before_count === $after_count ) {
					continue;
				}
				$rows[] = array(
					'field'  => $key . '.' . $month,
					'before' => $before_count,
					'after'  => $after_count,
				);
			}
		}

		Utils\format_items( 'table', $rows, array( 'field', 'before', 'after' ) );

		if ( $dry_run ) {
			WP_CLI::success( 'Dry run complete — no changes written.' );
			return;
		}

		Analytics::save_report_data( $quiz_id, $after );
		WP_CLI::success( sprintf( 'Updated _report on quiz %d.', $quiz_id ) );
	}
}

WP_CLI::add_command( 'prc quiz report', '\\PRC\\Platform\\Quiz\\CLI_Report' );
