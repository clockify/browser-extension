import React from 'react';
import locales from '~/helpers/locales';

interface PropsInterface {
	cancel: VoidFunction;
	onInputChange: Function;
	clientName: string;
	onAddClient: VoidFunction;
	onInputBlur?: VoidFunction;
}

export const ClientListCreateForm = (props: PropsInterface) => {
	return (
		<div className="client-list__create-form">
			<div className="client-list__create-form__title-and-close">
				<div className="client-list__create-form--title">
					{locales.CREATE_NEW_CLIENT}
				</div>
				<span
					onClick={props.cancel}
					className="client-list__create-form__close"
				></span>
			</div>
			<div className="client-list__create-form--divider"></div>
			<input
				autoFocus
				className="client-list__create-form--client-name"
				placeholder={locales.CLIENT_NAME}
				value={props.clientName}
				onBlur={props.onInputBlur}
				onChange={(event) => props.onInputChange(event)}
			></input>

			<div
				onClick={props.onAddClient}
				className="client-list__create-form--confirmation_button"
			>
				{locales.ADD}
			</div>
			<span onClick={props.cancel} className="client-list__create-form--cancel">
				{locales.CANCEL}
			</span>
		</div>
	);
};
