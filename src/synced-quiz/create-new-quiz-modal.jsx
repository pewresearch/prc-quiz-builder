/**
 * WordPress Dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useMemo } from '@wordpress/element';
import {
	SelectControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import {
	createBlock,
	createBlocksFromInnerBlocksTemplate,
	serialize,
	store as blocksStore,
} from '@wordpress/blocks';
import apiFetch from '@wordpress/api-fetch';
import { SyncedEntityCreateModal } from '@prc/components';

/**
 * Internal Dependencies
 */
import {
	DEFAULT_BLOCK,
	POST_TYPE_LABEL,
	POST_TYPE_REST_BASE,
} from './constants';

function serializeVariationContent(variations, variationName) {
	const matchedVariation = variations.find(
		(variation) => variation.name === variationName
	);

	if (!matchedVariation) {
		return null;
	}

	const { attributes, innerBlocks } = matchedVariation;
	const newBlock = createBlock(
		DEFAULT_BLOCK,
		attributes,
		createBlocksFromInnerBlocksTemplate(innerBlocks)
	);

	return serialize(newBlock);
}

export default function CreateNewQuizModal(props) {
	const { variations } = useSelect((select) => {
		const { getBlockVariations } = select(blocksStore);
		return {
			variations: getBlockVariations(DEFAULT_BLOCK),
		};
	}, []);

	const variationOptions = useMemo(() => {
		const options = variations.map((variation) => ({
			label: variation.title,
			value: variation.name,
		}));

		options.unshift({
			label: __('Select a variation', 'prc-quiz-synced-quiz'),
			value: '',
		});

		return options;
	}, [variations]);

	const createRecord = useCallback(
		async (title, extras) => {
			const content = serializeVariationContent(
				variations,
				extras?.variation
			);

			if (!content) {
				throw new Error(
					__(
						'Could not build quiz content from the selected variation.',
						'prc-quiz-synced-quiz'
					)
				);
			}

			const entity = await apiFetch({
				path: `/wp/v2/${POST_TYPE_REST_BASE}`,
				method: 'POST',
				data: {
					title,
					status: 'publish',
					content,
				},
			});

			return entity?.id;
		},
		[variations]
	);

	return (
		<SyncedEntityCreateModal
			{...props}
			title={sprintf(
				/* translators: %s: post type label (Quiz) */
				__('Add New %s', 'prc-quiz-synced-quiz'),
				POST_TYPE_LABEL
			)}
			description={sprintf(
				/* translators: %s: post type label (Quiz) */
				__(
					'Give your %s a title and choose a starting variation.',
					'prc-quiz-synced-quiz'
				),
				POST_TYPE_LABEL.toLowerCase()
			)}
			textControlLabel={__('Quiz Title', 'prc-quiz-synced-quiz')}
			textPlaceholder={__(
				'e.g. Political Typology Quiz',
				'prc-quiz-synced-quiz'
			)}
			createButtonLabel={sprintf(
				/* translators: %s: post type label (Quiz) */
				__('Create New %s', 'prc-quiz-synced-quiz'),
				POST_TYPE_LABEL
			)}
			creatingLabel={sprintf(
				/* translators: %s: post type label (Quiz) */
				__('Creating %s…', 'prc-quiz-synced-quiz'),
				POST_TYPE_LABEL
			)}
			cancelLabel={__('Cancel', 'prc-quiz-synced-quiz')}
			triggerLabel={sprintf(
				/* translators: %s: post type label (Quiz) */
				__('Add New %s', 'prc-quiz-synced-quiz'),
				POST_TYPE_LABEL
			)}
			createRecord={createRecord}
			canSubmit={({ title, extras }) =>
				title.trim().length >= 3 && !!extras?.variation
			}
			getCreateErrorMessage={() =>
				sprintf(
					/* translators: %s: post type label (Quiz) */
					__('Could not create the %s.', 'prc-quiz-synced-quiz'),
					POST_TYPE_LABEL
				)
			}
			renderFields={({ disabled, title, extras, setExtras }) => (
				<VStack spacing={4} style={{ marginTop: '16px' }}>
					<SelectControl
						__nextHasNoMarginBottom
						label={__('Variation', 'prc-quiz-synced-quiz')}
						value={extras?.variation || ''}
						options={variationOptions}
						onChange={(value) =>
							setExtras({ ...extras, variation: value })
						}
						disabled={disabled || title.trim().length < 3}
					/>
				</VStack>
			)}
		/>
	);
}
