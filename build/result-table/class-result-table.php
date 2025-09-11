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
	 * Renders the simple results.
	 *
	 * @param string $block_attrs The block attributes.
	 * @return string The rendered HTML.
	 */
	public function render_simple_results( $block_attrs ) {
		ob_start();
		?>
		<table <?php echo wp_kses_post( $block_attrs ); ?>>
			<thead class="">
				<tr class="">
					<th class=""></th>
					<th class=""></th>
					<th class="center aligned">Your Answer</th>
					<th class="center aligned">Correct Answer</th>
				</tr>
			</thead>
			<tbody class="">
				<template data-wp-each--row="state.resultsTableRows">
					<tr data-wp-key="context.row.uuid" class="prc-quiz-result-table__row">
						<td>
							<span class="prc-quiz-result-table__icon" data-wp-bind--hidden="!context.row.correct">
								<?php echo wp_kses_post( \PRC\Platform\Icons\render( 'light', 'check' ) ); ?>
							</span>
							<span class="prc-quiz-result-table__icon" data-wp-bind--hidden="context.row.correct">
								<?php echo wp_kses_post( \PRC\Platform\Icons\render( 'light', 'xmark' ) ); ?>
							</span>
						</td>
						<td>
							<span data-wp-text="context.row.question"></span>
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
		<?php
		return ob_get_clean();
	}

	/**
	 * Renders the demo break results.
	 *
	 * @param string $block_attrs The block attributes.
	 * @return string The rendered HTML.
	 */
	public function render_demo_break_results( $block_attrs ) {
		ob_start();
		?>
		<table <?php echo wp_kses_post( $block_attrs ); ?>>
			<thead class="">
				<tr class="">
					<th class=""></th>
					<th class=""></th>
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
							<span class="prc-quiz-result-table__icon" data-wp-class--is-visible="context.row.correct">
								<?php echo wp_kses_post( \PRC\Platform\Icons\render( 'light', 'check' ) ); ?>
							</span>
							<span class="prc-quiz-result-table__icon" data-wp-class--is-visible="!context.row.correct">
								<?php echo wp_kses_post( \PRC\Platform\Icons\render( 'light', 'xmark' ) ); ?>
							</span>
						</td>
						<td class="">
							<span data-wp-text="context.row.question"></span>
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

		$classnames = array(
			'is-demo-break-table' => false !== $demo_breaks,
		);

		$block_attrs = get_block_wrapper_attributes(
			array(
				'class'               => \PRC\Platform\Block_Utils\classNames( $classnames ),
				'data-wp-interactive' => 'prc-quiz/controller',
			)
		);

		/*
		 * @TODO: This needs more work, not working correctly.
		 * if ( false !== $demo_breaks ) {
		 *     return $this->render_demo_break_results( $block_attrs );
		 * } else {
		 *     return $this->render_simple_results( $block_attrs );
		 * }
		 */

		return $this->render_simple_results( $block_attrs );
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
