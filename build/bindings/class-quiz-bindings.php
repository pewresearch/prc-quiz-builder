<?php
/**
 * Consolidated quiz builder block bindings registration.
 *
 * @package PRC\Platform\Quiz
 */

declare(strict_types=1);

namespace PRC\Platform\Quiz;

use WP_HTML_Tag_Processor;

/**
 * Registers the consolidated quiz builder binding source and legacy aliases.
 */
class Quiz_Bindings {

	/**
	 * Editor bindings script handle.
	 *
	 * @var string|false
	 */
	private $editor_bindings_handle = false;

	/**
	 * Constructor.
	 *
	 * @param object $loader Plugin loader.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'register_block_bindings' );
		$loader->add_action( 'init', $this, 'register_editor_bindings_assets' );
		$loader->add_action( 'enqueue_block_editor_assets', $this, 'enqueue_editor_bindings' );
		$loader->add_filter( 'render_block_core/paragraph', $this, 'stamp_adults_receiving_score_host', 110, 2 );
		$loader->add_filter( 'render_block_core/heading', $this, 'stamp_adults_receiving_score_host', 110, 2 );
	}

	/**
	 * Block manifest for the editor-bindings script entry.
	 *
	 * @return array<string, mixed>
	 */
	private function get_bindings_manifest(): array {
		$manifest_file = PRC_QUIZ_DIR . '/build/blocks-manifest.php';
		if ( ! file_exists( $manifest_file ) ) {
			return array();
		}

		$manifest = include $manifest_file;
		if ( ! isset( $manifest['bindings'] ) || ! is_array( $manifest['bindings'] ) ) {
			return array();
		}

		$block_manifest = $manifest['bindings'];
		$block_json     = PRC_QUIZ_DIR . '/build/bindings/block.json';
		if ( ! empty( $block_manifest ) && file_exists( $block_json ) ) {
			$block_manifest['file'] = wp_normalize_path( realpath( $block_json ) );
		}

		return $block_manifest;
	}

	/**
	 * Register the editor-bindings script handle (not registered as a block type).
	 *
	 * @hook init
	 * @return void
	 */
	public function register_editor_bindings_assets(): void {
		$manifest = $this->get_bindings_manifest();
		if ( empty( $manifest ) ) {
			return;
		}

		$this->editor_bindings_handle = register_block_script_handle( $manifest, 'editorScript' );
	}

	/**
	 * Enqueue quiz binding sources and core block variations on the quiz post type editor.
	 *
	 * @hook enqueue_block_editor_assets
	 * @return void
	 */
	public function enqueue_editor_bindings(): void {
		if ( ! is_admin() ) {
			return;
		}

		$screen = get_current_screen();
		if ( ! $screen || Plugin::$post_type !== $screen->post_type ) {
			return;
		}

		if ( ! $this->editor_bindings_handle ) {
			return;
		}

		wp_enqueue_script( $this->editor_bindings_handle );
	}

	/**
	 * All quiz binding context keys used by consolidated fields.
	 *
	 * @return string[]
	 */
	private static function get_uses_context(): array {
		$keys = array( 'prc-quiz/id' );
		foreach ( Quiz_Binding_Resolver::get_field_context_keys() as $context_keys ) {
			$keys = array_merge( $keys, $context_keys );
		}

		return array_values( array_unique( $keys ) );
	}

	/**
	 * Register consolidated and legacy quiz binding sources.
	 *
	 * @hook init
	 * @return void
	 */
	public function register_block_bindings(): void {
		register_block_bindings_source(
			Quiz_Binding_Resolver::SOURCE_NAME,
			array(
				'label'              => __( 'Quiz Builder', 'prc-quiz' ),
				'get_value_callback' => static fn( array $source_args, $block_instance, string $attribute_name ) => Quiz_Binding_Resolver::resolve(
					$source_args,
					$block_instance,
					$attribute_name
				),
				'uses_context'       => self::get_uses_context(),
			)
		);

		foreach ( Quiz_Binding_Resolver::get_legacy_source_names() as $source_name ) {
			$field        = Quiz_Binding_Resolver::legacy_field_for_source( $source_name );
			$context_keys = Quiz_Binding_Resolver::get_field_context_keys()[ $field ] ?? array();

			register_block_bindings_source(
				$source_name,
				array(
					'label'              => Quiz_Binding_Resolver::get_legacy_label( $source_name ),
					'get_value_callback' => static fn( array $source_args, $block_instance, string $attribute_name ) => Quiz_Binding_Resolver::resolve(
						$source_args,
						$block_instance,
						$attribute_name,
						$source_name
					),
					'uses_context'       => $context_keys,
				)
			);
		}
	}

	/**
	 * Stamp Interactivity directives onto Adults Receiving This Score hosts.
	 *
	 * The binding resolves a fallback sentence in PHP. Score is client-side,
	 * so `data-wp-text` replaces that copy after submit.
	 *
	 * @hook render_block_core/paragraph
	 * @hook render_block_core/heading
	 *
	 * @param string $block_content The block content.
	 * @param array  $block         The block data.
	 * @return string
	 */
	public function stamp_adults_receiving_score_host( $block_content, $block ) {
		if ( ! $this->is_adults_receiving_score_binding( $block ) ) {
			return $block_content;
		}
		if ( ! is_string( $block_content ) || '' === $block_content ) {
			return $block_content;
		}

		$tag = new WP_HTML_Tag_Processor( $block_content );
		if ( ! $tag->next_tag() ) {
			return $block_content;
		}

		$tag->set_attribute( 'data-wp-interactive', 'prc-quiz/controller' );
		$tag->set_attribute( 'data-wp-text', 'state.adultsReceivingThisScore' );

		return $tag->get_updated_html();
	}

	/**
	 * Whether a core paragraph or heading binds Adults Receiving This Score.
	 *
	 * @param array $block Parsed block.
	 * @return bool
	 */
	private function is_adults_receiving_score_binding( $block ) {
		$binding = $block['attrs']['metadata']['bindings']['content'] ?? null;
		if ( ! is_array( $binding ) ) {
			return false;
		}

		$source = $binding['source'] ?? '';
		$field  = $binding['args']['field'] ?? '';

		return Quiz_Binding_Resolver::SOURCE_NAME === $source && 'adults-receiving-this-score' === $field;
	}
}
