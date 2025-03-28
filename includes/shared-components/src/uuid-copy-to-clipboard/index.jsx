/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { BaseControl, TextControl, ClipboardButton } from '@wordpress/components';

export default function UUIDCopyToClipboard({uuid}) {
	const [hasCopied, setHasCopied] = useState(false);
	return(
		<BaseControl label={__('Answer ID')}>
			<TextControl value={uuid} onChange={() => {}} />
			<ClipboardButton
				variant="primary"
				text={uuid}
				onCopy={() => setHasCopied(true)}
				onFinishCopy={() => setHasCopied(false)}
			>
				{hasCopied ? 'Copied' : 'Copy ID to Clipboard'}
			</ClipboardButton>
		</BaseControl>
	);
}
