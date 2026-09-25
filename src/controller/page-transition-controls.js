/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	RangeControl,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';

/**
 * Internal Dependencies
 */
import {
	PAGE_TRANSITION_HORIZONTAL_PARALLAX,
	PAGE_TRANSITION_NONE,
	PARALLAX_STRENGTH_DEFAULT,
	PARALLAX_STRENGTH_MAX,
	PARALLAX_STRENGTH_MIN,
	clampParallaxStrength,
} from './page-transition';

/**
 * Page change settings for paged quizzes: scroll behavior, page transition,
 * and parallax strength.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes    Controller attributes.
 * @param {Function} props.setAttributes Attribute setter.
 * @return {Element|null} Controls, or null for scrollable quizzes.
 */
export default function PageTransitionControls({ attributes, setAttributes }) {
	const {
		displayType,
		pageTransition,
		parallaxStrength,
		scrollOnPageChange,
	} = attributes;
	if ('scrollable' === displayType) {
		return null;
	}
	return (
		<>
			<ToggleControl
				__nextHasNoMarginBottom
				label={__('Scroll to Quiz on Page Change')}
				help={__(
					'Scroll the top of the quiz into view when the reader moves to another page. Turn this off to keep the reader where they are, for example when the quiz sits inside a long article. Scrollable quizzes have no page changes, so this does not apply to them.'
				)}
				checked={false !== scrollOnPageChange}
				onChange={(value) =>
					setAttributes({ scrollOnPageChange: value })
				}
			/>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={__('Page Transition')}
				help={__(
					'How the next page enters on paged quizzes. Horizontal parallax slides pages from right to left (Previous reverses it), moves page background images slower than the content, and adds swipe navigation. Readers who prefer reduced motion get the plain page change.'
				)}
				options={[
					{ label: __('None'), value: PAGE_TRANSITION_NONE },
					{
						label: __('Horizontal parallax'),
						value: PAGE_TRANSITION_HORIZONTAL_PARALLAX,
					},
				]}
				value={pageTransition}
				onChange={(value) => setAttributes({ pageTransition: value })}
			/>
			{PAGE_TRANSITION_HORIZONTAL_PARALLAX === pageTransition && (
				<RangeControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={__('Parallax Strength')}
					help={__(
						'How much slower page background images move than the page content. Pages that share the same background image keep it still.'
					)}
					min={PARALLAX_STRENGTH_MIN}
					max={PARALLAX_STRENGTH_MAX}
					step={0.05}
					value={clampParallaxStrength(parallaxStrength)}
					allowReset
					resetFallbackValue={PARALLAX_STRENGTH_DEFAULT}
					onChange={(value) =>
						setAttributes({
							parallaxStrength: clampParallaxStrength(value),
						})
					}
				/>
			)}
		</>
	);
}
