<?php
/**
 * Group results class.
 *
 * @package PRC\Platform\Quiz
 */

namespace PRC\Platform\Quiz;

use WP_HTML_Tag_Processor;

/**
 * Group results class.
 *
 * @package PRC\Platform\Quiz
 */
class Group_Results {
	/**
	 * CSS class marker for the community group results button variation.
	 *
	 * @var string
	 */
	public const GROUP_RESULTS_BUTTON_CLASS = 'prc-quiz-community-group-results-link';

	/**
	 * Constructor.
	 *
	 * @param object $loader The loader.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'block_init' );
		$loader->add_filter( 'render_block_core/button', $this, 'inject_group_results_button_visibility', 20, 2 );
	}

	/**
	 * Format the community group response count for bound paragraph content.
	 *
	 * @param int $count Response count.
	 * @return string
	 */
	public static function format_response_count( $count ) {
		return sprintf( '**%d** responses', (int) $count );
	}

	/**
	 * Hide community group results buttons when no group is present.
	 *
	 * @hook render_block_core/button
	 *
	 * @param string $html  Rendered block HTML.
	 * @param array  $block Parsed block array.
	 * @return string Modified HTML.
	 */
	public function inject_group_results_button_visibility( string $html, array $block ): string {
		$class_name = $block['attrs']['className'] ?? '';
		if ( ! is_string( $class_name ) || ! str_contains( $class_name, self::GROUP_RESULTS_BUTTON_CLASS ) ) {
			return $html;
		}

		$tag = new WP_HTML_Tag_Processor( $html );
		if ( ! $tag->next_tag( 'a' ) ) {
			return $html;
		}

		$tag->set_attribute( 'data-wp-interactive', 'prc-quiz/controller' );
		$tag->set_attribute( 'data-wp-bind--hidden', '!state.hasGroup' );

		if ( false === get_query_var( 'quizGroup', false ) ) {
			$tag->set_attribute( 'hidden', 'true' );
		}

		return $tag->get_updated_html();
	}

	/**
	 * Build block context values for community group bindings.
	 *
	 * @param int          $quiz_id  Quiz post ID.
	 * @param string|false $group_id Group ID from the quizGroup query var.
	 * @return array<string, mixed>
	 */
	public static function get_group_bindings_context( $quiz_id, $group_id ) {
		if ( ! $quiz_id || false === $group_id ) {
			return array();
		}

		$group = self::get_cached_group_data( $group_id, $quiz_id );
		if ( false === $group || is_wp_error( $group ) || ! is_array( $group ) ) {
			return array();
		}

		$results_url = $group['results_url'] ?? '';
		if ( empty( $results_url ) ) {
			$groups = new Groups(
				array(
					'group_id' => $group_id,
					'quiz_id'  => $quiz_id,
				)
			);
			$results_url = $groups->generate_results_url();
		}

		return array(
			'prc-quiz/group/name'            => $group['name'] ?? '',
			'prc-quiz/group/response-count' => isset( $group['total'] ) ? (int) $group['total'] : 0,
			'prc-quiz/group/results-url'      => $results_url,
		);
	}

	/**
	 * Get community group data via the shared object-cache read-through.
	 *
	 * Bindings and group-results rendering share this path so a group-results
	 * page performs at most one Firebase group read per cold cache.
	 *
	 * @param string $group_id The group ID.
	 * @param int    $quiz_id  The quiz ID.
	 * @return array|false|\WP_Error
	 */
	public static function get_cached_group_data( $group_id, $quiz_id ) {
		return Object_Cache::get_group_data(
			(string) $group_id,
			static function () use ( $group_id, $quiz_id ) {
				$groups = new Groups(
					array(
						'group_id' => $group_id,
						'quiz_id'  => $quiz_id,
					)
				);
				return $groups->get_group( true );
			}
		);
	}

	/**
	 * Get the group data from the groups api.
	 *
	 * @param int $group_id The group ID.
	 * @param int $quiz_id The quiz ID.
	 * @return array|false|\WP_Error The group data.
	 */
	public function get_group_data( $group_id, $quiz_id ) {
		return self::get_cached_group_data( $group_id, $quiz_id );
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

		// Set up group data (shared cache with bindings context).
		$group = false;
		if ( false !== $group_id ) {
			$group = self::get_cached_group_data( $group_id, $quiz_id );
			if ( is_wp_error( $group ) || ! is_array( $group ) ) {
				$group = false;
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

			$content = wp_sprintf( $message, Object_Cache::GROUP_DATA_TTL_MINUTES ) . $content;
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
