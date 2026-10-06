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
	 * Class name WordPress adds when the Complex style is selected.
	 *
	 * @var string
	 */
	public const COMPLEX_STYLE_CLASS = 'is-style-complex';

	/**
	 * Class name the community-group Complex variation adds.
	 *
	 * @var string
	 */
	public const COMMUNITY_GROUP_STYLE_CLASS = 'is-prc-quiz-community-group';

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
	 * Whether the block uses the Complex style.
	 *
	 * @param array $attributes Block attributes.
	 * @return bool
	 */
	private function is_complex_style( array $attributes ): bool {
		$class_name = $attributes['className'] ?? '';
		return is_string( $class_name ) && str_contains( $class_name, self::COMPLEX_STYLE_CLASS );
	}

	/**
	 * Whether the block is the community-group Complex variation.
	 *
	 * @param array $attributes Block attributes.
	 * @return bool
	 */
	private function is_community_group_style( array $attributes ): bool {
		$class_name = $attributes['className'] ?? '';
		return is_string( $class_name ) && str_contains( $class_name, self::COMMUNITY_GROUP_STYLE_CLASS );
	}

	/**
	 * Render check / xmark icons for a results row.
	 *
	 * Simple tables apply the author-selected icon color inline.
	 * Complex tables omit inline color so CSS can use green check / gray x.
	 *
	 * @param float  $icon_size          Icon size in em.
	 * @param string $icon_color_css     Resolved CSS color.
	 * @param bool   $apply_inline_color Whether to set inline color.
	 * @return void
	 */
	private function render_row_icons( $icon_size, $icon_color_css, $apply_inline_color = true ) {
		$icon_style_attr = '';
		if ( $apply_inline_color ) {
			$icon_style_attr = sprintf(
				' style="%s"',
				esc_attr( 'color: ' . $icon_color_css . ';' )
			);
		}
		?>
		<span class="prc-quiz-result-table__icon is-correct"<?php echo $icon_style_attr; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above ?> data-wp-bind--hidden="!context.row.showCorrectIcon">
			<?php echo \PRC\Platform\Icons\render( 'prc', 'check', $icon_size ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Icons::render escapes href; wp_kses_post strips <use>. ?>
		</span>
		<span class="prc-quiz-result-table__icon is-incorrect"<?php echo $icon_style_attr; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above ?> data-wp-bind--hidden="!context.row.showIncorrectIcon">
			<?php echo \PRC\Platform\Icons\render( 'prc', 'xmark', $icon_size ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Icons::render escapes href; wp_kses_post strips <use>. ?>
		</span>
		<span class="prc-quiz-result-table__icon is-not-sure" style="<?php echo esc_attr( 'font-size: ' . \PRC\Platform\Icons\format_icon_size_css( $icon_size ) . ';' ); ?>" role="img" aria-label="<?php echo esc_attr__( 'Not sure', 'prc-quiz' ); ?>" data-wp-bind--hidden="!context.row.showNotSureIcon">❓</span>
		<?php
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
		ob_start();
		?>
		<div <?php echo $block_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built via get_block_wrapper_attributes ?>>
			<div class="prc-quiz-result-table__scroll">
				<table>
					<thead>
						<tr>
							<th></th>
							<th></th>
							<th class="center aligned"><?php echo esc_html__( 'Your Answer', 'prc-quiz' ); ?></th>
							<th class="center aligned"><?php echo esc_html__( 'Correct Answer', 'prc-quiz' ); ?></th>
						</tr>
					</thead>
					<tbody>
						<template data-wp-each--row="state.resultsTableRows">
							<tr data-wp-key="context.row.uuid" class="prc-quiz-result-table__row">
								<td>
									<?php $this->render_row_icons( $icon_size, $icon_color_css, true ); ?>
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
	 * Renders the complex results table.
	 *
	 * @param string $block_attrs         The block attributes.
	 * @param float  $icon_size           Icon size in em.
	 * @param string $icon_color_css      Resolved CSS color.
	 * @param bool   $is_community_group  Whether this is the community-group variation.
	 * @return string The rendered HTML.
	 */
	public function render_complex_results( $block_attrs, $icon_size = 1, $icon_color_css = 'currentColor', $is_community_group = false ) {
		$choice_heading = $is_community_group
			? __( "Your group's answers", 'prc-quiz' )
			: __( 'Your answer', 'prc-quiz' );
		ob_start();
		?>
		<div <?php echo $block_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built via get_block_wrapper_attributes ?>>
			<div class="prc-quiz-result-table__scroll">
				<table class="prc-quiz-result-table__complex">
					<thead>
						<tr>
							<th><?php echo esc_html__( 'Question', 'prc-quiz' ); ?></th>
							<th><?php echo esc_html__( 'Answers', 'prc-quiz' ); ?></th>
							<th><?php echo esc_html( $choice_heading ); ?></th>
							<th><?php echo esc_html__( '% who selected each option', 'prc-quiz' ); ?></th>
							<?php if ( $is_community_group ) : ?>
								<th><?php echo esc_html__( '% of your group', 'prc-quiz' ); ?></th>
							<?php endif; ?>
							<template data-wp-each--header="state.demoBreakHeaders">
								<th>
									<span data-wp-text="context.header"></span>
								</th>
							</template>
						</tr>
					</thead>
					<tbody>
						<template data-wp-each--row="state.complexTableRows">
							<tr
								data-wp-key="context.row.uuid"
								class="prc-quiz-result-table__row"
								data-wp-class--is-first-answer="context.row.isFirst"
								data-wp-class--is-last-answer="context.row.isLast"
								data-wp-class--is-correct-selection="context.row.isCorrectSelection"
								data-wp-class--is-incorrect-selection="context.row.isIncorrectSelection"
								data-wp-class--is-group-plurality="context.row.isGroupPlurality"
							>
								<td class="prc-quiz-result-table__question-cell">
									<span data-wp-bind--hidden="!context.row.isFirst">
										<span class="prc-quiz-result-table__question" data-wp-watch="callbacks.renderQuestionHtml"></span>
									</span>
								</td>
								<td class="prc-quiz-result-table__answer-cell">
									<span data-wp-text="context.row.answerText"></span>
								</td>
								<td class="prc-quiz-result-table__choice-cell">
									<?php if ( $is_community_group ) : ?>
										<span class="prc-quiz-result-table__icon is-correct" data-wp-bind--hidden="!context.row.showGroupAnswerIcon">
											<?php echo \PRC\Platform\Icons\render( 'prc', 'check', $icon_size ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Icons::render escapes href; wp_kses_post strips <use>. ?>
										</span>
									<?php else : ?>
										<?php $this->render_row_icons( $icon_size, $icon_color_css, false ); ?>
									<?php endif; ?>
								</td>
								<td class="prc-quiz-result-table__percent-cell">
									<?php if ( $is_community_group ) : ?>
										<span class="prc-quiz-result-table__demo-label"><?php echo esc_html__( '% who selected each option', 'prc-quiz' ); ?></span>
									<?php endif; ?>
									<span data-wp-text="context.row.populationPercent"></span>
								</td>
								<?php if ( $is_community_group ) : ?>
									<td class="prc-quiz-result-table__percent-cell prc-quiz-result-table__group-percent-cell">
										<span class="prc-quiz-result-table__demo-label"><?php echo esc_html__( '% of your group', 'prc-quiz' ); ?></span>
										<span data-wp-text="context.row.groupPercent"></span>
									</td>
								<?php endif; ?>
								<template data-wp-each--demo="context.row.demoBreakValues">
									<td class="prc-quiz-result-table__percent-cell prc-quiz-result-table__demo-cell">
										<span class="prc-quiz-result-table__demo-label" data-wp-text="context.demo.label"></span>
										<span data-wp-text="context.demo.value"></span>
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
		unset( $content, $block );

		$icon_size          = array_key_exists( 'iconSize', $attributes ) ? (float) $attributes['iconSize'] : 1;
		$icon_color         = array_key_exists( 'iconColor', $attributes ) ? $attributes['iconColor'] : 'ui-black';
		$icon_color_css     = $this->resolve_icon_color( $icon_color );
		$is_community_group = $this->is_community_group_style( $attributes );
		$is_complex         = $this->is_complex_style( $attributes ) || $is_community_group;

		$classnames = array(
			'is-style-complex'                => $is_complex,
			self::COMMUNITY_GROUP_STYLE_CLASS => $is_community_group,
		);

		$block_attrs = get_block_wrapper_attributes(
			array(
				'class'               => \PRC\Primitives\BlockUtils\classNames( $classnames ),
				'data-wp-interactive' => 'prc-quiz/controller',
				'data-wp-context'     => wp_json_encode(
					array(
						'resultTableMode' => $is_community_group ? 'community-group' : 'personal',
					)
				),
				'style'               => sprintf( '--prc-quiz-result-table-icon-color: %s;', esc_attr( $icon_color_css ) ),
			)
		);

		if ( $is_complex ) {
			return $this->render_complex_results( $block_attrs, $icon_size, $icon_color_css, $is_community_group );
		}

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
