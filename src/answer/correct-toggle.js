/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { useMemo } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import Icon from './icon';

/**
 * Tri-state correct control for knowledge quizzes: true | null | false.
 *
 * @param {Object}   props
 * @param {Object}   props.context
 * @param {boolean|null|undefined} props.correct
 * @param {Function} props.onChange  Receives next correct value.
 */
export function CorrectToolbar({ context, correct, onChange }) {
	const quizType = context['prc-quiz/type'];
	const options = useMemo(
		() => [
			{
				value: true,
				icon: <Icon variant="correct" />,
				title: __('Correct Answer', 'prc-quiz'),
			},
			{
				value: null,
				icon: <Icon variant="notSure" />,
				title: __('Not Sure', 'prc-quiz'),
			},
			{
				value: false,
				icon: <Icon variant="incorrect" />,
				title: __('Incorrect Answer', 'prc-quiz'),
			},
		],
		[]
	);

	if ('freeform' === quizType) {
		return null;
	}

	return (
		<BlockControls>
			<ToolbarGroup>
				{options.map((option) => (
					<ToolbarButton
						key={String(option.value)}
						icon={option.icon}
						label={option.title}
						title={option.title}
						isActive={correct === option.value}
						onClick={() => onChange(option.value)}
					/>
				))}
			</ToolbarGroup>
		</BlockControls>
	);
}
