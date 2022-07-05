_clockifyWithoutClient = 'WITHOUT-CLIENT';

_clockifyNoProjectObj = () => ({ 
    id: 'no-project',
    name: clockifyLocales.NO_PROJECT,
    client: { 
        name: 'NO-PROJECT'
    },
    color: '#999999', 
    tasks: []
})

var ClockifyProjectList = class {

    constructor(editForm, timeEntry, manualMode) {
        this.editForm = editForm;
        this.elem = null;
        this.divDropDownPopup = null;
        this.state = {
            isOpen: false,
            page: 1,
            pageSize: 50, // service returns 50
            projectList: this.initialProjectList,
            filter: '',
            ready: false,
            loadMore: true,
            clientProjects: {},
            title: '',
            Items: {},
            selectedProject: {
                name: this.createNameForSelectedProject(),
                color: this.getColorForProject()
            },
            selectedTaskName: '',
            isSpecialFilter: editForm.wsSettings.projectPickerSpecialFilter,
            isEnabledCreateProject: false,
            specFilterNoTasksOrProject: "",
            cleanOnClose: false,
            manualMode: manualMode,
            timeEntry: timeEntry,
        }
        this.filterProjects = this.filterProjects.bind(this);
    }

    get initialProjectList() {
        const { SelectedProject } = this.editForm;
        return !this.wsSettings.forceProjects && SelectedProject && SelectedProject.id !== 'no-project' && SelectedProject.id !== null
            ? [_clockifyNoProjectObj()]
            : []
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
        aBrowser.storage.local.get('preProjectList', (result) => {
            const preProjectList = result.preProjectList || {};
            let {projectList = this.initialProjectList, clientProjects = {}} = preProjectList;
            if(this.editForm.isForceTasks){
                projectList = projectList.filter(project => project.taskCount > 0);
                clientProjects = this.getClients(projectList);
            }
            else if(!preProjectList || !preProjectList.clientProjects){
                clientProjects = this.getClients(projectList);
            }
            this.setState({
                projectList,
                clientProjects,
                ready: true
            });
            this.setState({}, true);
        });
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
                    `${this.state.selectedProject ? this.state.selectedProject.name : clockifyLocales.ADD_PROJECT}` +
                    "<span>" + 
                        (this.state.selectedTaskName === "" ? "" : ` : ${this.state.selectedTaskName}`) + 
                    "</span>" + 
                    "<span class='clockify-project-list-name-client'>" +
                    (this.state.selectedProject && this.state.selectedProject.client && this.state.selectedProject.client.name && this.state.selectedProject.client.name !== 'NO-PROJECT' ? " - " + this.state.selectedProject.client.name : "") +    
                    "</span>" +
                    // "<input id='inputClockifyProjectTask' class='clockify-project-list-name' type='text'/>" +
                "</span>" +
                "<span class='clockify-span-arrow'>" +
                    `<img id='imgClockifyDropDown' src='${aBrowser.runtime.getURL(img)}'` + 
                    " alt='open' class='clockify-project-list-arrow' />" + 
                "</span>" + 
            "</div>" +
            (this.editForm.isTaskRequired ? `<div className='error'>${clockifyLocales.CANT_SAVE_WITHOUT_REQUIRED_FIELDS} (${clockifyLocales.TASK})</div>` : "")
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
                if (this.state.isOpen) {
                    this.close();
                }
                break;
        }
    }

    onClickedProjectDropDown(el) {
        switch(el.id) {
            case 'imgClockifyTasksArrow': {
            //case 'clockifyProjectItemTask': {
                    let li = el.parentNode;
                    while (li && (li.nodeName !== 'LI' || !li.id))  {
                        li = li.parentNode;
                    }
                    const id = li.id.replace("li_", "");
                    this.toggleProjectItem(id);
                }
                break;

            case 'clockifyProjectItemName': {
                    let li = el.parentNode;
                    while (li && (li.nodeName !== 'LI' || !li.id)) {
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


            case 'clockifyFavoriteStar': {
                    let li = el.parentNode; 
                    while (li && li.nodeName !== 'UL') {// jump over inner UL/LI
                        li = li.parentNode;
                    }
                    while (li && li.nodeName !== 'LI') {
                        li = li.parentNode;
                    }
                    const id = li.id.replace("li_", "");
                    this.toggleFavorite(id);
                }
                break;               
            
            default:
                if (el.nodeName === 'LI' && el.id.startsWith('task_li_')) {
                    const id = el.id.replace("task_li_", "");
                    if (id.endsWith('load_more'))
                        this.loadMoreTasks(el);
                    else 
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
        divProject.setAttribute('class', 'clockify-form-div');
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
            _clockifyPopupDlg.closeAllDropDowns();
            
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

            if (this.state.cleanOnClose) {
                this.setState({ 
                    cleanOnClose: false,
                    page: 1,
                    clientProjects: {}
                });
                const ul = this.getDropDownPopupElem('#ulClockifyProjectDropDown');
                ul.scroll(0, 0);   
                this.getProjects();
            }
    
        });
    }

    close(fromOtherDropDown) {
        if (fromOtherDropDown && !this.state.isOpen)
            return;
        this.setState({ 
            isOpen: false
        }, false);
        this.getElem('#imgClockifyDropDown').src = aBrowser.runtime.getURL('assets/images/arrow-light-mode.png');
        if (this.divDropDownPopup) {
            this.divDropDownPopup.style.display = 'none';
        }

        if (this.state.cleanOnClose) {
            this.clean();
        }
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
        const { page, filter, pageSize } = this.state;
        if (page === 1) {
            this.setState({
                projectList: this.initialProjectList
            })
        }    
        aBrowser.runtime.sendMessage({
            eventName: 'getProjects',
            options: { 
                filter, 
                page, 
                pageSize,
                forceTasks: false,
                alreadyIds: this.state.projectList.map(p => p.id)
            }
        }, (response) => {
            if (!response) {
                alert(clockifyLocales.YOU_MUST_BE_LOGGED_IN_TO_START);
                return;
            }
            else if (typeof response === 'string') {
                alert(response);
                return;
            }
            if (response.status === 400) {
                // openPostStartPopup("Can't start entry without project/task/description or tags. Please edit your time entry. Please create your time entry using the dashboard or edit your workspace settings.")
                // alert("Can't start entry without project/task/description or tags. Please edit your time entry. Please create your time entry using the dashboard or edit your workspace settings.");
            } else {
                let items = response.data ? response.data.projectList : [];
                const loadMore = items.length >= this.state.pageSize ? true : false;
                if(this.editForm.isForceTasks){
                    items = items.filter(project => project.taskCount > 0);
                }
                if(!filter && page === 1){
                    aBrowser.storage.local.set({'preProjectList': {projectList: items}});
                }
                const projectList = this.state.page === 1 ? items : this.state.projectList.concat(items);                
                this.setState({
                    projectList: this.state.filter.length > 0 
                        ? projectList.filter(project => project.id !== "no-project")
                        : projectList.length > 0 
                            ? projectList 
                            : this.wsSettings.forceProjects
                                ? []
                                : [_clockifyNoProjectObj()],
                    page: this.state.page + 1,
                    ready: true
                })

                this.setState({
                    clientProjects: this.getClients(this.state.projectList),
                    loadMore: loadMore,
                    specFilterNoTasksOrProject: 
                        this.createMessageForNoTaskOrProject(
                            response.data, this.state.isSpecialFilter, this.state.filter
                        )
                });
                //if(!this.state.isOpen) {
                    /* this.mapSelectedProject(); */
                //}                
                this.setState({}, true); // redraw
            }
        });
    }

    groupByClientName(objectArray) {
        return objectArray.reduce((acc, p) => {
            const key = p.client && !!p.client.name
                ? p.client.name
                : _clockifyWithoutClient;
            if (!acc[key]) {
                acc[key] = [];
            }
            // Add object to list for given key's value
            acc[key].push(p);
            return acc;
        }, {});
    }

    groupByClientName(objectArray) {
        return objectArray.reduce((acc, p) => {
            const key = p.client && !!p.client.name
                ? p.client.name
                : 'WITHOUT-CLIENT';
            if (!acc[key]) {
                acc[key] = [];
            }
            // Add object to list for given key's value
            acc[key].push(p);
            return acc;
        }, {});
    }

    
    getClients(projects) {
        const projectFavorites = this.editForm.isProjectFavorites;
        if (projectFavorites) {
            const clientProjects = this.groupByClientName(projects.filter(p => !p.favorite));
            const favorites = projects.filter(p => p.favorite);
            if (favorites.length > 0) {
                clientProjects['FAVORITES'] = favorites;
            }
            return clientProjects;
        }
        else {
            const clientProjects = this.groupByClientName(projects);
            return clientProjects;   
        }        
    }


    createMessageForNoTaskOrProject(projects, isSpecialFilter, filter) {
        if (!isSpecialFilter || filter.length === 0 || projects.length > 0) return ""
        
        const noMatcingTasks = clockifyLocales.NO_MATCHING('tasks');
        const noMatcingTProjects = clockifyLocales.NO_MATCHING('projects');

        if (!filter.includes("@")) {
            return `${noMatcingTasks}. ${clockifyLocales.MONKEY_SEARCH}`
        } else {
            return noMatcingTProjects
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

    get projectFromList() {
        const { SelectedProjectId } = this.editForm;
        return this.state.projectList.find(p => p.id === SelectedProjectId);
    }


    mapSelectedProject(projectId) {
        const { SelectedProjectId = projectId, SelectedTaskId, SelectedTask: selectedTask } = this.editForm;

        const selectedProject = this.state.projectList.find(p => p.id === SelectedProjectId);
        if (SelectedProjectId && selectedProject) {
            this.setState({
                selectedProject
            })
            if (SelectedTaskId && selectedTask) {
                this.setState({
                    selectedTaskName: selectedTask.name
                })
            }
            this.setState({
                title: this.createTitle()
            });
        } 
        else {
            if (SelectedProjectId && SelectedProjectId !== 'no-project') {
                const projectIds = [];
                projectIds.push(SelectedProjectId);
                const taskIds = SelectedTaskId ? [SelectedTaskId] : null;
                aBrowser.runtime.sendMessage({
                    eventName: 'getProjectsByIds',
                    options: { 
                        projectIds,
                        taskIds
                    }
                }, (response) => {
                    if (!response || typeof response === 'string') {
                        alert(response??'Error')
                        return;
                    }
                    const projectDB = response.data && response.data.length > 0 ? response.data[0] : null;
                    if (projectDB && !projectDB.archived) {  // archived should have alerady been checked 
                        this.setState({
                            selectedProject: {
                                id: projectDB.id,
                                name: projectDB.name,
                                color: projectDB.color,
                                client: {
                                    name: projectDB.clientName
                                }
                            },
                            selectedTaskName: ''
                        });
                        const {tasks}  = projectDB; // this.state.selectedProject;
                        const selectedTask = tasks ? tasks.find(t => t.id === SelectedTaskId) : null;
                        if (selectedTask) {
                            this.setState({
                                selectedTaskName: selectedTask.name
                            });
                        }
                        this.setState({
                            title: this.createTitle()
                        });
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
        let title = clockifyLocales.ADD_PROJECT;
        if (this.state.selectedProject && this.state.selectedProject.id) {
            title = `${clockifyLocales.PROJECT}: ` + this.state.selectedProject.name;

            if (this.state.selectedTaskName) {
                title = title + `\n${clockifyLocales.TASK}: ` + this.state.selectedTaskName;
            }

            if (this.state.selectedProject.client && this.state.selectedProject.client.name) {
                title = title + `\n${clockifyLocales.CLIENT}: ` + this.state.selectedProject.client.name;
            }
        }
        return title;
    }

    createNameForSelectedProject() {
        let name = clockifyLocales.ADD_PROJECT;
        if (this.editForm.isProjectRequired) {
            if (this.editForm.isTaskRequired) {
                name = `${clockifyLocales.ADD_TASK}`;
            }
            name += ` ${clockifyLocales.REQUIRED_LABEL}`;
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
                        ` placeholder="${this.wsSettings.projectPickerSpecialFilter
                                ? clockifyLocales.MONKEY_SEARCH : clockifyLocales.FIND_PROJECTS}"` + 
                            " class='clockify-list-filter' style='padding: 3px 0px'/>" + 
                    (!!this.state.filter ? "<span class='clockify-list-filter__clear' />" : "") + 
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

	getStar(a) {
		const s = a 
			? a.classList.contains('clockify-active')
				? 'active'
				: 'normal'
			: 'hover';
		return `url(${aBrowser.runtime.getURL(`assets/images/ui-icons/favorites-${s}.svg`)})`
	}

    renderContent() {

        let selectedItem = Object.entries(this.state.Items).find(([key, item]) => item.state.isOpen);
        if (selectedItem) {
            selectedItem = selectedItem[1];
        }

        const { clientProjects } = this.state;
        const sortedClients = Object.keys(clientProjects).sort();
        const projectFavorites = this.editForm.isProjectFavorites;
        let str = "";

        if (clientProjects['NO-PROJECT'] && clientProjects['NO-PROJECT'].length > 0) {
            str += '<li><ul class="clockify-drop-down-2">';
            const arr = [];
            clientProjects['NO-PROJECT']              
                .map(project => {
                    const Item = selectedItem && selectedItem.project.id === project.id ? selectedItem : new ClockifyProjectItem(project, projectFavorites);
                    this.state.Items[project.id] = Item;
                    arr.push(Item.render(!!selectedItem));
                })
            str += arr.join('');
            str += '</ul></li>';
        }

        if (clientProjects['FAVORITES'] && clientProjects['FAVORITES'].length > 0) {
            str += '<li><ul class="clockify-drop-down-2">' + 
                        `<li class="clockify-project-list-client"><i>${clockifyLocales.FAVORITES.toUpperCase()}</i></li>`;
            const arr = [];
            clientProjects['FAVORITES']              
                .map(project => {
                    const Item = selectedItem && selectedItem.project.id === project.id ? selectedItem : new ClockifyProjectItem(project, projectFavorites);
                    this.state.Items[project.id] = Item;
                    arr.push(Item.render(!!selectedItem));
                })
            str += arr.join('');
            str += '</ul></li>';
        }

        if (clientProjects['WITHOUT-CLIENT'] && clientProjects['WITHOUT-CLIENT'].length > 0) {
            str += '<li><ul class="clockify-drop-down-2">' + 
                        `<li class="clockify-project-list-client"><i>${clockifyLocales.WITHOUT_CLIENT}</i></li>`;
            const arr = [];
            clientProjects['WITHOUT-CLIENT']              
                .map(project => {
                    const Item = selectedItem && selectedItem.project.id === project.id ? selectedItem : new ClockifyProjectItem(project, projectFavorites);
                    this.state.Items[project.id] = Item;
                    arr.push(Item.render(!!selectedItem));
                })
            str += arr.join('');
            str += '</ul></li>';
        }

        sortedClients.filter(client => !['FAVORITES', 'NO-PROJECT', 'WITHOUT-CLIENT'].includes(client)).map(client => {
            str += '<li><ul class="clockify-drop-down-2">' + 
                        `<li class="clockify-project-list-client"><i>${client}</i></li>`;
            const arr = [];
            clientProjects[client]              
                .map(project => {
                    const Item = selectedItem && selectedItem.project.id === project.id ? selectedItem : new ClockifyProjectItem(project, projectFavorites);
                    this.state.Items[project.id] = Item;
                    arr.push(Item.render(!!selectedItem));
                })
            str += arr.join('');
            str += '</ul></li>';
        })

        if (this.state.loadMore) {
            str += `<button class='clockify-list-load' id='clockifyLoadMoreProjects'>${clockifyLocales.LOAD_MORE}</button>`;
        }
        
		const ul = this.getDropDownPopupElem('#ulClockifyProjectDropDown');
        ul.innerHTML = str;
        if (projectFavorites) {
            setTimeout(() => {
                Array.from($$("a.clockify-dropdown-star", ul)).map(a => {
                    // no-project has no star
                    if (a) {
                        a.style.backgroundImage = this.getStar(a);                   
                        a.addEventListener('mouseenter', e => {
                            a.style.backgroundImage = this.getStar(null);
                        });
                        a.addEventListener('mouseleave', e => {
                            a.style.backgroundImage = this.getStar(a);
                        });
                    }   
                }); 
            });
        }
    }


    selectProjectItem(e, id) {
        if (e)
            e.stopPropagation();
        this.state.Items[id].select(e);
    }

    toggleProjectItem(id) {
        this.state.Items[id].toggle();
    }

    toggleFavorite(id) {
        this.state.Items[id].toggleFavorite(id);
        this.setState({cleanOnClose: true}, false);
    }

    onUpdateFavorite(id, favorite) {
        this.state.projectList.map(p => {
            if (p.id === id)
                p.favorite = favorite;
        })
    }

    closeAll() {
        const Items = this.state.Items;
        Object.keys(Items).forEach(key => {
            if (Items[key] && Items[key].state.isOpen) 
                Items[key].close();
        });
    }


    clean() {
        const Items = this.state.Items;
        Object.keys(Items).forEach(key => {
            if (Items[key]) {
                Items[key].clean();
                Items[key] = null;
            }
        });
        if (this.dropDownPopupElem)  // ever dropped
            this.getElem('#ulClockifyProjectDropDown').innerHTML = "";
    }

    chooseTask(el) {  // e
        //const el = e.target;
        const itemId = el.id.replace("task_li_", "")
        const li = el.parentNode.parentNode.previousSibling;
        const id = li.id.replace("li_", "");
        const projectItem = this.state.Items[id];
        const taskList = projectItem.state.taskList;
        const taskItem = taskList.state.Items[itemId]
        // e.stopPropagation();
        this.selectTask(taskItem.props, projectItem.project);
    }  


    loadMoreTasks(el) {
        //const el = e.target;
        const itemId = el.id.replace("task_li_", "").replace("_load_more", "")
        const li = el.parentNode.parentNode.previousSibling;
        const id = li.id.replace("li_", "");
        const projectItem = this.state.Items[id];
        // e.stopPropagation();
        el.style.display = 'none';
        projectItem.loadProjectTasks(true);
    }

    selectTask(task, project) {
        if(this.state.manualMode){
            this.editForm.editProjectManualMode(project);
            this.editForm.editTaskManualMode(task, project);
            this.mapSelectedProject(project.id);
                //this.redrawHeader();
            this.setState({
                selectedProject: project,
                selectedTaskName: task.name, //task.props.name,
                isOpen: false
            });
            this.setState({
                title: this.createTitle()
            });
            this.redrawHeader();
            this.close();
            this.setState({cleanOnClose: true}, false);  
        }else{
            this.editForm.editTask(task, project)
            .then(timeEntry => {
                //this.redrawHeader();
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
                // this.close();
                // this.setState({cleanOnClose: true}, false);         
            }
        );
        
        this.close();
        this.setState({cleanOnClose: true}, false);   
                this.setState({cleanOnClose: true}, false);         
        this.setState({cleanOnClose: true}, false);   
        
        }
    }

    selectProject(project) {
        if(this.state.manualMode){
            this.editForm.editProjectManualMode(project);
            let projectList; // = this.state.projectList;
            if (project.id && !this.wsSettings.forceProjects) {
                if (this.state.projectList.find(project => project.id === "no-project")) {
                    projectList = [_clockifyNoProjectObj(), ...this.state.projectList]
                } else {
                    projectList = this.state.projectList
                }
            } else {
                projectList = this.state.projectList.filter(project => project.id !== "no-project")
            }
            this.setState({
                selectedProject: project,
                selectedTaskName: '',
                isOpen: false,
                projectList
            });
            this.setState({
                title: this.createTitle()
            });
            this.mapSelectedProject(project.id);
            this.redrawHeader();
                    this.close();
            this.setState({cleanOnClose: true}, false);
        } else {
                this.editForm.editProject({
                    id: project.id === 'no-project' ? null : project.id, 
                    name: project.name
                })
                .then(timeEntry => {
                                //this.mapSelectedProject();
                    //this.redrawHeader();
                    let projectList; // = this.state.projectList;
                    if (project.id && !this.wsSettings.forceProjects) {
                        if (this.state.projectList.find(project => project.id === "no-project")) {
                            projectList = [_clockifyNoProjectObj(), ...this.state.projectList]
                        } else {
                            projectList = this.state.projectList
                        }
                    } else {
                        projectList = this.state.projectList.filter(project => project.id !== "no-project")
                    }
                                this.setState({
                        selectedProject: project,
                        selectedTaskName: '',
                        isOpen: false,
                        projectList
                    });
                    this.setState({
                        title: this.createTitle()
                    });
                    this.mapSelectedProject();
                    this.redrawHeader();
                    // this.close();        

                    //if (project.id === 'no-project')
                    // this.setState({cleanOnClose: true}, false);
                }
            );
            this.close();        
            this.setState({cleanOnClose: true}, false);
        }
    }


}

