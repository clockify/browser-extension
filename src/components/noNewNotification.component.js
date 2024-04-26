import React from 'react';
import locales from '../helpers/locales';
import Notification from './notification.component';

function NoNewNotification() {
	const { NO_NEW_NOTIFICATIONS_TITLE, NO_NEW_NOTIFICATIONS_MESSAGE } = locales;

	const imagePath = 'assets/images/no-new-notifications.png';
	const imageUrl = aBrowser.runtime.getURL(imagePath);

	const title = NO_NEW_NOTIFICATIONS_TITLE;
	const message = NO_NEW_NOTIFICATIONS_MESSAGE;

	return (
		<div className="notifications-list">
			<img src={imageUrl} className="no-new-notifications" />
			<Notification title={title} message={message} hideX />
		</div>
	);
}

export default NoNewNotification;
