<?php
/**
 * Page class.
 *
 * @package PRC\Platform\Quiz
 */

namespace PRC\Platform\Quiz;

use WP_HTML_Tag_Processor;

/**
 * Page class.
 *
 * @package PRC\Platform\Quiz
 */

class Page {
	/**
	 * Constructor.
	 *
	 * @param object $loader The loader.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'block_init' );
	}

	/**
	 * Register the page binding.
	 *
	 * @return void
	 */
	public function register_page_binding() {
		register_block_bindings_source(
			'prc-quiz/page-title',
			array(
				'label'              => __( 'Quiz Page', 'prc-quiz' ),
				'get_value_callback' => function ( array $source_args, $block_instance ) {
					return $block_instance->context['prc-quiz/page/title'];
				},
				'uses_context'       => array( 'prc-quiz/page/title', 'prc-quiz/page/uuid' ),
			)
		);
	}

	/**
	 * Find the dialog and remove it if it's a group quiz.
	 *
	 * @param string $block_content The block content.
	 * @return string
	 */
	public function find_dialog_and_remove_if_group_quiz( $block_content ) {
		if ( ! get_query_var( 'quizGroup' ) ) {
			return $block_content;
		}
		$tag = new WP_HTML_Tag_Processor( $block_content );
		while ( $tag->next_tag() ) {
			if ( $tag->has_class( 'wp-block-prc-block-dialog' ) ) {
				$tag->set_bookmark( 'dialog_start' );
				$tag->set_attribute( 'hidden', 'true' );
			}
		}
		return $tag->get_updated_html();
	}

	/**
	 * Render block callback.
	 *
	 * @param array  $attributes The block attributes.
	 * @param string $content The block content.
	 * @param object $block The block instance.
	 * @return string
	 */
	public function render_block_callback( $attributes, $content, $block ) {
		$page_uuid     = $attributes['uuid'];
		$pages         = $block->context['prc-quiz/pages'];
		$is_last_page  = end( $pages ) === $page_uuid;
		$is_first_page = reset( $pages ) === $page_uuid;
		
		$tag = new WP_HTML_Tag_Processor( $content );
		$tag->next_tag();
		$tag->set_attribute( 'data-wp-interactive', 'prc-quiz/controller' );
		$tag->set_attribute(
			'data-wp-context',
			wp_json_encode(
				array(
					'uuid'        => $page_uuid,
					'isLastPage'  => $is_last_page,
					'isFirstPage' => $is_first_page,
				)
			) 
		);
		$tag->set_attribute( 'data-wp-class--is-visible', 'state.isPageVisible' );
		$tag->set_attribute( 'data-wp-watch--is-visible', 'callbacks.onPageVisibleChange' );
		$tag->set_attribute( 'data-wp-bind--data-page-uuid', 'context.uuid' );
		
		// If the quiz is scrollable, add a scroll event listener to the last page.
		// if ( isset( $block->context['prc-quiz/display-type'] ) && 'scrollable' === $block->context['prc-quiz/display-type'] && $is_last_page ) {
		// $tag->set_attribute( 'data-wp-on-async-document--scroll', 'callbacks.onLastPageScroll' );
		// }
		// Make any <a> tags inside the quiz contents open in a new tab.
		while ( $tag->next_tag() ) {
			if ( 'A' === $tag->get_tag() ) {
				$tag->set_attribute( 'target', '_blank' );
				$tag->set_attribute( 'rel', 'noopener noreferrer' );
			}
		}
		$content = $tag->get_updated_html();
		$content = $this->find_dialog_and_remove_if_group_quiz( $content );
		return $content;
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
			PRC_QUIZ_DIR . '/build/page',
			array(
				'render_callback' => array( $this, 'render_block_callback' ),
			)
		);
		$this->register_page_binding();
	}
}
