/**
 * WordPress Dependencies
 */
import { useState, useCallback, useRef, useEffect } from '@wordpress/element';
import { TextareaControl } from '@wordpress/components';

const DEBOUNCE_MS = 300;

/**
 * An inline-editable text cell for the DataViews table.
 * Debounces onChange to avoid excessive store dispatches.
 *
 * @param {Object}   props
 * @param {string}   props.value    Current text value.
 * @param {Function} props.onChange Callback receiving the new text.
 * @param {boolean}  props.hidden   If true, renders an empty cell (for grouped rows).
 * @param {string}   props.label    Accessible label for the input.
 * @return {Element} The editable cell.
 */
export default function EditableCell({ value, onChange, hidden, label }) {
	const [localValue, setLocalValue] = useState(value ?? '');
	const timerRef = useRef(null);
	// Tracks the value buffered by the debounce that has not yet been committed.
	const pendingValueRef = useRef(null);
	// Always holds the latest onChange so refs inside effects stay current.
	const onChangeRef = useRef(onChange);

	useEffect(() => {
		onChangeRef.current = onChange;
	});

	useEffect(() => {
		setLocalValue(value ?? '');
	}, [value]);

	const handleChange = useCallback((newValue) => {
		setLocalValue(newValue);
		pendingValueRef.current = newValue;
		if (timerRef.current) {
			clearTimeout(timerRef.current);
		}
		timerRef.current = setTimeout(() => {
			onChangeRef.current(newValue);
			timerRef.current = null;
			pendingValueRef.current = null;
		}, DEBOUNCE_MS);
	}, []);

	// Flush any buffered change on unmount so edits made within the debounce
	// window are not silently discarded when the modal closes.
	useEffect(() => {
		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
				onChangeRef.current(pendingValueRef.current);
			}
		};
	}, []);

	if (hidden) {
		return <span className="quiz-quick-edit__cell--grouped" />;
	}

	return (
		<TextareaControl
			__nextHasNoMarginBottom
			value={localValue}
			onChange={handleChange}
			label={label}
			hideLabelFromVision
			rows={2}
			className="quiz-quick-edit__editable-cell"
		/>
	);
}
