/**
 * WordPress Dependencies
 */
import { dispatch } from '@wordpress/data';

const groupUrlCopyField = [
	'prc-block/form-input-text',
	{
		type: 'url',
		label: 'Share this link',
		displayLabel: true,
		responseKey: 'group_url',
		copyToClipboard: true,
		metadata: { name: 'groupUrl' },
	},
	[],
];

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
						metadata: { name: 'groupName' },
					},
				],
				['prc-block/form-submit', { label: 'Create' }],
				[
					'prc-block/form-message',
					{},
					[
						['core/paragraph', { content: 'Group Created!' }],
						groupUrlCopyField,
					],
				],
			],
		},
		{
			label: 'Create Group from Results',
			description:
				'Create a group quiz from the results page, seeding it with your own submission',
			namespace: 'prc-quiz/controller',
			action: 'createGroupFromResults',
			method: 'api',
			template: [
				[
					'prc-block/form-input-text',
					{
						type: 'text',
						label: 'Group Name',
						placeholder: 'Enter your group name',
						metadata: { name: 'groupName' },
					},
				],
				['prc-block/form-submit', { label: 'Create Group' }],
				[
					'prc-block/form-message',
					{},
					[
						['core/paragraph', { content: 'Group Created!' }],
						groupUrlCopyField,
					],
				],
			],
		},
	];

	newForms.forEach((form) => {
		dispatch('prc-block-library/forms').registerForm(form);
	});
}
