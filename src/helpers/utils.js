import React from 'react';
import Login from '../components/login.component';

export const logout = () => {
	if (!document.getElementById('mount')) return;
	window.reactRoot.render(<Login logout={true} />);
};

export const isLoggedIn = async () => {
	const token = await localStorage.getItem('token');
	return token !== null && token !== undefined;
};
