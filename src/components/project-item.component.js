import * as React from 'react';

class ProjectItem extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            isTaskOpen: false
        }

        this.chooseProject = this.chooseProject.bind(this);
        this.openTasks = this.openTasks.bind(this);
    }

    componentDidMount(){
    }

    openTasks(e) {
        e.preventDefault();
        this.setState({
            isTaskOpen: !this.state.isTaskOpen
        })
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
        return(
            <div>
                <div className="project-item" title={project.name}>
                    <span className="project-item-name">
                        <span style={{background: project.color}} className="dot-project-picker"></span>
                        <span 
                            onClick={!this.props.workspaceSettings.forceTasks ?
                                this.chooseProject : this.openTasks}
                            className={!noTasks ? "project-name" : "disabled"}
                            tabIndex={"0"} 
                            onKeyDown={e => {if (e.key==='Enter') 
                                !this.props.workspaceSettings.forceTasks ?
                                this.chooseProject() : this.openTasks()
                            }}
                        >
                            {project.name}
                        </span>
                        <span onClick={this.chooseProject}
                              className={noTasks ? "project-name" : "disabled"}>
                            {project.name}
                        </span>
                    </span>
                    <span className={project.tasks.length > 0 ? "" : "disabled"}
                          onClick={this.openTasks}>
                        <span className={noTasks ? "disabled" : "project-item-task"}>
                            {project.tasks.length + "  Tasks"}
                            <img src="./assets/images/filter-arrow-down.png"
                                 className={this.state.isTaskOpen ? "tasks-arrow-down" : "disabled"}/>
                            <img src="./assets/images/filter-arrow-right.png"
                                 className={!this.state.isTaskOpen ? "tasks-arrow-right" : "disabled"}/>
                        </span>
                    </span>
                </div>
                <div className={this.state.isTaskOpen && !noTasks ? "task-list" : "disabled"}>
                    {project.tasks.map(task => {
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