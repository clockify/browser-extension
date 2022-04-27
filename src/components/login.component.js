import React from 'react';
import {getEnv} from '../environment';
import * as ReactDOM from 'react-dom';
import Header from './header.component';
import SignUp from './sign-up.component';
import packageJson from '../../package';
import SelfHostedUrl from "./self-hosted-url.component";
import {LocalStorageService} from "../services/localStorage-service";
import {getLocalStorageEnums} from "../enums/local-storage.enum";
import {getBrowser, isChrome} from "../helpers/browser-helper";
import {HtmlStyleHelper} from "../helpers/html-style-helper";
import SubDomainName from "./sub-domain-name.component";
import locales from "../helpers/locales";
import { checkConnection } from './check-connection';

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
            activeWorkspace: null,
            offline: false,
            selfHosted: null,
            nativeLogin: true,
            loginLogoUrl: '',
            isSubDomain: null
        };

        this.onChange = this.onChange.bind(this);
        this.forgotPassword = this.forgotPassword.bind(this);
        this.openLoginPage = this.openLoginPage.bind(this);
        this.setAsyncStateItems = this.setAsyncStateItems.bind(this);
    }

    componentDidMount() {
        this.removeDarkMode();
        this.setAppVersionToStorage();
        // this.setAppType();
        this.setAsyncStateItems();

        if (this.props.logout) {
            this.logout();
        }
    }

    async setAsyncStateItems() {
        const selfHosted = JSON.parse(await localStorageService.get('selfHosted', false));
        const isSubDomain = !!(await localStorageService.get('subDomainName'));
        this.setState({
            selfHosted,
            isSubDomain
        });
    }

    clearAllActiveTimers() {
        // const backgroundPage = getBrowser().extension.getBackgroundPage();
        // backgroundPage.removeIdleListenerIfIdleIsEnabled();
        // backgroundPage.removeAllPomodoroTimers();
        // backgroundPage.removeReminderTimer();
        getBrowser().runtime.sendMessage({
            eventName: 'removeIdleListenerIfIdleIsEnabled'
        });
        getBrowser().runtime.sendMessage({
            eventName: 'removeAllPomodoroTimers'
        });
        getBrowser().runtime.sendMessage({
            eventName: 'removeReminderTimer'
        });
    };

    removeDarkMode() {
        htmlStyleHelper.removeDarkModeClassFromBodyElement();
    }

    // setAppType() {
    //     const storageAppType = localStorage.getItem('appType');
    //     let appType;

    //     if (!storageAppType || storageAppType === '') {
    //         appType = determineAppType();
    //     } else {
    //         appType = storageAppType;
    //     }

    //     this.setState({
    //         appType: appType
    //     });
    // }

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

    async openLoginPage() {
        const homeUrl = await localStorageService.get('homeUrl');
        let redirectNumb = mozzilaRedirectNumb;
        if (isChrome()) {
            redirectNumb = chromeRedirectNumb;
        }
        if(isChrome()){
            window.open(`${homeUrl}/redirect/${redirectNumb}`, '_blank');
        }else{
            browser.tabs.create({
                url:`${homeUrl}/redirect/${redirectNumb}`
              });
        }
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

    async logout() {
        const isOffline = await localStorageService.get('offline');
        if(isOffline && !JSON.parse(isOffline)) {
            let timeEntriesOffline  = await localStorageService.get('timeEntriesOffline');
            timeEntriesOffline = timeEntriesOffline ?
                JSON.parse(timeEntriesOffline) : [];

            this.clearPermissions();
            getBrowser().runtime.sendMessage('closeOptionsPage');
            
            await localStorageService.clearByPrefixes([getLocalStorageEnums().PERMANENT_PREFIX, getLocalStorageEnums().SELF_HOSTED_PREFIX, getLocalStorageEnums().SUB_DOMAIN_PREFIX], true);
            localStorageService.set('timeEntriesOffline', JSON.stringify(timeEntriesOffline));
        }
        getBrowser().runtime.sendMessage({
            eventName: "removeBadge"
        });
        checkConnection();
    }

    clearPermissions() {
        getBrowser().storage.local.get(['permissions'], (result) => {
            const { permissions } = result;
            if(permissions){
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
    
                localStorageService.removeItem('permissions');
                if (newPermissions.length > 0)
                    getBrowser().storage.local.set({"permissions": newPermissions});

            }
        });
    }

    render() {
        return (
            <div>
                <Header showActions={false}/>
                <div className="login">
                    <button className="login-submit"
                            onClick={this.openLoginPage}>{locales.LOG_IN}</button>
                    <hr className="login__divider"/>
                    <div className="new-account">
                        <p>{locales.NEW_HERE}?</p>
                        <a onClick={this.signup}>{locales.CREATE_AN_ACCOUNT}</a>
                    </div>
                    <div className={!this.state.selfHosted && !this.state.isSubDomain ?
                        "self-hosting-url" : "disabled"}>
                        <a onClick={this.enterBaseUrl}>{locales.LOGIN_TO_CUSTOM_DOMAIN}</a>
                        <hr className="login__divider"/>
                        <a onClick={this.enterSubDomainName}>{locales.LOGIN_TO_SUB_DOMAIN}</a>
                    </div>
                    <div className={this.state.selfHosted || this.state.isSubDomain ? "cloud-version-url" : "disabled"}>
                        <a onClick={this.backToCloudVersion.bind(this)}>{locales.RETURN_TO_CLOCKIFY_CLOUD}</a>
                    </div>
                </div>
            </div>
        )
    }
}

export default Login;