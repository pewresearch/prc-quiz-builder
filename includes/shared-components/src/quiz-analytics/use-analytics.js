import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

import { ANALYTICS_POLL_INTERVAL_MS } from './utils';

async function fetchQuizAnalytics(postId) {
	const response = await apiFetch({
		path: `/wp/v2/quiz/${postId}?_fields=_submissions`,
		method: 'GET',
	});

	return {
		success: true,
		...response._submissions,
	};
}

async function fetchGroupAnalytics(postId) {
	const response = await apiFetch({
		path: `/wp/v2/quiz/${postId}?_fields=_group_analytics`,
		method: 'GET',
	});

	return response._group_analytics;
}

function usePollAnalytics(postId, fetcher) {
	const [data, setData] = useState(null);
	const [error, setError] = useState('');

	useEffect(() => {
		if (!postId) {
			return undefined;
		}

		let isMounted = true;

		const loadAnalytics = () => {
			fetcher(postId)
				.then((nextData) => {
					if (isMounted) {
						setData(nextData);
						setError('');
					}
				})
				.catch((fetchError) => {
					if (isMounted) {
						setError(
							fetchError?.message ||
								__(
									'Unable to load analytics data.',
									'prc-quiz-builder'
								)
						);
					}
					// eslint-disable-next-line no-console
					console.error({ fetchError });
				});
		};

		loadAnalytics();

		const pollIntervalId = window.setInterval(
			loadAnalytics,
			ANALYTICS_POLL_INTERVAL_MS
		);

		return () => {
			isMounted = false;
			window.clearInterval(pollIntervalId);
		};
	}, [postId, fetcher]);

	return { data, error };
}

export function useQuizAnalytics(postId) {
	return usePollAnalytics(postId, fetchQuizAnalytics);
}

export function useGroupAnalytics(postId) {
	return usePollAnalytics(postId, fetchGroupAnalytics);
}
