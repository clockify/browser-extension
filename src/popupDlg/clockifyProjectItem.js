// ------------
// ProjectItem
// ------------

var ClockifyProjectItem = class {

    constructor(project, projectFavorites) {
        this.project = project;
        this.loadingTasks = false;
        this.state = {
            name: project.name,
            projectId: project.id,
            favorite: project.favorite,
            client: project.client,
            isOpen: false,
            taskCount: project.taskCount,
            tasks: project.tasks,
            taskList: project.taskCount > 0 
                ? new ClockifyTaskList({ taskCount : project.taskCount })
                : null,
            projectFavorites,
        }
        this.page = 1;
    }

    setState(obj) {
        Object.assign(this.state, obj)
        this.renderContent()
    }

    select() {
        _clockifyProjectList.selectProject(this.project);
        _clockifyProjectList.closeAll();
        //this.toggle();
    }

    toggle() {
        const wasOpen = this.state.isOpen;
        _clockifyProjectList.closeAll()
        if (!wasOpen) {
            if (this.state.taskList && this.state.taskList.nItems === 0) {
                if (this.state.tasks.length > 0) {
                    const li = _clockifyProjectList.getDropDownPopupElem('#li_'+ this.project.id);
                    this.state.taskList.setItems(li.nextSibling, this.state.tasks);    
                }
                else if (!this.loadingTasks) {
                    this.loadingTasks = true;
                    this.loadProjectTasks();
                }
            }
            this.setState({ isOpen: !this.state.isOpen })
        }
    }

    toggleFavorite(id) {
        const { projectId, favorite } = this.state;

        const eventName = favorite
            ? 'removeProjectAsFavorite'
            : 'makeProjectFavorite';

        aBrowser.runtime.sendMessage({
            eventName,
            options: { 
                projectId
            }
        }, (response) => {
            if (!response) {
                alert(clockifyLocales.YOU_MUST_BE_LOGGED_IN_TO_START);
                return;
            }
            this.setState({
                favorite: !favorite
            })
            _clockifyProjectList.onUpdateFavorite(id, !favorite); 
        });
    }


    loadProjectTasks(loadMore) {
        aBrowser.runtime.sendMessage({
            eventName: 'getProjectTasks',
            options: { 
                projectId: this.state.projectId,
                filter: '', 
                page: this.page
            }
        }, (response) => {
            this.loadingTasks = false;
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
                if (_clockifyProjectList) {
                    const li = _clockifyProjectList.getDropDownPopupElem('#li_'+ this.project.id);
                    const idList = [];
                    li.nextSibling.querySelectorAll('ul > li').forEach(el => idList.push(el.id));
                    if(idList.length){
                        return;
                    }
                    this.state.taskList.setItems(li.nextSibling, response.data.taskList);
                    this.page++;
                }
            }
        });
    }

    close() {
        this.setState({ isOpen: false });
        this.renderContent();
    }

    get Item() {
        return `_clockifyProjectList.state.Items['${this.project.id}']`
    } 

    get itemTasks() {
        const { taskCount, isOpen } = this.state;
        return taskCount > 0 
            ? `<span id='imgClockifyTasksArrow'>${clockifyLocales.TASKS_NUMBER(taskCount)}</span>` +
              "<img id='imgClockifyTasksArrow'" +
                    ` class='clockify-tasks-arrow ${isOpen?'clockify-down':'clockify-right'}'` + 
                    ` src='${aBrowser.runtime.getURL(`assets/images/filter-arrow-${isOpen?'down':'right'}.png`)}'` +
                    " alt='Expand' />"
            : '<span></span>'
    }

    get InnerHTML() {
        const { projectId, name, isOpen, favorite, client, projectFavorites } = this.state;
        let title = name;
        let clientName = "";
        if (projectFavorites && favorite) {
            if (client && client.name) {
                title += `\n ${clockifyLocales.GLOBAL__CLIENT_LABEL}: ` + client.name;
                clientName = '<i> - ' + client.name + '</i>';
            }
            else {
                title += `\n ${clockifyLocales.WITHOUT_CLIENT}`;
            }
        }        
        let str =
            `<ul class='clockify-project-item' title="${title}">
                <li class='clockify-project-item-dot' style='background: ${this.project.color}'></li>
                <li class='clockify-project-item-name' id='clockifyProjectItemName' tabIndex='0' title="${title}">
                    ${name} ${clientName}
                </li>
                <li class='clockify-project-item-tasks' title=${clockifyLocales.EXPAND}>${this.itemTasks}</li>
                ${projectFavorites 
                    ? `<li class='clockify-project-item-favorite' title=${clockifyLocales.FAVORITE}>
                        ${ projectId !== 'no-project' ?
                            `<a id='clockifyFavoriteStar'
                                class="clockify-dropdown-star ${favorite?'clockify-active':'clockify-normal'}" 
                                style="display: inline-block">
                            </a>`
                            : ''
                        }
                    </li>`
                    : ''
                }
            </ul>`;
        return str;
    }

 
    render(isOpen = false) {
        const li1 = 
            `<li id='li_${this.project.id}' class='clockify-project-item'>` + 
                this.InnerHTML +
            "</li>";
        const li2 = this.state.taskList ? this.state.taskList.render(isOpen) : "";
        return li1 + li2
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
        const el = _clockifyProjectList.getDropDownPopupElem('#li_'+ this.project.id);
        // el.setAttribute('class', this.state.isOpen ? 'clockify-project-item' : 'clockify-project-item')
        if (!el)
            return;
        el.innerHTML = this.InnerHTML;

        if (this.state.projectFavorites) {
            setTimeout(() => {
                const a = $("a.clockify-dropdown-star", el)
                if (a) {  // no-project has no star
                    a.style.backgroundImage = this.getStar(a);
                    a.addEventListener('mouseenter', e => {
                        a.style.backgroundImage = this.getStar(null);
                    });
                    a.addEventListener('mouseleave', e => {
                        a.style.backgroundImage = this.getStar(a);
                    });
                }
            });
        }

        if (this.state.taskList) {
            this.state.taskList.toggleTaskList(el, this.state.isOpen);
        }
    }
	
    clean() {
        if (this.state.taskList)
            this.state.taskList.clean()
    }
}
