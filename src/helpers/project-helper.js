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
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        const userId = localStorageService.get('userId');
        const defaultProjects = this.getDefaultProjectListFromStorage();

        if (defaultProjects && defaultProjects.length === 0) {
            return Promise.resolve(null);
        }

        const defaultProjectForWorkspaceAndUser =
            this.filterProjectsByWorkspaceAndUser(defaultProjects, activeWorkspaceId, userId);

        if (!defaultProjectForWorkspaceAndUser || !defaultProjectForWorkspaceAndUser.enabled) {
            return Promise.resolve(null);
        }

        if (
            defaultProjectForWorkspaceAndUser &&
            defaultProjectForWorkspaceAndUser.project &&
            defaultProjectForWorkspaceAndUser.project.id ===
                getDefaultProjectEnums().LAST_USED_PROJECT
        ) {
            return this.getLastUsedProjectFromTimeEntries();
        }

        return this.isDefaultProjectAvailableToUser(defaultProjectForWorkspaceAndUser.project).then(available => {
            return available ? defaultProjectForWorkspaceAndUser.project : null;
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
        let project;

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
                    return project ? project : this.getDefaultProject();
                } else {
                    return this.getDefaultProject();
                }
            });
        } else {
            return this.getDefaultProject();
        }
    }
}