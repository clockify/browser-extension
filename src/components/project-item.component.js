import * as React from 'react';

const pageSize = 50;

class ProjectItem extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            isTaskOpen: false,
            taskCount: props.project.taskCount,
            tasks: [],
            taskList: props.project.tasks ? [...props.project.tasks] : [],
            favorite: props.project.favorite,
            client: props.project.client,
            projectFavorites: props.projectFavorites,
            page: 1,
            loadMore: false
        }

        this.chooseProject = this.chooseProject.bind(this);
        this.openTasks = this.openTasks.bind(this);

        this.toggleFavorite = this.toggleFavorite.bind(this); 

        this.getMyTasks = this.getMyTasks.bind(this);
    }

    componentDidMount(){
    }

    getMyTasks() {
        const { page } = this.state;
        this.props.getProjectTasks(this.props.project.id, '', page)
            .then(response => {
                this.setState({
                    tasks: [...this.state.tasks, ...response.data],
                    isTaskOpen: page === 1 ? !this.state.isTaskOpen : this.state.isTaskOpen,
                    loadMore: response.data.length >= pageSize ? true : false,
                    page: page + 1
                });
            })
            .catch(() => {
            });
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
                    this.getMyTasks()
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

    toggleFavorite() {
        const { project } = this.props;
        const { favorite } = this.state;
        if (favorite) {
           this.props.removeProjectAsFavorite(project.id)
           .then(() => {
               this.setState({
                   favorite : false
               })    
           })
        }
        else {
            this.props.makeProjectFavorite(project.id)
                .then(() => {
                    this.setState({
                        favorite : true
                    })    
                })
        }
    }

    render(){
        const {project, noTasks} = this.props;
        const { taskCount, isTaskOpen, favorite, client, projectFavorites } = this.state;
        let name = project.name;
        let title = project.name;
        let clientName = "";
        if (projectFavorites && favorite) {
            if (client && client.name) {
                clientName = ' - ' + client.name;
                title += '\n Client: ' + client.name;
            }
            else {
                title += '\n Without client';
            }
        }
        const forceTasksButNotLastUsedProject = 
                this.props.workspaceSettings.forceTasks  && !this.props.isLastUsedProject
        return(
            <div>
                <ul className="project-item" title={title}>
                    <li className='project-item-dot' style={{background: project.color}}></li>
                    <li 
                        className='project-item-name'
                        onClick={forceTasksButNotLastUsedProject ? this.openTasks : this.chooseProject}
                        tabIndex={"0"} 
                        title={title}
                        onKeyDown={e => {if (e.key==='Enter') forceTasksButNotLastUsedProject
                            ? this.openTasks()
                            : this.chooseProject()
                        }}
                    >
                        {name} <i>{clientName}</i>
                    </li>
                    { !noTasks &&
                        <li className="project-item-tasks" onClick={this.openTasks} title='Expand'>
                            { taskCount > 0 && 
                                <span style={{float: 'right', paddingRight: '5px'}}>
                                    {taskCount + ' Tasks'}
                                    { isTaskOpen 
                                        ? <img src="./assets/images/filter-arrow-down.png" className="tasks-arrow-down" />
                                        : <img src="./assets/images/filter-arrow-right.png" className="tasks-arrow-right" />
                                    }
                                </span>
                            }
                            { taskCount === 0 && 
                                <span>
                                </span>
                            }
                        </li>
                    }
                    {projectFavorites &&
                        <li className='project-item-favorite' title='Favorite'>
                            { project.id !== 'no-project' &&
                                <a style={{display: 'inline-block'}}
                                    className={`cl-dropdown-star ${favorite ? 'cl-active' : ''}`} onClick={this.toggleFavorite}>
                                </a>
                            }
                        </li>
                    }
                </ul>
                <div className={this.state.isTaskOpen && !noTasks ? "task-list" : "disabled"}>
                    {this.state.tasks.map(task => {
                        return(
                            <div key={task.id} value={JSON.stringify(task)} onClick={this.chooseTask.bind(this)} className="task-item">
                                <span value={JSON.stringify(task)}>{task.name}</span>
                            </div>
                        )
                    })}
                    { this.state.loadMore &&
                        <div key='load-more' className="project-list-load task-item" style={{marginTop:'0px'}} onClick={this.getMyTasks}>
                            Load more
                        </div>
                    }
                </div>
            </div>
        )
    }
}

export default ProjectItem;