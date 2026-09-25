/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { createContext, useContext } from '@wordpress/element';
import {
	Button,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';

/**
 * Internal Dependencies
 */
import EditableCell from './editable-cell';

const EMPTY_WRITERS = {
	isFreeform: false,
	updateQuestion: () => {},
	updateAnswer: () => {},
	updateAnswerAttr: () => {},
	toggleCorrect: () => {},
};

export const QuickEditWritersContext = createContext(EMPTY_WRITERS);

function QuestionNumberField({ item }) {
	if (item.answerIndex > 0) {
		return null;
	}
	return (
		<span className="quiz-quick-edit__question-number">
			{item.questionIndex + 1}
		</span>
	);
}

function PageField({ item }) {
	if (item.answerIndex > 0) {
		return null;
	}
	return <span>{item.pageTitle}</span>;
}

function QuestionTextField({ item }) {
	const { updateQuestion } = useContext(QuickEditWritersContext);
	return (
		<EditableCell
			value={item.questionText}
			onChange={(val) => updateQuestion(item.questionClientId, val)}
			hidden={item.answerIndex > 0}
			label={__('Question text', 'prc-quiz')}
		/>
	);
}

function AnswerTextField({ item }) {
	const { updateAnswer } = useContext(QuickEditWritersContext);
	return (
		<EditableCell
			value={item.answerText}
			onChange={(val) => updateAnswer(item.answerClientId, val)}
			label={__('Answer text', 'prc-quiz')}
		/>
	);
}

function CorrectField({ item }) {
	const { isFreeform, toggleCorrect } = useContext(QuickEditWritersContext);
	if (isFreeform) {
		return <span>—</span>;
	}
	let label = __('Not sure', 'prc-quiz');
	if (true === item.correct) {
		label = __('Correct', 'prc-quiz');
	} else if (false === item.correct) {
		label = __('Incorrect', 'prc-quiz');
	}
	return (
		<Button
			variant="secondary"
			size="small"
			onClick={() =>
				toggleCorrect(
					item.answerClientId,
					item.questionClientId,
					item.questionType,
					item.correct
				)
			}
		>
			{label}
		</Button>
	);
}

function PointsField({ item }) {
	const { isFreeform, updateAnswerAttr } = useContext(
		QuickEditWritersContext
	);
	if (isFreeform) {
		return <span>{item.points ?? 0}</span>;
	}
	return (
		<NumberControl
			className="quiz-quick-edit__points-input"
			value={item.points ?? 0}
			onChange={(val) =>
				updateAnswerAttr(
					item.answerClientId,
					'points',
					Math.round(parseFloat(val) || 0)
				)
			}
			min={0}
			max={100}
			hideHTMLArrows
			label={__('Points', 'prc-quiz')}
			hideLabelFromVision
		/>
	);
}

function ResultsLabelField({ item }) {
	const { updateAnswerAttr } = useContext(QuickEditWritersContext);
	return (
		<EditableCell
			value={item.resultsLabel}
			onChange={(val) =>
				updateAnswerAttr(item.answerClientId, 'resultsLabel', val)
			}
			label={__('Results label', 'prc-quiz')}
		/>
	);
}

/**
 * DataViews field config for the quick-edit table.
 *
 * DataViews mounts `field.render` as a component (`<field.render />`).
 * Keep those functions module-level so typing does not remount the input.
 *
 * @param {Array} pageElements Page filter options.
 * @return {Array} Field descriptors.
 */
export function buildFields(pageElements) {
	return [
		{
			id: 'questionNumber',
			label: __('#', 'prc-quiz'),
			enableSorting: true,
			enableGlobalSearch: false,
			enableHiding: false,
			getValue: ({ item }) => item.questionIndex + 1,
			render: QuestionNumberField,
		},
		{
			id: 'page',
			label: __('Page', 'prc-quiz'),
			enableSorting: true,
			enableGlobalSearch: false,
			getValue: ({ item }) => item.pageTitle,
			render: PageField,
			elements: pageElements,
			filterBy: {
				operators: ['is', 'isNot'],
			},
		},
		{
			id: 'questionText',
			label: __('Question', 'prc-quiz'),
			enableSorting: false,
			enableGlobalSearch: true,
			getValue: ({ item }) => item.questionText,
			render: QuestionTextField,
		},
		{
			id: 'answerText',
			label: __('Answer', 'prc-quiz'),
			enableSorting: false,
			enableGlobalSearch: true,
			getValue: ({ item }) => item.answerText,
			render: AnswerTextField,
		},
		{
			id: 'correct',
			label: __('Correct', 'prc-quiz'),
			enableSorting: false,
			enableGlobalSearch: false,
			getValue: ({ item }) => {
				if (true === item.correct) {
					return 'yes';
				}
				if (false === item.correct) {
					return 'no';
				}
				return 'not-sure';
			},
			render: CorrectField,
		},
		{
			id: 'points',
			label: __('Pts', 'prc-quiz'),
			type: 'integer',
			enableSorting: true,
			enableGlobalSearch: false,
			getValue: ({ item }) => item.points ?? 0,
			render: PointsField,
		},
		{
			id: 'resultsLabel',
			label: __('Results Label', 'prc-quiz'),
			enableSorting: false,
			enableGlobalSearch: true,
			getValue: ({ item }) => item.resultsLabel,
			render: ResultsLabelField,
		},
	];
}
