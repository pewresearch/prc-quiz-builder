/**
 * Internal Dependencies
 */
import { Icon as PRCIcon } from '@prc/icons';

export default function Icon({ variant = 'default' }) {
	if ('conditional' === variant) {
		return (
			<span
				style={{
					color: '#f0b849',
				}}
			>
				<PRCIcon icon="circle-question" />
			</span>
		);
	}
	if ('thermometer' === variant) {
		return <PRCIcon icon="temperature-three-quarters" />;
	}
	return <PRCIcon icon="circle-question" />;
}
