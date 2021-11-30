var aBrowser = chrome || browser;
var _clockifyProjectList;
var _clockifyTagList;
var _button;

var ClockifyEditForm = class {

    constructor(timeEntry) {
        this.state = {
            timeEntry: Object.assign(timeEntry, { 
                project: { id: timeEntry.projectId },
                task: { id: timeEntry.taskId }
            }),
            descRequired: false,
            projectRequired: false,
            taskRequired: false,
            tagsRequired: false,
            tags: timeEntry.tags ? timeEntry.tags : []
        }
        this.editFormElem = null;
        this.customFields = [];
    }    

    get isForceTasks() { return this.wsSettings.forceTasks }
    get isProjectFavorites() { return this.wsSettings.projectFavorites }

    get hideBillable() {
        return !this.wsSettings.activeBillableHours || 
            this.wsSettings.onlyAdminsCanChangeBillableStatus && !_clockifyPopupDlg.isOwnerOrAdmin;
    }

    get isProjectRequired() { return this.state.projectRequired }
    get isTaskRequired() { return this.state.taskRequired }
    get isTagRequired() { return this.state.tagsRequired }

    get SelectedProject() { return this.state.timeEntry.project }
    get SelectedProjectId() { return this.state.timeEntry.projectId }
    get SelectedTask() { return this.state.timeEntry.task }
    get SelectedTaskId() { return this.state.timeEntry.taskId } // this.state.timeEntry.task ? this.state.timeEntry.task.id : null}

    static get userHasCustomFieldsFeature() { 
        return ClockifyEditForm.prototype.wsSettings.features.customFields;
    }


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

        // billable
        if (!this.hideBillable) {
            const divBillable = document.createElement('div');
            divBillable.innerHTML =
                "<div class='clockify-form-div clockify-edit-form-buttons__billable '>" +
                    "<span id='spanClockifyBillable' style='display: flex; align-items: center;padding-right:5px'>" + 
                    this.billableContent + 
                "</span></div>";
            editForm.appendChild(divBillable);
        }

        // Custom fields
        if (ClockifyEditForm.userHasCustomFieldsFeature) {
            const divCustomFields = document.createElement('div');
            divCustomFields.setAttribute('class', 'clockify-div-custom-fields');
            editForm.appendChild(divCustomFields);
            this.divCustomFields = divCustomFields;

            const { customFieldValues } = timeEntry;
            this.customFields = [];
            if (customFieldValues && customFieldValues.length > 0) {
                customFieldValues.forEach(customField => { // hopefully we have no INACTIVE here
                    const wsCustomField = _clockifyPopupDlg.getWSCustomField(customField); // here we can't use customField.customFieldDto
                    // console.log(customField.name.toUpperCase(), {customField, wsCustomField})
                    let status = wsCustomField.status;
                    const { projectDefaultValues } = wsCustomField;
                    if (projectDefaultValues && projectDefaultValues.length > 0) {
                        const projectEntry = projectDefaultValues.find(x => x.projectId === timeEntry.projectId);
                        if (projectEntry)
                            status = projectEntry.status;
                    }
                    if (status === 'VISIBLE') {
                        this.addCustomField({ 
                            wsCustomField,
                            timeEntryId: timeEntry.id,  // assert eq customField.timeEntryId
                            value: customField.value
                        });
                    }
                });
            }
        }

        // Done buttons
        const doneButtons = this.createButtons();
        editForm.appendChild(doneButtons);

        this.editFormElem = editForm;

        if (doShaking)
            this.shaking();

        return editForm;
    }

    addCustomField(obj)  {
        let cf, div;
        const { wsCustomField } = obj;
        obj = Object.assign(obj, { index: this.customFields.length });
        switch (wsCustomField.type) {
            case 'TXT':
                cf = new ClockifyCustomFieldText(obj);
                div = cf.create();
                break;
            case 'NUMBER':
                cf = new ClockifyCustomFieldNumber(obj);
                div = cf.create();
                break;
            case 'LINK':
                cf = new ClockifyCustomFieldLink(obj);
                div = cf.create();
                break;
            case 'CHECKBOX':
                cf = new ClockifyCustomFieldCheckbox(obj);
                div = cf.create();
                break;
            case 'DROPDOWN_SINGLE':
                cf = new ClockifyCustomFieldDropSingle(obj);
                div = cf.create();
                break;
            case 'DROPDOWN_MULTIPLE':
                cf = new ClockifyCustomFieldDropMultiple(obj);
                div = cf.create();
                break;
            default:
                console.error('Uncovered custom field type: ' + type)
                return { cf: null, div: null }
        }

        if (cf && div) {
            this.divCustomFields.appendChild(div); 
            this.customFields.push(cf);                 
        }        
    }

    onChangeProjectRedrawCustomFields() {
        const { timeEntry } = this.state;
        const { customFieldValues, projectId } = timeEntry;
        if (!customFieldValues || customFieldValues.length === 0) 
            return;

        // na nivou projekta moze redefinisati vise od 5 VISIBLE polja, 
        // dok na nivou WS ne vise od 5. 
        this.customFields.forEach(customField => {
            if (!customFieldValues.find(cf => cf.customFieldId === customField.customFieldId))
                if (customField.isVisible(this.divCustomFields)) {
                    customField.hide(this.divCustomFields);
                    console.log('Hide defined at project, but not at WS', customField)
                }
        })
        customFieldValues.forEach(customField => { // hopefully we have no INACTIVE here
            const wsCustomField = customField.customFieldDto;
            //console.log(customField.name.toUpperCase(), {customField, wsCustomField})
            let status = wsCustomField.status;
            const { projectDefaultValues } = wsCustomField;
            if (projectDefaultValues && projectDefaultValues.length > 0) {
                const projectEntry = projectDefaultValues.find(x => x.projectId === projectId);
                if (projectEntry) {
                    status = projectEntry.status;
                }
            }
            const cf = this.customFields.find(cf => cf.customFieldId === wsCustomField.id); 
            if (status === 'VISIBLE') {
                if (!cf) {
                    this.addCustomField({ 
                        wsCustomField,
                        timeEntryId: timeEntry.id,
                        value: customField.value
                    });
                }
                else {
                    cf.setValue(customField.value);
                    if (!cf.isVisible(this.divCustomFields))
                        cf.show(this.divCustomFields);
                    cf.redrawValue(this.divCustomFields);
                }
            }
            else if (cf) {
                if (cf.isVisible(this.divCustomFields)) {
                    cf.hide(this.divCustomFields)
                }
            }
        });
    }
   

    setFocusToDescription() {
        const el = $("#clockifyTextareaDescription", this.editFormElem);
        if (el) 
            el.focus();
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
                }, (resp) => {
                    if (resp === null || typeof resp === 'string') {
                        alert(resp??'Error');
                    }
                    else {
                        const {projectDB, taskDB, msg, msgId} = resp;
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
            `<img id='clockifyCloseDlg' src='${aBrowser.runtime.getURL("assets/images/closeX.png")}' style='width:14px; height:14px;' alt='Close'` + 
                " class='clockify-close-dlg-icon' />";
        return divCloseDlg;
    }

    createMsg(msg) {
        const span = document.createElement('span');
        span.classList.add('clockify-msg');
        span.innerHTML = msg + 
        `<img id='clockifyCloseMsg' src='${aBrowser.runtime.getURL("assets/images/closeX.png")}' style='width:12px; height:12px;' alt='Close'` + 
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
            /*
            // OVO CEMO JEDNOM KAD 
            // OTVORENI PopoupDlg INTEGRACIJA PRATI IZMENE NA WEBU
            // ali nakon this.setState({ timeEntry: entry }); 
            // da uskladi timeEntry: {
            //     project: {}
            //     task: {}
            // }
            // i jos nesto ako treba

            this.setState({ timeEntry: entry });
            this.checkRequiredFields();

            this.redrawDescription();
            _clockifyProjectList.mapSelectedProject(); 

            if (this.state.descRequired)
                this.shakeDescription();
            */
        }

        const divStopTimer = document.createElement('div');
        divStopTimer.classList.add('clockify-stop-timer');

        divStopTimer.appendChild(_button);
    
        return divStopTimer;
    }


    get descriptionContent() {
        let desc = this.state.timeEntry.description;
        return "<textarea id='clockifyTextareaDescription' type='text' class='clockify-edit-form-description' placeholder='Description'>" + 
                desc + 
               "</textarea>";
        // box-sizing:border-box;
    }

    createDescription() {
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

    onClickedCFPopup(target) {
        const {customFields} = this;
        for (var i=0; i < customFields.length; i++) {
            const customField = customFields[i];
            if (['DROPDOWN_SINGLE', 'DROPDOWN_MULTIPLE'].includes(customField.type)) {
                if (customField.onClickedCFPopup(target))
                    return true;
            }
        }
        return false;
    }
     
    onClicked(el) {
        switch(el.id) {

            case 'clockifyTextareaDescription':
                el.focus();
                break;

            case 'clockifyCloseMsg':
                this.closeMsg();
                break;

            case 'spanClockifyBillable':
                this.editBillable()
                    .then(({entry}) => {
                        $('#spanClockifyBillable', this.editFormElem).innerHTML = this.billableContent;
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

        //console.log(el)
        if (el.id) {
            if (el.id.startsWith('switchboxCustomField') ||
                el.id.startsWith('txtCustomField') ) {
                const index = el.getAttribute('index'); // el is <input checkbox>
                try {
                    this.customFields[index].onChanged(el);
                } 
                catch (e) {
                    console.error(e);
                }
                return;
            }
            else if (el.id.startsWith('taCustomField') ) {
                const ta = el; //e.target;
                const index = el.getAttribute('index');
                try {
                    this.customFields[index].onChanged(ta);
                } 
                catch (e) {
                    console.error(e);
                }
                return;
            }
        }

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
                        if (!response || typeof response === 'string') {
                            alert(response??'Error');
                            return;
                        }
                        const { data: entry, status } = response;
                        if (status !== 200) {
                            //inputMessage(input, "Error: " + (response && response.status), "error");
                            if (status === 400) {
                                // project/task/etc. can be configured to be mandatory; this can result in a code 400 during
                                // time entry creation
                                alert("Can't log time without project/task/description or tags.");
                            }
                        } else {
                            // we don't get notified if we are source of event TIME_ENTRY_UPDATED
                            // aBrowser.storage.local.set({
                            //    timeEntryInProgress: Object.assign(timeEntry, { 
                            //        originPopupDlg: true
                            //    })
                            // }); 
                            // ovo bi pokvarilo polja project i task
                            //this.setState({timeEntry});
                            timeEntry.description = entry.description;
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
        const previousProjectId = timeEntry.project.id;
        return new Promise(resolve => {
            try {
                aBrowser.runtime.sendMessage({
                    eventName: 'editProject',
                    timeEntryOptions: {
                        id: timeEntry.id,
                        project
                    }
                }, (response) => {
                    if (!response || typeof response === 'string') {
                        alert(response??"Error")
                        return;
                    } 
                    if (response.status !== 200) {
                        return;
                    }
                    const { status, entry } = response;
                    timeEntry.customFieldValues = ClockifyEditForm.userHasCustomFieldsFeature ? entry.customFieldValues : [];
                    timeEntry.project = project;
                    timeEntry.projectId = project.id;
                    timeEntry.task = null;
                    timeEntry.taskId = null; 
                    if (entry.projectId === null) {
                        timeEntry.projectId = 'no-project';
                        timeEntry.project = { 
                            id: 'no-project' //, name: 'No project'
                        }
                    }

                    // if (entry.projectId === null) {
                    //     timeEntry.projectId = 'no-project';
                    //     timeEntry.project = { 
                    //         id: 'no-project' //, name: 'No project'
                    //     }
                    // }
                    // else {
                    //     if (!entry.project) {
                    //         timeEntry.project = { 
                    //             id: entry.projectId
                    //         }
                    //     }
                    // }

                    /*
                    aBrowser.storage.local.set({
                        timeEntryInProgress: Object.assign(timeEntry, { originPopupDlg: true })
                    });
                    */
                    /* mislim da ovo ne treba
                    this.setState({ timeEntry });
                    */
                    this.checkRequiredFields();

                    if (_clockifyProjectList.projectFromList)
                        this.state.timeEntry.billable = _clockifyProjectList.projectFromList.billable;
                    if (!this.hideBillable)
                        $('#spanClockifyBillable', this.editFormElem).innerHTML = this.billableContent;
                    //_clockifyProjectList.mapSelectedProject();
                    if (ClockifyEditForm.userHasCustomFieldsFeature) {
                        this.onChangeProjectRedrawCustomFields()
                    }
                    resolve(timeEntry)
                });
            } catch (e) {
                console.error(e);
            }        
        })        
    }

    async editTask(task, project) {
        const { timeEntry } = this.state;
        return new Promise(resolve => {
            try {
                aBrowser.runtime.sendMessage({
                    eventName: 'editTask',
                    timeEntryOptions: {
                        id: timeEntry.id,
                        project,
                        task
                    }
                }, (response) => {
                    //aBrowser.storage.local.set({
                    //    timeEntryInProgress: Object.assign(timeEntry, { originPopupDlg: true })
                    //});
                    if (!response || typeof response === 'string') {
                        alert(response??'Error');
                        resolve(null);
                        return;
                    }

                    const { status, entry } = response;
                    timeEntry.project = project;
                    timeEntry.projectId = project.id;
                    if (_clockifyProjectList.projectFromList)
                        this.state.timeEntry.billable = _clockifyProjectList.projectFromList.billable;
                    if (!this.hideBillable)
                        $('#spanClockifyBillable', this.editFormElem).innerHTML = this.billableContent;

                    timeEntry.task = task;
                    timeEntry.taskId = task ? task.id : null; 
                    // mislim da ovo ne treba
                    //this.setState({timeEntry})
                    this.checkRequiredFields();
                    //_clockifyProjectList.mapSelectedProject();
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
                    options: {
                        id: timeEntry.id,
                        tagIds
                    }
                }, (response) => {
                    if (!response || typeof response === 'string') {
                        alert('Tags problem')
                        return;
                    } 

                    const { status, timeEntry: entry } = response;

                    if (status !== 200) {
                        alert('Tags response ' + status)
                        return;
                    }
                    /*
                    aBrowser.storage.local.set({
                        timeEntryInProgress: Object.assign(timeEntry, { originPopupDlg: true })
                    });
                    */
                   this.setState({ // timeEntry,
                        tags: tagList
                    });
                    this.checkRequiredFields();
                    resolve({entry, tagList})
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
                    options: {
                        id: timeEntry.id,
                        billable: !timeEntry.billable
                    }
                }, (response) => {
                    if (!response || typeof response === 'string') {
                        return;
                    } 

                    const { status, entry } = response;
                    if (response && status !== 200) {
                        return;
                    }
                    /*
                    aBrowser.storage.local.set({
                        timeEntryInProgress: Object.assign(timeEntry, { originPopupDlg: true })
                    });
                    */
                    // treba li nam ovo, jer ko zna kakav timeEntry vraca, 
                    // pa izgubimo entry.project, ili entry.task
                    // this.setState({ 
                    //     timeEntry
                    // });
                    timeEntry.billable = !timeEntry.billable;

                    //this.checkRequiredFields();
                    resolve({entry})
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
            const imaTagove = timeEntry.tagIds && timeEntry.tagIds.length > 0 ||
                              timeEntry.tags && timeEntry.tags.length > 0;
            if (wsSettings.forceTags && !imaTagove && !isOffline()) {
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
            })        
    }

}

function isOffline() {
    //return !navigator.onLine;
    return localStorage.getItem('offline') && localStorage.getItem('offline') === 'true';
}
