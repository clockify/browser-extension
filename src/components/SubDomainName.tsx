import React, { ChangeEvent, useState } from 'react';
import SelfHostedBootSettings from '~/components/self-hosted-login-settings.component';
import Login from '~/components/login.component';
import Header from '~/components/header.component';
import locales from '~/helpers/locales';

export const SubDomainName = (): React.JSX.Element => {
	const [domainName, setDomainName] = useState<string>();

	const onChange = (event: ChangeEvent<HTMLInputElement>): void => {
		setDomainName(event.target.value);
	};

	const submitDomainName = (): void => {
		window.reactRoot.render(<SelfHostedBootSettings url={`https://${domainName}.clockify.me`} />);
	};

	const cancel = (): void => {
		window.reactRoot.render(<Login />);
	};

	return (
		<div>
			<Header showActions={false} />
			<form onSubmit={submitDomainName} className="sub-domain">
				<div>
					<label className="sub-domain__server_url">{locales.SUBDOMAIN_NAME}</label>
					<div className="sub-domain__input">
						<span className={'sub-domain__input--prepend'}>https://</span>
						<input
							required={true}
							id="domainName"
							placeholder={locales.SUBDOMAIN_NAME}
							onChange={onChange}
						/>
						<span className={'sub-domain__input--append'}>.clockify.me</span>
					</div>
				</div>
			</form>
			<div className="sub-domain__actions">
				<button
					className="sub-domain__actions--submit"
					onClick={submitDomainName}>
					{locales.SUBMIT}
				</button>
				<a className="sub-domain__actions--cancel" onClick={cancel.bind(this)}>
					{locales.CANCEL}
				</a>
			</div>
		</div>
	);
};