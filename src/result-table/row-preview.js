/**
 * External Dependencies
 */
import clsx from 'clsx';

/**
 * WordPress Dependencies
 */
import { getColorClassName } from '@wordpress/block-editor';

export function previewIsCorrect(id) {
	const s = String(id || '');
	let h = 0;
	for (let i = 0; i < s.length; i++) {
		h = (h * 31 + s.charCodeAt(i)) % 2147483647;
	}
	return h % 2 === 0;
}

export function getRowClassName(colors, index, isCorrect) {
	const position = index + 1;
	const isEven = position % 2 === 0;

	const {
		rowBackgroundColor,
		altRowBackgroundColor,
		rowTextColor,
		altRowTextColor,
	} = colors;

	const rowColor = !isEven ? rowBackgroundColor : altRowBackgroundColor;
	const textColor = !isEven ? rowTextColor : altRowTextColor;

	return clsx('prc-quiz-result-table__row', {
		'has-text-color': !!textColor.color || !!textColor?.class,
		[getColorClassName('color', textColor?.slug)]: !!textColor?.slug,
		'has-background': !!rowColor.color || rowColor.class,
		[getColorClassName('background-color', rowColor?.slug)]:
			!!rowColor?.slug,
		'is-correct': isCorrect,
		'is-incorrect': !isCorrect,
	});
}
