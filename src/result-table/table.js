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
import { getRowClassName, previewIsCorrect } from './row-preview';

export default function Table({ questions, colors, isSelected }) {
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
					<th>Your Answer</th>
					<th>Correct Answer(s)</th>
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
								<RawHTML>{row.question}</RawHTML>
							</td>
							<td>{__(`N/A`, 'prc-quiz')}</td>
							<td>
								<RawHTML>
									{correctAnswers
										.map((answer) =>
											answer.resultsLabel
												? answer.resultsLabel
												: answer.answer
										)
										.join(', ')}
								</RawHTML>
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
}
