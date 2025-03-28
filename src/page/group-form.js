export default function GroupForm({
	quizType = 'quiz',
	groupsEnabled = false,
}) {
	if (quizType !== 'typology' || true !== groupsEnabled) {
		return null;
	}

	return (
		<div className="prc-quiz__form__group-creation">
			<p>
				<strong>
					Want to see how your classroom or community compares to the
					general public?
				</strong>{' '}
				Create a group quiz. You’ll receive a unique link to share with
				members of your group. As they complete the quiz, you can view
				the group’s results (no individual results are provided). See
				our{' '}
				<a
					href="https://www.pewresearch.org/typology-group-quiz-help-center/"
					target="_blank"
					rel="noreferrer"
				>
					Group Quiz FAQ
				</a>{' '}
				for more information.
			</p>
			<button className="prc-quiz__button__group-creation" type="button">
				Log In To Create A Group Quiz
			</button>
		</div>
	);
}
