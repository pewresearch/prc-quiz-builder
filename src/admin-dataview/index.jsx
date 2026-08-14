/**
 * WordPress Dependencies
 */
import { Button, createSlotFill } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import getQuizActions from './actions';
import getQuizFields, { getDefaultVisibleFields } from './fields';
import QuizStatsModal from './quiz-stats-modal';
import './style.scss';

const { Fill: HeaderActionsFill } = createSlotFill(
	'prcWpAdminDataview.HeaderActions'
);
const { Fill: PageExtrasFill } = createSlotFill(
	'prcWpAdminDataview.PageExtras'
);
const PAGE_EXTRA_EVENT = 'prcWpAdminDataview.pageExtra';

function isQuizList() {
	return 'quiz' === window?.prcWpAdminDataview?.postType;
}

function emitPageExtra(type, payload) {
	window.dispatchEvent(
		new CustomEvent(PAGE_EXTRA_EVENT, {
			detail: { type, payload },
		})
	);
}

function QuizPageExtras() {
	const [quiz, setQuiz] = useState(null);

	useEffect(() => {
		const handlePageExtra = (event) => {
			if ('quiz-stats' === event.detail?.type) {
				setQuiz(event.detail.payload);
			}
		};
		window.addEventListener(PAGE_EXTRA_EVENT, handlePageExtra);
		return () =>
			window.removeEventListener(PAGE_EXTRA_EVENT, handlePageExtra);
	}, []);

	return <QuizStatsModal quiz={quiz} onClose={() => setQuiz(null)} />;
}

function QuizFills() {
	const newQuizUrl =
		window?.prcWpAdminDataview?.quiz?.newQuizUrl ||
		'post-new.php?post_type=quiz';

	return (
		<>
			<span>{__('Browse and manage quizzes.', 'prc-quiz-builder')}</span>
			<HeaderActionsFill>
				<Button variant="primary" href={newQuizUrl}>
					{__('Add New Quiz', 'prc-quiz-builder')}
				</Button>
			</HeaderActionsFill>
			<PageExtrasFill>
				<QuizPageExtras />
			</PageExtrasFill>
		</>
	);
}

addFilter('prcWpAdminDataview.fields', 'prc-quiz-builder/fields', (fields) => {
	if (!isQuizList()) {
		return fields;
	}
	return [
		...fields,
		...getQuizFields({
			onOpenStats: (item) => emitPageExtra('quiz-stats', item),
		}),
	];
});

addFilter(
	'prcWpAdminDataview.actions',
	'prc-quiz-builder/actions',
	(actions) => (isQuizList() ? getQuizActions(actions) : actions)
);

addFilter(
	'prcWpAdminDataview.defaultVisibleFields',
	'prc-quiz-builder/default-fields',
	(fields) => (isQuizList() ? getDefaultVisibleFields() : fields)
);

addFilter(
	'prcWpAdminDataview.pageDescription',
	'prc-quiz-builder/page-description',
	(description) => (isQuizList() ? <QuizFills /> : description)
);

addFilter(
	'prcWpAdminDataview.restQuery',
	'prc-quiz-builder/rest-query',
	(args, { view }) => {
		if (!isQuizList()) {
			return args;
		}

		const mappedArgs = { ...args };
		const filterMap = {
			quizType: 'quiz_type',
			displayType: 'display_type',
			researchTeams: 'research_team',
			groupsEnabled: 'groups_enabled',
		};
		Object.entries(filterMap).forEach(([field, queryArg]) => {
			if (mappedArgs[field]) {
				mappedArgs[queryArg] = mappedArgs[field];
				delete mappedArgs[field];
			}
		});

		const orderbyMap = {
			submissions: 'submissions',
			questionCount: 'questions',
		};
		if (orderbyMap[view.sort?.field]) {
			mappedArgs.orderby = orderbyMap[view.sort.field];
		}

		delete mappedArgs.post_type;
		return mappedArgs;
	}
);
