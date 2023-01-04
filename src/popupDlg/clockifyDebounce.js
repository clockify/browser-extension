function clockifyDebounce(fn, ms) {
	var timeout;
	return function () {
		const that = this;
		const args = arguments;

		var callback = function () {
			timeout = null;
			fn.apply(that, args);
		};

		clearTimeout(timeout);
		timeout = setTimeout(callback, ms);
	};
}
