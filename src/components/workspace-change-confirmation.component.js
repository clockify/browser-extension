import * as React from 'react';

class WorkspaceChangeConfirmation extends React.Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	confirm() {
		this.props.confirmed();
	}

	cancel() {
		this.props.canceled();
	}

	render() {
		let txt = `To access ${this.props.workspaceName} workspace, you will have to log in again ?`;
		let cancelMsg = 'Cancel';

		return (
			<div className="workspace-change-confirmation-dialog-open">
				<div className="workspace-change-confirmation-dialog">
					<span className="workspace-change-confirmation-dialog__question">
						{txt}
					</span>
					<span
						onClick={this.confirm.bind(this)}
						className="workspace-change-confirmation-dialog__confirmation_button"
					>
						Log out
					</span>

					<span
						onClick={this.cancel.bind(this)}
						className="workspace-change-confirmation-dialog__cancel"
					>
						{cancelMsg}
					</span>
				</div>
			</div>
		);
	}
}

export default WorkspaceChangeConfirmation;
