<?php
/**
 * Controller class.
 *
 * @package PRC\Platform\Quiz
 */

namespace PRC\Platform\Quiz;

use WP_Block_Parser_Block, WP_Error, WP_HTML_Tag_Processor;

/**
 * Controller class.
 *
 * @package PRC\Platform\Quiz
 */
class Controller {
	/**
	 * Constructor.
	 *
	 * @param object $loader The loader.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'block_init' );
		$loader->add_filter( 'render_block_context', $this, 'set_quiz_id_in_context', 10, 2 );
		$loader->add_filter( 'render_block_core/buttons', $this, 'modify_buttons', 10, 2 );
	}

	/**
	 * Adds the current quiz object id to the block context.
	 * Used by the question and answer blocks to scope their data into the proper prc-quiz/controller
	 * block's state/instance.
	 * 
	 * @hook render_block_context
	 * 
	 * @param array $context The context.
	 * @param array $parsed_block The parsed block.
	 * @return array
	 */
	public function set_quiz_id_in_context( $context, $parsed_block ) {
		if ( 'prc-quiz/controller' === $parsed_block['blockName'] && is_singular( 'quiz' ) ) {
			$context['prc-quiz/id'] = get_the_ID();
		}
		return $context;
	}

	/**
	 * Modify the buttons to add the appropriate directives to them.
	 * 
	 * @hook render_block_core/buttons
	 *
	 * @param string $block_content The block content.
	 * @param object $block The block instance.
	 * @return string
	 */
	public function modify_buttons( $block_content, $block ) {
		$tag = new WP_HTML_Tag_Processor( $block_content );
		while ( $tag->next_tag() ) {
			if ( $tag->has_class( 'prc-quiz-next-page-button' ) ) {
				$tag->set_attribute( 'data-wp-on--click', 'actions.onNextPageClick' );
			}
			if ( $tag->has_class( 'prc-quiz-previous-page-button' ) ) {
				$tag->set_attribute( 'data-wp-on--click', 'actions.onPreviousPageClick' );
			}
			if ( $tag->has_class( 'prc-quiz-start-button' ) ) {
				$tag->set_attribute( 'data-wp-on--click', 'actions.onStartQuizClick' );
			}
			if ( $tag->has_class( 'prc-quiz-submit-button' ) ) {
				$tag->set_attribute( 'data-wp-on--click', 'actions.onSubmitQuizClick' );
			}
			if ( $tag->has_class( 'prc-quiz-reset-button' ) ) {
				$tag->set_attribute( 'data-wp-on--click', 'actions.onResetQuizClick' );
			}
		}
		return $tag->get_updated_html();
	}

	/**
	 * Render quiz controller block.
	 *
	 * @param array  $attributes The attributes.
	 * @param string $content The content.
	 * @return string
	 */
	public function render_block_callback( $attributes, $content ) {
		// Enqueue some additional non-module scripts.
		wp_enqueue_script( 'wp-url' );
		wp_enqueue_script( 'wp-api-fetch' );

		// Get the current post.
		global $post;
		// Get the post id.
		$post_id = $post->ID;

		// This is a flag to determine if the quiz has support for community groups.
		$groups_enabled = $attributes['groupsEnabled'];
		// Create a nonce for the quiz.
		$nonce = wp_create_nonce( 'prc_quiz_nonce--' . $post_id );
		
		// This is a flag to exeplicitly display the results if the user is entering through a link.
		$show_results = get_query_var( 'quizShowResults', false );
		// The archetype is a md5 hash of a user's answers. There are only so many possible combinations of answers for any given quiz.
		// This allows us to deterministically display results for a user based on their answers.
		// It also, as a byproduct of technical efficiency, allows us to group users into clusters based on their answers, or "typologies".
		$archetype = get_query_var( 'quizArchetype', false );
		// Quizzes can be embedded in other pages.
		$is_embedded = get_query_var( 'quizEmbed', false );
		// If a user is utilizing community groups we need their group's id.
		$group_id = get_query_var( 'quizGroup', false );
		// Additionally, some groups may have a vanity domain corresponding to the owner's email domain. Like harvard-edu.
		$group_domain = get_query_var( 'quizGroupDomain', false );
		// If the quiz allows submissions.
		$allow_submissions = array_key_exists( 'allowSubmissions', $attributes ) ? $attributes['allowSubmissions'] : true;
		// If a quiz is being previewed, we want to disable submissions.
		if ( is_preview() ) {
			$allow_submissions = false;
		}

		$tag = new WP_HTML_Tag_Processor( $content );
		$tag->next_tag();
		$tag->set_attribute( 'data-wp-interactive', 'prc-quiz/controller' );
		// Set up initial local state/context for the block.
		$tag->set_attribute(
			'data-wp-context',
			wp_json_encode(
				array(
					'nonce'               => $nonce,
					'quizTitle'           => get_the_title(),
					'quizId'              => $post_id,
					'quizType'            => $attributes['type'],
					'quizUrl'             => get_permalink( $post_id ),
					'displayType'         => $attributes['displayType'],
					'groupsEnabled'       => $groups_enabled,
					'groupId'             => $group_id,
					'groupDomain'         => $group_domain,
					'archetype'           => $archetype,
					'answerThreshold'     => $attributes['threshold'],
					'isEmbedded'          => $is_embedded,
					'processing'          => false,
					'loaded'              => false,
					'readyForSubmission'  => false,
					'submitted'           => false,
					'displayResults'      => $show_results && $archetype, // If the user is entering through a link and explicitly requesting to view results and has an archetype, we want to display the results. (If there is no archetype then we can not display the results.).
					'displayGroupResults' => $group_id && $show_results && $groups_enabled && ! $archetype, // If the user is entering through a group link with a show results flag BUT NO archetype, we want to display the group's aggregate results.
					'selectedAnswers'     => array(), // A nested array of user selected answers uuid matched to the question uuid. questionUuid: [answerUuid1, answerUuid2, ...]
					'userSubmission'      => array(), // A flat array of user selected answers uuid. Constructed by callback. 
					'userScore'           => array(), // An array of the user's score data. This includes the final score, as well as some other resultsData.
					'allowSubmissions'    => $allow_submissions,
					'isPreview'           => is_preview(),
					'shareText'           => 'I scored %score% on the "%title%" quiz',
				)
			) 
		);
		
		// This is triggered when the block is initialized into the DOM.
		$tag->set_attribute( 'data-wp-init', 'callbacks.onInit' );
		// Apply a class to the block if it is processing. Mainly used to show/hide the loading spinner.
		$tag->set_attribute( 'data-wp-class--is-processing', 'context.processing' );
		// Update's the user's submission data as they answer questions.
		$tag->set_attribute( 'data-wp-watch--update-user-submission', 'callbacks.updateUserSubmission' );
		// Update's the user's score data as we update their submission data.
		$tag->set_attribute( 'data-wp-watch--update-user-score', 'callbacks.updateUserScore' );
		// On scrollable quizzes, watch for the user reaching the answerThreshold, then submit the quiz.
		$tag->set_attribute( 'data-wp-watch--on-scrollable-submit', 'callbacks.onScrollableSubmit' );
		// These data attributes are used in internal analytics tools.
		$tag->set_attribute( 'data-wp-bind--threshold', 'context.answerThreshold' );
		$tag->set_attribute( 'data-wp-bind--quiz-id', 'context.quizId' );
		
		$content = $tag->get_updated_html();

		// Add a loading spinner to the block.
		$loading = '<div class="wp-block-prc-quiz-controller-processing"><div class="wp-block-prc-quiz-controller-processing_spinner"><span>Loading...</span></div></div>';
		// Add the loading spinner to inside the very last </div> tag.
		$content = preg_replace( '/<\/div>$/', $loading . '</div>', $content );

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
			PRC_QUIZ_DIR . '/build/controller',
			array(
				'render_callback' => array( $this, 'render_block_callback' ),
			) 
		);
	}
}
