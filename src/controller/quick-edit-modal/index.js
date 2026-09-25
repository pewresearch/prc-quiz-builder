/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useCallback, useMemo } from '@wordpress/element';
import { Modal, Button } from '@wordpress/components';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { plus } from '@wordpress/icons';

/**
 * Internal Dependencies
 */
import useQuickEditData from './use-quick-edit-data';
import { buildFields, QuickEditWritersContext } from './fields';

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
			correct: { width: 100, align: 'center' },
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

	const writers = useMemo(
		() => ({
			isFreeform,
			updateQuestion,
			updateAnswer,
			updateAnswerAttr,
			toggleCorrect,
		}),
		[
			isFreeform,
			toggleCorrect,
			updateAnswer,
			updateAnswerAttr,
			updateQuestion,
		]
	);

	const pageTitleKey = JSON.stringify([
		...new Set(rows.map((row) => row.pageTitle)),
	]);
	const pageElements = useMemo(
		() =>
			JSON.parse(pageTitleKey).map((title) => ({
				value: title,
				label: title,
			})),
		[pageTitleKey]
	);

	const fields = useMemo(() => buildFields(pageElements), [pageElements]);

	const { data: processedData, paginationInfo } = useMemo(
		() => filterSortAndPaginate(rows, view, fields),
		[rows, view, fields]
	);

	const getItemId = useCallback((item) => item.id, []);

	return (
		<QuickEditWritersContext.Provider value={writers}>
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
					searchLabel={__(
						'Search questions and answers…',
						'prc-quiz'
					)}
					getItemId={getItemId}
				/>
			</Modal>
		</QuickEditWritersContext.Provider>
	);
}
