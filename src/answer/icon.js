/**
 * WordPress Dependencies
 */
import { Icon as PRCIcon } from '@prc/icons';

export default function Icon({ variant = '' }) {
	if ('correct' === variant) {
		return <PRCIcon icon="circle-check" />;
	}
	if ('conditionalCorrect' === variant) {
		return (
			<span style={{ color: '#f0b849' }}>
				<PRCIcon icon="circle-check" />
			</span>
		);
	}
	if ('incorrect' === variant) {
		return <PRCIcon icon="circle-xmark" />;
	}
	if ('conditionalIncorrect' === variant) {
		return (
			<span style={{ color: '#f0b849' }}>
				<PRCIcon icon="circle-xmark" />
			</span>
		);
	}
	if ('conditional' === variant) {
		return (
			<span style={{ color: '#f0b849' }}>
				<PRCIcon icon="circle-question" />
			</span>
		);
	}
	return (
		<span style={{ color: '#f0b849' }}>
			<PRCIcon icon="circle-question" />
		</span>
	);
}
