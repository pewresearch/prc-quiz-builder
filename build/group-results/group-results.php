<?php
/**
 * Group results class.
 *
 * @package PRC\Platform\Quiz
 */

namespace PRC\Platform\Quiz;

/**
 * Group results class.
 *
 * @package PRC\Platform\Quiz
 */
class Group_Results {
	/**
	 * Cache duration.
	 *
	 * @var int
	 */
	private $cache_duration = 10;

	/**
	 * Constructor.
	 *
	 * @param object $loader The loader.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'block_init' );
	}

	/**
	 * Get the group data from the groups api.
	 *
	 * @param int $group_id The group ID.
	 * @param int $quiz_id The quiz ID.
	 * @return array The group data.
	 */
	public function get_group_data( $group_id, $quiz_id ) {
		$groups = new Groups(
			array(
				'group_id' => $group_id,
				'quiz_id'  => $quiz_id,
			)
		);
		return $groups->get_group( true );
	}

	/**
	 * No group found markup.
	 *
	 * @return string
	 */
	public function no_group_found() {
		// Redirect to the url without the results/?group= query string.
		$redirect_url = remove_query_arg( 'group' );
		$redirect_url = str_replace( '/results/', '/', $redirect_url );
		ob_start();
		?>
		<div class="prc-quiz__no-group-found">
			<h2>Sorry, we could not retrieve those group results.</h2>
			<p>Please check your group ID, or contact your group administrator.</p>
		</div>
		<?php
		return ob_get_clean();
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
		$groups_enabled = $block->context['prc-quiz/groupsEnabled'] ?? false;
		if ( ! $groups_enabled ) {
			return;
		}
		$quiz_id      = get_the_ID();
		$group_id     = get_query_var( 'quizGroup', false );
		$group_domain = get_query_var( 'quizGroupDomain' );

		// If the quiz ID is not found, we can not display the group results.
		if ( ! $quiz_id ) {
			return;
		}
		
		// Set up group data.
		$group = false;
		// If the group ID is not found, we can not display the group results.
		if ( false !== $group_id ) {
			$cached_data = wp_cache_get( $group_id, 'prc_quiz_group_data' );
			if ( false === $cached_data ) {
				$group  = $this->get_group_data( $group_id, $quiz_id );
				$expiry = $this->cache_duration * MINUTE_IN_SECONDS;
				wp_cache_set( $group_id, $group, 'prc_quiz_group_data', $expiry );
			} else {
				$group = $cached_data;
			}
		}

		$block_wrapper_attrs = get_block_wrapper_attributes(
			array(
				'data-wp-interactive'          => 'prc-quiz/controller',
				'data-wp-context'              => wp_json_encode(
					array(
						'groupData' => $group,
					)
				),
				'data-wp-init--on-groups-init' => 'callbacks.onGroupsInit',
				'data-wp-bind--hidden'         => '!state.displayGroupResults',
			)
		);

		if ( false === $group ) {
			$content = $this->no_group_found();
		} else {
			$message = "<div class='prc-quiz__group-results-info'><p><strong>Group results update every %s minutes.</strong> If you don't see recent results, please wait and refresh the page.</p></div>";
	
			$content = wp_sprintf( $message, $this->cache_duration ) . $content;
		}

		return wp_sprintf(
			'<div %1$s>%2$s</div>',
			$block_wrapper_attrs,
			$content
		);
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
			PRC_QUIZ_DIR . '/build/group-results',
			array(
				'render_callback' => array( $this, 'render_block_callback' ),
			)
		);
	}
}
