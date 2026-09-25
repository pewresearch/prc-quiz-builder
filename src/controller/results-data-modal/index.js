/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useCallback, useMemo, useEffect } from '@wordpress/element';
import { Modal, Button } from '@wordpress/components';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { plus } from '@wordpress/icons';

/**
 * Internal Dependencies
 */
import {
	demoBreakFieldId,
	demoBreakPermutationFromView,
	parseDemoBreakFieldIndex,
	permuteByOrder,
} from '../../result-table/utils';
import useResultsData from './use-results-data';
import { promptAddColumn } from './demo-break-column-header';
import { buildFields, ResultsDataWritersContext } from './fields';

import './style.scss';

const BASE_FIELDS = [
	'questionNumber',
	'questionText',
	'answerText',
	'populationPercent',
];

const BASE_LAYOUT_STYLES = {
	questionNumber: { width: 50 },
	questionText: { width: '30%' },
	answerText: { width: '25%' },
	populationPercent: { width: 140 },
};

/**
 * DataViews modal for general-population and demographic percentages.
 *
 * @param {Object}   props
 * @param {string}   props.clientId Controller block client ID.
 * @param {Function} props.onClose  Called when the modal is dismissed.
 * @return {Element} The modal.
 */
export default function QuizResultsDataModal({ clientId, onClose }) {
	const {
		rows,
		loading,
		demoBreakLabels,
		updatePopulationPercent,
		updateDemoBreakValue,
		addDemoBreakLabel,
		renameDemoBreakLabel,
		removeDemoBreakLabel,
		reorderDemoBreakLabels,
		applyDemoBreakOrder,
	} = useResultsData(clientId);

	const [view, setView] = useState(() => buildView(demoBreakLabels));

	const writers = useMemo(
		() => ({
			demoBreakLabels,
			updatePopulationPercent,
			updateDemoBreakValue,
			renameDemoBreakLabel,
			removeDemoBreakLabel,
			reorderDemoBreakLabels,
		}),
		[
			demoBreakLabels,
			removeDemoBreakLabel,
			renameDemoBreakLabel,
			reorderDemoBreakLabels,
			updateDemoBreakValue,
			updatePopulationPercent,
		]
	);

	const handleChangeView = useCallback(
		(newView) => {
			const order = demoBreakPermutationFromView(
				newView?.fields,
				demoBreakLabels.length
			);
			if (order) {
				applyDemoBreakOrder(order);
				setView(
					syncViewFields(
						newView,
						permuteByOrder(demoBreakLabels, order)
					)
				);
				return;
			}
			setView(newView);
		},
		[applyDemoBreakOrder, demoBreakLabels]
	);

	useEffect(() => {
		setView((current) => syncViewFields(current, demoBreakLabels));
	}, [demoBreakLabels]);

	const fields = useMemo(
		() => buildFields(demoBreakLabels),
		[demoBreakLabels]
	);

	const defaultLayouts = useMemo(
		() => ({
			table: {
				layout: {
					enableMoving: false,
					styles: view.layout?.styles,
				},
			},
		}),
		[view.layout?.styles]
	);

	const { data: processedData, paginationInfo } = useMemo(
		() => filterSortAndPaginate(rows, view, fields),
		[rows, view, fields]
	);

	const handleAddLabel = useCallback(() => {
		const next = promptAddColumn();
		if (null !== next) {
			addDemoBreakLabel(next);
		}
	}, [addDemoBreakLabel]);

	const getItemId = useCallback((item) => item.id, []);

	return (
		<ResultsDataWritersContext.Provider value={writers}>
			<Modal
				title={__('Edit Results Table Data', 'prc-quiz')}
				onRequestClose={onClose}
				isFullScreen
				className="quiz-results-data-modal"
				headerActions={
					<Button
						icon={plus}
						variant="primary"
						onClick={handleAddLabel}
						text={__('Add column', 'prc-quiz')}
						size="compact"
					/>
				}
			>
				<div className="quiz-results-data__toolbar">
					<p className="quiz-results-data__help">
						{__(
							'Enter the share of people who selected each option. Add demographic columns when you have breaks. These values appear in the Complex result table style.',
							'prc-quiz'
						)}
					</p>
				</div>
				<DataViews
					data={processedData}
					fields={fields}
					view={view}
					onChangeView={handleChangeView}
					defaultLayouts={defaultLayouts}
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
		</ResultsDataWritersContext.Provider>
	);
}

/**
 * Keep visible fields in sync when demographic columns change.
 *
 * @param {Object} current         Current view.
 * @param {Array}  demoBreakLabels Demographic labels.
 * @return {Object} Updated view.
 */
function syncViewFields(current, demoBreakLabels) {
	const currentFields = current.fields || [];
	const baseFields = currentFields.filter(
		(fieldId) => null === parseDemoBreakFieldIndex(fieldId)
	);
	const nextFields = [
		...(baseFields.length ? baseFields : BASE_FIELDS),
		...(demoBreakLabels || []).map((_, i) => demoBreakFieldId(i)),
	];
	const nextStyles = {
		...BASE_LAYOUT_STYLES,
		...Object.fromEntries(
			(demoBreakLabels || []).map((_, i) => [
				demoBreakFieldId(i),
				{ width: 110 },
			])
		),
	};
	const fieldsUnchanged = currentFields.join(',') === nextFields.join(',');
	const stylesUnchanged =
		JSON.stringify(current.layout?.styles) === JSON.stringify(nextStyles);
	const movingDisabled = false === current.layout?.enableMoving;
	if (fieldsUnchanged && stylesUnchanged && movingDisabled) {
		return current;
	}
	return {
		...current,
		fields: nextFields,
		layout: {
			...current.layout,
			enableMoving: false,
			styles: nextStyles,
		},
	};
}

/**
 * Initial DataViews view for the results-data table.
 *
 * @param {Array} demoBreakLabels Demographic labels.
 * @return {Object} View config.
 */
function buildView(demoBreakLabels) {
	return syncViewFields(
		{
			type: 'table',
			search: '',
			filters: [],
			page: 1,
			perPage: 50,
			sort: {
				field: 'questionNumber',
				direction: 'asc',
			},
			fields: BASE_FIELDS,
			layout: {
				enableMoving: false,
				styles: BASE_LAYOUT_STYLES,
			},
		},
		demoBreakLabels
	);
}
