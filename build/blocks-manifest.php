<?php
// This file is generated. Do not modify it manually.
return array(
	'answer' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-quiz/answer',
		'version' => '4.0',
		'title' => 'Answer',
		'description' => 'An answer choice for a question.',
		'category' => 'quiz',
		'allowedBlocks' => array(
			'core/paragraph',
			'core/heading',
			'core/list',
			'core/image',
			'core/video',
			'videopress/video',
			'core/group'
		),
		'attributes' => array(
			'answer' => array(
				'type' => 'string'
			),
			'resultsLabel' => array(
				'type' => 'string'
			),
			'points' => array(
				'type' => 'number',
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
			)
		),
		'parent' => array(
			'prc-quiz/question'
		),
		'supports' => array(
			'anchor' => false,
			'html' => false,
			'interactivity' => true,
			'color' => array(
				'background' => true,
				'text' => true,
				'link' => true,
				'button' => true
			),
			'__experimentalBorder' => array(
				'color' => true,
				'radius' => true,
				'style' => true,
				'width' => true
			),
			'layout' => array(
				'type' => 'flex',
				'default' => array(
					'type' => 'flex',
					'orientation' => 'vertical',
					'verticalAlignment' => 'center',
					'justifyContent' => 'stretch',
					'allowOrientation' => true
				),
				'allowInheriting' => true,
				'allowVerticalAlignment' => true,
				'allowJustification' => true,
				'allowOrientation' => true,
				'allowSizingOnChildren' => true
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
			'prc-quiz/id',
			'prc-quiz/type',
			'prc-quiz/question/type',
			'prc-quiz/question/uuid',
			'prc-quiz/uuids'
		),
		'providesContext' => array(
			'prc-quiz/answer/text' => 'answer',
			'prc-quiz/answer/correct' => 'correct',
			'prc-quiz/answer/uuid' => 'uuid',
			'prc-quiz/answer/points' => 'points'
		),
		'textdomain' => 'answer',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css',
		'viewScriptModule' => 'file:./view.js'
	),
	'controller' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-quiz/controller',
		'version' => '4.0.0',
		'title' => 'Quiz Controller',
		'description' => 'This block controls all aspects of a quiz.',
		'category' => 'quiz',
		'keywords' => array(
			'quiz',
			'typology'
		),
		'allowedBlocks' => array(
			'prc-quiz/pages',
			'prc-quiz/results',
			'prc-quiz/group-results'
		),
		'attributes' => array(
			'type' => array(
				'type' => 'string',
				'enum' => array(
					'quiz',
					'typology',
					'freeform'
				),
				'default' => 'quiz'
			),
			'displayType' => array(
				'type' => 'string',
				'enum' => array(
					'paged',
					'scrollable'
				),
				'default' => 'paged'
			),
			'allowSubmissions' => array(
				'type' => 'boolean',
				'default' => true
			),
			'groupsEnabled' => array(
				'type' => 'boolean',
				'default' => false
			),
			'mailchimpListId' => array(
				'type' => 'string'
			),
			'demoBreakLabels' => array(
				'type' => 'string'
			),
			'threshold' => array(
				'type' => 'number',
				'default' => 4
			)
		),
		'providesContext' => array(
			'prc-quiz/type' => 'type',
			'prc-quiz/display-type' => 'displayType',
			'prc-quiz/demo-break-labels' => 'demoBreakLabels',
			'prc-quiz/threshold' => 'threshold',
			'prc-quiz/groupsEnabled' => 'groupsEnabled',
			'prc-quiz/allowSubmissions' => 'allowSubmissions'
		),
		'usesContext' => array(
			'prc-quiz/isEmbedded'
		),
		'supports' => array(
			'anchor' => true,
			'html' => false,
			'interactivity' => true,
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
		'editorScript' => array(
			'ais-ai',
			'file:./index.js'
		),
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css',
		'viewStyle' => 'file:./view/style-index.css',
		'viewScriptModule' => 'file:./view.js'
	),
	'embeddable' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-quiz/embeddable',
		'version' => '4.0',
		'title' => 'Quiz',
		'description' => 'Create, save, and sync quizzes to reuse across the site. Update the quiz, and the changes apply everywhere it\'s used.',
		'category' => 'quiz',
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
		'version' => '4.0.0',
		'title' => 'Group Results',
		'description' => 'Results for a community group. Without this block, group creation will be disabled, it is required for group quizzes to have a separate version of the results for the community group.',
		'category' => 'quiz',
		'attributes' => array(
			
		),
		'supports' => array(
			'anchor' => true,
			'html' => false,
			'multiple' => false,
			'interactivity' => true,
			'animations' => true,
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
			'prc-quiz/type',
			'prc-quiz/groupsEnabled',
			'prc-quiz/quizId'
		),
		'textdomain' => 'group-results',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css',
		'viewScriptModule' => 'file:./view.js'
	),
	'page' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-quiz/page',
		'version' => '4.0',
		'title' => 'Page',
		'description' => 'A page contains at least one question but may contain more. You can add aditional multimedia options here such as images, videos, or charts.',
		'category' => 'quiz',
		'allowedBlocks' => array(
			'prc-quiz/question',
			'core/block',
			'core/pattern',
			'core/image',
			'core/video',
			'videopress/video',
			'core/group',
			'core/paragraph',
			'core/list',
			'core/heading',
			'core/buttons',
			'core/post-title',
			'prc-block/animation',
			'prc-block/dialog',
			'prc-block/bylines-display',
			'prc-block/bylines-query',
			'prc-block/related-query',
			'prc-platform/public-behavior-quiz-results',
			'prc-platform/public-behavior-quiz-dial'
		),
		'attributes' => array(
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
			'interactivity' => true,
			'animations' => true,
			'color' => array(
				'background' => true,
				'text' => true,
				'link' => true
			),
			'align' => array(
				'wide',
				'full'
			),
			'layout' => array(
				'default' => array(
					'type' => 'flex',
					'orientation' => 'vertical',
					'verticalAlignment' => 'center',
					'justifyContent' => 'stretch'
				),
				'allowSwitching' => true,
				'allowInheriting' => true,
				'allowVerticalAlignment' => true,
				'allowJustification' => true,
				'allowOrientation' => true,
				'allowSizingOnChildren' => true
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
			'prc-quiz/display-type',
			'prc-quiz/pages',
			'prc-quiz/uuids'
		),
		'providesContext' => array(
			'prc-quiz/page/title' => 'title',
			'prc-quiz/page/introductionNote' => 'introductionNote',
			'prc-quiz/page/uuid' => 'uuid'
		),
		'textdomain' => 'page',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css',
		'viewScriptModule' => 'file:./view.js'
	),
	'pages' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-quiz/pages',
		'version' => '4.0',
		'title' => 'Pages',
		'category' => 'quiz',
		'allowedBlocks' => array(
			'prc-quiz/page'
		),
		'attributes' => array(
			
		),
		'supports' => array(
			'anchor' => false,
			'html' => false,
			'multiple' => false,
			'interactivity' => true,
			'color' => array(
				'background' => true,
				'text' => true,
				'link' => true,
				'button' => true
			),
			'layout' => array(
				'default' => array(
					'type' => 'constrained'
				),
				'allowSwitching' => true,
				'allowInheriting' => true,
				'allowVerticalAlignment' => true,
				'allowJustification' => true,
				'allowOrientation' => false,
				'allowSizingOnChildren' => true
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
		'viewScriptModule' => 'file:./view.js'
	),
	'question' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-quiz/question',
		'version' => '4.0',
		'title' => 'Question',
		'description' => 'A question contains a set of answers, and other visual blocks. Choose from single, multiple choice, or thermometer question types.',
		'category' => 'quiz',
		'allowedBlocks' => array(
			'prc-quiz/answer',
			'core/group',
			'core/paragraph',
			'core/heading',
			'core/image',
			'core/list',
			'core/video',
			'videopress/video'
		),
		'attributes' => array(
			'question' => array(
				'type' => 'string'
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
				'default' => 'single',
				'enum' => array(
					'single',
					'multiple',
					'thermometer'
				)
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
			)
		),
		'supports' => array(
			'anchor' => true,
			'html' => false,
			'interactivity' => true,
			'color' => array(
				'background' => true,
				'text' => true,
				'link' => true,
				'button' => true
			),
			'layout' => array(
				'default' => array(
					'type' => 'flex',
					'orientation' => 'vertical',
					'verticalAlignment' => 'center',
					'justifyContent' => 'stretch'
				),
				'allowSwitching' => true,
				'allowInheriting' => true,
				'allowVerticalAlignment' => true,
				'allowJustification' => true,
				'allowOrientation' => true,
				'allowSizingOnChildren' => true
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
			'prc-quiz/question/type' => 'type',
			'prc-quiz/question/uuid' => 'uuid',
			'prc-quiz/question/text' => 'question'
		),
		'usesContext' => array(
			'prc-quiz/id',
			'prc-quiz/type',
			'prc-quiz/demo-break-labels',
			'prc-quiz/uuids'
		),
		'textdomain' => 'question',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css',
		'viewScriptModule' => 'file:./view.js'
	),
	'result-histogram' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-quiz/result-histogram',
		'version' => '4.0',
		'title' => 'Result Histogram',
		'category' => 'quiz',
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
			'interactivity' => true,
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
		'ancestor' => array(
			'prc-quiz/results'
		),
		'usesContext' => array(
			'prc-quiz/id',
			'prc-quiz/type'
		),
		'textdomain' => 'result-histogram',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'viewScriptModule' => 'file:./view.js',
		'style' => 'file:./style-index.css'
	),
	'result-score' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-quiz/result-score',
		'version' => '4.0',
		'title' => 'Results Score',
		'category' => 'quiz',
		'description' => 'Your score from this quiz.',
		'attributes' => array(
			'numberOfQuestions' => array(
				'type' => 'string'
			),
			'questionsToCheck' => array(
				'type' => 'array'
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
		'style' => 'file:./style-index.css'
	),
	'result-table' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-quiz/result-table',
		'version' => '4.0.1',
		'title' => 'Result Table',
		'category' => 'quiz',
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
			'interactivity' => true,
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
		'style' => 'file:./style-index.css',
		'viewScriptModule' => 'file:./view.js'
	),
	'results' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-quiz/results',
		'version' => '4.0',
		'title' => 'Results',
		'category' => 'quiz',
		'attributes' => array(
			
		),
		'supports' => array(
			'anchor' => true,
			'html' => false,
			'multiple' => false,
			'interactivity' => true,
			'animations' => true,
			'align' => array(
				'wide',
				'full',
				'center'
			),
			'color' => array(
				'background' => true,
				'text' => true,
				'link' => true,
				'button' => true
			),
			'layout' => array(
				'default' => array(
					'type' => 'constrained'
				),
				'allowSwitching' => true,
				'allowInheriting' => true,
				'allowVerticalAlignment' => true,
				'allowJustification' => true,
				'allowOrientation' => false,
				'allowSizingOnChildren' => true
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
			'prc-quiz/type',
			'prc-quiz/id'
		),
		'textdomain' => 'results',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css',
		'viewScriptModule' => 'file:./view.js'
	)
);
