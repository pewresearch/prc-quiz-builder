<?php
/**
 * Quiz analytics ability for the WP Abilities API / MCP.
 *
 * @package PRC\Platform\Quiz
 */

declare(strict_types=1);

namespace PRC\Platform\Quiz;

use WP_Error;

/**
 * Registers the prc-quiz-builder/get-analytics ability.
 */
class Ability {

	/**
	 * Plugin file used to validate activation on the target site.
	 *
	 * @var string
	 */
	private const PLUGIN_FILE = 'prc-quiz-builder/prc-quiz-builder.php';

	/**
	 * Ability name.
	 *
	 * @var string
	 */
	public static $ability_name = 'prc-quiz-builder/get-analytics';

	/**
	 * Constructor.
	 *
	 * @param object $loader Loader instance for hook registration.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'wp_abilities_api_init', $this, 'register_ability' );
	}

	/**
	 * Register the quiz analytics ability.
	 *
	 * @hook wp_abilities_api_init
	 */
	public function register_ability(): void {
		if ( ! function_exists( 'wp_register_ability' ) ) {
			return;
		}

		wp_register_ability(
			self::$ability_name,
			array(
				'label'               => __( 'Get quiz analytics', 'prc-quiz' ),
				'description'         => __( 'Returns submission analytics and community group analytics for a quiz post ID.', 'prc-quiz' ),
				'category'            => Ability_Categories::CATEGORY,
				'input_schema'        => array(
					'type'                 => 'object',
					'required'             => array( 'post_id' ),
					'additionalProperties' => false,
					'properties'           => array(
						'post_id' => array(
							'type'        => 'integer',
							'description' => 'Quiz post ID.',
							'minimum'     => 1,
						),
						'site_id' => \PRC\Platform\AI\Utils\site_id_input_schema_property(),
					),
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'post_id'     => array(
							'type'        => 'integer',
							'description' => 'Quiz post ID.',
						),
						'title'       => array(
							'type'        => 'string',
							'description' => 'Quiz title.',
						),
						'submissions' => array(
							'type'        => 'object',
							'description' => 'Submission report from _report meta (total, first_24_hours, first_week, yearly monthly counts).',
						),
						'groups'      => array(
							'type'        => 'object',
							'description' => 'Community group analytics, or an error object if Firebase is unavailable.',
						),
					),
				),
				'execute_callback'    => array( $this, 'execute' ),
				'permission_callback' => array( $this, 'can_get_analytics' ),
				'meta'                => array(
					'annotations'  => array(
						'instructions' => 'Pass a quiz post_id to retrieve submission counts (_report) and community group analytics. Optionally pass site_id to run against a specific multisite blog; defaults to the content site (20). If this plugin is inactive on the target site, the ability returns plugin_inactive_on_site. Use vip/content-search with subtype=quiz to find quiz IDs first. Requires edit access to the quiz. If Firebase is down, submissions still return and groups includes an error field.',
						'readonly'     => true,
						'destructive'  => false,
						'idempotent'   => true,
					),
					'show_in_rest' => true,
					'mcp'          => array(
						'public' => true,
						'type'   => 'tool',
					),
				),
			)
		);
	}

	/**
	 * Permission check for the ability.
	 *
	 * @param array|null $input Ability input.
	 * @return bool|WP_Error
	 */
	public function can_get_analytics( $input = null ) {
		return $this->with_site(
			$input,
			function () use ( $input ) {
				if ( ! is_array( $input ) || empty( $input['post_id'] ) ) {
					return current_user_can( 'edit_posts' );
				}

				$post_id = absint( $input['post_id'] );
				return $post_id > 0 && current_user_can( 'edit_post', $post_id );
			}
		);
	}

	/**
	 * Execute callback for prc-quiz-builder/get-analytics.
	 *
	 * @param array $input Ability input.
	 * @return array|WP_Error
	 */
	public function execute( $input ) {
		return $this->with_site(
			$input,
			function () use ( $input ) {
				$post_id = isset( $input['post_id'] ) ? absint( $input['post_id'] ) : 0;
				if ( $post_id < 1 ) {
					return new WP_Error(
						'missing_post_id',
						__( 'post_id is required.', 'prc-quiz' ),
						array( 'status' => 400 )
					);
				}

				$post = get_post( $post_id );
				if ( ! $post || 'quiz' !== $post->post_type ) {
					return new WP_Error(
						'invalid_quiz',
						__( 'Post not found or is not a quiz.', 'prc-quiz' ),
						array( 'status' => 404 )
					);
				}

				if ( ! current_user_can( 'edit_post', $post_id ) ) {
					return new WP_Error(
						'rest_forbidden',
						__( 'You are not allowed to view analytics for this quiz.', 'prc-quiz' ),
						array( 'status' => 403 )
					);
				}

				$submissions = Analytics::get_report_data( $post_id );
				$groups      = Analytics::get_group_analytics( $post_id );

				if ( is_wp_error( $groups ) ) {
					$groups = array(
						'error'             => $groups->get_error_message(),
						'code'              => $groups->get_error_code(),
						'total_groups'      => 0,
						'total_submissions' => 0,
						'groups'            => array(),
					);
				}

				return array(
					'post_id'     => $post_id,
					'title'       => get_the_title( $post ),
					'submissions' => $submissions,
					'groups'      => $groups,
				);
			}
		);
	}

	/**
	 * Run a callback on the requested target site.
	 *
	 * @param array|null $input    Ability input.
	 * @param callable   $callback Callback to run after site validation/switching.
	 * @return mixed
	 */
	private function with_site( $input, callable $callback ) {
		return \PRC\Platform\AI\Utils\with_site(
			\PRC\Platform\AI\Utils\resolve_site_id( is_array( $input ) ? $input : null ),
			self::PLUGIN_FILE,
			$callback
		);
	}
}
