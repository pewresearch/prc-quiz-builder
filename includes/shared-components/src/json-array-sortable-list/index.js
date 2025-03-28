/**
 * WordPress Dependencies
 */
import { Fragment, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	BaseControl,
	Button,
	CardDivider,
	__experimentalScrollable as Scrollable,
	__experimentalInputControl as InputControl,
} from '@wordpress/components';

const JSONSortableList = ({
	label = null,
	help = null,
	values = [68],
	labels = ['Total'],
	onChange,
	disableAddingItems = false,
	allowReset = false,
}) => {
	const [items, setItems] = useState(values);

	useEffect(() => {
		onChange(items);
	}, [items]);

	return (
		<BaseControl help={help}>
			<BaseControl.VisualLabel>
				<span style={{ display: 'inline-block', marginBottom: '1em' }}>
					{label}
				</span>
			</BaseControl.VisualLabel>
			{items.length !== 0 &&
				items.map((e, index) => {
					return (
						<Fragment key={index}>
							<div
								style={{
									display: 'flex',
									alignItems: 'flex-end',
								}}
							>
								<div style={{ flexGrow: '1' }}>
									<InputControl
										label={
											Array.isArray(labels)
												? typeof labels[index] !==
													'undefined'
													? labels[index]
													: 'Detached Index'
												: labels
										} // If labels is an array (matching the number of values), use the label at the index. Otherwise, use the singular labels value.
										value={e}
										onChange={(val) => {
											const newItems = [...items];
											newItems[index] = val;
											setItems(newItems);
										}}
									/>
								</div>
								{(false === disableAddingItems ||
									(Array.isArray(labels) &&
										typeof labels[index] ===
											'undefined')) && (
									<div>
										<Button
											isDestructive
											onClick={() =>
												setItems(
													items.filter(
														(e, i) => i !== index
													)
												)
											}
											text={__('X')}
											label={__('Remove')}
											style={{
												height: '30px',
												marginLeft: '-1px',
											}}
										/>
									</div>
								)}
							</div>
							<CardDivider />
						</Fragment>
					);
				})}
			{false === disableAddingItems && (
				<div>
					<Button isPrimary onClick={() => setItems([...items, 0])}>
						Add Item
					</Button>
				</div>
			)}
			{true === allowReset && Array.isArray(labels) && (
				<div>
					<Button
						isDestructive
						onClick={() => setItems(labels.map(() => ''))}
					>
						Reset
					</Button>
				</div>
			)}
		</BaseControl>
	);
};

export default JSONSortableList;
