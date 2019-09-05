import * as React from 'react';
import HomePage from './home-page.component';
import Header from './header.component';
import * as ReactDOM from 'react-dom';
import {getEnv} from '../environment';
import * as moment from 'moment-timezone';
import {AuthService} from "../services/auth-service";
import {UserService} from "../services/user-service";
import {isAppTypeExtension} from "../helpers/app-types-helper";
import {getBrowser, isChrome} from "../helpers/browser-helper";
import Login from "./login.component";

const environment = getEnv();

const authService = new AuthService();
const userService = new UserService();
let disabledSignup = false;

class SignUp extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            email: props.email?props.email:'',
            password : '',
            passwordAlert: false,
            termsOfUse: true,
            termsAlert: false,
            emailAlert: false,
            emailExists: false
        };

        this.onChange = this.onChange.bind(this);
        this.signup = this.signup.bind(this);
    }

    componentDidMount(){}

    signup(event) {
        event.preventDefault();
        if (disabledSignup) {
            return;
        }
        this.setState({
            emailAlert: false,
            termsAlert: false,
            passwordAlert: false,
            emailExists: false
        }, () => {
            this.setState({
                emailAlert: !this.state.email.includes("@") || this.state.email.length < 3,
                termsAlert: !this.state.termsOfUse,
                passwordAlert: this.state.password.length < 6
            }, () => {
                if (!this.state.emailAlert && !this.state.termsAlert && !this.state.passwordAlert) {
                    disabledSignup = true;
                    authService.signup(this.state.email, this.state.password, moment.tz.guess())
                        .then(response => {
                            let data = response.data;
                            if (isAppTypeExtension()) {
                                getBrowser().storage.sync.set({
                                    token: (data.token),
                                    userId: (data.id),
                                    refreshToken: (data.refreshToken),
                                    userEmail: (data.email)
                                });
                            }
                            localStorage.setItem('userId', data.id);
                            localStorage.setItem('userEmail', data.email);
                            localStorage.setItem('token', data.token);
                            localStorage.setItem('refreshToken', data.refreshToken);
                            this.fetchUser(data.id);
                        })
                        .catch(error => {
                            disabledSignup = false;
                            this.setState({
                                emailExists: true
                            })
                        })
                }
            });
        });
    }

    fetchUser(userId) {
        userService.getUser(userId)
            .then(response => {
                let data = response.data;
                localStorage.setItem('activeWorkspaceId', data.activeWorkspace);
                localStorage.setItem("userSettings",
                    JSON.stringify(data.settings));

                if (isAppTypeExtension()) {
                    getBrowser().storage.sync.set({
                        activeWorkspaceId: (data.activeWorkspace),
                        userSettings: JSON.stringify(data.settings)
                    });
                }
                disabledSignup = false;
                ReactDOM.render(<HomePage/>, document.getElementById('mount'));
            }).catch(error => {
        })
    }

    onChange(e) {
        this.setState({
            [e.target.name]: e.target.value
        });
    }

    toggleTermsOfUse() {
        this.setState({
            termsOfUse: !this.state.termsOfUse
        })
    }

    termsOfUse() {
        window.open(`${environment.terms}`, '_blank');
    }

    backToLogin() {
        ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
        ReactDOM.render(<Login/>, document.getElementById('mount'));
    }

    render() {
        return(
            <div>
                <Header showActions={false}
                        showSync={false}
                        mode={localStorage.getItem('mode')}
                />
                <div className="signup-title_and_text">
                    <p className="signup-title">Get started with Clockify</p>
                    <p className="signup-text">Create a free account to start tracking time and supercharge your productivity</p>
                </div>
                <div className="signup-form">
                    <div className="signup-form--email">
                        <input className="signup-input" required = {true} name="email" type="email"
                               id="email" placeholder="E-mail" value={this.state.email} onChange={this.onChange}/>
                        <label className={this.state.emailAlert ? "signup-alert" : "disabled"}>Email address in invalid format.</label>
                        <label className={this.state.emailExists ? "signup-alert" : "disabled"}>Email address is already in use or not valid!</label>
                    </div>
                    <div className="signup-form--password">
                        <input className="signup-input" required = {true} name="password" type="password" id="password"
                               placeholder="Password" value={this.state.password} onChange={this.onChange}/>
                        <label className={this.state.passwordAlert ? "signup-alert" : "disabled"}>Password must have at least 6 characters.</label>
                    </div>
                    <div>
                        <button onClick={this.signup.bind(this)} className="signup-button">SIGN UP</button>
                    </div>
                    <div className="signup-terms_and_alert">
                        <div className="signup-terms">
                        <span className={this.state.termsOfUse ?
                            "signup-checkbox checked" : "signup-checkbox"}
                              onClick={this.toggleTermsOfUse.bind(this)}>
                        <img src="./assets/images/checked.png"
                             className={this.state.termsOfUse ?
                                 "signup-checked-img" : "signup-checked-img-hidden"}/>
                        </span>
                            <span className="signup-terms--agree">I agree to
                            <a onClick={this.termsOfUse.bind(this)}>terms of use</a>
                        </span>
                        </div>
                        <label className={this.state.termsAlert ? "signup-alert" : "disabled"}>You must accept the terms of service</label>
                    </div>
                </div>
                <div className="signup--divider"></div>
                <div className="signup--login-url">
                    <p>Already have an account
                        <a onClick={this.backToLogin.bind(this)}>Log in</a>
                    </p>
                </div>
            </div>
        )
    }
}

export default SignUp;