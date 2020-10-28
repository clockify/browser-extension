import {ProjectService} from "../services/project-service";
import {WorkspaceService} from "../services/workspace-service";
import {getDefaultProjectEnums} from "../enums/default-project.enum";
import {getWorkspacePermissionsEnums} from "../enums/workspace-permissions.enum";
import {checkConnection} from "../components/check-connection";
import {LocalStorageService} from "../services/localStorage-service";
import {getLocalStorageEnums} from "../enums/local-storage.enum";

const projectService = new ProjectService();
const workspaceService = new WorkspaceService();
const localStorageService = new LocalStorageService();

export class ProjectHelper {
    constructor() {
    }

    async getLastUsedProjectFromTimeEntries() {
        return projectService.getLastUsedProject().then(response => {
            if (response.data.length > 0) {
                return response.data[0];
            } else {
                return null;
            }
        });
    }

    async getProjectsByIds(projectIds) {
        return projectService.getProjectsByIds(projectIds).then(response => {
            if (response.data.length > 0) {
                return response.data[0];
            } else {
                return null;
            }
        });
    }

    createMessageForNoTaskOrProject(projects, isSpecialFilter, filter) {
        if (!isSpecialFilter || filter.length === 0 || projects.length > 0) return ""
        
        if (!filter.includes("@")) {
            return "No matching tasks. Search projects with @project syntax"
        } else {
            return "No matching projects"
        }
    }

    async getDefaultProject() {
        if (checkConnection()) {
            return null;
        }
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        const userId = localStorageService.get('userId');
        const defaultProjects = this.getDefaultProjectListFromStorage();

        if (defaultProjects && defaultProjects.length === 0) {
            return null;
        }

        const defaultProjectForWorkspaceAndUser =
            this.filterProjectsByWorkspaceAndUser(defaultProjects, activeWorkspaceId, userId);

        if (!defaultProjectForWorkspaceAndUser || !defaultProjectForWorkspaceAndUser.enabled) {
            return null;
        }

        if (
            defaultProjectForWorkspaceAndUser &&
            defaultProjectForWorkspaceAndUser.project &&
            defaultProjectForWorkspaceAndUser.project.id ===
                getDefaultProjectEnums().LAST_USED_PROJECT
        ) {
            return this.getLastUsedProjectFromTimeEntries();
        } else {
            const projectIds = [];
            projectIds.push(defaultProjectForWorkspaceAndUser.project.id);
            
            return this.getProjectsByIds(projectIds)
        }
    }

    setDefaultProjectToEntryIfNotSet(timeEntry) {
        if (!timeEntry.projectId) {
            return this.getDefaultProject().then(project => {
                timeEntry.projectId = project.id || null;
                return timeEntry;
            });
        }

        return timentry;
    }

    setDefaultProjectsToStorage(defaultProjects) {
        localStorageService.set(
            getDefaultProjectEnums().DEFAULT_PROJECTS,
            JSON.stringify(defaultProjects),
            getLocalStorageEnums().PERMANENT_PREFIX
        );
    }

    getDefaultProjectListFromStorage() {
        let defaultProjects = localStorageService.get(getDefaultProjectEnums().DEFAULT_PROJECTS);

        return defaultProjects ? JSON.parse(defaultProjects) : [];
    }

    setDefaultProject(defaultProject) {
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        const defaultProjects = this.getDefaultProjectListFromStorage();
        const defaultProjectForWorkspaceAndUser = this.getDefaultProjectOfWorkspaceForUser();
        const userId = localStorageService.get('userId');

        if (defaultProjectForWorkspaceAndUser) {
            const index = defaultProjects.findIndex(
                (defaultProject) => defaultProject.project.id === defaultProjectForWorkspaceAndUser.id);
            defaultProjects[index].project = defaultProject;
        } else {
            defaultProjects.push({
                workspaceId: activeWorkspaceId,
                userId: userId,
                project: defaultProject,
                enabled: true
            });
        }

        this.setDefaultProjectsToStorage(defaultProjects)
    }

    setLastUsedProjectAsDefaultProject() {
        let lastUsedProject = {};
        
        lastUsedProject.id = getDefaultProjectEnums().LAST_USED_PROJECT;
    
        this.setDefaultProject(lastUsedProject)
    }

    getDefaultProjectOfWorkspaceForUser() {
        const defaultProjects = this.getDefaultProjectListFromStorage();
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        const userId = localStorageService.get('userId');

        const defProject =
            this.filterProjectsByWorkspaceAndUser(defaultProjects, activeWorkspaceId, userId);

        return defProject && defProject.project && defProject.project.id ?
            defProject.project : null;
    }

    removeDefaultProjectForWorkspaceAndUser(activeWorkspaceId, userId) {
        let defaultProjects = this.getDefaultProjectListFromStorage();

        const defaultProject = this.filterProjectsByWorkspaceAndUser(defaultProjects, activeWorkspaceId, userId);

        if (defaultProject) {
            defaultProjects.splice(defaultProjects.indexOf(defaultProject), 1);
            localStorageService.set(
                getDefaultProjectEnums().DEFAULT_PROJECTS,
                JSON.stringify(defaultProjects),
                getLocalStorageEnums().PERMANENT_PREFIX
            );
        }
    }

    filterProjectsByWorkspaceAndUser(defaultProjects, activeWorkspaceId, userId) {
        return defaultProjects && defaultProjects.filter(defProject =>
                defProject.workspaceId === activeWorkspaceId && defProject.userId === userId).length > 0 ?
                defaultProjects.filter(defProject =>
                    defProject.workspaceId === activeWorkspaceId && defProject.userId === userId)[0] : null;
    }

    getProjectForButton(projectName) {
        const page = 0;
        const pageSize = 50;
        let projectFilter;
        let project = null;

        if (!!projectName) {
            const isSpecialFilter =
                localStorageService.get('workspaceSettings') ?
                    JSON.parse(localStorageService.get('workspaceSettings')).projectPickerSpecialFilter : false;
            if (isSpecialFilter) {
                projectFilter = '@' + projectName;
            } else {
                projectFilter = projectName;
            }

            return projectService.getProjectsWithFilter(projectFilter, page, pageSize).then(response => {
                if (response && response.data && response.data.length > 0) {
                    project = response.data.filter(project => project.name === projectName)[0];
                }

                if (project) {
                    return project;
                }

                if (JSON.parse(localStorageService.get('createObjects', false))) {
                    return projectService.createProject({
                        name: projectName,
                        color: "#03a9f4"
                    }).then(response => {
                        if (response.status === 201) {
                            return response.data;
                        } else {
                            // something went wrong, ignore and return default project
                            return this.getDefaultProject();
                        }
                    }).catch(error => {
                        console.error(error);
                        return this.getDefaultProject();
                    });
                } else {
                    return this.getDefaultProject();
                }
            });
        } else {
            return this.getDefaultProject();
        }
    }

    isDefaultProjectEnabled() {
        const defaultProjects = this.getDefaultProjectListFromStorage();
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        const userId = localStorageService.get('userId');

        const defProject =
            this.filterProjectsByWorkspaceAndUser(defaultProjects, activeWorkspaceId, userId);
        return defProject && defProject.enabled ? true : false
    }
}