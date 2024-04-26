import React, { useEffect } from 'react';
import useUserStore from '../../../zustand/stores/userStore';
import useUIStore from '../../../zustand/stores/UIStore';
import Toaster from '../../toaster-component';
import { getBrowser } from '../../../helpers/browser-helper';
import locales from '../../../helpers/locales';

const VerifyEmail = () => {
	const { userData } = useUserStore();
	const { status, email } = userData;
	const { bannerVisible, setBannerVisible } = useUIStore();
	const toaster = new Toaster();

	useEffect(() => {
		setBannerVisible(status === "PENDING_EMAIL_VERIFICATION");
	}, [status])

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

	return (
		<>
			{bannerVisible && <div className="verify-email-message">
				<div>
					{locales.VERIFY_EMAIL_MESSAGE(email)}
					<div className="send-email-link" onClick={sendVerificationEmail}>
						{locales.SEND_VERIFICATION_EMAIL_BTN}
					</div>
				</div>
			</div>}
		</>
	)
}

export default VerifyEmail;
