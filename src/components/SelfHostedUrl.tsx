import React, { ChangeEvent, FocusEvent, useState } from 'react';
import Header from '~/components/header.component';
import locales from '~/helpers/locales';
import Login from '~/components/login.component';
import SelfHostedBootSettings from '~/components/self-hosted-login-settings.component';

export const SelfHostedUrl = (): React.JSX.Element => {
	const [url, setUrl] = useState<string>('');

	const onChange = (event: ChangeEvent<HTMLInputElement>): void => {
		setUrl(event.target.value);
	};

	const onBlur = (event: FocusEvent<HTMLInputElement>): void => {
		const urlParts = event.target.value.split('.');
		const topLevelDomainAndRest = urlParts.slice().reverse()[0];
		const topLevelDomain = topLevelDomainAndRest.split('/')[0];
		const urlWithoutTopLevelDomainAndRest = urlParts
			.slice(0, -1)
			.join('.');
		const url = [
			urlWithoutTopLevelDomainAndRest,
			topLevelDomain,
		].join('.');

		setUrl(url);
	};

	const submitUrl = (): void => {
		window.reactRoot.render(<SelfHostedBootSettings url={url} />);
	};

	const cancel = (): void => {
		window.reactRoot.render(<Login />);
	};

	return (
		<div>
			<Header showActions={false} />
			<form onSubmit={submitUrl} className="self-hosted-url">
				<div>
					<label className="self-hosted-url__server_url">
						{locales.CUSTOM_DOMAIN_URL}
					</label>
					<p className="self-hosted-url__server_url--info">
						{locales.CUSTOM_DOMAIN_DESCRIPTION}
					</p>
					<input
						onBlur={onBlur}
						required={true}
						id="selfHostedurl"
						placeholder="https://"
						onChange={onChange}
					/>
				</div>
			</form>
			<div className="self-hosted-url__actions">
				<button
					className="self-hosted-url__actions--submit"
					onClick={submitUrl}
				>
					{locales.SUBMIT}
				</button>
				<a
					className="self-hosted-url__actions--cancel"
					onClick={cancel}
				>
					{locales.CANCEL}
				</a>
			</div>
		</div>
	);
};