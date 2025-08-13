import { store, getContext } from '@wordpress/interactivity';

const { state } = store('prc-quiz/controller', {
	callbacks: {
		onQuestionInit: () => {},
	},
});
