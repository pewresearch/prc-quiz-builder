<?php
declare(strict_types=1);
/**
 * WP-CLI command: wp prc quiz build-group-owners-audience
 *
 * Calls the Firebase Cloud Function `buildQuizGroupOwnersAudience` to resolve
 * email addresses for all users who created v2 groups for a specific quiz.
 * Persists the email list in wp_options and optionally creates a draft
 * prc_email_txn post in system-email (Mandrill) delivery mode.
 *
 * Prerequisites:
 *  - Firebase Cloud Function `buildQuizGroupOwnersAudience` deployed with IAM restricted to the platform SA.
 *  - firebase-service-account.json in WPCOM_VIP_PRIVATE_DIR.
 *  - prc_platform_firebase_audiences_endpoints filter returning the function URL map.
 *
 * @package PRC\Platform\Quiz
 */

namespace PRC\Platform\Quiz;

use PRC\Platform\CLI_Audience_Verification;
use WP_CLI;
use WP_CLI_Command;
use WP_CLI\Utils;

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	return;
}

require_once dirname( __DIR__, 2 ) . '/prc-firebase/includes/trait-cli-audience-verification.php';

/**
 * Builds a newsletter recipient audience from Firebase quiz group owners.
 */
class CLI_Build_Audience extends WP_CLI_Command {

	use CLI_Audience_Verification;

	/**
	 * wp_options key prefix for audience email lists.
	 */
	const AUDIENCE_OPTION_PREFIX = 'prc_email_audience_quiz_group_owners_';

	/**
	 * Resolve email addresses for users who created v2 groups for a specific quiz
	 * and optionally create a draft newsletter post targeting them.
	 *
	 * Calls the Firebase Cloud Function `buildQuizGroupOwnersAudience` which reads
	 * quiz/{id}/groups, verifies v2 via users/{owner}/groups/{gid}/version, resolves
	 * UIDs to emails via Firebase Auth, and returns a deduped list. The email list
	 * is persisted in wp_options; a companion _meta option records provenance for
	 * the sidebar UI.
	 *
	 * ## OPTIONS
	 *
	 * --quiz-id=<id>
	 * : WordPress post ID of the quiz to build the audience for.
	 *
	 * [--dry-run]
	 * : Report the audience size from the Cloud Function without writing to
	 *   wp_options or creating a newsletter draft.
	 *
	 * [--no-create-post]
	 * : Persist the audience in wp_options but skip creating a newsletter draft.
	 *
	 * [--label=<text>]
	 * : Human-readable label for this audience. Defaults to "<quiz title> group creators (mode)".
	 *
	 * [--only-verified]
	 * : Include only users with a verified Firebase email (default when no verification flag is passed).
	 *
	 * [--only-unverified]
	 * : Include only users with an unverified Firebase email (must have an email on file).
	 *
	 * [--include-unverified]
	 * : Include all users with an email on file (verified and unverified). Mutually exclusive with the other verification flags.
	 *
	 * ## EXAMPLES
	 *
	 *     # Dry-run: verified group owners for quiz 5597
	 *     wp prc quiz build-group-owners-audience --quiz-id=5597 --dry-run
	 *
	 *     # Build verified-only audience and create a draft newsletter
	 *     wp prc quiz build-group-owners-audience --quiz-id=5597 --only-verified
	 *
	 *     # Unverified-only list (separate wp_options key)
	 *     wp prc quiz build-group-owners-audience --quiz-id=5597 --only-unverified --no-create-post
	 *
	 *     # All recipients with an email (verified + unverified)
	 *     wp prc quiz build-group-owners-audience --quiz-id=5597 --include-unverified --no-create-post
	 *
	 * @param array $args       Positional arguments (unused).
	 * @param array $assoc_args Associative arguments.
	 */
	public function __invoke( $args, $assoc_args ) {
		$quiz_id        = (int) Utils\get_flag_value( $assoc_args, 'quiz-id', 0 );
		$dry_run        = (bool) Utils\get_flag_value( $assoc_args, 'dry-run', false );
		$no_create_post = (bool) Utils\get_flag_value( $assoc_args, 'no-create-post', false );
		$label          = Utils\get_flag_value( $assoc_args, 'label', null );

		$verification = self::resolve_verification_mode( $assoc_args );

		// ── Validate quiz ─────────────────────────────────────────────────────
		if ( $quiz_id <= 0 ) {
			WP_CLI::error( '--quiz-id is required and must be a positive integer.' );
		}

		$quiz = get_post( $quiz_id );
		if ( ! $quiz || Plugin::$post_type !== $quiz->post_type ) {
			WP_CLI::error( sprintf(
				'Post %d does not exist or is not a "%s" post type.',
				$quiz_id,
				Plugin::$post_type
			) );
		}

		// ── Read Firebase config ──────────────────────────────────────────────
		$endpoints = apply_filters( 'prc_platform_firebase_audiences_endpoints', array() );
		$endpoint  = $endpoints['quiz_group_owners'] ?? '';

		if ( empty( $endpoint ) ) {
			WP_CLI::error(
				'No Firebase audiences endpoint configured for "quiz_group_owners". ' .
				'Ensure client-mu-plugins/firebase-audiences.php is loaded and ' .
				'PRC_PLATFORM_FIREBASE_PROJECT_ID is defined.'
			);
		}

		$firebase = new \PRC\Platform\Firebase();
		$id_token = $firebase->get_id_token( $endpoint );
		if ( is_wp_error( $id_token ) ) {
			WP_CLI::error( 'Failed to mint Firebase ID token: ' . $id_token->get_error_message() );
		}

		// ── Call the Cloud Function ───────────────────────────────────────────
		WP_CLI::line( sprintf(
			'Calling buildQuizGroupOwnersAudience for quiz %d ("%s", verification=%s)…',
			$quiz_id,
			$quiz->post_title,
			$verification
		) );

		$response = wp_remote_post(
			$endpoint,
			array(
				'timeout' => 540,
				'headers' => array(
					'Authorization' => 'Bearer ' . $id_token,
					'Content-Type'  => 'application/json',
				),
				'body'    => wp_json_encode(
					self::build_audience_request_body(
						array( 'quiz_id' => $quiz_id ),
						$verification
					)
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			WP_CLI::error( 'HTTP request to Firebase function failed: ' . $response->get_error_message() );
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		$body        = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 200 !== $status_code || empty( $body['success'] ) ) {
			$detail = $body['error'] ?? "HTTP {$status_code}";
			WP_CLI::error( "Firebase function returned an error: {$detail}" );
		}

		// Fail closed unless the function confirmed the requested cohort. This
		// catches outdated deployments that would otherwise return a different
		// (e.g. broader) audience than --only-unverified asked for.
		$verification = self::assert_response_verification( $body, $verification );

		$emails         = $body['emails'] ?? array();
		$count          = (int) ( $body['count'] ?? count( $emails ) );
		$scanned_groups = (int) ( $body['scanned_groups'] ?? 0 );
		$v2_groups      = (int) ( $body['v2_groups'] ?? 0 );
		$matched_users  = (int) ( $body['matched_users'] ?? 0 );
		$built_at       = $body['built_at'] ?? current_time( 'mysql', true );

		WP_CLI::line( sprintf(
			'Scanned %s groups → %s v2 → %s unique owners → %s email(s) (%s).',
			number_format( $scanned_groups ),
			number_format( $v2_groups ),
			number_format( $matched_users ),
			number_format( $count ),
			$verification
		) );

		if ( $dry_run ) {
			WP_CLI::success( 'Dry-run complete. No data written.' );
			return;
		}

		// ── Persist to wp_options ─────────────────────────────────────────────
		$audience_key = self::AUDIENCE_OPTION_PREFIX . $quiz_id . '_' . $verification;
		$meta_key     = $audience_key . '_meta';
		$final_label  = $label ?? sprintf(
			'%s group creators%s',
			$quiz->post_title,
			self::verification_label_suffix( $verification )
		);

		update_option( $audience_key, $emails, false );
		update_option(
			$meta_key,
			array(
				'label'          => $final_label,
				'count'          => $count,
				'verification'   => $verification,
				'quiz_id'        => $quiz_id,
				'quiz_title'     => $quiz->post_title,
				'scanned_groups' => $scanned_groups,
				'v2_groups'      => $v2_groups,
				'matched_users'  => $matched_users,
				'built_at'       => $built_at,
			),
			false
		);

		WP_CLI::line( sprintf(
			'Audience saved → option key: %s',
			$audience_key
		) );

		// ── Optionally create a draft newsletter ──────────────────────────────
		if ( $no_create_post ) {
			WP_CLI::success( sprintf(
				'Done. Audience option: %s  |  %s email(s)',
				$audience_key,
				number_format( $count )
			) );
			return;
		}

		if ( ! post_type_exists( 'prc_email_txn' ) ) {
			WP_CLI::warning(
				'The "prc_email_txn" post type is not registered. ' .
				'Ensure prc-email-builder is active. Skipping post creation.'
			);
			WP_CLI::success( sprintf(
				'Done. Audience option: %s  |  %s email(s)',
				$audience_key,
				number_format( $count )
			) );
			return;
		}

		$mode_title = self::verification_title_fragment( $verification );

		$post_id = wp_insert_post(
			array(
				'post_type'   => 'prc_email_txn',
				'post_status' => 'draft',
				'post_title'  => sprintf(
					'Update for %s group creators%s',
					$quiz->post_title,
					$mode_title
				),
				'meta_input'  => array(
					'prc_email_delivery_mode'       => 'mandrill',
					'prc_email_audience_option_key' => $audience_key,
					'prc_email_subject'             => sprintf(
						'Update: %s%s',
						$quiz->post_title,
						$mode_title
					),
				),
			),
			true
		);

		if ( is_wp_error( $post_id ) ) {
			WP_CLI::warning( 'Could not create newsletter draft: ' . $post_id->get_error_message() );
		} else {
			$edit_url = admin_url( "post.php?post={$post_id}&action=edit" );
			WP_CLI::line( sprintf( 'Newsletter draft created → %s', $edit_url ) );
		}

		WP_CLI::success( sprintf(
			'Done. Audience option: %s  |  %s email(s)',
			$audience_key,
			number_format( $count )
		) );
	}
}

WP_CLI::add_command( 'prc quiz build-group-owners-audience', '\\PRC\\Platform\\Quiz\\CLI_Build_Audience' );
