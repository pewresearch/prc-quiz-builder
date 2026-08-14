/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import {
	BaseControl,
	Button,
	Notice,
	TextControl,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';

/**
 * Internal Dependencies
 */
import {
	createBucketId,
	parseScoreBuckets,
	validateExclusiveBuckets,
} from './score-buckets';

/**
 * Inspector control for the exclusive score-buckets catalog.
 *
 * @param {Object}   props
 * @param {string}   props.value         JSON string of buckets.
 * @param {Function} props.onChange      Receives next JSON string.
 */
export default function ScoreBucketsControl({ value, onChange }) {
	const buckets = useMemo(() => parseScoreBuckets(value), [value]);
	const validation = useMemo(
		() => validateExclusiveBuckets(buckets),
		[buckets]
	);

	const commit = (nextBuckets) => {
		// Re-normalize so empty labels persist as the same fallback the UI shows.
		onChange(JSON.stringify(parseScoreBuckets(nextBuckets)));
	};

	const updateBucket = (index, patch) => {
		const next = buckets.map((bucket, i) =>
			i === index ? { ...bucket, ...patch } : bucket
		);
		commit(next);
	};

	const removeBucket = (index) => {
		commit(buckets.filter((_, i) => i !== index));
	};

	const addBucket = () => {
		const lastMax =
			buckets.length > 0 ? buckets[buckets.length - 1].max : -1;
		commit([
			...buckets,
			{
				id: createBucketId(),
				label: `Group ${buckets.length + 1}`,
				min: lastMax + 1,
				max: lastMax + 1,
			},
		]);
	};

	return (
		<BaseControl
			id="prc-quiz-score-buckets"
			label={__('Score Buckets', 'prc-quiz')}
			help={__(
				'Named score ranges for results display. Ranges are inclusive and must not overlap (including shared endpoints).',
				'prc-quiz'
			)}
		>
			{!validation.ok && (
				<Notice status="error" isDismissible={false}>
					{validation.message}
				</Notice>
			)}
			{buckets.map((bucket, index) => (
				<div
					key={bucket.id}
					style={{
						border: '1px solid #ddd',
						padding: '8px',
						marginBottom: '8px',
					}}
				>
					<TextControl
						__nextHasNoMarginBottom
						label={__('Name', 'prc-quiz')}
						value={bucket.label}
						onChange={(label) => updateBucket(index, { label })}
					/>
					<div
						style={{
							display: 'flex',
							gap: '8px',
							alignItems: 'flex-end',
						}}
					>
						<NumberControl
							label={__('Min', 'prc-quiz')}
							value={bucket.min}
							onChange={(min) =>
								updateBucket(index, {
									min: Math.round(parseFloat(min) || 0),
								})
							}
						/>
						<NumberControl
							label={__('Max', 'prc-quiz')}
							value={bucket.max}
							onChange={(max) =>
								updateBucket(index, {
									max: Math.round(parseFloat(max) || 0),
								})
							}
						/>
						<Button
							variant="secondary"
							isDestructive
							onClick={() => removeBucket(index)}
						>
							{__('Remove', 'prc-quiz')}
						</Button>
					</div>
				</div>
			))}
			<Button variant="secondary" onClick={addBucket}>
				{__('Add Score Bucket', 'prc-quiz')}
			</Button>
		</BaseControl>
	);
}
