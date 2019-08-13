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
        }
    }

    showSuccessToast(message, removeAfterSeconds) {
        const successToastId = 'toast' + counter;
        counter++;

        const toastMessageContainer = document.createElement('div');
        toastMessageContainer.setAttribute('id', successToastId);
        toastMessageContainer.setAttribute('class', 'toaster__message--container');

        const toastMessageContent = document.createElement('span');
        toastMessageContent.setAttribute('class', 'toaster__message--content');
        toastMessageContent.textContent = message;

        toastMessageContainer.appendChild(toastMessageContent);

        const toasterContainer = document.getElementById('toaster-container');

        toasterContainer.appendChild(toastMessageContainer);

        if (removeAfterSeconds) {
            this.autoRemoveToast(successToastId, removeAfterSeconds);
        }
    }

    autoRemoveToast(successToastId, removeAfterSeconds) {
        setTimeout(() => {
            document.getElementById(successToastId).remove();
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