<?php
/**
 * Plugin Name:       PRC Quiz Builder
 * Plugin URI:        https://pewresearch.org
 * Description:       An interactive, block-based quiz builder for the PRC platform..
 * Author:            Seth Rubenstein
 * Author URI:        https://www.pewresearch.org
 * Version:           3.6.0
 * Requires at least: 6.7
 * Requires PHP:      8.1
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       prc-quiz-builder
 *
 * @package           PRC\Platform\Quiz
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'PRC_QUIZ_FILE', __FILE__ );
define( 'PRC_QUIZ_DIR', __DIR__ );
define( 'PRC_QUIZ_VERSION', '3.5.0' );
define( 'PRC_QUIZ_MANIFEST_FILE', __DIR__ . '/build/block-manifest.php' );

/**
 * The core plugin class that is used to define the hooks that initialize the various platform components.
 */
require plugin_dir_path( __FILE__ ) . 'includes/class-plugin.php';

/**
 * Begins execution of the plugin.
 *
 * Since everything within the plugin is registered via hooks,
 * then kicking off the plugin from this point in the file does
 * not affect the page life cycle.
 *
 * @since    3.5.0
 */
function run_prc_quiz_builder() {
	$plugin = new \PRC\Platform\Quiz\Plugin();
	$plugin->run();
}
run_prc_quiz_builder();
