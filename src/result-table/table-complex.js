/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { RawHTML } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';

/**
 * Internal Dependencies
 */
import { Icon } from '@prc/icons';
import { previewIsCorrect } from './row-preview';
import { COMPLEX_TABLE_MODE, buildComplexTableRows } from './table-rows';

/**
 * Editor preview for the Complex results table.
 *
 * @param {Object}  props
 * @param {Array}   props.questions          Question records.
 * @param {Array}   props.demoBreakLabels    Demographic column labels.
 * @param {boolean} props.isSelected         Whether the block is selected.
 * @param {boolean} [props.isCommunityGroup] Whether this is the community-group variation.
 * @return {Element} Table preview.
 */
export default function TableComplex({
	questions,
	demoBreakLabels = [],
	isSelected,
	isCommunityGroup = false,
}) {
	const { selectBlock, toggleBlockHighlight } =
		useDispatch('core/block-editor');

	if (undefined === questions || 0 === questions.length) {
		return (
			<div>
				<p>{__('Constructing table…', 'prc-quiz')}</p>
				<Spinner />
			</div>
		);
	}

	const labels = Array.isArray(demoBreakLabels) ? demoBreakLabels : [];
	const questionByUuid = {};
	questions.forEach((question) => {
		const key = question.uuid || question.clientId;
		if (key) {
			questionByUuid[key] = question;
		}
	});
	const userSubmission = questions
		.map((question) => getPreviewSelectedUuid(question))
		.filter(Boolean);
	const rows = buildComplexTableRows({
		questions,
		userSubmission,
		demoBreakLabels: labels,
		mode: isCommunityGroup
			? COMPLEX_TABLE_MODE.COMMUNITY_GROUP
			: COMPLEX_TABLE_MODE.PERSONAL,
		groupTally: isCommunityGroup ? previewGroupTally(questions) : null,
	});

	return (
		<table className="prc-quiz-result-table__complex">
			<thead>
				<tr>
					<th>{__('Question', 'prc-quiz')}</th>
					<th>{__('Answers', 'prc-quiz')}</th>
					<th>
						{isCommunityGroup
							? __("Your group's answers", 'prc-quiz')
							: __('Your answer', 'prc-quiz')}
					</th>
					<th>{__('% who selected each option', 'prc-quiz')}</th>
					{isCommunityGroup && (
						<th>{__('% of your group', 'prc-quiz')}</th>
					)}
					{labels.map((label, index) => (
						<th key={index}>{label}</th>
					))}
				</tr>
			</thead>
			<tbody>
				{rows.map((row) => {
					const question = questionByUuid[row.questionUuid];
					return (
						<tr
							key={`${row.questionUuid}-${row.uuid}`}
							className={getComplexRowClassName(row)}
							onClick={(e) => {
								e.preventDefault();
								if (
									isSelected &&
									e.shiftKey &&
									question?.clientId
								) {
									toggleBlockHighlight(
										question.clientId,
										true
									);
									selectBlock(question.clientId);
								}
							}}
						>
							<td className="prc-quiz-result-table__question-cell">
								{row.isFirst && (
									<RawHTML>{row.question}</RawHTML>
								)}
							</td>
							<td className="prc-quiz-result-table__answer-cell">
								{row.answerText}
							</td>
							<td className="prc-quiz-result-table__choice-cell">
								{(isCommunityGroup
									? row.showGroupAnswerIcon
									: row.showCorrectIcon) && (
									<span className="prc-quiz-result-table__icon is-correct">
										<Icon icon="check" />
									</span>
								)}
								{!isCommunityGroup && row.showIncorrectIcon && (
									<span className="prc-quiz-result-table__icon is-incorrect">
										<Icon icon="xmark" />
									</span>
								)}
							</td>
							<td className="prc-quiz-result-table__percent-cell">
								{isCommunityGroup && (
									<span className="prc-quiz-result-table__demo-label">
										{__(
											'% who selected each option',
											'prc-quiz'
										)}
									</span>
								)}
								{row.populationPercent}
							</td>
							{isCommunityGroup && (
								<td className="prc-quiz-result-table__percent-cell prc-quiz-result-table__group-percent-cell">
									<span className="prc-quiz-result-table__demo-label">
										{__('% of your group', 'prc-quiz')}
									</span>
									{row.groupPercent}
								</td>
							)}
							{row.demoBreakValues.map((demo) => (
								<td
									key={demo.id}
									className="prc-quiz-result-table__percent-cell prc-quiz-result-table__demo-cell"
								>
									<span className="prc-quiz-result-table__demo-label">
										{demo.label}
									</span>
									{demo.value}
								</td>
							))}
						</tr>
					);
				})}
			</tbody>
		</table>
	);
}

/**
 * Placeholder group tally so the editor can show extra columns without Firebase.
 *
 * @param {Array} questions Question records.
 * @return {{ total: number, answers: Object }} Preview tally.
 */
function previewGroupTally(questions) {
	const answers = {};
	questions.forEach((question) => {
		const list = question.answers || [];
		list.forEach((answer, index) => {
			if (answer?.uuid) {
				answers[answer.uuid] = 0 === index ? 8 : 3;
			}
		});
	});
	return { total: 20, answers };
}

/**
 * Pick a preview selected answer for editor display.
 *
 * @param {Object} question Question record.
 * @return {string|undefined} Answer UUID.
 */
function getPreviewSelectedUuid(question) {
	const answers = question.answers || [];
	if (0 === answers.length) {
		return undefined;
	}
	const pickCorrect = previewIsCorrect(question.uuid || question.clientId);
	if (pickCorrect) {
		const correct = answers.find((answer) => true === answer.correct);
		if (correct) {
			return correct.uuid;
		}
	}
	const incorrect = answers.find((answer) => true !== answer.correct);
	if (incorrect) {
		return incorrect.uuid;
	}
	return answers[0].uuid;
}

/**
 * Class names for a Complex table row.
 *
 * @param {Object}  row
 * @param {boolean} row.isFirst
 * @param {boolean} row.isLast
 * @param {boolean} row.isCorrectSelection
 * @param {boolean} row.isIncorrectSelection
 * @param {boolean} [row.isGroupPlurality]
 * @return {string} Class name string.
 */
function getComplexRowClassName(row) {
	const classes = ['prc-quiz-result-table__row'];
	if (row.isFirst) {
		classes.push('is-first-answer');
	}
	if (row.isLast) {
		classes.push('is-last-answer');
	}
	if (row.isCorrectSelection) {
		classes.push('is-correct-selection');
	}
	if (row.isIncorrectSelection) {
		classes.push('is-incorrect-selection');
	}
	if (row.isGroupPlurality) {
		classes.push('is-group-plurality');
	}
	return classes.join(' ');
}
