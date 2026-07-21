/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useCallback, useMemo } from '@wordpress/element';
import {
	Modal,
	Button,
	FormToggle,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { plus } from '@wordpress/icons';

/**
 * Internal Dependencies
 */
import useQuickEditData from './use-quick-edit-data';
import EditableCell from './editable-cell';

import './style.scss';

const DEFAULT_VIEW = {
	type: 'table',
	search: '',
	filters: [],
	page: 1,
	perPage: 50,
	sort: {
		field: 'questionNumber',
		direction: 'asc',
	},
	fields: [
		'questionNumber',
		'page',
		'questionText',
		'answerText',
		'correct',
		'points',
		'resultsLabel',
	],
	layout: {
		styles: {
			questionNumber: { width: 50 },
			page: { width: 100 },
			questionText: { width: '30%' },
			answerText: { width: '25%' },
			correct: { width: 70, align: 'center' },
			points: { width: 70, align: 'center' },
			resultsLabel: { width: '15%' },
		},
	},
};

const DEFAULT_LAYOUTS = {
	table: {
		layout: {
			styles: DEFAULT_VIEW.layout.styles,
		},
	},
};

/**
 * The quiz quick-edit modal that renders a DataViews table of all
 * questions and answers in a flat, editable format.
 *
 * @param {Object}   props
 * @param {string}   props.clientId The controller block's clientId.
 * @param {Function} props.onClose  Called when the modal is dismissed.
 * @return {Element} The modal.
 */
export default function QuizQuickEditModal({ clientId, onClose }) {
	const {
		rows,
		loading,
		quizType,
		updateQuestion,
		updateAnswer,
		updateAnswerAttr,
		toggleCorrect,
		addQuestion,
	} = useQuickEditData(clientId);

	const [view, setView] = useState(DEFAULT_VIEW);

	const handleChangeView = useCallback((newView) => {
		setView(newView);
	}, []);

	const isFreeform = quizType === 'freeform';

	const fields = useMemo(
		() => [
			{
				id: 'questionNumber',
				label: __('#', 'prc-quiz'),
				enableSorting: true,
				enableGlobalSearch: false,
				enableHiding: false,
				getValue: ({ item }) => item.questionIndex + 1,
				render: ({ item }) => {
					if (item.answerIndex > 0) {
						return null;
					}
					return (
						<span className="quiz-quick-edit__question-number">
							{item.questionIndex + 1}
						</span>
					);
				},
			},
			{
				id: 'page',
				label: __('Page', 'prc-quiz'),
				enableSorting: true,
				enableGlobalSearch: false,
				getValue: ({ item }) => item.pageTitle,
				render: ({ item }) => {
					if (item.answerIndex > 0) {
						return null;
					}
					return <span>{item.pageTitle}</span>;
				},
				elements: getPageElements(rows),
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
				render: ({ item }) => (
					<EditableCell
						value={item.questionText}
						onChange={(val) =>
							updateQuestion(item.questionClientId, val)
						}
						hidden={item.answerIndex > 0}
						label={__('Question text', 'prc-quiz')}
					/>
				),
			},
			{
				id: 'answerText',
				label: __('Answer', 'prc-quiz'),
				enableSorting: false,
				enableGlobalSearch: true,
				getValue: ({ item }) => item.answerText,
				render: ({ item }) => (
					<EditableCell
						value={item.answerText}
						onChange={(val) =>
							updateAnswer(item.answerClientId, val)
						}
						label={__('Answer text', 'prc-quiz')}
					/>
				),
			},
			{
				id: 'correct',
				label: __('Correct', 'prc-quiz'),
				enableSorting: false,
				enableGlobalSearch: false,
				getValue: ({ item }) => (item.correct ? 'yes' : 'no'),
				render: ({ item }) => {
					if (isFreeform) {
						return <span>—</span>;
					}
					return (
						<FormToggle
							checked={!!item.correct}
							onChange={() =>
								toggleCorrect(
									item.answerClientId,
									item.questionClientId,
									item.questionType,
									item.correct
								)
							}
						/>
					);
				},
			},
			{
				id: 'points',
				label: __('Pts', 'prc-quiz'),
				type: 'integer',
				enableSorting: true,
				enableGlobalSearch: false,
				getValue: ({ item }) => item.points ?? 0,
				render: ({ item }) => {
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
				},
			},
			{
				id: 'resultsLabel',
				label: __('Results Label', 'prc-quiz'),
				enableSorting: false,
				enableGlobalSearch: true,
				getValue: ({ item }) => item.resultsLabel,
				render: ({ item }) => (
					<EditableCell
						value={item.resultsLabel}
						onChange={(val) =>
							updateAnswerAttr(
								item.answerClientId,
								'resultsLabel',
								val
							)
						}
						label={__('Results label', 'prc-quiz')}
					/>
				),
			},
		],
		[
			rows,
			isFreeform,
			updateQuestion,
			updateAnswer,
			updateAnswerAttr,
			toggleCorrect,
		]
	);

	const { data: processedData, paginationInfo } = useMemo(
		() => filterSortAndPaginate(rows, view, fields),
		[rows, view, fields]
	);

	return (
		<Modal
			title={__('Quick Edit Quiz Content', 'prc-quiz')}
			onRequestClose={onClose}
			isFullScreen
			className="quiz-quick-edit-modal"
			headerActions={
				<Button
					icon={plus}
					variant="primary"
					onClick={addQuestion}
					text={__('Add Question', 'prc-quiz')}
					size="compact"
				/>
			}
		>
			<DataViews
				data={processedData}
				fields={fields}
				view={view}
				onChangeView={handleChangeView}
				defaultLayouts={DEFAULT_LAYOUTS}
				paginationInfo={paginationInfo}
				isLoading={loading}
				search
				searchLabel={__('Search questions and answers…', 'prc-quiz')}
				getItemId={(item) => item.id}
			/>
		</Modal>
	);
}

/**
 * Derives unique page filter elements from the flat row data.
 *
 * @param {Array} rows Flat row data from useQuickEditData.
 * @return {Array} DataViews filter elements.
 */
function getPageElements(rows) {
	const seen = new Set();
	const elements = [];
	for (const row of rows) {
		if (!seen.has(row.pageTitle)) {
			seen.add(row.pageTitle);
			elements.push({
				value: row.pageTitle,
				label: row.pageTitle,
			});
		}
	}
	return elements;
}
