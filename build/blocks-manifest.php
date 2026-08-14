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
		'category' => 'prc-quiz',
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
				'type' => array(
					'boolean',
					'null'
				)
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
	'bindings' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-quiz/editor-bindings',
		'version' => '1.0.0',
		'title' => 'Quiz Editor Bindings',
		'editorScript' => 'file:./index.js'
	),
	'controller' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-quiz/controller',
		'version' => '4.0.0',
		'title' => 'Quiz Controller',
		'description' => 'This block controls all aspects of a quiz.',
		'category' => 'prc-quiz',
		'keywords' => array(
			'quiz',
			'typology'
		),
		'allowedBlocks' => array(
			'core/group',
			'prc-quiz/pages',
			'prc-quiz/results',
			'prc-quiz/group-results',
			'prc-quiz-cast/host',
			'prc-quiz-cast/player'
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
					'scrollable',
					'fluid'
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
			),
			'liveFeedback' => array(
				'type' => 'boolean',
				'default' => false
			),
			'correctOutcomeLabel' => array(
				'type' => 'string',
				'default' => 'Correct'
			),
			'incorrectOutcomeLabel' => array(
				'type' => 'string',
				'default' => 'Incorrect'
			),
			'unsureOutcomeLabel' => array(
				'type' => 'string',
				'default' => 'Not sure'
			),
			'scoreBuckets' => array(
				'type' => 'string',
				'default' => '[]'
			)
		),
		'providesContext' => array(
			'prc-quiz/type' => 'type',
			'prc-quiz/display-type' => 'displayType',
			'prc-quiz/demo-break-labels' => 'demoBreakLabels',
			'prc-quiz/threshold' => 'threshold',
			'prc-quiz/groupsEnabled' => 'groupsEnabled',
			'prc-quiz/allowSubmissions' => 'allowSubmissions',
			'prc-quiz/liveFeedback' => 'liveFeedback',
			'prc-quiz/score-buckets' => 'scoreBuckets'
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
	'group-results' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-quiz/group-results',
		'version' => '4.0.0',
		'title' => 'Group Results',
		'description' => 'Results for a community group. Without this block, group creation will be disabled, it is required for group quizzes to have a separate version of the results for the community group.',
		'category' => 'prc-quiz',
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
		'category' => 'prc-quiz',
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
			'prc-platform/public-behavior-quiz-dial',
			'prc-block/form'
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
			'listView' => true,
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
		'category' => 'prc-quiz',
		'allowedBlocks' => array(
			'prc-quiz/progress-bar',
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
		'textdomain' => 'pages',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css',
		'viewScriptModule' => 'file:./view.js'
	),
	'progress-bar' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-quiz/progress-bar',
		'version' => '1.0.0',
		'title' => 'Quiz Progress Bar',
		'description' => 'Displays quiz completion progress based on answered questions.',
		'category' => 'prc-quiz',
		'ancestor' => array(
			'prc-quiz/controller'
		),
		'supports' => array(
			'anchor' => true,
			'html' => false,
			'multiple' => false,
			'interactivity' => true,
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
			'prc-quiz/id'
		),
		'textdomain' => 'progress-bar',
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
		'category' => 'prc-quiz',
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
		'version' => '4.1',
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
				'type' => 'string',
				'default' => 'Score'
			),
			'showScoreSummary' => array(
				'type' => 'boolean',
				'default' => true
			),
			'comparisonText' => array(
				'type' => 'string',
				'default' => 'You scored better than {betterThan} of the public, below {lowerThan} of the public and the same as {sameAs}.'
			),
			'topPerformerText' => array(
				'type' => 'string',
				'default' => ''
			),
			'lowerPerformerText' => array(
				'type' => 'string',
				'default' => ''
			),
			'topPerformerThreshold' => array(
				'type' => 'number',
				'default' => 75
			),
			'lowerPerformerThreshold' => array(
				'type' => 'number',
				'default' => 25
			)
		),
		'supports' => array(
			'anchor' => true,
			'html' => false,
			'interactivity' => true,
			'align' => true,
			'alignWide' => true,
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
		'category' => 'prc-quiz',
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
			'interactivity' => true,
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
			),
			'iconSize' => array(
				'type' => 'number',
				'default' => 1
			),
			'iconColor' => array(
				'type' => 'string',
				'default' => 'ui-black'
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
			'prc-quiz/demo-break-labels'
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
		'category' => 'prc-quiz',
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
	),
	'synced-quiz' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'prc-quiz/synced-quiz',
		'version' => '4.0',
		'title' => 'Synced Quiz',
		'description' => 'Create, save, and sync quizzes to reuse across the site. Update the quiz, and the changes apply everywhere it\'s used.',
		'category' => 'prc-quiz',
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
			'html' => false,
			'align' => true
		),
		'providesContext' => array(
			'prc-quiz/isEmbedded' => 'ref'
		),
		'textdomain' => 'prc-quiz-synced-quiz',
		'editorScript' => 'file:./index.js'
	)
);
