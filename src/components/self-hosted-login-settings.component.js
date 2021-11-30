import React from 'react';
import Request from 'react-http-request';
import Login from './login.component';
import {SettingsService} from "../services/settings-service";

const settingsService = new SettingsService();

class SelfHostedBootSettings extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            ready: false,
            homeUrl: ""
        }
    }

    componentDidMount() {
        let url = this.props.url.replace(/(\/)+$/, "");
        this.setState({
            homeUrl: url,
            ready: true
        });
    }

    render() {
        if (this.state.ready) {
            return (
                <Request
                    url={`${this.state.homeUrl}/web/boot`}
                    method='get'
                    accept='application/json'
                    type="application/json"
                    verbose={true}>
                    {
                        ({error, result, loading}) => {
                            if (error) {
                                return <Login logout={true}/>;
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
                                let baseUrl;    
                                try {
                                    const data = JSON.parse(result.text);
                                    if (data.endpoint.startsWith("/")) {
                                        baseUrl = `${this.state.homeUrl}${data.endpoint}`;
                                    } else {
                                        baseUrl = data.endpoint;
                                    }
                                    
                                    if (data.synchronization && data.synchronization.websockets) {
                                        const { websockets } = data.synchronization;
                                        let webSocketEndPoint;
                                        if (websockets.apps && websockets.apps.extension) {
                                            webSocketEndPoint = websockets.apps.extension.endpoint;
                                        }
                                        else {
                                            webSocketEndPoint = websockets.endpoint;
                                        }
                                        if (webSocketEndPoint.startsWith("/")) {
                                            //webSocketEndPoint = `${this.state.homeUrl}${webSocketEndPoint}`;
                                            webSocketEndPoint = `${data.frontendUrl.replace(/\/$/, "")}${webSocketEndPoint}`;
                                        }
                                        settingsService.setWebSocketUrl(webSocketEndPoint);
                                    } 
                                }
                                catch (error) {
                                    baseUrl = `${this.state.homeUrl}/api`
                                }
                                settingsService.setBaseUrl(baseUrl)
                                settingsService.setHomeUrl(this.state.homeUrl);
                                settingsService.setSelfHosted(true); 
                                return <Login/>
                            }
                        }
                    }
                </Request>
            );
        } else {
            return null;
        }
    }
}
export default SelfHostedBootSettings;