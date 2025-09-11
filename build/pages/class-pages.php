<?php
/**
 * Pages class.
 *
 * @package PRC\Platform\Quiz
 */

namespace PRC\Platform\Quiz;

use WP_HTML_Tag_Processor;
/**
 * Pages class.
 *
 * @package PRC\Platform\Quiz
 */
class Pages {
	/**
	 * Constructor.
	 *
	 * @param object $loader The loader.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'block_init' );
		$loader->add_filter( 'render_block_context', $this, 'set_pages_in_context', 10, 2 );
	}

	/**
	 * Adds an array of page uuid's to context.
	 *
	 * @hook render_block_context
	 *
	 * @param array $context The context.
	 * @param array $parsed_block The parsed block.
	 * @return array
	 */
	public function set_pages_in_context( $context, $parsed_block ) {
		if ( 'prc-quiz/pages' === $parsed_block['blockName'] ) {
			$context['prc-quiz/pages'] = array_map(
				function ( $page ) {
					return $page['attrs']['uuid'];
				},
				$parsed_block['innerBlocks']
			);
		}
		return $context;
	}

	/**
	 * Render the block callback.
	 *
	 * @param array    $attributes The block attributes.
	 * @param string   $content The block content.
	 * @param WP_Block $block The block instance.
	 * @return string The block content.
	 */
	public function render_block_callback( $attributes, $content, $block ) {
		// Find the first page block in $block->inner_blocks, and get the uuid attribute.
		$parsed_block          = $block->parsed_block;
		$inner_blocks          = $parsed_block['innerBlocks'];
		$first_page_block      = $inner_blocks[0];
		$first_page_block_uuid = $first_page_block['attrs']['uuid'];

		$tag = new WP_HTML_Tag_Processor( $content );
		$tag->next_tag();
		$tag->set_attribute( 'data-wp-interactive', 'prc-quiz/controller' );
		$tag->set_attribute(
			'data-wp-context',
			wp_json_encode(
				array(
					'firstPageUuid'   => $first_page_block_uuid,
					'currentPageUuid' => $first_page_block_uuid, // On first render, we set the current page uuid to the first page block uuid.
					'pages'           => array_map(
						function ( $page ) {
							return $page['attrs']['uuid'];
						},
						$inner_blocks
					),
				)
			)
		);
		$tag->set_attribute( 'data-wp-init--on-pages-init', 'callbacks.onPagesInit' );
		$tag->set_attribute( 'data-wp-watch--store-current-page-uuid', 'callbacks.storeCurrentPageUuid' );
		$tag->set_attribute( 'data-wp-bind--hidden', '!state.displayPages' );
		return $tag->get_updated_html();
	}

	/**
	 * Registers the block using the metadata loaded from the `block.json` file.
	 * Behind the scenes, it registers also all assets so they can be enqueued
	 * through the block editor in the corresponding context.
	 *
	 * @see https://developer.wordpress.org/reference/functions/register_block_type/
	 */
	public function block_init() {
		register_block_type_from_metadata(
			PRC_QUIZ_DIR . '/build/pages',
			array(
				'render_callback' => array( $this, 'render_block_callback' ),
			)
		);
	}
}
