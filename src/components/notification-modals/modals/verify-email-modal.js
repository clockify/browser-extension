import React from 'react';
import { getBrowser } from '../../../helpers/browser-helper';
import NotificationImage from '../notification-modal-components/notification-image';
import NotificationModalDivider from '../notification-modal-components/notification-modal-divider';
import NotificationPrimaryButton from '../notification-modal-components/notification-primary-button';
import NotificationSecondaryText from '../notification-modal-components/notification-secondary-text';
import NotificationSecondaryButton from '../notification-modal-components/notification-secondary-button';
import useUserStore from '../../../zustand/stores/userStore';
import useUIStore from '../../../zustand/stores/UIStore';
import locales from '../../../helpers/locales';
import Toaster from '../../toaster-component';
import useBootStore from '../../../zustand/stores/bootStore';
import { logout } from '../../../helpers/utils';


const VerifyEmailModal = () => {
	const { userData } = useUserStore();
	const { name, email, status } = userData;
	const { bootData } = useBootStore();
	const { emailEnforcedModalVisible } = useUIStore();
	let toaster = new Toaster();

	const sendVerificationEmail = () => {
		getBrowser()
			.runtime.sendMessage({
			eventName: 'resendVerificationEmail',
		})
			.then(response => {
				const { status } = response;
				if (status === 200) {
					toaster.toast('success', locales.EMAIL_SENT_SUCCESS_MESSAGE, 5)
				} else {
					toaster.toast('error', locales.GLOBAL__FAILED_MESSAGE, 5)
				}
			})
	}
	const changeEmail = () => {
		const { frontendUrl } = bootData;
		window.open(`https://${frontendUrl}/user/settings`, '_blank', 'noopener,noreferrer')
	}

	const handleLogout = () => {
		logout();
	}


	return (
		<>
			{status === "PENDING_EMAIL_VERIFICATION" && (bootData?.unverifiedUsersCanUseClockify === false || emailEnforcedModalVisible)
				&& <div className='notification-modal--open'>
				<div className='notification-modal'>
					<div className='ws-shield'></div>
					<div style={{left: '0px'}} className='notification-modal--title'>
						{locales.VERIFY_EMAIL_TITLE}
					</div>
					<p style={{textAlign: "center", maxWidth: "220px"}} className='notification-modal--text'>
						{locales.LONG_VERIFY_EMAIL_MESSAGE(name, email)}
					</p>
					<NotificationPrimaryButton
						buttonTitle={locales.SEND_VERIFICATION_EMAIL_BTN}
						handleClick={sendVerificationEmail}
					/>
					<NotificationModalDivider />
					<NotificationSecondaryText text={locales.CHANGE_EMAIL_FOOTER}/>
					<NotificationSecondaryButton
						buttonTitle={locales.CHANGE_EMAIL_TITLE}
						handleClick={changeEmail}
					/>
					<NotificationModalDivider />
					<NotificationSecondaryButton
						buttonTitle={locales.LOG_OUT}
						handleClick={handleLogout}
					/>
					<Toaster
						ref={(instance) => {
							toaster = instance;
						}}
					/>
				</div>
			</div>}
		</>
	)
}

export default VerifyEmailModal;