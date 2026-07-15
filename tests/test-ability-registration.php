<?php
/**
 * Smoke tests for quiz ability registration metadata.
 *
 * Run with:
 *   php plugins/prc-quiz-builder/tests/test-ability-registration.php
 */

declare(strict_types=1);

namespace {

	$GLOBALS['__failed']                = 0;
	$GLOBALS['__registered']            = array();
	$GLOBALS['__registered_categories'] = array();

	function assert_true( bool $condition, string $message ): void {
		if ( $condition ) {
			echo "PASS: {$message}\n";
			return;
		}
		echo "FAIL: {$message}\n";
		++$GLOBALS['__failed'];
	}

	function wp_register_ability( string $name, array $args ) {
		$GLOBALS['__registered'][ $name ] = $args;
		return true;
	}

	function wp_register_ability_category( string $name, array $args ) {
		$GLOBALS['__registered_categories'][ $name ] = $args;
		return true;
	}

	function wp_has_ability_category( string $name ): bool {
		return isset( $GLOBALS['__registered_categories'][ $name ] );
	}

	function __( string $text, string $domain = 'default' ): string { // phpcs:ignore Universal.NamingConventions.NoReservedKeywordParameterNames.domainFound
		return $text;
	}

	class Fake_Loader {
		/** @var array<int, array<string, mixed>> */
		public array $actions = array();

		public function add_action( string $hook, object $component, string $callback, int $priority = 10, int $accepted_args = 1 ): void {
			$this->actions[] = compact( 'hook', 'component', 'callback', 'priority', 'accepted_args' );
		}
	}

	require_once dirname( __DIR__ ) . '/includes/class-ability-categories.php';
	require_once dirname( __DIR__ ) . '/includes/class-ability.php';

	$loader  = new Fake_Loader();
	$cats    = new \PRC\Platform\Quiz\Ability_Categories( $loader );
	$ability = new \PRC\Platform\Quiz\Ability( $loader );

	$cats->register_categories();
	$ability->register_ability();

	assert_true(
		isset( $GLOBALS['__registered_categories']['quiz'] ),
		'registered quiz ability category'
	);
	assert_true(
		'Quiz' === ( $GLOBALS['__registered_categories']['quiz']['label'] ?? '' ),
		'quiz category label'
	);

	$name = 'prc-quiz-builder/get-analytics';
	assert_true( isset( $GLOBALS['__registered'][ $name ] ), "registered {$name}" );
	assert_true(
		'quiz' === ( $GLOBALS['__registered'][ $name ]['category'] ?? '' ),
		"{$name} uses quiz category"
	);
	$meta = $GLOBALS['__registered'][ $name ]['meta'] ?? array();
	assert_true( ! empty( $meta['show_in_rest'] ), "{$name} show_in_rest" );
	assert_true( ! empty( $meta['mcp']['public'] ), "{$name} mcp public" );
	assert_true(
		true === ( $meta['annotations']['readonly'] ?? false ),
		"{$name} is readonly"
	);

	$category_hooks = array_filter(
		$loader->actions,
		static fn( array $a ): bool => 'wp_abilities_api_categories_init' === $a['hook']
	);
	$ability_hooks  = array_filter(
		$loader->actions,
		static fn( array $a ): bool => 'wp_abilities_api_init' === $a['hook']
	);
	assert_true( 1 === count( $category_hooks ), 'hooks categories_init' );
	assert_true( 1 === count( $ability_hooks ), 'hooks abilities_init' );

	if ( $GLOBALS['__failed'] > 0 ) {
		echo "\n{$GLOBALS['__failed']} test(s) failed.\n";
		exit( 1 );
	}

	echo "\nAll tests passed.\n";
	exit( 0 );
}
