import React from 'react';
import * as ReactDOM from 'react-dom';
import Header from './header.component';
import Login from './login.component';
import {SettingsService} from "../services/settings-service";

const settingsService = new SettingsService();

class SelfHostedUrl extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            url: ""
        }
    }

    componentDidMount() {
        this.header.setState({
            selfHosted: true
        });
    }

    onChange(e) {
        this.setState({
            url: e.target.value
        });
    }

    keyPressed(target) {
        if(target.charCode == 13) {
            this.submitUrl();
        }
    }

    submitUrl() {
        const url = this.state.url + '/api';

        settingsService.getLoginSettings(url).then(response => {
            settingsService.setBaseUrl(url);
            settingsService.setHomeUrl(
                url.replace('api.', '').replace('api', '')
            );
            settingsService.setSelfHosted(true);
            ReactDOM.render(<Login loginSettings={response.data}/>, document.getElementById('mount'))
        }).catch(error => {
        });
    }

    cancel() {
        ReactDOM.render(<Login/>, document.getElementById('mount'));
    }

    render() {
        return (
            <div onKeyPress={this.keyPressed.bind(this)}>
                <Header
                    ref={instance => {
                        this.header = instance;
                    }}
                    showActions={false}/>
                <form className="self-hosted-url">
                    <div>
                        <label className="self-hosted-url__server_url">Server url</label>
                        <input required = {true} name="url" id="url" placeholder="https://"
                               onChange={this.onChange.bind(this)}/>
                    </div>
                </form>
                <div className="self-hosted-url__actions">
                    <button className="self-hosted-url__actions--submit"
                            onClick={this.submitUrl.bind(this)}>Submit</button>
                    <a className="self-hosted-url__actions--cancel"
                       onClick={this.cancel.bind(this)}>Cancel</a>
                </div>
            </div>
        )
    }
}

export default SelfHostedUrl;