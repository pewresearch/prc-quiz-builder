import { __ } from '@wordpress/i18n';
import { toggleFormat, registerFormatType } from '@wordpress/rich-text';
import {
	RichTextToolbarButton,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

function QuizGroupResultsUrlButton({ isActive, onChange, value }) {
	const selectedBlock = useSelect((select) => {
		const currentBlock = select(blockEditorStore).getSelectedBlock();
		return currentBlock;
	}, []);

	if (selectedBlock && selectedBlock.name !== 'core/paragraph') {
		return null;
	}

	return (
		<RichTextToolbarButton
			icon="editor-code"
			title="Quiz Group Results URL"
			onClick={() => {
				onChange(
					toggleFormat(value, {
						type: 'prc-quiz/quiz-group-results-url',
					})
				);
			}}
			isActive={isActive}
		/>
	);
}

const quizGroupResultsUrl = {
	name: 'prc-quiz/quiz-group-results-url',
	title: __('Quiz Group Results URL'),
	tagName: 'a',
	className: 'prc-quiz-quiz-group-results-url',
	edit: QuizGroupResultsUrlButton,
};

export default function registerBlockBits() {
	registerFormatType('prc-quiz/quiz-group-results-url', quizGroupResultsUrl);
}
