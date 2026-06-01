/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';

const SAMPLE_ANSWERED = 4;
const SAMPLE_TOTAL = 7;
const SAMPLE_PERCENT = Math.round((SAMPLE_ANSWERED / SAMPLE_TOTAL) * 100);

export default function Edit() {
	const blockProps = useBlockProps({
		className: 'wp-block-prc-quiz-progress-bar',
	});

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
