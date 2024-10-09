/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';

const onBlockCreation = (clientId, uuid = null, setAttributes = false) => {
    if (null === uuid && false !== setAttributes) {
        // We will use the first client id assigned as a uuid.
        const newUuid = clientId;
        setAttributes({ uuid: newUuid });
    }
};

export {
    onBlockCreation,
}