import {ProjectService} from "../services/project-service";
import {WorkspaceService} from "../services/workspace-service";
import {getDefaultProjectEnums} from "../enums/default-project.enum";
import {getWorkspacePermissionsEnums} from "../enums/workspace-permissions.enum";
import {checkConnection} from "../components/check-connection";
import {LocalStorageService} from "../services/localStorage-service";

const projectService = new ProjectService();
const workspaceService = new WorkspaceService();
const localStorageService = new LocalStorageService();

export class ProjectHelpers {
    constructor() {
    }

    isDefaultProjectAvailableToUser(project) {
        if (!project) {
            return Promise.resolve(false);
        }
        const userId = localStorage.getItem('userId');
        return workspaceService.getPermissionsForUser().then(workspacePermissions => {
            if (project.archived) {
                return false;
            }

            const filteredWorkspacePermissions = workspacePermissions.filter(permission =>
                permission.name === getWorkspacePermissionsEnums().WORKSPACE_OWN ||
                permission.name === getWorkspacePermissionsEnums().WORKSPACE_ADMIN
            );
            const projectMemberships = project.memberships.filter(membership =>
                membership.membershipStatus === "ACTIVE" && membership.userId === userId);
            if (filteredWorkspacePermissions.length > 0 ||
                projectMemberships.length > 0 ||
                project.public) {
                return true;
            }
            return false;
        });
    }

    getLastUsedProjectFromTimeEntries() {
        return projectService.getLastUsedProject().then(response => {
            if (response.data.length > 0) {
                return response.data[0];
            } else {
                return Promise.resolve(null);
            }
        });
    }

    getDefaultProject() {
        if (checkConnection()) {
            return Promise.resolve(null);
        }
        const activeWorkspaceId = localStorage.getItem('activeWorkspaceId');
        const defaultProjects = this.getDefaultProjectListFromStorage();

        if (defaultProjects && defaultProjects.length === 0) {
            return Promise.resolve(null);
        }

        const defaultProjectForWorkspace =
            this.filterProjectsByWorkspace(defaultProjects, activeWorkspaceId);

        if (!defaultProjectForWorkspace) {
            return Promise.resolve(null);
        }

        if (
            defaultProjectForWorkspace &&
            defaultProjectForWorkspace.project &&
            defaultProjectForWorkspace.project.id ===
                getDefaultProjectEnums().LAST_USED_PROJECT
        ) {
            return this.getLastUsedProjectFromTimeEntries();
        }

        return this.isDefaultProjectAvailableToUser(defaultProjectForWorkspace.project).then(available => {
            return available ? defaultProjectForWorkspace.project : null;
        });
    }

    setDefaultProjectToEntryIfNotSet(timeEntry) {
        if (!timeEntry.projectId) {
            return this.getDefaultProject().then(project => {
                timeEntry.projectId = project.id || null;
                return timeEntry;
            });
        }

        return Promise.resolve(timeEntry);
    }

    setDefaultProjectsToStorage(defaultProjects) {
        localStorage.setItem(
            getDefaultProjectEnums().DEFAULT_PROJECTS,
            JSON.stringify(defaultProjects)
        );
    }

    getDefaultProjectListFromStorage() {
        let defaultProjects = localStorage.getItem(getDefaultProjectEnums().DEFAULT_PROJECTS);

        return defaultProjects ? JSON.parse(defaultProjects) : [];
    }

    clearDefaultProjectForWorkspace(activeWorkspaceId) {
        let defaultProjects = this.getDefaultProjectListFromStorage();

        if (defaultProjects.length > 0) {
            const defaultProject = this.filterProjectsByWorkspace(defaultProjects, activeWorkspaceId);

            if (defaultProject) {
                defaultProjects.splice(defaultProjects.indexOf(defaultProject), 1);
                localStorage.setItem(
                    getDefaultProjectEnums().DEFAULT_PROJECTS,
                    JSON.stringify(defaultProjects)
                );
            }
        }
    }

    filterProjectsByWorkspace(defaultProjects, activeWorkspaceId) {
        return defaultProjects
            .filter((defProject) => defProject.workspaceId === activeWorkspaceId)[0];
    }

    async getProjectForButton(projectName) {
        let project;
        const page = 0;
        const pageSize = 1;

        if (!!projectName) {
            const isSpecialFilter =
                localStorageService.get('workspaceSettings') ?
                    JSON.parse(localStorageService.get('workspaceSettings')).projectPickerSpecialFilter : false;
            if (isSpecialFilter) {
                projectName = '@' + projectName;
            }

            project = await projectService.getProjectsWithFilter(projectName, page, pageSize).then(response => {
                return response.data.filter(project => project.name === projectName)[0];
            });
        } else if (!projectName || !project){
            project = await this.getDefaultProject();
        }

        return project;
    }
}