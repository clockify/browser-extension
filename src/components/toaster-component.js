import * as React from 'react';
import { getBrowser } from '~/helpers/browser-helper';
import locales from '~/helpers/locales';

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

	showUndoToast(message, removeAfterSeconds, entryId) {
		const undoToastId = `undoToast${counter}`;

		counter++;

		this.createToastMessage(undoToastId, message, 'undo', removeAfterSeconds, entryId);

		if (removeAfterSeconds) {
			this.autoRemoveToast(undoToastId, removeAfterSeconds)
		}
	}

	createToastMessage(successToastId, message, type, delay = 1.5, entriesIds = null) {
		const toastMessageContainer = document.createElement('div');
		toastMessageContainer.setAttribute('id', successToastId);
		toastMessageContainer.setAttribute(
			'class',
			'toaster__message--container_' + type
		);
		toastMessageContainer.style.animation = `toaster-fadein 0.5s ease, toaster-fadeout 0.5s cubic-bezier(1, -.5, 0, 1) ${delay - 0.5
			}s`;

		const toastMessageContent = document.createElement('span');
		toastMessageContent.setAttribute('class', 'toaster__message--content');
		toastMessageContent.textContent = message;

		toastMessageContainer.appendChild(toastMessageContent);

		if (type === 'undo') {
			const toastMessageButton = document.createElement('button');
			toastMessageButton.textContent = locales.GLOBAL__UNDO_LABEL;
			toastMessageButton.setAttribute('class', 'toaster__button');

			toastMessageContainer.appendChild(toastMessageButton)

			toastMessageButton.addEventListener('click', () => this.handleClick(toastMessageContainer, entriesIds))
		}

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


	async handleClick(toastMessageContainer, entriesIds) {
		getBrowser()
			.runtime.sendMessage({
				eventName: 'restoreTimeEntries',
				options: {
					ids: entriesIds,
				},
			})
			.then(() => {
				this.props.handleRefresh()
				toastMessageContainer.remove()
				setTimeout(() => {
					if (entriesIds.length > 1) {
						this.showSuccessToast(locales.ENTRIES_RESTORED_SUCCESS, 5)
					} else {
						this.showSuccessToast(locales.ENTRY_RESTORED_SUCCESS, 5)
					}
				}, 1000)
			})
			.catch((error) => {
				if (error?.status === 403) {
					const message = error?.response?.data.message
					this.showErrorToast(message, 5)
				} else {
					this.showErrorToast(error.message, 5)
				}
			})
	}

	render() {
		return <div className="toaster__container" id="toaster-container"></div>;
	}
}

export default Toaster;
