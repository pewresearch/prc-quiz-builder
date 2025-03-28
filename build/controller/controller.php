<?php
/**
 * Controller class.
 *
 * @package PRC\Platform\Quiz
 */

namespace PRC\Platform\Quiz;

use WP_Block_Parser_Block, WP_Error;

/**
 * Controller class.
 *
 * @package PRC\Platform\Quiz
 */
class Controller {
	/**
	 * View script handle.
	 *
	 * @var string
	 */
	public static $view_script_handle = 'prc-quiz-controller-view-script';

	/**
	 * Constructor.
	 *
	 * @param object $loader The loader.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'block_init' );
	}

	/**
	 * No archetype found markup.
	 *
	 * @return string
	 */
	public function no_archetype_found() {
		// redirect to the url without the results/?archetype= query string.
		$redirect_url = remove_query_arg( 'archetype' );
		$redirect_url = str_replace( '/results/', '/', $redirect_url );
		ob_start();
		?>
		<div class="prc-quiz__no-archetype-found" style="padding-top: 1em; text-align: center;">
			<h2>Sorry, we could not retrieve those results.</h2>
			<p>Try taking the quiz again.</p>
			<a href="<?php echo esc_url( $redirect_url ); ?>" class="prc-quiz__no-archetype-found__button ui button">Take the quiz</a>
		</div>
		<?php
		return ob_get_clean();
	}

	/**
	 * No group found markup.
	 *
	 * @return string
	 */
	public function no_group_found() {
		// redirect to the url without the results/?group= query string
		$redirect_url = remove_query_arg( 'group' );
		$redirect_url = str_replace( '/results/', '/', $redirect_url );
		ob_start();
		?>
		<div class="prc-quiz__no-group-found" style="padding-top: 1em; text-align: center;">
			<h2>Sorry, we could not retrieve those results.</h2>
			<p>Please check your group ID or contact your group administrator to upgrade the group in the admin panel.</p>
		</div>
		<?php
		return ob_get_clean();
	}

	/**
	 * Renders the first page (the introduction page), in a placeholder format.
	 *
	 * @param object $block The block.
	 * @return string|false
	 */
	public function render_placeholder( $block ) {
		if ( is_admin() ) {
			return;
		}
		$inner_blocks = $block->parsed_block['innerBlocks'];
		$pages        = array_filter(
			$inner_blocks,
			function ( $a ) {
				return 'prc-quiz/pages' === $a['blockName'];
			}
		);
		$pages        = array_shift( $pages );
		if ( empty( $pages ) ) {
			return false;
		}
		$first_page = array_shift( $pages['innerBlocks'] );
		ob_start();
		?>
		<div class="wp-block-prc-quiz-controller--react-placeholder ui basic segment">
			<div class="ui active inverted dimmer">
				<div class="ui text loader">Loading Quiz...</div>
			</div>
			<?php echo render_block( $first_page ); ?>
		</div>
		<?php
		return ob_get_clean();
	}

	/**
	 * Parse the controller block.
	 *
	 * @param object $post_object The post object.
	 * @return array
	 */
	public function parse_controller_block( $post_object ) {
		$blocks = parse_blocks( $post_object->post_content );
		$blocks = array_filter(
			$blocks,
			function ( $a ) {
				return 'prc-quiz/controller' === $a['blockName'];
			}
		);
		return array_pop( $blocks );
	}

	/**
	 * Is valid hash.
	 *
	 * @param string $md5 The md5.
	 * @return bool
	 */
	public function is_valid_hash( $md5 = false ) {
		if ( false !== $md5 ) {
			return preg_match( '/^[a-f0-9]{32}$/', $md5 );
		}
		return false;
	}

	/**
	 * Render group results.
	 *
	 * @param string $group_id The group id.
	 * @param string $post_id The post id.
	 * @return string|WP_Error
	 */ 
	public function render_group_results( $group_id = false, $post_id = false ) {
		if ( ! $post_id ) {
			return new WP_Error( 'quiz_not_found', 'Quiz not found', array( 'status' => 404 ) );
		}

		if ( false === $group_id || ! is_string( $group_id ) || empty( $group_id ) || false === $this->is_valid_hash( $group_id ) ) {
			return new WP_Error( 'missing_group_id', __( 'Missing group ID', 'prc-quiz' ), array( 'status' => 403 ) );
		}

		wp_dequeue_script( self::$view_script_handle );

		$cache_key = md5(
			wp_json_encode(
				array(
					'group_id' => $group_id,
					'post_id'  => $post_id,
				)
			)
		);
		$cached    = wp_cache_get( $cache_key );
		if ( $cached && ! is_preview() && ! is_user_logged_in() ) {
			// return $cached;
		}

		$groups = new Groups(
			array(
				'quiz_id'  => $post_id,
				'group_id' => $group_id,
			)
		);
		$group  = $groups->get_group();

		// if result total is less than 1 then we don't have any results to show
		
		if ( false === $group || $group['total'] < 1 ) {
			return new WP_Error(
				'not_enough_results',
				'Not enough results',
				array(
					'status'   => 404,
					'group_id' => $group_id,
					'quiz_id'  => $post_id,
				)
			);
		}

		$quiz = get_post( $post_id );
		if ( ! $quiz ) {
			return new WP_Error( 'quiz_not_found', 'Quiz not found', array( 'status' => 404 ) );
		}

		$controller_block = $this->parse_controller_block( $quiz );

		$group_results_block = array_filter(
			$controller_block['innerBlocks'],
			function ( $a ) {
				return 'prc-quiz/group-results' === $a['blockName'];
			}
		);

		if ( empty( $group_results_block ) ) {
			return new WP_Error(
				'group_results_block_not_found',
				'Group results block not found',
				array(
					'status'   => 404,
					'group_id' => $group_id,
					'quiz_id'  => $post_id,
				)
			);
		}
		
		$group_results_block = array_values( $group_results_block );
		$group_results_block = array_pop( $group_results_block );

		$group_results_block['attrs']['typologyGroups'] = wp_json_encode( $group['typology_groups'] );
		$group_results_block['attrs']['answers']        = wp_json_encode( $group['answers'] );
		$group_results_block['attrs']['total']          = $group['total'];
		$group_results_block['attrs']['name']           = $group['name'];

		$parsed = new WP_Block_Parser_Block(
			$group_results_block['blockName'],
			$group_results_block['attrs'],
			$group_results_block['innerBlocks'],
			$group_results_block['innerHTML'],
			$group_results_block['innerContent']
		);

		$rendered = render_block( (array) $parsed );
		if ( ! is_preview() ) {
			// wp_cache_set( $cache_key, $rendered, '', 15 * MINUTE_IN_SECONDS );
		}
		return $rendered;
	}

	/**
	 * Render results.
	 *
	 * @param string $archetype The archetype.
	 * @param string $post_id The post id.
	 * @return string|WP_Error
	 */
	public function render_results( $archetype = false, $post_id = false ) {
		if ( ! $post_id ) {
			return new \WP_Error( 'quiz_not_found', 'Quiz not found', array( 'status' => 404 ) );
		}
		if ( false === $archetype || ! is_string( $archetype ) || empty( $archetype ) || ! $this->is_valid_hash( $archetype ) ) {
			return new \WP_Error( 'missing_archetype', __( 'Missing archetype', 'prc-quiz' ), array( 'status' => 403 ) );
		}

		$nonce = wp_create_nonce( 'prc_quiz_nonce--' . $post_id );
		wp_add_inline_script(
			self::$view_script_handle,
			'window.prcQuizController =' . wp_json_encode(
				array(
					'nonce'  => $nonce,
					'postId' => $post_id,
				)
			) . ';',
			'before' 
		);

		$archetypes        = new Archetypes(
			array(
				'quiz_id' => $post_id,
				'hash'    => $archetype,
			)
		);
		$matched_archetype = $archetypes->get_archetype();

		if ( false === $matched_archetype ) {
			return $this->no_archetype_found();
		}

		$quiz = get_post( $post_id );
		if ( ! $quiz ) {
			return new WP_Error( 'quiz_not_found', 'Quiz not found', array( 'status' => 404 ) );
		}

		$controller_block = $this->parse_controller_block( $quiz );

		// Get prc-quiz/results block:
		$results_block = array_filter(
			$controller_block['innerBlocks'],
			function ( $a ) {
				return 'prc-quiz/results' === $a['blockName'];
			}
		);
		$results_block = array_values( $results_block );
		$results_block = array_pop( $results_block );

		$results_block['attrs']['score']      = (string) $matched_archetype->score['score'];
		$results_block['attrs']['submission'] = wp_json_encode( $matched_archetype->submission );

		$parsed = new WP_Block_Parser_Block(
			$results_block['blockName'],
			$results_block['attrs'],
			$results_block['innerBlocks'],
			$results_block['innerHTML'],
			$results_block['innerContent']
		);

		return render_block( (array) $parsed );
	}

	/**
	 * Render controller app.
	 *
	 * @param array  $attributes The attributes.
	 * @param object $block The block.
	 * @param int    $post_id The post id.
	 * @return string
	 */
	public function render_controller_app( $attributes, $block, $post_id ) {        
		$nonce = wp_create_nonce( 'prc_quiz_nonce--' . $post_id );
		wp_add_inline_script(
			self::$view_script_handle,
			'window.prcQuizController =' . wp_json_encode(
				array(
					'nonce'  => $nonce,
					'postId' => $post_id,
				)
			) . ';',
			'before' 
		);
		$block_attrs = array(
			'data-threshold' => $attributes['threshold'],
			'data-quiz-id'   => $post_id,
		);
		if ( get_query_var( 'quizEmbed' ) ) {
			$block_attrs['data-embed'] = true;
		}
		if ( is_iframe() ) {
			$block_attrs['data-iframe-height'] = true;
		}
		$block_attrs = get_block_wrapper_attributes( $block_attrs );

		ob_start();
		?>
		<div <?php echo $block_attrs; ?>>
			<?php
				echo $this->render_placeholder( $block );
				echo '<div class="wp-block-prc-quiz-controller--react-app" style="display:none">' . self::$view_script_handle . '</div>';
			?>
		</div>
		<?php
		return ob_get_clean();
	}

	/**
	 * Render results app.
	 *
	 * @param array $attributes The attributes.
	 * @param int   $post_id The post id.
	 * @return string
	 */
	public function render_results_app( $attributes, $post_id ) {
		$allow_group = array_key_exists( 'groups', $attributes ) ? $attributes['groups'] : false;
		$archetype   = get_query_var( 'archetype', 0 );
		$group_id    = get_query_var( 'group', false );

		$block_attrs = array(
			'data-threshold' => $attributes['threshold'],
			'data-quiz-id'   => $post_id,
		);
		if ( is_iframe() ) {
			$block_attrs['data-iframe-height'] = true;
		}
		$block_attrs = get_block_wrapper_attributes( $block_attrs );

		ob_start();
		?>
		<div <?php echo $block_attrs; ?>>
			<?php
			$results = '';
			if ( 0 === $archetype && false !== $group_id && false !== $allow_group ) {
				$results = $this->render_group_results( $group_id, $post_id );
				if ( is_wp_error( $results ) ) {
					$results = $this->no_group_found();
				}
			} else {
				$results = $this->render_results( $archetype, $post_id );
				if ( is_wp_error( $results ) ) {
					$results = $this->no_archetype_found();
				}
			}
			if ( ! is_wp_error( $results ) ) {
				echo $results;
			}
			?>
		</div>
		<?php
		return ob_get_clean();
	}

	/**
	 * Render block callback.
	 *
	 * @param array  $attributes The attributes.
	 * @param string $content The content.
	 * @param object $block The block.
	 * @return string
	 */
	public function render_block_callback( $attributes, $content, $block ) {
		if ( is_admin() ) {
			return;
		}

		$show_results = get_query_var( 'showResults', false );
		global $post;
		$post_id = $post->ID;

		if ( $show_results ) {
			return $this->render_results_app( $attributes, $post_id );
		} else {
			return $this->render_controller_app( $attributes, $block, $post_id );
		}
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
