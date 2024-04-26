import React from 'react';

const NotificationImage = ({ image }) => {
	return(
		<div>
			{image && <div className='notification-modal--image'>
				<img src={image} />
			</div>}
		</div>
	)
}

export default NotificationImage;