<?php
/**
 * Block editor supports for Quiz Builder.
 *
 * @package PRC\Platform\Quiz
 */

namespace PRC\Platform\Quiz;

/**
 * Scopes quiz blocks and categories to the quiz post type editor.
 */
class Block_Supports {

	/**
	 * Constructor.
	 *
	 * @param Loader|null $loader Loader instance.
	 */
	public function __construct( $loader = null ) {
		if ( null !== $loader ) {
			$this->init( $loader );
		}
	}

	/**
	 * Register hooks.
	 *
	 * @param Loader $loader Loader instance.
	 */
	public function init( $loader ) {
		$loader->add_filter( 'allowed_block_types_all', $this, 'restrict_quiz_blocks', 10, 2 );
		$loader->add_filter( 'block_categories_all', $this, 'register_block_categories', 10, 2 );
	}

	/**
	 * Whether a block belongs to the quiz builder inserter surface.
	 *
	 * @param string $block_name Block name.
	 * @return bool
	 */
	public static function is_quiz_block( $block_name ) {
		if ( ! is_string( $block_name ) || ! str_starts_with( $block_name, 'prc-quiz/' ) ) {
			return false;
		}

		$synced_entity_blocks = array(
			'prc-quiz/embeddable',
			'prc-quiz/synced-quiz',
		);

		return ! in_array( $block_name, $synced_entity_blocks, true );
	}

	/**
	 * Hide quiz blocks from the inserter outside the quiz post type editor.
	 *
	 * @hook allowed_block_types_all
	 *
	 * @param bool|string[]            $allowed_block_types Allowed block types.
	 * @param \WP_Block_Editor_Context $editor_context      Block editor context.
	 * @return bool|string[]
	 */
	public function restrict_quiz_blocks( $allowed_block_types, $editor_context ) {
		if (
			isset( $editor_context->post )
			&& Plugin::$post_type === $editor_context->post->post_type
		) {
			return $allowed_block_types;
		}

		if ( true === $allowed_block_types ) {
			$registry              = \WP_Block_Type_Registry::get_instance();
			$allowed_block_types = array_keys( $registry->get_all_registered() );
		}

		if ( ! is_array( $allowed_block_types ) ) {
			return $allowed_block_types;
		}

		return array_values(
			array_filter(
				$allowed_block_types,
				function ( $block_name ) {
					return ! self::is_quiz_block( $block_name );
				}
			)
		);
	}

	/**
	 * Register the Quiz Builder block category for the quiz post type editor.
	 *
	 * @hook block_categories_all
	 *
	 * @param array                         $block_categories       Block categories.
	 * @param \WP_Block_Editor_Context|null $block_editor_context Block editor context.
	 * @return array
	 */
	public function register_block_categories( $block_categories, $block_editor_context ) {
		$post_type = get_post_type( $block_editor_context->post ?? null );
		if ( Plugin::$post_type !== $post_type ) {
			return $block_categories;
		}

		return array_merge(
			$block_categories,
			array(
				array(
					'slug'  => 'prc-quiz',
					'title' => __( 'Quiz Builder', 'prc-quiz' ),
				),
			)
		);
	}
}
