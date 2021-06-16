import * as React from 'react';
import {WorkspaceService} from "../services/workspace-service";
import {LocalStorageService} from "../services/localStorage-service";

const workspaceService = new WorkspaceService();
const localStorageService = new LocalStorageService();

class WorkspaceList  extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            workspaces: [],
            isOpen: false,
            selectedWorkspace: null,
            previousWorkspace: null,
            isSubDomain: !!localStorageService.get('subDomainName')
        }
    }

    componentDidMount() {
        this.getWorkspaces();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.previousWorkspace) {
            if (this.props.revert && 
                this.props.revert != prevProps.revert && 
                prevState.previousWorkspace.id != prevState.selectedWorkspace.id
            ) {
                this.setState({
                    selectedWorkspace: prevState.previousWorkspace
                }, () => {
                    const {id, name} = this.state.selectedWorkspace
                    this.props.selectWorkspace(id, name);
                })
            }
        }
    }
        

    getWorkspaces() {
        workspaceService.getWorkspacesOfUser()
            .then(response => {
                let data = response.data;
                let selectedWorkspace = data.filter(workspace => workspace.id === localStorage.getItem('activeWorkspaceId'))[0];
                this.setState({
                    workspaces: data,
                    selectedWorkspace: selectedWorkspace,
                    previousWorkspace: selectedWorkspace
                })
                this.props.onSetWorkspace(selectedWorkspace.id)
            })
            .catch(() => {
            });
    }

    toggleWorkspaceList() {
        if (this.state.isSubDomain) {
            return;
        }

        this.setState({
            isOpen: !this.state.isOpen
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
            previousWorkspace: this.state.selectedWorkspace,
            selectedWorkspace: workspace,
            isOpen: false
        }, () => {
            this.props.selectWorkspace(workspace.id, workspace.name);
        })
    }

    

    render() {
        if(this.state.selectedWorkspace === null) {
            return null;
        } else {
            return(
                <div className="workspace-list">
                    <div className="workspace-list-title">Workspace</div>
                    <div className={this.state.isSubDomain ?
                            "workspace-list-selection list-disabled" : "workspace-list-selection"}
                         onClick={this.toggleWorkspaceList.bind(this)}>
                        <span className="workspace-list-default"
                              title={this.state.selectedWorkspace.name}>
                            {this.state.selectedWorkspace.name}
                        </span>
                        <span className={this.state.isOpen ? 'tag-list-arrow-up' : 'tag-list-arrow'} ></span>
                    </div>
                    <div className={this.state.isOpen ? "workspace-list-dropdown" : "disabled"}>
                        {this.state.workspaces.map(workspace => {
                            return(
                                <div key={workspace.id} className="workspace-list-item">
                                    <span className="workspace-list-item--name"
                                          value={JSON.stringify(workspace)}
                                          title={workspace.name}
                                          onClick={this.selectWorkspace.bind(this)}>
                                        {workspace.name}
                                    </span>
                                    <span className={workspace.id ===
                                            localStorage.getItem('activeWorkspaceId') ?
                                               "workspace-list-active__img" : "disabled"}>
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )
        }
    }
}

export default WorkspaceList;