/* eslint-disable import/no-relative-packages */
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
import Question from './question';
import Toolbar from './toolbar';

function IntroductionPage({ page }) {
	let content = '';
	page.content.map((c) => {
		if (c.hasOwnProperty('rendered')) {
			content += c.rendered;
		}
	});

	const { introductionNote } = page;

	return (
		<Fragment>
			<div className="wp-block-prc-quiz-page__innerblocks">
				<RawHTML>{content}</RawHTML>
			</div>
			<Toolbar />
			{introductionNote && (
				<div className="introduction--note">
					<RawHTML>{introductionNote}</RawHTML>
				</div>
			)}
		</Fragment>
	);
}

function Page({ uuid }) {
	const { isLastPage, quizData, currentPage } = useQuiz();

	if (undefined !== quizData && uuid !== currentPage) {
		// eslint-disable-next-line react/jsx-no-useless-fragment
		return <Fragment />;
	}

	const page = quizData.filter((e) => uuid === e.uuid).pop();
	const classes = classNames('wp-block-prc-quiz-page', {
		'is-last-page': isLastPage,
		introduction: page.introductionPage,
	});

	return (
		<div className={classes}>
			{page.introductionPage && <IntroductionPage page={page} />}
			{!page.introductionPage && (
				<h4 className="page-title">{page.title}</h4>
			)}
			{!page.introductionPage &&
				page.content.map((c) => {
					if (c.hasOwnProperty('rendered')) {
						return <RawHTML>{c.rendered}</RawHTML>;
					}
					return (
						<Question
							uuid={c.uuid}
							answers={c.answers}
							question={c.question}
							image={c.image}
							imageOnTop={c.imageOnTop}
							type={c.type}
							conditional={c.conditional}
						/>
					);
				})}
		</div>
	);
}

export default Page;
