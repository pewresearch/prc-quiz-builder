/**
 * WordPress Dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	Modal,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { DataForm } from '@wordpress/dataviews';
import { closeSmall, plus } from '@wordpress/icons';

/**
 * Internal Dependencies
 */
import useHistogramData from './use-histogram-data';
import { HISTOGRAM_ROW_FIELDS, HISTOGRAM_ROW_FORM } from './fields';

import './style.scss';

/**
 * DataForm modal for public-score distribution bins.
 *
 * @param {Object}   props
 * @param {string}   props.clientId Controller block client ID.
 * @param {Function} props.onClose  Called when the modal is dismissed.
 * @return {Element} The modal.
 */
export default function QuizHistogramDataModal({ clientId, onClose }) {
	const { rows, questionCount, updateRow, addRow, removeRow } =
		useHistogramData(clientId);

	return (
		<Modal
			title={__('Edit Histogram Data', 'prc-quiz')}
			onRequestClose={onClose}
			className="quiz-histogram-data-modal"
		>
			<VStack spacing={4}>
				<p className="quiz-histogram-data__help">
					{__(
						'Enter the share of the public who answered each number of questions correctly. The histogram chart and the Adults Receiving This Score text both read this table.',
						'prc-quiz'
					)}
				</p>
				{questionCount > 0 && (
					<p className="quiz-histogram-data__help">
						{formatQuestionCountHelp(questionCount)}
					</p>
				)}
				<VStack spacing={4} className="quiz-histogram-data__rows">
					<HStack
						spacing={2}
						alignment="center"
						className="quiz-histogram-data__header"
					>
						<span className="quiz-histogram-data__header-label">
							{HISTOGRAM_ROW_FIELDS[0].label}
						</span>
						<span className="quiz-histogram-data__header-label">
							{HISTOGRAM_ROW_FIELDS[1].label}
						</span>
						<span
							className="quiz-histogram-data__header-action"
							aria-hidden="true"
						/>
					</HStack>
					{rows.map((row, index) => (
						<HStack
							key={row.id}
							alignment="center"
							spacing={2}
							className="quiz-histogram-data__row"
						>
							<DataForm
								data={row}
								fields={HISTOGRAM_ROW_FIELDS}
								form={HISTOGRAM_ROW_FORM}
								onChange={(updates) =>
									updateRow(index, updates)
								}
							/>
							<Button
								icon={closeSmall}
								label={__('Remove row', 'prc-quiz')}
								onClick={() => removeRow(index)}
								__next40pxDefaultSize
							/>
						</HStack>
					))}
				</VStack>
				<Button
					icon={plus}
					variant="secondary"
					__next40pxDefaultSize
					onClick={addRow}
					text={__('Add row', 'prc-quiz')}
				/>
			</VStack>
		</Modal>
	);
}

function formatQuestionCountHelp(questionCount) {
	return sprintf(
		/* translators: %d: number of questions in the quiz */
		__(
			'A typical quiz has a row for 0 through %d correct answers.',
			'prc-quiz'
		),
		questionCount
	);
}
