import * as React from "react";

let counter = 0;

class Toaster extends React.Component {
    constructor(props) {
        super(props);

        this.state = {

        }
    }

    toast(type, message, removeAfterSeconds) {
        switch(type) {
            case 'success':
                this.showSuccessToast(message, removeAfterSeconds);
                break;
            case 'error':
                this.showErrorToast(message, removeAfterSeconds);
        }
    }

    showSuccessToast(message, removeAfterSeconds) {
        const successToastId = 'successToast' + counter;

        counter++;

        this.createToastMessage(successToastId, message, 'success');

        if (removeAfterSeconds) {
            this.autoRemoveToast(successToastId, removeAfterSeconds);
        }
    }

    showErrorToast(message, removeAfterSeconds) {
        const errorToastId = 'errorToast' + counter;

        counter++;

        this.createToastMessage(errorToastId, message, 'error');

        if (removeAfterSeconds) {
            this.autoRemoveToast(errorToastId, removeAfterSeconds);
        }
    }

    createToastMessage(successToastId, message, type) {
        const toastMessageContainer = document.createElement('div');
        toastMessageContainer.setAttribute('id', successToastId);
        toastMessageContainer.setAttribute('class', 'toaster__message--container_' + type);

        const toastMessageContent = document.createElement('span');
        toastMessageContent.setAttribute('class', 'toaster__message--content');
        toastMessageContent.textContent = message;

        toastMessageContainer.appendChild(toastMessageContent);

        const toasterContainer = document.getElementById('toaster-container');

        toasterContainer.appendChild(toastMessageContainer);
    }

    autoRemoveToast(successToastId, removeAfterSeconds) {
        setTimeout(() => {
            if (document.getElementById(successToastId)) {
                document.getElementById(successToastId).remove();
            }
        }, parseInt(removeAfterSeconds*1000));
    }

    render() {
        return (
            <div className="toaster__container"
                 id="toaster-container"></div>
        )
    }
}

export default Toaster;