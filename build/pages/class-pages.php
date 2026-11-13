<?php
/**
 * Pages class.
 *
 * @package PRC\Platform\Quiz
 */

namespace PRC\Platform\Quiz;

use WP_Block;
use WP_HTML_Tag_Processor;

use function PRC\Primitives\Feature_Flags\is_feature_enabled;

/**
 * Pages class.
 *
 * @package PRC\Platform\Quiz
 */
class Pages {
	/**
	 * Feature flag that stops the server from rendering pages the results view hides.
	 *
	 * @var string
	 */
	public const SKIP_HIDDEN_PAGES_FLAG = 'quiz-builder/skip-hidden-pages';

	/**
	 * Constructor.
	 *
	 * @param object $loader The loader.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'block_init' );
		$loader->add_filter( 'render_block_context', $this, 'set_pages_in_context', 10, 2 );
		$loader->add_filter( 'pre_render_block', $this, 'skip_hidden_pages', Plugin::PRE_RENDER_PRIORITY, 3 );
	}

	/**
	 * Whether the Pages block is visible for a controller on this request.
	 *
	 * Mirrors `shouldDisplayPages()` in controller/display-pages.js. A group results
	 * request always hides the pages. A results link hides them unless the quiz is a
	 * native scrollable quiz that shows results under its questions.
	 *
	 * @param array $controller_attributes Controller block attributes, defaults applied.
	 * @return bool
	 */
	public static function is_displayed( array $controller_attributes ): bool {
		$capability     = Group_Capability::resolve_from_attributes( $controller_attributes );
		$groups_enabled = ! empty( $controller_attributes['groupsEnabled'] ) && ! empty( $capability['allowed'] );
		if ( Group_Results::is_group_results_request( $groups_enabled ) ) {
			return false;
		}
		if ( 'scrollable' === ( $controller_attributes['displayType'] ?? '' ) ) {
			return true;
		}
		return ! ( get_query_var( 'quizShowResults', false ) && get_query_var( 'quizArchetype', false ) );
	}

	/**
	 * Skip rendering pages the results view hides.
	 *
	 * A results page hides the pages, but core still renders every question and
	 * answer block in them. The questions and answers publish their Interactivity API state from
	 * their attributes (see Quiz_State), so the results blocks keep what they read
	 * and the markup is the only thing dropped. Retaking the quiz navigates to the
	 * quiz URL, which renders the pages.
	 *
	 * @hook pre_render_block
	 *
	 * @param string|null   $pre_render   Content an earlier filter already supplied.
	 * @param array         $parsed_block The parsed block.
	 * @param WP_Block|null $parent_block The block that contains this one.
	 * @return string|null
	 */
	public function skip_hidden_pages( $pre_render, $parsed_block, $parent_block = null ) {
		if ( null !== $pre_render || 'prc-quiz/pages' !== ( $parsed_block['blockName'] ?? '' ) ) {
			return $pre_render;
		}
		if ( ! $parent_block instanceof WP_Block || 'prc-quiz/controller' !== $parent_block->name || ! is_singular( Plugin::$post_type ) ) {
			return $pre_render;
		}
		if ( self::is_displayed( $parent_block->attributes ) ) {
			return $pre_render;
		}
		if ( ! function_exists( '\PRC\Primitives\Feature_Flags\is_feature_enabled' ) || ! is_feature_enabled( self::SKIP_HIDDEN_PAGES_FLAG ) ) {
			return $pre_render;
		}
		return Quiz_State::seed_from_blocks( get_the_ID(), $parsed_block['innerBlocks'] ?? array() ) ? '' : $pre_render;
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
			$page_blocks               = array_values(
				array_filter(
					$parsed_block['innerBlocks'],
					fn( $inner ) => 'prc-quiz/page' === $inner['blockName']
				)
			);
			$context['prc-quiz/pages'] = array_map(
				fn( $page ) => $page['attrs']['uuid'],
				$page_blocks
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
		$inner_blocks          = array_values(
			array_filter(
				$parsed_block['innerBlocks'],
				fn( $inner ) => 'prc-quiz/page' === $inner['blockName']
			)
		);
		$first_page_block      = $inner_blocks[0];
		$first_page_block_uuid = $first_page_block['attrs']['uuid'];

		$page_backgrounds = array();
		foreach ( $inner_blocks as $page_block ) {
			$page_attributes = $page_block['attrs'] ?? array();
			$image           = Page::get_background_image( $page_attributes );
			$page_backgrounds[ $page_attributes['uuid'] ?? '' ] = array(
				'key' => Page::get_background_key( $page_attributes ),
				'url' => $image['url'] ?? '',
			);
		}

		$tag = new WP_HTML_Tag_Processor( $content );
		$tag->next_tag();
		$tag->set_attribute( 'data-wp-interactive', 'prc-quiz/controller' );
		$tag->set_attribute(
			'data-wp-context',
			wp_json_encode(
				array(
					'firstPageUuid'       => $first_page_block_uuid,
					'currentPageUuid'     => $first_page_block_uuid, // On first render, we set the current page uuid to the first page block uuid.
					'pages'               => array_map(
						fn( $page ) => $page['attrs']['uuid'],
						$inner_blocks
					),
					'pageBackgrounds'     => (object) $page_backgrounds,
					'pageTransitionState' => null, // { id, fromUuid, toUuid } while a page transition animates.
				)
			)
		);
		$tag->set_attribute( 'data-wp-init---on-pages-init', 'callbacks.onPagesInit' );
		$tag->set_attribute( 'data-wp-class--is-page-transitioning', 'state.isPageTransitioning' );
		$tag->set_attribute( 'data-wp-on-async--touchstart', 'actions.onPagesTouchStart' );
		$tag->set_attribute( 'data-wp-on-async--touchend', 'actions.onPagesTouchEnd' );
		$tag->set_attribute( 'data-wp-watch---store-current-page-uuid', 'callbacks.storeCurrentPageUuid' );
		$tag->set_attribute( 'data-wp-bind--hidden', '!state.displayPages' );
		$groups_enabled = $block->context['prc-quiz/groupsEnabled'] ?? false;
		if ( Group_Results::is_group_results_request( $groups_enabled ) ) {
			$tag->set_attribute( 'hidden', 'true' );
		}
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
