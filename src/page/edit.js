/**
 * External Dependencies
 */
import classNames from 'classnames';

/**
 * WordPress Dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import {
	useBlockProps,
	RichText,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal Dependencies
 */
// eslint-disable-next-line import/no-relative-packages
import NewPageKeyboardHandler from './new-page-keyboard-handler';

const TEMPLATE = [
	[
		'core/paragraph',
		{
			placeholder: __('Enter page title', 'prc-quiz'),
			metadata: {
				bindings: {
					content: {
						source: 'prc-quiz/page-title',
					},
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
 * @param            attributes.attributes
 * @param {Object}   attributes               Available block attributes.
 * @param {Function} setAttributes            Function that updates individual attributes.
 * @param {string}   className                Class name.
 * @param {Object}   context                  Context.
 * @param            attributes.setAttributes
 * @param            attributes.className
 * @param            attributes.context
 * @param            attributes.clientId
 * @param            attributes.isSelected
 * @param {string}   clientId                 Client ID.
 *
 * @return {WPElement} Element to render.
 */
export default function Edit({
	attributes,
	setAttributes,
	className,
	context,
	clientId,
	isSelected,
	__unstableLayoutClassNames: layoutClassNames,
}) {
	const { title, uuid } = attributes;

	const groupsEnabled = context['prc-quiz/groupsEnabled'] || false;
	const quizType = context['prc-quiz/type'] || 'quiz';
	const existingUuids = context['prc-quiz/uuids'] || [];

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
		// If a uuid is already set, check if existinguuids includes it, and if it does does it have this clientId? If not then lets set a new uuid using this clientId.
		if (
			uuid &&
			Object.keys(existingUuids).includes(uuid) &&
			existingUuids[uuid] !== clientId
		) {
			console.log('Setting new page uuid');
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
	}, [existingUuids]);

	return <div {...innerBlocksProps}></div>;
}
