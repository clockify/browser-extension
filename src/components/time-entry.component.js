import * as React from 'react';
import EditForm from './edit-form.component';
import * as ReactDOM from 'react-dom';
import {isOffline} from "./check-connection";
import Login from "./login.component";
import {offlineStorage} from '../helpers/offlineStorage';
import locales from "../helpers/locales";
import {duration} from "moment";
import 'moment-duration-format';
import {toDecimalFormat} from "../helpers/time.helper";
import TimeEntryDropdown from './time-entry-dropdown.component';
import DeleteEntryConfirmationComponent from './delete-entry-confirmation.component';
import {TimeEntryService} from "../services/timeEntry-service";
import HomePage from './home-page.component';
import Toaster from "./toaster-component";

const timeEntryService = new TimeEntryService();
class TimeEntry extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            ready: false,
            title: '',
            tagTitle: '',
            showGroup: false,
            entryDropdownShown: false,
            askToDeleteEntry: false,
        }
        this.createTitle = this.createTitle.bind(this);
        this.setAsyncStateItems = this.setAsyncStateItems.bind(this);
        this.handleGroupClick = this.handleGroupClick.bind(this);
        this.toggleEntryDropdownMenu = this.toggleEntryDropdownMenu.bind(this);
        this.toggleDeleteConfirmationModal = this.toggleDeleteConfirmationModal.bind(this);
        this.deleteEntry = this.deleteEntry.bind(this);
        this.offlineDeleteEntry = this.offlineDeleteEntry.bind(this);
        this.onClickDeleteEntries = this.onClickDeleteEntries.bind(this);
        this.onClickDuplicateEntry = this.onClickDuplicateEntry.bind(this);
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

    toggleEntryDropdownMenu(e){
        e && e.stopPropagation();
        if(this.props.timeEntry.approvalRequestId == null && (!this.props.timeEntry.isLocked || this.props.isUserOwnerOrAdmin)){
            this.setState({entryDropdownShown: !this.state.entryDropdownShown})
        }
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

    toggleDeleteConfirmationModal(e){
        e && e.stopPropagation();
        this.setState({askToDeleteEntry: !this.state.askToDeleteEntry});
    }

    onClickDuplicateEntry(e){
        e.stopPropagation();
        this.toggleEntryDropdownMenu();
        timeEntryService.duplicateTimeEntry(this.props.timeEntry.id)
        .then(() => {this.props.handleRefresh()})
        .catch((error) => {
            this.toaster.toast('error', locales.replaceLabels(error.response.data.message), 2);
        });
    }

    onClickDeleteEntries(){
        this.toggleEntryDropdownMenu();
        if(this.props.groupedEntries?.length > 0){
            this.deleteMultipleEntries(this.props.groupedEntries.map(entry => entry.id));
        }else{
            this.deleteEntry(this.props.timeEntry.id);
        }
    }

    async deleteEntry(entryId) {
        if(await isOffline()) {
            this.offlineDeleteEntry(entryId)
        } else {
            timeEntryService.deleteTimeEntry(entryId)
                .then(response => {
                    this.toggleDeleteConfirmationModal();
                    this.props.handleRefresh();
                })
                .catch(() => {
                })
        }
    }

    async deleteMultipleEntries(entryIds){
        if(await isOffline()){
            entryIds.forEach(entry => this.offlineDeleteEntry(entry));
        }else{
            timeEntryService.deleteMultipleTimeEntries(entryIds).then(response => {
                this.toggleDeleteConfirmationModal();
                this.props.handleRefresh()
            }).catch(() => {});
        }
    }

    offlineDeleteEntry(entryId){
        let timeEntries = offlineStorage.timeEntriesOffline;
        if(timeEntries.findIndex(entry => entry.id === entryId) > -1) {
            timeEntries.splice( timeEntries.findIndex(entry => entry.id === entryId), 1);
        }
        offlineStorage.timeEntriesOffline = timeEntries;
        this.toggleDeleteConfirmationModal();
        this.props.handleRefresh();
    }

    async goBack() {
        ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
        ReactDOM.render(<HomePage />, document.getElementById('mount'));
    }

    render() {
        const { timeEntry, project, groupedEntries } = this.props;
        if (project !== undefined && this.props.task !== undefined) {
            if (this.state.ready) {
                let entryDuration = timeEntry.duration;
                const decimalFormat = this.props.workspaceSettings?.decimalFormat;
                if(!!groupedEntries?.length){
                    entryDuration = groupedEntries.reduce((prev, curr) => duration(prev + duration(curr.timeInterval.duration)), duration(0));
                    entryDuration = decimalFormat ? toDecimalFormat(entryDuration) : entryDuration.format(
                        this.props.workspaceSettings?.trackTimeDownToSecond ? 'HH:mm:ss' : 'h:mm', {trim: false}
                    );
                }
                const entryClassNames = [];
                if ((timeEntry.isLocked && !this.props.isUserOwnerOrAdmin) || timeEntry.approvalRequestId) {
                    entryClassNames.push('time-entry time-entry-locked');
                } else {
                    entryClassNames.push('time-entry');
                }
                if (this.props.collapsedEntry) {
                    entryClassNames.push('time-entry--collapsed');
                }
                if(this.state.entryDropdownShown){
                    entryClassNames.push('time-entry--focused');
                }
                
                return (
                    <React.Fragment>
                    <Toaster
                        ref={instance => {this.toaster = instance}}
                    />
                    <div>
                        <div 
                            className={entryClassNames.join(' ')}
                            title={this.state.title}
                            key={timeEntry.id}
                            onClick={this.goToEdit.bind(this)}
                        >
                            {!!groupedEntries?.length && 
                                <div className="time-entry-group-number" onClick={this.handleGroupClick}>
                                    {groupedEntries.length}
                                </div>
                            }
                            <div className="time-entry-description">
                                <div className={timeEntry.description ? "description" : "no-description"}>
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
                                    <span className="time-entry-menu">
                                        <img onClick={(e) => this.toggleEntryDropdownMenu(e)} className="time-entry-menu__icon" src="./assets/images/menu-dots-vertical.svg"/>
                                        {
                                        this.state.entryDropdownShown 
                                            && <TimeEntryDropdown 
                                                    entry={timeEntry} 
                                                    group={groupedEntries}
                                                    onDelete={(e)=>this.toggleDeleteConfirmationModal(e)}
                                                    onDuplicate={(e) => this.onClickDuplicateEntry(e)}
                                                    toggleDropdown={this.toggleEntryDropdownMenu}
                                                    manualModeDisabled={this.props.manualModeDisabled}
                                                     
                                                />
                                        }
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
                                handleRefresh={this.props.handleRefresh}
                                manualModeDisabled={this.props.manualModeDisabled} 
                            />
                        )}
                    </div>
                    <DeleteEntryConfirmationComponent 
                        askToDeleteEntry={this.state.askToDeleteEntry}
                        canceled={this.toggleDeleteConfirmationModal}
                        confirmed={this.onClickDeleteEntries}
                        multiple={this.props.groupedEntries}
                    />
                    </React.Fragment>
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
