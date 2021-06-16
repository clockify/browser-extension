import React from 'react';
import * as ReactDOM from 'react-dom';
import Header from './header.component';
import Login from './login.component';
import SelfHostedBootSettings from "./self-hosted-login-settings.component";

class SelfHostedUrl extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            url: ""
        }
    }

    componentDidMount() {
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
            <SelfHostedBootSettings url={url}/>,
            document.getElementById("mount")
        );
    }

    cancel() {
        ReactDOM.render(<Login/>, document.getElementById('mount'));
    }

    render() {
        return (
            <div onKeyPress={this.keyPressed.bind(this)}>
                <Header showActions={false}/>
                <form className="self-hosted-url">
                    <div>
                        <label className="self-hosted-url__server_url">Custom domain URL</label>
                        <p className="self-hosted-url__server_url--info">Enter your Clockify domain.
                           Your domain is the URL from which you access Clockify in the browser</p>
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