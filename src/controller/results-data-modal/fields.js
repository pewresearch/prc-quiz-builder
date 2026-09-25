/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { createContext, useContext } from '@wordpress/element';
import { TextControl } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import {
	demoBreakFieldId,
	parseDemoBreakFieldIndex,
} from '../../result-table/utils';
import DemoBreakColumnHeader from './demo-break-column-header';

const EMPTY_WRITERS = {
	demoBreakLabels: [],
	updatePopulationPercent: () => {},
	updateDemoBreakValue: () => {},
	renameDemoBreakLabel: () => {},
	removeDemoBreakLabel: () => {},
	reorderDemoBreakLabels: () => {},
};

export const ResultsDataWritersContext = createContext(EMPTY_WRITERS);

/**
 * Compact percentage input for a DataViews cell.
 *
 * @param {Object}   props
 * @param {string}   props.value    Current value.
 * @param {string}   props.label    Accessible label.
 * @param {Function} props.onChange Change handler.
 * @return {Element} Input control.
 */
function PercentCell({ value, label, onChange }) {
	return (
		<TextControl
			className="quiz-results-data__percent-input"
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			value={value ?? ''}
			onChange={onChange}
			label={label}
			hideLabelFromVision
		/>
	);
}

function QuestionNumberField({ item }) {
	if (item.answerIndex > 0) {
		return null;
	}
	return (
		<span className="quiz-results-data__question-number">
			{item.questionIndex + 1}
		</span>
	);
}

function QuestionTextField({ item }) {
	if (item.answerIndex > 0) {
		return <span className="quiz-results-data__cell--grouped" />;
	}
	return <span>{item.questionText}</span>;
}

function AnswerTextField({ item }) {
	return <span>{item.answerText || '—'}</span>;
}

function PopulationPercentField({ item }) {
	const { updatePopulationPercent } = useContext(ResultsDataWritersContext);
	return (
		<PercentCell
			value={item.populationPercent}
			label={__('% who selected each option', 'prc-quiz')}
			onChange={(val) =>
				updatePopulationPercent(item.answerClientId, val)
			}
		/>
	);
}

function DemoBreakPercentField({ item, field }) {
	const { demoBreakLabels, updateDemoBreakValue } = useContext(
		ResultsDataWritersContext
	);
	const labelIndex = parseDemoBreakFieldIndex(field.id);
	if (null === labelIndex) {
		return null;
	}
	const label = demoBreakLabels[labelIndex] || '';
	return (
		<PercentCell
			value={item.demoBreakValues?.[labelIndex] ?? ''}
			label={label}
			onChange={(val) =>
				updateDemoBreakValue(item.answerClientId, labelIndex, val)
			}
		/>
	);
}

function DemoBreakHeader({ labelIndex }) {
	const {
		demoBreakLabels,
		renameDemoBreakLabel,
		removeDemoBreakLabel,
		reorderDemoBreakLabels,
	} = useContext(ResultsDataWritersContext);
	return (
		<DemoBreakColumnHeader
			label={demoBreakLabels[labelIndex] || ''}
			index={labelIndex}
			total={demoBreakLabels.length}
			onRename={renameDemoBreakLabel}
			onRemove={removeDemoBreakLabel}
			onMove={reorderDemoBreakLabels}
		/>
	);
}

/**
 * DataViews field config for the results-data table.
 *
 * DataViews mounts `field.render` as a component (`<field.render />`).
 * Keep those functions module-level so typing does not remount the input.
 *
 * @param {Array} demoBreakLabels Demographic labels.
 * @return {Array} Field descriptors.
 */
export function buildFields(demoBreakLabels) {
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
			id: 'questionText',
			label: __('Question', 'prc-quiz'),
			enableSorting: false,
			enableGlobalSearch: true,
			getValue: ({ item }) => item.questionText,
			render: QuestionTextField,
		},
		{
			id: 'answerText',
			label: __('Answers', 'prc-quiz'),
			enableSorting: false,
			enableGlobalSearch: true,
			getValue: ({ item }) => item.answerText,
			render: AnswerTextField,
		},
		{
			id: 'populationPercent',
			label: __('% who selected each option', 'prc-quiz'),
			enableSorting: false,
			enableGlobalSearch: false,
			getValue: ({ item }) => item.populationPercent,
			render: PopulationPercentField,
		},
		...(demoBreakLabels || []).map((label, labelIndex) => ({
			id: demoBreakFieldId(labelIndex),
			label: label || __('Demographic', 'prc-quiz'),
			header: <DemoBreakHeader labelIndex={labelIndex} />,
			enableSorting: false,
			enableHiding: false,
			enableGlobalSearch: false,
			filterBy: false,
			getValue: ({ item }) => item.demoBreakValues?.[labelIndex] ?? '',
			render: DemoBreakPercentField,
		})),
	];
}
