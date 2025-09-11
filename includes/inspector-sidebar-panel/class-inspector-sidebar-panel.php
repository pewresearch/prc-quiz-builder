<?php
/**
 * Inspector Sidebar Panel for Quiz Analytics
 *
 * @package PRC\Platform\Quiz
 */

namespace PRC\Platform\Quiz;

use WP_Error;

/**
 * Inspector Sidebar Panel for Quiz Analytics
 *
 * @package PRC\Platform\Quiz
 */
class Inspector_Sidebar_Panel {

	/**
	 * Handle for the inspector sidebar panel editor assets.
	 *
	 * @var string
	 */
	protected static $handle = 'prc-quiz-builder-inspector-sidebar-panel';

	/**
	 * Constructor.
	 *
	 * @param \PRC\Platform\Quiz\Loader $loader The loader.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'enqueue_block_editor_assets', $this, 'enqueue_block_plugin_assets' );
	}

	/**
	 * Register the block plugin assets.
	 */
	public function register_block_plugin_assets() {
		$asset_file = include plugin_dir_path( __FILE__ ) . 'build/index.asset.php';
		$asset_slug = self::$handle;
		$script_src = plugin_dir_url( __FILE__ ) . 'build/index.js';
		$style_src  = plugin_dir_url( __FILE__ ) . 'build/index.css';

		$registered = wp_register_script(
			$asset_slug,
			$script_src,
			$asset_file['dependencies'],
			$asset_file['version'],
			true
		);

		if ( ! $registered ) {
			return new WP_Error( 'prc-quiz-analytics-inspector-sidebar-panel', __( 'Error registering script.' ) );
		}

		wp_register_style(
			$asset_slug,
			$style_src,
			array(),
			$asset_file['version']
		);

		return $registered;
	}

	/**
	 * Enqueue the block plugin assets.
	 *
	 * @hook enqueue_block_editor_assets
	 */
	public function enqueue_block_plugin_assets() {
		$screen           = get_current_screen();
		$screen_post_type = $screen->post_type ?? null;

		$registered = $this->register_block_plugin_assets();

		// Only enqueue for quiz post type.
		if ( ! $screen_post_type || 'quiz' !== $screen_post_type ) {
			return;
		}

		if ( is_admin() && ! is_wp_error( $registered ) ) {
			wp_enqueue_script( self::$handle );
			wp_enqueue_style( self::$handle );
		}
	}
}
