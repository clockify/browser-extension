import { getBrowser } from '~/helpers/browser-helper';
import locales from '~/helpers/locales';
import React from 'react';

interface PropsInterface {
	cancel: VoidFunction;
	workspaceName: string;
}

export const WsChange2FAPopup = (props: PropsInterface): React.JSX.Element => {
	const openSettings = async () => {
		const homeUrl = await localStorage.getItem('homeUrl');

		getBrowser().tabs.create({
			url: `${homeUrl}/user/settings`,
		});
	};

	return (
		<div className="poppup-modal--open">
			<div className="poppup-modal">
				<div className="poppup-modal__title-and-close">
					<div className="poppup-modal--title">
						{locales.WORKSPACE__TWO_FACTOR__MODAL__TITLE}
					</div>
					<span
						onClick={props.cancel}
						className="poppup-modal__close"
					></span>
				</div>
				<div className="poppup-modal--divider"></div>
				<p className="poppup-modal--text">
					{props.workspaceName}{' '}
					{locales.WORKSPACE__TWO_FACTOR__MODAL__INFO_MESSAGE}
				</p>
				<div
					onClick={openSettings}
					className="poppup-modal--confirmation_button"
				>
					{locales.WORKSPACE__TWO_FACTOR__MODAL__ENABLE}
				</div>
			</div>
		</div>
	);
};