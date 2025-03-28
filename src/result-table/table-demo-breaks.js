/**
 * External Dependencies
 */
import classNames from 'classnames';

/**
 * WordPress Dependencies
 */
import { RawHTML } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { getColorClassName } from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';

/**
 * Internal Dependencies
 */
import { Icon } from '@prc/icons';

const getRowClassName = (colors, index, correct = null) => {
	const position = index + 1;
	const isEven = position % 2 === 0;

	// If "correct" is null then randomly assign a correct or incorrect state.
	let c = correct;
	if (null === c) {
		c = Math.random() >= 0.5;
	}

	const {
		rowBackgroundColor,
		altRowBackgroundColor,
		rowTextColor,
		altRowTextColor,
	} = colors;

	const rowColor = !isEven ? rowBackgroundColor : altRowBackgroundColor;
	const textColor = !isEven ? rowTextColor : altRowTextColor;

	return classNames('wp-block-prc-quiz-result-table__row', {
		'has-text-color': !!textColor.color || !!textColor?.class,
		[getColorClassName('color', textColor?.slug)]: !!textColor?.slug,
		// eslint-disable-next-line prettier/prettier
		'has-background': !!rowColor.color || rowColor.class,
		// eslint-disable-next-line prettier/prettier
		[getColorClassName('background-color', rowColor?.slug)]:
			!!rowColor?.slug,
		'is-correct': c,
		'is-incorrect': !c,
	});
};

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
						(answer) => answer.correct
					);
					const randomIsCorrect = Math.random() >= 0.5;
					const { demoBreakValues } = row;
					return (
						<tr
							key={index}
							className={getRowClassName(colors, index)}
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
							{demoBreakValues.map((value, index) => (
								<td key={index}>{value}</td>
							))}
						</tr>
					);
				})}
			</tbody>
		</table>
	);
}
