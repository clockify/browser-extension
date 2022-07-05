import React from 'react';
import Header from './header.component';
import Duration from './duration.component';
import moment from 'moment';
import {duration} from 'moment/moment';
import debounce from 'lodash.debounce';
import ProjectList from './project-list.component';
import TagsList from './tags-list.component';
import ReactDOM from 'react-dom';
import HomePage from './home-page.component';
import {isOffline} from "./check-connection";
// import {TimeEntryHelper} from "../helpers/timeEntry-helper";
import {TimeEntryService} from "../services/timeEntry-service";
import DeleteEntryConfirmationComponent from "./delete-entry-confirmation.component";
// import {LocalStorageService} from "../services/localStorage-service";
import Toaster from "./toaster-component";
import {DefaultProject} from '../helpers/storageUserWorkspace';
import { CustomFieldsContainer } from './customFields/customFields-Container';
import { offlineStorage, getWSCustomFields } from '../helpers/offlineStorage';
import locales from "../helpers/locales";
import Autocomplete from './autocomplete.component';

// const timeEntryHelper = new TimeEntryHelper();
const timeEntryService = new TimeEntryService();
// const localStorageService = new LocalStorageService();

class EditFormManual extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            timeEntry: this.props.timeEntry,
            ready: false,
            descRequired: false,
            projectRequired: false,
            taskRequired: false,
            tagsRequired: false,
            forceTasks: false,
            askToDeleteEntry: false,
            tags: this.props.timeEntry.tags ? this.props.timeEntry.tags : [],
            redrawCustomFields: 0,
            inProgress: null,
            workspaceSettings: null,
            autocompleteItems: []
        }

        this.notifyAboutError = this.notifyAboutError.bind(this);
        this.editProject = this.editProject.bind(this);
        this.editTask = this.editTask.bind(this);
        // this.onChangeProjectRedrawCustomFields = this.onChangeProjectRedrawCustomFields.bind(this);
        this.updateCustomFields = this.updateCustomFields.bind(this);
        this.setAsyncStateItems = this.setAsyncStateItems.bind(this);
        this.handleInputChange = debounce(this.handleInputChange.bind(this), 200);
    }

    async setAsyncStateItems() {
        const hideBillable = await offlineStorage.getHideBillable();
        const isUserOwnerOrAdmin = await offlineStorage.getIsUserOwnerOrAdmin();
        const inProgress = await localStorage.getItem('inProgress');
        const workspaceSettings = await localStorage.getItem('workspaceSettings');

        if(this.state.isUserOwnerOrAdmin !== isUserOwnerOrAdmin || 
           this.state.hideBillable !== hideBillable || 
           this.state.inProgress !== inProgress ||
           this.state.workspaceSettings !== workspaceSettings){
            this.setState({
                hideBillable,
                isUserOwnerOrAdmin,
                inProgress,
                workspaceSettings
            });
        }
    }

    componentDidUpdate() {
        this.setAsyncStateItems();
    }

    async componentDidMount(){
        this.setAsyncStateItems();

        timeEntryService.getRecentTimeEntries().then(res => {
            this.setState({
                autocompleteItemsRecent: res.data.map(entry => ({
                    project: {
                        clientName: entry.clientName,
                        color: entry.projectColor,
                        name: entry.projectName
                    },
                    task: {
                        name: entry.taskName,
                        id: entry.taskId
                    },
                    billable: entry.projectBillable,
                    ...entry
                }))
            });
        }).catch(err => console.log(err));
        const {timeEntry} = this.state;
        // react anti pattern
        timeEntry.timeInterval.duration =
            moment.duration(
                moment(timeEntry.timeInterval.end).diff(moment(timeEntry.timeInterval.start))
            );

        if (offlineStorage.userHasCustomFieldsFeature) {
            if (!(await isOffline())) {
                const { data, msg } = await getWSCustomFields();
                if (data)
                    offlineStorage.wsCustomFields = data;
                else
                    alert(msg);
            }


            if (!timeEntry.customFieldValues || this.props.afterCreateProject)
                timeEntry.customFieldValues = offlineStorage.customFieldValues; // generate from wsCustomFields
        }
        
        // if (await isOffline()) {
        //     if (offlineStorage.timeEntryInOffline) {
        //         console.log('ne bi smeo  offlineStorage.timeEntryInOffline', offlineStorage.timeEntryInOffline);
        //     }
            // offlineStorage.timeEntryInOffline = timeEntry;
        // }

        const { forceProjects, forceTasks  } = this.props.workspaceSettings;
        const {projectId, task} = timeEntry;
        const taskId = task ? task.id : null;
        // if (forceProjects && (!projectId || forceTasks && !taskId)) {
        if (!projectId || forceTasks && !taskId) {
            const {projectDB, taskDB} = await this.checkDefaultProjectTask(forceTasks);
            if (projectDB) {
                const entry = Object.assign(timeEntry, { 
                    projectId: projectDB.id,
                    project: projectDB,
                    task: taskDB,
                    taskId: taskDB ? taskDB.id: null,
                    billable: projectDB.billable
                });
                // if (isOffline()) {
                //     offlineStorage.timeEntryInOffline = entry;
                // }
                this.setState({
                    timeEntry: entry
                }, () => {
                    this.checkRequiredFields()
                });            
            }
            else {
                this.checkRequiredFields()
            }
        }
        else {
            this.setState({
                timeEntry
            }, () => {
                this.checkRequiredFields()
            });
        }
    }

    handleInputChange(inputValue) {
        if(!inputValue) return;
        timeEntryService.searchEntries(inputValue).then(res => {
            this.setState({
                autocompleteItems: res.data.map(entry => ({
                    project: {
                        clientName: entry.clientName,
                        color: entry.projectColor,
                        name: entry.projectName
                    },
                    task: {
                        name: entry.taskName,
                        id: entry.taskId
                    },
                    billable: entry.projectBillable,
                    ...entry
                }))
            });
        }).catch(err => console.log(err));
    }

    async updateCustomFields(customFields) {
        if (await isOffline()) {
            //let timeEntry = offlineStorage.timeEntryInOffline;
            let {timeEntry} = this.state;
            if (timeEntry.customFieldValues) {
                offlineStorage.updateCustomFieldValues(timeEntry, customFields);
            }
            else {
                console.log('Da li je moguce da timeEntryInOffline nema customFieldValues', timeEntry)
            }
            this.setState({
                timeEntry
            }, () => this.checkRequiredFields());
        } 
        else {
            const { timeEntry } = this.state;
            if (timeEntry) {
                offlineStorage.updateCustomFieldValues(timeEntry, customFields);
                this.setState({
                    timeEntry
                }, () => this.checkRequiredFields());
            }            
        }
    }

    // async onChangeProjectRedrawCustomFields() {
        // const { redrawCustomFields } = this.state;
        //const { customFieldValues } = timeEntry;
    //     if (await isOffline()) {
    //     }
    //     else {           
    //         this.setState({
    //             redrawCustomFields: redrawCustomFields + 1
    //         });
    //     }
    // }


    async checkDefaultProjectTask(forceTasks) {
        const { defaultProject } = await DefaultProject.getStorage();
        const lastEntry = this.props.timeEntries && this.props.timeEntries[0];

        if(defaultProject && defaultProject.enabled){
            const isLastUsedProject = defaultProject.project.id === 'lastUsedProject';
            const isLastUsedProjectWithoutTask = defaultProject.project.id === 'lastUsedProject' && !defaultProject.project.name.includes('task');
            if (!isLastUsedProject) {
                const { projectDB, taskDB, msg } = await defaultProject.getProjectTaskFromDB(forceTasks);
                if (msg) {
                    setTimeout(() => {
                        this.toaster.toast('info', msg, 5);
                    }, 2000)
                }
                return {projectDB, taskDB};
            } else {
                if (!lastEntry) {
                    setTimeout(() => {
                        this.toaster.toast('info', `${locales.DEFAULT_PROJECT_NOT_AVAILABLE} ${locales.YOU_CAN_SET_A_NEW_ONE_IN_SETTINGS}`, 5);
                    }, 2000)
                    return {projectDB: null, taskDB: null};
                }
                let { project, task } = lastEntry;
    
                if(isLastUsedProjectWithoutTask){
                    task = null;
                }
                
                return {projectDB: project, taskDB: task};
            }
        }
        return {projectDB: null, taskDB: null};
    }


    changeInterval(timeInterval) {
        let timeEntry = this.state.timeEntry;
        timeEntry.timeInterval = timeInterval;

        this.setState({
            timeEntry: timeEntry
        }, () => {
        });

    }

    changeDuration(newDuration){
        if (!newDuration || !this.state.timeEntry.timeInterval.end) {
            return;
        }

        let timeEntry = this.state.timeEntry;

        let end = moment(this.state.timeEntry.timeInterval.start)
            .add(parseInt(newDuration.split(':')[0]), 'hours')
            .add(parseInt(newDuration.split(':')[1]), 'minutes')
            .add(parseInt(newDuration.split(':')[2]), 'seconds');

        timeEntry.timeInterval.end = end;
        timeEntry.timeInterval.duration =
            duration(moment(this.state.timeEntry.timeInterval.end).diff(timeEntry.timeInterval.start));

        this.setState({
            timeEntry: timeEntry
        }, () => {
        });
    }

    setDescription(description) {
        if (description.length > 3000) {
            description = description.slice(0, 3000);
            this.toaster.toast('error', locales.DESCRIPTION_LIMIT_ERROR_MSG(3000), 2);
        }

        this.setState(state => ({
            timeEntry: {
                ...state.timeEntry,
                description
            }}
        ), () => this.checkRequiredFields());
    }

    async editProject(project) {
        const projectId = project && project.id && project.id !== 'no-project' ? project.id : null;

        if (await isOffline()) {
            let timeEntry = offlineStorage.timeEntryInOffline;
            if (timeEntry && timeEntry.id === this.state.timeEntry.id) {
                timeEntry.projectId = projectId;
                timeEntry.project = project;
                timeEntry.billable = project && project.billable ? project.billable : null;
                offlineStorage.timeEntryInOffline = timeEntry;
                this.setState({
                    timeEntry
                }, () => {
                    // this.projectList.mapSelectedProject()
                    this.checkRequiredFields()
                })
            } 
            else {
                let timeEntries = offlineStorage.timeEntriesOffline;
                timeEntries.map(timeEntry => {
                    if (timeEntry.id === this.state.timeEntry.id) {
                        timeEntry.projectId = projectId;
                        timeEntry.project = project;
                        timeEntry.billable = project && project.billable ? project.billable : null;
                        this.setState({
                            timeEntry
                        }, () => {
                            // this.projectList.mapSelectedProject()
                            this.checkRequiredFields()
                        })
                    }
                    return timeEntry;
                });
                offlineStorage.timeEntriesOffline = timeEntries;
            }
        }
        else {
            this.setState( state => ({
                timeEntry: {
                    ...state.timeEntry,
                    projectId,
                    billable: project && project.billable ? project.billable : null,
                    project,
                    task: null
                }
            }), () => {
                // this.projectList.mapSelectedProject()
                this.checkRequiredFields()
            });            
        }

    }

    editTask(task, project) {
        this.setState(state => ({
            timeEntry: {
                ...state.timeEntry, 
                projectId: project.id, 
                billable: project.billable,
                project, 
                task 
            }
        })
        , () => { 
            // this.projectList.mapSelectedProject();
            this.checkRequiredFields() ;
        });
    }


    editTags(tag) {
        let tagIds = this.state.tags ? this.state.tags.map(it => it.id) : [];
        let tagList = this.state.tags;
        let timeEntry = this.state.timeEntry;

        if(tagIds.includes(tag.id)) {
            tagIds.splice(tagIds.indexOf(tag.id), 1);
            tagList = tagList.filter(t => t.id !== tag.id)
        } else {
            tagIds.push(tag.id);
            tagList.push(tag)
        }

        timeEntry.tagIds = tagIds;

        this.setState({
            timeEntry: timeEntry,
            tags: tagList
        }, () => this.checkRequiredFields());
    }

    editBillable() {
        let timeEntry = this.state.timeEntry;
        timeEntry.billable = !this.state.timeEntry.billable;

        this.setState({
            timeEntry: timeEntry
        });
    }

    deleteEntry() {
        this.goBack();
        let timeEntries = offlineStorage.timeEntriesOffline;
        if(timeEntries.findIndex(entryOffline => entryOffline.id === this.state.timeEntry.id) > -1) {
            timeEntries.splice( timeEntries.findIndex(entry => entry.id === this.state.timeEntry.id), 1);
        }
        offlineStorage.timeEntriesOffline = timeEntries;
    }

    async checkRequiredFields() {
        let descRequired = false;
        let projectRequired = false;
        let taskRequired = false;
        let tagsRequired = false;
        let forceTasks = false;
        let workspaceSettings;

        const isOnline = !(await isOffline());

        if (typeof this.props.workspaceSettings.forceDescription !== "undefined") {
            workspaceSettings = this.props.workspaceSettings;
        } else {
            let workspaceSettings = await localStorage.getItem('workspaceSettings');
            workspaceSettings = workspaceSettings ?
                JSON.parse(workspaceSettings) : null
        }

        if (workspaceSettings) {
            if (workspaceSettings.forceDescription &&
                (!this.state.timeEntry.description || this.state.timeEntry.description === "")) {
                descRequired = true;
            }

            if (
                workspaceSettings.forceProjects &&
                !this.state.timeEntry.projectId &&
                isOnline
            ) {
                projectRequired = true;
            }

            forceTasks = workspaceSettings.forceTasks;
            if (
                workspaceSettings.forceTasks &&
                !this.state.timeEntry.task &&
                !this.state.timeEntry.taskId &&
                isOnline
            ) {
                taskRequired = true;
            }

            if (workspaceSettings.forceTags &&
                (!this.state.timeEntry.tags || !this.state.timeEntry.tags.length > 0) &&
                (!this.state.timeEntry.tagIds || !this.state.timeEntry.tagIds.length > 0) &&
                isOnline
            ) {
                tagsRequired = true;
            }
        }

        this.setState({
            descRequired,
            projectRequired,
            taskRequired,
            tagsRequired,
            forceTasks,
            ready: true
        });
    }

    async done() {
        if (
            this.state.descRequired ||
            this.state.projectRequired ||
            this.state.taskRequired ||
            this.state.tagsRequired
        ) {
            return;
        }
        
        if (await isOffline()) {
            const { workspaceId,
                description,
                timeInterval,
                projectId,
                task,
                tagIds,
                billable,
                customFieldValues } = this.state.timeEntry;
            let timeEntry = {
                workspaceId,
                id: offlineStorage.timeEntryIdTemp,
                description,
                billable,
                projectId,
                timeInterval: {
                    start: timeInterval.start,
                    end: timeInterval.end,
                    duration: duration(moment(timeInterval.end).diff(moment(timeInterval.start)))
                },
                customFieldValues: customFieldValues ? customFieldValues : null
            };
            let timeEntries = offlineStorage.timeEntriesOffline;
            timeEntries.push(timeEntry);
            offlineStorage.timeEntriesOffline = timeEntries;
            this.goBack();
        }
        else {
            if (this.state.descRequired || this.state.projectRequired || this.state.taskRequired || this.state.tagsRequired) {
                return;
            } else {
                const { timeEntry } = this.state;
                const { 
                    description,
                    timeInterval,
                    projectId,
                    task,
                    tagIds,
                    billable,
                    customFieldValues } = timeEntry;

                const cfs = customFieldValues && customFieldValues.length > 0
                    ? customFieldValues.filter(cf => cf.customFieldDto.status === 'VISIBLE').map(({type, customFieldId, value}) => ({ 
                        customFieldId,
                        sourceType: 'TIMEENTRY',
                        value: type === 'NUMBER' ? parseFloat(value) : value
                    }))
                    : [];
                timeEntryService.startNewEntry(
                    projectId,
                    description,
                    billable,
                    timeInterval.start,
                    timeInterval.end,
                    task ? task.id : null,
                    tagIds ? tagIds : [],
                    cfs
                ).then(response => {
                    let timeEntries = offlineStorage.timeEntriesOffline;
                    if(timeEntries.findIndex(entryOffline => entryOffline.id === this.state.timeEntry.id) > -1) {
                        timeEntries.splice( timeEntries.findIndex(entry => entry.id === this.state.timeEntry.id), 1);
                    }
                    offlineStorage.timeEntriesOffline = timeEntries;
                    this.goBack();
                })
                .catch(error => {
                    if (error.request.status === 403) {
                        const response = JSON.parse(error.request.response)
                        if (response.code === 4030) {
                            this.notifyAboutError(response.message, 'info', 10)
                        } 
                    }
                });
            }
        }
    }

    changeDate(date) {
        let getDate = new Date(date);
        let timeEntryStart = moment(this.state.timeEntry.timeInterval.start);
        let start = moment(getDate).hour(timeEntryStart.hour()).minutes(timeEntryStart.minutes()).seconds(timeEntryStart.seconds());

        let timeEntry = this.state.timeEntry;
        timeEntry.timeInterval = {
            start: start,
            end: moment(start).add(timeEntry.timeInterval.duration),
            duration: timeEntry.timeInterval.duration
        };
        this.setState({
            timeEntry: timeEntry
        }, () => {
        });
    }

    changeMode(mode) {
        this.props.changeMode(mode);
    }

    askToDeleteEntry() {
        this.setState({
            askToDeleteEntry: true
        });
    }

    cancelDeletingEntry() {
        this.setState({
            askToDeleteEntry: false
        });
    }

    async goBack() {
        ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
        ReactDOM.render(<HomePage />, document.getElementById('mount'));
    }

    notifyAboutError(message, type='error', n=2) {
        this.toaster.toast(type, message, n);
    }

    render(){
        if(!this.state.ready) {
            return null;
        } else {
            const { timeEntry } = this.state;
            //const hideBillable = offlineStorage.onlyAdminsCanChangeBillableStatus && !offlineStorage.isUserOwnerOrAdmin;
            
            return(
                <div>
                    <Header
                        backButton={true}
                        disableManual={this.state.inProgress}
                        disableAutomatic={false}
                        changeMode={this.changeMode.bind(this)}
                        workspaceSettings={JSON.parse(this.state.workspaceSettings)}
                        goBackTo={this.goBack.bind(this)}
                    />
                    <Toaster
                        ref={instance => {
                            this.toaster = instance
                        }}
                    />
                    <Duration
                        ref={instance => {
                            this.duration = instance;
                        }}
                        timeEntry={timeEntry}
                        changeInterval={this.changeInterval.bind(this)}
                        changeDuration={this.changeDuration.bind(this)}
                        changeDate={this.changeDate.bind(this)}
                        timeFormat={this.props.timeFormat}
                        isUserOwnerOrAdmin={this.state.isUserOwnerOrAdmin}
                        workspaceSettings={this.props.workspaceSettings}
                        userSettings={this.props.userSettings}
                        isFormManual={true}
                    />
                    <div className="edit-form">
                        <div className={this.state.descRequired ?
                            "description-textarea-required" : "description-textarea"}>
                            <Autocomplete
                                items={this.state.timeEntry.description?.length >= 2 ? this.state.autocompleteItems : this.state.autocompleteItemsRecent}
                                value={this.state.timeEntry.description}
                                onChange={e => {
                                    const {value} = e.target;
                                    
                                    this.setDescription(value);
                                    if(value.length >= 2){
                                        this.handleInputChange(value);
                                    } else {
                                        this.handleInputChange(null);
                                    }
                                }}
                                onSelect={(item) => {
                                    let selected = this.props.timeEntries.find(entry => entry.id === item.id);
                                    if(selected){
                                        this.setState(state => ({
                                            timeEntry: {
                                                ...state.timeEntry,
                                                ...selected,
                                                timeInterval: {...state.timeEntry.timeInterval},
                                                tagIds: selected.tags.map(el => el.id)
                                            },
                                            tags: selected.tags
                                        }), () => {
                                            // this.projectList.mapSelectedProject();
                                            this.checkRequiredFields();
                                            // this.onChangeProjectRedrawCustomFields();
                                        });
                                    }
                                }}
                                renderInput={(props) => (
                                    <textarea
                                        placeholder={this.state.descRequired ? `${locales.DESCRIPTION_LABEL} ${locales.REQUIRED_LABEL}` : locales.DESCRIPTION_LABEL}
                                        className={"edit-form-description"}
                                        type="text"
                                        {...props}
                                    />
                                )}
                            />
                        </div>
                        <div className="edit-form__project_list">
                            <ProjectList
                                // ref={instance => {
                                //     this.projectList = instance;
                                // }}
                                // selectedProject={timeEntry.project}
                                // selectedTask={timeEntry.task}
                                selectProject={this.editProject}
                                selectTask={this.editTask}
                                noTasks={false}
                                workspaceSettings={this.props.workspaceSettings}
                                isUserOwnerOrAdmin={this.state.isUserOwnerOrAdmin}
                                projectRequired={this.state.projectRequired}
                                taskRequired={this.state.taskRequired}
                                forceTasks={this.state.forceTasks}
                                timeEntry={timeEntry}
                                editForm={false}
                                userSettings={this.props.userSettings}
                                // onChangeProjectRedrawCustomFields={this.onChangeProjectRedrawCustomFields}
                            />
                        </div>
                        <TagsList
                            ref={instance => {
                                this.tagList = instance;
                            }}
                            tags={this.state.tags ? this.state.tags : []}
                            tagIds={timeEntry.tagIds ? this.state.tags.map(it => it.id) : []}
                            editTag={this.editTags.bind(this)}
                            tagsRequired={this.state.tagsRequired}
                            isUserOwnerOrAdmin={this.state.isUserOwnerOrAdmin}
                            workspaceSettings={this.props.workspaceSettings}
                            editForm={false}
                            errorMessage={this.notifyAboutError}
                        />
                        <div className="edit-form-buttons">
                            <div className={`edit-form-buttons__billable ${this.state.hideBillable?'disabled':''}`}>
                                <span className={timeEntry.billable ?
                                    "edit-form-checkbox checked" : "edit-form-checkbox"}
                                    onClick={this.editBillable.bind(this)}
                                    tabIndex={"0"} 
                                    onKeyDown={e => {if (e.key==='Enter') this.editBillable()}}
                                >
                                    <img src="./assets/images/checked.png"
                                         className={timeEntry.billable ?
                                             "edit-form-billable-img" : "edit-form-billable-img-hidden"}/>
                                </span>
                                <label onClick={this.editBillable.bind(this)}
                                       className="edit-form-billable">{locales.BILLABLE_LABEL}</label>
                            </div>
                            { offlineStorage.userHasCustomFieldsFeature &&
                                <CustomFieldsContainer
                                    key="customFieldsContainer"
                                    timeEntry={timeEntry}
                                    isUserOwnerOrAdmin={this.state.isUserOwnerOrAdmin}
                                    // redrawCustomFields={redrawCustomFields}
                                    manualMode={true}
                                    updateCustomFields={this.updateCustomFields}
                                />
                            }                            
                            <div className="edit-form-right-buttons">
                                <button onClick={this.done.bind(this)}
                                        className={
                                            this.state.descRequired || this.state.projectRequired ||
                                            this.state.taskRequired || this.state.tagsRequired ?
                                                "edit-form-done-disabled" : "edit-form-done"}>{locales.OK_BTN}</button>
                                <div className="edit-form-right-buttons__back_and_delete">
                                    <span onClick={this.askToDeleteEntry.bind(this)}
                                          className="edit-form-delete">{locales.DELETE}</span>
                                </div>
                                <DeleteEntryConfirmationComponent askToDeleteEntry={this.state.askToDeleteEntry}
                                                                  canceled={this.cancelDeletingEntry.bind(this)}
                                                                  confirmed={this.deleteEntry.bind(this)}/>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    }
}

export default EditFormManual;
