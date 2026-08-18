/**
 * Registers `runAnimation` on the quiz controller Interactivity store.
 *
 * Page and results view modules call this action on init/watch. Those modules
 * can evaluate before `controller/view.js` (HTML script-module order is not a
 * guarantee), so the action must be registered from every caller as well.
 */
import { store, getElement } from '@wordpress/interactivity';

store('prc-quiz/controller', {
	actions: {
		/**
		 * Checks the element for any available animations and enables them
		 * via the prc-block/animation store.
		 */
		runAnimation: () => {
			const { ref } = getElement();
			if (!ref) {
				return;
			}
			const animationElements = ref.querySelectorAll(
				'.wp-block-prc-block-animation'
			);
			if (!animationElements.length) {
				return;
			}
			const animationStore = store('prc-block/animation');
			animationElements.forEach((element) => {
				const animationId = element.getAttribute('id');
				const { parentElement } = element;
				const isHidden = null !== parentElement?.getAttribute('hidden');
				if (animationId && !isHidden) {
					animationStore.state[animationId].enabled = true;
				}
			});
		},
	},
});
