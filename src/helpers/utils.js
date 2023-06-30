import React from 'react';
import Login from '../components/login.component';

export const logout = (reason, data) => {
	if (!document.getElementById('mount')) return;
	window.reactRoot.render(
		<Login logout={{ isTrue: true, reason: reason, data: data }} />
	);
};

export const isLoggedIn = async () => {
	const token = await localStorage.getItem('token');
	return token !== null && token !== undefined;
};

// Debounce function calls
// if you want the first call to be immediate, set isImmediate to true
// otherwise, the last call will be the one that is executed
export const debounce = ({ func, delay, isImmediate }) => {
	let timeout;
	return function () {
		const context = this,
			args = arguments;
		const later = function () {
			timeout = null;
			if (!isImmediate) func.apply(context, args);
		};
		const callNow = isImmediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, delay);
		if (callNow) func.apply(context, args);
	};
};
