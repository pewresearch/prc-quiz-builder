<?php
use BerlinDB\Database\Schema as BerlinDB_Schema;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Community_Groups_Schema extends BerlinDB_Schema {

	public $columns = array(
		// id
		'id'              => array(
			'name'     => 'id',
			'type'     => 'bigint',
			'length'   => '20',
			'unsigned' => true,
			'extra'    => 'auto_increment',
			'primary'  => true,
			'sortable' => true,
		),
		// group_id
		'group_id'        => array(
			'name'       => 'group_id',
			'type'       => 'mediumtext',
			'unsigned'   => true,
			'searchable' => true,
			'sortable'   => true,
		),
		// name
		'name'            => array(
			'name'       => 'name',
			'type'       => 'mediumtext',
			'unsigned'   => true,
			'searchable' => false,
			'sortable'   => true,
		),
		// quiz_id
		'quiz_id'         => array(
			'name'       => 'quiz_id',
			'type'       => 'int',
			'unsigned'   => true,
			'searchable' => true,
			'sortable'   => true,
		),
		// created
		'created'         => array(
			'name'       => 'created',
			'type'       => 'datetime',
			'unsigned'   => true,
			'searchable' => false,
			'sortable'   => true,
		),
		// owner
		'owner'           => array(
			'name'       => 'owner',
			'type'       => 'mediumtext',
			'unsigned'   => true,
			'searchable' => false,
			'sortable'   => true,
		),
		// typology_groups
		'typology_groups' => array(
			'name'       => 'typology_groups',
			'type'       => 'longtext',
			'unsigned'   => true,
			'searchable' => false,
			'sortable'   => false,
		),
		// submission
		'answers'         => array(
			'name'       => 'answers',
			'type'       => 'longtext',
			'unsigned'   => true,
			'searchable' => false,
			'sortable'   => false,
		),
		// total
		'total'           => array(
			'name'       => 'total',
			'type'       => 'int',
			'unsigned'   => true,
			'searchable' => true,
			'sortable'   => true,
		),

	);

}
