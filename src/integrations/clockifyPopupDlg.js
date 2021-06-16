var _clockifyProjectList;
var _clockifyTagList;
var _button;

var ClockifyEditForm = class {
    constructor(timeEntryInProgress) {
        this.state = {
            timeEntry: timeEntryInProgress,
            descRequired: false,
            projectRequired: false,
            taskRequired: false,
            tagsRequired: false,
            tags: timeEntryInProgress.tags ? timeEntryInProgress.tags : []
        }
        this.editFormElem = null;
    }    

    get isForceTasks() { return this.wsSettings.forceTasks }

    get isProjectRequired() { return this.state.projectRequired }
    get isTaskRequired() { return this.state.taskRequired }
    get isTagRequired() { return this.state.tagsRequired }

    get SelectedProject() { return this.state.timeEntry.project }
    get SelectedProjectId() { return this.state.timeEntry.projectId }
    get SelectedTask() { return this.state.timeEntry.task }
    get SelectedTaskId() { return this.state.timeEntry.taskId } // this.state.timeEntry.task ? this.state.timeEntry.task.id : null}

    setState(obj) {
        Object.assign(this.state, obj);
        // this.renderContent()
    }

    create(msg) {
        const { timeEntry } = this.state;

        this.checkRequiredFields();
        let doShaking = true;
        if (!timeEntry.projectId) {
            doShaking = false;
            this.checkForDefaultProjectTask()
                .then(() => {
                    this.shaking();
                });
        }

        const editForm = document.createElement('div');
        editForm.setAttribute("id", 'divClockifyEditForm');
        editForm.classList.add('clockify-edit-form');

        // stopTimer
        const stopTimer = this.createStopTimer();
        editForm.appendChild(stopTimer);

        // closeDlg
        const closeDlg = this.createCloseDlg()
        editForm.appendChild(closeDlg);

        //if (msg) {
            // const span = this.createMsg(msg);
            // editForm.appendChild(span);
        //}

        // desc
        const inputDesc = this.createDescription();
        editForm.appendChild(inputDesc);

        // project
        const divProjectDown = _clockifyProjectList.create(this.state.timeEntry, editForm);
        editForm.appendChild(divProjectDown);

        // tags
        const divTagDown = _clockifyTagList.create(this.state.timeEntry, editForm);
        editForm.appendChild(divTagDown);

        // Done buttons
        const doneButtons = this.createButtons();
        editForm.appendChild(doneButtons);

        this.editFormElem = editForm;

        if (doShaking)
            this.shaking();

        return editForm;
    }

    shaking() {
        const { descRequired, projectRequired, taskRequired, tagsRequired } = this.state;
        if (descRequired || projectRequired || taskRequired || tagsRequired) {
            if (descRequired)
                this.shakeDescription();
            if (projectRequired || taskRequired)
                _clockifyProjectList.shakeHeader(projectRequired, taskRequired);
            if (tagsRequired)
                _clockifyTagList.shakeHeader();
            return false;
        }
        return true;
    }

    canClose() {
        return this.shaking();
    }
    
    destroy() {
        this.editFormElem = null;
    }

    async checkForDefaultProjectTask() {
        const { timeEntry } = this.state;
        return new Promise(resolve => {
            try {
                aBrowser.runtime.sendMessage({
                    eventName: 'getDefaultProjectTask'
                }, ({projectDB, taskDB, msg, msgId}) => {
                    if (projectDB) {
                        this.checkRequiredFields();
                        //if (!timeEntry.projectId) {
                        this.setState({
                            timeEntry: Object.assign(this.state.timeEntry, {
                                projectId: projectDB.id,
                                billable: projectDB.billable,
                                taskId: taskDB ? taskDB.id : null
                            })
                        })
                        this.checkRequiredFields();
                        if (taskDB) {
                            _clockifyProjectList.selectTask(taskDB, projectDB);
                        }
                        else {
                            _clockifyProjectList.selectProject(projectDB);
                        }
                        //}
                    }
                    resolve();
                });
            } 
            catch (e) {
                console.error(e);
            }        
        })     

    }

    createCloseDlg() {
        const divCloseDlg = document.createElement('span');
        divCloseDlg.classList.add('clockify-close-dlg');
        divCloseDlg.innerHTML = 
            `<img id='clockifyCloseDlg' src='${aBrowser.runtime.getURL("assets/images/closeX.png")}' style='width:14px, height:14px;' alt='Close'` + 
                " class='clockify-close-dlg-icon' />";
        return divCloseDlg;
    }

    createMsg(msg) {
        const span = document.createElement('span');
        span.classList.add('clockify-msg');
        span.innerHTML = msg + 
        `<img id='clockifyCloseMsg' src='${aBrowser.runtime.getURL("assets/images/closeX.png")}' style='width:12px, height:12px;' alt='Close'` + 
        " class='clockify-close-msg-icon' />";
        return span;
    }

    closeMsg() {
        const el = $("#clockifyCloseMsg", this.editFormElem);
        if (el) {
            this.editFormElem.removeChild(el.parentNode);
        }
    }

    createStopTimer() {
        const { description, project, task } = this.state.timeEntry;

        const projectName = project ? project.name : "";
        const taskName = task ? task.Name : "";

        this.options = {
            description,
            projectName,
            taskName,
            canClose: () => this.canClose() 
        };
        _button = clockifyButton.createButton({
            description,
            projectName,
            taskName,
            canClose: () => this.canClose() 
        });

        _button.onEntryChanged = (entry) => { 
            if (entry === null) { //} || entry.timeInterval.end != null) {
                _button.onEntryChanged = null;
                clockifyDestroyPopupDlg();
                return;
            }
            this.setState({ timeEntry: entry });
            this.checkRequiredFields();

            this.redrawDescription();
            _clockifyProjectList.mapSelectedProject(); 

            if (this.state.descRequired)
                this.shakeDescription();
        }

        const divStopTimer = document.createElement('div');
        divStopTimer.classList.add('clockify-stop-timer');

        divStopTimer.appendChild(_button);
    
        return divStopTimer;
    }


    get descriptionContent() {
        const { timeEntry } = this.state;
        return  "<textarea id='clockifyTextareaDescription' type='text' class='clockify-edit-form-description'" +
                " placeholder='Description'>" +    // box-sizing:border-box;
                    timeEntry.description +
                "</textarea>"; 
    }

    createDescription() {
        //const { timeEntry } = this.state;

        const divDesc = document.createElement('div');
        divDesc.innerHTML = 
            `<div class='clockify-description-textarea${this.descRequired?" required":""}' style='padding:0'>` +
                this.descriptionContent +
            "</div>";

        return divDesc;
    }

    redrawDescription() {
        const el = $("#clockifyTextareaDescription", this.editFormElem).parentNode;
        el.innerHTML = this.descriptionContent;
    }

    shakeDescription() {
        const el = $("#clockifyTextareaDescription", this.editFormElem).parentNode;
        el.classList.add('shake-heartache');
        //el.classList.add('required');
        el.addEventListener('animationend', function(e) {
            el.classList.remove('shake-heartache');
        });
    }

    get billableContent() {
        const { timeEntry } = this.state;
        return `<span class='clockify-edit-form-checkbox${timeEntry.billable ? " clockify-checked" : ""}' tabIndex='0' >` + 
            `<img src='${aBrowser.runtime.getURL('assets/images/checked.png')}' class='edit-form-billable-img${timeEntry.billable ? "" : "-hidden"}' />` +
        "</span>" +
        "<label class='clockify-edit-form-billable'>Billable</label>"
    }

    createButtons() {
        const { timeEntry } = this.state;
        const { descRequired, projectRequired, taskRequired, tagsRequired } = this.state;

        const divButtons = document.createElement('div');
        divButtons.innerHTML =
        "<div class='clockify-edit-form-buttons'>" + 
            "<div id='divClockifyBillable' class='clockify-edit-form-buttons__billable'>" + 
                this.billableContent + 
            "</div>" + 
            // "<hr/>" + 
            "<div class='clockify-edit-form-right-buttons'>" + 
                `<button id='clockifyButtonDone' class='${
                    descRequired || projectRequired || taskRequired || tagsRequired
                        ? "clockify-edit-form-done-disabled"
                        : "clockify-edit-form-done"}'>Done` +
                "</button>" + 
            "</div>" + 
        "</div>";      

        return divButtons;
    }
     
    onClicked(el) {
        switch(el.id) {
            case 'clockifyCloseMsg':
                this.closeMsg();
                break;

            case 'divClockifyBillable':
                this.editBillable()
                    .then(({timeEntry}) => {
                        $('#divClockifyBillable', this.editFormElem).innerHTML = this.billableContent;
                    });
                break;
            case 'clockifyButtonDone':
            case 'clockifyCloseDlg':
                    //if (this.canClose())
                    clockifyDestroyPopupDlg();
                break;
            case 'clockifyButton':
            //case 'clockifySmallButton':
                if (this.canClose())
                    buttonClicked(el, this.options);
                break;
            default:
                break;
        }
    }

    onChanged(el) {
        while (el && !el.id) {
            el = el.parentNode;
        }
        const { timeEntry } = this.state;
        switch(el.id) {
            case 'clockifyTextareaDescription': {
                const ta = el; //e.target;
                try {
                    const description = ta.value.trim();
                    // _button.title = description; is server notifies TIME_ENTRY_UPDATED
                    aBrowser.runtime.sendMessage({
                        eventName: 'submitDescription',
                        timeEntryOptions: {
                            id: timeEntry.id,
                            description
                        }
                    }, (response) => {
                        if (!response || response.status !== 200) {
                            //inputMessage(input, "Error: " + (response && response.status), "error");
                            if (response && response.status === 400) {
                                // project/task/etc. can be configured to be mandatory; this can result in a code 400 during
                                // time entry creation
                                alert("Can't log time without project/task/description or tags.");
                            }
                        } else {
                            const timeEntry = response.data;
                            // server doesn't notify about TIME_ENTRY_UPDATED
                            // aBrowser.storage.local.set({
                            //    timeEntryInProgress: Object.assign(timeEntry, { 
                            //        originPopupDlg: true
                            //    })
                            // }); 
                            this.setState({timeEntry});
                            this.checkRequiredFields();
                            if (this.state.descRequired)
                                this.shakeDescription();
                        }
                    });
                    //e.stopPropagation();
                } 
                catch (e) {
                    console.error(e);
                }
            }
            break;
            default:
                break;
        }
    }


    async editProject(project) {
        const { timeEntry } = this.state;
        timeEntry.project = project;
        timeEntry.projectId = project.id;
        return new Promise(resolve => {
            try {
                aBrowser.runtime.sendMessage({
                    eventName: 'editProject',
                    timeEntryOptions: {
                        id: timeEntry.id,
                        project
                    }
                }, (response) => {
                    if (!response) {
                        return;
                    } 
                    if (response && response.status !== 200) {
                        return;
                    }
                    const timeEntry = response.data;
                    if (timeEntry.projectId === null)
                        timeEntry.projectId = 'no-project';
                    /*
                    aBrowser.storage.local.set({
                        timeEntryInProgress: Object.assign(timeEntry, { originPopupDlg: true })
                    });
                    */
                    this.setState({ timeEntry });
                    this.checkRequiredFields();

                    $('#divClockifyBillable', this.editFormElem).innerHTML = this.billableContent;
                    //_clockifyProjectList.mapSelectedProject();  ???
                    resolve(timeEntry)
                });
            } catch (e) {
                console.error(e);
            }        
        })        
    }

    async editTask(task, project) {
        const { timeEntry } = this.state;
        timeEntry.project = project;
        timeEntry.projectId = project.id;
        timeEntry.task = task;
        return new Promise(resolve => {
            try {
                aBrowser.runtime.sendMessage({
                    eventName: 'editTask',
                    timeEntryOptions: {
                        id: timeEntry.id,
                        project: timeEntry.project,
                        task: timeEntry.task
                    }
                }, (timeEntry) => {
                    //aBrowser.storage.local.set({
                    //    timeEntryInProgress: Object.assign(timeEntry, { originPopupDlg: true })
                    //});
                    this.setState({timeEntry});
                    this.checkRequiredFields();
                    //_clockifyProjectList.mapSelectedProject();  ???
                    resolve(timeEntry)
                });
            } catch (e) {
                console.error(e);
            }        
        })             
    }


    get tagIds() { 
        return this.state.tags 
            ? this.state.tags.map(it => it.id)
            : [];
    }


    async editTags(tag) {
        const { timeEntry } = this.state;

        let tagIds = this.tagIds;
        let tagList = this.state.tags;
        timeEntry.tags = tagList;

        if (tagIds.includes(tag.id)) {
            tagIds.splice(tagIds.indexOf(tag.id), 1);
            tagList = tagList.filter(t => t.id !== tag.id);
        } else {
            tagIds.push(tag.id);
            tagList.push(tag);
        }
        return new Promise(resolve => {
            try {
                aBrowser.runtime.sendMessage({
                    eventName: 'editTags',
                    timeEntryOptions: {
                        id: timeEntry.id,
                        tagIds
                    }
                }, (response) => {
                    if (!response) {
                        return;
                    } 

                    const { status, timeEntry } = response;
                    if (response && status !== 200) {
                        return;
                    }
                    /*
                    aBrowser.storage.local.set({
                        timeEntryInProgress: Object.assign(timeEntry, { originPopupDlg: true })
                    });
                    */
                   this.setState({ 
                        timeEntry,
                        tags: tagList
                    });
                    this.checkRequiredFields();
                    resolve({timeEntry, tagList})
                });
            } catch (e) {
                console.error(e);
            }        
        })        
    }  
    
    async editBillable() {
        const { timeEntry } = this.state;

        return new Promise(resolve => {
            try {
                aBrowser.runtime.sendMessage({
                    eventName: 'editBillable',
                    timeEntryOptions: {
                        id: timeEntry.id,
                        billable: !timeEntry.billable
                    }
                }, (response) => {
                    if (!response) {
                        return;
                    } 

                    const { status, timeEntry } = response;
                    if (response && status !== 200) {
                        return;
                    }
                    /*
                    aBrowser.storage.local.set({
                        timeEntryInProgress: Object.assign(timeEntry, { originPopupDlg: true })
                    });
                    */
                   this.setState({ 
                        timeEntry
                    });
                    //this.checkRequiredFields();
                    resolve({timeEntry})
                });
            } catch (e) {
                console.error(e);
            }        
        })        
    }  
    
    checkRequiredFields() {
        let descRequired = false;
        let projectRequired = false;
        let taskRequired = false;
        let tagsRequired = false;

        const { wsSettings } = this;
        if (wsSettings) {
            const { timeEntry } = this.state;
            if (wsSettings.forceDescription &&
                (!timeEntry.description || timeEntry.description === "")
            ) {
                descRequired = true;
            }

            if (wsSettings.forceProjects &&
                (!timeEntry.projectId || timeEntry.projectId === 'no-project') &&
                !isOffline()
            ) {
                projectRequired = true;
            }

            if (wsSettings.forceTasks &&
                !timeEntry.task &&
                !timeEntry.taskId &&
                !isOffline()
            ) {
                taskRequired = true;
            }

            // TODO odakle tagIds u timeEntry
            if (wsSettings.forceTags &&
                timeEntry.tagIds && timeEntry.tagIds.length === 0 &&
                !isOffline()) {
                tagsRequired = true;
            }
        }

        if (!descRequired && !projectRequired && !taskRequired && !tagsRequired)
            this.closeMsg();

        this.setState({
            descRequired,
            projectRequired,
            taskRequired,
            tagsRequired,
            ready: true
        });
        
    }

}


var ClockifyPopupDlg = class {
    constructor() {
        this.editForm = null;
    }    

    create(timeEntryInProgress, msg) {

        this.editForm = new ClockifyEditForm(timeEntryInProgress);

        _clockifyProjectList = new ClockifyProjectList(this.editForm, timeEntryInProgress);
        _clockifyTagList = new ClockifyTagList(this.editForm, timeEntryInProgress);

        const popupDlg = document.createElement('div');
        popupDlg.setAttribute("id", 'divClockifyPopupDlg');
        popupDlg.classList.add('clockify-popup-dlg');

        const divEditForm = this.editForm.create(msg);
        popupDlg.appendChild(divEditForm);

        return popupDlg;
    }

    onClicked(el) {
        while (el && !el.id) {
            el = el.parentNode;
        }
        switch(el.id) {
            case 'imgClockifyDropDown':
            case 'liClockifyProjectDropDownHeader':
                _clockifyProjectList.onClicked(el);
                break;

            case 'imgClockifyDropDownTags':
            case 'liClockifyTagDropDownHeader':
                _clockifyTagList.onClicked(el);
                break;
                                
            default:
                this.editForm.onClicked(el);
                break;
        }
    }

    onClickedProjectDropDown(el) {
        while (el && !el.id) {
            el = el.parentNode;
        }
        switch(el.id) {
            case 'imgClockifyTasksArrow':
            case 'clockifyProjectItemTask':
            case 'clockifyProjectItemName':
            case 'clockifyLoadMoreProjects':
                _clockifyProjectList.onClickedProjectDropDown(el);
                break;
            default:
                if (el.nodeName === 'LI' && el.id.startsWith('task_li_')) {
                    _clockifyProjectList.onClickedProjectDropDown(el);
                }
                break;
        }
    }

    onClickedTagDropDown(el) {
        while (el && !el.id) {
            el = el.parentNode;
        }
        switch(el.id) {
            default:
                _clockifyTagList.onClickedTagDropDown(el);
                break;
        }
    }


    onChanged(el) {
        this.editForm.onChanged(el);
    }

    destroy() {
        //_clockifyProjectList.setElem(null);
        _clockifyProjectList.destroy();
        _clockifyProjectList = null;
        _clockifyTagList.destroy();
        _clockifyTagList = null;
        this.editForm.destroy();
        this.editForm = null;
    }
   
}


function isOffline() {
    return !navigator.onLine;
}

