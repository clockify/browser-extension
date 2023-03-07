import { isOffline } from '../components/check-connection';
import { getBrowser } from './browser-helper';

export class TimeEntryHelper {
	async updateProjectTask(timeEntry, projectDB, taskDB) {
		if (await isOffline()) return null;
		 
		if (taskDB) {
			return getBrowser()
				.runtime.sendMessage({
					eventName: 'editTask',
					options: {
						task: taskDB.id,
						project: projectDB.id,
						id: timeEntry.id,
					},
				})
				.then((response) => {
					const entry = response.data;
					getBrowser().runtime.sendMessage({
						eventName: 'editBillable',
						options: {
							id: entry.id,
							billable: projectDB.billable,
						},
					});
					return Object.assign(entry, {
						billable: projectDB.billable,
						project: entry.project ? entry.project : projectDB,
						task: entry.task ? entry.task : taskDB,
					});
				})
				.catch((error) => {});
		} else {
			 
			return getBrowser()
				.runtime.sendMessage({
					eventName: 'editProject',
					options: {
						project: projectDB.id,
						id: timeEntry.id,
					},
				})
				.then((response) => {
					 
					const entry = response.data; // not possible to use entry.project prop
					getBrowser().runtime.sendMessage({
						eventName: 'editBillable',
						options: {
							id: entry.id,
							billable: projectDB.billable,
						},
					});
					return Object.assign(entry, {
						project: entry.project ? entry.project : projectDB,
						billable: projectDB.billable,
					});
				})
				.catch((error) => {
					 
					// this.notifyError(error);
				});
		}
	}
}
