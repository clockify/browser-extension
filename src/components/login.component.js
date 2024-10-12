import React from 'react';
import { getEnv } from '~/environment';
import Header from './header.component.jsx';
import SignUp from './sign-up.component';
import packageJson from '../../package';
import SelfHostedUrl from './self-hosted-url.component';

import { getLocalStorageEnums } from '~/enums/local-storage.enum';
import { getBrowser, isChrome } from '~/helpers/browser-helper';
import SubDomainName from './sub-domain-name.component';
import locales from '../helpers/locales';
import { checkConnection } from './check-connection';
import { removeDarkModeClassFromBodyElement } from '~/zustand/slices/darkThemeSlice';
import { mapStateToProps } from '~/zustand/mapStateToProps';

const environment = getEnv();
const mozzilaRedirectNumb = 4;
const chromeRedirectNumb = 3;

const ErrorMessageComponent = props => {
	const { type, data } = props;

	switch (type) {
		case 'USER_BANNED':
			return (
				<div>
					<p className="login-error-message">
						{locales.BANNED__ACCOUNT_SUSPENDED}
						{'. '}
						{locales.BANNED__INFO_MODAL__MESSAGE_PART_TWO}{' '}
						<a href="mailto:support@clockify.me">support@clockify.me</a>{' '}
						{locales.BANNED__INFO_MODAL__MESSAGE_PART_THREE}
					</p>
				</div>
			);
		case 'WORKSPACE_BANNED':
			return (
				<div>
					<p className="login-error-message">
						{locales.BANNED__INFO_MODAL__WORKSPACE_MESSAGE_PART_ONE(
							`${locales.WORKSPACE} ${data?.name}`
						)}{' '}
						<br />
						{locales.BANNED__INFO_MODAL__MESSAGE_PART_TWO}{' '}
						<a href="mailto:support@clockify.me">support@clockify.me</a>{' '}
						{locales.BANNED__INFO_MODAL__MESSAGE_PART_THREE}
					</p>
				</div>
			);
		case 'TOKEN_INVALID':
			return (
				<div>
					<p className="login-error-message">
						Your session has expired. Please try to log in again. For other issues,
						please contact <a href="mailto:support@clockify.me">support@clockify.me</a>
					</p>
				</div>
			);
	}
};

class Login extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isReady: false,
			email: '',
			password: '',
			activeWorkspace: null,
			offline: false,
			selfHosted: null,
			nativeLogin: true,
			loginLogoUrl: '',
			isSubDomain: null,
		};

		this.onChange = this.onChange.bind(this);
		this.forgotPassword = this.forgotPassword.bind(this);
		this.openLoginPage = this.openLoginPage.bind(this);
		this.openSignupPage = this.openSignupPage.bind(this);
		this.setAsyncStateItems = this.setAsyncStateItems.bind(this);
	}

	componentDidMount() {
		removeDarkModeClassFromBodyElement();
		this.setAppVersionToStorage();
		// this.setAppType();
		this.setAsyncStateItems();

		if (this.props.logout?.isTrue) {
			this.logout();
		}
	}

	async setAsyncStateItems() {
		const selfHosted = JSON.parse(await localStorage.getItem('selfHosted', false));
		const isSubDomain = !!(await localStorage.getItem('subDomainName'));
		this.setState({
			selfHosted,
			isSubDomain,
		});
	}

	clearAllActiveTimers() {
		getBrowser().runtime.sendMessage({
			eventName: 'removeIdleListenerIfIdleIsEnabled',
		});
		getBrowser().runtime.sendMessage({
			eventName: 'restartPomodoro',
		});
		getBrowser().runtime.sendMessage({
			eventName: 'removeReminderTimer',
		});
		getBrowser().runtime.sendMessage({
			eventName: 'removeStopTimerEvent',
		});
	}

	setAppVersionToStorage() {
		localStorage.setItem('appVersion', packageJson.version);
	}

	onChange(e) {
		this.setState({
			[e.target.name]: e.target.value,
		});
	}

	forgotPassword() {
		window.open(`${environment.resetPassword}`, '_blank');
	}

	async openLoginPage() {
		await localStorage.setItem('signupExpected', 'false');
		const homeUrl = await localStorage.getItem('homeUrl');
		let redirectNumb = mozzilaRedirectNumb;
		if (isChrome()) {
			redirectNumb = chromeRedirectNumb;
		}
		if (isChrome()) {
			window.open(`${homeUrl}/redirect/${redirectNumb}?type=login`, '_blank');
		} else {
			browser.tabs.create({
				url: `${homeUrl}/redirect/${redirectNumb}?type=login`,
			});
		}
		window.close();
	}

	async openSignupPage() {
		await localStorage.setItem('signupExpected', 'true');
		const homeUrl = await localStorage.getItem('homeUrl');
		let redirectNumb = mozzilaRedirectNumb;
		if (isChrome()) {
			redirectNumb = chromeRedirectNumb;
		}
		if (isChrome()) {
			window.open(`${homeUrl}/redirect/${redirectNumb}?type=signup`, '_blank');
		} else {
			browser.tabs.create({
				url: `${homeUrl}/redirect/${redirectNumb}?type=signup`,
			});
		}
		window.close();
	}

	signup() {
		window.reactRoot.render(<SignUp />);
	}

	enterBaseUrl() {
		window.reactRoot.render(<SelfHostedUrl />);
	}

	enterSubDomainName() {
		window.reactRoot.render(<SubDomainName />);
	}

	backToCloudVersion() {
		localStorage.setItem(
			'baseUrl',
			environment.endpoint,
			getLocalStorageEnums().PERMANENT_PREFIX
		);
		localStorage.setItem('homeUrl', environment.home, getLocalStorageEnums().PERMANENT_PREFIX);
		localStorage.clearByPrefixes([
			getLocalStorageEnums().SELF_HOSTED_PREFIX,
			getLocalStorageEnums().SUB_DOMAIN_PREFIX,
		]);

		this.setState({
			selfHosted: false,
			isSubDomain: false,
			nativeLogin: true,
		});
	}

	async logout() {
		const isOffline = await localStorage.getItem('offline');
		getBrowser()
			.runtime.sendMessage({
				eventName: 'invalidateToken',
			})
			.finally(() => {
				localStorage.removeItem('token');
			});
		if (isOffline && !JSON.parse(isOffline)) {
			this.props.resetSlices();
			let timeEntriesOffline = await localStorage.getItem('timeEntriesOffline');
			timeEntriesOffline = timeEntriesOffline ? JSON.parse(timeEntriesOffline) : [];
			this.clearPermissions();
			getBrowser().runtime.sendMessage('closeOptionsPage');

			await localStorage.clearByPrefixes(
				[
					getLocalStorageEnums().PERMANENT_PREFIX,
					getLocalStorageEnums().SELF_HOSTED_PREFIX,
					getLocalStorageEnums().SUB_DOMAIN_PREFIX,
					getLocalStorageEnums().APP_STORE,
				],
				true
			);

			localStorage.setItem('timeEntriesOffline', JSON.stringify(timeEntriesOffline));
		}
		getBrowser().runtime.sendMessage({
			eventName: 'removeBadge',
		});

		checkConnection();
	}

	clearPermissions() {
		getBrowser().storage.local.get(['permissions'], result => {
			const { permissions } = result;
			if (permissions) {
				const newPermissions = [];
				permissions.forEach(permissionsForUser => {
					const { userId, permissions } = permissionsForUser;
					if (permissions.filter(p => p.isCustom || p.isEnabled).length > 0) {
						const newPermissionsForUser = {
							userId,
							permissions: [],
						};
						permissions.forEach(p => {
							if (p.isCustom || p.isEnabled)
								newPermissionsForUser.permissions.push(Object.assign(p, {}));
						});
						newPermissions.push(newPermissionsForUser);
					}
				});

				localStorage.removeItem('permissions');
				if (newPermissions.length > 0)
					getBrowser().storage.local.set({ permissions: newPermissions });
			}
		});
	}

	render() {
		return (
			<div>
				<Header showActions={false} />
				<div className="login">
					<button className="login-submit" onClick={this.openLoginPage}>
						{locales.LOG_IN}
					</button>
					<hr className="login__divider" />
					<div
						className={
							this.state.isSubDomain || this.state.selfHosted
								? 'disabled'
								: 'new-account'
						}>
						<p>{locales.NEW_HERE}?</p>
						<a onClick={this.openSignupPage}>{locales.CREATE_AN_ACCOUNT}</a>
					</div>
					<div
						className={
							!this.state.selfHosted && !this.state.isSubDomain
								? 'self-hosting-url'
								: 'disabled'
						}>
						<a onClick={this.enterBaseUrl}>{locales.LOGIN_TO_CUSTOM_DOMAIN}</a>
						<hr className="login__divider" />
						<a onClick={this.enterSubDomainName}>{locales.LOGIN_TO_SUB_DOMAIN}</a>
					</div>
					<div
						className={
							this.state.selfHosted || this.state.isSubDomain
								? 'cloud-version-url'
								: 'disabled'
						}>
						<a onClick={this.backToCloudVersion.bind(this)}>
							{locales.RETURN_TO_CLOCKIFY_CLOUD}
						</a>
					</div>
					{this.props.logout?.isTrue && (
						<ErrorMessageComponent
							type={this.props.logout?.reason}
							data={this.props.logout?.data}
						/>
					)}
				</div>
			</div>
		);
	}
}

const selectedState = state => ({
	resetSlices: state.resetSlices,
});

export default mapStateToProps(selectedState)(Login);
