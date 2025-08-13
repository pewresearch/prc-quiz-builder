import JSONSortableList from './json-array-sortable-list';
import UUIDCopyToClipboard from './uuid-copy-to-clipboard';
import { onBlockCreation } from './helpers';
import getBlockByUUID from './get-block-by-uuid';
import {
	ConditionalNotice,
	ConditionalPanel,
} from './conditional-display-controls';
import useQuizDataModel from './innerblocks-to-data-model';

function loadScript(slug, script) {
	if (!window.prcQuizSharedComponents[slug]) {
		window.prcQuizSharedComponents[slug] = script;
	}
}

window.prcQuizSharedComponents = {};

loadScript('JSONSortableList', JSONSortableList);
loadScript('UUIDCopyToClipboard', UUIDCopyToClipboard);
loadScript('onBlockCreation', onBlockCreation);
loadScript('getBlockByUUID', getBlockByUUID);
loadScript('ConditionalNotice', ConditionalNotice);
loadScript('ConditionalPanel', ConditionalPanel);
loadScript('useQuizDataModel', useQuizDataModel);
