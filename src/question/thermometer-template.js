export default {
	questionAttributes: {
		style: {
			spacing: {
				blockGap: 'var:preset|spacing|30',
			},
		},
		layout: {
			type: 'flex',
			orientation: 'horizontal',
			verticalAlignment: 'center',
			justifyContent: 'space-between',
			flexWrap: 'wrap',
		},
	},
	questionInnerBlocks: [
		[
			'core/paragraph',
			{
				metadata: {
					bindings: {
						content: {
							source: 'prc-quiz/question',
						},
					},
				},
				fontSize: 'medium',
			},
			[],
		],
		[
			'core/group',
			{
				style: {
					spacing: {
						blockGap: '0',
					},
					layout: {
						selfStretch: 'fixed',
						flexSize: '100%',
					},
				},
				layout: {
					type: 'flex',
					flexWrap: 'nowrap',
					justifyContent: 'space-between',
				},
			},
			[
				[
					'prc-quiz/answer',
					{
						answer: '0',
						points: 0,
						style: {
							layout: {
								selfStretch: 'fixed',
								flexSize: '10%',
							},
							border: {
								right: {
									width: '0px',
									style: 'none',
								},
							},
						},
					},
					[
						[
							'core/paragraph',
							{
								metadata: {
									bindings: {
										content: {
											source: 'prc-quiz/answer',
										},
									},
								},
							},
							[],
						],
					],
				],
				[
					'prc-quiz/answer',
					{
						answer: '10',
						points: 1,
						style: {
							layout: {
								selfStretch: 'fixed',
								flexSize: '10%',
							},
							border: {
								left: {
									width: '0px',
									style: 'none',
								},
								top: {},
								right: {
									width: '0px',
									style: 'none',
								},
								bottom: {},
							},
						},
					},
					[
						[
							'core/paragraph',
							{
								placeholder: 'Start typing your answer here...',
								metadata: {
									bindings: {
										content: {
											source: 'prc-quiz/answer',
										},
									},
								},
							},
							[],
						],
					],
				],
				[
					'prc-quiz/answer',
					{
						answer: '20',
						points: 2,
						style: {
							layout: {
								selfStretch: 'fixed',
								flexSize: '10%',
							},
							border: {
								left: {
									width: '0px',
									style: 'none',
								},
								top: {},
								right: {
									width: '0px',
									style: 'none',
								},
								bottom: {},
							},
						},
					},
					[
						[
							'core/paragraph',
							{
								placeholder: 'Start typing your answer here...',
								metadata: {
									bindings: {
										content: {
											source: 'prc-quiz/answer',
										},
									},
								},
								style: {
									layout: {
										selfStretch: 'fixed',
										flexSize: '10%',
									},
								},
							},
							[],
						],
					],
				],
				[
					'prc-quiz/answer',
					{
						answer: '30',
						points: 3,
						style: {
							layout: {
								selfStretch: 'fixed',
								flexSize: '10%',
							},
							border: {
								left: {
									width: '0px',
									style: 'none',
								},
								top: {},
								right: {
									width: '0px',
									style: 'none',
								},
								bottom: {},
							},
						},
					},
					[
						[
							'core/paragraph',
							{
								placeholder: 'Start typing your answer here...',
								metadata: {
									bindings: {
										content: {
											source: 'prc-quiz/answer',
										},
									},
								},
							},
							[],
						],
					],
				],
				[
					'prc-quiz/answer',
					{
						answer: '40',
						points: 4,
						style: {
							layout: {
								selfStretch: 'fixed',
								flexSize: '10%',
							},
							border: {
								left: {
									width: '0px',
									style: 'none',
								},
								top: {},
								right: {
									width: '0px',
									style: 'none',
								},
								bottom: {},
							},
						},
					},
					[
						[
							'core/paragraph',
							{
								placeholder: 'Start typing your answer here...',
								metadata: {
									bindings: {
										content: {
											source: 'prc-quiz/answer',
										},
									},
								},
							},
							[],
						],
					],
				],
				[
					'prc-quiz/answer',
					{
						answer: '50',
						points: 5,
						style: {
							layout: {
								selfStretch: 'fixed',
								flexSize: '10%',
							},
							border: {
								left: {
									width: '0px',
									style: 'none',
								},
								top: {},
								right: {
									width: '0px',
									style: 'none',
								},
								bottom: {},
							},
						},
					},
					[
						[
							'core/paragraph',
							{
								placeholder: 'Start typing your answer here...',
								metadata: {
									bindings: {
										content: {
											source: 'prc-quiz/answer',
										},
									},
								},
							},
							[],
						],
					],
				],
				[
					'prc-quiz/answer',
					{
						answer: '60',
						points: 6,
						style: {
							layout: {
								selfStretch: 'fixed',
								flexSize: '10%',
							},
							border: {
								left: {
									width: '0px',
									style: 'none',
								},
								top: {},
								right: {
									width: '0px',
									style: 'none',
								},
								bottom: {},
							},
						},
					},
					[
						[
							'core/paragraph',
							{
								placeholder: 'Start typing your answer here...',
								metadata: {
									bindings: {
										content: {
											source: 'prc-quiz/answer',
										},
									},
								},
							},
							[],
						],
					],
				],
				[
					'prc-quiz/answer',
					{
						answer: '70',
						points: 7,
						style: {
							layout: {
								selfStretch: 'fixed',
								flexSize: '10%',
							},
							border: {
								left: {
									width: '0px',
									style: 'none',
								},
								top: {},
								right: {
									width: '0px',
									style: 'none',
								},
								bottom: {},
							},
						},
					},
					[
						[
							'core/paragraph',
							{
								placeholder: 'Start typing your answer here...',
								metadata: {
									bindings: {
										content: {
											source: 'prc-quiz/answer',
										},
									},
								},
							},
							[],
						],
					],
				],
				[
					'prc-quiz/answer',
					{
						answer: '80',
						points: 8,
						style: {
							layout: {
								selfStretch: 'fixed',
								flexSize: '10%',
							},
							border: {
								left: {
									width: '0px',
									style: 'none',
								},
								top: {},
								right: {
									width: '0px',
									style: 'none',
								},
								bottom: {},
							},
						},
					},
					[
						[
							'core/paragraph',
							{
								placeholder: 'Start typing your answer here...',
								metadata: {
									bindings: {
										content: {
											source: 'prc-quiz/answer',
										},
									},
								},
							},
							[],
						],
					],
				],
				[
					'prc-quiz/answer',
					{
						answer: '90',
						points: 9,
						style: {
							layout: {
								selfStretch: 'fixed',
								flexSize: '10%',
							},
							border: {
								left: {
									width: '0px',
									style: 'none',
								},
								top: {},
								right: {
									width: '0px',
									style: 'none',
								},
								bottom: {},
							},
						},
					},
					[
						[
							'core/paragraph',
							{
								placeholder: 'Start typing your answer here...',
								metadata: {
									bindings: {
										content: {
											source: 'prc-quiz/answer',
										},
									},
								},
							},
							[],
						],
					],
				],
				[
					'prc-quiz/answer',
					{
						answer: '100',
						points: 10,
						style: {
							layout: {
								selfStretch: 'fixed',
								flexSize: '10%',
							},
							border: {
								left: {
									width: '0px',
									style: 'none',
								},
								top: {},
								bottom: {},
							},
						},
					},
					[
						[
							'core/paragraph',
							{
								placeholder: 'Start typing your answer here...',
								metadata: {
									bindings: {
										content: {
											source: 'prc-quiz/answer',
										},
									},
								},
							},
							[],
						],
					],
				],
			],
		],
	],
};
