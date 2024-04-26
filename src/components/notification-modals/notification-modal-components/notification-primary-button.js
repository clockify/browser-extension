import React from 'react';

const NotificationPrimaryButton = ({ buttonTitle, handleClick }) => {
	return(
		<div
				onClick={handleClick}
				className='notification-modal--confirmation_button'
		>
				{buttonTitle}
		</div>
	)
}

export default NotificationPrimaryButton;