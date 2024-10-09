<?php
namespace PRC\Platform\Quiz;
use WP_Block_Parser_Block, WP_Error;

class API {
	public $quiz_id;

	public function __construct($quiz_id) {
		$this->quiz_id = $quiz_id;
	}

	public function construct_question_answer_pair( $page_uuid, $question_block = false, $quiz_type = 'quiz' ) {
		if ( false === $question_block || ! array_key_exists( 'blockName', $question_block ) || 'prc-quiz/question' !== $question_block['blockName'] ) {
			return false;
		}

		$is_results_page_request  = get_query_var( 'archetype' );
		$question_uuid            = $question_block['attrs']['uuid'];
		$type                     = array_key_exists( 'type', $question_block['attrs'] ) ? $question_block['attrs']['type'] : 'single';
		$randomize                = array_key_exists( 'randomizeAnswers', $question_block['attrs'] ) ? $question_block['attrs']['randomizeAnswers'] : false;
		$conditional              = array_key_exists( 'conditionalDisplay', $question_block['attrs'] ) && array_key_exists( 'conditionalAnswerUuid', $question_block['attrs'] ) && true === $question_block['attrs']['conditionalDisplay'] ? $question_block['attrs']['conditionalAnswerUuid'] : false;
		$demographic_break_values = array_key_exists( 'demoBreakValues', $question_block['attrs'] ) ? json_decode( $question_block['attrs']['demoBreakValues'], true ) : false;
		$question_image_id        = array_key_exists( 'imageId', $question_block['attrs'] ) ? $question_block['attrs']['imageId'] : false;
		$image_size               = $is_results_page_request ? '200-wide' : '640-wide';
		$image_on_top 		   = array_key_exists( 'imageOnTop', $question_block['attrs'] ) ? $question_block['attrs']['imageOnTop'] : false;

		$question_image = false;
		if ( false !== $question_image_id ) {
			$img = wp_get_attachment_image_src( $question_image_id, $image_size );
			if ( false !== $img ) {
				$question_image = array(
					'src' => $img[0],
					'width' => $img[1],
					'height' => $img[2],
				);
			}
		}

		$q_data = array(
			'blockName'   => 'prc-quiz/question',
			'uuid'        => $question_uuid,
			'questionId'  => array_key_exists( 'internalId', $question_block['attrs'] ) ? $question_block['attrs']['internalId'] : false,
			'pageUuid'    => $page_uuid,
			'question'    => $question_block['attrs']['question'],
			'type'        => $type,
			'conditional' => $conditional,
			'answers'     => array(),
			'demoBreaks'  => $demographic_break_values,
			'image'       => $question_image,
			'imageOnTop'  => $image_on_top,
		);

		// We need to account for thermometer blocks. The should take the same form as $q_data['answers'][] = array()... from  below. However, each answer should have the value... of the range. Conditional will always be false.  Also the points and answer value should be the same value.
		if (
			'thermometer' === $type &&
			array_key_exists( 'thermometerValues', $question_block['attrs'] ) &&
			! empty( $question_block['attrs']['thermometerValues'] )
		) {
			$answer_blocks = array();
			$v             = explode( ',', $question_block['attrs']['thermometerValues'] );
			foreach ( $v as $key => $value ) {
				$answer_blocks[] = array(
					'attrs' => array(
						'uuid'         => 'thermo-' . md5( wp_json_encode( array( $question_uuid, $key, $value ) ) ),
						'questionUuid' => $question_uuid,
						'points'       => $value,
						'answer'       => $value,
						'questionId'   => array_key_exists( 'internalId', $question_block['attrs'] ) ? $question_block['attrs']['internalId'] : false,
					),
				);
			}
		} else {
			$answer_blocks = $question_block['innerBlocks'];
		}

		foreach ( $answer_blocks as $answer_block ) {
			$answer_uuid   = $answer_block['attrs']['uuid'];
			$points        = array_key_exists( 'points', $answer_block['attrs'] ) ? $answer_block['attrs']['points'] : 0;
			$correct       = array_key_exists( 'correct', $answer_block['attrs'] ) ? $answer_block['attrs']['correct'] : false;
			$cond          = array_key_exists( 'conditionalDisplay', $answer_block['attrs'] ) && array_key_exists( 'conditionalAnswerUuid', $answer_block['attrs'] ) && true === $answer_block['attrs']['conditionalDisplay'] ? $answer_block['attrs']['conditionalAnswerUuid'] : false;
			$results_label = array_key_exists( 'resultsLabel', $answer_block['attrs'] ) ? $answer_block['attrs']['resultsLabel'] : false;
			$answer_image_id = array_key_exists( 'imageId', $answer_block['attrs'] ) ? $answer_block['attrs']['imageId'] : false;

			$answer_image = false;
			if ( false !== $answer_image_id ) {
				$img = wp_get_attachment_image_src( $answer_image_id, $image_size );
				if ( false !== $img ) {
					$answer_image = array(
						'src' => $img[0],
						'width' => $img[1],
						'height' => $img[2],
					);
				}
			}

			$q_data['answers'][] = array(
				'uuid'         => $answer_uuid,
				'questionUuid' => $question_uuid,
				'questionId'   => array_key_exists( 'internalId', $question_block['attrs'] ) ? $question_block['attrs']['internalId'] : false,
				'answer'       => array_key_exists('answer', $answer_block['attrs']) ? $answer_block['attrs']['answer'] : null,
				'resultsLabel' => $results_label,
				'correct'      => 'typology' !== $quiz_type ? $correct : null,
				'points'       => $points,
				'conditional'  => $cond,
				'image'        => $answer_image,
			);
		}

		if ( $randomize ) {
			shuffle( $q_data['answers'] );
		}

		return $q_data;
	}

	public function parse_questions( $page_uuid, $page_inner_blocks, $quiz_type ) {
		// Only return question blocks.
		$question_blocks = array_filter(
			$page_inner_blocks,
			function( $a ) {
				return 'prc-quiz/question' === $a['blockName'];
			}
		);

		if ( empty( $question_blocks ) ) {
			return array();
		}

		$questions = array();

		foreach ( $question_blocks as $question_block ) {
			$questions[] = $this->construct_question_answer_pair( $page_uuid, $question_block, $quiz_type );
		}

		return $questions;
	}

	public function prepare_blocks( $page_uuid, $page_inner_blocks, $quiz_type ) {
		return array_map(
			function( $a ) use ( $page_uuid, $quiz_type ) {
				if ( ! array_key_exists( 'blockName', $a ) ) {
					return null;
				}

				if ( 'prc-quiz/question' === $a['blockName'] ) {
					return $this->construct_question_answer_pair( $page_uuid, $a, $quiz_type );
				}

				$parsed = new WP_Block_Parser_Block(
					$a['blockName'],
					$a['attrs'],
					$a['innerBlocks'],
					$a['innerHTML'],
					$a['innerContent']
				);

				return array(
					'blockName' => $a['blockName'],
					'attrs'     => $a['attrs'],
					'rendered'  => render_block( (array) $parsed ),
				);
			},
			$page_inner_blocks
		);
	}

	public function construct_data_model( $block, $quiz, $return_rendered_blocks = true ) {
		$quiz_type          = array_key_exists( 'type', $block['attrs'] ) ? $block['attrs']['type'] : 'quiz';
		$threshold			= array_key_exists( 'threshold', $block['attrs'] ) ? $block['attrs']['threshold'] : 4;
		$groups             = array_key_exists( 'groups', $block['attrs'] ) ? $block['attrs']['groups'] : false;
		$ga_tracking        = array_key_exists( 'gaTracking', $block['attrs'] ) ? $block['attrs']['gaTracking'] : false;
		$mailchimp_list_id  = false !== $groups && array_key_exists( 'mailchimpListId', $block['attrs'] ) ? $block['attrs']['mailchimpListId'] : false;
		$demographic_breaks = array_key_exists( 'demoBreakLabels', $block['attrs'] ) ? json_decode( $block['attrs']['demoBreakLabels'], true ) : false;
		$demographic_breaks = ! empty( $demographic_breaks ) ? $demographic_breaks : false;

		$page_blocks = $block['innerBlocks'][0]['innerBlocks'];

		$return = array(
			'pages'             => array(), //@TODO: SEE NOTE ABOUT "DATA MODEL" BELOW
			'type'              => $quiz_type,
			'threshold'			=> $threshold,
			'demoBreaks'        => $demographic_breaks,
			'groupsEnabled'     => $groups,
			'gaTrackingEnabled' => $ga_tracking,
			'mailchimpListId'   => $mailchimp_list_id,
			'quizSlug'          => $quiz->post_name,
			'quizTitle'         => $quiz->post_title,
			'quizUrl'           => get_permalink( $quiz->ID ),
			'cached'            => false,
		);

		// @TODO: Right now our "DATA MODEL" includes our presentation markup, this is not intended to be the case. Once WP hydration and directives are in place, we can structure the frontend application to hydrate using the data model.
		foreach ( $page_blocks as $page_block ) {
			$page_uuid = $page_block['attrs']['uuid'];

			// Setup array for page.
			$return['pages'][] = array(
				'uuid'             => $page_uuid,
				'questions'        => $this->parse_questions( $page_uuid, $page_block['innerBlocks'], $quiz_type ),
				'content'          => false !== $return_rendered_blocks ? $this->prepare_blocks( $page_uuid, $page_block['innerBlocks'], $quiz_type ) : false,
				'title'            => $page_block['attrs']['title'],
				'introductionPage' => array_key_exists( 'introductionPage', $page_block['attrs'] ) ? $page_block['attrs']['introductionPage'] : false,
				'introductionNote' => array_key_exists( 'introductionNote', $page_block['attrs'] ) ? $page_block['attrs']['introductionNote'] : false,
			);
		}

		return $return;
	}

	/**
	 * This will get the data model for the quiz.
	 *
	 * @param mixed $quiz_id The ID of the quiz.
	 * @param bool  $return_rendered_blocks Return the blocks rendered in the data model.
	 * @return WP_Error|array Returns an array of data model data or a WP_Error object if errors are encountered.
	 */
	public function get_quiz_data( $return_rendered_blocks = true ) {
		$quiz_id = $this->quiz_id;
		$quiz = get_post( $quiz_id );
		if ( ! $quiz ) {
			return new \WP_Error( 'quiz_not_found', 'Could not find quiz data, try again in a few minutes. If your issue continues please contact technical support. Give technical support this error code: 0001 and this id: ' . $quiz_id, array( 'status' => 404 ) );
		}

		$blocks = parse_blocks( $quiz->post_content );
		$blocks = array_filter(
			$blocks,
			function( $a ) {
				return 'prc-quiz/controller' === $a['blockName'];
			}
		);
		// Pop off the quiz controller block from the content.
		$controller_block = array_pop( $blocks );

		if ( null === $controller_block ) {
			return new \WP_Error( 'quiz_not_found', 'Could not find quiz data, try again in a few minutes. If your issue continues please contact technical support. Give technical support this error code: 0002 and this id: ' . $quiz_id, array( 'status' => 404 ) );
		}

		$quiz_data					  = $this->construct_data_model( $controller_block, $quiz, $return_rendered_blocks );
		$quiz_data['submissionNonce'] = wp_create_nonce( 'prc_quiz_submission_nonce--' . $quiz_id );
		return $quiz_data;
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

	public function score_quiz($args = array()) {
		$args = wp_parse_args(
			$args,
			array(
				'quizId' => false,
				'data' => false,
				'submission' => false,
				'type' => false,
				'questionsToCheck' => false,
			)
		);

		if ( false === $args['quizId'] ) {
			return new \WP_Error( 'invalid_quiz_id', 'Invalid quiz ID', array( 'status' => 400 ) );
		}

		if ( false === $args['data'] ) {
			return new \WP_Error( 'invalid_data', 'Invalid data', array( 'status' => 400 ) );
		}

		if ( false === $args['submission'] ) {
			return new \WP_Error( 'invalid_submission', 'Invalid submission', array( 'status' => 400 ) );
		}

		if ( false === $args['type'] ) {
			return new \WP_Error( 'invalid_type', 'Invalid type', array( 'status' => 400 ) );
		}

		return $this->process_submission( $args['data'], $args['submission'], $args['type'], $args['questionsToCheck'] );
	}

	/**
	 * Restructures the data model to something manageable for grading. Reduces the data down to just a multi-dimensional array of answer uuids and points that the user has submitted. Then it will compare the submitted answers to the correct answers and return the points.
	 *
	 * @param mixed $data
	 * @param mixed $submission
	 * @return mixed
	 */
	public function process_submission( $data, $submission, $type, $restrict_to_questions = array() ) {
		$quiz_id = $this->quiz_id;
		$extracted = array();
		$data = $data['pages'];
		// remove the first page, which should have an attribute of introductionPage set to true.
		// array_shift( $data );

		// If $restrict_to_questions is not empty then we need to filter the data model to only include the questions that are in the array.
		if ( !empty($restrict_to_questions) ) {
			$data = array_map(
				function( $page ) use ( $restrict_to_questions ) {
					$page['questions'] = array_filter(
						$page['questions'],
						function( $question ) use ( $restrict_to_questions ) {
							return in_array( $question['uuid'], $restrict_to_questions, true );
						}
					);
					return $page;
				},
				$data
			);
		}

		foreach ( $data as $page ) {
			$page_contents = array();
			foreach ( $page['questions'] as $question ) {
				foreach ( $question['answers'] as $answer ) {
					$to_add = array(
						'uuid'   => $answer['uuid'],
						'points' => $answer['points'],
					);
					if ( array_key_exists( 'questionId', $answer ) ) {
						$to_add['questionId'] = $answer['questionId'];
					}
					if ( array_key_exists( 'questionUuid', $answer ) ) {
						$to_add['questionUuid'] = $answer['questionUuid'];
					}
					$page_contents[] = $to_add;
				}
			}
			$extracted = array_merge( $extracted, $page_contents );
		}

		// A filtered array of answer uuids and points possible for each.
		$filtered = array_filter(
			$extracted,
			function( $a ) use ( $submission ) {
				return in_array( $a['uuid'], $submission['answers'] );
			}
		);

		// We should also return the "correct" answers from extracted and then compare the two.
		$points = array();
		foreach ( $filtered as $key => $value ) {
			// Determine which ID to use. If the answer has a questionId, use that. Otherwise, use the uuid.
			// IF you want to have a conditional/combined question (two questions with answers being conditional), you should use this so subsequent question answers overwrite the prior question - thus treating two questions as one.
			$id            = array_key_exists( 'questionId', $value ) && !empty($value['questionId']) ? $value['questionId'] : $value['uuid'];
			$points[ $id ] = $value['points'];
		}

		// Return just the points from the array for standard quizzes.
		if ( 'quiz' === $type ) {
			$points = array_map(
				function( $a ) {
					return $a['points'];
				},
				$filtered
			);
		}

		$score = array_sum( $points );

		return apply_filters(
			'prc_quiz_score_submission',
			array(
				'score'    => $score,
				'computed' => $points,
			),
			array(
				'quiz_id'   => $quiz_id,
				'type'      => $type,
				'extracted' => $extracted,
				'filtered'  => $filtered,
				'points'    => $points,
			)
		);
	}
}
