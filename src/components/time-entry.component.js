import * as React from 'react';
import EditForm from './edit-form.component';
import * as ReactDOM from 'react-dom';
import {isOffline} from "./check-connection";
import Login from "./login.component";
import {offlineStorage} from '../helpers/offlineStorage';
import locales from "../helpers/locales";

class TimeEntry extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            ready: false,
            title: '',
            tagTitle: ''
        }
        this.createTitle = this.createTitle.bind(this);
        this.setAsyncStateItems = this.setAsyncStateItems.bind(this);
    }

    async setAsyncStateItems() {
        const hideBillable = await offlineStorage.getHideBillable();
        if(hideBillable !== this.state.hideBillable){
            this.setState({
                hideBillable
            });
        }
    }

    componentDidUpdate() {
        this.setAsyncStateItems();
    }

    componentDidMount() {
        const { project } = this.props;
        if (project !== undefined && this.props.task !== undefined) {
            this.createTitle();
        }
    }

    async goToEdit() {
        if((!this.props.timeEntry.isLocked || this.props.isUserOwnerOrAdmin) && this.props.timeEntry.approvalRequestId == null) {
            ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
            if (await isOffline()) {
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
            title = locales.DESCRIPTION_LABEL + ": " + this.props.timeEntry.description;
        }

        if (this.props.project) {
            if (this.props.project.name) {
                title = title + (title ? "\n" : "" + `${locales.PROJECT}: `) + this.props.project.name;
            }

            if (this.props.task && this.props.task.name) {
                title = title + `\n${locales.TASK}: ` + this.props.task.name;
            }

            if (this.props.project.clientName) {
                title = title + `\n${locales.CLIENT}: ` + this.props.project.clientName;
            }
        }

        const {tags} = this.props.timeEntry;
        if (tags && tags.length > 0) {
            tagTitle = (tags.length > 1 ? `${locales.TAGS}:\n` : `${locales.TAG}: `) + tags.map(tag=>tag.name).join('\n')    
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
                            <div className={timeEntry.description ? "description" : locales.NO_DESCRIPTION}>
                                {timeEntry.description ? timeEntry.description : locales.NO_DESCRIPTION}
                            </div>
                            <div style={project ? {color: project.color} : {}}
                                 className={project ? "time-entry-project" : "disabled"}>
                                <div className="time-entry__project-wrapper">
                                    <div style={project ? {background: project.color} : {}} className="dot"></div>
                                    <span className="time-entry__project-name" >{project ? project.name : ""}{this.props.task ? ": " + this.props.task.name : ""}</span>
                                </div>
                                <span className="time-entry__client-name">
                                    {project && project.clientName ? " - " + project.clientName : ""}    
                                </span>
                            </div>
                        </div>
                        <div className="time-entry__right-side">
                            <div className="time-entry__right-side__tag_billable_and_lock"
                                 onClick={this.goToEdit.bind(this)}>
                                <span title={this.state.tagTitle} className={timeEntry.tags && timeEntry.tags.length > 0 ?
                                    "time-entry__right-side__tag" : "disabled"}></span>
                                <span className={timeEntry.billable && !this.state.hideBillable
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
