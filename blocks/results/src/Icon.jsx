/**
 * Internal Dependencies
 */
import { Icon as PRCIcon } from '@prc/icons';

export default function Icon({ variant = '' }) {
	if ('group' === variant) {
		return <PRCIcon icon="users-viewfinder" library="solid" />;
	}
	return <PRCIcon icon="face-viewfinder" library="solid" />;
}
