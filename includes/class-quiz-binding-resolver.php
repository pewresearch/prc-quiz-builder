<?php
/**
 * Shared quiz binding resolution for consolidated and legacy sources.
 *
 * @package PRC\Platform\Quiz
 */

declare(strict_types=1);

namespace PRC\Platform\Quiz;

use WP_Block;

/**
 * Quiz binding field resolver.
 */
class Quiz_Binding_Resolver {

	/**
	 * Canonical binding source name.
	 */
	public const SOURCE_NAME = 'prc-quiz/builder';

	/**
	 * Legacy source name to consolidated field map.
	 */
	private const LEGACY_SOURCE_FIELDS = array(
		'prc-quiz/question'                        => 'question-text',
		'prc-quiz/answer'                          => 'answer-text',
		'prc-quiz/page-title'                      => 'page-title-text',
		'prc-quiz/community-group-name'            => 'community-group-name',
		'prc-quiz/community-group-response-count'  => 'community-group-response-count',
		'prc-quiz/community-group-results-url'     => 'community-group-results-url',
		'prc-quiz/share-quiz-url'                  => 'share-quiz-url',
	);

	/**
	 * Context keys required by each consolidated field.
	 *
	 * @return array<string, string[]>
	 */
	public static function get_field_context_keys(): array {
		return array(
			'question-text'                     => array( 'prc-quiz/question/text', 'prc-quiz/question/uuid' ),
			'answer-text'                       => array( 'prc-quiz/answer/text', 'prc-quiz/answer/uuid' ),
			'page-title-text'                   => array( 'prc-quiz/page/title', 'prc-quiz/page/uuid' ),
			'community-group-name'              => array( 'prc-quiz/group/name' ),
			'community-group-response-count'    => array( 'prc-quiz/group/response-count' ),
			'community-group-results-url'       => array( 'prc-quiz/group/results-url' ),
			'share-quiz-url'                    => array( 'prc-quiz/id' ),
		);
	}

	/**
	 * Panel field manifest for the consolidated quiz builder source.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	public static function get_binding_fields(): array {
		return array(
			array(
				'label' => __( 'Question Text', 'prc-quiz' ),
				'type'  => 'string',
				'args'  => array( 'field' => 'question-text' ),
			),
			array(
				'label' => __( 'Answer Text', 'prc-quiz' ),
				'type'  => 'string',
				'args'  => array( 'field' => 'answer-text' ),
			),
			array(
				'label' => __( 'Page Title Text', 'prc-quiz' ),
				'type'  => 'string',
				'args'  => array( 'field' => 'page-title-text' ),
			),
			array(
				'label' => __( 'Community Group Name', 'prc-quiz' ),
				'type'  => 'string',
				'args'  => array( 'field' => 'community-group-name' ),
			),
			array(
				'label' => __( 'Community Group Response Count', 'prc-quiz' ),
				'type'  => 'string',
				'args'  => array( 'field' => 'community-group-response-count' ),
			),
			array(
				'label' => __( 'Community Group Results URL', 'prc-quiz' ),
				'type'  => 'string',
				'args'  => array( 'field' => 'community-group-results-url' ),
			),
			array(
				'label' => __( 'Quiz Share URL', 'prc-quiz' ),
				'type'  => 'string',
				'args'  => array( 'field' => 'share-quiz-url' ),
			),
		);
	}

	/**
	 * Resolve a bound value for consolidated or legacy quiz sources.
	 *
	 * @param array       $source_args    Source arguments from block metadata.
	 * @param WP_Block    $block_instance Block instance.
	 * @param string      $attribute_name Bound attribute name.
	 * @param string|null $legacy_source  Legacy source name when invoked via alias.
	 * @return string
	 */
	public static function resolve( array $source_args, WP_Block $block_instance, string $attribute_name, ?string $legacy_source = null ): string {
		unset( $attribute_name );

		$field = $source_args['field'] ?? null;
		if ( ! is_string( $field ) || '' === $field ) {
			$field = self::legacy_field_for_source( $legacy_source ?? '' );
		}

		if ( ! is_string( $field ) || '' === $field ) {
			return '';
		}

		return self::resolve_field( $field, $block_instance );
	}

	/**
	 * Resolve a field value from block context.
	 *
	 * @param string   $field          Consolidated field key.
	 * @param WP_Block $block_instance Block instance.
	 * @return string
	 */
	private static function resolve_field( string $field, WP_Block $block_instance ): string {
		$context = $block_instance->context;

		return match ( $field ) {
			'question-text' => (string) ( $context['prc-quiz/question/text'] ?? '' ),
			'answer-text' => (string) ( $context['prc-quiz/answer/text'] ?? '' ),
			'page-title-text' => (string) ( $context['prc-quiz/page/title'] ?? '' ),
			'community-group-name' => (string) ( $context['prc-quiz/group/name'] ?? '' ),
			'community-group-response-count' => Group_Results::format_response_count( $context['prc-quiz/group/response-count'] ?? 0 ),
			'community-group-results-url' => (string) ( $context['prc-quiz/group/results-url'] ?? '' ),
			'share-quiz-url' => self::resolve_share_quiz_url( $context ),
			default => '',
		};
	}

	/**
	 * Resolve the quiz share URL from context.
	 *
	 * @param array<string, mixed> $context Block context.
	 * @return string
	 */
	private static function resolve_share_quiz_url( array $context ): string {
		$quiz_id = $context['prc-quiz/id'] ?? get_the_ID();
		return $quiz_id ? (string) get_permalink( $quiz_id ) : '';
	}

	/**
	 * Map a legacy source name to a consolidated field key.
	 *
	 * @param string $source_name Legacy source name.
	 * @return string|null
	 */
	public static function legacy_field_for_source( string $source_name ): ?string {
		return self::LEGACY_SOURCE_FIELDS[ $source_name ] ?? null;
	}

	/**
	 * Legacy source names retained for render compatibility.
	 *
	 * @return string[]
	 */
	public static function get_legacy_source_names(): array {
		return array_keys( self::LEGACY_SOURCE_FIELDS );
	}

	/**
	 * Legacy label for render-only alias sources.
	 *
	 * @param string $source_name Legacy source name.
	 * @return string
	 */
	public static function get_legacy_label( string $source_name ): string {
		return match ( $source_name ) {
			'prc-quiz/question' => __( 'Quiz Question', 'prc-quiz' ),
			'prc-quiz/answer' => __( 'Quiz Answer', 'prc-quiz' ),
			'prc-quiz/page-title' => __( 'Quiz Page', 'prc-quiz' ),
			'prc-quiz/community-group-name' => __( 'Community Group Name', 'prc-quiz' ),
			'prc-quiz/community-group-response-count' => __( 'Community Group Response Count', 'prc-quiz' ),
			'prc-quiz/community-group-results-url' => __( 'Community Group Results URL', 'prc-quiz' ),
			'prc-quiz/share-quiz-url' => __( 'Quiz Share URL', 'prc-quiz' ),
			default => $source_name,
		};
	}
}
