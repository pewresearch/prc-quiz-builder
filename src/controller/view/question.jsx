/**
 * External Dependencies
 */
import classNames from 'classnames';

/**
 * WordPress Dependencies
 */
import { Fragment, RawHTML } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import { useQuiz } from './context';
import Answer from './answer';
import Thermometer from './thermometer';

function Question({
	uuid,
	answers,
	question,
	image = false,
	imageOnTop = false,
	type,
	conditional,
}) {
	const { answerHandler, userSubmission, quizData } = useQuiz();
	if (
		undefined === quizData ||
		(false !== conditional && !userSubmission.includes(conditional))
	) {
		// eslint-disable-next-line react/jsx-no-useless-fragment
		return <Fragment />;
	}
	return (
		<div
			className={classNames('wp-block-prc-quiz-question', {
				'is-style-image-on-top': imageOnTop,
			})}
			data-type={type}
		>
			<h3 className="wp-block-prc-quiz-question--label">
				<RawHTML>{question}</RawHTML>
			</h3>
			{'thermometer' === type && (
				<Thermometer
					questionUuid={uuid}
					answers={answers.map((a, index) => a.uuid)}
				/>
			)}
			{false !== image && (
				<div className="wp-block-prc-question--image">
					<img
						src={image.src}
						width={image.width}
						height={image.height}
						alt={question}
					/>
				</div>
			)}
			{'thermometer' !== type && (
				<div className="wp-block-prc-question--answers">
					{answers.map((answer, index) => (
						<Answer
							key={index}
							uuid={answer.uuid}
							answer={answer.answer}
							image={answer.image}
							conditional={answer.conditional}
							onClick={() => {
								answerHandler(answer.uuid, uuid, type);
							}}
						/>
					))}
				</div>
			)}
		</div>
	);
}

export default Question;
