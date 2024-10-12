import React, { useEffect } from 'react';
import { getBrowser } from '~/helpers/browser-helper.js';
import locales from '~/helpers/locales';
import { useAppStore } from '../../../zustand/store';
import Toaster from '~/components/toaster-component.js';

export const VerifyEmail = () => {
	const { userData, bannerVisible, setBannerVisible } = useAppStore();
	const { status, email } = userData;
	const toaster = new Toaster();

	useEffect(() => {
		setBannerVisible(status === 'PENDING_EMAIL_VERIFICATION');
	}, [status]);

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

	return (
		<>
			{bannerVisible && (
				<div className="verify-email-message">
					<div>
						{locales.VERIFY_EMAIL_MESSAGE(email)}
						<div className="send-email-link" onClick={sendVerificationEmail}>
							{locales.SEND_VERIFICATION_EMAIL_BTN}
						</div>
					</div>
				</div>
			)}
		</>
	);
};
