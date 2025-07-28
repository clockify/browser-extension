import React from 'react';
import { Notification } from '~/components/Notification';
import locales from '~/helpers/locales';

export const NoNewNotification = () => {
	const { NO_NEW_NOTIFICATIONS_TITLE, NO_NEW_NOTIFICATIONS_MESSAGE } = locales;
	const imagePath = 'assets/images/no-new-notifications.png';
	const imageUrl = aBrowser.runtime.getURL(imagePath);

	return (
		<div className="notifications-list">
			<img src={imageUrl} className="no-new-notifications" />
			<Notification title={NO_NEW_NOTIFICATIONS_TITLE} message={NO_NEW_NOTIFICATIONS_MESSAGE} hideX />
		</div>
	);
};