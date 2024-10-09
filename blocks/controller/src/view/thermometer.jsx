/**
 * External Dependencies
 */
import classNames from 'classnames';

/**
 * WordPress Dependencies
 */
import { useState, createRef } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import { useQuiz } from './context';

function Thermometer({ questionUuid, answers = [] }) {
	const ref = createRef();
	const { answerHandler, userSubmission } = useQuiz();
	// Get the uuid from the userSubmission and then match that to the index in answers...
	// Check if our answers include any userSubmissions and contruct.
	const possible = answers.filter((a) => userSubmission.includes(a));
	// .. if you want to get the middle value ... Math.ceil((answers.length -1)/2)
	const [selected, setSelected] = useState(
		0 < possible.length ? answers.indexOf(possible[0]) : null
	);

	const onChange = (index) => {
		setSelected(index);
		answerHandler(answers[index], questionUuid, 'thermometer');
	};

	const classes = classNames('wp-block-prc-quiz-question--thermometer', {
		veryCold: selected <= answers.length * 0.25,
		cold:
			selected <= answers.length * 0.5 &&
			selected > answers.length * 0.25,
		warm:
			selected <= answers.length * 0.75 &&
			selected > answers.length * 0.5,
		veryWarm: selected > answers.length * 0.75,
	});
	return (
		<div className={classes} ref={ref}>
			<div className="button-group">
				{answers.map((e, index) => (
					<button
						type="button"
						key={e}
						className={classNames('button', {
							active: index === selected,
						})}
						onClick={() => {
							onChange(index);
						}}
					>
						{0 === index ? index : index * 10}
					</button>
				))}
			</div>
		</div>
	);
}

export default Thermometer;
