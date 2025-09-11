<?php
//phpcs:ignoreFile -- This is a 3rd party library.

use BerlinDB\Database\Row as BerlinDB_Row;

class Community_Group_Shape extends BerlinDB_Row {

	/**
	 * Community group constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param $item
	 */
	public function __construct( $item ) {
		parent::__construct( $item );
		$this->id              = (int) $this->id;
		$this->group_id        = (string) $this->group_id;
		$this->name            = (string) $this->name;
		$this->quiz_id         = (int) $this->quiz_id;
		$this->created         = (string) $this->created;
		$this->owner           = (string) $this->owner;
		$this->typology_groups = (string) $this->typology_groups;
		$this->answers         = (string) $this->answers;
		$this->total           = (int) $this->total;
	}

	/**
	 * Retrieves the HTML to display the information about this group.
	 *
	 * @since 1.0.0
	 *
	 * @return string HTML output to display this record's data.
	 */
	public function display() {
		$result = print_r( $this, true );
		return $result;
	}
}
