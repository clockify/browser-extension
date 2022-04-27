import * as React from 'react';
// import {WorkspaceService} from "../services/workspace-service";
import {LocalStorageService} from "../services/localStorage-service";
import locales from '../helpers/locales';

// const workspaceService = new WorkspaceService();
const localStorageService = new LocalStorageService();

class WorkspaceList  extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            // workspaces: [],
            isOpen: false,
            // selectedWorkspace: null,
            // previousWorkspace: null,
            isSubDomain: null
        }
        this.setAsyncStateItems = this.setAsyncStateItems.bind(this);
    }

    componentDidMount() {
        // this.getWorkspaces();
        this.setAsyncStateItems();
    }

    async setAsyncStateItems() {
        const subDomainName = !!(await localStorageService.get('subDomainName'));
        this.setState({
            subDomainName
        });
    }

    componentDidUpdate(prevProps) {
        if (prevProps.previousWorkspace) {
            if (this.props.revert && 
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
            isOpen: false
        }, () => {
            this.props.selectWorkspace(workspace);
        })
    }

    render() {
        if(!this.props.selectedWorkspace) {
            return null;
        } else {
            return(
                <div className="workspace-list">
                    <div className="workspace-list-title">{locales.WORKSPACE}</div>
                    <div className={this.state.isSubDomain ?
                            "workspace-list-selection list-disabled" : "workspace-list-selection"}
                         onClick={this.toggleWorkspaceList.bind(this)}>
                        <span className="workspace-list-default"
                              title={this.props.selectedWorkspace.name}>
                            {this.props.selectedWorkspace.name}
                        </span>
                        <span className={this.state.isOpen ? 'tag-list-arrow-up' : 'tag-list-arrow'} ></span>
                    </div>
                    <div className={this.state.isOpen ? "workspace-list-dropdown" : "disabled"}>
                        {this.props.workspaces.map(workspace => {
                            return(
                                <div key={workspace.id} className="workspace-list-item">
                                    <span className="workspace-list-item--name"
                                          value={JSON.stringify(workspace)}
                                          title={workspace.name}
                                          onClick={this.selectWorkspace.bind(this)}>
                                        {workspace.name}
                                    </span>
                                    <span className={workspace.id ===
                                            this.props.selectedWorkspace.id ?
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