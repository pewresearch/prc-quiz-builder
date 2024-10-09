<?php
// PHP file to use when rendering the block type on the server to show on the front end.
// The following variables are exposed to this file:

// $attributes (array): The block attributes.
// $content (string): The block default content.
// $block (WP_Block): The block instance.

if ( ! array_key_exists( 'prc-quiz/results/score', $block->context ) || !is_numeric( $block->context['prc-quiz/results/score'] ) ) {
	return;
}

$bypass_scoring = array_key_exists('questionsToCheck', $attributes) && !empty($attributes['questionsToCheck']);
if ( ! $bypass_scoring ) {
	$score = $block->context['prc-quiz/results/score'];
} else {
	$questions_to_check = explode(',', $attributes['questionsToCheck']);
	$submission_data = array_key_exists('prc-quiz/results/submissionData', $block->context) ? $block->context[
		'prc-quiz/results/submissionData'
	] : array();
	$submission_data = json_decode($submission_data, true);

	global $PRC_QUIZ;
	$quiz_data = $PRC_QUIZ::$api->get_quiz_data( $quiz_id, false );
	// We need to get the quiz data model and then run the scoring function, again, but only for the questions we want to check.
	$score = $PRC_QUIZ::$api->score_quiz(array(
		'quizId' => get_the_ID(),
		'data' => $quiz_data,
		'submission' => $submission_data,
		'type' => $quiz_data['type'],
		'questionsToCheck' => $attributes['questionsToCheck'],
	));
}

$block_wrapper_attrs = get_block_wrapper_attributes();

echo wp_sprintf(
	'<h1 %1$s>You answered <strong><span id="js-react-user-score">%2$s</span> out of %3$s</strong> questions correctly.</h1>',
	$block_wrapper_attrs,
	$score,
	array_key_exists('numberOfQuestions', $attributes) ? $attributes['numberOfQuestions'] : __('N/A', 'prc-quiz')
);
