<?php
declare(strict_types=1);
/**
 * Quizzes DataViews admin list screen.
 *
 * @package PRC\Platform\Quiz
 */

namespace PRC\Platform\Quiz;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers the Quizzes DataViews list screen, points the "All Quizzes" menu item
 * at it, and redirects bare edit.php list URLs there (with a ?classic=1 escape).
 *
 * Quiz configuration lives in `prc-quiz/controller` block attributes inside
 * post_content, which SQL cannot filter on. This class mirrors the attributes the
 * list needs into post meta on save, and backfills existing quizzes in batches.
 */
class Quiz_List {
	/**
	 * Admin page slug for the DataViews list.
	 */
	public const PAGE_SLUG = 'prc-quiz-builder-library';

	/**
	 * Script and style handle for the list provider.
	 */
	public const SCRIPT_HANDLE = 'prc-quiz-builder-admin-dataview';

	/**
	 * Quiz type (`quiz`, `typology`, or `freeform`).
	 */
	public const META_TYPE = '_prc_quiz_type';

	/**
	 * Quiz display type (`paged`, `scrollable`, or `fluid`).
	 */
	public const META_DISPLAY_TYPE = '_prc_quiz_display_type';

	/**
	 * Whether community groups are enabled (`1` or `0`).
	 */
	public const META_GROUPS_ENABLED = '_prc_quiz_groups_enabled';

	/**
	 * Number of `prc-quiz/question` blocks in the quiz.
	 */
	public const META_QUESTION_COUNT = '_prc_quiz_question_count';

	/**
	 * Option flag recording that the list-meta backfill finished.
	 */
	public const BACKFILL_OPTION = 'prc_quiz_list_meta_backfill';

	/**
	 * Bump to re-run the backfill after changing what `sync_list_meta()` stores.
	 */
	public const BACKFILL_VERSION = '1';

	/**
	 * Quizzes synced per admin request while backfilling.
	 */
	private const BACKFILL_BATCH_SIZE = 50;

	/**
	 * Constructor.
	 *
	 * @param Loader $loader The loader.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'prc_wp_admin_dataview_register_lists', $this, 'register_list' );
		$loader->add_action( 'admin_enqueue_scripts', $this, 'enqueue_provider_assets', 20 );
		$loader->add_filter( 'prc_wp_admin_dataview_localize', $this, 'localize_provider', 10, 2 );
		$loader->add_action( 'save_post_' . Plugin::$post_type, $this, 'sync_list_meta', 10, 2 );
		$loader->add_action( 'admin_init', $this, 'maybe_backfill_list_meta' );
	}

	/**
	 * Register the quiz list with the shared DataViews shell.
	 *
	 * @param object $lists Shared list registry.
	 */
	public function register_list( $lists ): void {
		if ( ! is_object( $lists ) || ! method_exists( $lists, 'register' ) ) {
			return;
		}

		$lists->register(
			array(
				'postType'             => Plugin::$post_type,
				'pageSlug'             => self::PAGE_SLUG,
				'menuTitle'            => __( 'All Quizzes', 'prc-quiz' ),
				'pageTitle'            => __( 'All Quizzes', 'prc-quiz' ),
				'restPath'             => '/prc-api/v3/quiz/library',
				'hideDefaultNewButton' => true,
				'duplicate'            => array(
					'includeMeta' => array(
						self::META_TYPE,
						self::META_DISPLAY_TYPE,
						self::META_GROUPS_ENABLED,
						self::META_QUESTION_COUNT,
						'bylines',
						'acknowledgements',
						'displayBylines',
					),
				),
			)
		);
	}

	/**
	 * The capability that guards the list.
	 *
	 * The quiz post type uses `capability_type => 'page'`, so its edit capability
	 * is `edit_pages` rather than `edit_posts`. Read it off the post type object
	 * instead of hardcoding either one.
	 */
	public static function get_capability(): string {
		$post_type_object = get_post_type_object( Plugin::$post_type );

		if ( $post_type_object && isset( $post_type_object->cap->edit_posts ) ) {
			return (string) $post_type_object->cap->edit_posts;
		}

		return 'edit_posts';
	}

	/**
	 * Add quiz filter options to the shell boot data.
	 *
	 * @param array  $localize Localized shell data.
	 * @param string $post_type Current post type.
	 * @return array
	 */
	public function localize_provider( $localize, $post_type ) {
		if ( Plugin::$post_type !== $post_type ) {
			return $localize;
		}

		$localize['statuses'] = self::get_status_options();
		$localize['quiz']     = array(
			'newQuizUrl'   => esc_url_raw( admin_url( 'post-new.php?post_type=' . Plugin::$post_type ) ),
			'quizTypes'    => self::get_quiz_type_options(),
			'displayTypes' => self::get_display_type_options(),
		);

		return $localize;
	}

	/**
	 * Enqueue the quiz provider after the shared shell.
	 *
	 * @param string $hook_suffix Current admin hook.
	 */
	public function enqueue_provider_assets( $hook_suffix ): void {
		unset( $hook_suffix );

		if ( ! wp_script_is( 'prc-wp-admin-dataview', 'enqueued' ) ) {
			return;
		}

		$build_dir  = PRC_QUIZ_DIR . '/build/admin-dataview/';
		$asset_file = $build_dir . 'index.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = include $asset_file;

		wp_enqueue_script(
			self::SCRIPT_HANDLE,
			plugins_url( 'build/admin-dataview/index.js', PRC_QUIZ_FILE ),
			array_merge( $asset['dependencies'], array( 'prc-wp-admin-dataview' ) ),
			$asset['version'],
			true
		);

		if ( file_exists( $build_dir . 'style-index.css' ) ) {
			wp_enqueue_style(
				self::SCRIPT_HANDLE,
				plugins_url( 'build/admin-dataview/style-index.css', PRC_QUIZ_FILE ),
				array( 'wp-components' ),
				$asset['version']
			);
		}
	}

	/**
	 * Quiz type filter options.
	 *
	 * @return array<int, array{value: string, label: string}>
	 */
	public static function get_quiz_type_options(): array {
		return array(
			array(
				'value' => 'quiz',
				'label' => __( 'Knowledge Quiz', 'prc-quiz' ),
			),
			array(
				'value' => 'typology',
				'label' => __( 'Typology', 'prc-quiz' ),
			),
			array(
				'value' => 'freeform',
				'label' => __( 'Freeform', 'prc-quiz' ),
			),
		);
	}

	/**
	 * Display type filter options.
	 *
	 * @return array<int, array{value: string, label: string}>
	 */
	public static function get_display_type_options(): array {
		return array(
			array(
				'value' => 'paged',
				'label' => __( 'Paged', 'prc-quiz' ),
			),
			array(
				'value' => 'scrollable',
				'label' => __( 'Scrollable', 'prc-quiz' ),
			),
			array(
				'value' => 'fluid',
				'label' => __( 'Fluid', 'prc-quiz' ),
			),
		);
	}

	/**
	 * Post status filter options.
	 *
	 * @return array<int, array{value: string, label: string}>
	 */
	public static function get_status_options(): array {
		return array(
			array(
				'value' => 'publish',
				'label' => __( 'Published', 'prc-quiz' ),
			),
			array(
				'value' => 'draft',
				'label' => __( 'Draft', 'prc-quiz' ),
			),
			array(
				'value' => 'pending',
				'label' => __( 'Pending Review', 'prc-quiz' ),
			),
			array(
				'value' => 'private',
				'label' => __( 'Private', 'prc-quiz' ),
			),
			array(
				'value' => 'trash',
				'label' => __( 'Trash', 'prc-quiz' ),
			),
		);
	}

	/**
	 * Mirror `prc-quiz/controller` attributes into post meta so the list can
	 * filter and sort on them in SQL.
	 *
	 * @hook save_post_quiz
	 *
	 * @param int      $post_id The post ID.
	 * @param \WP_Post $post    The post object.
	 */
	public function sync_list_meta( $post_id, $post = null ): void {
		if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
			return;
		}

		if ( ! $post instanceof \WP_Post ) {
			$post = get_post( $post_id );
		}

		if ( ! $post instanceof \WP_Post ) {
			return;
		}

		self::store_list_meta( (int) $post_id, self::parse_list_meta( (string) $post->post_content ) );
	}

	/**
	 * Parse the list-relevant configuration out of quiz block markup.
	 *
	 * @param string $content Post content.
	 * @return array{type: string, display_type: string, groups_enabled: int, question_count: int}
	 */
	public static function parse_list_meta( string $content ): array {
		$parsed = array(
			'type'           => 'quiz',
			'display_type'   => 'paged',
			'groups_enabled' => 0,
			'question_count' => 0,
		);

		if ( '' === trim( $content ) ) {
			return $parsed;
		}

		$blocks     = parse_blocks( $content );
		$controller = self::find_block( $blocks, 'prc-quiz/controller' );

		if ( is_array( $controller ) ) {
			$attributes = $controller['attrs'] ?? array();

			if ( ! empty( $attributes['type'] ) && is_string( $attributes['type'] ) ) {
				$parsed['type'] = sanitize_key( $attributes['type'] );
			}
			if ( ! empty( $attributes['displayType'] ) && is_string( $attributes['displayType'] ) ) {
				$parsed['display_type'] = sanitize_key( $attributes['displayType'] );
			}
			$parsed['groups_enabled'] = ! empty( $attributes['groupsEnabled'] ) ? 1 : 0;
		}

		$parsed['question_count'] = self::count_blocks( $blocks, 'prc-quiz/question' );

		return $parsed;
	}

	/**
	 * Persist parsed list meta for a quiz.
	 *
	 * @param int   $post_id The post ID.
	 * @param array $parsed  Output of `parse_list_meta()`.
	 */
	public static function store_list_meta( int $post_id, array $parsed ): void {
		update_post_meta( $post_id, self::META_TYPE, (string) $parsed['type'] );
		update_post_meta( $post_id, self::META_DISPLAY_TYPE, (string) $parsed['display_type'] );
		update_post_meta( $post_id, self::META_GROUPS_ENABLED, (int) $parsed['groups_enabled'] );
		update_post_meta( $post_id, self::META_QUESTION_COUNT, (int) $parsed['question_count'] );

		// Quizzes that logged submissions before the scalar mirror existed only
		// have the `_report` array, which cannot be sorted on.
		if ( '' === (string) get_post_meta( $post_id, Analytics::META_SUBMISSIONS_TOTAL, true ) ) {
			$report = Analytics::get_report_data( $post_id );
			update_post_meta( $post_id, Analytics::META_SUBMISSIONS_TOTAL, (int) ( $report['total'] ?? 0 ) );
		}
	}

	/**
	 * Find the first block of a given name anywhere in a block tree.
	 *
	 * @param array  $blocks     Parsed blocks.
	 * @param string $block_name Block name to find.
	 * @return array|null
	 */
	private static function find_block( array $blocks, string $block_name ): ?array {
		foreach ( $blocks as $block ) {
			if ( ! is_array( $block ) ) {
				continue;
			}

			if ( ( $block['blockName'] ?? '' ) === $block_name ) {
				return $block;
			}

			if ( ! empty( $block['innerBlocks'] ) && is_array( $block['innerBlocks'] ) ) {
				$found = self::find_block( $block['innerBlocks'], $block_name );
				if ( null !== $found ) {
					return $found;
				}
			}
		}

		return null;
	}

	/**
	 * Count blocks of a given name anywhere in a block tree.
	 *
	 * @param array  $blocks     Parsed blocks.
	 * @param string $block_name Block name to count.
	 * @return int
	 */
	private static function count_blocks( array $blocks, string $block_name ): int {
		$count = 0;

		foreach ( $blocks as $block ) {
			if ( ! is_array( $block ) ) {
				continue;
			}

			if ( ( $block['blockName'] ?? '' ) === $block_name ) {
				++$count;
			}

			if ( ! empty( $block['innerBlocks'] ) && is_array( $block['innerBlocks'] ) ) {
				$count += self::count_blocks( $block['innerBlocks'], $block_name );
			}
		}

		return $count;
	}

	/**
	 * Backfill list meta for quizzes saved before this class existed.
	 *
	 * Runs a bounded batch per admin request and records completion in an
	 * option, so filters cover the whole archive without a manual CLI step.
	 *
	 * @hook admin_init
	 */
	public function maybe_backfill_list_meta(): void {
		if ( ! current_user_can( self::get_capability() ) ) {
			return;
		}

		self::run_backfill_batch();
	}

	/**
	 * Sync list meta for one batch of quizzes that are missing it.
	 *
	 * @return int Number of quizzes synced.
	 */
	public static function run_backfill_batch(): int {
		if ( self::BACKFILL_VERSION === get_option( self::BACKFILL_OPTION ) ) {
			return 0;
		}

		$query = new \WP_Query(
			array(
				'post_type'              => Plugin::$post_type,
				'post_status'            => 'any',
				'posts_per_page'         => self::BACKFILL_BATCH_SIZE,
				'fields'                 => 'ids',
				'no_found_rows'          => true,
				'update_post_term_cache' => false,
				'ignore_sticky_posts'    => true,
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
				'meta_query'             => array(
					array(
						'key'     => self::META_TYPE,
						'compare' => 'NOT EXISTS',
					),
				),
			)
		);

		if ( empty( $query->posts ) ) {
			update_option( self::BACKFILL_OPTION, self::BACKFILL_VERSION, false );
			return 0;
		}

		$synced = 0;

		foreach ( $query->posts as $post_id ) {
			$post = get_post( (int) $post_id );
			if ( ! $post instanceof \WP_Post ) {
				continue;
			}
			self::store_list_meta( (int) $post_id, self::parse_list_meta( (string) $post->post_content ) );
			++$synced;
		}

		return $synced;
	}

}
