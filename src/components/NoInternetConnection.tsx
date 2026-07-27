import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import locales from '~/helpers/locales';

export const NoInternetConnection = () => {
	const [isOnline, setIsOnline] = useState(navigator.onLine);

	useEffect(() => {
		const connectionHandler = () => {
			setIsOnline(navigator.onLine);
			document.documentElement.style.overflow = navigator.onLine ? '' : 'hidden';
		};

		window.addEventListener('online', connectionHandler);
		window.addEventListener('offline', connectionHandler);

		return () => {
			window.removeEventListener('online', connectionHandler);
			window.removeEventListener('offline', connectionHandler);
		};
	}, []);

	return (
		<Modal
			style={{
				overlay: {
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: 'rgba(0, 0, 0, 0.87)',
					zIndex: '2147483646',
					outline: 'none',
				},
				content: {
					height: '100%',
					width: '100%',
				},
			}}
			bodyOpenClassName={'test'}
			isOpen={!isOnline}>
			<div className={'offline-mode'}>
				<img src={'assets/images/wifi_off.png'} />

				<div className={'offline-mode-info'}>
					<div className={'offline-mode-info-title'}>{locales.OFFLINE_MODE__TITLE}</div>
					<div className={'offline-mode-info-subtitle'}>
						{locales.OFFLINE_MODE__SUBTITLE}
					</div>
				</div>
			</div>
		</Modal>
	);
};
