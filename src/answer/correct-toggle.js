/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { BlockControls } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import Icon from './icon';

export function CorrectToolbar({ context, correct, onToggle }) {
	const quizType = context['prc-quiz/type'];
	const controls = useMemo(() => {
		if ('freeform' === quizType) {
			return [];
		}
		return [
			{
				icon: <Icon variant={correct ? `correct` : 'incorrect'} />,
				title: correct ? __('Correct Answer') : __('Incorrect Answer'),
				isActive: correct,
				onClick: () => {
					onToggle();
				},
			},
		];
	}, [correct, quizType, onToggle]);
	return <BlockControls controls={controls} />;
}
