/**
 * External Dependencies
 */
import { WPEntitySearch } from '@prc/components';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import { POST_TYPE, POST_TYPE_LABEL } from './constants';

export default function PlaceholderSearch({ clientId, attributes, setAttributes }) {
	return (
		<WPEntitySearch
			searchLabel={__(`Search for ${POST_TYPE_LABEL}`)}
			entityType="postType"
			entitySubType={POST_TYPE}
			onSelect={(entity) => {
				console.log('Entity: ', entity);
				setAttributes({
					ref: parseInt(entity.id),
				});
			}}
			onKeyEnter={() => {
				console.log("Enter Key Pressed");
			}}
			onKeyESC={() => {
				console.log("ESC Key Pressed");
			}}
			perPage={10}
		/>
	);
}
