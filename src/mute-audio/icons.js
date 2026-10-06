/**
 * Speaker icons for the Mute audio block.
 *
 * @param {Object}  props
 * @param {boolean} props.muted True for the slashed speaker.
 * @return {Element} Icon.
 */
export function SpeakerIcon({ muted = false }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			width="24"
			height="24"
			aria-hidden="true"
			focusable="false"
		>
			<path fill="currentColor" d="M4 9.5v5h3.2L12 19V5L7.2 9.5H4z" />
			<path
				fill="none"
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinecap="round"
				d="M15.2 9.2a3.6 3.6 0 0 1 0 5.6"
			/>
			<path
				fill="none"
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinecap="round"
				d="M17.6 6.8a7 7 0 0 1 0 10.4"
			/>
			{muted && (
				<path
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					d="M5 6l14 12"
				/>
			)}
		</svg>
	);
}
