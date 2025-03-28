/**
 * External Dependencies
 */
import { useLocalStorage } from '@prc/hooks';

/**
 * WordPress Dependencies
 */
import {
	useState,
	useEffect,
	useContext,
	useRef,
	createContext,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs, getQueryArg, getPath } from '@wordpress/url';
import apiFetch from '@wordpress/api-fetch';

const storageKeyHashGen = (quizId, prefix = false) =>
	`${false !== prefix ? `${prefix}-` : ''}prc-quiz-${quizId}`;

const quizContext = createContext();

const { prcQuizController, location, localStorage, open } = window;
const { nonce } = prcQuizController;
const { href } = location;

// eslint-disable-next-line max-lines-per-function
const useQuizController = (quizId, isEmbedded = false) => {
	const placeholder = useRef(
		document.querySelector(
			'.wp-block-prc-quiz-controller--react-placeholder'
		)
	);
	const controllerRef = useRef(
		document.querySelector('.wp-block-prc-quiz-controller--react-app')
	);
	const isIframe =
		getQueryArg(href, 'iframe') || getPath(href).includes('/iframe');
	const isPreview =
		href.includes('post_type=quiz') || href.includes('preview=1');

	const [loaded, toggleLoaded] = useState(false);
	const [processing, toggleProcessing] = useState(false);
	const [currentPage, setCurrentPage] = useState(false);
	const [isLastPage, setIsLastPage] = useState(false);
	const [isFirstPage, setIsFirstPage] = useState(false);
	const [quizData, setQuizData] = useState([]);
	const [quizUrl, setQuizUrl] = useState(false);
	const [quizTitle, setQuizTitle] = useState(null);
	const [quizSlug, setQuizSlug] = useState(null);
	const [submissionNonce, setNonce] = useState(false);
	const [gaTrackingEnabled, toggleGaTracking] = useState(false);
	const [groupsEnabled, toggleGroupsEnabled] = useState(false);
	const [mailChimpListEnabled, toggleMailChimpEnabled] = useState(false);
	const [quizType, setQuizType] = useState(false);
	const [threshold, setThreshold] = useState(4);

	// User Data:
	const [canSubmit, toggleCanSubmit] = useState(false);
	const [userSubmission, setUserSubmission] = useLocalStorage(
		storageKeyHashGen(quizId, 'answers'),
		[]
	);
	const [resumeQuizStateModal, toggleResumeQuizStateModal] = useState(false);
	const groupId = getQueryArg(href, 'group');

	/// /////////////////////////////////////////////////////////////////////////

	/**
	 * Clears the user's submission and resets the current page back to 0.
	 */
	const resetUserSubmission = () => {
		setUserSubmission([]);
		setCurrentPage(quizData[0].uuid);
	};

	const getStorageSeed = (defaultTo = false, prefix = false) => {
		const key = storageKeyHashGen(quizId, prefix);
		const saved = localStorage.getItem(key);
		const initialValue = JSON.parse(saved);
		return initialValue || defaultTo;
	};

	// Checks if the uuid matches the first uuid in the quizData array.
	const checkForFirstPage = (uuid) => quizData[0].uuid === uuid;

	// Checks if the uuid matches the last uuid in the quizData array.
	const checkForLastPage = (uuid) =>
		quizData.length ===
		quizData.findIndex((page) => page.uuid === uuid) + 1;

	const answerHandler = (uuid, questionUuid, type) => {
		const answers = userSubmission;
		if ('single' === type || 'thermometer' === type) {
			const pages = quizData;
			// Go through the pages and get the question with the matching questionUuid
			const { questions } = pages.find((page) =>
				page.questions.find(
					(question) => question.uuid === questionUuid
				)
			);
			const thisQuestion = questions.find((q) => q.uuid === questionUuid);
			const a = thisQuestion.answers.map((answer) => answer.uuid);
			// If the answers array contains values from a then remove them from the answers array.
			const answersToRemove = a.filter((answer) =>
				answers.includes(answer)
			);
			answersToRemove.forEach((a) => {
				answers.splice(answers.indexOf(a), 1);
			});
			answers.push(uuid);
		} else if (-1 === answers.indexOf(uuid)) {
			answers.push(uuid);
		} else {
			answers.splice(answers.indexOf(uuid), 1);
		}

		// @TODO, if there is a conditional question and then we should address that.

		setUserSubmission([...answers]);
	};

	/**
	 * Handle quiz submission to rest api endpoint. Return score and archetype hash to then redirect user to results page.
	 *
	 * @param {*} submission
	 * @return
	 */
	const submit = () => {
		let path = `prc-api/v3/quiz/submit/?quizId=${quizId}&nonce=${submissionNonce}`;
		if (groupId) {
			path = addQueryArgs(path, { groupId });
		}
		toggleProcessing(true);
		console.log('Debug Data:', userSubmission, path);
		apiFetch({
			path,
			method: 'POST',
			data: { answers: userSubmission },
		})
			.then(({ hash, time }) => {
				console.log('submission_response', hash, time);
				// Re-enable the loading indicator.
				toggleLoaded(false);
				// Clear the user submission and set a timeout to redirect to the results page.
				setUserSubmission([]);
				setTimeout(() => {
					const args = {};
					if (groupId) {
						args.group = groupId;
					}
					if (isPreview) {
						args.showResults = true;
						args.archetype = hash;
					}
					// If an embedded iframe on the site then do not open results in a new window, instead force the iframe and quizEmbed flag on the results page.
					if (isIframe && true === isEmbedded) {
						args.iframe = true;
						args.quizEmbed = true;
					}
					// Redirect to results page.
					const resultsUrl = addQueryArgs(
						!isPreview ? `${quizUrl}/results/${hash}` : quizUrl,
						args
					);
					console.log('RESULTS URL = ', resultsUrl);
					// If the quiz is being rendered in an iframe then open the results in a new window.
					if (isIframe && true !== isEmbedded) {
						open(resultsUrl);
					} else {
						window.location.href = resultsUrl;
					}
				}, 1000);
			})
			.catch((error) => {
				console.error(error);
				alert(error.message);
			});
	};

	const handleNextButton = () => {
		const currentIndex = quizData.findIndex(
			(page) => page.uuid === currentPage
		);

		// @TODO need to look into why this was causing trouble. I've disabled this on all quizzes for now, hence the opt in.
		// if (gaTrackingEnabled) {
		// 	const gaEvent = {
		// 		hitType: 'event',
		// 		eventCategory: 'Quiz Questions',
		// 		eventAction: 'Question Progress',
		// 		eventLabel: `Completed Question ${currentIndex}`,
		// 	};
		// 	if (currentIndex === Math.floor(quizData.length * 0.2)) {
		// 		ga('send', gaEvent);
		// 	}
		// 	if (currentIndex === Math.floor(quizData.length * 0.4)) {
		// 		ga('send', gaEvent);
		// 	}
		// 	if (currentIndex === Math.floor(quizData.length * 0.6)) {
		// 		ga('send', gaEvent);
		// 	}
		// 	if (currentIndex === Math.floor(quizData.length * 0.8)) {
		// 		ga('send', gaEvent);
		// 	}
		// 	// Finished Quiz
		// 	if (isLastPage && canSubmit) {
		// 		ga('send', gaEvent);
		// 	}
		// }

		/**
		 * If this is the last page then do not increment the current page, instead submit the quiz.
		 */
		if (isLastPage) {
			if (false === canSubmit) {
				// eslint-disable-next-line no-alert, no-undef
				alert(
					__(
						'You cannot submit this quiz, please answer more questions.'
					)
				);
			} else {
				submit();
			}
			return;
		}

		let nextItem = currentIndex;
		if (0 <= currentIndex && currentIndex < quizData.length - 1) {
			nextItem = quizData[currentIndex + 1].uuid;
		}

		setCurrentPage(nextItem);
	};

	const handlePrevButton = () => {
		const currentIndex = quizData.findIndex(
			(page) => page.uuid === currentPage
		);

		/**
		 * Handle erroneous data.
		 * If the current index is negative, something is wrong, then return to the first page.
		 */
		if (0 > currentIndex) {
			setCurrentPage(quizData[0].uuid);
			return;
		}

		let prevItem = currentIndex;
		if (0 < currentIndex && currentIndex < quizData.length) {
			prevItem = quizData[currentIndex - 1].uuid;
		}
		setCurrentPage(prevItem);
	};

	/// /////////////////////////////////////////////////////////////////////////////
	// Control the quiz.

	/**
	 * Initialize the quiz, setup the initial state of the quiz context.
	 */
	useEffect(() => {
		// Check there is a nonce...
		if (false === nonce) {
			return;
		}
		if (0 === quizData.length) {
			apiFetch({
				path: `/prc-api/v3/quiz/get/?quizId=${quizId}&nonce=${nonce}`,
			})
				.then((quiz) => {
					setNonce(quiz.submissionNonce);
					setThreshold(quiz.threshold);
					setQuizType(quiz.type);
					setQuizTitle(quiz.quizTitle);
					setQuizSlug(quiz.quizSlug);
					// Remove trailing slash from quiz url.
					setQuizUrl(
						!isPreview ? quiz.quizUrl.replace(/\/$/, '') : href
					);
					setQuizData(quiz.pages);
					toggleGroupsEnabled(quiz.groupsEnabled);
					toggleGaTracking(quiz.gaTrackingEnabled);
					toggleMailChimpEnabled(0 < quiz.mailchimpListId.length);
					console.log('quizData', quiz);
				})
				.catch((error) => {
					console.error(quizId, error);
					alert(error.message);
				});
		}
		if (isIframe) {
			console.warn('THIS IS BEING DELIVERED VIA IFRAME');
		}
		if (isPreview) {
			console.warn('THIS IS A PREVIEW');
		}
	}, []);

	/**
	 * Watch for quiz data to be loaded and then flag loaded true.
	 */
	useEffect(() => {
		console.log('Checking quiz data...', quizData);
		if (0 !== quizData.length) {
			toggleLoaded(true);
		}
	}, [quizData]);

	/**
	 * When the quiz data is finally loaded and the loaded flag changes to true then
	 * restore the current page from local storage (if user submission data exists)
	 * or set the current page to the first page.
	 */
	useEffect(() => {
		if (true === loaded) {
			// Hide the loading placeholder.
			controllerRef.current.style.display = 'block';
			placeholder.current.style.display = 'none';
			// Set the current page to the first page.
			const storedPage = getStorageSeed(quizId, 'current-page');
			if (
				0 !== userSubmission.length &&
				false !== storedPage &&
				-1 !== storedPage
			) {
				toggleResumeQuizStateModal(true);
				setCurrentPage(storedPage);
			} else {
				setCurrentPage(quizData[0].uuid);
			}
		} else {
			controllerRef.current.style.display = 'none';
			placeholder.current.style.display = 'block';
		}
	}, [loaded]);

	/**
	 * Handle switching pages and changing active status.
	 */
	useEffect(() => {
		if (false !== currentPage && false !== quizData) {
			setIsLastPage(checkForLastPage(currentPage));
			setIsFirstPage(checkForFirstPage(currentPage));

			localStorage.setItem(
				storageKeyHashGen(quizId, 'current-page'),
				JSON.stringify(currentPage)
			);
		}
	}, [currentPage]);

	useEffect(() => {
		toggleCanSubmit(threshold <= userSubmission.length);
	}, [userSubmission]);

	/// /////////////////////////////////////////////////////////////////////////////

	return {
		loaded,
		submit,
		isPreview,
		isLastPage,
		isFirstPage,
		processing,
		currentPage,
		groupsEnabled,
		mailChimpListEnabled,
		quizData,
		canSubmit,
		userSubmission,
		resumeQuizStateModal,
		toggleResumeQuizStateModal,
		answerHandler,
		resetUserSubmission,
		handleNextButton,
		handlePrevButton,
		quizId,
		quizType,
		quizTitle,
		quizSlug,
		submissionNonce,
	};
};

// Provider component that wraps your app and makes quiz object ...
// ... available to any child component that calls useQuiz().
function ProvideQuiz({ quizId, isEmbedded, children }) {
	const quiz = useQuizController(quizId, isEmbedded);
	return <quizContext.Provider value={quiz}>{children}</quizContext.Provider>;
}

// Hook for child components to get the quiz object ...
// ... and re-render when it changes.
const useQuiz = () => useContext(quizContext);

export { ProvideQuiz, useQuiz };
export default ProvideQuiz;
