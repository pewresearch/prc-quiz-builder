/* eslint-disable import/no-relative-packages */
/**
 * External Dependencies
 */
import { MediaDropZone } from '@prc/components';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment, useEffect } from '@wordpress/element';
import { InspectorControls, BlockControls } from '@wordpress/block-editor';
import {
	PanelBody,
	BaseControl,
	__experimentalNumberControl as NumberControl,
	TextareaControl,
} from '@wordpress/components';

/**
 * Internal Dependencies
 */
import {
	UUIDCopyToClipboard,
	ConditionalPanel,
	ConditionalBlockControls,
} from '@prc/quiz-components';
import CorrectToggleWatcher from './correct-toggle';

export default function Controls({
	attributes,
	clientId,
	context,
	setAttributes,
}) {
	const { uuid, points, correct, resultsLabel, imageId } = attributes;

	const quizType = context['prc-quiz/type'];

	useEffect(() => {
		// Is this is a typology quiz do not try to set the points.
		if ('typology' === quizType) {
			return;
		}

		// If no points are set and this answer is marked as correct then assign 1 point to this answer.
		if ((undefined === points || 0 === points) && true === correct) {
			setAttributes({
				points: 1,
			});
		}
		// If points are set and this answer is marked as inccorrect then remove points from this answer.
		if (true !== correct && undefined !== points) {
			setAttributes({
				points: 0,
			});
		}
	}, [correct]);

	return (
		<Fragment>
			{'typology' !== quizType && (
				<BlockControls>
					<CorrectToggleWatcher
						clientId={clientId}
						context={context}
						attributes={attributes}
						setAttributes={setAttributes}
						variant="toolbar"
					/>
				</BlockControls>
			)}
			{/* <ConditionalBlockControls attributes={attributes} /> */}
			<InspectorControls>
				<PanelBody title={__('Answer Settings')}>
					{'typology' !== quizType && (
						<p
							style={{
								fontFamily: 'monospace',
								fontSize: '0.8rem',
							}}
						>
							Press <i>cmd/alt + e</i> to toggle {`answer's`}{' '}
							{correct && (
								<span>
									<strong>correct</strong>|incorrect
								</span>
							)}
							{!correct && (
								<span>
									correct|<strong>incorrect</strong>
								</span>
							)}
							{` state.`}
						</p>
					)}
					<NumberControl
						label="Points"
						help={__(
							'How many points this answer is worth? On non typology quizes if this answer is marked as correct and no points are set then 1 point will be assigned; if this answer is marked as incorrect and points are set then the points will be removed.'
						)}
						value={points}
						onChange={(p) => {
							setAttributes({ points: p });
						}}
					/>
					<TextareaControl
						label="Results Label"
						help={__(
							'This will be used when displaying the answer on the results page.'
						)}
						value={resultsLabel}
						onChange={(r) => {
							setAttributes({ resultsLabel: r });
						}}
					/>
					<BaseControl
						label="Optional Answer Image"
						help="Optionally display an image, you must have a text answer for fallback."
					>
						<MediaDropZone
							label="Set Answer Image"
							attachmentId={0 === imageId ? false : imageId}
							mediaType={['image']}
							mediaSize="640-wide"
							onUpdate={(image) => {
								setAttributes({
									imageId: image.id,
								});
							}}
							onClear={() => {
								console.log('Clearing...');
								setAttributes({
									imageId: false,
								});
							}}
						/>
					</BaseControl>
				</PanelBody>
				<ConditionalPanel
					{...{ attributes, setAttributes, blockType: 'answer' }}
				>
					<UUIDCopyToClipboard {...{ uuid }} />
				</ConditionalPanel>
			</InspectorControls>
		</Fragment>
	);
}
