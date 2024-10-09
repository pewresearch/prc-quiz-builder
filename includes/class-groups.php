<?php
namespace PRC\Platform\Quiz;

use Community_Groups_Query, WP_Error, Kreait\Firebase\Factory;

class Groups {
    public $quiz_id;
    public $group_name;
    public $owner_id;
    public $group_id;
    public $db;
    public static $groups_version = 2;

    public function __construct($args) {
        $args = wp_parse_args($args, [
            'quiz_id' => null,
            'owner_id' => null,
            'group_id' => false,
            'group_name' => null,
        ]);

        $firebase = new \PRC\Platform\Firebase(null);
        $this->db = $firebase->db;
        $this->quiz_id = $args['quiz_id'];
        $this->group_name = $args['group_name'];
        $this->owner_id = $args['owner_id'];
        
       if ( false === $args['group_id' ] ) {
            $this->group_id = $this->generate_group_id();
       } else {
            $this->group_id = $args['group_id'];
       }
    }

    public function generate_group_id($ext = null) {
        return md5( wp_json_encode( [
            $this->group_name,
            $this->owner_id,
            $this->quiz_id,
            $ext,
        ] ) );
    }

    public function generate_results_url() {
        $permalink = get_permalink( $this->quiz_id );
        return add_query_arg( [
            'group' => $this->group_id,
        ], $permalink . 'results/' );
    }

    public function generate_group_url() {
        $permalink = get_permalink( $this->quiz_id );
        return add_query_arg( [
            'group' => $this->group_id,
        ], $permalink );
    }

    public function upgrade_legacy_group_if_exists() {
        $query  = new Community_Groups_Query(
			array(
				'group_id' => $this->group_id,
				'limit'    => 1,
				'fields'   => array( 'name', 'created', 'quiz_id', 'typology_groups', 'answers', 'total', 'owner' ),
			)
		);
		$result = array_pop( $query->items );
        $to_return = false;
        // If we have a result, then we should create a new group in the new database, then remove it from the old database and then return the result we just created.
        if ( ! empty( $result ) ) {
            $this->owner_id = $result->owner;
            $to_return = [
                'name' => $result->name,
                'quiz_id' => (int) $result->quiz_id,
                'created' => $result->created,
                'owner' => $this->owner_id,
                'typology_groups' => json_decode( $result->typology_groups, true ),
                'answers' => json_decode( $result->answers, true ),
                'total' => (int) $result->total,
            ];

            // Create group:
            $this->db->getReference( 'quiz/' . $this->quiz_id . '/groups/' . $this->group_id )->set( $to_return );

            // Store record of gorup on the user's database:
            $this->db->getReference( 'users/' . $this->owner_id . '/groups/' . $this->group_id )->set( [
                'created' => $result->created,
                'quiz_id' => (int) $result->quiz_id,
                'quiz_slug' => get_post_field( 'post_name', $result->quiz_id ),
                'name' => $result->name,
                'version' => self::$groups_version,
            ] );

            error_log("UPGRADING_GROUP".print_r($to_return, true));

            return $to_return;
        }
        
        return $to_return;
    }

    /**
     * Get an archetype for a quiz by hash.
     * If the archetype does not exist, return false.
     */
	public function get_group() {
		$existing_group = $this->db->getReference( 'quiz/' . $this->quiz_id . '/groups/' . $this->group_id )->getValue();
        if ( empty( $existing_group ) ) {
			$existing_group = $this->upgrade_legacy_group_if_exists();
		}
        if ( empty( $existing_group ) ) {
			return false;
		}
        // Get the latest data for results_url, group_Url, and quiz_name to return back here...
        // This ensures the data is always up to date.
        $dynamic_data = [
            'results_url' => $this->generate_results_url(),
            'group_url' => $this->generate_group_url(),
            'quiz_name' => get_the_title( $this->quiz_id ),
        ];
        $existing_group = array_merge( $existing_group, $dynamic_data );
		return $existing_group;
	}

    public function create_group(
        $quiz_data,
        $typology_groups = [],
    ) {
        if ( empty($typology_groups) ) {
            return new WP_Error('no-typology-groups', 'No typology groups provided.');
        }
        if ( empty($quiz_data) ) {
            return new WP_Error('no-quiz-data', 'No quiz data provided.');
        }

        $created_timestamp = gmdate( 'Y-m-d H:i:s' );
        $created_pretty = gmdate( 'Y-m-d' );

        // Check if group exists...
        $duplicate_name_exists = false;
        if ( false !== $this->get_group() ) {
            $duplicate_name_exists = true;
            // We'll generate a new group id if the group already exists, in the event someone makes an identical group name.
            $this->group_id = $this->generate_group_id( $created_timestamp );
        }
        
		$answers = array();
		foreach ( $quiz_data['pages'] as $page ) {
			$answrs = array();
			foreach ( $page['questions'] as $question ) {
				foreach ( $question['answers'] as $answer ) {
					$answrs[ $answer['uuid'] ] = 0;
				}
			}
			$answers = array_merge( $answers, $answrs );
		}

        $group_name = $duplicate_name_exists ? $this->group_name . ' ('.$created_pretty.')' : $this->group_name;

        
        // Create group:
        $this->db->getReference( 'quiz/' . $this->quiz_id . '/groups/' . $this->group_id )->set( [
            'name' => $group_name,
            'quiz_id' => (int) $this->quiz_id,
            'created' => $created_timestamp,
            'owner' => $this->owner_id,
            'typology_groups' => $typology_groups,
            'answers' => $answers,
            'total' => 0,
        ] );

        // Store record of gorup on the user's database:
        $this->db->getReference( 'users/' . $this->owner_id . '/groups/' . $this->group_id )->set( [
            'created' => $created_timestamp,
            'quiz_id' => (int) $this->quiz_id,
            'quiz_slug' => $quiz_data['quizSlug'],
            'name' => $group_name,
            'version' => self::$groups_version,
        ] );

        return $this->group_id;
    }

    public function update_group($submission, $score) {
        $group_assigned = $score['score'];

        $existing_group = $this->get_group();
        $current_total = $existing_group['total'];
        $current_answers = $existing_group['answers'];
        $current_typology_groups = $existing_group['typology_groups'];

        $total           = $current_total + 1;
        $answers         = $current_answers;
        $typology_groups = $current_typology_groups;

        // Increment the count for each answer given.
        foreach ( $answers as $answer_uuid => $value ) {
            if ( in_array( $answer_uuid, $submission['answers'] ) ) {
                $answers[ $answer_uuid ]++;
            }
        }

        // Increment the total count for the group.
        $typology_groups[ $group_assigned ]++;

        $this->db->getReference( 'quiz/' . $this->quiz_id . '/groups/' . $this->group_id )->update( [
            'answers' => $answers,
            'typology_groups' => $typology_groups,
            'total' => $total,
        ] );
    }

}
