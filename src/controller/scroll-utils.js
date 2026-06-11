/**
 * Scroll an element into view using window.scrollTo.
 *
 * scrollIntoView is unreliable on mobile Safari, especially when the target
 * element's visibility is changing in the same frame (hidden attribute removal,
 * page visibility toggles). This helper defers scrolling until after layout.
 *
 * @param {Element|null|undefined}    element
 * @param {Object}                    [options]
 * @param {'auto'|'instant'|'smooth'} [options.behavior='smooth']
 */
export function scrollToElement(element, { behavior = 'smooth' } = {}) {
	if (!element || typeof window === 'undefined') {
		return;
	}

	const performScroll = () => {
		if (element.hasAttribute('hidden')) {
			return false;
		}

		if ('scrollRestoration' in window.history) {
			window.history.scrollRestoration = 'manual';
		}

		const top = element.getBoundingClientRect().top + window.scrollY;
		window.scrollTo({
			top: Math.max(0, top),
			behavior,
		});
		return true;
	};

	window.requestAnimationFrame(() => {
		if (performScroll()) {
			return;
		}

		window.requestAnimationFrame(() => {
			performScroll();
		});
	});
}
