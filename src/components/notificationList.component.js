import React, { useEffect, useState } from 'react';
import locales from '../helpers/locales';
import Notification from './notification.component';
import NoNewNotification from './noNewNotification.component';
import { getBrowser } from '../helpers/browser-helper';
import moment from 'moment';

const { sendMessage } = getBrowser().runtime;

const WORKSPACE_STATUS_ACCEPT = '1';
const WORKSPACE_STATUS_DECLINE = '2';

async function isBrowserTimezoneDifferentComparedToUserSettingsTimezone() {
	const userSettings = JSON.parse(await localStorage.getItem('userSettings'));

	const browserTimezone = moment.tz.guess();
	const userSettingsTimezone = userSettings.timeZone;

	return (
		moment.tz(browserTimezone).utcOffset() !==
		moment.tz(userSettingsTimezone).utcOffset()
	);
}

function NotificationList({
	markAsRead,
	notifications,
	invitationNotifications,
	fileImportNotifications,
	newsNotifications,
	notificationsWithoutInvitation,
	toaster,
	updateNotifications,
	changeWorkspaceTo,
}) {
	if (notifications.length === 0) return <NoNewNotification />;

	async function accept({ notificationId, workspaceId }) {
		const isUserVerified = (await localStorage.get('userStatus')) === 'ACTIVE';

		if (!isUserVerified) {
			const { VERIFY_EMAIL_MSG_1, VERIFY_EMAIL_MSG_2 } = locales;
			const userEmail = await localStorage.getItem('userEmail');
			const message = `${VERIFY_EMAIL_MSG_1} ${userEmail} ${VERIFY_EMAIL_MSG_2}`;

			return toaster.toast('error', message, 2);
		}

		const { data: changeWorkspaceData, error: changeWorkspaceError } =
			await sendMessage({
				eventName: 'changeWorkspaceStatus',
				options: {
					status: WORKSPACE_STATUS_ACCEPT,
					notificationId,
					workspaceId,
				},
			});

		if (!changeWorkspaceError) {
			toaster.toast('success', locales.USER__SETTINGS__SAVE__SUCCESS, 2);

			const isDomainSelfHosted = JSON.parse(
				await localStorage.getItem('selfHosted', false)
			);

			if (isDomainSelfHosted) {
				const { error: setDefaultWorkspaceError } = await sendMessage({
					eventName: 'setDefaultUserWorkspace',
					options: {
						targetWorkspaceId: changeWorkspaceData.memberships[0].targetId,
					},
				});

				if (!setDefaultWorkspaceError) {
					toaster.toast(
						'success',
						locales.WORKSPACE_DEFAULT_SUCCESS_MESSAGE,
						2
					);
				}
			}
			const { data: workspaces } = await sendMessage({
				eventName: 'getWorkspacesOfUser',
			});

			const acceptedWorkspace = workspaces.find(({ id }) => id === workspaceId);

			changeWorkspaceTo(acceptedWorkspace);

			updateNotifications();
		}
	}

	async function decline({ notificationId, workspaceId }) {
		const eventName = 'removeDeclinedUserFromWorkspace';
		const options = {
			status: WORKSPACE_STATUS_DECLINE,
			notificationId,
			workspaceId,
		};

		const { error } = await sendMessage({ eventName, options });

		if (!error) {
			const username = (await localStorage.getItem('user')).email.split('@')[0];
			const message = locales.INVITATION_DECLINED_MESSAGE(username);

			toaster.toast('success', message, 2);

			updateNotifications();
		}
	}

	function receiveUpdates() {
		const { error } = sendMessage({ eventName: 'subscribeToNewsletter' });

		if (!error)
			toaster.toast('success', locales.USER__SETTINGS__SAVE__SUCCESS, 2);
	}

	async function resendEmail() {
		const { error } = await sendMessage({ eventName: 'sendEmailVerification' });

		if (!error)
			toaster.toast('success', locales.EMAIL__VERIFICATION__SUCCESS, 2);
	}

	function listInvitationNotifications({ id, data }) {
		const title = locales.WORKSPACE_INVITATION_NOTIFICATION_TITLE;

		let message;

		if (!data.isUsingFullAccess) {
			const part1 = data.invitedBy;
			const part2 =
				locales.LAYOUT__NOTIFICATIONS__WORKSPACE_INVITATION__ACCESS_INVITATION__PART_1;
			const part3 = data.workspaceName;
			const part4 =
				locales.LAYOUT__NOTIFICATIONS__WORKSPACE_INVITATION__ACCESS_INVITATION__PART_2;

			message = `[b]${part1}[b] ${part2} [b]${part3}[b] ${part4}`;
		}

		if (data.isUsingFullAccess) {
			const part1 =
				locales.LAYOUT__NOTIFICATIONS__WORKSPACE_INVITATION__FULL_ACCOUNT_ACCESS_INVITATION__PART_10;
			const part2 = data.workspaceName;
			const part3 =
				locales.LAYOUT__NOTIFICATIONS__WORKSPACE_INVITATION__FULL_ACCOUNT_ACCESS_INVITATION__PART_2;
			const part4 =
				locales.LAYOUT__NOTIFICATIONS__WORKSPACE_INVITATION__FULL_ACCOUNT_ACCESS_INVITATION__PART_3;
			const part5 =
				locales.LAYOUT__NOTIFICATIONS__WORKSPACE_INVITATION__FULL_ACCOUNT_ACCESS_INVITATION__PART_4;

			message = `${part1} [b]${part2}[b] ${part3} [b]${part4}[b] ${part5}`;
		}

		const acceptLink = {
			linkText: locales.LAYOUT__NOTIFICATIONS__ACCEPT_LABEL,
			classList: 'btn-link',
			linkCallback: () => {
				accept({ notificationId: id, workspaceId: data.workspaceId });
			},
		};
		const declineLink = {
			linkText: locales.LAYOUT__NOTIFICATIONS__DECLINE_LABEL,
			linkCallback: () => {
				decline({ notificationId: id, workspaceId: data.workspaceId });
			},
		};

		return (
			<Notification
				key={id}
				id={id}
				title={title}
				message={message}
				links={[acceptLink, declineLink]}
				markAsRead={markAsRead}
				hideX={true}
			/>
		);
	}

	function listFileImportNotifications({ id, data }) {
		return (
			<Notification
				key={id}
				id={id}
				title={data.title}
				message={data.message}
				markAsRead={markAsRead}
			/>
		);
	}

	function listNewsNotifications({ id, title, message, linkText, link }) {
		return (
			<Notification
				key={id}
				id={id}
				title={title}
				message={message}
				links={[{ linkText, linkUrl: link }]}
				markAsRead={markAsRead}
			/>
		);
	}

	function listNotificationsWithoutInnvitation({ id, type, data }) {
		let title,
			message,
			linkText,
			linkUrl,
			linkCallback,
			isImportant,
			hideX = false;

		switch (type) {
			case 'FEATURE_SUBSCRIPTION':
				title = data.title ?? 'Special features';

				if (data.message.includes('full access')) {
					const part1 = data.message.split('full access')[0];
					const part2 =
						locales.LAYOUT__NOTIFICATIONS__WORKSPACE_INVITATION__FULL_ACCOUNT_ACCESS_INVITATION__PART_3;
					const part3 = data.message.split('full access')[1];

					message = `${part1} [b]${part2}[b] ${part3}`;
				}

				if (!data.message.includes('full access')) {
					const part1 = data.message.split('full access')[0];
					const part2 = data.message.split('full access')[1] ?? '';

					message = `${part1} ${part2}`;
				}

				if (
					data.title !== 'Privacy notice' &&
					!data.message.includes('trial')
				) {
					linkText = locales.GLOBAL__LEARN_MORE_LINK;
					linkUrl = 'https://clockify.me/help/category/extra-features';
				}

				if (data.message.includes('trial')) {
					linkText = locales.NOTIFICATION__TRIAL__LINK;
					linkUrl = 'https://clockify.me/extra-features';
				}
				break;
			case 'MONITORING':
				title = data.title;
				message = data.message.replace(
					'For more information, please see here.',
					''
				);

				if (
					data.message.includes('enabled') &&
					data.title.includes('Screenshots')
				) {
					linkText = locales.GLOBAL__LEARN_MORE_LINK;
					linkUrl = 'https://clockify.me/help/extra-features/screenshots';
				}

				if (data.message.includes('enabled') && data.title.includes('GPS')) {
					linkText = locales.GLOBAL__LEARN_MORE_LINK;
					linkUrl = 'https://clockify.me/help/extra-features/gps-tracking';
				}

				break;
			case 'ACCOUNT_VERIFICATION':
				title = locales.LAYOUT__NOTIFICATIONS__VERIFY_EMAIL_LABEL;
				message = locales.LAYOUT__NOTIFICATIONS__UNVERIFIED_EMAIL_NOTIFICATION;

				linkText = locales.LAYOUT__NOTIFICATIONS__RESEND_EMAIL_LABEL;
				linkCallback = () => {
					resendEmail();
				};
				hideX = true;

				break;
			case 'WORKSPACE_CHANGED':
				title = data.title;
				message = data.message;
				break;
			case 'USER_SETTINGS':
				title = data.title;
				message = data.message;
				linkText = locales.LAYOUT__NOTIFICATIONS__RECEIVE_UPDATES_LABEL;
				linkCallback = () => {
					receiveUpdates();
					markAsRead(id);
				};

				break;
			case 'PAYMENT_FAILED':
				title = data.title;
				message = data.message;
				linkText = locales.GLOBAL__GO_TO_SUBSCRIPTION_LABEL;
				linkUrl = `${window.location.host}/subscription#payment`;
				hideX = true;
				break;

			case 'EMAIL_VERIFICATION':
				// in web-keys-we-use.json, keys contain "__" instead of "."
				const titleKey = data.title.replaceAll('.', '__');
				const messageKey = data.message.replaceAll('.', '__');
				title = locales[titleKey];
				message = locales[messageKey];
				isImportant = true;
				break;
		}

		return (
			<Notification
				key={id}
				id={id}
				title={title}
				message={message}
				links={[{ linkText, linkUrl, linkCallback }]}
				isImportant={isImportant}
				hideX={hideX}
				markAsRead={markAsRead}
			/>
		);
	}

	const [homeUrl, setHomeUrl] = useState(null);
	const [showTimezoneNotification, setShowTimezoneNotification] =
		useState(null);

	useEffect(() => {
		(async () => {
			setHomeUrl(await localStorage.getItem('permanent_homeUrl'));
			setShowTimezoneNotification(
				await isBrowserTimezoneDifferentComparedToUserSettingsTimezone()
			);
		})();
	});

	async function changeTimezone() {
		const browserTimezone = moment.tz.guess();
		const options = { newTimezone: browserTimezone };

		const { error } = await sendMessage({
			eventName: 'changeTimezone',
			options,
		});

		if (error) {
			return toaster.toast('error', locales.TIMEZONE__UPDATE__ERROR_MESSAGE, 2);
		}

		toaster.toast('success', locales.TIMEZONE__UPDATE__SUCCESS_MESSAGE, 2);

		updateNotifications();
	}

	function suggestedTimeZoneNotification() {
		const {
			TIMEZONE_MISMATCH__NOTIFICATION__PART_2,
			TIMEZONE_MISMATCH__BODY_TEXT,
			TIMEZONE_MISMATCH__TITLE,
			CHANGE_TIMEZONE_NOTIFICATION,
		} = locales;

		const yourProfileMessage = TIMEZONE_MISMATCH__NOTIFICATION__PART_2;
		const message = TIMEZONE_MISMATCH__BODY_TEXT(yourProfileMessage);
		const messageBeforeLink = message.split(yourProfileMessage)[0];
		const messageAfterLink = message.split(yourProfileMessage)[1];
		const userSettingsUrl = `${homeUrl}/user/settings`;
		const browserTimezone = moment.tz.guess();

		return (
			<Notification
				key={TIMEZONE_MISMATCH__TITLE}
				title={TIMEZONE_MISMATCH__TITLE}
				hideX={true}
			>
				{messageBeforeLink}
				<a href={userSettingsUrl} target="_blank">
					{yourProfileMessage}
				</a>
				{messageAfterLink}
				<div className="notification-footer">
					<a onClick={changeTimezone}>
						{CHANGE_TIMEZONE_NOTIFICATION(browserTimezone)}
					</a>
				</div>
			</Notification>
		);
	}

	return (
		<div className="notifications-list">
			{invitationNotifications.map(listInvitationNotifications)}
			{fileImportNotifications.map(listFileImportNotifications)}
			{newsNotifications.map(listNewsNotifications)}
			{showTimezoneNotification && suggestedTimeZoneNotification()}
			{/* language */}
			{notificationsWithoutInvitation.map(listNotificationsWithoutInnvitation)}
		</div>
	);
}

export default NotificationList;
