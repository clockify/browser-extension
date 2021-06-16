var ClockifyProjectList = class {

    constructor(editForm, timeEntryInProgress) {
        this.editForm = editForm;
        this.elem = null;
        this.divDropDownPopup = null;
        this.taskGetOrCreated = timeEntryInProgress.task;  // usually timeEntryInProgress doesn't contain task
        this.state = {
            isOpen: false,
            page: 1,
            pageSize: 50, // service returns 50
            projectList:!this.wsSettings.forceProjects && editForm.SelectedProject ?
                    [{name: 'No project', id: 'no-project', color: '#999999', tasks: []}] : [],
            filter: '',
            ready: false,
            loadMore: true,
            clients: ['Without client'],
            title: '',
            Items: {},
            selectedProject: {
                name: this.createNameForSelectedProject(),
                color: this.getColorForProject()
            },
            selectedTaskName: '',
            isSpecialFilter: editForm.wsSettings.projectPickerSpecialFilter,
            isEnabledCreateProject: false,
            specFilterNoTasksOrProject: ""
        }
        this.filterProjects = this.filterProjects.bind(this);
    }


    get wsSettings() { 
        return this.editForm.wsSettings;
    }

    setElem(elem) {
        this.elem = elem;
    }

    getElem(s) { 
        const el = $(s, this.elem);
        return el;
    }

    setDropDownPopupElem(el) {
        this.divDropDownPopup = el;
    }

    getDropDownPopupElem(s) { 
        const el = $(s, this.divDropDownPopup);
        return el;
    }

    getDropDownPopupElems(s) { 
        const el = $$(s, this.divDropDownPopup);
        return el;
    }

    setState(obj, redraw=false) {
        Object.assign(this.state, obj);
        if (redraw) {
            this.redrawHeader(); //  ???
            if (this.divDropDownPopup) {
                this.renderContent(); // ???
            }
        }
    }

    componentDidMount() {
        this.getProjects();
        this.render();
        this.repositionDropDown();
    }

    repositionDropDown() {
        const li = this.getElem('#liClockifyProjectDropDownHeader');
        if (li) {
            const rect = li.getBoundingClientRect();
            const divDropDown = document.getElementById('divClockifyProjectDropDownPopup');
            divDropDown.style.setProperty('left', "" + (rect.left + window.scrollX) + "px");  // + 
            divDropDown.style.setProperty('top', "" + (rect.bottom + window.scrollY) + "px");        
            // let viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
        }
    }

    get HeaderContent() {
        const isOffline = !navigator.onLine ? true : false;
        const img = `assets/images/arrow-light-mode${this.state.isOpen?"-up":""}.png`;
        const str = 
            "<div style='display:flex; align-items: center;' tabIndex=0" + 
                ` class='${isOffline ? "clockify-project-list-button-offline" : this.editForm.isProjectRequired || this.editForm.isTaskRequired ?
                        "clockify-project-list-button-required" : "clockify-project-list-button"}'>` +
                `<span style='color: ${this.state.selectedProject ? this.state.selectedProject.color : "#999999"}'` +
                    " class='clockify-project-list-name'>" + 
                    `${this.state.selectedProject ? this.state.selectedProject.name : "Add project"}` +
                    "<span>" + 
                        (this.state.selectedTaskName === "" ? "" : ` : ${this.state.selectedTaskName}`) + 
                    "</span>" + 
                    // "<input id='inputClockifyProjectTask' class='clockify-project-list-name' type='text'/>" +
                "</span>" +
                "<span class='clockify-span-arrow'>" +
                    `<img id='imgClockifyDropDown' src='${aBrowser.runtime.getURL(img)}'` + 
                    " alt='open' class='clockify-project-list-arrow' />" + 
                "</span>" + 
            "</div>" +
            (this.editForm.isTaskRequired ? "<div className='error'>Can't save without task</div>" : "")
        return str;
    }

    onClicked(el) {
        switch(el.id) {
            case 'liClockifyProjectDropDownHeader':
            case 'imgClockifyDropDown': 
            {
                if (!this.state.isOpen)
                    this.open();
                else
                    this.close();
            }
            break;
            
            default:
                break;
        }
    }

    onClickedProjectDropDown(el) {
        switch(el.id) {
            case 'imgClockifyTasksArrow': 
            case 'clockifyProjectItemTask': {
                    let li = el.parentNode;
                    while (li && li.nodeName !== 'LI') {
                        li = li.parentNode;
                    }
                    const id = li.id.replace("li_", "");
                    this.toggleProjectItem(id);
                }
                break;

            case 'clockifyProjectItemName': {
                    let li = el.parentNode;
                    while (li && li.nodeName !== 'LI') {
                        li = li.parentNode;
                    }
                    const id = li.id.replace("li_", "");
                    if (this.editForm.isForceTasks) {
                        this.toggleProjectItem(id);
                    }
                    else {
                        this.selectProjectItem(null, id);
                    }
                }
                break;

            case 'clockifyLoadMoreProjects': 
                this.loadMoreProjects();
                break;
            
            default:
                if (el.nodeName === 'LI' && el.id.startsWith('task_li_')) {
                    const id = el.id.replace("task_li_", "");
                    this.chooseTask(el);
                }
                break;
        }
    }

    redrawHeader() {
        const li = this.getElem('#liClockifyProjectDropDownHeader');
        if (li)
            li.innerHTML = this.HeaderContent;
        //$('#imgClockifyDropDown', this.elem).src = aBrowser.runtime.getURL('assets/images/arrow-light-mode.png');
    }

    create() {
        this.mapSelectedProject();
        
        const divProject = document.createElement('div');
        divProject.setAttribute("id", 'divClockifyProjectDropDown');
        divProject.innerHTML = 
            "<ul class='clockify-drop-down'>" + 
                `<li id='liClockifyProjectDropDownHeader'>${this.HeaderContent}</li>` +
            "</ul>";
        
        this.setElem(divProject);
    
        return divProject;
    }

    shakeHeader() {
        const li = this.getElem('#liClockifyProjectDropDownHeader');
        if (li) {
            li.classList.add('shake-heartache');
            li.addEventListener('animationend', function(e) {
                li.classList.remove('shake-heartache');
            });
        }
    }


    open() {
        aBrowser.storage.local.get(["timeEntryInProgress"], (result) => {
            if (_clockifyTagList)
                _clockifyTagList.close(true);
            
            const neverOpened = !this.divDropDownPopup;
            if (neverOpened) {
                this.componentDidMount();
            }
            this.getElem('#imgClockifyDropDown').src = aBrowser.runtime.getURL('assets/images/arrow-light-mode-up.png');
            this.divDropDownPopup.style.display = 'block';

            if (neverOpened) {
                this.filterProjects = clockifyDebounce(this.filterProjects, 500);

                const inp = this.getDropDownPopupElem('#inputClockifyProjectFilter');
                inp.focus();
                inp.addEventListener('keyup', (e) => {
                    this.filterProjects(e)
                })
            }
            this.setState({ 
                isOpen: true 
            });
            // this.props.projectListOpened();
        });
    }

    close(fromOtherDropDown) {
        if (fromOtherDropDown && !this.state.isOpen)
            return;
        this.setState({ 
            isOpen: false
        });
        this.getElem('#imgClockifyDropDown').src = aBrowser.runtime.getURL('assets/images/arrow-light-mode.png');
        if (this.divDropDownPopup)
            this.divDropDownPopup.style.display = 'none';
    }

    destroy() {
        this.clean();
        if (this.divDropDownPopup) {
            this.divDropDownPopup.removeEventListener('mousewheel', this.clockifyMouseWheel, true);
            this.divDropDownPopup.removeEventListener('DOMMouseScroll', this.clockifyMouseWheel, true);

            document.body.removeChild(this.divDropDownPopup);
            this.divDropDownPopup = null;

        }
        this.elem = null;
        // todo remove click listeners
        //document.removeEventListener('click', removePopupDlg, true);
    }
   
    getProjects() {
        if (this.state.page === 1) {
            this.setState({
                projectList: !this.wsSettings.forceProjects && this.editForm.SelectedProject ?
                    [{name: 'No project', id: 'no-project', color: '#999999', tasks: []}] : []
            })
        }        
        aBrowser.runtime.sendMessage({
            eventName: 'getProjects',
            options: { 
                filter: this.state.filter, 
                page: this.state.page, 
                pageSize: this.state.pageSize
            }
        }, (response) => {
            if (!response) {
                alert("You must be logged in to start time entry (projectList).");
                return;
            }
            if (response.status === 400) {
                // openPostStartPopup("Can't start entry without project/task/description or tags. Please edit your time entry. Please create your time entry using the dashboard or edit your workspace settings.")
                // alert("Can't start entry without project/task/description or tags. Please edit your time entry. Please create your time entry using the dashboard or edit your workspace settings.");
            } else {
                const items = response.data ? response.data.projectList : [];
                const projectList = this.state.projectList
                        .concat(this.editForm.isForceTasks
                            ? items.filter(item => item.taskCount > 0)
                            : items);
                this.setState({
                    projectList: this.state.filter.length > 0 
                        ? projectList.filter(project => project.name !== "No project")
                        : projectList,
                    page: this.state.page + 1,
                    ready: true
                })

                this.setState({
                    clients: this.getClients(this.state.projectList),
                    loadMore: items.length ===  this.state.pageSize ? true : false,
                    specFilterNoTasksOrProject: 
                        this.createMessageForNoTaskOrProject(
                            response.data, this.state.isSpecialFilter, this.state.filter
                        )
                });
                //if(!this.state.isOpen) {
                    this.mapSelectedProject();
                //}                
                this.setState({}, true); // redraw
            }
        });
    }
    
    getClients(projects) {
        const clients = new Set(projects.filter(p => p.client).map(p => p.client.name))
        if (projects && projects.length > 0) {
            return ['Without client', ...clients]
        } else {
            return []
        }
    }


    createMessageForNoTaskOrProject(projects, isSpecialFilter, filter) {
        if (!isSpecialFilter || filter.length === 0 || projects.length > 0) return ""
        
        if (!filter.includes("@")) {
            return "No matching tasks. Search projects with @project syntax"
        } else {
            return "No matching projects"
        }
    }


    filterProjects(e) {
        Object.assign(this.state, {
            page: 1,
            filter: e.target.value.toLowerCase()
        });
        this.getProjects();
    }

    loadMoreProjects() {
        this.getProjects();
    }

    mapSelectedProject() {
        const { SelectedProjectId, SelectedTaskId } = this.editForm;

        const selectedProject = 
            this.state.projectList.filter(p => p.id === SelectedProjectId)[0];
        if (SelectedProjectId && selectedProject) {
            this.setState({
                selectedProject: selectedProject
            })
            this.setState({
                title: this.createTitle()
            });

            const selectedTask = this.state.selectedProject.tasks ?
                this.state.selectedProject.tasks.filter(
                    t => t.id === SelectedTaskId)[0] : null;
            if (SelectedTaskId && selectedTask) {
                this.setState({
                    selectedTaskName: selectedTask.name
                })
                this.setState({
                    title: this.createTitle()
                });
            }
        } else {
            if (SelectedProjectId) {
                const projectIds = [];
                projectIds.push(SelectedProjectId);
                aBrowser.runtime.sendMessage({
                    eventName: 'getProjectsByIds',
                    options: { 
                        projectIds,
                        taskIds: SelectedTaskId ? [SelectedTaskId] : null
                    }
                }, (response) => {
                    if (response.data && response.data.length > 0 && !response.data[0].archived) {
                        this.setState({
                            selectedProject: response.data[0]
                        });
                        this.setState({
                            title: this.createTitle()
                        });
                        const selectedTask = this.state.selectedProject.tasks ?
                            this.state.selectedProject.tasks.filter(
                                t => t.id === SelectedTaskId)[0] : null;
                        if (selectedTask) {
                            this.setState({
                                selectedTaskName: selectedTask.name
                            });
                            this.setState({
                                title: this.createTitle()
                            });
                        }
                        else if (this.taskGetOrCreated) {  // (SL)
                            this.setState({
                                selectedTaskName: this.taskGetOrCreated.name
                            });
                            this.setState({
                                title: this.createTitle()
                            });
                        }
                    }
                    this.setState({}, true); // force redraw, getProjectsByIds is async
                });
            } else {
                this.setState({
                    selectedProject: {
                        name: this.createNameForSelectedProject(),
                        color: this.getColorForProject()
                    }
                })
                this.setState({
                    title: this.createTitle()
                });
            }
            // TODO keep selectedProject in editForm mozda
        }
    }    

    createTitle() {
        let title = 'Add project';
        if (this.state.selectedProject && this.state.selectedProject.id) {
            title = 'Project: ' + this.state.selectedProject.name;

            if (this.state.selectedTaskName) {
                title = title + '\nTask: ' + this.state.selectedTaskName;
            }

            if (this.state.selectedProject.client && this.state.selectedProject.client.name) {
                title = title + '\nClient: ' + this.state.selectedProject.client.name;
            }
        }
        return title;
    }

    createNameForSelectedProject() {
        let name = 'Add project';
        if (this.editForm.isProjectRequired) {
            name += ' (project ';
            if (this.editForm.isTaskRequired) {
                name = 'Add task (';
            }
            name += 'required)'
        }
        return name;
    }

    getColorForProject() {
        // const userId = localStorage.getItem('userId');
        //const darkModeFromStorage = localStorageService.get('darkMode') ?
        //    JSON.parse(localStorageService.get('darkMode')) : [];

        //if (darkModeFromStorage.length > 0 &&
        //    darkModeFromStorage.filter(darkMode => darkMode.userId === userId && darkMode.enabled).length > 0
        //) {
        //    return '#90A4AE';
        // } else {
            return '#999999';
        //}
    }


    // loadProjects() {
    //     return [
    //         { id: 'item1', name: 'Pera', isOpen: false, tasks: [
    //             { id: 'task11', name: 'prvi'},
    //             { id: 'task12', name: 'drugi'},
    //             { id: 'task13', name: 'treci'} ]},
    //         { id: 'item2', name: 'Zdera', isOpen: false},
    //         { id: 'item3', name: 'Slavko', isOpen: false, tasks: [
    //             { id: 'task11', name: 'alfa'},
    //             { id: 'task13', name: 'beta'} ]}    
    //         ]
    // }

    render() {
        const dropDownPopup = document.createElement('div');
        dropDownPopup.setAttribute("id", 'divClockifyProjectDropDownPopup');
        dropDownPopup.classList.add('clockify-drop-down-popup');
        dropDownPopup.innerHTML = 
            "<div class='clockify-list-input'>" + 
                "<div class='clockify-list-input--border'>" + 
                    "<input id='inputClockifyProjectFilter' type='text'" +
                        ` placeholder="${this.wsSettings.projectPickerSpecialFilter ? 'Filter task @project or client' : 'Filter projects'}"` + 
                            " class='clockify-list-filter' style='padding: 3px 0px'/>" + 
                    (!!this.state.filter ? "<span class='clockify-list-filter__clear' />" : "") + 
                    //onClick={this.clearProjectFilter.bind(this)}></span>
                "</div>" + 
            "</div>" +
            "<ul id='ulClockifyProjectDropDown' class='clockify-project-list'>" +
            "</ul>";
        this.setDropDownPopupElem(dropDownPopup);

        document.body.appendChild(dropDownPopup);
        //this.getElem('#liClockifyProjectDropDown').innerHTML = str;

        this.divDropDownPopup.addEventListener('mousewheel', this.clockifyMouseWheel, true);
        this.divDropDownPopup.addEventListener('DOMMouseScroll', this.clockifyMouseWheel, true);
    }

    clockifyMouseWheel(e) {
        e.stopPropagation();
    }

    renderContent() {
        let str = "";
        this.state.clients.map(client => {
            str += '<li><ul class="clockify-drop-down-2">' + 
                        `<li class="clockify-project-list-client">${client}</li>`;
            const arr = [];
            this.state.projectList
                .filter(project =>
                    (project.client && project.client.name === client) ||
                        (!project.client && client === 'Without client'))
                    .map(project => {
                        const Item = new ClockifyProjectItem(project);
                        this.state.Items[project.id] = Item;
                        arr.push(Item.render());
                     })
            str += arr.join('');
            str += '</ul></li>';
        })

        if (this.state.loadMore) {
            str += "<button class='clockify-list-load' id='clockifyLoadMoreProjects'>Load more</button>";
        }
        
        this.getDropDownPopupElem('#ulClockifyProjectDropDown').innerHTML = str;
    }


    selectProjectItem(e, id) {
        if (e)
            e.stopPropagation();
        this.state.Items[id].select(e);
    }

    toggleProjectItem(id) {
        this.state.Items[id].toggle();
    }

    closeAll() {
        const Items = this.state.Items;
        Object.keys(Items).forEach(key => { 
            if (Items[key].state.isOpen) 
                Items[key].close();
        });
    }


    clean() {
        const Items = this.state.Items;
        Object.keys(Items).forEach(key => {
            Items[key].clean();
            Items[key] = null;
        });
        if (this.dropDownPopupElem)  // ever dropped
            this.getElem('#ulClockifyProjectDropDown').innerHTML = "";
    }

    chooseTask(el) {  // e
        //const el = e.target;
        const li = el.parentNode.parentNode.previousSibling;
        const id = li.id.replace("li_", "");
        const projectItem = this.state.Items[id];
        const taskList = projectItem.state.taskList;
        const taskItem = taskList.state.Items[el.id.replace("task_li_", "")]
        // e.stopPropagation();
        this.selectTask(taskItem.props, projectItem.props);
    }  

    selectTask(task, project) {
        this.editForm.editTask(task, project)
            .then(timeEntry => {
                this.redrawHeader();
            }
        );
        this.setState({
            selectedProject: project,
            selectedTaskName: task.name, //task.props.name,
            isOpen: false
        });
        this.setState({
            title: this.createTitle()
        });
        this.mapSelectedProject();
        this.redrawHeader();
        this.close();
    }

    selectProject(project) {
        this.editForm.editProject({id: project.id === 'no-project' ? null : project.id})
            .then(timeEntry => {
                this.mapSelectedProject();
                this.redrawHeader();
            }
        );
        let projectList;
        if (project.id && !this.wsSettings.forceProjects) {
            if (this.state.projectList.filter(project => project.name === "No project").length == 0) {
                projectList = 
                    [{name: 'No project', id: 'no-project', color: '#999999', tasks: []}, ...this.state.projectList]
            } else {
                projectList = this.state.projectList
            }
        } else {
            projectList = this.state.projectList.filter(project => project.name !== "No project")
        }

        this.setState({
            selectedProject: project,
            selectedTaskName: '',
            isOpen: false,
            projectList: projectList
        });
        this.setState({
            title: this.createTitle()
        });
        this.mapSelectedProject();
        this.redrawHeader();
        this.close();        
    }


}

