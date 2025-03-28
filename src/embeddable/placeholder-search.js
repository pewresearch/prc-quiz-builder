/**
 * External Dependencies
 */
import { WPEntitySearch } from '@prc/components';

/**
 * Internal Dependencies
 */
import { POST_TYPE, POST_TYPE_LABEL } from './constants';

export default function PlaceholderSearch({ setAttributes }) {
	return (
		<WPEntitySearch
			searchLabel={`Search for ${POST_TYPE_LABEL}`}
			entityType="postType"
			entitySubType={POST_TYPE}
			onSelect={(entity) => {
				setAttributes({
					ref: parseInt(entity.entityId),
				});
			}}
			perPage={10}
		/>
	);
}
