<?php
namespace PRC\Platform\Quiz;
use WP_Error;

class Archetypes {
    public $quiz_id;
    public $hash;
    public $db;

    public function __construct($args) {
        $args = wp_parse_args($args, [
            'quiz_id' => null,
            'hash' => null,
        ]);
        $this->quiz_id = $args['quiz_id'];
        $this->hash = $args['hash'];
        $firebase = new \PRC\Platform\Firebase(null);
        $this->db = $firebase->db;
    }

    public function setup_quiz_entry() {
        $quiz_id = $this->quiz_id;
        // Check if the quiz exists in the db, if not, lets set it up.
        $quiz_entry = $this->db->getReference( 'quiz/' . $quiz_id )->getValue();
        if ( empty( $quiz_entry )  ) {
            $quiz_entry = [
                'id' => $quiz_id,
                'archetypes' => '',
            ];
            $this->db->getReference( 'quiz/' . $quiz_id )->set( $quiz_entry );
        }
        return $quiz_entry;
    }

    protected function archetype_ref() {
        return 'quiz/' . $this->quiz_id . '/archetypes/' . $this->hash;
    }

    /**
     * Get an archetype for a quiz by hash.
     * If the archetype does not exist, return false.
     */
	public function get_archetype($return_as_array = false) {
		$existing_archetype = $this->db->getReference( $this->archetype_ref() )->getValue();
        
        error_log('get_archetype::' . print_r([
            'quiz_id' => $this->quiz_id,
            'existing' => $existing_archetype,
        ], true));

		if ( empty( $existing_archetype ) ) {
			return false;
		}

		return false === $return_as_array ? (object) $existing_archetype : $existing_archetype;
	}

    public function create_archetype($submission = null, $score = null) {
        if ( empty( $submission ) ) {
            return new WP_Error('no-submission', 'No submission provided.');
        }
        if ( empty( $score ) ) {
            return new WP_Error('no-score', 'No score provided.');
        }
        // Create a new archetype.
        $new_archetype = [
            'score' => $score,
            'submission' => $submission,
            'hits' => 1,
        ];
        $this->db->getReference( $this->archetype_ref() )->set( $new_archetype );
        return $new_archetype;
    }

    public function log_archetype_hit() {
        $existing_archetype = $this->get_archetype();
        if ( empty( $existing_archetype ) ) {
            return new WP_Error('no-archetype', 'No archetype found.');
        }
        $existing_archetype->hits++;
        $this->db->getReference( $this->archetype_ref() )->set( $existing_archetype );
        return $existing_archetype;
    }

}
