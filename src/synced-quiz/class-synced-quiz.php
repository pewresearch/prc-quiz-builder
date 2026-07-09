<?php
/**
 * Synced Quiz block.
 *
 * @package PRC\Platform\Quiz
 */

namespace PRC\Platform\Quiz;

/**
 * Synced Quiz block — embeds a quiz CPT by ref (iframe on frontend).
 *
 * @package PRC\Platform\Quiz
 */
class Synced_Quiz {
	/**
	 * Legacy block name kept for existing embeds in post content.
	 */
	const LEGACY_BLOCK_NAME = 'prc-quiz/embeddable';

	/**
	 * Constructor.
	 *
	 * @param object $loader The loader.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'block_init' );
	}

	/**
	 * Render the synced quiz as an iframe embed (unchanged from legacy embeddable).
	 *
	 * @param array    $attributes Block attributes.
	 * @param string   $content    Block content.
	 * @param \WP_Block $block     Block instance.
	 * @return string Block markup.
	 */
	public function render_block_callback( $attributes, $content, $block ) {
		if ( empty( $attributes['ref'] ) ) {
			return '';
		}

		$block_wrapper_attrs = get_block_wrapper_attributes(
			array(
				'ref-id' => $attributes['ref'],
			)
		);

		$permalink  = get_permalink( (int) $attributes['ref'] );
		$iframe_url = trailingslashit( $permalink ) . 'iframe/';
		$iframe_url = add_query_arg(
			array(
				'prc_entity_iframe' => '1',
				'iframeTemplate'    => 'content',
				'quizEmbed'         => true,
			),
			$iframe_url
		);

		$iframe_markup = function_exists( '\PRC\Platform\Embeds\prc_get_post_as_iframe' )
			? \PRC\Platform\Embeds\prc_get_post_as_iframe( (int) $attributes['ref'], $iframe_url )
			: 'Quiz cannot be embedded at this time.';

		return wp_sprintf(
			'<div %1$s>%2$s</div>',
			$block_wrapper_attrs,
			$iframe_markup
		);
	}

	/**
	 * Registers the block and a backward-compatible alias for prc-quiz/embeddable.
	 *
	 * @hook init
	 */
	public function block_init() {
		$block_type = register_block_type_from_metadata(
			PRC_QUIZ_DIR . '/build/synced-quiz',
			array(
				'render_callback' => array( $this, 'render_block_callback' ),
			)
		);

		$legacy_args = array(
			'api_version'     => 3,
			'attributes'      => array(
				'ref' => array(
					'type' => 'number',
				),
			),
			'render_callback' => array( $this, 'render_block_callback' ),
		);

		if ( $block_type instanceof \WP_Block_Type ) {
			if ( ! empty( $block_type->editor_script_handles ) ) {
				$legacy_args['editor_script_handles'] = $block_type->editor_script_handles;
			} elseif ( ! empty( $block_type->editor_script ) ) {
				$legacy_args['editor_script'] = $block_type->editor_script;
			}
		}

		register_block_type( self::LEGACY_BLOCK_NAME, $legacy_args );
	}
}
