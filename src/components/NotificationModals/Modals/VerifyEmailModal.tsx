import React from 'react';
import { getBrowser } from '~/helpers/browser-helper.js';
import locales from '~/helpers/locales';
import { logout } from '~/helpers/utils.js';
import { useAppStore } from '../../../zustand/store';
import Toaster from '~/components/toaster-component.js';
import { NotificationModalDivider } from '~/components/NotificationModals/NotificationModal/NotificationModalDivider.tsx';
import { NotificationPrimaryButton } from '~/components/NotificationModals/NotificationModal/NotificationPrimaryButton.tsx';
import { NotificationSecondaryButton } from '~/components/NotificationModals/NotificationModal/NotificationSecondaryButton.tsx';
import { NotificationSecondaryText } from '~/components/NotificationModals/NotificationModal/NotificationSecondaryText.tsx';

export const VerifyEmailModal = () => {
	const { emailEnforcedModalVisible, userData, bootData } = useAppStore();
	const { name, email, status } = userData;
	let toaster = new Toaster();

	const sendVerificationEmail = (): void => {
		getBrowser()
			.runtime.sendMessage({
				eventName: 'resendVerificationEmail',
			})
			.then((response) => {
				if (response.status === 200) {
					toaster.toast('success', locales.EMAIL_SENT_SUCCESS_MESSAGE, 5);
					return;
				}

				toaster.toast('error', locales.GLOBAL__FAILED_MESSAGE, 5);
			});
	};

	const changeEmail = (): void => {
		window.open(
			`https://${bootData.frontendUrl}/user/settings`,
			'_blank',
			'noopener,noreferrer',
		);
	};

	return (
		<>
			{status === 'PENDING_EMAIL_VERIFICATION' &&
				(bootData?.unverifiedUsersCanUseClockify === false ||
					emailEnforcedModalVisible) && (
					<div className="notification-modal--open">
						<div className="notification-modal">
							<div className="ws-shield"></div>
							<div
								style={{ left: '0px' }}
								className="notification-modal--title"
							>
								{locales.VERIFY_EMAIL_TITLE}
							</div>
							<p
								style={{ textAlign: 'center', maxWidth: '220px' }}
								className="notification-modal--text"
							>
								{locales.LONG_VERIFY_EMAIL_MESSAGE(name, email)}
							</p>
							<NotificationPrimaryButton
								buttonTitle={locales.SEND_VERIFICATION_EMAIL_BTN}
								handleClick={sendVerificationEmail}
							/>
							<NotificationModalDivider />
							<NotificationSecondaryText text={locales.CHANGE_EMAIL_FOOTER} />
							<NotificationSecondaryButton
								buttonTitle={locales.CHANGE_EMAIL_TITLE}
								handleClick={changeEmail}
							/>
							<NotificationModalDivider />
							<NotificationSecondaryButton
								buttonTitle={locales.LOG_OUT}
								handleClick={() => logout()}
							/>
							<Toaster
								ref={(instance) => {
									toaster = instance;
								}}
							/>
						</div>
					</div>
				)}
		</>
	);
};
