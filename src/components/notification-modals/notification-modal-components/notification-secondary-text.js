import React from 'react';

const NotificationSecondaryText = ({ light = false, text }) => {
	return(
		<div>
			<p className={light? "notification-modal--text--light" : "notification-modal--text"}>
				{text}
			</p>
		</div>
	)
}

export default NotificationSecondaryText;