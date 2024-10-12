import React from 'react';
import Header from './header.component.jsx';
import Login from './login.component';
import SelfHostedBootSettings from './self-hosted-login-settings.component';
import locales from '../helpers/locales';

class SelfHostedUrl extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			url: '',
		};
		this.onChange = this.onChange.bind(this);
		this.submitUrl = this.submitUrl.bind(this);
	}

	componentDidMount() {}

	onChange(e) {
		this.setState({
			url: e.target.value,
		});
	}

	keyPressed(target) {
		if (target.charCode == 13) {
			this.submitUrl();
		}
	}

	submitUrl() {
		window.reactRoot.render(<SelfHostedBootSettings url={this.state.url} />);
	}

	cancel() {
		window.reactRoot.render(<Login />);
	}

	render() {
		return (
			<div onKeyPress={this.keyPressed.bind(this)}>
				<Header showActions={false} />
				<form className="self-hosted-url">
					<div>
						<label className="self-hosted-url__server_url">
							{locales.CUSTOM_DOMAIN_URL}
						</label>
						<p className="self-hosted-url__server_url--info">
							{locales.CUSTOM_DOMAIN_DESCRIPTION}
						</p>
						<input
							onBlur={(event) => {
								const urlParts = event.target.value.split('.');
								const topLevelDomainAndRest = urlParts.slice().reverse()[0];
								const topLevelDomain = topLevelDomainAndRest.split('/')[0];
								const urlWithoutTopLevelDomainAndRest = urlParts
									.slice(0, -1)
									.join('.');
								const url = [
									urlWithoutTopLevelDomainAndRest,
									topLevelDomain,
								].join('.');

								this.setState({ url });
							}}
							required={true}
							id="selfHostedurl"
							value={this.state.selfHostedInput}
							placeholder="https://"
							onChange={this.onChange}
						/>
					</div>
				</form>
				<div className="self-hosted-url__actions">
					<button
						className="self-hosted-url__actions--submit"
						onClick={this.submitUrl.bind(this)}
					>
						{locales.SUBMIT}
					</button>
					<a
						className="self-hosted-url__actions--cancel"
						onClick={this.cancel.bind(this)}
					>
						{locales.CANCEL}
					</a>
				</div>
			</div>
		);
	}
}

export default SelfHostedUrl;
