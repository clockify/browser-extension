import React from 'react';

interface PropsInteface {
	buttonTitle: string;
	handleClick: VoidFunction;
}

export const NotificationSecondaryButton = (props: PropsInteface) => {
	return (
		<div onClick={props.handleClick} className="notification-modal--secondary">
			{props.buttonTitle}
		</div>
	);
};
