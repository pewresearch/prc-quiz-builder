<?php
/**
 * Quiz group-owners audience build / list / delete service.
 *
 * Shared by WP-CLI and REST. Persists email lists in wp_options; does not
 * create newsletter drafts (callers may do that after build()).
 *
 * @package PRC\Platform\Quiz
 */

declare(strict_types=1);

namespace PRC\Platform\Quiz;

use PRC\Platform\CLI_Audience_Verification;
use WP_Error;

require_once dirname( __DIR__, 2 ) . '/prc-firebase/includes/trait-cli-audience-verification.php';

/**
 * Builds and manages system audiences for quiz group creators.
 */
class Audience_Service {
	use CLI_Audience_Verification;

	const AUDIENCE_OPTION_PREFIX = 'prc_email_audience_quiz_group_owners_';
	const FIREBASE_ENDPOINT_KEY  = 'quiz_group_owners_enqueue';

	/**
	 * Option key for a quiz group-owners audience list.
	 *
	 * @param int    $quiz_id      Quiz post ID.
	 * @param string $verification verified, unverified, or all.
	 */
	public static function option_key( int $quiz_id, string $verification ): string {
		return self::AUDIENCE_OPTION_PREFIX . $quiz_id . '_' . $verification;
	}

	/**
	 * List audience snapshots for a quiz (meta only, no email arrays).
	 *
	 * @param int $quiz_id Quiz post ID.
	 * @return array<int, array<string, mixed>>
	 */
	public static function list_for_quiz( int $quiz_id ): array {
		$audiences = array();
		foreach ( array( 'verified', 'unverified', 'all' ) as $mode ) {
			$key  = self::option_key( $quiz_id, $mode );
			$meta = get_option( $key . '_meta', null );
			if ( ! is_array( $meta ) || array_is_list( $meta ) ) {
				continue;
			}
			if ( ! ( isset( $meta['label'] ) || isset( $meta['built_at'] ) ) ) {
				continue;
			}
			$audiences[] = self::snapshot_from_meta( $key, $meta, $quiz_id, $mode );
		}

		return $audiences;
	}

	/**
	 * Register this builder with Email Builder when that plugin is active.
	 */
	public static function register_builder(): void {
		if ( ! class_exists( '\PRC\Platform\Email_Builder\Audience_Builder_Registry' ) ) {
			return;
		}

		\PRC\Platform\Email_Builder\Audience_Builder_Registry::register(
			array(
				'slug'                  => 'quiz-group-owners',
				'label'                 => 'Quiz group creators',
				'description'           => 'Users who created v2 groups for a quiz.',
				'option_prefix'         => self::AUDIENCE_OPTION_PREFIX,
				'form'                  => 'source-entity',
				'source_post_type'      => Plugin::$post_type,
				'source_id_param'       => 'quiz_id',
				'source_id_meta'        => 'quiz_id',
				'source_title_meta'     => 'quiz_title',
				'job_id_prefix'         => 'qz_',
				'firebase_endpoint_key' => self::FIREBASE_ENDPOINT_KEY,
				'supports_create_draft' => true,
				'parse_input'           => array( self::class, 'parse_job_input' ),
				'enqueue_body'          => array( self::class, 'enqueue_body' ),
				'import'                => array( self::class, 'import_artifact' ),
			)
		);
	}

	/**
	 * Parse REST / hub / CLI input for a quiz group-owners job.
	 *
	 * @param array<string, mixed> $input REST / hub / CLI input.
	 * @return array<string, mixed>|WP_Error
	 */
	public static function parse_job_input( array $input ): array|WP_Error {
		$quiz_id = (int) ( $input['quiz_id'] ?? $input['quizId'] ?? 0 );
		$quiz    = get_post( $quiz_id );
		if ( ! $quiz || Plugin::$post_type !== $quiz->post_type ) {
			return new WP_Error(
				'invalid_quiz',
				sprintf(
					'Post %d does not exist or is not a "%s" post type.',
					$quiz_id,
					Plugin::$post_type
				),
				array( 'status' => 404 )
			);
		}

		$verification = self::normalize_verification_mode(
			(string) ( $input['verification'] ?? 'verified' )
		);
		if ( is_wp_error( $verification ) ) {
			return $verification;
		}

		$label = isset( $input['label'] ) && is_string( $input['label'] )
			? trim( $input['label'] )
			: '';
		if ( '' === $label ) {
			$label = sprintf(
				'%s group creators%s',
				$quiz->post_title,
				self::verification_label_suffix( $verification )
			);
		}

		return array(
			'query'        => array(
				'quizId'       => $quiz_id,
				'verification' => $verification,
			),
			'label'        => $label,
			'dryRun'       => ! empty( $input['dryRun'] ) || ! empty( $input['dry_run'] ),
			'sourcePostId' => $quiz_id,
		);
	}

	/**
	 * Firebase enqueue HTTP body for a quiz group-owners job.
	 *
	 * @param array<string, mixed> $job Internal job record.
	 * @return array<string, mixed>
	 */
	public static function enqueue_body( array $job ): array {
		return array(
			'jobId'        => $job['jobId'],
			'quizId'       => $job['query']['quizId'],
			'verification' => $job['query']['verification'],
			'dryRun'       => ! empty( $job['dryRun'] ),
		);
	}

	/**
	 * Persist a finished quiz audience artifact under the existing option key.
	 *
	 * @param array<string, mixed> $job      Stored WordPress job.
	 * @param array<string, mixed> $artifact Decoded Cloud Storage artifact.
	 * @return array<string, mixed>|WP_Error
	 */
	public static function import_artifact( array $job, array $artifact ): array|WP_Error {
		$quiz_id      = (int) ( $job['query']['quizId'] ?? 0 );
		$verification = (string) ( $job['query']['verification'] ?? '' );
		if (
			1 !== ( $artifact['schemaVersion'] ?? null )
			|| ( $artifact['jobId'] ?? null ) !== $job['jobId']
			|| ! isset( $artifact['query'] )
			|| ! is_array( $artifact['query'] )
			|| (int) ( $artifact['query']['quizId'] ?? 0 ) !== $quiz_id
		) {
			return new WP_Error(
				'artifact_invalid',
				'The audience artifact does not match this job.',
				array( 'status' => 502 )
			);
		}
		if ( ( $artifact['query']['verification'] ?? null ) !== $verification ) {
			return new WP_Error(
				'verification_mismatch',
				'The audience artifact verification mode does not match this job.',
				array( 'status' => 502 )
			);
		}

		$emails = self::validated_artifact_emails( $artifact );
		if ( is_wp_error( $emails ) ) {
			return $emails;
		}

		$quiz = get_post( $quiz_id );
		if ( ! $quiz || Plugin::$post_type !== $quiz->post_type ) {
			return new WP_Error(
				'invalid_quiz',
				'The quiz for this audience job no longer exists.',
				array( 'status' => 404 )
			);
		}

		$audience_key = self::option_key( $quiz_id, $verification );
		$label        = is_string( $job['label'] ?? null ) && '' !== $job['label']
			? $job['label']
			: sprintf(
				'%s group creators%s',
				$quiz->post_title,
				self::verification_label_suffix( $verification )
			);
		$meta         = array(
			'label'          => $label,
			'count'          => count( $emails ),
			'verification'   => $verification,
			'quiz_id'        => $quiz_id,
			'quiz_title'     => $quiz->post_title,
			'scanned_groups' => (int) ( $artifact['scannedGroups'] ?? 0 ),
			'v2_groups'      => (int) ( $artifact['v2Groups'] ?? 0 ),
			'matched_users'  => (int) ( $artifact['matchedUsers'] ?? 0 ),
			'built_at'       => $artifact['builtAt'],
		);

		update_option( $audience_key, $emails, false );
		update_option( $audience_key . '_meta', $meta, false );

		return self::snapshot_from_meta( $audience_key, $meta, $quiz_id, $verification );
	}

	/**
	 * Enqueue a Firebase audience job. Does not wait for the scan.
	 *
	 * @param int    $quiz_id      Quiz post ID.
	 * @param string $verification verified, unverified, or all.
	 * @param array  $args         Optional dry_run (bool) and label (string|null).
	 * @return array|WP_Error Job view.
	 */
	public static function start_job( int $quiz_id, string $verification, array $args = array() ) {
		if ( ! class_exists( '\PRC\Platform\Email_Builder\Audience_Job' ) ) {
			return new WP_Error(
				'missing_email_builder',
				'Email Builder is required to start quiz audience jobs.',
				array( 'status' => 500 )
			);
		}

		return \PRC\Platform\Email_Builder\Audience_Job::start(
			'quiz-group-owners',
			array(
				'quiz_id'      => $quiz_id,
				'verification' => $verification,
				'label'        => $args['label'] ?? null,
				'dryRun'       => ! empty( $args['dry_run'] ),
			)
		);
	}

	/**
	 * Start a job and wait until it is ready or failed. CLI use.
	 *
	 * @param int    $quiz_id      Quiz post ID.
	 * @param string $verification verified, unverified, or all.
	 * @param array  $args         Optional dry_run (bool) and label (string|null).
	 * @return array|WP_Error Snapshot on success, or dry-run summary when dry_run.
	 */
	public static function build( int $quiz_id, string $verification, array $args = array() ) {
		$view = self::start_job( $quiz_id, $verification, $args );
		if ( is_wp_error( $view ) ) {
			return $view;
		}
		if ( 'failed' === ( $view['phase'] ?? '' ) ) {
			return new WP_Error(
				$view['error']['code'] ?? 'scan_failed',
				$view['error']['message'] ?? 'The audience job failed.',
				array( 'status' => 502 )
			);
		}

		$wait = \PRC\Platform\Email_Builder\Audience_Job::wait( (string) $view['jobId'] );
		if ( is_wp_error( $wait ) ) {
			return $wait;
		}
		if ( 'failed' === ( $wait['phase'] ?? '' ) ) {
			return new WP_Error(
				$wait['error']['code'] ?? 'scan_failed',
				$wait['error']['message'] ?? 'The audience job failed.',
				array( 'status' => 502 )
			);
		}

		$verification = (string) ( $wait['query']['verification'] ?? $verification );
		if ( ! empty( $wait['dryRun'] ) ) {
			return array(
				'key'          => self::option_key( $quiz_id, $verification ),
				'count'        => (int) ( $wait['count'] ?? 0 ),
				'verification' => $verification,
				'scanned'      => (int) ( $wait['scannedGroups'] ?? 0 ),
				'matched'      => (int) ( $wait['matchedUsers'] ?? 0 ),
				'v2_groups'    => (int) ( $wait['v2Groups'] ?? 0 ),
				'built_at'     => null,
				'dry_run'      => true,
			);
		}

		return $wait['audience'] ?? new WP_Error(
			'scan_failed',
			'The audience job finished without an imported list.',
			array( 'status' => 502 )
		);
	}

	/**
	 * Delete a quiz group-owners audience and its meta companion.
	 *
	 * @param int         $quiz_id      Quiz post ID.
	 * @param string|null $verification Mode, or null when $key is provided.
	 * @param string|null $key          Full option key (must belong to this quiz).
	 * @return array|WP_Error { deleted: true, key, referencing_post_ids }
	 */
	public static function delete( int $quiz_id, ?string $verification = null, ?string $key = null ) {
		if ( is_string( $key ) && '' !== $key ) {
			$audience_key = $key;
			$prefix       = self::AUDIENCE_OPTION_PREFIX . $quiz_id . '_';
			if ( 0 !== strpos( $audience_key, $prefix ) || str_ends_with( $audience_key, '_meta' ) ) {
				return new WP_Error(
					'audience_key_mismatch',
					'Audience key does not belong to this quiz.',
					array( 'status' => 400 )
				);
			}
		} else {
			$verification = self::normalize_verification_mode( (string) $verification );
			if ( is_wp_error( $verification ) ) {
				return $verification;
			}
			$audience_key = self::option_key( $quiz_id, $verification );
		}

		$existing = get_option( $audience_key, false );
		if ( false === $existing ) {
			return new WP_Error(
				'audience_not_found',
				sprintf( 'Audience option "%s" does not exist.', $audience_key ),
				array( 'status' => 404 )
			);
		}

		$referencing = self::find_newsletters_using_audience( $audience_key );
		delete_option( $audience_key );
		delete_option( $audience_key . '_meta' );

		return array(
			'deleted'              => true,
			'key'                  => $audience_key,
			'referencing_post_ids' => $referencing,
		);
	}

	/**
	 * Newsletter post IDs that reference this audience option key.
	 *
	 * @param string $audience_key Option key.
	 * @return int[]
	 */
	public static function find_newsletters_using_audience( string $audience_key ): array {
		global $wpdb;

		$ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT DISTINCT post_id FROM {$wpdb->postmeta} WHERE meta_key = %s AND meta_value = %s",
				'prc_email_audience_option_key',
				$audience_key
			)
		);

		return array_map( 'intval', empty( $ids ) ? array() : $ids );
	}

	/**
	 * Validate artifact emails and count.
	 *
	 * @param array<string, mixed> $artifact Decoded artifact.
	 * @return string[]|WP_Error
	 */
	private static function validated_artifact_emails( array $artifact ): array|WP_Error {
		$emails = $artifact['emails'] ?? null;
		if (
			! is_array( $emails )
			|| ! array_is_list( $emails )
			|| ! isset( $artifact['count'] )
			|| ! is_int( $artifact['count'] )
			|| count( $emails ) !== $artifact['count']
			|| ! isset( $artifact['builtAt'] )
			|| ! is_string( $artifact['builtAt'] )
		) {
			return new WP_Error(
				'artifact_invalid',
				'The audience artifact has an invalid shape.',
				array( 'status' => 502 )
			);
		}

		$validated = array();
		foreach ( $emails as $email ) {
			if ( ! is_string( $email ) ) {
				return new WP_Error(
					'artifact_invalid',
					'The audience artifact contains an invalid email.',
					array( 'status' => 502 )
				);
			}
			$normalized = strtolower( trim( $email ) );
			if ( ! is_email( $normalized ) ) {
				continue;
			}
			if ( isset( $validated[ $normalized ] ) ) {
				return new WP_Error(
					'artifact_invalid',
					'The audience artifact contains duplicate emails.',
					array( 'status' => 502 )
				);
			}
			$validated[ $normalized ] = $normalized;
		}

		return array_values( $validated );
	}

	/**
	 * Map stored meta to the editor snapshot shape.
	 *
	 * @param string $key          Option key.
	 * @param array  $meta         Meta array.
	 * @param int    $quiz_id      Quiz ID.
	 * @param string $verification Mode.
	 * @return array<string, mixed>
	 */
	private static function snapshot_from_meta( string $key, array $meta, int $quiz_id, string $verification ): array {
		$stats = array();
		if ( isset( $meta['scanned_groups'] ) ) {
			$stats['scanned'] = (int) $meta['scanned_groups'];
		}
		if ( isset( $meta['matched_users'] ) ) {
			$stats['matched'] = (int) $meta['matched_users'];
		}
		if ( isset( $meta['v2_groups'] ) ) {
			$stats['v2Groups'] = (int) $meta['v2_groups'];
		}

		return array(
			'key'                => $key,
			'label'              => $meta['label'] ?? $key,
			'count'              => (int) ( $meta['count'] ?? 0 ),
			'verification'       => $meta['verification'] ?? $verification,
			'quiz_id'            => (int) ( $meta['quiz_id'] ?? $quiz_id ),
			'built_at'           => $meta['built_at'] ?? null,
			'builtAt'            => $meta['built_at'] ?? null,
			'referencingPostIds' => self::find_newsletters_using_audience( $key ),
			'stats'              => $stats,
		);
	}
}
