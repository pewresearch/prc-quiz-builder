/**
 * WordPress Dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	BaseControl,
	Button,
	CardDivider,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalInputControl as InputControl,
} from '@wordpress/components';

function getItemLabel(labels, index) {
	if (!Array.isArray(labels)) {
		return labels;
	}
	if (typeof labels[index] !== 'undefined') {
		return labels[index];
	}
	return 'Detached Index';
}

const JSONSortableList = ({
	label = null,
	help = null,
	values = [68],
	labels = ['Total'],
	onChange,
	disableAddingItems = false,
	allowReset = false,
}) => {
	const items = values;

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
										label={getItemLabel(labels, index)}
										value={e}
										onChange={(val) => {
											const newItems = [...items];
											newItems[index] = val;
											onChange(newItems);
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
												onChange(
													items.filter(
														(item, i) => i !== index
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
					<Button isPrimary onClick={() => onChange([...items, 0])}>
						Add Item
					</Button>
				</div>
			)}
			{true === allowReset && Array.isArray(labels) && (
				<div>
					<Button
						isDestructive
						onClick={() => onChange(labels.map(() => ''))}
					>
						Reset
					</Button>
				</div>
			)}
		</BaseControl>
	);
};

export default JSONSortableList;
