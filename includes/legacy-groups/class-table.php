<?php
use BerlinDB\Database\Table as BerlinDB_Table;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}


class Community_Groups_Table extends BerlinDB_Table {

	/**
	 * Table name, without the global table prefix.
	 *
	 * @since 1.0.0
	 * @var   string
	 */
	public $name = 'prc_quiz_community_groups';

	/**
	 * Database version key (saved in _options or _sitemeta)
	 *
	 * @since 1.0.0
	 * @var   string
	 */
	protected $db_version_key = 'community_groups_version';

	/**
	 * Optional description.
	 *
	 * @since 1.0.0
	 * @var   string
	 */
	public $description = 'Community groups for typology quizzes.';

	/**
	 * Database version.
	 *
	 * @since 1.0.0
	 * @var   mixed
	 */
	protected $version = '1.0.0';

	/**
	 * Key => value array of versions => methods.
	 *
	 * @since 1.0.0
	 * @var   array
	 */
	protected $upgrades = array();

	/**
	 * Setup this database table.
	 *
	 * @since 1.0.0
	 */
	protected function set_schema() {
		$this->schema = '
			id  bigint(20) NOT NULL AUTO_INCREMENT,
			group_id           mediumtext NOT NULL,
			name           mediumtext NOT NULL,
			quiz_id            int NOT NULL,
			created datetime DEFAULT "0000-00-00 00:00:00" NOT NULL,
			owner mediumtext NOT NULL,
			typology_groups longtext NOT NULL,
			answers longtext NOT NULL,
			total            int NOT NULL,
			PRIMARY KEY (id)
			';
	}
}
