/**
 * External Dependencies
 */
import { Icon } from '@prc/icons';

export default function ({ variant = 'quiz' }) {
	if ('typology' === variant) {
		return <Icon icon="block-question" library="solid" />;
	}
	return <Icon icon="block-question" library="light" />;
}
