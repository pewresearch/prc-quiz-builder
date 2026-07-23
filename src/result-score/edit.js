/**
 * External Dependencies
 */

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useRef } from '@wordpress/element';
import {
	useBlockProps,
	RichText,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal Dependencies
 */

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @param {Object}   props               Properties passed to the function.
 * @param {Object}   props.attributes    Available block attributes.
 * @param {Function} props.setAttributes Function that updates individual attributes.
 *
 * @return {Element} Element to render.
 */
export default function Edit({ attributes, setAttributes }) {
	const { numberOfQuestions } = attributes;
	const lastAutoTotalRef = useRef(null);
	const didInitRef = useRef(false);

	const blockProps = useBlockProps({});

	const { numberOfQuestionBlocks } = useSelect((select) => {
		const { getBlocksByName } = select(blockEditorStore);
		const questionBlocks = getBlocksByName('prc-quiz/question');
		return {
			numberOfQuestionBlocks: questionBlocks.length || 0,
		};
	}, []);

	// Persist the live question count so the frontend does not fall back to N/A.
	// Only auto-sync when empty/N/A or still equal to the last auto-written value,
	// so intentional editorial overrides persist.
	useEffect(() => {
		if (!numberOfQuestionBlocks) {
			return;
		}
		const next = String(numberOfQuestionBlocks);
		const current = String(numberOfQuestions ?? '').trim();
		const isEmpty = !current || current === 'N/A';

		if (!didInitRef.current) {
			didInitRef.current = true;
			if (isEmpty) {
				setAttributes({ numberOfQuestions: next });
				lastAutoTotalRef.current = next;
			} else if (current === next) {
				// Matches live count — treat as auto-maintained going forward.
				lastAutoTotalRef.current = next;
			}
			return;
		}

		const matchesLastAuto =
			lastAutoTotalRef.current !== null &&
			current === lastAutoTotalRef.current;

		if (isEmpty || matchesLastAuto) {
			if (current !== next) {
				setAttributes({ numberOfQuestions: next });
			}
			lastAutoTotalRef.current = next;
		}
	}, [numberOfQuestionBlocks, numberOfQuestions, setAttributes]);

	return (
		<h1 {...blockProps}>
			You answered{' '}
			<strong>
				{__('{score}')} out of{' '}
				<RichText
					tagName="span"
					value={numberOfQuestions}
					onChange={(val) =>
						setAttributes({ numberOfQuestions: val })
					}
					placeholder={String(numberOfQuestionBlocks || '')}
					allowedFormats={[]}
					keepPlaceholderOnFocus
				/>
			</strong>{' '}
			questions correctly.
		</h1>
	);
}
