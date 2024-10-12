import React from 'react';

interface PropsInteface {
	light?: boolean;
	text: string;
}

export const NotificationSecondaryText = (props: PropsInteface) => {
	return (
		<div>
			<p
				className={
					props.light
						? 'notification-modal--text--light'
						: 'notification-modal--text'
				}
			>
				{props.text}
			</p>
		</div>
	);
};
