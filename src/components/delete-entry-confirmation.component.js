import * as React from "react";

class DeleteEntryConfirmationComponent extends React.Component {

    constructor(props) {
        super(props);

        this.state = {};
    }

    confirm() {
        this.props.confirmed(true);
    }

    cancel() {
        this.props.canceled(false);
    }

    render() {
        if (this.props.askToDeleteEntry) {
            return (
                <div className="delete-entry-confirmation-dialog-open">
                    <div className="delete-entry-confirmation-dialog">
                        <span className="delete-entry-confirmation-dialog__question">
                            Are you sure you want to delete entry?
                        </span>
                        <span onClick={this.confirm.bind(this)}
                              className="delete-entry-confirmation-dialog__confirmation_button">Delete</span>
                        <span onClick={this.cancel.bind(this)}
                              className="delete-entry-confirmation-dialog__cancel">Cancel</span>
                    </div>
                </div>
            );
        } else {
            return null;
        }
    }
}

export default DeleteEntryConfirmationComponent;