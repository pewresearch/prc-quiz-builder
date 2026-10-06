<?php
/**
 * Results class.
 *
 * @package PRC\Platform\Quiz
 */

namespace PRC\Platform\Quiz;

use WP_Error;
use WP_Block_Parser_Block;
use WP_HTML_Tag_Processor;

/**
 * Results class.
 *
 * @package PRC\Platform\Quiz
 */
class Results {
	/**
	 * Constructor.
	 *
	 * @param object $loader The loader.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'block_init' );
		$loader->add_action( 'init', $this, 'register_legacy_result_score_block', 12 );
		$loader->add_filter( 'render_block', $this, 'handle_results_display_logic', 10, 2 );
	}

	/**
	 * Keep rendering saved prc-quiz/result-score blocks on the frontend.
	 * The block is removed from the inserter in favor of the Your Score bit.
	 *
	 * @hook init priority 12
	 */
	public function register_legacy_result_score_block(): void {
		register_block_type(
			'prc-quiz/result-score',
			array(
				'render_callback' => array( $this, 'render_legacy_result_score_block' ),
				'supports'        => array(
					'anchor'        => true,
					'html'          => false,
					'interactivity' => true,
					'multiple'      => false,
					'inserter'      => false,
					'color'         => array(
						'background' => true,
						'text'       => true,
					),
					'spacing'       => array(
						'margin'  => array( 'top', 'bottom' ),
						'padding' => true,
					),
					'typography'    => array(
						'fontSize'                 => true,
						'__experimentalFontFamily' => true,
					),
				),
			)
		);
	}

	/**
	 * Render a legacy Results Score block saved before the Your Score bit.
	 *
	 * @param array  $attributes Block attributes.
	 * @param string $content    Block content.
	 * @return string
	 */
	public function render_legacy_result_score_block( $attributes, $content ) {
		unset( $content );
		$number_of_questions = array_key_exists( 'numberOfQuestions', $attributes )
			? trim( (string) $attributes['numberOfQuestions'] )
			: '';

		if ( '' === $number_of_questions || 'N/A' === $number_of_questions ) {
			$number_of_questions = '';
		}

		$block_wrapper_attrs = get_block_wrapper_attributes(
			array(
				'class'               => 'wp-block-prc-quiz-result-score',
				'data-wp-interactive' => 'prc-quiz/controller',
				'data-wp-context'     => wp_json_encode(
					array(
						'numberOfQuestions' => $number_of_questions,
					)
				),
			)
		);

		return wp_sprintf(
			'<h1 %1$s>You answered <strong><span data-wp-text="state.score"></span> out of <span data-wp-text="state.numberOfQuestionsTotal"></span></strong> questions correctly.</h1>',
			$block_wrapper_attrs
		);
	}

	/**
	 * No archetype found markup.
	 *
	 * @param int $quiz_id The quiz ID.
	 * @return string
	 */
	public function no_archetype_found( $quiz_id ) {
		$quiz_permalink = get_permalink( $quiz_id );
		// Redirect to the url without the results/?archetype= query string.
		ob_start();
		?>
		<div class="prc-quiz__no-archetype-found">
			<h2>Sorry, we could not retrieve those results.</h2>
			<p>Your results may not have finished saving. If you just submitted the quiz, return to the quiz and try saving your results again.</p>
			<a href="<?php echo esc_url( $quiz_permalink ); ?>" class="prc-quiz__no-archetype-found__button ui button">Return to the quiz</a>
		</div>
		<?php
		return ob_get_clean();
	}

	/**
	 * Wraps inner results blocks with display logic dependent on score.
	 *
	 * @hook render_block
	 * @param string $block_content The block content.
	 * @param array  $block The block data.
	 * @return string
	 */
	public function handle_results_display_logic( $block_content, $block ) {
		if ( ! isset( $block['attrs']['resultsDisplayMode'] ) ) {
			return $block_content;
		}
		if ( 'always' === $block['attrs']['resultsDisplayMode'] ) {
			return $block_content;
		}

		// Check if the block has the resultsDisplayMode attribute.
		$results_display_mode = $block['attrs']['resultsDisplayMode'] ?? 'always';
		// Check if the block has the resultsExactPoints attribute.
		$results_exact_points = $block['attrs']['resultsExactPoints'] ?? 50;
		// Check if the block has the resultsMinPoints attribute.
		$results_min_points = $block['attrs']['resultsMinPoints'] ?? 0;
		// Check if the block has the resultsMaxPoints attribute.
		$results_max_points = $block['attrs']['resultsMaxPoints'] ?? 100;
		// Check if the block has the resultsExactPointsString attribute.
		$results_exact_points_string = $block['attrs']['resultsExactPointsString'] ?? '';
		// Check if the block has the resultsThresholdPoints attribute.
		$results_threshold_points = $block['attrs']['resultsThresholdPoints'] ?? 50;
		// Check if the block has the resultsThresholdDirection attribute.
		$results_threshold_direction = $block['attrs']['resultsThresholdDirection'] ?? 'above';
		$results_bucket_id           = $block['attrs']['resultsBucketId'] ?? '';

		$tag = new WP_HTML_Tag_Processor( $block_content );
		$tag->next_tag();
		// Check if this block has a data-wp-interactive attribute already, if so we need to wrap it in a new div to contain it's interactivity context.
		if ( $tag->get_attribute( 'data-wp-interactive' ) ) {
			$tag->get_updated_html();
			$content = wp_sprintf(
				'<div data-wp-interactive="prc-quiz/controller">%s</div>',
				$block_content
			);
			// Reset the tag processor.
			$tag = new WP_HTML_Tag_Processor( $content );
			$tag->next_tag();
		}
		$tag->set_attribute(
			'data-wp-context',
			wp_json_encode(
				array(
					'resultsDisplay' => array(
						'mode'               => $results_display_mode,
						'exactPoints'        => $results_exact_points,
						'exactPointsString'  => $results_exact_points_string,
						'minPoints'          => $results_min_points,
						'maxPoints'          => $results_max_points,
						'thresholdPoints'    => $results_threshold_points,
						'thresholdDirection' => $results_threshold_direction,
						'bucketId'           => $results_bucket_id,
					),
				)
			)
		);
		$tag->set_attribute( 'data-wp-bind--hidden', '!state.displayResultInnerBlock' );

		return $tag->get_updated_html();
	}

	/**
	 * Get the archetype data.
	 *
	 * @param int    $quiz_id The quiz ID.
	 * @param string $hash The hash.
	 * @return array The archetype data.
	 */
	public function get_archetype_data( $quiz_id, $hash ) {
		$archetypes = new Archetypes(
			array(
				'quiz_id' => $quiz_id,
				'hash'    => $hash,
			)
		);
		return $archetypes->get_archetype();
	}

	/**
	 * Render the block callback.
	 *
	 * @param array    $attributes The block attributes.
	 * @param string   $content The block content.
	 * @param WP_Block $block The block instance.
	 * @return string The block content.
	 */
	public function render_block_callback( $attributes, $content, $block ) {
		$error_message      = null;
		$quiz_id            = $block->context['prc-quiz/id'] ?? null;
		$results_transition = $attributes['resultsTransition'] ?? 'default';
		if ( ! in_array( $results_transition, array( 'default', 'countdown' ), true ) ) {
			$results_transition = 'default';
		}
		// First we check if the user is requesting an archetype.
		$archetype_id = get_query_var( 'quizArchetype', false );
		// Then we look for the archetype data. If none can be found, we show an error message.
		$archetype         = $archetype_id ? $this->get_archetype_data( $quiz_id, $archetype_id ) : null;
		$archetype_context = array();
		// Treat RTDB failures like a miss for results rendering.
		if ( is_wp_error( $archetype ) ) {
			$archetype = false;
		}
		// If an archetype is being requested but none found, we return back an error message.
		if ( false === $archetype ) {
			$error_message = $this->no_archetype_found( $quiz_id );
		}

		// If the archetype is found, we re-construct the userScore context object from the stored archetype data.
		// When the page loads, directly into the results view, the userScore context object is then available to the view.js file.
		// This allows us to display the results without having to re-submit the quiz.
		if ( null !== $archetype && false !== $archetype && ! empty( $archetype ) ) {
			$archetype_context = array(
				'userScore' => array(
					'score'          => $archetype->score ?? 0,
					'hash'           => $archetype_id,
					'userSubmission' => $archetype->submission ?? array(),
				),
			);
		}

		/**
		 * Process the HTML and add iAPI directives for the results block.
		 */
		$tag = new WP_HTML_Tag_Processor( $content );
		$tag->next_tag(
			array(
				'class_name' => 'wp-block-prc-quiz-results',
			)
		);
		$tag->set_attribute( 'data-wp-interactive', 'prc-quiz/controller' );
		$tag->set_attribute( 'data-wp-bind--hidden', '!state.displayResults' );
		$tag->set_attribute( 'data-results-transition', $results_transition );
		$tag->set_attribute(
			'data-wp-context',
			wp_json_encode(
				array(
					'resultsTransition' => $results_transition,
					...$archetype_context,
				)
			)
		);
		$tag->set_attribute( 'data-wp-init', 'callbacks.onResultsInit' );
		$tag->set_attribute( 'data-wp-watch--resultsDisplay', 'callbacks.onResultsDisplay' );
		$tag->set_attribute( 'data-wp-watch--syncScoreToForm', 'callbacks.syncScoreToForm' );

		/**
		 * This is a hack to take over core/social-links iAPI functionality.
		 * Here we're hijacking the iAPI store to point to quiz controller whenever a social links block is inside the results block.
		 * This allows us to use the quiz controller's onShareClick action to share the results page.
		 * Additionally, we're adding quiz results specific values to the social links block.
		 * This allows us to share the results page with a custom message and title.
		 */
		while ( $tag->next_tag(
			array(
				'tag_name'   => 'li',
				'class_name' => 'wp-block-social-link',
			)
		) ) {
			$existing_context = $tag->get_attribute( 'data-wp-context' );
			if ( $existing_context ) {
				$tag->remove_attribute( 'data-wp-context' );
			}
			$tag->set_attribute( 'data-wp-interactive', 'prc-quiz/controller' ); // Now our view.js actions.onShareClick will be used instead.
		}

		$content = $tag->get_updated_html();

		// If there's an error message, we replace the contents of the results block with the error message.
		if ( $error_message ) {
			$content = $error_message;
		}

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
			PRC_QUIZ_DIR . '/build/results',
			array(
				'render_callback' => array( $this, 'render_block_callback' ),
			)
		);
	}
}
