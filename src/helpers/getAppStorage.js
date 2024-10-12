export const appStorage = () => {
	const dataFromStorage = localStorage.getItem('appStore');
	return dataFromStorage ? JSON.parse(dataFromStorage).state : {};
};
