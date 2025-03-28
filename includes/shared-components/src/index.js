import JSONSortableList from './json-array-sortable-list';
import UUIDCopyToClipboard from './uuid-copy-to-clipboard';
import { onBlockCreation } from './helpers';
import { useQuizDataModel } from './innerblocks-to-quiz-data-model';
import getBlockByUUID from './get-block-by-uuid';
import {
	ConditionalBlockControls,
	ConditionalNotice,
	ConditionalPanel,
	ConditionalDot,
} from './conditional-display-controls';

function loadScript(slug, script) {
	if (!window.prcQuizSharedComponents[slug]) {
		window.prcQuizSharedComponents[slug] = script;
	}
}

window.prcQuizSharedComponents = {};

loadScript('JSONSortableList', JSONSortableList);
loadScript('UUIDCopyToClipboard', UUIDCopyToClipboard);
loadScript('onBlockCreation', onBlockCreation);
loadScript('useQuizDataModel', useQuizDataModel);
loadScript('getBlockByUUID', getBlockByUUID);
loadScript('ConditionalBlockControls', ConditionalBlockControls);
loadScript('ConditionalNotice', ConditionalNotice);
loadScript('ConditionalPanel', ConditionalPanel);
loadScript('ConditionalDot', ConditionalDot);
