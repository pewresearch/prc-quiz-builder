/**
 * External Dependencies
 */
import clsx from 'clsx';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { Placeholder } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import Icon from './icon';

export default function Edit({
	isSelected,
	__unstableLayoutClassNames: layoutClassNames,
}) {
	const blockProps = useBlockProps({
		className: clsx(layoutClassNames),
	});
	const innerBlocksProps = useInnerBlocksProps(blockProps, {});

	return (
		<div {...blockProps}>
			<Placeholder
				label={__('Results', 'prc-quiz')}
				instructions={__(
					'Contains the results of the users awarded archetype for this quiz. This is the final page of the quiz.',
					'prc-quiz'
				)}
			/>
			{innerBlocksProps.children}
		</div>
	);
}
