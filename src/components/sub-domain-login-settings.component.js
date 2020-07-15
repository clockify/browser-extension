import React from 'react';
import Request from 'react-http-request';
import Login from './login.component';
import {SettingsService} from "../services/settings-service";
import {LocalStorageService} from "../services/localStorage-service";

const settingsService = new SettingsService();
const localStorageService = new LocalStorageService();

class SubDomainLoginSettings extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const baseUrl = localStorageService.get('baseUrl');
        return (
            <Request
                url={`${baseUrl}/system-settings/login-settings`}
                method='get'
                accept='application/json'
                headers={{'sub-domain-name': this.props.domainName}}
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
                            settingsService.setSubDomainName(this.props.domainName);
                            settingsService.setHomeUrl(`https://${this.props.domainName}.clockify.me`)
                            return <Login loginSettings={JSON.parse(result.text)}/>
                        }
                    }
                }
            </Request>
        );
    }
}
export default SubDomainLoginSettings;