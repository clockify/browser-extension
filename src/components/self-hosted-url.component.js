import React from 'react';
import * as ReactDOM from 'react-dom';
import Header from './header.component';
import Login from './login.component';
import {SettingsService} from "../services/settings-service";
import SelfHostedLoginSettings from "./self-hosted-login-settings.component";
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
        let url = document.getElementById('selfHostedurl').value;
        ReactDOM.render(
            <SelfHostedLoginSettings url={url}/>,
            document.getElementById("mount")
        );
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
                        <label className="self-hosted-url__server_url">Custom domain URL</label>
                        <input required = {true} id="selfHostedurl" placeholder="https://"/>
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