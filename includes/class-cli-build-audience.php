<?php
declare(strict_types=1);
/**
 * WP-CLI command: wp prc quiz build-group-owners-audience
 *
 * Thin wrapper around Audience_Service. Optionally creates a draft
 * prc_email_txn after a successful build.
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
	 * Resolve email addresses for users who created v2 groups for a specific quiz
	 * and optionally create a draft newsletter post targeting them.
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
	 *     wp prc quiz build-group-owners-audience --quiz-id=5597 --dry-run
	 *     wp prc quiz build-group-owners-audience --quiz-id=5597 --only-verified
	 *     wp prc quiz build-group-owners-audience --quiz-id=5597 --only-unverified --no-create-post
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
		$verification   = self::resolve_verification_mode( $assoc_args );

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

		WP_CLI::line( sprintf(
			'Calling buildQuizGroupOwnersAudience for quiz %d ("%s", verification=%s)…',
			$quiz_id,
			$quiz->post_title,
			$verification
		) );

		$result = Audience_Service::build(
			$quiz_id,
			$verification,
			array(
				'dry_run' => $dry_run,
				'label'   => $label,
			)
		);

		if ( is_wp_error( $result ) ) {
			WP_CLI::error( $result->get_error_message() );
		}

		$stats = $result['stats'] ?? array();
		WP_CLI::line( sprintf(
			'Scanned %s groups → %s v2 → %s unique owners → %s email(s) (%s).',
			number_format( (int) ( $stats['scanned'] ?? $result['scanned'] ?? 0 ) ),
			number_format( (int) ( $stats['v2Groups'] ?? $result['v2_groups'] ?? 0 ) ),
			number_format( (int) ( $stats['matched'] ?? $result['matched'] ?? 0 ) ),
			number_format( (int) ( $result['count'] ?? 0 ) ),
			$result['verification'] ?? $verification
		) );

		if ( $dry_run ) {
			WP_CLI::success( 'Dry-run complete. No data written.' );
			return;
		}

		$audience_key = $result['key'];
		WP_CLI::line( sprintf( 'Audience saved → option key: %s', $audience_key ) );

		if ( $no_create_post ) {
			WP_CLI::success( sprintf(
				'Done. Audience option: %s  |  %s email(s)',
				$audience_key,
				number_format( (int) $result['count'] )
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
				number_format( (int) $result['count'] )
			) );
			return;
		}

		$mode_title = self::verification_title_fragment( $result['verification'] ?? $verification );

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
			number_format( (int) $result['count'] )
		) );
	}
}

WP_CLI::add_command( 'prc quiz build-group-owners-audience', '\\PRC\\Platform\\Quiz\\CLI_Build_Audience' );
