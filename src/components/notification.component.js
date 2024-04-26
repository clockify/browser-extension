import React from 'react';

const boldParts = (text) => {
	return (
		text?.split('[b]').map((part, index) => {
			return index % 2 ? <strong>{part}</strong> : part;
		}) || ''
	);
};

function Notification(props) {
	// data
	const { id, title, message, links, children } = props;
	// styles
	const { hideX, isImportant } = props;
	// functions
	const { markAsRead } = props;

	return (
		<div key={id} className={`notification ${isImportant ? 'important' : ''}`}>
			<div className="notification-header">
				<div className="notification-title">{title}</div>
				<div
					id={id}
					className={`notification-close ${hideX ? 'disabled' : ''}`}
					onClick={(event) => {
						const notificationId = event.target.id;

						markAsRead(notificationId);
					}}
				></div>
			</div>
			<div className="notification-body">
				<div className="notification-message">
					{children ?? boldParts(message)}
				</div>
			</div>
			<div className="notification-footer">
				{links?.length > 0 &&
					links.map(({ linkText, linkUrl, classList, linkCallback }) => {
						const target = linkUrl ? '_blank' : '_self';

						return (
							<a
								target={target}
								href={linkUrl}
								className={`${classList}`}
								onClick={linkCallback}
							>
								{linkText}
							</a>
						);
					})}
			</div>
		</div>
	);
}

export default Notification;
