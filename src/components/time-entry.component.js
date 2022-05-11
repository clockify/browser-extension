import * as React from 'react';
import EditForm from './edit-form.component';
import * as ReactDOM from 'react-dom';
import {isOffline} from "./check-connection";
import Login from "./login.component";
import {offlineStorage} from '../helpers/offlineStorage';
import locales from "../helpers/locales";
import {duration} from "moment";
import 'moment-duration-format';

class TimeEntry extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            ready: false,
            title: '',
            tagTitle: '',
            showGroup: false
        }
        this.createTitle = this.createTitle.bind(this);
        this.setAsyncStateItems = this.setAsyncStateItems.bind(this);
        this.handleGroupClick = this.handleGroupClick.bind(this);
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
        if(!this.props.groupedEntries?.length && (!this.props.timeEntry.isLocked || this.props.isUserOwnerOrAdmin) && this.props.timeEntry.approvalRequestId == null) {
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

    handleGroupClick(e) {
        e.stopPropagation();
        this.setState(state => ({
            showGroup: !state.showGroup
        }));
    }

    render() {
        const { timeEntry, project, groupedEntries } = this.props;
        if (project !== undefined && this.props.task !== undefined) {
            if (this.state.ready) {
                let entryDuration = timeEntry.duration;
                if(!!groupedEntries?.length){
                    entryDuration = groupedEntries.reduce((prev, curr) => duration(prev + duration(curr.timeInterval.duration)), duration(0)).format(
                        this.props.workspaceSettings?.trackTimeDownToSecond ? 'HH:mm:ss' : 'h:mm', {trim: false}
                    );
                }
                return (
                    <div>
                        <div className={((timeEntry.isLocked && !this.props.isUserOwnerOrAdmin) || timeEntry.approvalRequestId) ? "time-entry-locked" : "time-entry"}
                            title={this.state.title}
                            key={timeEntry.id}
                            style={{
                                backgroundColor: this.props.collapsedEntry ? '#f6fcff' : 'white'
                            }}
                            onClick={this.goToEdit.bind(this)}
                        >
                            {!!groupedEntries?.length && 
                                <div className="time-entry-group-number" onClick={this.handleGroupClick}>
                                    {groupedEntries.length}
                                </div>
                            }
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
                                        {entryDuration}
                                    </span>
                                    <span onClick={this.continueTimeEntry.bind(this)}
                                        className="time-entry-arrow">
                                        <img id="play-icon" src="./assets/images/play-normal.png"/>
                                    </span>
                                </div>
                            </div>
                        </div>
                        {this.state.showGroup && groupedEntries?.map(entry => 
                            <TimeEntry
                                key={entry.id}
                                timeEntry={entry}
                                project={entry.project ? entry.project : null}
                                task={entry.task ? entry.task : null}
                                playTimeEntry={this.props.playTimeEntry}
                                changeMode={this.props.changeMode}
                                timeFormat={this.props.timeFormat}
                                workspaceSettings={this.props.workspaceSettings}
                                features={this.props.features}
                                isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
                                userSettings={this.props.userSettings}
                                collapsedEntry={true}
                            />
                        )}
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
