<?php
/**
 * Controller class.
 *
 * @package PRC\Platform\Quiz
 */

namespace PRC\Platform\Quiz;

use WP_Block, WP_Block_Parser_Block, WP_Error, WP_HTML_Tag_Processor;

/**
 * Controller class.
 *
 * @package PRC\Platform\Quiz
 */
class Controller {
	/**
	 * CSS class marker for the share quiz button variation.
	 *
	 * @var string
	 */
	public const SHARE_QUIZ_BUTTON_CLASS = 'prc-quiz-share-quiz-button';

	/**
	 * CSS class marker for the share results button variation.
	 *
	 * @var string
	 */
	public const SHARE_RESULTS_BUTTON_CLASS = 'prc-quiz-share-results-button';

	/**
	 * Sprite sheet path, relative to the plugin root.
	 * Timing values live in src/controller/sound-effects.js.
	 *
	 * @var string
	 */
	public const SOUND_SPRITE_PATH = 'assets/quiz_sound_sprite.mp3';

	/**
	 * Constructor.
	 *
	 * @param object $loader The loader.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'block_init' );
		$loader->add_filter( 'render_block_data', $this, 'gate_groups_enabled_attribute' );
		$loader->add_filter( 'render_block_context', $this, 'set_quiz_id_in_context', 10, 2 );
		$loader->add_filter( 'render_block_context', $this, 'apply_group_capability_context', 11, 2 );
		$loader->add_filter( 'render_block_context', $this, 'set_group_bindings_context', 12, 2 );
		$loader->add_filter( 'render_block_core/buttons', $this, 'modify_buttons', 10, 2 );
		$loader->add_filter( 'render_block_core/button', $this, 'modify_share_buttons', 10, 2 );
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
	 * Force the saved groupsEnabled attribute off when capability is none.
	 *
	 * `providesContext` copies the attribute onto child blocks. Mutating the
	 * parsed block here stops stale published markup from leaking groups.
	 *
	 * @hook render_block_data
	 *
	 * @param array $parsed_block Parsed block.
	 * @return array
	 */
	public function gate_groups_enabled_attribute( $parsed_block ) {
		if ( 'prc-quiz/controller' !== ( $parsed_block['blockName'] ?? '' ) ) {
			return $parsed_block;
		}

		$capability = Group_Capability::resolve_from_attributes( $parsed_block['attrs'] ?? array() );
		if ( empty( $capability['allowed'] ) ) {
			$parsed_block['attrs']['groupsEnabled'] = false;
		}

		return $parsed_block;
	}

	/**
	 * Provide community group binding context to all blocks under the controller.
	 *
	 * @hook render_block_context
	 *
	 * @param array $context      Block context.
	 * @param array $parsed_block Parsed block.
	 * @return array
	 */
	public function set_group_bindings_context( $context, $parsed_block ) {
		if ( 'prc-quiz/controller' !== ( $parsed_block['blockName'] ?? '' ) ) {
			return $context;
		}

		$capability     = Group_Capability::resolve_from_attributes( $parsed_block['attrs'] ?? array() );
		$groups_enabled = ! empty( $parsed_block['attrs']['groupsEnabled'] ) && ! empty( $capability['allowed'] );
		if ( ! $groups_enabled ) {
			return $context;
		}

		$quiz_id = get_the_ID();
		if ( ! $quiz_id ) {
			return $context;
		}

		$group_id = get_query_var( 'quizGroup', false );
		if ( false === $group_id ) {
			return $context;
		}

		return array_merge(
			$context,
			Group_Results::get_group_bindings_context( $quiz_id, $group_id )
		);
	}

	/**
	 * Gate community groups on typology or a non-empty score-bucket catalog.
	 *
	 * When the source is buckets, seed `quiz_{id}.clusters` before inner blocks
	 * render so group-results can read the map without a typology results block.
	 *
	 * @hook render_block_context
	 *
	 * @param array $context      Block context.
	 * @param array $parsed_block Parsed block.
	 * @return array
	 */
	public function apply_group_capability_context( $context, $parsed_block ) {
		if ( 'prc-quiz/controller' !== ( $parsed_block['blockName'] ?? '' ) ) {
			return $context;
		}

		$capability = Group_Capability::resolve_from_attributes( $parsed_block['attrs'] ?? array() );
		if ( empty( $capability['allowed'] ) ) {
			$context['prc-quiz/groupsEnabled'] = false;
			return $context;
		}

		if ( 'buckets' !== $capability['source'] ) {
			return $context;
		}

		$quiz_id = $context['prc-quiz/id'] ?? get_the_ID();
		if ( ! $quiz_id ) {
			return $context;
		}

		$state                = wp_interactivity_state( 'prc-quiz/controller', array() );
		$quiz_key             = 'quiz_' . $quiz_id;
		$existing             = isset( $state[ $quiz_key ] ) && is_array( $state[ $quiz_key ] )
			? $state[ $quiz_key ]
			: array();
		$existing['clusters'] = $capability['clusters'];
		$state[ $quiz_key ]   = $existing;
		wp_interactivity_state( 'prc-quiz/controller', $state );

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
		unset( $block );
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
	 * Wire share buttons (by class marker) to the quiz controller share actions.
	 *
	 * @hook render_block_core/button
	 *
	 * @param string $block_content Rendered block HTML.
	 * @param array  $block         Parsed block array.
	 * @return string Modified HTML.
	 */
	public function modify_share_buttons( $block_content, $block ) {
		$class_name = $block['attrs']['className'] ?? '';
		if ( ! is_string( $class_name ) ) {
			return $block_content;
		}

		$is_share_quiz    = str_contains( $class_name, self::SHARE_QUIZ_BUTTON_CLASS );
		$is_share_results = str_contains( $class_name, self::SHARE_RESULTS_BUTTON_CLASS );
		if ( ! $is_share_quiz && ! $is_share_results ) {
			return $block_content;
		}

		$tag = new WP_HTML_Tag_Processor( $block_content );
		while ( $tag->next_tag() ) {
			if ( ! in_array( $tag->get_tag(), array( 'A', 'BUTTON' ), true ) ) {
				continue;
			}
			$tag->set_attribute(
				'data-wp-on--click',
				$is_share_quiz ? 'actions.onShareQuizClick' : 'actions.onShareResultsClick'
			);
			break;
		}
		return $tag->get_updated_html();
	}

	/**
	 * Build share metadata for a quiz, sourced from prc-schema-seo social metadata when available.
	 *
	 * @param int $post_id The quiz post ID.
	 * @return array{title: string, text: string, url: string}
	 */
	public function get_share_data( $post_id ) {
		$share_data = array(
			'title' => get_the_title( $post_id ),
			'text'  => '',
			'url'   => get_permalink( $post_id ),
		);

		if ( class_exists( '\PRC\Platform\Schema_SEO\Metadata' ) ) {
			$metadata = new \PRC\Platform\Schema_SEO\Metadata( null );
			$seo_data = $metadata->get_seo_data( $post_id );
			$seo_data = $metadata->resolve_for_display( $seo_data, $post_id );

			$share_data['title'] = ! empty( $seo_data['og_title'] ) ? $seo_data['og_title'] : $share_data['title'];
			$share_data['text']  = ! empty( $seo_data['og_description'] ) ? $seo_data['og_description'] : $share_data['text'];
			$share_data['url']   = ! empty( $seo_data['canonical_url'] ) ? $seo_data['canonical_url'] : $share_data['url'];
		}

		return $share_data;
	}

	/**
	 * Render quiz controller block.
	 *
	 * @param array         $attributes The attributes.
	 * @param string        $content    The content.
	 * @param WP_Block|null $block      The block instance.
	 * @return string
	 */
	public function render_block_callback( $attributes, $content, ?WP_Block $block = null ) {
		// Enqueue some additional non-module scripts.
		wp_enqueue_script( 'wp-url' );
		wp_enqueue_script( 'wp-api-fetch' );

		// Get the current post.
		global $post;
		// Get the post id.
		$post_id = $post->ID;

		$capability     = Group_Capability::resolve_from_attributes( $attributes );
		$groups_enabled = ! empty( $attributes['groupsEnabled'] ) && ! empty( $capability['allowed'] );

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
					'quizTitle'              => get_the_title(),
					'quizId'                 => $post_id,
					'quizType'               => $attributes['type'],
					'quizUrl'                => get_permalink( $post_id ),
					'displayType'            => $attributes['displayType'],    
					'configuredDisplayType'  => $attributes['displayType'], // Immutable copy for client logic; onInit may rewrite displayType (e.g. fluid -> scrollable on narrow viewports).
					'pageTransition'         => $attributes['pageTransition'] ?? 'none',
					'parallaxStrength'       => self::clamp_parallax_strength( $attributes['parallaxStrength'] ?? null ),
					'scrollOnPageChange'     => (bool) ( $attributes['scrollOnPageChange'] ?? true ),
					'groupsEnabled'          => $groups_enabled,
					'groupId'                => $group_id,
					'groupDomain'            => $group_domain,
					'archetype'              => $archetype,
					'answerThreshold'        => $attributes['threshold'],
					'liveFeedback'           => ! empty( $attributes['liveFeedback'] ) && 'quiz' === ( $attributes['type'] ?? '' ),
					'outcomeLabels'          => array(
						'correct'   => ! empty( $attributes['correctOutcomeLabel'] ) ? $attributes['correctOutcomeLabel'] : __( 'Correct', 'prc-quiz-builder' ),
						'incorrect' => ! empty( $attributes['incorrectOutcomeLabel'] ) ? $attributes['incorrectOutcomeLabel'] : __( 'Incorrect', 'prc-quiz-builder' ),
						'unsure'    => ! empty( $attributes['unsureOutcomeLabel'] ) ? $attributes['unsureOutcomeLabel'] : __( 'Not sure', 'prc-quiz-builder' ),
					),
					'scoreBuckets'           => Group_Capability::parse_score_buckets( $attributes['scoreBuckets'] ?? '[]' ),
					'histogramPopulation'    => Histogram_Population::resolve_from_controller( $attributes, $block ),
					'isEmbedded'             => $is_embedded,
					'processing'             => false,
					'resultsCountdown'       => null,
					'loaded'                 => false,
					'readyForSubmission'     => false,
					'submitted'              => false,
					'submissionPending'      => false,
					'pendingSubmissionHash'  => '',
					'submissionErrorMessage' => '',
					'displayResults'         => $show_results && $archetype, // If the user is entering through a link and explicitly requesting to view results and has an archetype, we want to display the results. (If there is no archetype then we can not display the results.).
					'displayGroupResults'    => Group_Results::is_group_results_request( $groups_enabled ),
					'selectedAnswers'        => (object) array(), // questionUuid => [answerUuid, ...]. Object so empty JSON is {}, not [].
					'userSubmission'         => array(), // A flat array of user selected answers uuid. Constructed by callback.
					'userScore'              => (object) array(), // Object so empty JSON is {}, not [].
					'allowSubmissions'       => $allow_submissions,
					'isPreview'              => is_preview(),
					'shareText'              => 'I scored %score% on the "%title%" quiz',
					'shareData'              => $this->get_share_data( $post_id ), // Social share metadata sourced from prc-schema-seo.
					'soundSettings'          => self::normalize_sound_settings( $attributes['soundSettings'] ?? array() ),
					'soundSpriteUrl'         => plugins_url( self::SOUND_SPRITE_PATH, PRC_QUIZ_FILE ),
				)
			)
		);

		// This is triggered when the block is initialized into the DOM.
		$tag->set_attribute( 'data-wp-init', 'callbacks.onInit' );
		if ( 'fluid' === $attributes['displayType'] ) {
			$tag->set_attribute( 'data-wp-on-async-window--resize', 'callbacks.onFluidViewportChange' );
		}
		$tag->set_attribute( 'data-wp-class--is-horizontal-parallax', 'state.isHorizontalParallax' );
		// Apply a class to the block if it is processing. Mainly used to show/hide the loading spinner.
		$tag->set_attribute( 'data-wp-class--is-processing', 'context.processing' );
		$tag->set_attribute( 'data-wp-class--is-results-countdown', 'context.resultsCountdown' );
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
		$submission_error = '<div class="wp-block-prc-quiz-controller-submission-error" role="alert" data-wp-bind--hidden="!context.submissionErrorMessage"><p data-wp-text="context.submissionErrorMessage"></p><button type="button" class="ui button wp-element-button" data-wp-on--click="actions.onRetryPendingSubmissionClick">Try saving again</button></div>';
		$loading          = '<div class="wp-block-prc-quiz-controller-processing"><div class="wp-block-prc-quiz-controller-processing_spinner"><span>Loading...</span></div></div>';
		$countdown        = '<div class="wp-block-prc-quiz-controller-results-countdown" hidden data-wp-bind--hidden="!context.resultsCountdown" role="status" aria-live="polite"><span class="wp-block-prc-quiz-controller-results-countdown__count" data-wp-text="context.resultsCountdown"></span><p class="wp-block-prc-quiz-controller-results-countdown__message">' . esc_html__( 'Finding your best fit', 'prc-quiz-builder' ) . '</p></div>';
		// Add the loading spinner to inside the very last </div> tag.
		$content = preg_replace( '/<\/div>$/', $submission_error . $loading . $countdown . '</div>', $content );

		$this->seed_demo_break_labels( $post_id, $attributes );

		return $content;
	}

	/**
	 * Normalize saved sound settings for the frontend context.
	 *
	 * Keep the keys in sync with DEFAULT_SOUND_SETTINGS in src/controller/sound-effects.js.
	 *
	 * @param mixed $settings Raw soundSettings attribute.
	 * @return array
	 */
	public static function normalize_sound_settings( $settings ) {
		$keys       = array(
			'start',
			'nextPage',
			'submit',
			'reset',
			'hoverResponse',
			'clickResponse',
			'correctResponse',
			'incorrectResponse',
			'notSureResponse',
			'countdown',
		);
		$normalized = array(
			'volume' => 100,
		);
		foreach ( $keys as $key ) {
			$normalized[ $key ] = false;
		}
		if ( ! is_array( $settings ) ) {
			return $normalized;
		}
		foreach ( $keys as $key ) {
			if ( array_key_exists( $key, $settings ) ) {
				$normalized[ $key ] = (bool) $settings[ $key ];
			}
		}
		if ( array_key_exists( 'volume', $settings ) ) {
			$normalized['volume'] = self::clamp_sound_volume( $settings['volume'] );
		}
		return $normalized;
	}

	/**
	 * Clamp the global sound volume to 0-100.
	 *
	 * @param mixed $value Raw volume.
	 * @return int
	 */
	public static function clamp_sound_volume( $value ) {
		if ( ! is_numeric( $value ) ) {
			return 100;
		}
		return (int) max( 0, min( 100, (int) round( (float) $value ) ) );
	}

	/**
	 * Clamp the parallax strength attribute to its supported range.
	 *
	 * Keep in sync with PARALLAX_STRENGTH_* in src/controller/page-transition.js.
	 *
	 * @param mixed $value Raw attribute value.
	 * @return float
	 */
	public static function clamp_parallax_strength( $value ) {
		if ( ! is_numeric( $value ) ) {
			return 0.5;
		}
		return max( 0.1, min( 0.9, (float) $value ) );
	}

	/**
	 * Store demographic column labels on quiz interactivity state.
	 *
	 * @param int   $post_id    Quiz post ID.
	 * @param array $attributes Block attributes.
	 * @return void
	 */
	private function seed_demo_break_labels( $post_id, $attributes ) {
		$demo_break_labels = array();
		if ( ! empty( $attributes['demoBreakLabels'] ) ) {
			$parsed = json_decode( $attributes['demoBreakLabels'], true );
			if ( is_array( $parsed ) ) {
				$demo_break_labels = $parsed;
			}
		}

		$state                       = wp_interactivity_state( 'prc-quiz/controller', array() );
		$quiz_key                    = 'quiz_' . $post_id;
		$existing                    = isset( $state[ $quiz_key ] ) && is_array( $state[ $quiz_key ] )
			? $state[ $quiz_key ]
			: array();
		$existing['demoBreakLabels'] = $demo_break_labels;
		$state[ $quiz_key ]          = $existing;
		wp_interactivity_state( 'prc-quiz/controller', $state );
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
