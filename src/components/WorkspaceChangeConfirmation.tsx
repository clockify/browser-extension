import * as React from 'react';

interface PropsInterface {
	confirmed: VoidFunction;
	canceled: VoidFunction;
	workspaceName: string;
}

export const WorkspaceChangeConfirmation = (props: PropsInterface): React.JSX.Element => {
	const text = `To access ${props.workspaceName} workspace, you will have to log in again ?`;
	const cancelMsg = 'Cancel';

	return (
		<div className="workspace-change-confirmation-dialog-open">
			<div className="workspace-change-confirmation-dialog">
				<span className="workspace-change-confirmation-dialog__question">
					{text}
				</span>
				<span
					onClick={props.confirmed}
					className="workspace-change-confirmation-dialog__confirmation_button"
				>
					Log out
				</span>

				<span
					onClick={props.canceled}
					className="workspace-change-confirmation-dialog__cancel"
				>
					{cancelMsg}
				</span>
			</div>
		</div>
	);
};