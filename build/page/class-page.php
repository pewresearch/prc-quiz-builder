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
	 * Strip redirectUrl from embedded Mailchimp forms so quiz submission is not interrupted.
	 *
	 * @param string $block_content The block content.
	 * @return string
	 */
	public function strip_embedded_form_redirect_urls( $block_content ) {
		$tag = new WP_HTML_Tag_Processor( $block_content );
		while ( $tag->next_tag( array( 'tag_name' => 'FORM' ) ) ) {
			if ( 'prc-block/form' !== $tag->get_attribute( 'data-wp-interactive' ) ) {
				continue;
			}

			$context_json = $tag->get_attribute( 'data-wp-context' );
			if ( empty( $context_json ) ) {
				continue;
			}

			$context = json_decode( $context_json, true );
			if ( ! is_array( $context ) ) {
				continue;
			}

			$context['redirectUrl'] = false;
			$tag->set_attribute( 'data-wp-context', wp_json_encode( $context ) );
		}

		return $tag->get_updated_html();
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
	 * The page's background image attribute, normalized.
	 *
	 * @param array $attributes Page block attributes.
	 * @return array{id: int, url: string}|null Null when the page has no background image.
	 */
	public static function get_background_image( $attributes ) {
		$image = $attributes['style']['background']['backgroundImage'] ?? null;
		if ( is_string( $image ) ) {
			$image = array( 'url' => $image );
		}
		if ( ! is_array( $image ) || empty( $image['url'] ) || ! is_string( $image['url'] ) ) {
			return null;
		}
		return array(
			'id'  => isset( $image['id'] ) ? (int) $image['id'] : 0,
			'url' => $image['url'],
		);
	}

	/**
	 * Identity used to decide whether two pages share a background image.
	 *
	 * Attachment id when known, otherwise the URL. Empty when there is no image.
	 *
	 * @param array $attributes Page block attributes.
	 * @return string
	 */
	public static function get_background_key( $attributes ) {
		$image = self::get_background_image( $attributes );
		if ( null === $image ) {
			return '';
		}
		return $image['id'] ? 'id:' . $image['id'] : 'url:' . $image['url'];
	}

	/**
	 * Markup for the page background layer.
	 *
	 * Background serialization is skipped in block.json so the image does not
	 * paint on the wrapper; it lives on its own layer so the page transition can
	 * move it independently of the page content.
	 *
	 * @param array $attributes Page block attributes.
	 * @return string Empty when the page has no background image.
	 */
	public static function get_background_layer_markup( $attributes ) {
		$image = self::get_background_image( $attributes );
		if ( null === $image ) {
			return '';
		}
		$background = $attributes['style']['background'];
		$styles     = array(
			'backgroundImage'      => array( 'url' => $image['url'] ),
			'backgroundSize'       => $background['backgroundSize'] ?? 'cover',
			'backgroundPosition'   => $background['backgroundPosition'] ?? null,
			'backgroundRepeat'     => $background['backgroundRepeat'] ?? null,
			'backgroundAttachment' => $background['backgroundAttachment'] ?? null,
		);
		if ( 'contain' === $styles['backgroundSize'] && ! $styles['backgroundPosition'] ) {
			$styles['backgroundPosition'] = '50% 50%';
		}
		$css = wp_style_engine_get_styles( array( 'background' => $styles ) );
		if ( empty( $css['css'] ) ) {
			return '';
		}
		return '<div class="wp-block-prc-quiz-page__background" aria-hidden="true" style="' . esc_attr( $css['css'] ) . '"></div>';
	}

	/**
	 * Insert the background layer as the first child of the page wrapper.
	 *
	 * @param string $block_content Rendered page markup.
	 * @param array  $attributes    Page block attributes.
	 * @return string
	 */
	public static function inject_background_layer( $block_content, $attributes ) {
		$layer = self::get_background_layer_markup( $attributes );
		if ( '' === $layer ) {
			return $block_content;
		}
		$tag = new WP_HTML_Tag_Processor( $block_content );
		if ( ! $tag->next_tag() ) {
			return $block_content;
		}
		$tag->add_class( 'has-background-image' );
		$block_content = $tag->get_updated_html();
		// Serialized attribute values escape ">", so the first ">" closes the wrapper tag.
		$wrapper_end = strpos( $block_content, '>' );
		if ( false === $wrapper_end ) {
			return $block_content;
		}
		return substr_replace( $block_content, $layer, $wrapper_end + 1, 0 );
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
		$tag->set_attribute( 'data-wp-bind--inert', 'state.isPageLeaving' );
		$tag->set_attribute( 'tabindex', '-1' );
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
		$content = self::inject_background_layer( $content, $attributes );
		$content = $this->strip_embedded_form_redirect_urls( $content );
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
	}
}
