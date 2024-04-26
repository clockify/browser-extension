import React from 'react';
import Request from 'react-http-request';
import Login from './login.component';
import { ExtParameters } from '../wrappers/ext-parameters';

const extParameters = new ExtParameters();

class SelfHostedBootSettings extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			ready: false,
			homeUrl: '',
		};
	}

	componentDidMount() {
		let url = this.props.url.replace(/(\/)+$/, '');
		this.setState({
			homeUrl: url,
			ready: true,
		});
	}

	render() {
		if (this.state.ready) {
			return (
				<Request
					url={`${this.state.homeUrl}/web/boot`}
					method="get"
					accept="application/json"
					type="application/json"
					verbose={true}
				>
					{({ error, result, loading }) => {
						if (error) {
							return <Login logout={{ isTrue: true }} />;
						}
						if (loading) {
							return (
								<div className="pull-loading">
									<img
										src="./assets/images/circle_1.svg"
										className="pull-loading-img1"
									/>
									<img
										src="./assets/images/circle_2.svg"
										className="pull-loading-img2"
									/>
								</div>
							);
						} else {
							let baseUrl;
							let selfHosted = true;
							try {
								const data = JSON.parse(result.text);
								selfHosted = data.selfHosted;
								extParameters.setSelfHosted(true);
								if (data.endpoint.startsWith('/')) {
									baseUrl = `${this.state.homeUrl}${data.endpoint}`;
								} else {
									baseUrl = data.endpoint;
								}
								localStorage.setItem('frontendUrl', data.frontendUrl);
								if (data.synchronization && data.synchronization.websockets) {
									const { websockets } = data.synchronization;
									let webSocketEndPoint;
									if (websockets.apps && websockets.apps.extension) {
										webSocketEndPoint = websockets.apps.extension.endpoint;
									} else {
										webSocketEndPoint = websockets.endpoint;
									}
									if (webSocketEndPoint.startsWith('/')) {
										webSocketEndPoint = `wss://${data.frontendUrl}${websockets.apps.extension.endpoint}`;
									}
									console.log(
										'self-hosted-login-settings.component.js | line 78 | webSocketEndPoint:',
										webSocketEndPoint
									);
									extParameters.setWebSocketUrl(webSocketEndPoint);
								}
							} catch (error) {
								baseUrl = `${this.state.homeUrl}/api`;
								console.log(
									'self-hosted-login-settings.component.js | line 86 | error:',
									error
								);
								console.log(
									'self-hosted-login-settings.component.js | line 90 | baseUrl:',
									baseUrl
								);
							}
							extParameters.setBaseUrl(baseUrl);
							extParameters.setHomeUrl(this.state.homeUrl);

							const subDomain = [
								...this.state.homeUrl.matchAll(/\/\/(.*)\.clockify\.me/g),
							][0]?.[1];
							if (subDomain) {
								extParameters.setSubDomainName(subDomain);
							}

							return <Login />;
						}
					}}
				</Request>
			);
		} else {
			return null;
		}
	}
}
export default SelfHostedBootSettings;
