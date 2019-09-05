import * as React from 'react';

class ProjectItem extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            isTaskOpen: false
        }
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
        return(
            <div>
                <div className="project-item">
                    <span className="project-item-name">
                        <span style={{background: this.props.project.color}} className="dot-project-picker"></span>
                        <span onClick={!this.props.workspaceSettings.forceTasks ?
                            this.chooseProject.bind(this) : this.openTasks.bind(this)}
                              className={!this.props.noTasks ? "project-name" : "disabled"}>
                            {this.props.project.name}
                        </span>
                        <span onClick={this.chooseProject.bind(this)}
                              className={this.props.noTasks ? "project-name" : "disabled"}>
                            {this.props.project.name}
                        </span>
                    </span>
                    <span className={this.props.project.tasks.length > 0 ? "" : "disabled"}
                          onClick={this.openTasks.bind(this)}>
                        <span className={this.props.noTasks ? "disabled" : "project-item-task"}>
                            {this.props.project.tasks.length + "  Tasks"}
                            <img src="./assets/images/filter-arrow-down.png"
                                 className={this.state.isTaskOpen ? "tasks-arrow-down" : "disabled"}/>
                            <img src="./assets/images/filter-arrow-right.png"
                                 className={!this.state.isTaskOpen ? "tasks-arrow-right" : "disabled"}/>
                        </span>
                    </span>
                </div>
                <div className={this.state.isTaskOpen && !this.props.noTasks ? "task-list" : "disabled"}>
                    {this.props.project.tasks.map(task => {
                        return(
                            <div value={JSON.stringify(task)} onClick={this.chooseTask.bind(this)} className="task-item">
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