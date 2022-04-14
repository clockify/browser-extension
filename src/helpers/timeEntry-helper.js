import {ProjectService} from "../services/project-service";
import {WorkspaceService} from "../services/workspace-service";
import {TimeEntryService} from "../services/timeEntry-service";
import {getDefaultProjectEnums} from "../enums/default-project.enum";
import {getWorkspacePermissionsEnums} from "../enums/workspace-permissions.enum";
import {isOffline} from "../components/check-connection";
import {LocalStorageService} from "../services/localStorage-service";
import {getLocalStorageEnums} from "../enums/local-storage.enum";
import {StorageUserWorkspace} from './storageUserWorkspace';

const projectService = new ProjectService();
const workspaceService = new WorkspaceService();
const localStorageService = new LocalStorageService();
const timeEntryService = new TimeEntryService();

export class TimeEntryHelper {
    constructor() {
    }

    async updateProjectTask(timeEntry, projectDB, taskDB) {
        if (await isOffline())
            return null;

        if (taskDB) {
            return timeEntryService.updateTask(taskDB.id, projectDB.id, timeEntry.id)
                .then(response => {
                    const entry = response.data;
                    timeEntryService.updateBillable(projectDB.billable, entry.id);
                    return Object.assign(entry, { 
                            billable: projectDB.billable,
                            project: entry.project ? entry.project : projectDB,
                            task: entry.task ? entry.task : taskDB
                        });
                })
                .catch((error) => {
                    console.log(error)
                });
        }
        else {
            return timeEntryService.updateProject(projectDB.id, timeEntry.id)
                .then(response => {
                    const entry = response.data; // not possible to use entry.project prop
                    timeEntryService.updateBillable(projectDB.billable, entry.id);
                    return Object.assign(entry, { 
                            project: entry.project ? entry.project : projectDB,
                            billable: projectDB.billable 
                        });
                })
                .catch(error => {
                    console.log('error', error);
                    // this.notifyError(error);
                });
            }
    }

}