import React, { useEffect, useState } from 'react';
import NotificationList from './notificationList.component';
import locales from '../helpers/locales';
import { getBrowser } from '../helpers/browser-helper';
import moment from 'moment';

const { sendMessage } = getBrowser().runtime;

function removeEmptyArrays(value) {
	return !Array.isArray(value) || (Array.isArray(value) && value.length > 0);
}

async function isBrowserTimezoneDifferentComparedToUserSettingsTimezone() {
	const userSettings = JSON.parse(await localStorage.getItem('userSettings'));

	const browserTimezone = moment.tz.guess();
	const userSettingsTimezone = userSettings.timeZone;

	return (
		moment.tz(browserTimezone).utcOffset() !==
		moment.tz(userSettingsTimezone).utcOffset()
	);
}

async function getUnreadNotifications() {
	const { data: verificationNotifications = [] } = await sendMessage({
		eventName: 'getVerificationNotificationsForUser'
	});

	const { data: otherNotifications = [] } = await sendMessage({
		eventName: 'getNotificationsForUser'
	});

	const unreadNotifications = otherNotifications
		.filter((element) => removeEmptyArrays(element))
		.filter(({ status }) => status === 'UNREAD')
		.filter(({ type }) => type !== 'CONTACT_SALES')
		.filter(({ type }) => type !== 'PUMBLE_COUPON');

	return [...verificationNotifications, ...unreadNotifications];
}

async function getNews() {
	const { data: news } = await sendMessage({ eventName: 'getNewsForUser' });

	return news.filter((singleNews) => removeEmptyArrays(singleNews));
}

function Notifications({
												 isDropdownOpen,
												 onClick,
												 toaster,
												 changeWorkspaceTo
											 }) {
	const [allNotifications, setAllNotifications] = useState([]);
	const [notificationCount, setNotificationCount] = useState(0);
	const [invitationNotifications, setInvitationNotifications] = useState([]);
	const [fileImportNotifications, setFileImportNotifications] = useState([]);
	const [newsNotifications, setNewsNotifications] = useState([]);
	const [notificationsWithoutInvitation, setNotificationsWithoutInvitation] =
		useState([]);
	const [
		notificationsThatCanBeMarkedAsRead,
		setNotificationsThatCanBeMarkedAsRead
	] = useState([]);

	async function updateNotifications() {
		const unreadNotifications = await getUnreadNotifications();
		const news = await getNews();

		setInvitationNotifications(
			unreadNotifications.filter(({ type }) => type === 'WORKSPACE_INVITATION')
		);

		setFileImportNotifications(
			unreadNotifications.filter(({ type }) => type === 'FILE_IMPORT_COMPLETED')
		);

		setNewsNotifications(news);

		setNotificationsWithoutInvitation(
			unreadNotifications.filter(
				({ type }) =>
					type !== 'WORKSPACE_INVITATION' &&
					type !== 'TIME_ZONE' &&
					type !== 'PUMBLE_COUPON' &&
					type !==
					'FILE_IMPORT_COMPLETED' /* This line is a quick fix for blank notification */
			)
		);

		const isTimezoneNotificationAvailable =
			await isBrowserTimezoneDifferentComparedToUserSettingsTimezone();

		const notifications = [...unreadNotifications, ...news];

		setAllNotifications(notifications);
		setNotificationCount(
			notifications.length + Number(isTimezoneNotificationAvailable)
		);
	}

	useEffect(() => {
		updateNotifications();

		setNotificationsThatCanBeMarkedAsRead(
			allNotifications
				.filter(({ type }) => type !== 'ACCOUNT_VERIFICATION')
				.filter(({ type }) => type !== 'PAYMENT_FAILED')
				.filter(({ type }) => type !== 'WORKSPACE_INVITATION')
		);
	}, [isDropdownOpen]);

	async function markAsRead(idOrIds) {
		const hasMultipleIds = Array.isArray(idOrIds);

		if (hasMultipleIds) {
			const newsIds = newsNotifications.map(({ id }) => id);

			const verificationNotificationsIds = notificationsWithoutInvitation
				.filter(({ type }) => type === 'EMAIL_VERIFICATION')
				.map(({ id }) => id);

			const idsThatBelongToNews = idOrIds.filter((id) => newsIds.includes(id));
			const idsThatBelongToNotifications = idOrIds.filter(
				(id) =>
					!idsThatBelongToNews.includes(id) &&
					!verificationNotificationsIds.includes(id)
			);
			const idsThatBelongToVerificationNotifications = idOrIds.filter((id) =>
				verificationNotificationsIds.includes(id)
			);

			if (idsThatBelongToNews.length > 0) {
				const eventName = 'readSingleOrMultipleNewsForUser';
				const options = { newsIds: idsThatBelongToNews };

				await sendMessage({ eventName, options });
			}

			if (idsThatBelongToNotifications.length > 0) {
				const eventName = 'readManyNotificationsForUser';
				const options = { notificationIds: idsThatBelongToNotifications };

				await sendMessage({ eventName, options });
			}

			if (idsThatBelongToVerificationNotifications.length > 0) {
				const eventName = 'readSingleOrMultipleVerificationNotificationForUser';
				const options = {
					idOrIds: idsThatBelongToVerificationNotifications
				};

				await sendMessage({ eventName, options });
			}
		} else {
			const notifications = [
				...invitationNotifications,
				...fileImportNotifications,
				...notificationsWithoutInvitation
			];

			const isNotificationTypeRegularNotification = notifications.find(
				({ id, type }) => id === idOrIds && type !== 'EMAIL_VERIFICATION'
			);
			const isNotificationTypeVerificationNotification = notifications.find(
				({ id, type }) => id === idOrIds && type === 'EMAIL_VERIFICATION'
			);
			const isNotificationTypeNews = newsNotifications.find(
				({ id }) => id === idOrIds
			);

			if (isNotificationTypeRegularNotification) {
				const eventName = 'readSingleNotificationForUser';
				const options = { notificationId: idOrIds };

				await sendMessage({ eventName, options });
			} else if (isNotificationTypeVerificationNotification) {
				const eventName = 'readSingleOrMultipleVerificationNotificationForUser';
				const options = { idOrIds: [idOrIds] };

				await sendMessage({ eventName, options });
			} else if (isNotificationTypeNews) {
				const eventName = 'readSingleOrMultipleNewsForUser';
				const options = { newsIds: [idOrIds] };

				await sendMessage({ eventName, options });
			}
		}

		updateNotifications();
	}

	const { NOTIFICATIONS_TITLE, CLEAR_ALL } = locales;

	return (
		<div title={'Notifications'} className="notifications" onClick={onClick}>
			<div className="notifications-count">
				{notificationCount > 0 && (
					<div className={'notifications-count-display'}>
						{notificationCount}
					</div>
				)}
			</div>
			{isDropdownOpen && (
				<>
					<div className="rectangle"></div>
					<div className="dropdown-menu">
						<div className="dropdown-menu-header">
							<div className="dropdown-menu-header-left">
								{NOTIFICATIONS_TITLE}
							</div>
							{notificationsThatCanBeMarkedAsRead.length > 1 && (
								<div
									className="dropdown-menu-header-right"
									onClick={() => {
										const notificationsToBeReadIds =
											notificationsThatCanBeMarkedAsRead.map(({ id }) => id);

										markAsRead(notificationsToBeReadIds);
										setNotificationsThatCanBeMarkedAsRead([]);
									}}
								>
									{CLEAR_ALL}
								</div>
							)}
						</div>
						<div className="dropdown-menu-body">
							<NotificationList
								notifications={allNotifications}
								invitationNotifications={invitationNotifications}
								fileImportNotifications={fileImportNotifications}
								newsNotifications={newsNotifications}
								notificationsWithoutInvitation={notificationsWithoutInvitation}
								markAsRead={markAsRead}
								toaster={toaster}
								updateNotifications={updateNotifications}
								changeWorkspaceTo={changeWorkspaceTo}
							/>
						</div>
					</div>
				</>
			)}
		</div>
	);
}

export default Notifications;
