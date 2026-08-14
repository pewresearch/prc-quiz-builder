/**
 * Quiz group-creators audience panel — wires AudienceBuildPanel to quiz REST.
 */

import { useCallback, useEffect, useState } from '@wordpress/element';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { AudienceBuildPanel } from '@prc/components';

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

/**
 * @param {Object}  props
 * @param {number}  props.postId        Quiz post ID.
 * @param {boolean} props.groupsEnabled Whether the quiz has groups enabled.
 */
export default function AudiencePanel({ postId, groupsEnabled }) {
	const [audiences, setAudiences] = useState([]);
	const [status, setStatus] = useState(
		/** @type {'idle' | 'loading' | 'building' | 'deleting' | 'error'} */ (
			'loading'
		)
	);
	const [errorMessage, setErrorMessage] = useState(
		/** @type {string|null} */ (null)
	);

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
			setStatus('building');
			setErrorMessage(null);
			try {
				await apiFetch({
					path: '/prc-api/v3/quiz/build-audience',
					method: 'POST',
					data: {
						quiz_id: postId,
						verification,
					},
				});
				await loadAudiences();
			} catch (error) {
				setErrorMessage(
					error?.message ||
						__('Audience build failed.', 'prc-quiz-builder')
				);
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

	return (
		<PanelBody
			title={__('Group creators audience', 'prc-quiz-builder')}
			initialOpen={false}
		>
			<AudienceBuildPanel
				helpText={__(
					'Build a Mandrill recipient list from users who created groups for this quiz. The list is saved for transactional email; no draft email is created here.',
					'prc-quiz-builder'
				)}
				audiences={audiences}
				status={status}
				errorMessage={errorMessage}
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
			/>
		</PanelBody>
	);
}
