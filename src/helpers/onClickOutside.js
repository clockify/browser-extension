export function onClickOutside(ref, handler) {
	const rootEl = document;

	const listener = event => {
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
}
