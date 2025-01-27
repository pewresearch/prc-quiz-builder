<?php
namespace PRC\Platform\Quiz;
/**
 * Block Name:        Result Table
 * Version:           0.1.0
 * Requires at least: 6.1
 * Requires PHP:      8.0
 * Author:            Seth Rubenstein
 *
 * @package           prc-quiz
 */

class Result_Table {
	public static $version = '1.0.0';
	public static $dir = __DIR__;

	public function __construct( $loader ) {
		$loader->add_action('init', $this, 'block_init');
		$loader->add_filter( 'prc_quiz_result_table_data', $this, 'get_result_table_data', 10, 1 );
	}

	/**
	 * Removes the pages structure from the quiz data and returns just an array of questions and their answers.
	 * This is useful for when you want to reduce the weight of the data model.
	 *
	 * @param mixed $quiz_data
	 * @return array
	 */
	public function condense_questions_data( $quiz_data ) {
		$questions_raw      = array_map(
			function( $e ) {
				return $e['questions'];
			},
			$quiz_data['pages']
		);
		$questions_filtered = array();
		foreach ( $questions_raw as $questions ) {
			if ( empty( $questions ) ) {
				continue;
			}
			foreach ( $questions as $q ) {
				$questions_filtered[ $q['uuid'] ] = $q;
			}
		}
		return $questions_filtered;
	}

	public function parse_table_rows($data, $submission) {
		$submission    = json_decode( $submission, true );
		$answers_given = $submission['answers'];
		$questions = $this->condense_questions_data( $data );
		$rows = array();

		foreach ( $questions as $q_uuid => $question ) {
			$rows[ $q_uuid ] = array(
				'question'        => $question['question'],
				'question_image'  => $question['image'],
				'correct_answer'  => array_filter(
					$question['answers'],
					function( $answer ) {
						return $answer['correct'];
					}
				),
				'selected_answer' => array_filter(
					$question['answers'],
					function( $answer ) use ( $answers_given ) {
						return in_array( $answer['uuid'], $answers_given );
					}
				),
				'correct'         => false,
				'demoBreakValues' => $question['demoBreaks'],
			);

			// We should account for multiple choice questions and not do an array pop here.
			$rows[ $q_uuid ]['correct_answer']  = array_pop( $rows[ $q_uuid ]['correct_answer'] );
			$rows[ $q_uuid ]['selected_answer'] = array_pop( $rows[ $q_uuid ]['selected_answer'] );

			if ( $rows[ $q_uuid ]['correct_answer']['uuid'] === $rows[ $q_uuid ]['selected_answer']['uuid'] ) {
				$rows[ $q_uuid ]['correct'] = true;
			}
		}

		return $rows;
	}

	public function get_row_classnames($row, $attributes, $is_odd = false) {
		$classnames = array(
			'is-correct'		  => $row['correct'],
			'is-incorrect'		  => ! $row['correct'],
		);

		if ( false === $is_odd ) {
			if ( isset( $attributes['rowTextColor'] ) ) {
				$classnames[] = 'has-text-color';
				$classnames[] = sprintf( 'has-%s-color', $attributes['rowTextColor'] );
			}
			if ( isset( $attributes['rowBackgroundColor'] ) ) {
				$classnames[] = 'has-background';
				$classnames[] = sprintf( 'has-%s-background-color', $attributes['rowBackgroundColor'] );
			}
		} else {
			if ( isset( $attributes['altRowTextColor'] ) ) {
				$classnames[] = 'has-text-color';
				$classnames[] = sprintf( 'has-%s-color', $attributes['altRowTextColor'] );
			}
			if ( isset( $attributes['altRowBackgroundColor'] ) ) {
				$classnames[] = 'has-background';
				$classnames[] = sprintf( 'has-%s-background-color', $attributes['altRowBackgroundColor'] );
			}
		}

		return \PRC\Platform\Block_Utils\classNames( 'wp-block-prc-quiz-result-table__row', $classnames );
	}

	public function render_simple_results( $rows, $block_attrs, $attributes ) {
		ob_start();
		?>
		<table <?php echo $block_attrs; ?>>
			<thead class="">
				<tr class="">
					<th class=""></th>
					<th class=""></th>
					<th class="center aligned">Your Answer</th>
					<th class="center aligned">Correct Answer</th>
				</tr>
			</thead>
			<tbody class="">
				<?php
				$row_index = 0;
				$check = \PRC\Platform\Icons\render('light', 'check');
				$xmark = \PRC\Platform\Icons\render('light', 'xmark');
				foreach ( $rows as $row ) {
					$correct  = $row['correct'] ? 'positive has-ui-success' : 'negative has-ui-error';
					$icon     = $row['correct'] ?  $check : $xmark;
					$question       = $row['question'];
					$question_image = $row['question_image'];
					// We need to account for multiple choice questions here. Simply comma seperate these results?
					$correct_answer  = $row['correct_answer']['answer'];
					$corret_answer_image = $row['correct_answer']['image'];
					$selected_answer = $row['selected_answer']['answer'];
					$selected_answer_image = $row['selected_answer']['image'];
					$is_odd = $row_index % 2 === 0;

					$classnames = $this->get_row_classnames($row, $attributes, $is_odd);

					ob_start();
					?>
					<tr class="<?php echo $classnames;?>">
						<td class="center aligned <?php echo esc_attr( $correct ); ?>"><?php echo $icon ; ?></td>
						<td class=""><?php echo esc_html( $question ); ?><?php echo false !== $question_image ? '<img src="'.$question_image['src'].'"/>' : null; ?></td>
						<td class="center aligned"><?php echo esc_html( $selected_answer ); ?><?php echo false !== $selected_answer_image ? '<img src="'.$selected_answer_image['src'].'"/>' : null; ?></td>
						<td class="center aligned"><?php echo esc_html( $correct_answer ); ?><?php echo false !== $corret_answer_image ? '<img src="'.$corret_answer_image['src'].'"/>' : null; ?></td>
					</tr>
					<?php
					$row_index++;
					echo ob_get_clean();
				}
				?>
			</tbody>
		</table>
		<?php
		return ob_get_clean();
	}

	public function render_demo_break_results( $rows, $block_attrs, $attributes, $demo_breaks ) {
		ob_start();
		?>
		<table <?php echo $block_attrs; ?>>
			<thead class="">
				<tr class="">
					<th class=""></th>
					<th class=""></th>
					<?php foreach ( $demo_breaks as $demo_break ) : ?>
						<th class="center aligned"><?php echo $demo_break; ?></th>
					<?php endforeach; ?>
				</tr>
			</thead>
			<tbody class="">
				<?php
				$row_index = 1;
				$check = \PRC\Platform\Icons\render('light', 'check');
				$xmark = \PRC\Platform\Icons\render('light', 'xmark');

				foreach ( $rows as $row ) {
					$correct  = $row['correct'] ? 'positive has-ui-success' : 'negative has-ui-error';
					$icon     = $row['correct'] ?  $check : $xmark;
					$question = $row['question'];
					$question_image = $row['question_image'];
					// We need to account for multiple choice questions here. Simply comma seperate these results?
					$correct_answer  = $row['correct_answer']['answer'];
					$corret_answer_image = $row['correct_answer']['image'];
					$selected_answer = $row['selected_answer']['answer'];
					$selected_answer_image = $row['selected_answer']['image'];
					$is_odd = $row_index % 2 === 0;

					$classnames = $this->get_row_classnames($row, $attributes, $is_odd);

					ob_start();
					?>
					<tr class="<?php echo $classnames;?>">
						<td class="center aligned <?php echo esc_attr( $correct ); ?>"><?php echo $icon ; ?></td>
						<td class="">
							<span><?php echo esc_html( $question ); ?></span>
							<?php echo false !== $question_image ? '<img src="'.$question_image['src'].'"/>' : null; ?>
							<div>
								<span>You answered:</span>
								<span><strong><?php echo esc_html( $selected_answer ); ?></strong></span>
								<?php echo false !== $selected_answer_image ? '<img src="'.$selected_answer_image['src'].'"/>' : null; ?>
							</div>
							<div>
								<span>The correct answer:</span>
								<span><strong><?php echo esc_html( $correct_answer ); ?></strong></span>
								<?php echo false !== $corret_answer_image ? '<img src="'.$corret_answer_image['src'].'"/>' : null; ?>
							</div>
						</td>
						<?php foreach ( $demo_breaks as $i => $demo_break ) : ?>
							<td class="center aligned">
								<?php echo false !== $row['demoBreakValues'] && array_key_exists( $i, $row['demoBreakValues'] ) ? $row['demoBreakValues'][ $i ] : null; ?>
							</td>
						<?php endforeach; ?>
					</tr>
					<?php
					$row_index++;
					echo ob_get_clean();
				}
				?>
			</tbody>
		</table>
		<?php
		return ob_get_clean();
	}

	public function render_block_callback( $attributes, $content, $block ) {
		if ( is_admin() ) {
			return;
		}
		if ( ! array_key_exists( 'prc-quiz/results/submissionData', $block->context ) || empty( $block->context['prc-quiz/results/submissionData'] ) ) {
			return;
		}

		$submission  = $block->context['prc-quiz/results/submissionData'];
		$quiz_api = new API(get_the_ID());
		$data = $quiz_api->get_quiz_data( false);
		$demo_breaks = $data['demoBreaks'];
		$table_rows  = $this->parse_table_rows($data, $submission);

		$classnames = array(
			'is-demo-break-table' => false !== $demo_breaks,
		);

		$block_attrs = get_block_wrapper_attributes(array(
			'class' => \PRC\Platform\Block_Utils\classNames($classnames),
		));

		if ( false !== $demo_breaks ) {
			return $this->render_demo_break_results( $table_rows, $block_attrs, $attributes, $demo_breaks );
		} else {
			return $this->render_simple_results( $table_rows, $block_attrs, $attributes );
		}
	}

	/**
	* Registers the block using the metadata loaded from the `block.json` file.
	* Behind the scenes, it registers also all assets so they can be enqueued
	* through the block editor in the corresponding context.
	*
	* @see https://developer.wordpress.org/reference/functions/register_block_type/
	*/
	public function block_init() {
		register_block_type(
			self::$dir . '/build',
			array(
				'render_callback' => array( $this, 'render_block_callback' ),
			)
		);
	}
}
