/**
 * WordPress Dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import {
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal Dependencies
 */
import { quizBuilderBinding } from '../bindings/binding-fields';

const TEMPLATE = [
	[
		'core/paragraph',
		{
			placeholder: __('Enter page title', 'prc-quiz'),
			metadata: {
				bindings: {
					content: quizBuilderBinding('page-title-text'),
				},
			},
		},
	],
	['prc-quiz/question', {}, []],
];

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @param {Object}   props                            Properties passed to the function.
 * @param {Object}   props.attributes                 Available block attributes.
 * @param {Function} props.setAttributes              Function that updates individual attributes.
 * @param {Object}   props.context                    Block context from parent blocks.
 * @param {string}   props.clientId                   Block client ID.
 * @param {string}   props.__unstableLayoutClassNames Layout class names from the block editor.
 *
 * @return {Element} Element to render.
 */
export default function Edit({
	attributes,
	setAttributes,
	context,
	clientId,
	__unstableLayoutClassNames: layoutClassNames,
}) {
	const { title, uuid } = attributes;

	const existingUuids = context['prc-quiz/uuids'];

	const blockProps = useBlockProps({
		className: layoutClassNames,
	});

	const innerBlocksProps = useInnerBlocksProps(blockProps, {
		templateLock: false,
		template: TEMPLATE,
	});

	const { pageIndex } = useSelect((select) => {
		const rootClientId =
			select(blockEditorStore).getBlockRootClientId(clientId);
		return {
			pageIndex:
				select(blockEditorStore).getBlockIndex(clientId, rootClientId) +
				1,
		};
	});

	// When the block is created, set the initial uuid and the title.
	useEffect(() => {
		const uuids = existingUuids || {};
		// If a uuid is already set, check if existinguuids includes it, and if it does does it have this clientId? If not then lets set a new uuid using this clientId.
		if (
			uuid &&
			Object.keys(uuids).includes(uuid) &&
			uuids[uuid] !== clientId
		) {
			setAttributes({
				uuid: clientId,
			});
		}
		// If the uuid is not set, set it to the clientId.
		if (!uuid) {
			setAttributes({
				uuid: clientId,
			});
		}
		// Set default title to be "Question X of Y" where X is the current question number and Y is the total number of questions.
		if (!title) {
			setAttributes({
				title: sprintf('Question %1$d of X', pageIndex - 1),
			});
		}
	}, [clientId, existingUuids, pageIndex, setAttributes, title, uuid]);

	return <div {...innerBlocksProps}></div>;
}
