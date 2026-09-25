/**
 * WordPress Dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { DropdownMenu, MenuItem, MenuGroup } from '@wordpress/components';
import { arrowLeft, arrowRight, trash } from '@wordpress/icons';

/**
 * Prompt for a demographic column name.
 *
 * @param {string} message      Dialog title.
 * @param {string} currentLabel Current or default value.
 * @return {string|null} Trimmed name, or null when cancelled or empty.
 */
export function promptColumnName(message, currentLabel = '') {
	// eslint-disable-next-line no-alert -- editors asked for a browser dialog
	const next = window.prompt(message, currentLabel || '');
	if (null === next) {
		return null;
	}
	const trimmed = next.trim();
	return trimmed || null;
}

/**
 * Prompt for a new demographic column name.
 *
 * @param {string} currentLabel Current column name.
 * @return {string|null} Trimmed name, or null when cancelled or empty.
 */
export function promptRenameColumn(currentLabel) {
	return promptColumnName(__('Rename column', 'prc-quiz'), currentLabel);
}

/**
 * Prompt for the name of a demographic column to add.
 *
 * @return {string|null} Trimmed name, or null when cancelled or empty.
 */
export function promptAddColumn() {
	return promptColumnName(__('Add demographic column', 'prc-quiz'));
}

/**
 * Confirm deletion of a demographic column.
 *
 * @param {string} label Column name.
 * @return {boolean} True when the editor confirms.
 */
export function confirmRemoveColumn(label) {
	// eslint-disable-next-line no-alert -- confirm before deleting stored column values
	return window.confirm(
		sprintf(
			/* translators: %s: demographic column name */
			__('Remove the "%s" column and its values?', 'prc-quiz'),
			label || __('Demographic', 'prc-quiz')
		)
	);
}

/**
 * DataViews column heading menu for a demographic break.
 *
 * @param {Object}   props
 * @param {string}   props.label    Column name.
 * @param {number}   props.index    Column index.
 * @param {number}   props.total    Number of demographic columns.
 * @param {Function} props.onRename Rename handler (index, value).
 * @param {Function} props.onRemove Remove handler (index).
 * @param {Function} props.onMove   Reorder handler (fromIndex, toIndex).
 * @return {Element} Heading dropdown.
 */
export default function DemoBreakColumnHeader({
	label,
	index,
	total,
	onRename,
	onRemove,
	onMove,
}) {
	const displayLabel = label || __('Demographic', 'prc-quiz');
	const isFirst = 0 === index;
	const isLast = index >= total - 1;

	return (
		<DropdownMenu
			className="quiz-results-data__column-header"
			icon={null}
			text={displayLabel}
			label={sprintf(
				/* translators: %s: demographic column name */
				__('Options for %s', 'prc-quiz'),
				displayLabel
			)}
			toggleProps={{
				variant: 'tertiary',
				size: 'compact',
				showTooltip: false,
			}}
			popoverProps={{
				placement: 'bottom-start',
			}}
		>
			{({ onClose }) => (
				<>
					<MenuGroup>
						<MenuItem
							onClick={() => {
								const next = promptRenameColumn(label);
								if (null !== next) {
									onRename(index, next);
								}
								onClose();
							}}
						>
							{__('Rename', 'prc-quiz')}
						</MenuItem>
						<MenuItem
							icon={arrowLeft}
							disabled={isFirst}
							onClick={() => {
								onMove(index, index - 1);
								onClose();
							}}
						>
							{__('Move left', 'prc-quiz')}
						</MenuItem>
						<MenuItem
							icon={arrowRight}
							disabled={isLast}
							onClick={() => {
								onMove(index, index + 1);
								onClose();
							}}
						>
							{__('Move right', 'prc-quiz')}
						</MenuItem>
					</MenuGroup>
					<MenuGroup>
						<MenuItem
							icon={trash}
							isDestructive
							onClick={() => {
								if (confirmRemoveColumn(displayLabel)) {
									onRemove(index);
								}
								onClose();
							}}
						>
							{__('Remove column', 'prc-quiz')}
						</MenuItem>
					</MenuGroup>
				</>
			)}
		</DropdownMenu>
	);
}
