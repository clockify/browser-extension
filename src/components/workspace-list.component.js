import * as React from 'react';
import {WorkspaceService} from "../services/workspace-service";

const workspaceService = new WorkspaceService();

class WorkspaceList  extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            workspaces: [],
            isOpen: false,
            selectedWorkspace: null
        }
    }

    componentDidMount() {
        this.getWorkspaces();
    }

    getWorkspaces() {
        workspaceService.getWorkspacesOfUser()
            .then(response => {
                let data = response.data;
                let selectedWorkspace = data.filter(workspace => workspace.id === localStorage.getItem('activeWorkspaceId'))[0];
                this.setState({
                    workspaces: data,
                    selectedWorkspace: selectedWorkspace
                })
            })
            .catch(() => {
            });
    }

    openWorkspaceList() {
        this.setState({
            isOpen: true
        })
    }

    closeWorkspaceList() {
        this.setState({
            isOpen: false
        })
    }

    selectWorkspace(event) {
        let workspace = JSON.parse(event.target.getAttribute('value'));
        this.setState({
            selectedWorkspace: workspace,
            isOpen: false
        }, () => {
            this.props.selectWorkspace(workspace.id);
        })
    }

    render() {
        if(this.state.selectedWorkspace === null) {
            return null;
        } else {
            return(
                <div className="workspace-list">
                    <div className="workspace-list-title">Workspace</div>
                    <div className="workspace-list-selection" onClick={this.openWorkspaceList.bind(this)}>
                        <span className="workspace-list-default"
                              title={this.state.selectedWorkspace.name}>
                            {this.state.selectedWorkspace.name}
                        </span>
                        <span className="tag-list-arrow"></span>
                    </div>
                    <div className={this.state.isOpen ? "workspace-list-open" : "disabled"}>
                        <div onClick={this.closeWorkspaceList.bind(this)} className="invisible"></div>
                        <div className="workspace-list-dropdown">
                            <div className="workspace-list-title">Workspaces</div>
                            {this.state.workspaces.map(workspace => {
                                return(
                                    <div className="workspace-list-item">
                                        <span className="workspace-list-item--name"
                                              value={JSON.stringify(workspace)}
                                              title={workspace.name}
                                              onClick={this.selectWorkspace.bind(this)}>
                                            {workspace.name}
                                        </span>
                                        <span value={JSON.stringify(workspace)}
                                              className={workspace.id ===
                                                localStorage.getItem('activeWorkspaceId') ?
                                                   "workspace-list-active" : "disabled"}>
                                            <span className="workspace-list-active__img"></span>
                                            <label>ACTIVE</label>
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )
        }
    }
}

export default WorkspaceList;