<?php
// This file is generated. Do not modify it manually.
return array(
	'answer' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-quiz/answer',
		'version' => '1.0.0',
		'title' => 'Answer',
		'description' => 'An answer choice for a question.',
		'category' => 'prc-quiz',
		'attributes' => array(
			'allowedBlocks' => array(
				'type' => 'array'
			),
			'orientation' => array(
				'type' => 'string',
				'default' => 'vertical'
			),
			'answer' => array(
				'type' => 'string'
			),
			'resultsLabel' => array(
				'type' => 'string'
			),
			'points' => array(
				'type' => 'string',
				'default' => 0
			),
			'correct' => array(
				'type' => 'boolean'
			),
			'uuid' => array(
				'type' => 'string'
			),
			'conditionalDisplay' => array(
				'type' => 'boolean',
				'default' => false
			),
			'conditionalAnswerUuid' => array(
				'type' => 'string'
			),
			'imageId' => array(
				'type' => 'integer'
			)
		),
		'parent' => array(
			'prc-quiz/question'
		),
		'supports' => array(
			'anchor' => false,
			'html' => false,
			'color' => array(
				'background' => true,
				'text' => true
			),
			'spacing' => array(
				'margin' => array(
					'top',
					'bottom'
				),
				'padding' => true
			),
			'typography' => array(
				'fontSize' => true,
				'__experimentalFontFamily' => true
			)
		),
		'usesContext' => array(
			'prc-quiz/type',
			'prc-quiz/question/type'
		),
		'textdomain' => 'answer',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css',
		'render' => 'file:./render.php'
	),
	'controller' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-quiz/controller',
		'version' => '1.0.0',
		'title' => 'Quiz Controller',
		'description' => 'This block controls all aspects of a quiz.',
		'category' => 'prc-quiz',
		'keywords' => array(
			'quiz',
			'typology'
		),
		'attributes' => array(
			'allowedBlocks' => array(
				'type' => 'array',
				'default' => array(
					'prc-quiz/pages',
					'prc-quiz/results'
				)
			),
			'type' => array(
				'type' => 'string',
				'enum' => array(
					'quiz',
					'typology'
				),
				'default' => 'quiz'
			),
			'groups' => array(
				'type' => 'boolean',
				'default' => false
			),
			'mailchimpListId' => array(
				'type' => 'string'
			),
			'gaTracking' => array(
				'type' => 'boolean',
				'default' => false
			),
			'demoBreakLabels' => array(
				'type' => 'string'
			),
			'threshold' => array(
				'type' => 'number',
				'default' => 4
			),
			'startButtonColor' => array(
				'type' => 'string',
				'default' => 'sandwisp'
			),
			'buttonColor' => array(
				'type' => 'string',
				'default' => 'cape-palliser'
			)
		),
		'providesContext' => array(
			'prc-quiz/type' => 'type',
			'prc-quiz/demo-break-labels' => 'demoBreakLabels',
			'prc-quiz/threshold' => 'threshold',
			'prc-quiz/groupsEnabled' => 'groups'
		),
		'usesContext' => array(
			'prc-quiz/isEmbedded'
		),
		'supports' => array(
			'anchor' => true,
			'html' => false,
			'color' => array(
				'background' => true,
				'text' => true,
				'link' => true
			),
			'spacing' => array(
				'blockGap' => true,
				'margin' => array(
					'top',
					'bottom'
				),
				'padding' => true,
				'__experimentalDefaultControls' => array(
					'padding' => true
				)
			),
			'typography' => array(
				'fontSize' => true,
				'__experimentalFontFamily' => true,
				'__experimentalDefaultControls' => array(
					'fontSize' => true,
					'__experimentalFontFamily' => true
				)
			)
		),
		'textdomain' => 'controller',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css',
		'viewScript' => 'file:./view/index.js',
		'viewStyle' => 'file:./view/style-index.css'
	),
	'embeddable' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-quiz/embeddable',
		'version' => '1.0.0',
		'title' => 'Quiz',
		'description' => 'Create, save, and sync quizzes to reuse across the site. Update the quiz, and the changes apply everywhere it\'s used.',
		'category' => 'prc-quiz',
		'allowedBlocks' => array(
			'prc-quiz/controller'
		),
		'keywords' => array(
			'quiz',
			'typology'
		),
		'attributes' => array(
			'ref' => array(
				'type' => 'number'
			)
		),
		'supports' => array(
			'anchor' => true,
			'html' => false
		),
		'providesContext' => array(
			'prc-quiz/isEmbedded' => 'ref'
		),
		'textdomain' => 'prc-quiz-embeddable',
		'editorScript' => 'file:./index.js',
		'render' => 'file:./render.php'
	),
	'group-results' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-quiz/group-results',
		'version' => '1.0.0',
		'title' => 'Group Results',
		'description' => 'Results for a community group as given by group id and archetype hash id',
		'category' => 'text',
		'attributes' => array(
			'allowedBlocks' => array(
				'type' => 'array'
			),
			'name' => array(
				'type' => 'string'
			),
			'total' => array(
				'type' => 'integer'
			),
			'typologyGroups' => array(
				'type' => 'string'
			),
			'answers' => array(
				'type' => 'string'
			)
		),
		'supports' => array(
			'anchor' => true,
			'html' => false,
			'multiple' => false,
			'color' => array(
				'background' => true,
				'text' => true,
				'link' => true
			),
			'spacing' => array(
				'blockGap' => true,
				'margin' => array(
					'top',
					'bottom'
				),
				'padding' => true
			),
			'typography' => array(
				'fontSize' => true,
				'__experimentalFontFamily' => true
			)
		),
		'parent' => array(
			'prc-quiz/controller'
		),
		'providesContext' => array(
			'prc-quiz/groups/results/name' => 'name',
			'prc-quiz/groups/results/typologyGroups' => 'typologyGroups',
			'prc-quiz/groups/results/answers' => 'answers',
			'prc-quiz/groups/results/total' => 'total'
		),
		'textdomain' => 'group-results',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css',
		'render' => 'file:./render.php'
	),
	'page' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-quiz/page',
		'version' => '1.0.0',
		'title' => 'Page',
		'description' => 'A page contains at least one question but may contain more. You can add aditional multimedia options here such as images, videos, or charts.',
		'category' => 'prc-quiz',
		'attributes' => array(
			'allowedBlocks' => array(
				'type' => 'array'
			),
			'introductionPage' => array(
				'type' => 'boolean',
				'default' => false
			),
			'introductionNote' => array(
				'type' => 'string'
			),
			'title' => array(
				'type' => 'string'
			),
			'uuid' => array(
				'type' => 'string'
			)
		),
		'supports' => array(
			'anchor' => true,
			'html' => false,
			'color' => array(
				'background' => true,
				'text' => true,
				'link' => true
			),
			'spacing' => array(
				'blockGap' => true,
				'margin' => array(
					'top',
					'bottom'
				),
				'padding' => true
			),
			'typography' => array(
				'fontSize' => true,
				'__experimentalFontFamily' => true
			)
		),
		'parent' => array(
			'prc-quiz/pages'
		),
		'usesContext' => array(
			'prc-quiz/groupsEnabled',
			'prc-quiz/type',
			'prc-quiz/note'
		),
		'textdomain' => 'page',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css',
		'render' => 'file:./render.php'
	),
	'pages' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-quiz/pages',
		'version' => '1.0.0',
		'title' => 'Pages',
		'category' => 'text',
		'attributes' => array(
			'orientation' => array(
				'type' => 'string',
				'enum' => array(
					'vertical',
					'horizontal'
				),
				'default' => 'vertical'
			)
		),
		'supports' => array(
			'anchor' => false,
			'html' => false,
			'multiple' => false,
			'color' => array(
				
			),
			'typography' => array(
				'fontSize' => true,
				'__experimentalFontFamily' => true
			)
		),
		'parent' => array(
			'prc-quiz/controller'
		),
		'textdomain' => 'pages',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css',
		'render' => 'file:./render.php'
	),
	'question' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-quiz/question',
		'version' => '1.0.0',
		'title' => 'Question',
		'description' => 'A question, contains a question, a set of answers, and optionally a image. Choose from single, multiple choice, or thermometer (if quiz is a typology) question types.',
		'category' => 'prc-quiz',
		'attributes' => array(
			'allowedBlocks' => array(
				'type' => 'array'
			),
			'question' => array(
				'type' => 'string',
				'default' => 'Question text here...'
			),
			'internalId' => array(
				'type' => 'string'
			),
			'randomizeAnswers' => array(
				'type' => 'boolean',
				'default' => false
			),
			'type' => array(
				'type' => 'string',
				'default' => 'single'
			),
			'conditionalDisplay' => array(
				'type' => 'boolean',
				'default' => false
			),
			'conditionalAnswerUuid' => array(
				'type' => 'string'
			),
			'thermometerValues' => array(
				'type' => 'string'
			),
			'demoBreakValues' => array(
				'type' => 'string'
			),
			'uuid' => array(
				'type' => 'string'
			),
			'imageId' => array(
				'type' => 'integer'
			),
			'imageOnTop' => array(
				'type' => 'boolean',
				'default' => false
			)
		),
		'supports' => array(
			'anchor' => true,
			'html' => false,
			'color' => array(
				'background' => true,
				'text' => true,
				'link' => true
			),
			'spacing' => array(
				'blockGap' => true,
				'margin' => array(
					'top',
					'bottom'
				),
				'padding' => true
			),
			'typography' => array(
				'fontSize' => true,
				'__experimentalFontFamily' => true
			)
		),
		'parent' => array(
			'prc-quiz/page'
		),
		'providesContext' => array(
			'prc-quiz/question/type' => 'type'
		),
		'usesContext' => array(
			'prc-quiz/type',
			'prc-quiz/demo-break-labels'
		),
		'textdomain' => 'question',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css',
		'render' => 'file:./render.php'
	),
	'result-follow-us' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-quiz/result-follow-us',
		'version' => '1.0.0',
		'title' => 'Result Follow Us',
		'category' => 'prc-quiz',
		'attributes' => array(
			
		),
		'supports' => array(
			'anchor' => true,
			'html' => false,
			'color' => array(
				'background' => true,
				'text' => true,
				'link' => true
			),
			'spacing' => array(
				'blockGap' => true,
				'margin' => array(
					'top',
					'bottom'
				),
				'padding' => true
			),
			'typography' => array(
				'fontSize' => true,
				'__experimentalFontFamily' => true
			)
		),
		'parent' => array(
			'prc-quiz/results'
		),
		'textdomain' => 'result-follow-us',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css',
		'render' => 'file:./render.php'
	),
	'result-histogram' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-quiz/result-histogram',
		'version' => '1.0.0',
		'title' => 'Result Histogram',
		'category' => 'prc-quiz',
		'description' => 'Histogram representing distribution of scores.',
		'attributes' => array(
			'message' => array(
				'type' => 'string'
			),
			'histogramData' => array(
				'type' => 'string'
			),
			'width' => array(
				'type' => 'number',
				'default' => 640
			),
			'height' => array(
				'type' => 'number',
				'default' => 300
			),
			'barWidth' => array(
				'type' => 'number',
				'default' => 30
			),
			'barLabelPosition' => array(
				'type' => 'number',
				'default' => 0
			),
			'barLabelCutoff' => array(
				'type' => 'number',
				'default' => 0
			),
			'barColor' => array(
				'type' => 'string',
				'default' => 'oatmeal'
			),
			'isHighlightedColor' => array(
				'type' => 'string',
				'default' => 'mustard'
			),
			'yAxisDomain' => array(
				'type' => 'number',
				'default' => 50
			),
			'xAxisLabel' => array(
				'type' => 'string'
			)
		),
		'supports' => array(
			'anchor' => true,
			'html' => false,
			'spacing' => array(
				'blockGap' => true,
				'margin' => array(
					'top',
					'bottom'
				),
				'padding' => true
			),
			'typography' => array(
				'fontSize' => true,
				'__experimentalFontFamily' => true
			)
		),
		'parent' => array(
			'prc-quiz/results'
		),
		'usesContext' => array(
			'prc-quiz/results/score'
		),
		'textdomain' => 'result-histogram',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'viewScript' => 'file:./view.js',
		'style' => 'file:./style-index.css',
		'render' => 'file:./render.php'
	),
	'result-score' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-quiz/result-score',
		'version' => '1.0.0',
		'title' => 'Results Score',
		'category' => 'prc-quiz',
		'description' => 'Your score from this quiz.',
		'attributes' => array(
			'numberOfQuestions' => array(
				'type' => 'string'
			),
			'questionsToCheck' => array(
				'type' => 'array'
			),
			'uuid' => array(
				'type' => 'string'
			)
		),
		'supports' => array(
			'anchor' => true,
			'html' => false,
			'multiple' => false,
			'color' => array(
				'background' => true,
				'text' => true
			),
			'spacing' => array(
				'margin' => array(
					'top',
					'bottom'
				),
				'padding' => true
			),
			'typography' => array(
				'fontSize' => true,
				'__experimentalFontFamily' => true
			)
		),
		'parent' => array(
			'prc-quiz/results'
		),
		'usesContext' => array(
			'prc-quiz/results/score'
		),
		'textdomain' => 'result-score',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css',
		'render' => 'file:./render.php'
	),
	'result-table' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-quiz/result-table',
		'version' => '1.0.0',
		'title' => 'Result Table',
		'category' => 'prc-quiz',
		'keywords' => array(
			'table',
			'results',
			'results table',
			'quiz table'
		),
		'attributes' => array(
			'rowBackgroundColor' => array(
				'type' => 'string'
			),
			'altRowBackgroundColor' => array(
				'type' => 'string'
			),
			'rowTextColor' => array(
				'type' => 'string'
			),
			'altRowTextColor' => array(
				'type' => 'string'
			)
		),
		'supports' => array(
			'anchor' => true,
			'html' => false,
			'align' => array(
				'wide',
				'full'
			),
			'spacing' => array(
				'margin' => array(
					'top',
					'bottom'
				),
				'padding' => true
			),
			'typography' => array(
				'fontSize' => true,
				'lineHeight' => true,
				'__experimentalFontFamily' => true,
				'__experimentalTextDecoration' => true,
				'__experimentalFontStyle' => true,
				'__experimentalFontWeight' => true,
				'__experimentalLetterSpacing' => true,
				'__experimentalTextTransform' => true,
				'__experimentalDefaultControls' => array(
					'fontSize' => true
				)
			)
		),
		'parent' => array(
			'prc-quiz/results'
		),
		'usesContext' => array(
			'prc-quiz/results/score',
			'prc-quiz/results/submissionData'
		),
		'textdomain' => 'result-table',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css'
	),
	'results' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-quiz/results',
		'version' => '1.0.0',
		'title' => 'Results',
		'category' => 'prc-quiz',
		'attributes' => array(
			'allowedBlocks' => array(
				'type' => 'array'
			),
			'score' => array(
				'type' => 'string'
			),
			'submission' => array(
				'type' => 'string'
			)
		),
		'supports' => array(
			'anchor' => true,
			'html' => false,
			'multiple' => false,
			'customClassName' => true,
			'align' => array(
				'wide',
				'full',
				'center'
			),
			'color' => array(
				'background' => true,
				'text' => true,
				'link' => true
			),
			'spacing' => array(
				'blockGap' => true,
				'margin' => array(
					'top',
					'bottom'
				),
				'padding' => true
			),
			'typography' => array(
				'fontSize' => true,
				'__experimentalFontFamily' => true
			)
		),
		'parent' => array(
			'prc-quiz/controller'
		),
		'usesContext' => array(
			'prc-quiz/type'
		),
		'providesContext' => array(
			'prc-quiz/results/score' => 'score',
			'prc-quiz/results/submissionData' => 'submission'
		),
		'textdomain' => 'results',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css',
		'render' => 'file:./render.php'
	)
);
