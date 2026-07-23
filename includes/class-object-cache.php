<?php
/**
 * Centralized object-cache group names and TTLs for quiz builder.
 *
 * Domains stay separate on purpose: submissions, throttle, group data,
 * archetypes, and analytics must not share a group or payload.
 *
 * @package PRC\Platform\Quiz
 */

namespace PRC\Platform\Quiz;

/**
 * Object cache constants and shared group-data read-through helper.
 */
class Object_Cache {
	/**
	 * Cache group for community group Firebase payloads (SSR / bindings).
	 */
	public const GROUP_DATA_GROUP = 'prc_quiz_group_data';

	/**
	 * TTL for community group data (seconds).
	 */
	public const GROUP_DATA_TTL = 600;

	/**
	 * Human-readable group-data TTL in minutes (UI copy).
	 */
	public const GROUP_DATA_TTL_MINUTES = 10;

	/**
	 * TTL for typed "missing group" sentinel (seconds).
	 *
	 * Short on purpose so a not-yet-created group can appear after create
	 * without waiting the full positive TTL.
	 */
	public const GROUP_DATA_MISSING_TTL = 30;

	/**
	 * Namespaced key for typed cache sentinels (avoids Firebase field collisions).
	 */
	public const GROUP_DATA_SENTINEL_KEY = '__prc_quiz_cache';

	/**
	 * Sentinel value for a confirmed Firebase miss.
	 */
	public const GROUP_DATA_SENTINEL_MISSING = 'missing';

	/**
	 * Cache group for per-hash archetype payloads.
	 */
	public const ARCHETYPES_GROUP = 'prc_quiz_builder_archetypes';

	/**
	 * TTL for archetype payloads (seconds).
	 */
	public const ARCHETYPES_TTL = DAY_IN_SECONDS;

	/**
	 * Cache group for submission idempotency markers and processing locks.
	 */
	public const SUBMISSIONS_GROUP = 'prc_quiz_submissions';

	/**
	 * Cache group for per-IP submit throttling.
	 */
	public const THROTTLE_GROUP = 'prc_quiz_throttle';

	/**
	 * Max non-idempotent submissions per quiz per IP per throttle window.
	 */
	public const THROTTLE_LIMIT = 100;

	/**
	 * Throttle window length (seconds).
	 */
	public const THROTTLE_WINDOW = MINUTE_IN_SECONDS;

	/**
	 * Cache group for editor group-analytics payloads.
	 */
	public const GROUP_ANALYTICS_GROUP = 'prc_quiz_group_analytics';

	/**
	 * TTL for editor group-analytics payloads (seconds).
	 */
	public const GROUP_ANALYTICS_TTL = 300;

	/**
	 * Whether a cached value is the typed missing-group sentinel.
	 *
	 * @param mixed $value Cached value.
	 * @return bool
	 */
	public static function is_missing_sentinel( $value ): bool {
		return is_array( $value )
			&& ( $value[ self::GROUP_DATA_SENTINEL_KEY ] ?? null ) === self::GROUP_DATA_SENTINEL_MISSING;
	}

	/**
	 * Build the typed missing-group sentinel payload.
	 *
	 * @return array<string, string>
	 */
	public static function missing_sentinel(): array {
		return array(
			self::GROUP_DATA_SENTINEL_KEY => self::GROUP_DATA_SENTINEL_MISSING,
		);
	}

	/**
	 * Read-through cache for community group data.
	 *
	 * Positive arrays are cached for GROUP_DATA_TTL. Firebase misses (`false`)
	 * are cached as a typed sentinel for GROUP_DATA_MISSING_TTL and returned as
	 * false to callers. WP_Error and other non-array results are never cached.
	 *
	 * @param string   $group_id Group id (cache key).
	 * @param callable $fetcher  Zero-arg callable that returns array|false|\WP_Error.
	 * @return array|false|\WP_Error
	 */
	public static function get_group_data( string $group_id, callable $fetcher ) {
		$cached = wp_cache_get( $group_id, self::GROUP_DATA_GROUP );
		if ( self::is_missing_sentinel( $cached ) ) {
			return false;
		}
		if ( is_array( $cached ) ) {
			return $cached;
		}

		$group = $fetcher();
		if ( is_array( $group ) ) {
			wp_cache_set( $group_id, $group, self::GROUP_DATA_GROUP, self::GROUP_DATA_TTL );
			return $group;
		}

		if ( false === $group ) {
			wp_cache_set(
				$group_id,
				self::missing_sentinel(),
				self::GROUP_DATA_GROUP,
				self::GROUP_DATA_MISSING_TTL
			);
			return false;
		}

		return $group;
	}

	/**
	 * Invalidate cached community group data after a write.
	 *
	 * @param string $group_id Group id.
	 */
	public static function invalidate_group_data( string $group_id ): void {
		wp_cache_delete( $group_id, self::GROUP_DATA_GROUP );
	}
}
