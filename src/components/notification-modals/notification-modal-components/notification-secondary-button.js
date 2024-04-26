import React from 'react';

const NotificationSecondaryButton = ({ buttonTitle, handleClick }) => {
	return(
		<div
			onClick={handleClick}
			className='notification-modal--secondary'
		>
			{buttonTitle}
		</div>
	)
}

export default NotificationSecondaryButton;