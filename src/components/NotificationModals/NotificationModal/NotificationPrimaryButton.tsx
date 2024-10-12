import React from 'react';

interface PropsInterface {
	buttonTitle: string;
	handleClick: VoidFunction;
}

export const NotificationPrimaryButton = (props: PropsInterface) => {
	return (
		<div
			onClick={props.handleClick}
			className="notification-modal--confirmation_button"
		>
			{props.buttonTitle}
		</div>
	);
};
