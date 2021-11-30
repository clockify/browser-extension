import * as React from 'react';
import EditForm from './edit-form.component';
import * as ReactDOM from 'react-dom';
import {isOffline} from "./check-connection";
import Login from "./login.component";
import {offlineStorage} from '../helpers/offlineStorage';

class TimeEntry extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            ready: false,
            title: '',
            tagTitle: ''
        }
        this.createTitle = this.createTitle.bind(this);
    }

    componentDidMount() {
        const { project } = this.props;
        if (project !== undefined && this.props.task !== undefined) {
            this.createTitle();
        }
    }

    goToEdit() {
        if((!this.props.timeEntry.isLocked || this.props.isUserOwnerOrAdmin) && this.props.timeEntry.approvalRequestId == null) {
            ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
            if (isOffline()) {
                ReactDOM.render(<Login/>, document.getElementById('mount'));
            }
            ReactDOM.render(
                <EditForm changeMode={this.changeMode.bind(this)}
                          timeEntry={this.props.timeEntry}
                          workspaceSettings={this.props.workspaceSettings}
                          timeFormat={this.props.timeFormat}
                          userSettings={this.props.userSettings}
                />, document.getElementById('mount')
            );
        }
    }

    continueTimeEntry(e) {
        e.stopPropagation();
        this.props.playTimeEntry(this.props.timeEntry);
    }

    createTitle() {
        let title = "";
        let tagTitle = "";

        if (this.props.timeEntry.description) {
            title = "Description: " + this.props.timeEntry.description;
        }

        if (this.props.project) {
            if (this.props.project.name) {
                title = title + "\nProject: " + this.props.project.name;
            }

            if (this.props.task && this.props.task.name) {
                title = title + "\nTask: " + this.props.task.name;
            }

            if (this.props.project.client && this.props.project.client.name) {
                title = title + "\nClient: " + this.props.project.client.name;
            }
        }

        const {tags} = this.props.timeEntry;
        if (tags && tags.length > 0) {
            tagTitle = (tags.length > 1 ? 'Tags:\n' : "Tag: ") + tags.map(tag=>tag.name).join('\n')    
        }

        this.setState({
            title: title,
            tagTitle: tagTitle
        }, () => {
            this.setState({
                ready: true
            })
        });
    }

    changeMode(mode) {
        this.props.changeMode(mode);
    }

    render() {
        //const hideBillable = offlineStorage.onlyAdminsCanChangeBillableStatus && !offlineStorage.isUserOwnerOrAdmin;
        //console.log('offlineStorage.onlyAdminsCanChangeBillableStatus', offlineStorage.onlyAdminsCanChangeBillableStatus)
        //console.log('offlineStorage.activeBillableHours', offlineStorage.activeBillableHours)
        //console.log('offlineStorage.isUserOwnerOrAdmin', offlineStorage.isUserOwnerOrAdmin)
        console.log('offlineStorage.hideBillable', offlineStorage.hideBillable)
        const { timeEntry, project } = this.props;
        if (project !== undefined && this.props.task !== undefined) {
            if (this.state.ready) {
                return (
                    <div className={((timeEntry.isLocked && !this.props.isUserOwnerOrAdmin) || timeEntry.approvalRequestId) ? "time-entry-locked" : "time-entry"}
                         title={this.state.title}
                         key={timeEntry.id}
                         onClick={this.goToEdit.bind(this)}
                    >
                        <div className="time-entry-description">
                            <div className={timeEntry.description ? "description" : "no-description"}>
                                {timeEntry.description ? timeEntry.description : "(no description)"}
                            </div>
                            <div style={project ? {color: project.color} : {}}
                                 className={project ? "time-entry-project" : "disabled"}>
                                <div className="time-entry__project-wrapper">
                                    <div style={project ? {background: project.color} : {}} className="dot"></div>
                                    <span className="time-entry__project-name" >{project ? project.name : ""}</span>
                                </div>
                                <span className="time-entry__task-name">
                                    {this.props.task ? " - " + this.props.task.name : ""}
                                </span>
                            </div>
                        </div>
                        <div className="time-entry__right-side">
                            <div className="time-entry__right-side__tag_billable_and_lock"
                                 onClick={this.goToEdit.bind(this)}>
                                <span title={this.state.tagTitle} className={timeEntry.tags && timeEntry.tags.length > 0 ?
                                    "time-entry__right-side__tag" : "disabled"}></span>
                                <span className={timeEntry.billable && !offlineStorage.hideBillable
                                     ? "time-entry__right-side__billable"
                                     : "disabled"}></span>
                                <span className={timeEntry.approvalRequestId ?
                                    "time-entry__right-side__approved" : "disabled"}>
                                    <img src="./assets/images/approved.png"/>
                                </span>
                                <span className={timeEntry.isLocked && !this.props.isUserOwnerOrAdmin && !timeEntry.approvalRequestId ?
                                    "time-entry__right-side__lock" : "disabled"}>
                                    <img src="./assets/images/lock-indicator.png"/>
                                </span>
                            </div>
                            <div className="time-entry__right-side__lock_and_play">
                                <span className="time-entry__right-side--duration">
                                    {timeEntry.duration}
                                </span>
                                <span onClick={this.continueTimeEntry.bind(this)}
                                      className="time-entry-arrow">
                                    <img id="play-icon" src="./assets/images/play-normal.png"/>
                                </span>
                            </div>
                        </div>
                    </div>
                )
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

}
export default TimeEntry;
