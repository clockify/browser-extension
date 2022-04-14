import React from 'react';
import Request from 'react-http-request';
import Login from './login.component';
import HomePage from './home-page.component';
import {getBrowser} from "../helpers/browser-helper";
import {LocalStorageService} from "../services/localStorage-service";

const localStorageService = new LocalStorageService();

class PostAuth extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            baseUrl: null,
            subDomainName: null
        };
    }

    async componentDidUpdate() {
        const baseUrl = await localStorageService.get("baseUrl");
        const subDomainName = await localStorageService.get('subDomainName');
        if(baseUrl !== this.state.baseUrl || subDomainName !== this.state.subDomainName){
            this.setState({
                baseUrl,
                subDomainName
            });
        }
    }

    render() {
        const { baseUrl, subDomainName } = this.state;
        return (
            <Request
                url={`${baseUrl}/auth/token`}
                method='post'
                accept='application/json'
                type="application/json"
                headers={{'sub-domain-name': subDomainName ? subDomainName : null}}
                verbose={true}
                send = {JSON.stringify({"email" : this.props.email,
                    "password" : this.props.password})}>
                {
                    ({error, result, loading}) => {
                        if (error) {
                            let msg = "Invalid username and/or password."
                            const res = error.response;
                            if (error.status === 404) {
                                msg = res.body.message;
                            }
                            else  {
                                // all other error types we handle generically
                                if (res && res.body) {
                                    msg = res.body.message;
                                }                                
                            }
                            return <Login info={msg} logout={true}/>;
                        }
                        if (loading) {
                            return (
                                <div className="pull-loading">
                                    <img src="./assets/images/circle_1.svg"
                                         className="pull-loading-img1"/>
                                    <img src="./assets/images/circle_2.svg"
                                         className="pull-loading-img2"/>
                                </div>
                        )
                        } else {
                            let userId = JSON.parse(result.text).id;
                            let userEmail = JSON.parse(result.text).email;
                            let token = JSON.parse(result.text).token;
                            let refreshToken = JSON.parse(result.text).refreshToken;
                            
                            getBrowser().storage.local.set({
                                token: (token),
                                userId: (userId),
                                refreshToken: (refreshToken),
                                userEmail: (userEmail)
                            });
                            
                            localStorage.setItem("userId", userId);
                            localStorage.setItem("userEmail", userEmail);
                            localStorage.setItem("token", token);
                            localStorage.setItem("refreshToken", refreshToken);
                            return <Request
                                url={`${baseUrl}/users/${userId}`}
                                method='get'
                                accept='application/json'
                                type="application/json"
                                verbose={true}
                                headers={{"X-Auth-Token" :  `${token}`}}
                            >
                                {
                                    ({error, result, loading}) => {
                                        if (error) {
                                            return <Login info={error.response.body.message}
                                                         logout={true}
                                                    />;
                                        }
                                        if (loading) {
                                            return (
                                                <div className="pull-loading">
                                                    <img src="./assets/images/circle_1.svg"
                                                         className="pull-loading-img1"/>
                                                    <img src="./assets/images/circle_2.svg"
                                                         className="pull-loading-img2"/>
                                                </div>
                                            )
                                        } else {
                                            
                                            getBrowser().storage.local.set({
                                                activeWorkspaceId: JSON.parse(result.text).activeWorkspace
                                            });
                                            // getBrowser().extension.getBackgroundPage().addPomodoroTimer();
                                            getBrowser().runtime.sendMessage({
                                                eventName: 'pomodoroTimer'
                                            });
                                            
                                            localStorage.setItem("activeWorkspaceId",
                                                JSON.parse(result.text).activeWorkspace);
                                            localStorage.setItem("userSettings",
                                                JSON.stringify(JSON.parse(result.text).settings));
                                            return <HomePage/>
                                        }
                                    }
                                }
                            </Request>;
                        }
                    }
                }
            </Request>
        );
    }
}
export default PostAuth;