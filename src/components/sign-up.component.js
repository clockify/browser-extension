import * as React from 'react';
import HomePage from './home-page.component';
import Header from './header.component';
import * as ReactDOM from 'react-dom';
import {getEnv} from '../environment';
import * as moment from 'moment-timezone';
import {AuthService} from "../services/auth-service";
import {UserService} from "../services/user-service";
import {isAppTypeExtension} from "../helpers/app-types-helpers";
import {getBrowser, isChrome} from "../helpers/browser-helpers";

const environment = getEnv();

const authService = new AuthService();
const userService = new UserService();

class SignUp extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            email: props.email?props.email:'',
            password : '',
            passwordAlert: false,
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
        if(this.state.email.indexOf("@") < 0 || this.state.email.length < 3) {
            this.setState({
                emailAlert: true,
                termsAlert: false,
                passwordAlert: false
            })
        } else if(this.state.password.length < 6) {
            this.setState({
                emailAlert: false,
                termsAlert: false,
                passwordAlert: true
            });
        } else if(!document.getElementById("terms").checked) {
            this.setState({
                emailAlert: false,
                passwordAlert: false,
                termsAlert: true
            })
        } else {
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
                    this.setState({
                        emailExists: true,
                        emailAlert: false,
                        passwordAlert: false,
                        termsAlert: false
                    })
                })
        }
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
                ReactDOM.render(<HomePage/>, document.getElementById('mount'));
            }).catch(error => {
        })
    }

    onChange(e) {
        this.setState({
            [e.target.name]: e.target.value
        });
    }

    termsOfUse() {
        window.open(`${environment.terms}`, '_blank');
    }

    render() {
        return(
            <div>
                <Header showActions={false}
                        showSync={false}
                        mode={localStorage.getItem('mode')}
                        showLogin={true}
                />
                <div className="signup-form">
                    <div>
                        <input className="signup-input" required = {true} name="email" type="email"
                               id="email" placeholder="E-mail" value={this.state.email} onChange={this.onChange}/>
                        <label className={this.state.emailAlert ? "signup-alert" : "disabled"}>Email address in invalid format.</label>
                        <label className={this.state.emailExists ? "signup-alert" : "disabled"}>Email address is already in use or not valid!</label>
                    </div>
                    <div>
                        <input className="signup-input" required = {true} name="password" type="password" id="password"
                               placeholder="Password" value={this.state.password} onChange={this.onChange}/>
                        <label className={this.state.passwordAlert ? "signup-alert" : "disabled"}>Password must have at least 6 characters.</label>
                    </div>
                    <div>
                        <input type="checkbox" className="ios-switch" id="terms"/>
                        <label htmlFor="terms"><span className="sw"></span></label>
                        <span className="signup-terms">I agree to <a onClick={this.termsOfUse.bind(this)}>terms of use</a></span>
                        <label className={this.state.termsAlert ? "signup-alert" : "disabled"}>You must accept the terms of service</label>
                    </div>
                    <div>
                        <button onClick={this.signup.bind(this)} className="signup-button">SIGN UP</button>
                    </div>
                </div>
            </div>
        )
    }
}

export default SignUp;