/**
 * WordPress Dependencies
 */
import { RawHTML } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';

/**
 * Internal Dependencies
 */
import { Icon } from '@prc/icons';
import { getRowClassName, previewIsCorrect } from './row-preview';

export default function TableDemoBreaks({
	questions,
	colors,
	demoBreakLabels,
	isSelected,
}) {
	const { selectBlock, toggleBlockHighlight } =
		useDispatch('core/block-editor');

	if (undefined === questions || 0 === questions.length) {
		return (
			<div>
				<p>Constructing table... </p>
				<Spinner />
			</div>
		);
	}
	return (
		<table>
			<thead>
				<tr>
					<th>&nbsp;</th>
					<th>&nbsp;</th>
					{demoBreakLabels.map((label, index) => (
						<th key={index}>{label}</th>
					))}
				</tr>
			</thead>
			<tbody>
				{questions.map((row, index) => {
					const correctAnswers = row.answers.filter(
						(answer) => true === answer.correct
					);
					const randomIsCorrect = previewIsCorrect(
						row.uuid || row.clientId
					);
					const { demoBreakValues } = row;
					return (
						<tr
							key={index}
							className={getRowClassName(
								colors,
								index,
								randomIsCorrect
							)}
							onClick={(e) => {
								e.preventDefault();
								if (isSelected && e.shiftKey) {
									toggleBlockHighlight(row.clientId, true);
									selectBlock(row.clientId);
								}
							}}
						>
							<td className="wp-block-prc-quiz-result-table__row__icon">
								{randomIsCorrect && (
									<span className="has-ui-success">
										<Icon icon="check" />
									</span>
								)}
								{!randomIsCorrect && (
									<span className="has-ui-error">
										<Icon icon="xmark" />
									</span>
								)}
							</td>
							<td>
								<span>
									<RawHTML>{row.question}</RawHTML>
								</span>
								<div>
									<span>You answered:</span>
									<br />
									<span>
										<strong>N/A</strong>
									</span>
								</div>
								<div>
									<span>Correct answer:</span>
									<br />
									<strong>
										{correctAnswers
											.map((answer) =>
												answer.resultsLabel
													? answer.resultsLabel
													: answer.answer
											)
											.join(', ')}
									</strong>
								</div>
							</td>
							{demoBreakValues.map((value, valueIndex) => (
								<td key={valueIndex}>{value}</td>
							))}
						</tr>
					);
				})}
			</tbody>
		</table>
	);
}
