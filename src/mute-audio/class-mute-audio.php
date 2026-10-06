<?php
/**
 * Mute audio block.
 *
 * @package PRC\Platform\Quiz
 */

declare(strict_types=1);

namespace PRC\Platform\Quiz;

/**
 * Mute audio block.
 *
 * @package PRC\Platform\Quiz
 */
class Mute_Audio {
	/**
	 * Constructor.
	 *
	 * @param object $loader The loader.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'block_init' );
	}

	/**
	 * Speaker icon. The muted icon adds a diagonal slash.
	 *
	 * @param bool $muted True for the slashed speaker.
	 * @return string SVG markup.
	 */
	private function get_speaker_icon( bool $muted ): string {
		$slash = $muted
			? '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M5 6l14 12"/>'
			: '';
		return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4 9.5v5h3.2L12 19V5L7.2 9.5H4z"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M15.2 9.2a3.6 3.6 0 0 1 0 5.6"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M17.6 6.8a7 7 0 0 1 0 10.4"/>' . $slash . '</svg>';
	}

	/**
	 * Render the mute button.
	 *
	 * @param array $attributes Block attributes.
	 * @return string
	 */
	public function render_block_callback( $attributes ) {
		$start_muted = is_array( $attributes ) && ! empty( $attributes['startMuted'] );
		$mute        = __( 'Mute', 'prc-quiz' );
		$unmute      = __( 'Unmute', 'prc-quiz' );
		$label       = $start_muted ? $unmute : $mute;

		if ( $start_muted && function_exists( 'wp_interactivity_state' ) ) {
			wp_interactivity_state(
				'prc-quiz/controller',
				array(
					'audioMuted' => true,
				)
			);
		}

		$wrapper = get_block_wrapper_attributes(
			array(
				'type'                       => 'button',
				'data-wp-interactive'        => 'prc-quiz/controller',
				'data-wp-init'               => 'callbacks.onMuteAudioInit',
				'data-wp-on--click'          => 'actions.toggleAudioMute',
				'data-wp-bind--aria-pressed' => 'state.isAudioMuted',
				'data-wp-bind--aria-label'   => 'state.muteAudioLabel',
				'aria-pressed'               => $start_muted ? 'true' : 'false',
				'aria-label'                 => $label,
				'data-mute-label'            => $mute,
				'data-unmute-label'          => $unmute,
				'data-start-muted'           => $start_muted ? 'true' : 'false',
			)
		);

		$icons  = '<span class="wp-block-prc-quiz-mute-audio__icon"' . ( $start_muted ? ' hidden' : '' ) . ' data-wp-bind--hidden="state.isAudioMuted">' . $this->get_speaker_icon( false ) . '</span>';
		$icons .= '<span class="wp-block-prc-quiz-mute-audio__icon"' . ( $start_muted ? '' : ' hidden' ) . ' data-wp-bind--hidden="!state.isAudioMuted">' . $this->get_speaker_icon( true ) . '</span>';
		$text   = '<span class="wp-block-prc-quiz-mute-audio__label" data-wp-text="state.muteAudioLabel">' . esc_html( $label ) . '</span>';

		return sprintf( '<button %1$s>%2$s%3$s</button>', $wrapper, $icons, $text );
	}

	/**
	 * Register the block from build metadata.
	 *
	 * @return void
	 */
	public function block_init() {
		register_block_type_from_metadata(
			PRC_QUIZ_DIR . '/build/mute-audio',
			array(
				'render_callback' => array( $this, 'render_block_callback' ),
			)
		);
	}
}
