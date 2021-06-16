// ------------
// ProjectItem
// ------------

var ClockifyProjectItem = class {

    constructor(props) {
        this.props = props;
        this.state = {
            name: props.name,
            projectId: props.id,
            isOpen: false,
            taskCount: props.taskCount,
            tasks: props.tasks,
            taskList: props.taskCount > 0 
                ? new ClockifyTaskList({ taskCount : props.taskCount })
                : null
        }
    }

    setState(obj) {
        Object.assign(this.state, obj)
        this.renderContent()
    }

    select() {
        _clockifyProjectList.selectProject(this.props);
        _clockifyProjectList.closeAll();
        this.toggle();
    }

    toggle() {
        const wasOpen = this.state.isOpen;
        _clockifyProjectList.closeAll()
        if (!wasOpen) {
            if (this.state.taskList && this.state.taskList.nItems === 0) {
                if (this.state.tasks.length > 0) {
                    const li = _clockifyProjectList.getDropDownPopupElem('#li_'+ this.props.id);
                    this.state.taskList.setItems(li.nextSibling, this.state.tasks);    
                }
                else {
                    this.loadProjectTasks();
                }
            }
            this.setState({ isOpen: !this.state.isOpen })
        }
    }

    loadProjectTasks() {
        aBrowser.runtime.sendMessage({
            eventName: 'getProjectTasks',
            options: { 
                projectId: this.state.projectId,
                filter: '', 
                page: 1
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
                const li = _clockifyProjectList.getDropDownPopupElem('#li_'+ this.props.id);
                this.state.taskList.setItems(li.nextSibling, response.data.taskList);    
            }
        });
    }

    close() {
        this.setState({ isOpen: false });
        this.renderContent();
    }

    get Item() {
        return `_clockifyProjectList.state.Items['${this.props.id}']`
    } 

    get itemTasks() {
        //const taskList = this.state.taskList;
        // if (taskList && taskList.state.items.length > 0)
        const { taskCount } = this.state;
        if (taskCount > 0)
            // return taskList.state.items.length.toString() + " tasks " + 
            return taskCount.toString() + " tasks " + 
                "<span class='clockify-tasks-arrow-span'>" + 
                    "<img id='imgClockifyTasksArrow' class='clockify-tasks-arrow'" +
                    ` src='${aBrowser.runtime.getURL('assets/images/filter-arrow-right.png')}' alt='Expand'>` +
                "</span>";
        return "";
    }

    get InnerHTML() {
        let str = 
            "<span class='clockify-project-item-name' id='clockifyProjectItemName'>" + 
                `<span style='background: ${this.props.color}' class='dot-project-picker'></span>` + 
                `<span class="clockify-project-name">${this.state.name}</span>` + 
            "</span>" +
            "<span class='clockify-project-item-task' id='clockifyProjectItemTask'>" + this.itemTasks + "</span>";
        return str;
    }

 
    render() {
        const li1 = 
            `<li id='li_${this.props.id}' class='clockify-project-item'>` + 
                this.InnerHTML +
            "</li>";
        const li2 = this.state.taskList ? this.state.taskList.render() : ""
        return li1 + li2
    }

    renderContent() { 
        const el = _clockifyProjectList.getDropDownPopupElem('#li_'+ this.props.id);
        // el.setAttribute('class', this.state.isOpen ? 'clockify-project-item' : 'clockify-project-item')
        el.innerHTML = this.InnerHTML;
        if (this.state.taskList) {
            this.state.taskList.toggleTaskList(el, this.state.isOpen);
        }
    }

    clean() {
        if (this.state.taskList)
            this.state.taskList.clean()
    }
}
