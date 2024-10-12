import * as React from 'react';
import HomePage from './home-page.component';
import Header from './header.component.jsx';
import * as ReactDOM from 'react-dom';
import { getEnv } from '~/environment';
import * as moment from 'moment-timezone';
import { getBrowser } from '~/helpers/browser-helper';
import Login from './login.component';
import locales from '../helpers/locales';

const environment = getEnv();

let disabledSignup = false;

class SignUp extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			email: props.email ? props.email : '',
			password: '',
			passwordAlert: false,
			cakeTermsOfUse: false,
			cakeTermsAlert: false,
			emailAlert: false,
			emailExists: false,
			signupDisabledMessage: null,
		};

		this.onChange = this.onChange.bind(this);
		this.signup = this.signup.bind(this);
	}

	componentDidMount() {}

	signup(event) {
		event.preventDefault();
		if (disabledSignup) {
			return;
		}
		this.setState(
			{
				emailAlert: false,
				cakeTermsAlert: false,
				passwordAlert: false,
				emailExists: false,
			},
			() => {
				this.setState(
					{
						emailAlert:
							!this.state.email.includes('@') || this.state.email.length < 3,
						cakeTermsAlert: !this.state.cakeTermsOfUse,
						passwordAlert: this.state.password.length < 6,
					},
					() => {
						if (
							!this.state.emailAlert &&
							!this.state.cakeTermsAlert &&
							!this.state.passwordAlert
						) {
							disabledSignup = true;
							getBrowser()
								.runtime.sendMessage({
									eventName: 'signup',
									options: {
										email: this.state.email,
										password: this.state.password,
										timeZone: moment.tz.guess(),
									},
								})
								.then((response) => {
									let data = response.data;
									aBrowser.tabs.create({
										url: `${aBrowser.identity.getRedirectURL()}?accessToken=${
											data.token
										}&refreshToken=${data.refreshToken}`,
									});
									window.close();
									// getBrowser().storage.local.set({
									// 	token: data.token,
									// 	userId: data.id,
									// 	refreshToken: data.refreshToken,
									// 	userEmail: data.email,
									// });
									// this.setState({
									// 	signupDisabledMessage: null,
									// });

									// localStorage.setItem('userId', data.id);
									// localStorage.setItem('userEmail', data.email);
									// localStorage.setItem('token', data.token);
									// localStorage.setItem('refreshToken', data.refreshToken);
									// this.fetchUser();
								})
								.catch((error) => {
									disabledSignup = false;
									if (error.response?.data?.code === 503) {
										this.setState({
											signupDisabledMessage: error.response?.data?.message,
										});
									} else {
										this.setState({
											emailExists: true,
										});
									}
								});
						}
					},
				);
			},
		);
	}

	fetchUser() {
		getBrowser()
			.runtime.sendMessage({
				eventName: 'getUser',
			})
			.then((response) => {
				let data = response.data;
				localStorage.setItem('activeWorkspaceId', data.activeWorkspace);
				localStorage.setItem('userSettings', JSON.stringify(data.settings));

				getBrowser().storage.local.set({
					activeWorkspaceId: data.activeWorkspace,
					userSettings: JSON.stringify(data.settings),
				});
				disabledSignup = false;
				window.reactRoot.render(<HomePage />);
			})
			.catch((error) => {});
	}

	onChange(e) {
		this.setState({
			[e.target.name]: e.target.value,
		});
	}

	toggleCakeTermsOfUse() {
		this.setState({
			cakeTermsOfUse: !this.state.cakeTermsOfUse,
			cakeTermsAlert: this.state.cakeTermsOfUse,
		});
	}

	/* 	cakeTermsOfUse() {
		window.open(`${environment.cakeTerms}`, '_blank');
	} */

	backToLogin() {
		window.reactRoot.render(<Login />);
	}

	render() {
		return (
			<div>
				<Header showActions={false} showSync={false} />
				<div
					className={
						this.state.signupDisabledMessage ? 'signup__disabled' : 'disabled'
					}
				>
					{this.state.signupDisabledMessage}
				</div>
				<div className="signup-title_and_text">
					<p className="signup-title">{locales.SIGNUP_TITLE}</p>
					<p className="signup-text">{locales.CREATE_ACCOUNT_EXPLANATION}</p>
				</div>
				<div className="signup-form">
					<div className="signup-form--email">
						<input
							className="signup-input"
							required={true}
							name="email"
							type="email"
							id="email"
							placeholder={locales.EMAIL}
							value={this.state.email}
							onChange={this.onChange}
						/>
						<label
							className={this.state.emailAlert ? 'signup-alert' : 'disabled'}
						>
							{locales.INVALID_EMAIL}
						</label>
						<label
							className={this.state.emailExists ? 'signup-alert' : 'disabled'}
						>
							{locales.INVALID_EMAIL}
						</label>
					</div>
					<div className="signup-form--password">
						<input
							className="signup-input"
							required={true}
							name="password"
							type="password"
							id="password"
							placeholder={locales.PASSWORD}
							value={this.state.password}
							onChange={this.onChange}
						/>
						<label
							className={this.state.passwordAlert ? 'signup-alert' : 'disabled'}
						>
							{locales.PASSWORD_MIN_LENGTH_ERROR_MSG(6)}
						</label>
					</div>
					<div>
						<button onClick={this.signup.bind(this)} className="signup-button">
							{locales.SIGNUP}
						</button>
					</div>
					<div className="signup-terms_and_alert">
						<div className="signup-terms">
							<span
								className={
									this.state.cakeTermsOfUse
										? 'signup-checkbox checked'
										: 'signup-checkbox'
								}
								onClick={this.toggleCakeTermsOfUse.bind(this)}
							>
								<img
									src="./assets/images/checked.png"
									className={
										this.state.cakeTermsOfUse
											? 'signup-checked-img'
											: 'signup-checked-img-hidden'
									}
								/>
							</span>
							<span className="signup-terms--agree">
								{locales.CAKE_TERMS_OF_USE}
								<a href={environment.cakeTerms} target="_blank">
									{locales.TOS}
								</a>
								{/* <a onClick={this.cakeTermsOfUse.bind(this)}>{locales.TOS}</a> */}
							</span>
						</div>
						<label
							className={
								this.state.cakeTermsAlert ? 'signup-alert' : 'disabled'
							}
						>
							{locales.TOS_ACCEPT_ERROR}
						</label>
					</div>
				</div>
				<div className="signup--divider"></div>
				<div className="signup--login-url">
					<p>
						{locales.ALREADY_HAVE_AN_ACCOUNT}
						<a onClick={this.backToLogin.bind(this)}>{locales.LOG_IN}</a>
					</p>
				</div>
			</div>
		);
	}
}

export default SignUp;
