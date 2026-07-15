<?php
/**
 * Quiz Builder Plugin
 *
 * @package PRC\Platform\Quiz
 */

namespace PRC\Platform\Quiz;

use WP_Error;

/**
 * The core plugin class, responsible for loading all dependencies, defining
 * the plugin version, and registering the hooks that define the plugin.
 *
 * This is used to define internationalization, admin-specific hooks, and
 * public-facing site hooks.
 *
 * Also maintains the unique identifier of this plugin as well as the current
 * version of the plugin.
 *
 * @since      3.5.0
 * @package    PRC\Platform\Quiz
 * @author     Seth Rubenstein <srubenstein@pewresearch.org>
 */
class Plugin {
	/**
	 * The post type for quizzes.
	 *
	 * @var string
	 */
	public static $post_type = 'quiz';

	/**
	 * The loader that's responsible for maintaining and registering all hooks that power
	 * the plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      Loader    $loader    Maintains and registers all hooks for the plugin.
	 */
	protected $loader;

	/**
	 * The unique identifier of this plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      string    $plugin_name    The string used to uniquely identify this plugin.
	 */
	protected $plugin_name;

	/**
	 * The current version of the plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      string    $version    The current version of the plugin.
	 */
	protected $version;

	/**
	 * The active theme.
	 *
	 * @var mixed
	 */
	protected $active_theme;

	/**
	 * Define the core functionality of the platform as initialized by hooks.
	 *
	 * @since    1.0.0
	 */
	public function __construct() {
		$this->version     = PRC_QUIZ_VERSION;
		$this->plugin_name = 'prc-quiz-builder';

		$this->load_dependencies();
		$this->define_dependencies();
		$this->define_patterns();
		$this->init_blocks();
	}

	/**
	 * Load the required dependencies for this plugin.
	 *
	 * Create an instance of the loader which will be used to register the hooks
	 * with WordPress.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function load_dependencies() {
		// Load plugin loading class.
		require_once plugin_dir_path( __DIR__ ) . '/includes/class-loader.php';
		// 1. Initialize Archetypes system.
		require_once plugin_dir_path( __DIR__ ) . '/includes/class-archetypes.php';
		// 2. Initialize Groups system.
		require_once plugin_dir_path( __DIR__ ) . '/includes/class-groups.php';
		// 3. Initialize the Rest API class.
		require_once plugin_dir_path( __DIR__ ) . '/includes/class-rest-api.php';
		// 4. Initialize analytics class.
		require_once plugin_dir_path( __DIR__ ) . '/includes/class-analytics.php';
		// 4b. WP Abilities API category + analytics ability.
		require_once plugin_dir_path( __DIR__ ) . '/includes/class-ability-categories.php';
		require_once plugin_dir_path( __DIR__ ) . '/includes/class-ability.php';
		// 5. Initialize the inspector sidebar panel.
		require_once plugin_dir_path( __DIR__ ) . '/includes/inspector-sidebar-panel/class-inspector-sidebar-panel.php';
		// 6. WP-CLI: build newsletter audience from quiz group owners.
		require_once plugin_dir_path( __DIR__ ) . '/includes/class-cli-build-audience.php';
		// 7. WP-CLI: ad hoc quiz report (_report meta) read/update.
		require_once plugin_dir_path( __DIR__ ) . '/includes/class-cli-report.php';
		require_once plugin_dir_path( __DIR__ ) . '/includes/class-quiz-binding-resolver.php';
		require_once plugin_dir_path( __DIR__ ) . '/includes/class-quiz-bindings.php';
		require_once plugin_dir_path( __DIR__ ) . '/includes/class-block-supports.php';

		// Load block files.
		$this->load_blocks();

		// Initialize the loader.
		$this->loader = new Loader();

		// Register the block library manifest file.
		$this->register_block_library_manifest();
	}

	/**
	 * Define the dependencies for the plugin.
	 */
	/**
	 * Register block patterns from the plugin patterns directory.
	 */
	private function define_patterns() {
		$this->loader->add_action( 'plugins_loaded', $this, 'register_patterns', 5 );
	}

	/**
	 * Load binding companion patterns via the platform pattern loader.
	 *
	 * @hook plugins_loaded
	 */
	public function register_patterns(): void {
		if ( ! function_exists( '\PRC\Platform\Core\Patterns\register_plugin_patterns' ) ) {
			return;
		}

		\PRC\Platform\Core\Patterns\register_plugin_patterns(
			'prc-quiz-builder',
			PRC_QUIZ_DIR . '/patterns',
			array(
				'category_label' => __( 'Quiz Builder', 'prc-quiz' ),
				'text_domain'    => 'prc-quiz',
			)
		);
	}

	/**
	 * Define the dependencies for the plugin.
	 */
	private function define_dependencies() {
		new Analytics( $this->get_loader() );
		new Ability_Categories( $this->get_loader() );
		new Ability( $this->get_loader() );
		new Rest_API( $this->get_loader() );
		new Inspector_Sidebar_Panel( $this->get_loader() );
		new Block_Supports( $this->get_loader() );

		// Priority 5 ensures the quiz post type (and its declared supports like
		// `prc-publication-listing`) is registered before any other plugin runs
		// `get_post_types_by_support()` at the default init/10 priority — most
		// notably prc-publication-listing's `_post_visibility` taxonomy binding.
		$this->loader->add_action( 'init', $this, 'register_quiz_post_type', 5 );
		$this->loader->add_action( 'init', $this, 'register_rewrite_rules' );
		$this->loader->add_filter( 'query_vars', $this, 'register_query_vars' );
		$this->loader->add_filter( 'prc_research_teams_rewrite_config', $this, 'register_research_teams_config' );
		$this->loader->add_action( 'init', $this, 'init_quiz_block_on_new_post' );
		$this->loader->add_filter( 'prc_iframe_content', $this, 'filter_iframe_content' );
		$this->loader->add_action( 'wp_enqueue_scripts', $this, 'register_quiz_components', 0 );
		$this->loader->add_action( 'admin_enqueue_scripts', $this, 'register_quiz_components', 0 );
		$this->loader->add_action( 'prc_platform_on_post_init', $this, 'init_quiz_db_entry_on_new_post', 100 );
		// $this->loader->add_action( 'init', $this, 'register_quiz_patterns' ); // @TODO: When block pattern overrides or a method to load patterns into sycned patterns is implemented, re-enable this.

		// Register quiz cookie information with WP Consent API.
		$this->loader->add_action( 'init', $this, 'register_quiz_cookie_info' );
	}

	/**
	 * Include a file from the plugin's includes directory.
	 *
	 * @param mixed $block_file_name The block file name.
	 * @return WP_Error|void
	 */
	private function include_block( $block_file_name ) {
		$dir             = wp_get_environment_type() === 'local' ? 'src' : 'build';
		$block_file_path = $dir . '/' . $block_file_name . '/class-' . $block_file_name . '.php';
		if ( file_exists( plugin_dir_path( __DIR__ ) . $block_file_path ) ) {
			require_once plugin_dir_path( __DIR__ ) . $block_file_path;
		} else {
			return new WP_Error( 'prc_quiz_block_missing', __( 'Block missing.', 'prc' ) );
		}
	}

	/**
	 * Include all blocks from the plugin's /blocks directory.
	 *
	 * @return void
	 */
	private function load_blocks() {
		$block_files = glob( PRC_QUIZ_DIR . '/build/*', GLOB_ONLYDIR );
		foreach ( $block_files as $block ) {
			$block = basename( $block );
			// Editor-only script entry; no PHP block class.
			if ( 'bindings' === $block ) {
				continue;
			}
			$loaded = $this->include_block( $block );
			if ( is_wp_error( $loaded ) ) {
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				error_log( $loaded->get_error_message() );
			}
		}
	}

	/**
	 * Register the block library manifest.
	 *
	 * @since 3.5.0
	 */
	public function register_block_library_manifest() {
		wp_register_block_metadata_collection(
			PRC_QUIZ_DIR . '/build',
			PRC_QUIZ_DIR . '/build/blocks-manifest.php'
		);
	}

	/**
	 * Initialize the quiz blocks.
	 *
	 * @since    3.5.0
	 */
	private function init_blocks() {
		// Synced quiz (embeddable by ref).
		new Synced_Quiz( $this->get_loader() );
		new Quiz_Bindings( $this->get_loader() );
		// Core Quiz application blocks.
		new Controller( $this->get_loader() );
		new Answer( $this->get_loader() );
		new Question( $this->get_loader() );
		new Page( $this->get_loader() );
		new Pages( $this->get_loader() );
		new Progress_Bar( $this->get_loader() );
		// Results blocks.
		new Group_Results( $this->get_loader() );
		new Results( $this->get_loader() );
		new Result_Histogram( $this->get_loader() );
		new Result_Score( $this->get_loader() );
		new Result_Table( $this->get_loader() );
	}

	/**
	 * Register the query vars.
	 *
	 * @hook query_vars
	 *
	 * @param array $vars The query vars.
	 * @return array The query vars.
	 */
	public function register_query_vars( $vars ) {
		$vars[] .= 'quizArchetype';
		$vars[] .= 'quizGroup';
		$vars[] .= 'quizGroupDomain';
		$vars[] .= 'quizShowResults';
		$vars[] .= 'quizShareQuiz';
		$vars[] .= 'quizEmbed';
		return $vars;
	}

	/**
	 * Register the rewrite rules.
	 * /quiz/{quiz-slug}/ - The quiz page.
	 * /quiz/{quiz-slug}/results/{archetype-hash}/ - A user's results page.
	 * /quiz/{quiz-slug}/group/{group-id}/ - The quiz page, with a group enabled.
	 * /quiz/{quiz-slug}/group/{group-id}/results/ - The results page for a group.
	 * /quiz/{quiz-slug}/group/{group-id}/results/{archetype-hash}/ - The user's results page, with a group enabled.
	 * /quiz/{quiz-slug}/group/{group-domain}/{group-id}/results/ - The results page for a group, with a group org enabled. i.e. /politics/quiz/political-typology/stanford-edu/xyawer1823na213/results/
	 *
	 * @hook init
	 */
	public function register_rewrite_rules() {
		$rules = array(
			'quiz/([^/]+)/results/([a-zA-Z0-9-]+)/?$' => 'index.php?quiz=$matches[1]&quizArchetype=$matches[2]&quizShowResults=true',
			'quiz/([^/]+)/group/([a-zA-Z0-9-]+)/?$'   => 'index.php?quiz=$matches[1]&quizGroup=$matches[2]',
			'quiz/([^/]+)/group/([a-zA-Z0-9-]+)/results/?$' => 'index.php?quiz=$matches[1]&quizGroup=$matches[2]&quizShowResults=true',
			'quiz/([^/]+)/group/([a-zA-Z0-9-]+)/results/([a-zA-Z0-9-]+)/?$' => 'index.php?quiz=$matches[1]&quizGroup=$matches[2]&quizArchetype=$matches[3]&quizShowResults=true',
			'quiz/([^/]+)/group/([a-zA-Z0-9-]+)/([a-zA-Z0-9-]+)/results/?$' => 'index.php?quiz=$matches[1]&quizGroup=$matches[2]&quizGroupDomain=$matches[3]&quizShowResults=true',
			'quiz/([^/]+)/embed/?$'                   => 'index.php?quiz=$matches[1]&iframe=true',
			'quiz/([^/]+)/iframe/?$'                  => 'index.php?quiz=$matches[1]&iframe=true',
		);
		foreach ( $rules as $rule => $query ) {
			add_rewrite_rule( $rule, $query, 'top' );
		}
	}

	/**
	 * Register quiz rewrite configuration for research team prefixed URLs.
	 *
	 * This provides the quiz URL patterns for research-team-prefixed URLs like
	 * /politics/quiz/political-typology/ instead of just /quiz/political-typology/.
	 *
	 * @hook prc_research_teams_rewrite_config
	 *
	 * @param array $config The rewrite configuration.
	 * @return array Modified configuration.
	 */
	public function register_research_teams_config( $config ) {
		$config['quiz'] = array(
			'slug_pattern'       => 'quiz/([^/]+)',
			'query_string'       => 'quiz=$matches[2]',
			'supports'           => array( 'iframe', 'embed', 'attachment' ),
			'attachment_pattern' => 'quiz/[^/]+/([^/]+)',
			'additional_rules'   => array(
				// Results archetype rule.
				'quiz/([^/]+)/results/([a-zA-Z0-9-]+)' => 'quiz=$matches[2]&quizArchetype=$matches[3]&quizShowResults=true',
				// Group rules.
				'quiz/([^/]+)/group/([a-zA-Z0-9-]+)'   => 'quiz=$matches[2]&quizGroup=$matches[3]',
				'quiz/([^/]+)/group/([a-zA-Z0-9-]+)/results' => 'quiz=$matches[2]&quizGroup=$matches[3]&quizShowResults=true',
				'quiz/([^/]+)/group/([a-zA-Z0-9-]+)/results/([a-zA-Z0-9-]+)' => 'quiz=$matches[2]&quizGroup=$matches[3]&quizArchetype=$matches[4]&quizShowResults=true',
				'quiz/([^/]+)/group/([a-zA-Z0-9-]+)/([a-zA-Z0-9-]+)/results' => 'quiz=$matches[2]&quizGroup=$matches[3]&quizGroupDomain=$matches[4]&quizShowResults=true',
			),
		);
		return $config;
	}

	/**
	 * Register the shared quiz React components.
	 *
	 * @since 3.5.0
	 */
	public function register_quiz_components() {
		$asset_file = include PRC_QUIZ_DIR . '/includes/shared-components/build/index.asset.php';
		$script_src = plugin_dir_url( PRC_QUIZ_FILE ) . '/includes/shared-components/build/index.js';

		$script = wp_register_script(
			'prc-quiz-shared-components',
			$script_src,
			$asset_file['dependencies'],
			$asset_file['version'],
			true
		);

		if ( ! $script ) {
			return new WP_Error( 'prc-quiz-shared-components', __( 'Error registering script.' ) );
		}
	}

	/**
	 * Register the quiz patterns.
	 *
	 * @hook init
	 *
	 * @since 3.5.0
	 */
	public function register_quiz_patterns() {
		register_block_pattern_category(
			'prc-quiz',
			array(
				'label'       => 'Quiz Builder',
				'description' => 'Patterns for Quiz Builder',
			)
		);

		register_block_pattern(
			'prc-quiz/next-button',
			array(
				'title'         => __( 'Quiz Next Button', 'prc-quiz' ),
				'description'   => _x( 'Next button for paginated quizzes.', 'Block pattern description', 'prc-quiz' ),
				'postTypes'     => array( self::$post_type ),
				'filePath'      => PRC_QUIZ_DIR . '/includes/patterns/next-button.php',
				'categories'    => array( 'prc-quiz' ),
				'viewportWidth' => 320,
			)
		);

		register_block_pattern(
			'prc-quiz/start-button',
			array(
				'title'         => __( 'Quiz Start Button', 'prc-quiz' ),
				'description'   => _x( 'Start button for quizzes.', 'Block pattern description', 'prc-quiz' ),
				'postTypes'     => array( self::$post_type ),
				'filePath'      => PRC_QUIZ_DIR . '/includes/patterns/start-button.php',
				'categories'    => array( 'prc-quiz' ),
				'viewportWidth' => 320,
			)
		);

		register_block_pattern(
			'prc-quiz/submit-button',
			array(
				'title'         => __( 'Quiz Submit Button', 'prc-quiz' ),
				'description'   => _x( 'Submit button for quizzes.', 'Block pattern description', 'prc-quiz' ),
				'postTypes'     => array( self::$post_type ),
				'filePath'      => PRC_QUIZ_DIR . '/includes/patterns/submit-button.php',
				'categories'    => array( 'prc-quiz' ),
				'viewportWidth' => 320,
			)
		);

		register_block_pattern(
			'prc-quiz/create-group-form-dialog',
			array(
				'title'         => __( 'Create Group Form Dialog', 'prc-quiz' ),
				'description'   => _x( 'Create group form dialog for quizzes.', 'Block pattern description', 'prc-quiz' ),
				'postTypes'     => array( self::$post_type ),
				'filePath'      => PRC_QUIZ_DIR . '/includes/patterns/create-group-form-dialog.php',
				'categories'    => array( 'prc-quiz' ),
				'viewportWidth' => 320,
			)
		);

		register_block_pattern(
			'prc-quiz/create-group-from-results-form-dialog',
			array(
				'title'         => __( 'Create Group from Results Form Dialog', 'prc-quiz' ),
				'description'   => _x( 'Create a group directly from the results page with your result pre-included.', 'Block pattern description', 'prc-quiz' ),
				'postTypes'     => array( self::$post_type ),
				'filePath'      => PRC_QUIZ_DIR . '/includes/patterns/create-group-from-results-form-dialog.php',
				'blockTypes'    => array( 'prc-quiz/results' ),
				'categories'    => array( 'prc-quiz' ),
				'viewportWidth' => 420,
			)
		);
	}

	/**
	 * Register the quiz post type.
	 *
	 * @since 3.5.0
	 */
	public function register_quiz_post_type() {
		$labels = array(
			'name'               => 'Quizzes',
			'singular_name'      => 'Quiz',
			'add_new'            => 'Add New',
			'add_new_item'       => 'Add New Quiz',
			'edit_item'          => 'Edit Quiz',
			'new_item'           => 'New Quiz',
			'all_items'          => 'All Quizzes',
			'view_item'          => 'View Quiz',
			'search_items'       => 'Search Quizzes',
			'not_found'          => 'No quizzes found',
			'not_found_in_trash' => 'No quizzes found in Trash',
			'parent_item_colon'  => '',
			'menu_name'          => 'Quizzes',
		);

		$rewrite = array(
			'slug'       => 'quiz',
			'with_front' => true,
			'pages'      => true,
			'feeds'      => true,
		);

		$args = array(
			'labels'             => $labels,
			'public'             => true,
			'publicly_queryable' => true,
			'show_ui'            => true,
			'show_in_menu'       => true,
			'query_var'          => true,
			'rewrite'            => $rewrite,
			'capability_type'    => 'page',
			'has_archive'        => true,
			'hierarchical'       => false,
			'menu_position'      => 15,
			'menu_icon'          => 'dashicons-forms',
			'show_in_rest'       => true,
			'supports'           => array(
				'title',
				'editor',
				'thumbnail',
				'excerpt',
				'shortlinks',
				'custom-fields',
				'revisions',
				'prc-revisions',
				'prc-schema-seo',
				'prc-social',
				'prc-bylines',
				'prc-art-direction',
				'prc-datasets',
				'prc-publication-listing',
				'prc-publish-workflows',
			),
			'taxonomies'         => array( 'category', 'research-teams', 'bylines', 'datasets', 'collections', 'level_of_effort', 'primary_audience', 'information_type' ),
		);

		register_post_type( self::$post_type, $args );

		// Opt the quiz CPT into the Presence API so the synced-quiz block can
		// detect when someone else has the quiz open and gate polling on it.
		if ( function_exists( 'wp_presence_post_room' ) ) {
			add_post_type_support( self::$post_type, 'presence' );
		}
	}

	/**
	 * Get the tutorial.
	 *
	 * @since 3.5.0
	 */
	public static function get_tutorial() {
		return array(
			array(
				'prc-quiz/controller',
				array(),
				array(
					array(
						'prc-quiz/pages',
						array(),
						array(
							array(
								'prc-quiz/page',
								array(),
								array(
									array(
										'prc-quiz/question',
										array(),
										array(
											array(
												'prc-quiz/answer',
												array(),
											),
										),
									),
								),
							),
						),
					),
				),
			),
		);
	}

	/**
	 * Initialize the quiz block on a new post.
	 *
	 * @since 3.5.0
	 */
	public function init_quiz_block_on_new_post() {
		$quiz_post_type_object = get_post_type_object( 'quiz' );
		if ( ! $quiz_post_type_object ) {
			return;
		}
		// @TODO: Initialize a full "tutorial" example for users that do not have user_meta of "did_quiz_tutorial" set, and then set it so it doesnt show up again.
		$shown_user_tutorial             = get_user_meta( get_current_user_id(), 'prc_quiz_tutorial_displayed', true );
		$quiz_post_type_object->template = $shown_user_tutorial ? array(
			array( 'prc-quiz/controller', array(), array() ),
		) : self::get_tutorial();

		if ( ! $shown_user_tutorial ) {
			update_user_meta( get_current_user_id(), 'prc_quiz_tutorial_displayed', true );
		}
	}

	/**
	 * Initialize the quiz database entry on a new post.
	 *
	 * @hook prc_platform_on_post_init
	 *
	 * @param WP_Post $ref_post The post object.
	 */
	public function init_quiz_db_entry_on_new_post( $ref_post ) {
		if ( 'quiz' !== $ref_post->post_type ) {
			return;
		}
		$api = new Archetypes(
			array(
				'quiz_id' => $ref_post->ID,
			)
		);
		$api->setup_quiz_entry();
	}

	/**
	 * Filter the iframe content.
	 *
	 * @TODO: Look into revamping the iframe plugin and this function to be more flexible.
	 *
	 * @param mixed $content The content.
	 * @return mixed The content.
	 */
	public function filter_iframe_content( $content ) {
		$style = '<style>
			.wp-block-prc-quiz-answer {
				flex-grow: 1;
				justify-content: center;
				width: 100%;
			}
			.wp-block-prc-quiz-question {
				display: flex;
				flex-direction: column;
			}
			.wp-block-prc-quiz-page {
				flex-direction: column;
				align-items: stretch;
			}
		</style>';

		if ( ! is_singular( 'quiz' ) ) {
			return $content;
		}

		$is_quiz_embed = get_query_var( 'quizEmbed' )
			|| ( isset( $_GET['quizEmbed'] ) && filter_var( wp_unslash( $_GET['quizEmbed'] ), FILTER_VALIDATE_BOOLEAN ) );

		if ( $is_quiz_embed ) {
			return $content . $style;
		}

		// Theme template parts own branded chrome; keep quiz layout constraint only.
		return '<div style="max-width: 640px;">' . $content . $style . '</div>';
	}

	/**
	 * Register quiz cookies with WP Consent API.
	 *
	 * 1. A standard cookie for storing quiz progress data.
	 * 2. A cookie for specifically storing typology group data.
	 *
	 * @hook init
	 * @since 3.5.0
	 */
	public function register_quiz_cookie_info() {
		// Check if WP Consent API functions are available.
		if ( ! function_exists( 'wp_add_cookie_info' ) ) {
			return;
		}

		// Register the quiz progress cookie (JSON format).
		wp_add_cookie_info(
			'prc-quiz-builder',                              // Cookie name.
			'PRC Quiz Builder',                              // Plugin or service name.
			'functional',                                    // Category: functional since it's needed for quiz functionality.
			'30 days',                                       // Expiration time.
			'Store quiz data in JSON format including user answers, scores, hash, and completion timestamp to maintain quiz progress and allow users to view their results.', // Function description.
			'Quiz responses, scores, and progress data',     // Type of personal data collected.
			false,                                          // Not restricted to members only.
			false,                                          // Not restricted to administrators only.
			'HTTP',                                         // Cookie type.
			true                                            // Use current site domain.
		);
		wp_add_cookie_info(
			'prc-quiz-builder__typology',
			'PRC Quiz Builder',
			'functional',
			'30 days',
			'Store quiz typology data including user answers and the users typology group for use in user personalization.',
			'Quiz responses and typology group',
			false,
			false,
			'HTTP',
			true
		);
	}

	/**
	 * Run the loader to execute all of the hooks with WordPress.
	 *
	 * @since    1.0.0
	 */
	public function run() {
		$this->loader->run();
	}

	/**
	 * The name of the plugin used to uniquely identify it within the context of
	 * WordPress and to define internationalization functionality.
	 *
	 * @since     1.0.0
	 * @return    string    The name of the plugin.
	 */
	public function get_plugin_name() {
		return $this->plugin_name;
	}

	/**
	 * The reference to the class that orchestrates the hooks with the plugin.
	 *
	 * @since     1.0.0
	 * @return    PRC_Quiz_Loader    Orchestrates the hooks of the plugin.
	 */
	public function get_loader() {
		return $this->loader;
	}

	/**
	 * Retrieve the post type for quizzes.
	 *
	 * @since     1.0.0
	 * @return    string    The post type for quizzes.
	 */
	public function get_post_type() {
		return self::$post_type;
	}

	/**
	 * Retrieve the version number of the plugin.
	 *
	 * @since     1.0.0
	 * @return    string    The version number of the plugin.
	 */
	public function get_version() {
		return $this->version;
	}
}
