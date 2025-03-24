<?php
namespace PRC\Platform\Quiz;

use WP_Error, Community_Groups_Table;

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
		$this->init_blocks();

		// Add a PRC Quiz Category to the Block Editor
		add_filter(
			'block_categories_all',
			function ( $categories ) {
				$categories[] = array(
					'slug'  => 'prc-quiz',
					'title' => 'Quiz Blocks',
				);
				return $categories;
			} 
		);
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
		require_once plugin_dir_path( __DIR__ ) . '/includes/legacy-groups/index.php';
		require_once plugin_dir_path( __DIR__ ) . '/includes/class-groups.php';
		// 3. Initialize API class.
		require_once plugin_dir_path( __DIR__ ) . '/includes/class-api.php';
		// 4. Initialize the Rest API class.
		require_once plugin_dir_path( __DIR__ ) . '/includes/class-rest-api.php';
		// 4. Initialize analytics class.
		require_once plugin_dir_path( __DIR__ ) . '/includes/class-analytics.php';

		// Load block files.
		$this->load_blocks();

		// Initialize the loader.
		$this->loader = new Loader();
	}

	// This loads the internal dependencies of the plugin.
	// Most, if not all, these functions link to a PRC Platform manager class.
	private function define_dependencies() {
		new Analytics( $this->get_loader() );
		new Rest_API( $this->get_loader() );

		$community_groups = new Community_Groups_Table();
		// If the table does not exist, then create the table.
		if ( ! $community_groups->exists() ) {
			$community_groups->install();
		}

		$this->loader->add_action( 'init', $this, 'register_quiz_post_type' );
		$this->loader->add_filter( 'prc_platform_rewrite_query_vars', $this, 'register_query_vars' );
		$this->loader->add_action( 'init', $this, 'init_quiz_block_on_new_post' );
		$this->loader->add_filter( 'prc_iframe_content', $this, 'filter_iframe_content' );
		$this->loader->add_action( 'wp_enqueue_scripts', $this, 'register_quiz_components', 0 );
		$this->loader->add_action( 'admin_enqueue_scripts', $this, 'register_quiz_components', 0 );
		$this->loader->add_action( 'prc_platform_on_post_init', $this, 'init_quiz_db_entry_on_new_post', 100 );
	}

	/**
	 * Include a file from the plugin's includes directory.
	 *
	 * @param mixed $block_file_name
	 * @return WP_Error|void
	 */
	private function include_block( $block_file_name ) {
		$block_file_path = 'blocks/' . $block_file_name . '/' . $block_file_name . '.php';
		if ( file_exists( plugin_dir_path( __DIR__ ) . $block_file_path ) ) {
			require_once plugin_dir_path( __DIR__ ) . $block_file_path;
		} else {
			return new WP_Error( 'prc_user_accounts_block_missing', __( 'Block missing.', 'prc' ) );
		}
	}

	/**
	 * Include all blocks from the plugin's /blocks directory.
	 *
	 * @return void
	 */
	private function load_blocks() {
		$block_files = glob( PRC_QUIZ_DIR . '/blocks/*', GLOB_ONLYDIR );
		foreach ( $block_files as $block ) {
			$block  = basename( $block );
			$loaded = $this->include_block( $block );
			if ( is_wp_error( $loaded ) ) {
				error_log( $loaded->get_error_message() );
			}
		}
	}

	/**
	 * Initialize the quiz blocks.
	 *
	 * @since    3.5.0
	 */
	private function init_blocks() {
		new Controller( $this->get_loader() );
		new Answer( $this->get_loader() );
		new Embed( $this->get_loader() );
		new Group_Results( $this->get_loader() );
		new Question( $this->get_loader() );
		new Page( $this->get_loader() );
		new Pages( $this->get_loader() );
		new Results( $this->get_loader() );
		new Result_Follow_Us( $this->get_loader() );
		new Result_Histogram( $this->get_loader() );
		new Result_Score( $this->get_loader() );
		new Result_Table( $this->get_loader() );
	}

	/**
	 * @hook prc_platform_rewrite_query_vars
	 */
	public function register_query_vars( $vars ) {
		$vars[] .= 'archetype';
		$vars[] .= 'uuid';
		$vars[] .= 'group';
		$vars[] .= 'showResults';
		$vars[] .= 'shareQuiz';
		$vars[] .= 'quizEmbed';
		return $vars;
	}

	public function register_quiz_components() {
		// get assets file...
		$asset_file = include PRC_QUIZ_DIR . '/blocks/.shared/build/index.asset.php';
		$script_src = plugin_dir_url( PRC_QUIZ_FILE ) . '/blocks/.shared/build/index.js';

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
			'menu_position'      => 49,
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
			),
			'taxonomies'         => array( 'category', 'research-teams' ),
		);

		register_post_type( self::$post_type, $args );

		add_filter(
			'prc_load_gutenberg',
			function ( $enabled_post_types ) {
				$enabled_post_types[] = self::$post_type;
				return $enabled_post_types;
			}
		);
	}

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
	 * @hook prc_platform_on_post_init
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
	 * @TODO: Look into revamping the iframe plugin and this function to be more flexible.
	 * @param mixed $content
	 * @return mixed
	 */
	public function filter_iframe_content( $content ) {
		if ( ! is_singular( 'quiz' ) ) {
			return $content;
		}
		if ( get_query_var( 'quizEmbed' ) ) {
			return $content;
		}

		$assets_dir = WP_CONTENT_URL . '/themes/prc_parent/src/images/logos';
		ob_start();
		?>
		<div id="prc-iframe-title">
			<h1 style=""><img src="<?php echo esc_url( $assets_dir . '/logo-standard.svg' ); ?>" alt="Pew Research Center Logo" style="width: 300px; margin-right: 10px;"><span><?php the_title(); ?></span></h1>
		</div>
		<style>
			#prc-iframe-title {
				margin-bottom: 20px;
			}
			#prc-iframe-title h1 {
				display: flex;
				align-items: center;
			}
			@media screen and (max-width: 640px) {
				#prc-iframe-title h1 {
					align-items: flex-start;
					flex-direction: column;
				}
			}
		</style>
		<?php
		return '<div style="max-width: 640px;">' . ob_get_clean() . $content . '</div>';
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
