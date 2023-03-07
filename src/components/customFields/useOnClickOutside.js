import { useEffect } from 'react';

export const useOnClickOutside = (ref, handler) => {
	useEffect(
		() => {
			const rootEl = document;
			const listener = (event) => {
				// Do nothing if clicking ref's element or descendent elements
				if (!ref.current || ref.current.contains(event.target)) {
					return;
				}
				handler(event);
			};
			rootEl.addEventListener('mousedown', listener);
			rootEl.addEventListener('touchstart', listener);
			return () => {
				rootEl.removeEventListener('mousedown', listener);
				rootEl.removeEventListener('touchstart', listener);
			};
		},
		// Add ref and handler to effect dependencies
		// It's worth noting that because passed in handler is a new ...
		// ... function on every render that will cause this effect ...
		// ... callback/cleanup to run every render. It's not a big deal ...
		// ... but to optimize you can wrap handler in useCallback before ...
		// ... passing it into this hook.
		[ref, handler]
	);
};
