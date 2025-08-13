/**
 * External Dependencies
 */
import { Icon } from '@prc/icons';

export default function ({ variant = 'quiz' }) {
	if ('freeform' === variant) {
		return <Icon icon="block-question" library="solid" />;
	}
	return <Icon icon="block-question" library="light" />;
}
