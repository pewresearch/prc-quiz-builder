<?php
/**
 * Result table class.
 *
 * @package PRC\Platform\Quiz
 */

namespace PRC\Platform\Quiz;

/**
 * Result table class.
 *
 * @package PRC\Platform\Quiz
 */
class Result_Table {
	/**
	 * Constructor.
	 *
	 * @param object $loader The loader.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'block_init' );
	}

	/**
	 * Resolve icon color to a CSS value (hex or preset custom property).
	 *
	 * @param string $color Color slug or hex.
	 * @return string
	 */
	private function resolve_icon_color( $color ) {
		$color = is_string( $color ) ? trim( $color ) : '';
		if ( '' === $color ) {
			return 'currentColor';
		}
		if ( preg_match( '/^#([0-9A-F]{3}){1,2}$/i', $color ) ) {
			return $color;
		}
		return 'var(--wp--preset--color--' . sanitize_title( $color ) . ', currentColor)';
	}

	/**
	 * Renders the simple results.
	 *
	 * @param string $block_attrs The block attributes.
	 * @param float  $icon_size Icon size in em.
	 * @param string $icon_color_css Resolved CSS color.
	 * @return string The rendered HTML.
	 */
	public function render_simple_results( $block_attrs, $icon_size = 1, $icon_color_css = 'currentColor' ) {
		$icon_style = sprintf( 'color: %s;', esc_attr( $icon_color_css ) );
		ob_start();
		?>
		<div <?php echo $block_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built via get_block_wrapper_attributes ?>>
			<div class="prc-quiz-result-table__scroll">
				<table>
					<thead>
						<tr>
							<th></th>
							<th></th>
							<th class="center aligned">Your Answer</th>
							<th class="center aligned">Correct Answer</th>
						</tr>
					</thead>
					<tbody>
						<template data-wp-each--row="state.resultsTableRows">
							<tr data-wp-key="context.row.uuid" class="prc-quiz-result-table__row">
								<td>
									<span class="prc-quiz-result-table__icon" style="<?php echo esc_attr( $icon_style ); ?>" data-wp-bind--hidden="!context.row.showCorrectIcon">
										<?php echo \PRC\Platform\Icons\render( 'light', 'check', $icon_size ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Icons::render escapes href; wp_kses_post strips <use>. ?>
									</span>
									<span class="prc-quiz-result-table__icon" style="<?php echo esc_attr( $icon_style ); ?>" data-wp-bind--hidden="!context.row.showIncorrectIcon">
										<?php echo \PRC\Platform\Icons\render( 'light', 'xmark', $icon_size ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Icons::render escapes href; wp_kses_post strips <use>. ?>
									</span>
								</td>
								<td>
									<span class="prc-quiz-result-table__question" data-wp-watch="callbacks.renderQuestionHtml"></span>
								</td>
								<td>
									<span data-wp-text="context.row.selectedAnswer"></span>
								</td>
								<td>
									<span data-wp-text="context.row.correctAnswer"></span>
								</td>
							</tr>
						</template>
					</tbody>
				</table>
			</div>
		</div>
		<?php
		return ob_get_clean();
	}

	/**
	 * Renders the demo break results.
	 *
	 * @param string $block_attrs The block attributes.
	 * @param float  $icon_size Icon size in em.
	 * @param string $icon_color_css Resolved CSS color.
	 * @return string The rendered HTML.
	 */
	public function render_demo_break_results( $block_attrs, $icon_size = 1, $icon_color_css = 'currentColor' ) {
		$icon_style = sprintf( 'color: %s;', esc_attr( $icon_color_css ) );
		ob_start();
		?>
		<div <?php echo $block_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built via get_block_wrapper_attributes ?>>
			<div class="prc-quiz-result-table__scroll">
				<table>
					<thead>
						<tr>
							<th></th>
							<th></th>
							<template data-wp-each="state.demoBreakHeaders">
								<th class="center aligned">
									<span data-wp-text="context.item"></span>
								</th>
							</template>
						</tr>
					</thead>
					<tbody>
						<template data-wp-each--row="state.resultsTableRows">
							<tr class="prc-quiz-result-table__row" data-wp-key="context.row.uuid">
								<td>
									<span class="prc-quiz-result-table__icon" style="<?php echo esc_attr( $icon_style ); ?>" data-wp-bind--hidden="!context.row.showCorrectIcon">
										<?php echo \PRC\Platform\Icons\render( 'light', 'check', $icon_size ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Icons::render escapes href; wp_kses_post strips <use>. ?>
									</span>
									<span class="prc-quiz-result-table__icon" style="<?php echo esc_attr( $icon_style ); ?>" data-wp-bind--hidden="!context.row.showIncorrectIcon">
										<?php echo \PRC\Platform\Icons\render( 'light', 'xmark', $icon_size ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Icons::render escapes href; wp_kses_post strips <use>. ?>
									</span>
								</td>
								<td>
									<span class="prc-quiz-result-table__question" data-wp-watch="callbacks.renderQuestionHtml"></span>
									<div>
										<span>You answered:</span>
										<span><strong data-wp-text="context.row.selectedAnswer"></strong></span>
									</div>
									<div>
										<span>The correct answer:</span>
										<span><strong data-wp-text="context.row.correctAnswer"></strong></span>
									</div>
								</td>
								<template data-wp-each="context.row.demoBreakValues">
									<td class="center aligned">
										<span data-wp-text="context.item"></span>
									</td>
								</template>
							</tr>
						</template>
					</tbody>
				</table>
			</div>
		</div>
		<?php
		return ob_get_clean();
	}

	/**
	 * Renders the block callback.
	 *
	 * @param array  $attributes The block attributes.
	 * @param string $content The block content.
	 * @param object $block The block object.
	 * @return string The rendered HTML.
	 */
	public function render_block_callback( $attributes, $content, $block ) {
		$demo_breaks = array_key_exists( 'prc-quiz/demo-break-labels', $block->context ) ? $block->context['prc-quiz/demo-break-labels'] : false;

		$icon_size      = array_key_exists( 'iconSize', $attributes ) ? (float) $attributes['iconSize'] : 1;
		$icon_color     = array_key_exists( 'iconColor', $attributes ) ? $attributes['iconColor'] : 'ui-black';
		$icon_color_css = $this->resolve_icon_color( $icon_color );

		$classnames = array(
			'is-demo-break-table' => false !== $demo_breaks,
		);

		$block_attrs = get_block_wrapper_attributes(
			array(
				'class'               => \PRC\BlockUtils\classNames( $classnames ),
				'data-wp-interactive' => 'prc-quiz/controller',
				'style'               => sprintf( '--prc-quiz-result-table-icon-color: %s;', esc_attr( $icon_color_css ) ),
			)
		);

		/*
		 * @TODO: This needs more work, not working correctly.
		 * if ( false !== $demo_breaks ) {
		 *     return $this->render_demo_break_results( $block_attrs, $icon_size, $icon_color_css );
		 * } else {
		 *     return $this->render_simple_results( $block_attrs, $icon_size, $icon_color_css );
		 * }
		 */

		return $this->render_simple_results( $block_attrs, $icon_size, $icon_color_css );
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
			PRC_QUIZ_DIR . '/build/result-table',
			array(
				'render_callback' => array( $this, 'render_block_callback' ),
			)
		);
	}
}
