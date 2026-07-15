<?php
/**
 * Quiz ability category registration.
 *
 * @package PRC\Platform\Quiz
 */

declare(strict_types=1);

namespace PRC\Platform\Quiz;

/**
 * Registers the Quiz ability category for PRC quiz MCP tools.
 */
class Ability_Categories {

	/**
	 * Ability category slug used by prc-quiz-builder/* abilities.
	 */
	public const CATEGORY = 'quiz';

	/**
	 * Constructor.
	 *
	 * @param object $loader Plugin loader.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'wp_abilities_api_categories_init', $this, 'register_categories' );
	}

	/**
	 * Register the Quiz ability category.
	 *
	 * @hook wp_abilities_api_categories_init
	 */
	public function register_categories(): void {
		if ( ! function_exists( 'wp_register_ability_category' ) ) {
			return;
		}

		if ( function_exists( 'wp_has_ability_category' ) && wp_has_ability_category( self::CATEGORY ) ) {
			return;
		}

		wp_register_ability_category(
			self::CATEGORY,
			array(
				'label'       => __( 'Quiz', 'prc-quiz' ),
				'description' => __( 'Abilities for quiz submission and community group analytics.', 'prc-quiz' ),
			)
		);
	}
}
