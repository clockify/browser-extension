import * as React from 'react';

let counter = 0;

class Toaster extends React.Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	toast(type, message, removeAfterSeconds) {
		switch (type) {
			case 'success':
				this.showSuccessToast(message, removeAfterSeconds);
				break;
			case 'error':
				this.showErrorToast(message, removeAfterSeconds);
				break;
			case 'info':
				this.showInfoToast(message, removeAfterSeconds);
				break;
		}
	}

	showSuccessToast(message, removeAfterSeconds) {
		const successToastId = 'successToast' + counter;

		counter++;

		this.createToastMessage(
			successToastId,
			message,
			'success',
			removeAfterSeconds
		);

		if (removeAfterSeconds) {
			this.autoRemoveToast(successToastId, removeAfterSeconds);
		}
	}

	showErrorToast(message, removeAfterSeconds) {
		const errorToastId = 'errorToast' + counter;

		counter++;

		this.createToastMessage(errorToastId, message, 'error', removeAfterSeconds);

		if (removeAfterSeconds) {
			this.autoRemoveToast(errorToastId, removeAfterSeconds);
		}
	}

	showInfoToast(message, removeAfterSeconds) {
		const errorToastId = 'infoToast' + counter;

		counter++;

		this.createToastMessage(errorToastId, message, 'info', removeAfterSeconds);

		if (removeAfterSeconds) {
			this.autoRemoveToast(errorToastId, removeAfterSeconds);
		}
	}

	createToastMessage(successToastId, message, type, delay = 1.5) {
		const toastMessageContainer = document.createElement('div');
		toastMessageContainer.setAttribute('id', successToastId);
		toastMessageContainer.setAttribute(
			'class',
			'toaster__message--container_' + type
		);
		toastMessageContainer.style.animation = `toaster-fadein 0.5s ease, toaster-fadeout 0.5s cubic-bezier(1, -.5, 0, 1) ${
			delay - 0.5
		}s`;

		const toastMessageContent = document.createElement('span');
		toastMessageContent.setAttribute('class', 'toaster__message--content');
		toastMessageContent.textContent = message;

		toastMessageContainer.appendChild(toastMessageContent);

		const toasterContainer = document.getElementById('toaster-container');
		toasterContainer.style.zIndex = '99999';
		toasterContainer.appendChild(toastMessageContainer);
	}

	autoRemoveToast(successToastId, removeAfterSeconds) {
		setTimeout(() => {
			if (document.getElementById(successToastId)) {
				document.getElementById(successToastId).remove();
			}
		}, parseInt(removeAfterSeconds * 1000));
	}

	render() {
		return <div className="toaster__container" id="toaster-container"></div>;
	}
}

export default Toaster;
