/**
 * Quiz group-creators audience panel — wires AudienceBuildPanel to quiz REST.
 */

import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { AudienceBuildPanel } from '@prc/components';

const JOB_POLL_MS = 4000;

/**
 * Normalize a REST audience row into the shared snapshot shape.
 *
 * @param {Object} row REST audience payload.
 * @return {import('@prc/components').AudienceSnapshot} Normalized snapshot.
 */
function normalizeAudience(row) {
	return {
		key: row.key,
		label: row.label,
		count: Number(row.count) || 0,
		verification: row.verification,
		builtAt: row.builtAt ?? row.built_at ?? null,
		referencingPostIds: row.referencingPostIds ?? [],
		stats: row.stats || undefined,
	};
}

function getErrorMessage(error) {
	return error?.message || __('Audience build failed.', 'prc-quiz-builder');
}

/**
 * @param {Object}  props
 * @param {number}  props.postId        Quiz post ID.
 * @param {boolean} props.groupsEnabled Whether the quiz has groups enabled.
 */
export default function AudiencePanel({ postId, groupsEnabled }) {
	const [audiences, setAudiences] = useState([]);
	const [status, setStatus] = useState(
		/** @type {'idle' | 'loading' | 'queued' | 'scanning' | 'deleting' | 'creating-draft' | 'error'} */ (
			'loading'
		)
	);
	const [errorMessage, setErrorMessage] = useState(
		/** @type {string|null} */ (null)
	);
	const [jobStats, setJobStats] = useState(
		/** @type {{ scanned?: number|null, matched?: number|null, v2Groups?: number|null }} */ ({})
	);
	const pollToken = useRef(0);

	const loadAudiences = useCallback(async () => {
		if (!postId) {
			return;
		}
		setStatus('loading');
		setErrorMessage(null);
		try {
			const response = await apiFetch({
				path: `/prc-api/v3/quiz/audiences?quiz_id=${postId}`,
				method: 'GET',
			});
			setAudiences(
				(Array.isArray(response) ? response : []).map(normalizeAudience)
			);
			setStatus('idle');
		} catch (error) {
			setErrorMessage(
				error?.message ||
					__('Could not load audiences.', 'prc-quiz-builder')
			);
			setStatus('error');
		}
	}, [postId]);

	useEffect(() => {
		loadAudiences();
	}, [loadAudiences]);

	const runBuild = useCallback(
		async ({ verification }) => {
			const token = ++pollToken.current;
			setStatus('queued');
			setErrorMessage(null);
			setJobStats({});
			try {
				let view = await apiFetch({
					path: '/prc-api/v3/quiz/build-audience',
					method: 'POST',
					data: {
						quiz_id: postId,
						verification,
					},
				});
				while (
					token === pollToken.current &&
					(view?.phase === 'queued' || view?.phase === 'scanning')
				) {
					setStatus(view.phase);
					setJobStats({
						scanned: view.scannedGroups ?? null,
						matched: view.matchedUsers ?? null,
						v2Groups: view.v2Groups ?? null,
					});
					await new Promise((resolve) =>
						window.setTimeout(resolve, JOB_POLL_MS)
					);
					if (token !== pollToken.current) {
						return;
					}
					view = await apiFetch({
						path: `/prc-email-builder/v1/audience-jobs/${view.jobId}`,
					});
				}
				if (token !== pollToken.current) {
					return;
				}
				if (view?.phase === 'failed') {
					throw new Error(
						view.error?.message ||
							__('Audience build failed.', 'prc-quiz-builder')
					);
				}
				await loadAudiences();
			} catch (error) {
				if (token !== pollToken.current) {
					return;
				}
				setErrorMessage(getErrorMessage(error));
				setStatus('error');
			}
		},
		[loadAudiences, postId]
	);

	const runDelete = useCallback(
		async ({ verification, key }) => {
			setStatus('deleting');
			setErrorMessage(null);
			try {
				const params = new URLSearchParams({
					quiz_id: String(postId),
					verification,
					key,
				});
				await apiFetch({
					path: `/prc-api/v3/quiz/audiences?${params.toString()}`,
					method: 'DELETE',
				});
				await loadAudiences();
			} catch (error) {
				setErrorMessage(
					error?.message ||
						__('Audience delete failed.', 'prc-quiz-builder')
				);
				setStatus('error');
			}
		},
		[loadAudiences, postId]
	);

	const runCreateDraft = useCallback(
		async ({ key }) => {
			setStatus('creating-draft');
			setErrorMessage(null);
			try {
				const result = await apiFetch({
					path: '/prc-email-builder/v1/transactional/create-from-audience',
					method: 'POST',
					data: {
						audience_key: key,
						quiz_id: postId,
					},
				});
				if (result?.edit_url) {
					window.location.href = result.edit_url;
					return;
				}
				setErrorMessage(
					__(
						'Draft created but no editor URL was returned.',
						'prc-quiz-builder'
					)
				);
				setStatus('error');
			} catch (error) {
				setErrorMessage(
					error?.message ||
						__('Could not create email draft.', 'prc-quiz-builder')
				);
				setStatus('error');
			}
		},
		[postId]
	);

	return (
		<PanelBody
			title={__('Group creators audience', 'prc-quiz-builder')}
			initialOpen={false}
		>
			<AudienceBuildPanel
				helpText={__(
					'Build a Mandrill recipient list from users who created groups for this quiz. Rebuild the list when membership changes, or create a transactional email draft for that audience. You can leave this screen while a build runs.',
					'prc-quiz-builder'
				)}
				audiences={audiences}
				status={status}
				errorMessage={errorMessage}
				jobStats={jobStats}
				disabled={!groupsEnabled && audiences.length === 0}
				disabledHelpText={
					!groupsEnabled && audiences.length === 0
						? __(
								'Groups are not enabled on this quiz. Enable groups to generate a new audience, or keep existing lists if you already built one.',
								'prc-quiz-builder'
							)
						: undefined
				}
				onBuild={runBuild}
				onRebuild={runBuild}
				onDelete={runDelete}
				onCreateDraft={runCreateDraft}
			/>
		</PanelBody>
	);
}
