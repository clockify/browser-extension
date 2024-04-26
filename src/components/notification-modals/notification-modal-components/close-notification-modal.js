import React from 'react';

const CloseNotificationModal = ({ onCloseVerificationModal }) => {
	return(
		<div className='notification-modal--close-modal' onClick={onCloseVerificationModal}></div>
	)
}

export default CloseNotificationModal;