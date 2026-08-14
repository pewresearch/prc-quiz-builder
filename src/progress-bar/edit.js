/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Internal Dependencies
 */
import { CIRCLES_CLASS } from './variations';

const SAMPLE_ANSWERED = 4;
const SAMPLE_TOTAL = 7;
const SAMPLE_PERCENT = Math.round((SAMPLE_ANSWERED / SAMPLE_TOTAL) * 100);

const SAMPLE_STEPS = [
	{ mark: '✓', className: 'is-correct' },
	{ mark: '✗', className: 'is-incorrect' },
	{ mark: '?', className: 'is-unsure' },
	{ mark: '✓', className: 'is-correct' },
	{ mark: '?', className: 'is-unanswered' },
	{ mark: '✗', className: 'is-incorrect' },
	{ mark: '?', className: 'is-unanswered' },
];

export default function Edit({ attributes }) {
	const isCircles = attributes?.className?.includes(CIRCLES_CLASS);
	const blockProps = useBlockProps({
		className: 'wp-block-prc-quiz-progress-bar',
	});

	if (isCircles) {
		return (
			<div {...blockProps}>
				<span className="wp-block-prc-quiz-progress-bar__label">
					{__('4 of 7 answered', 'progress-bar')}
				</span>
				<ol className="wp-block-prc-quiz-progress-bar__steps">
					{SAMPLE_STEPS.map((step, index) => (
						<li
							key={index}
							className={`wp-block-prc-quiz-progress-bar__step ${step.className}`}
						>
							{step.mark}
						</li>
					))}
				</ol>
			</div>
		);
	}

	return (
		<div {...blockProps}>
			<span className="wp-block-prc-quiz-progress-bar__label">
				{__('4 of 7 answered', 'progress-bar')}
			</span>
			<div
				className="wp-block-prc-quiz-progress-bar__track"
				role="progressbar"
				aria-valuenow={SAMPLE_PERCENT}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuetext="4 of 7 answered"
			>
				<div
					className="wp-block-prc-quiz-progress-bar__fill"
					style={{ width: `${SAMPLE_PERCENT}%` }}
				/>
			</div>
		</div>
	);
}
