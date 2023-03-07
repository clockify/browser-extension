import React from 'react';
import { getBrowser } from '../helpers/browser-helper';

import locales from '../helpers/locales';

class WsChange2FAPopupComponent extends React.Component {
	cancel() {
		this.props.cancel();
	}

	async openSettings() {
		const homeUrl = await localStorage.getItem('homeUrl');
		getBrowser().tabs.create({
			url: `${homeUrl}/user/settings`,
		});
	}

	render() {
		return (
			<div className="poppup-modal--open">
				<div className="poppup-modal">
					<div className="poppup-modal__title-and-close">
						<div className="poppup-modal--title">
							{locales.WORKSPACE__TWO_FACTOR__MODAL__TITLE}
						</div>
						<span
							onClick={this.cancel.bind(this)}
							className="poppup-modal__close"
						></span>
					</div>
					<div className="poppup-modal--divider"></div>
					<p className="poppup-modal--text">
						{this.props.workspaceName}{' '}
						{locales.WORKSPACE__TWO_FACTOR__MODAL__INFO_MESSAGE}
					</p>
					<div
						onClick={this.openSettings.bind(this)}
						className="poppup-modal--confirmation_button"
					>
						{locales.WORKSPACE__TWO_FACTOR__MODAL__ENABLE}
					</div>
				</div>
			</div>
		);
	}
}

export default WsChange2FAPopupComponent;
