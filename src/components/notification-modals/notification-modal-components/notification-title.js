import React from 'react';

const NotificationTitle = ({ title }) => {
	return(
			<div>
				{title && <div className='notification-modal--title'>
					{title}
				</div>}
			</div>
	)
}

export default NotificationTitle;