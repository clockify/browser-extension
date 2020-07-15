import React from 'react';
import {getEnv} from '../environment';
import * as ReactDOM from 'react-dom';
import PostAuth from './post-auth.component';
import Header from './header.component';
import HomePage from './home-page.component';
import SignUp from './sign-up.component';
import * as axios from 'axios';
import * as qs from 'qs';
import * as moment from 'moment-timezone';
import packageJson from '../../package';
import {getAppTypes} from "../enums/applications-types.enum";
import {determineAppType, isAppTypeDesktop, isAppTypeExtension} from "../helpers/app-types-helper";
import {UserService} from "../services/user-service";
import {AuthService} from "../services/auth-service";
import SelfHostedUrl from "./self-hosted-url.component";
import {LocalStorageService} from "../services/localStorage-service";
import {getLocalStorageEnums} from "../enums/local-storage.enum";
import {getBrowser, isChrome} from "../helpers/browser-helper";
import {TokenService} from "../services/token-service";
import {HtmlStyleHelper} from "../helpers/html-style-helper";
import SubDomainName from "./sub-domain-name.component";
import {SettingsService} from "../services/settings-service";

const environment = getEnv();
const authService = new AuthService();
const userService = new UserService();
const localStorageService = new LocalStorageService();
const tokenService = new TokenService();
const htmlStyleHelper = new HtmlStyleHelper();
const settingsService = new SettingsService();

class Login extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            isReady: false,
            email: '',
            password: '',
            appType: getAppTypes().EXTENSION,
            activeWorkspace: null,
            offline: false,
            selfHosted: JSON.parse(localStorageService.get('selfHosted', false)),
            nativeLogin: true,
            oAuthActive: false,
            oAuthUrl: '',
            loginLogoUrl: '',
            oAuthForceSSO: false,
            saml2Active: false,
            saml2Request: '',
            saml2Url: '',
            ldapActive: false,
            isSubDomain: !!localStorageService.get('subDomainName')
        };

        this.onChange = this.onChange.bind(this);
        this.forgotPassword = this.forgotPassword.bind(this);
        this.loginWithCredentials = this.loginWithCredentials.bind(this);
    }

    componentDidMount() {
        this.removeDarkMode();
        this.setAppVersionToStorage();
        this.setAppType();

        if (this.props.logout) {
            this.logout();
        }
        this.setActiveLoginSettings();

        if (isAppTypeExtension()) {
            this.clearAllActiveTimers();
        }
    }

    clearAllActiveTimers() {
        const backgroundPage = getBrowser().extension.getBackgroundPage();
        backgroundPage.removeIdleListenerIfIdleIsEnabled();
        backgroundPage.removeAllPomodoroTimers();
        backgroundPage.removeReminderTimer();
    };

    removeDarkMode() {
        htmlStyleHelper.removeDarkModeClassFromBodyElement();
    }

    setAppType() {
        const storageAppType = localStorage.getItem('appType');
        let appType;

        if (!storageAppType || storageAppType === '') {
            appType = determineAppType();
        } else {
            appType = storageAppType;
        }

        this.setState({
            appType: appType
        });
    }

    setAppVersionToStorage() {
        localStorageService.set('appVersion', packageJson.version);
    }

    async setActiveLoginSettings() {
        let loginSettings;
        if (this.props.loginSettings) {
            loginSettings = this.props.loginSettings;
        } else {
            loginSettings = await settingsService.getLoginSettings();
        }

        if (loginSettings.loginPreferences && loginSettings.loginPreferences.length > 0) {
            loginSettings.loginPreferences.forEach(loginPreference => {
                switch (loginPreference) {
                    case 'LDAP':
                        this.setLdapLoginSettings(loginSettings);
                        break;
                    case 'OAUTH2':
                        this.setOAuthLoginSettings(loginSettings);
                        break;
                    case 'SAML2':
                        this.setSaml2LoginSettings(loginSettings);
                        break;
                }
            });

            if (!loginSettings.loginPreferences.includes('NATIVE_LOGIN')) {
                this.setState({
                    nativeLogin: false
                });
            }
        } else {
            if (loginSettings.ldapLoginSettings && loginSettings.ldapLoginSettings.active) {
                this.setLdapLoginSettings(loginSettings);
            }
            if (loginSettings.oAuthConfiguration && loginSettings.oAuthConfiguration.active) {
                this.setOAuthLoginSettings(loginSettings);
            }
            if (loginSettings.saml2Settings && loginSettings.saml2Settings.active) {
                this.setSaml2LoginSettings(loginSettings);
            }
        }
    }

    setSaml2LoginSettings(loginSettings) {
        this.setState({
            saml2Active: true,
            saml2Request: loginSettings.saml2Settings.samlRequest,
            saml2Url: loginSettings.saml2Settings.loginUrl,
            loginLogoUrl: loginSettings.logoURL ?
                loginSettings.logoURL : loginSettings.oAuthConfiguration.logoUri
        });
    }

    setOAuthLoginSettings(loginSettings) {
        this.setState({
            oAuthActive: true,
            oAuthUrl: loginSettings.oAuthConfiguration.url,
            loginLogoUrl: loginSettings.logoURL ?
                loginSettings.logoURL : loginSettings.oAuthConfiguration.logoUri,
            oAuthForceSSO: loginSettings.oAuthConfiguration.forceSSO
        });
    }

    setLdapLoginSettings() {
        this.setState({
            ldapActive: true
        });
    }

    onChange(e) {
        this.setState({
            [e.target.name]: e.target.value
        });
    }

    forgotPassword() {
        if(localStorage.getItem('appType') === getAppTypes().DESKTOP) {
            openExternal(`${environment.resetPassword}`);
        } else {
            window.open(`${environment.resetPassword}`, '_blank');
        }
    }

    loginWithCredentials() {
        ReactDOM.render(
            <PostAuth email = {this.state.email} password = {this.state.password}/>,
            document.getElementById("mount")
        );
    }

    signup() {
        ReactDOM.render(<SignUp/>, document.getElementById('mount'));
    }

    enterBaseUrl() {
        ReactDOM.render(<SelfHostedUrl/>, document.getElementById('mount'));
    }

    enterSubDomainName() {
        ReactDOM.render(<SubDomainName/>, document.getElementById('mount'));
    }

    backToCloudVersion() {
        localStorageService.set('baseUrl', environment.endpoint, getLocalStorageEnums().PERMANENT_PREFIX);
        localStorageService.set('homeUrl', environment.home, getLocalStorageEnums().PERMANENT_PREFIX);
        localStorageService.clearByPrefixes(
            [getLocalStorageEnums().SELF_HOSTED_PREFIX, getLocalStorageEnums().SUB_DOMAIN_PREFIX]
        );

        this.setState({
            selfHosted: false,
            isSubDomain: false,
            loginLogoUrl: "",
            ldapActive: false,
            nativeLogin: true,
            oAuthForceSSO: false
        });
    }

    handleKeyPressed(target) {
        if(target.charCode == 13) {
            this.loginWithCredentials();
        }
    }

    loginWithOAuth() {
        const state = Math.random().toString(36);
        const nonce = Math.random().toString(36);

        localStorageService.set('oAuthState', state, getLocalStorageEnums().SELF_HOSTED_PREFIX);
        const authorizationUrl = this.state.oAuthUrl;


        let oAuthUrl = authorizationUrl +
            '&state=' + btoa(state) +
            '&nonce=' + btoa(nonce) +
            '&prompt=select_account';

        this.oAuthLoginForExtension(oAuthUrl, nonce);
    }

    oAuthLoginForExtension(url, nonce) {

        if (!isAppTypeExtension()) {
            return;
        }

        let homeUrl = localStorageService.get('homeUrl');
        if (localStorageService.get("subDomainName", null) != null) {
            homeUrl = homeUrl.replace(`${localStorageService.get("subDomainName")}.`, "")
        }
        
        let redirectUri = "";

        if (typeof chrome !== "undefined") {
            if (typeof browser !== "undefined") {
                redirectUri = homeUrl + '/' + environment.redirectUriOauthFirefoxExtension;
            } else {
                redirectUri = homeUrl + '/' + environment.redirectUriOauthChromeExtension;
            }
        }

        url = url + '&redirect_uri=' + redirectUri;
        getBrowser().runtime.sendMessage({
            eventName: 'oAuthLogin',
            oAuthUrl: url,
            nonce: nonce,
            redirectUri: redirectUri
        }, (isDone) => {
            if (isDone) {
                ReactDOM.render(<HomePage/>, document.getElementById('mount'));
            }
        });
    }

    oAuthLoginForDesktop(url, nonce) {
        if (!isAppTypeDesktop()) {
            return;
        }
        const redirectUrl = environment.redirectUriOauthDesktop;
        url = url +
            '&client_id=' + environment.desktopClientId +
            '&redirect_uri=' + redirectUrl;

        oAuthLoginDesktop(url).then((response_url) => {
            const decodedUrl = decodeURIComponent(response_url.response);
            const code = this.getParamFromUrl(decodedUrl, "code");
            const stateFromResponse = this.getParamFromUrl(decodedUrl, "state");

            if (stateFromResponse && this.isStateFromResponseSameWithSentState(stateFromResponse)) {
                return;
            }

            localStorageService.removeItem('oAuthState');
            if (!!code && !!stateFromResponse) {
                authService.loginWithCode(code, stateFromResponse, nonce, redirectUrl)
                    .then(response => response.json()).then(data => {
                    aBrowser.storage.local.set({
                        token: (data.token),
                        userId: (data.id),
                        refreshToken: (data.refreshToken),
                        userEmail: (data.email)
                    });
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('refreshToken', data.refreshToken);
                    localStorage.setItem('userId', data.id);
                    localStorage.setItem('userEmail', data.email);

                    this.fetchUser(data.id).then(data => {
                        aBrowser.storage.local.set({
                            activeWorkspaceId: (data.activeWorkspace),
                            userSettings: (JSON.stringify(data.settings))
                        });
                        localStorage.setItem('activeWorkspaceId', data.activeWorkspace);
                        localStorage.setItem('userSettings', JSON.stringify(data.settings));

                    });
                });
            }
        })
    }

    //Old version of google login - remove when 'oAuthLoginForDesktop' finished
    loginWithGoogle() {
        googleLogin().then((responseCode) => {
            const GOOGLE_TOKEN_URL = 'https://www.googleapis.com/oauth2/v4/token';
            let body = {
                code: responseCode,
                client_id: environment.desktopClientId,
                redirect_uri: 'urn:ietf:wg:oauth:2.0:oob:auto',
                grant_type: 'authorization_code'
            };

            axios.post(GOOGLE_TOKEN_URL, qs.stringify({
                code: responseCode,
                client_id: body.client_id,
                redirect_uri: body.redirect_uri,
                grant_type: body.grant_type
            }),{
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }}).then((responseToken) => {
                this.getAuth(responseToken.data.access_token, responseToken.data.id_token);
            })
        })
    }

    getAuth(accessToken, token) {
        const GOOGLE_PROFILE_URL = 'https://www.googleapis.com/userinfo/v2/me';
        axios.get(GOOGLE_PROFILE_URL, {headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            }}).then(user => {

            let body = {
                provider: 'google',
                token: token,
                email: user.data.email,
                timeZone:  moment.tz.guess()
            };

            authService.loginWithGoogle('google', token, user.data.email, moment.tz.guess())
                .then((response) => {
                    let data = response.data;
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('refreshToken', data.refreshToken);
                    localStorage.setItem('userId', data.id);
                    localStorage.setItem('userEmail', data.email);
                    localStorage.setItem('timeZone', moment.tz.guess());
                    this.fetchUser(data.id);
                })
        })
    }

    getParamFromUrl(params, paramName) {
        let param = "";
        if (!!params && params.includes("&")) {
            param = params.split("&")
                .filter(param => param.includes(paramName))
                .map(code => code.split('=')[1])[0];
        }

        return param;
    }

    isStateFromResponseSameWithSentState(state) {
        return !(
            state &&
            localStorage.getItem('selfhosted_oAuthState') &&
            localStorage.getItem('selfhosted_oAuthState') === atob(state)
        );
    }

    loginWithSaml() {
        this.saml2LoginForExtension(this.state.saml2Url, this.state.saml2Request);
        this.saml2LoginForDesktop(this.state.saml2Url, this.state.saml2Request);
    }

    saml2LoginForExtension(url, request) {
        if (isAppTypeExtension()) {
            getBrowser().runtime.sendMessage({
                eventName: 'saml2Login', saml2Url: url, saml2Request: request});
        }
    }

    saml2LoginForDesktop(url, request) {
        if (isAppTypeDesktop()) {
            const redirectUri = environment.redirectUriSaml2Desktop;
            saml2LoginDesktop(url, request, redirectUri).then(token => {
                tokenService.refreshToken(token).then(response => {
                    const data = response.data;

                    localStorage.setItem('token', data.token);
                    localStorage.setItem('refreshToken', data.refreshToken);
                    localStorage.setItem('userId', data.id);
                    localStorage.setItem('userEmail', data.email);

                    userService.getUser(data.id).then(response => {
                        const data = response.data;

                        localStorage.setItem('activeWorkspaceId', data.activeWorkspace);
                        localStorage.setItem('userSettings', JSON.stringify(data.settings));

                        ReactDOM.unmountComponentAtNode(document.getElementById("mount"));
                        ReactDOM.render(<HomePage/>, document.getElementById("mount"));
                    });
                });
            });
        }
    }

    fetchUser(userId) {
        userService.getUser(userId)
            .then(response => {
                let data = response.data;
                if (isAppTypeExtension()) {
                    getBrowser().storage.local.set({
                        activeWorkspaceId: (data.activeWorkspace),
                        userSettings: (JSON.stringify(data.settings))
                    });
                }
                localStorage.setItem('activeWorkspaceId', data.activeWorkspace);
                localStorage.setItem('userSettings', JSON.stringify(data.settings));
                this.setState({
                    isReady: true,
                    activeWorkspace: data.activeWorkspace
                });
                ReactDOM.render(<HomePage/>, document.getElementById('mount'));
            }).catch(error => {
                this.setState({
                    isReady: false,
                })
            })
    }

    logout() {
        if(localStorageService.get('offline') && !JSON.parse(localStorageService.get('offline'))) {
            let timeEntriesOffline = localStorageService.get('timeEntriesOffline') ?
                JSON.parse(localStorageService.get('timeEntriesOffline')) : [];
            if (isAppTypeExtension()) {
                getBrowser().storage.local.clear();
                getBrowser().runtime.sendMessage('closeOptionsPage');
            }
            if(localStorageService.get('selfHosted') &&
                !JSON.parse(localStorageService.get('selfHosted'))) {
                this.logoutGoogleUser();
            }
            localStorageService.clear();
            localStorageService.set('timeEntriesOffline', JSON.stringify(timeEntriesOffline));
            try {
                window.plugins.googleplus.logout(
                    function (msg) {}
                )
            } catch (e) {}
        }
    }

    logoutGoogleUser() {
        if (isAppTypeExtension()) {
            getBrowser().identity.launchWebAuthFlow(
                { 'url': 'https://accounts.google.com/logout' }, () => {}
            );
        }
    }

    render() {
        return (
            <div onKeyPress={this.handleKeyPressed.bind(this)}>
                <Header showActions={false}/>
                <form className={this.state.nativeLogin || this.state.ldapActive ?
                    "login" : "disabled"}>
                    <div>
                        {
                            this.state.ldapActive ?
                                <input required={true}
                                       name="email"
                                       id="email"
                                       placeholder={this.state.nativeLogin && this.state.ldapActive ?
                                           "E-mail or username" : "Username"}
                                       value={this.state.email}
                                       onChange={this.onChange}/> :
                                <input required={true}
                                       name="email"
                                       type="email"
                                       id="email"
                                       placeholder="E-mail"
                                       value={this.state.email}
                                       onChange={this.onChange}/>
                        }
                    </div>
                    <div>
                        <input required = {true} name="password" type="password" id="password" placeholder="Password"
                               value={this.state.password} onChange={this.onChange}/>
                    </div>
                    <p hidden={this.props.info?false:true} id="info">{this.props.info}</p>

                    <a className={this.state.nativeLogin ? "login__forgot-password" : "disabled"}
                       onClick={this.forgotPassword}>
                        Forgot password
                    </a>
                </form>
                <div className="login">
                    <button className={this.state.nativeLogin || this.state.ldapConfiguration ?
                        "login-submit" : "disabled"}
                            onClick={this.loginWithCredentials}>Log in</button>
                    <button className={this.state.appType !== getAppTypes().EXTENSION &&
                                      !this.state.selfHosted ? "google-login" : "google-login-disabled"}
                            onClick={this.loginWithGoogle.bind(this)}>
                        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAARCAYAAADUryzEAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAIPSURBVHgBlVM/aBNhFH/vS5qmiz0XbXToBaQOor2znUQwZBCcUu1YEIugDkqrTiroKYjrqYM4BQfJoJQgimiHHhlEtJET3L1BtFTbntGSo6Tf8921F+9Sr9jfcHy/9733e//uQ+jA54KmZFPpMyDpGACpACJNQD/4/A5J3slZthP1xyiZKwxNsMUgAAUSgIhmU7Zu5i3b9bkIL74VDxqEYG4W7IOIJrtRFEOeDoILQ5eB4EbcE57y50WQBTEvgU5yfhVX8XSuVp9qV9R8Ceqvh/s+rv7MbluPdIDEeM6ataJ6X4t6P0mh77bq1VhL3ms4R43Mg8bjAZBuNyDh/j5r9hP8J3BlGma474JPvPc7nvVenS9FHQ4ZS5rYZC68Itgbkq7h+doGh5Qo8zy0hHhX8Nraq+TDAmwNil+Bh38FNmRCHmp8teifQ76E3iu4hwIuPPf64f7yoOs2Rd4er7pJKY/capT5zzzlnwnJEiRgylw+ALd/D0ODuhTMpsyk4MPG94EwOADRo6B6vTI6g+ubWLPjNFLryoexat3nWnlEEVkx0fPl2mSquScs36ld780HAlplREUQLIJqvH/0uP9FltwV2jKLJcgslNwVKfW3xnanvYEkkU6woNMzd/b4m4tH7bUk8VvUKycusfV8pxARuPwS70qvZUaHjEmZBiujOj+iPiK5E2TKtsee2P/y+wNydMMjOPbkvQAAAABJRU5ErkJggg=="
                             className="google-img"/>
                        Continue with Google</button>
                    <button className={this.state.appType === getAppTypes().EXTENSION &&
                                       ((!this.state.selfHosted &&
                                           !this.state.isSubDomain && isChrome()) ||
                                       ((this.state.selfHosted ||
                                           this.state.isSubDomain) && this.state.oAuthActive)) ?
                                      "login__oauth--button" : "disabled"}
                            type="button"
                            onClick={this.loginWithOAuth.bind(this)}>
                        <div className="login__oauth--button__img_and_text">
                            <img className="login__oauth--img"
                                 src={this.state.loginLogoUrl ?
                                     this.state.loginLogoUrl.toString() : ""}/>
                            <p>Login with OAuth2</p>
                        </div>
                    </button>
                    <button className={(this.state.isSubDomain || this.state.selfHosted) &&
                                        this.state.saml2Active && isChrome() ?
                                            "login__saml2--button" : "disabled"}
                            type="button"
                            onClick={this.loginWithSaml.bind(this)}>
                        <div className="login__oauth--button__img_and_text">
                            <img className="login__oauth--img"
                                 src={this.state.loginLogoUrl ?
                                     this.state.loginLogoUrl.toString() : ""}/>
                            <p>Continue with SAML2</p>
                        </div>
                    </button>
                    <hr className="login__divider"/>
                    <div className={this.state.nativeLogin &&
                                    !this.state.ldapActive &&
                                    !this.state.oAuthForceSSO ?
                                        "new-account" : "disabled"}>
                        <p>New here?</p>
                        <a onClick={this.signup}>Create an account</a>
                    </div>
                    <hr className={!this.state.ldapActive && !this.state.oAuthForceSSO ?
                        "login__divider" : "disabled"}/>
                    <div className={!this.state.selfHosted && !this.state.isSubDomain &&
                        this.state.appType === getAppTypes().EXTENSION ?
                        "self-hosting-url" : "disabled"}>
                        <a onClick={this.enterBaseUrl}>Log in to custom domain</a>
                        <hr className="login__divider"/>
                        <a onClick={this.enterSubDomainName}>Log in to sub domain</a>
                    </div>
                    <div className={(this.state.selfHosted || this.state.isSubDomain) &&
                        this.state.appType === getAppTypes().EXTENSION ? "cloud-version-url" : "disabled"}>
                        <a onClick={this.backToCloudVersion.bind(this)}>Return to Clockify cloud</a>
                    </div>
                </div>
            </div>
        )
    }
}

export default Login;
