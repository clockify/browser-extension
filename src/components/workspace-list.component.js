import * as React from 'react';

import locales from '../helpers/locales';

// const workspaceService = new WorkspaceService();

class WorkspaceList extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			// workspaces: [],
			isOpen: false,
			// selectedWorkspace: null,
			// previousWorkspace: null,
			isSubDomain: null,
		};
		this.setAsyncStateItems = this.setAsyncStateItems.bind(this);
		this.selectWorkspace = this.selectWorkspace.bind(this);
	}

	componentDidMount() {
		// this.getWorkspaces();
		this.setAsyncStateItems();
	}

	async setAsyncStateItems() {
		const subDomainName = !!(await localStorage.getItem('subDomainName'));
		this.setState({
			subDomainName,
		});
	}

	componentDidUpdate(prevProps) {
		if (prevProps.previousWorkspace) {
			if (
				this.props.revert &&
				this.props.revert != prevProps.revert &&
				prevProps.previousWorkspace.id != prevProps.selectedWorkspace.id
			) {
				this.props.selectWorkspace(prevProps.previousWorkspace);
			}
		}
	}

	// getWorkspaces() {
	//     workspaceService.getWorkspacesOfUser()
	//         .then(async response => {
	//             let data = response.data;
	//             const activeWorkspaceId = await localStorage.getItem('activeWorkspaceId');
	//             let selectedWorkspace = data.filter(workspace => workspace.id === activeWorkspaceId)[0];
	//             this.setState({
	//                 workspaces: data,
	//                 selectedWorkspace: selectedWorkspace,
	//                 previousWorkspace: selectedWorkspace
	//             })
	//             this.props.onSetWorkspace(selectedWorkspace.id)
	//         })
	//         .catch(() => {
	//         });
	// }

	toggleWorkspaceList(e) {
		e.preventDefault();
		if (this.state.isSubDomain) {
			return;
		}

		this.setState({
			isOpen: !this.state.isOpen,
		});
	}

	closeWorkspaceList() {
		this.setState({
			isOpen: false,
		});
	}

	selectWorkspace(workspace) {
		workspace = JSON.parse(workspace);
		this.setState(
			{
				isOpen: false,
			},
			() => {
				if (workspace.id !== this.props.selectedWorkspace.id) {
					this.props.selectWorkspace(workspace);
				}
			}
		);
	}

	render() {
		if (!this.props.selectedWorkspace) {
			return null;
		} else {
			return (
				<div className="workspace-list">
					<div className="workspace-list-title">{locales.WORKSPACE}</div>
					<div
						className={
							this.state.isSubDomain
								? 'workspace-list-selection list-disabled'
								: 'workspace-list-selection'
						}
						onClick={this.toggleWorkspaceList.bind(this)}
					>
						<span
							className="workspace-list-default"
							title={this.props.selectedWorkspace.name}
						>
							{this.props.selectedWorkspace.name}
						</span>
						<span
							className={
								this.state.isOpen ? 'tag-list-arrow-up' : 'tag-list-arrow'
							}
						></span>
					</div>
					<div
						className={
							this.state.isOpen ? 'workspace-list-dropdown' : 'disabled'
						}
					>
						{this.props.workspaces
							.filter(
								(ws) =>
									!this.props.selectedWorkspace.onSubdomain || ws.onSubdomain
							)
							.map((workspace, index) => {
								return (
									<div
										key={workspace.id}
										className={`workspace-list-item${
											!workspace.accessEnabled
												? ' workspace-list-item--disabled'
												: ''
										}`}
										title={
											workspace.accessEnabled
												? workspace.name
												: workspace.reason
											  ? workspace.reason
												:	locales.WORKSPACE__DISABLED_TOOLTIP
										}
										data-pw={`workspace-list-item-${index}`}
									>
										<span
											className="workspace-list-item__name"
											onClick={() =>
												workspace.accessEnabled &&
												this.selectWorkspace(JSON.stringify(workspace))
											}
										>
											{workspace.name}
										</span>
										<span
											className={
												workspace.id === this.props.selectedWorkspace.id
													? 'workspace-list-active__img'
													: 'disabled'
											}
										></span>
									</div>
								);
							})}
					</div>
				</div>
			);
		}
	}
}

export default WorkspaceList;
