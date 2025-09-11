<?php
/**
 * Legacy groups index file.
 *
 * @package PRC\Platform\Quiz
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// If prc_platform_testing_mode is true, then we need to exit.
if ( defined( 'PRC_PLATFORM_TESTING_MODE' ) && PRC_PLATFORM_TESTING_MODE ) {
	exit;
}

require_once plugin_dir_path( __FILE__ ) . '/class-query.php';
require_once plugin_dir_path( __FILE__ ) . '/class-schema.php';
require_once plugin_dir_path( __FILE__ ) . '/class-shape.php';
require_once plugin_dir_path( __FILE__ ) . '/class-table.php';
