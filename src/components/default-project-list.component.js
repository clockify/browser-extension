import * as React from 'react';
import ProjectItem from './project-item.component';
import {getDefaultProjectEnums} from "../enums/default-project.enum";
import {ProjectService} from "../services/project-service";
import {debounce} from "lodash";
import {LocalStorageService} from "../services/localStorage-service";

const projectService = new ProjectService();
const localStorageService = new LocalStorageService();
const pageSize = 50;

class ProjectList extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            isOpen: false,
            selectedProject: {
                name: "Select default project",
                color: this.getColorForProject()
            },
            projectList:
                [{
                    name: 'Last used project',
                    color: '#999999',
                    tasks: [],
                    id: getDefaultProjectEnums().LAST_USED_PROJECT
                }],
            page: 1,
            ready: false,
            loadMore: true,
            title: '',
            filter: ''
        };
        this.filterProjects = debounce(this.filterProjects, 500);
    }

    componentDidMount() {
        this.getProjects(this.state.page, pageSize);
    }

    getProjects(page, pageSize) {
        if (page === 1) {
            this.setState({
                projectList:[{
                    id: getDefaultProjectEnums().LAST_USED_PROJECT,
                    name: 'Last used project',
                    color: '#999999',
                    tasks: []
                }]
            })
        }
        if (!JSON.parse(localStorage.getItem('offline'))) {
            projectService.getProjectsWithFilter(this.state.filter, page, pageSize)
                .then(response => {
                    this.setState({
                        projectList: this.state.projectList.concat(response.data),
                        page: this.state.page + 1,
                        ready: true
                    }, () => {
                        if(!this.state.isOpen) {
                            this.mapSelectedProject();
                        }
                    });
                })
                .catch(() => {
                });
        } else {
            this.setState({
                ready: true
            })
        }
    }

    mapSelectedProject() {
        const selectedProject = this.props.selectedProject === 'lastUsedProject' ?
            {
                name: 'Last used project',
                color: '#999999',
                tasks: [],
                id: getDefaultProjectEnums().LAST_USED_PROJECT
            } :
        this.state.projectList.filter(p => p.id === this.props.selectedProject)[0];

        if (this.props.selectedProject && selectedProject) {
            this.setState({
                selectedProject: selectedProject
            }, () => {
                this.setState({
                    title: this.createTitle()
                });
            })
        } else {
            if (this.props.selectedProject) {
                const projectIds = [];
                projectIds.push(this.props.selectedProject);
                projectService.getProjectsByIds(projectIds).then(response => {
                    if (response.data.length > 0 && !response.data[0].archived) {
                        this.setState({
                            selectedProject: response.data[0]
                        }, () => {
                            this.setState({
                                title: this.createTitle()
                            });
                        });
                    }
                });
            } else {
                this.setState({
                    selectedProject: {
                        name: 'Select default project',
                        color: this.getColorForProject()
                    }
                }, () => {
                    this.setState({
                        title: this.createTitle()
                    });
                });
            }
        }
    }

    selectProject(project) {
        this.props.selectProject(project);

        this.setState({
                selectedProject: project,
                isOpen: false
            }, () => this.setState({
                title: this.createTitle()
            })
        );
    }

    openProjectDropdown() {
        if (!JSON.parse(localStorage.getItem('offline'))) {
            this.setState({
                isOpen: true,
                page: 1
            }, () => {
                document.getElementById('project-filter').focus();
                this.props.projectListOpened();
            });
        }
    }

    closeProjectList() {
        document.getElementById('project-dropdown').scroll(0, 0);
        this.setState({
            isOpen: false,
            page: 1,
            filter: ''
        }, () => {
            document.getElementById('project-filter').value = "";
            this.getProjects(this.state.page, pageSize);
        });
    }

    filterProjects() {
        this.setState({
            projectList: [{
                name: 'Last used project',
                color: '#999999',
                tasks: [],
                id: getDefaultProjectEnums().LAST_USED_PROJECT
            }],
            filter: document.getElementById('project-filter').value.toLowerCase(),
            page: 1
        }, () => {
            this.getProjects(this.state.page, pageSize);
        });
    }

    loadMoreProjects() {
        this.getProjects(this.state.page, pageSize);
    }

    createTitle() {
        let title = 'Select default project';
        if (this.state.selectedProject && this.state.selectedProject.id) {
            title = 'Project: ' + this.state.selectedProject.name;
        }

        return title;
    }

    clearProjectFilter() {
        this.setState({
            projectList:
            [{
                name: 'Last used project',
                color: '#999999',
                tasks: [],
                id: getDefaultProjectEnums().LAST_USED_PROJECT
            }],
            filter: '',
            page: 1
        }, () => {
            this.getProjects(this.state.page, pageSize);
            document.getElementById('project-filter').value = null
        });
    }

    getColorForProject() {
        const userId = localStorageService.get('userId');
        const darkModeFromStorage = localStorageService.get('darkMode') ?
            JSON.parse(localStorageService.get('darkMode')) : [];

        if (darkModeFromStorage.length > 0 &&
            darkModeFromStorage.filter(darkMode => darkMode.userId === userId && darkMode.enabled).length > 0
        ) {
            return '#90A4AE';
        } else {
            return '#999999';
        }
    }

    render() {
        if (!this.state.ready) {
            return null;
        } else {
            return (
                <div className="projects-list"
                     title={this.state.title}>
                    <div onClick={this.openProjectDropdown.bind(this)}
                         className={JSON.parse(localStorage.getItem('offline')) ?
                             "project-list-button-offline" : "project-list-button"}>
                        <span style={{color: this.state.selectedProject ? this.state.selectedProject.color : "#999999"}}
                              className="project-list-name">
                            {this.state.selectedProject ? this.state.selectedProject.name : "Select default project"}
                        </span>
                            <span className="project-list-arrow">
                        </span>
                    </div>
                    <div className={this.state.isOpen ? "project-list-open" : "disabled"}>
                        <div onClick={this.closeProjectList.bind(this)} className="invisible"></div>
                        <div className="project-list-dropdown"
                             id="project-dropdown">
                            <div className="project-list-dropdown--content">
                                <div className="project-list-input">
                                    <div className="project-list-input--border">
                                        <input
                                            placeholder={"Filter projects"}
                                            className="project-list-filter"
                                            onChange={this.filterProjects.bind(this)}
                                            id="project-filter"
                                        />
                                        <span className={!!this.state.filter ? "project-list-filter__clear" : "disabled"}
                                              onClick={this.clearProjectFilter.bind(this)}></span>
                                    </div>
                                </div>
                                {
                                    this.state.projectList.map(project => {
                                        return (
                                            <ProjectItem
                                                project={project}
                                                noTasks={true}
                                                selectProject={this.selectProject.bind(this)}
                                                workspaceSettings={this.props.workspaceSettings}
                                                isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
                                            />
                                        )
                                    })
                                }
                                <div className={this.state.loadMore ? "project-list-load" : "disabled"}
                                     onClick={this.loadMoreProjects.bind(this)}>Load more
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    }
}

export default ProjectList;