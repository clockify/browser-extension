import * as React from 'react';
import locales from '../helpers/locales';

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
							{this.props.multiple?.length > 1
								? locales.DELETE_MULTIPLE_ENTRIES(this.props.multiple.length)
								: locales.ARE_YOU_SURE_DELETE}
						</span>
						<span
							onClick={this.confirm.bind(this)}
							className="delete-entry-confirmation-dialog__confirmation_button"
						>
							{locales.DELETE}
						</span>
						<span
							onClick={this.cancel.bind(this)}
							className="delete-entry-confirmation-dialog__cancel"
						>
							{locales.CANCEL}
						</span>
					</div>
				</div>
			);
		} else {
			return null;
		}
	}
}

export default DeleteEntryConfirmationComponent;
