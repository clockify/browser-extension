import * as React from 'react';

class ProjectItem extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            isTaskOpen: false,
            taskCount: props.project.taskCount,
            tasks: [],
            taskList: props.project.tasks ? [...props.project.tasks] : [],
        }

        this.chooseProject = this.chooseProject.bind(this);
        this.openTasks = this.openTasks.bind(this);
    }

    componentDidMount(){
    }

    openTasks(e) {
        e.preventDefault();

        if (this.state.tasks.length === 0) {
            if (this.state.taskList.length > 0) {
                this.setState({
                    tasks: [...this.state.taskList],
                    isTaskOpen: !this.state.isTaskOpen
                });
            }
            else {
                if (!JSON.parse(localStorage.getItem('offline'))) {
                    this.props.getProjectTasks(this.props.project.id, '', 1)
                        .then(response => {
                            this.setState({
                                tasks: response.data,
                                isTaskOpen: !this.state.isTaskOpen
                            });
                        })
                        .catch(() => {
                        });
                }
            }
        }
        else {
            this.setState({
                isTaskOpen: !this.state.isTaskOpen
            })
        }            
    }

    chooseProject() {
        this.props.selectProject(this.props.project);
    }

    chooseTask(event) {
        let task = JSON.parse(event.target.getAttribute("value"));
        this.props.selectTask(task, this.props.project);
    }

    render(){
        const {project, noTasks} = this.props;
        const forceTasksButNotLastUsedProject = 
                this.props.workspaceSettings.forceTasks  && !this.props.isLastUsedProject
        return(
            <div>
                <div className="project-item" title={project.name}>
                    <span className="project-item-name"
                        onClick={forceTasksButNotLastUsedProject ? this.openTasks : this.chooseProject}>
                        <span style={{background: project.color}} className="dot-project-picker"></span>
                        <span 
                            className={!noTasks ? "project-name" : "disabled"}
                            tabIndex={"0"} 
                            onKeyDown={e => {if (e.key==='Enter') forceTasksButNotLastUsedProject
                                    ? this.openTasks()
                                    : this.chooseProject()
                            }}
                        >
                            {project.name}
                        </span>
                        <span className={noTasks ? "project-name" : "disabled"}>
                            {project.name}
                        </span>
                    </span>
                    <span className={this.state.taskCount > 0 ? "" : "disabled"}
                          onClick={this.openTasks}>
                        <span className={noTasks ? "disabled" : "project-item-task"}>
                            {this.state.taskCount + "  Tasks"}
                            <img src="./assets/images/filter-arrow-down.png"
                                 className={this.state.isTaskOpen ? "tasks-arrow-down" : "disabled"}/>
                            <img src="./assets/images/filter-arrow-right.png"
                                 className={!this.state.isTaskOpen ? "tasks-arrow-right" : "disabled"}/>
                        </span>
                    </span>
                </div>
                <div className={this.state.isTaskOpen && !noTasks ? "task-list" : "disabled"}>
                    {this.state.tasks.map(task => {
                        return(
                            <div key={task.id} value={JSON.stringify(task)} onClick={this.chooseTask.bind(this)} className="task-item">
                                <span value={JSON.stringify(task)}>{task.name}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }
}

export default ProjectItem;