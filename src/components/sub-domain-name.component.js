import React from 'react';
import Header from './header.component.jsx';
import Login from './login.component';
import locales from '../helpers/locales';
import SelfHostedBootSettings from './self-hosted-login-settings.component';

class SubDomainName extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			domainName: '',
		};
		this.onChange = this.onChange.bind(this);
	}

	onChange(e) {
		this.setState({
			domainName: e.target.value,
		});
	}

	keyPressed(target) {
		if (target.charCode == 13) {
			this.submitDomainName();
		}
	}

	submitDomainName() {
		// settingsService.setSubDomainName(domainName);
		// settingsService.setHomeUrl(`https://${domainName}.clockify.me`)
		window.reactRoot.render(
			<SelfHostedBootSettings
				url={`https://${this.state.domainName}.clockify.me`}
			/>
		);
	}

	cancel() {
		window.reactRoot.render(<Login />);
	}

	render() {
		return (
			<div onKeyPress={this.keyPressed.bind(this)}>
				<Header showActions={false} />
				<form className="sub-domain">
					<div>
						<label className="sub-domain__server_url">
							{locales.SUBDOMAIN_NAME}
						</label>
						<div className="sub-domain__input">
							<span className={'sub-domain__input--prepend'}>https://</span>
							<input
								required={true}
								id="domainName"
								placeholder={locales.SUBDOMAIN_NAME}
								onChange={this.onChange}
							/>
							<span className={'sub-domain__input--append'}>.clockify.me</span>
						</div>
					</div>
				</form>
				<div className="sub-domain__actions">
					<button
						className="sub-domain__actions--submit"
						onClick={this.submitDomainName.bind(this)}
					>
						{locales.SUBMIT}
					</button>
					<a
						className="sub-domain__actions--cancel"
						onClick={this.cancel.bind(this)}
					>
						{locales.CANCEL}
					</a>
				</div>
			</div>
		);
	}
}

export default SubDomainName;
