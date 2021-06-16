import React from 'react';
import {getEnv} from '../environment';
import * as ReactDOM from 'react-dom';
import Header from './header.component';
import SignUp from './sign-up.component';
import packageJson from '../../package';
import {getAppTypes} from "../enums/applications-types.enum";
import {determineAppType, isAppTypeDesktop, isAppTypeExtension} from "../helpers/app-types-helper";
import SelfHostedUrl from "./self-hosted-url.component";
import {LocalStorageService} from "../services/localStorage-service";
import {getLocalStorageEnums} from "../enums/local-storage.enum";
import {getBrowser, isChrome} from "../helpers/browser-helper";
import {HtmlStyleHelper} from "../helpers/html-style-helper";
import SubDomainName from "./sub-domain-name.component";

const environment = getEnv();
const localStorageService = new LocalStorageService();
const htmlStyleHelper = new HtmlStyleHelper();
const mozzilaRedirectNumb = 4;
const chromeRedirectNumb = 3;

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
            loginLogoUrl: '',
            isSubDomain: !!localStorageService.get('subDomainName')
        };

        this.onChange = this.onChange.bind(this);
        this.forgotPassword = this.forgotPassword.bind(this);
        this.openLoginPage = this.openLoginPage.bind(this);
    }

    componentDidMount() {
        this.removeDarkMode();
        this.setAppVersionToStorage();
        this.setAppType();

        if (this.props.logout) {
            this.logout();
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

    onChange(e) {
        this.setState({
            [e.target.name]: e.target.value
        });
    }

    forgotPassword() {
        window.open(`${environment.resetPassword}`, '_blank');
    }

    openLoginPage() {
        const homeUrl = localStorageService.get('homeUrl');
        let redirectNumb = mozzilaRedirectNumb;
        if (isChrome()) {
            redirectNumb = chromeRedirectNumb;
        }
        window.open(`${homeUrl}/redirect/${redirectNumb}`, '_blank');
        window.close();
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
            nativeLogin: true
        });
    }

    logout() {
        if(localStorageService.get('offline') && !JSON.parse(localStorageService.get('offline'))) {
            let timeEntriesOffline = localStorageService.get('timeEntriesOffline') ?
                JSON.parse(localStorageService.get('timeEntriesOffline')) : [];
            if (isAppTypeExtension()) {
                this.clearPermissions();
                getBrowser().runtime.sendMessage('closeOptionsPage');
            }
            localStorageService.clear();
            localStorageService.set('timeEntriesOffline', JSON.stringify(timeEntriesOffline));
        }
    }

    clearPermissions() {
        getBrowser().storage.local.get(['permissions'], (result) => {
            const { permissions } = result;
            const newPermissions = [];
            permissions.forEach(permissionsForUser => {
                const { userId, permissions } = permissionsForUser;
                if (permissions.filter(p => p.isCustom || p.isEnabled).length > 0) {
                    const newPermissionsForUser = {
                        userId,
                        permissions: []
                    }
                    permissions.forEach(p => {
                        if (p.isCustom || p.isEnabled)
                            newPermissionsForUser.permissions.push(Object.assign(p, {}))
                    });
                    newPermissions.push(newPermissionsForUser);
                }
            });

            getBrowser().storage.local.clear();
            if (newPermissions.length > 0)
                getBrowser().storage.local.set({"permissions": newPermissions});
        });
    }

    render() {
        return (
            <div>
                <Header showActions={false}/>
                <div className="login">
                    <button className="login-submit"
                            onClick={this.openLoginPage}>Log in</button>
                    <hr className="login__divider"/>
                    <div className="new-account">
                        <p>New here?</p>
                        <a onClick={this.signup}>Create an account</a>
                    </div>
                    <div className={!this.state.selfHosted && !this.state.isSubDomain ?
                        "self-hosting-url" : "disabled"}>
                        <a onClick={this.enterBaseUrl}>Log in to custom domain</a>
                        <hr className="login__divider"/>
                        <a onClick={this.enterSubDomainName}>Log in to sub domain</a>
                    </div>
                    <div className={this.state.selfHosted || this.state.isSubDomain ? "cloud-version-url" : "disabled"}>
                        <a onClick={this.backToCloudVersion.bind(this)}>Return to Clockify cloud</a>
                    </div>
                </div>
            </div>
        )
    }
}

export default Login;