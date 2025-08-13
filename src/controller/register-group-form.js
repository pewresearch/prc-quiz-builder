/**
 * WordPress Dependencies
 */
import { dispatch } from '@wordpress/data';
import { registerBlockVariation } from '@wordpress/blocks';

/**
 * Internal Dependencies
 */
import icon from '../group-results/icon';

/**
 * Register the forms with prc-block/form provider.
 */
export default function registerGroupForm() {
	const newForms = [
		{
			label: 'Create Group',
			description: 'Create a group quiz',
			namespace: 'prc-quiz/controller',
			action: 'createGroup',
			method: 'api',
			template: [
				[
					'prc-block/form-input-text',
					{
						type: 'text',
						label: 'Group Name',
						placeholder: 'Enter your group name',
						metadata: {
							name: 'groupName',
						},
					},
				],
				[
					'prc-block/form-submit',
					{
						label: 'Create',
					},
				],
				[
					'prc-block/form-message',
					{},
					[['core/paragraph', { content: 'Group Created!' }]],
				],
			],
		},
	];
	newForms.forEach((form) => {
		dispatch('prc-block-library/forms').registerForm(form);
	});

	registerBlockVariation('prc-block/dialog', {
		icon,
		title: 'Group Quiz Form',
		description: 'Create a group quiz form',
		attributes: {},
		innerBlocks: [
			['prc-block/dialog-trigger', {}, [['core/button', {}, []]]],
			[
				'prc-block/dialog-element',
				{
					backdropColor: 'ui-gray-dark',
					borderColor: 'ui-gray-very-dark',
					backgroundColor: 'white',
					fontFamily: 'sans-serif',
					style: {
						spacing: {
							padding: {
								top: 'var:preset|spacing|30',
								bottom: 'var:preset|spacing|30',
								left: 'var:preset|spacing|30',
								right: 'var:preset|spacing|30',
							},
						},
						shadow: 'var:preset|shadow|deep',
						border: {
							radius: '5px',
							width: '1px',
						},
					},
				},
				[
					[
						'core/group',
						{
							style: {
								spacing: {
									blockGap: 'var:preset|spacing|30',
									padding: {
										top: 'var:preset|spacing|30',
										bottom: 'var:preset|spacing|30',
									},
									margin: {
										bottom: 'var:preset|spacing|50',
									},
								},
							},
							layout: {
								type: 'flex',
								orientation: 'vertical',
							},
						},
						[
							[
								'core/paragraph',
								{
									style: {
										typography: {
											lineHeight: '1',
										},
									},
								},
								[],
							],
							[
								'core/post-title',
								{
									style: {
										spacing: {
											padding: {
												top: '0',
												bottom: '0',
												left: '0',
												right: '0',
											},
											margin: {
												top: '0',
												bottom: '0',
											},
										},
										typography: {
											lineHeight: '1',
										},
									},
									fontSize: 'medium',
									fontFamily: 'sans-serif',
								},
								[],
							],
						],
					],
					[
						'prc-user-accounts/content-gate',
						{},
						[
							[
								'core/group',
								{
									layout: {
										type: 'default',
									},
								},
								[
									[
										'prc-block/form',
										{
											namespace: 'prc-quiz/controller',
											action: 'createGroup',
											layout: {
												type: 'constrained',
												orientation: 'vertical',
												verticalAlignment: 'center',
												allowOrientation: true,
												contentSize: '420px',
												justifyContent: 'left',
											},
											interactiveNamespace:
												'prc-quiz/controller',
										},
										[
											[
												'prc-block/form-input-text',
												{
													required: true,
													layout: {
														type: 'flex',
														orientation:
															'horizontal',
														verticalAlignment:
															'center',
														allowOrientation: true,
													},
													metadata: {
														name: 'groupName',
													},
												},
												[],
											],
											[
												'prc-block/form-submit',
												{},
												[
													[
														'core/button',
														{
															tagName: 'button',
															type: 'submit',
														},
														[],
													],
													[
														'prc-block/form-captcha',
														{},
														[],
													],
												],
											],
											[
												'prc-block/form-message',
												{},
												[['core/paragraph', {}, []]],
											],
										],
									],
								],
							],
						],
					],
				],
			],
		],
	});

	// TODO: Register a variation of the dialog block that includes a group sign up form.
}
