class ClockifyIntegrationBase {
	static async takeTimeEntryInProgress(sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline');
			return;
		}
		const { entry, error } = await TimeEntry.getEntryInProgress();
		if (!entry || error) {
			setTimeEntryInProgress(null);
			aBrowser.action.setIcon({
				path: iconPathEnded,
			});
		} else {
			setTimeEntryInProgress(entry);
			aBrowser.action.setIcon({
				path: iconPathStarted,
			});
		}
		sendResponse({ status: clockifyLocales.OK_BTN });
	}

	static async endInProgress(sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline');
			return;
		}
		const { error } = await TimeEntry.endInProgress();
		if (error) {
			sendResponse({ status: error.status });
		} else {
			aBrowser.notifications.clear('idleDetection');
			restartPomodoro();
			aBrowser.action.setIcon({
				path: iconPathEnded,
			});
			sendResponse({ status: clockifyLocales.OK_BTN });
		}
	}

	static async startWithDescription(timeEntryOptions, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline');
			return;
		}
		const { entry, error } = await TimeEntry.getEntryInProgress();
		if (error) {
			sendResponse({ status: error.status });
			return;
		}
		if (entry) {
			const { error } = await TimeEntry.endInProgress();
			if (error) {
				sendResponse({ status: error.status });
				return;
			}
		}
		const {
			data: ent,
			error: err,
			status,
		} = await TimeEntry.integrationStartTimerWithDescription(
			timeEntryOptions.description,
			timeEntryOptions
		);
		if (err) {
			sendResponse({ status: err.status });
		} else {
			if (status === 201) {
				aBrowser.action.setIcon({
					path: iconPathStarted,
				});
				addPomodoroTimer();
				if (!timeEntryOptions.manualMode) {
					aBrowser.storage.local.set({ timeEntryInProgress: ent });
				}
			}
			sendResponse({ status, data: ent });
		}
	}

	static async generateManualEntryData(
		{ projectName, taskName, tagNames },
		sendResponse
	) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline');
			return;
		}
		let project, task, tags;
		if (projectName) {
			let { projectDB } = await ProjectTaskService.getOrCreateProject(
				projectName
			);
			project = projectDB;

			if (project && taskName) {
				let { taskDB } = await ProjectTaskService.getOrCreateProjectAndTask(
					project.name,
					{ name: taskName }
				);
				task = taskDB;
			}
		}

		if (tagNames) {
			const { tagovi } = await TagService.getOrCreateTags(
				tagNames.map((tagName) => tagName.trim())
			);
			tags = tagovi;
		}

		sendResponse({ project, task, tags });
	}

	static async getProjectsByIds({ projectIds, taskIds }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline');
			return;
		}

		// const { entry, error } = await TimeEntry.getEntryInProgress();
		// if (error) {
		// 	sendResponse({
		// 		projectDB: null,
		// 		taskDB: null,
		// 		msg: error.message ? error.message : error.status,
		// 	});
		// 	return;
		// }
		const {
			projectDB,
			error: projectError,
			status,
		} = await ProjectTaskService.getProjectsByIds(projectIds, taskIds);
		if (projectError) {
			sendResponse(
				projectError.message ? projectError.message : projectError.status
			);
			return;
		}
		if (projectDB) {
			sendResponse({
				status,
				data: [projectDB],
			});
		} else {
			sendResponse({
				status,
				data: [],
			});
		}
	}

	static async getDefaultProjectTask(sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline');
			return;
		}

		// const { entry, error } = await TimeEntry.getEntryInProgress();
		// if (error) {
		// 	sendResponse({
		// 		projectDB: null,
		// 		taskDB: null,
		// 		msg: error.message ? error.message : error.status,
		// 	});
		// 	return;
		// }

		const { projectDB, taskDB, msg, msgId } =
			await DefaultProject.getProjectTaskFromDB();
		sendResponse({ projectDB, taskDB, msg, msgId });
	}

	static async getProjects(
		{ filter, page, pageSize, forceTasks, alreadyIds },
		sendResponse
	) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline');
			return;
		}

		// const { entry, error } = await TimeEntry.getEntryInProgress();
		// if (error) {
		// 	sendResponse({ status: err.status });
		// 	return;
		// }

		const { data, error: projectsError } =
			await ProjectTaskService.getProjectsWithFilter(
				filter,
				page,
				pageSize,
				forceTasks,
				alreadyIds
			);
		if (projectsError) {
			sendResponse(
				projectsError.message ? projectsError.message : projectsError.status
			);
		}
		sendResponse({
			status: 201,
			data,
		});
	}

	static async getLastUsedProjectFromTimeEntries({ forceTasks }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline');
			return;
		}

		const { data, error: projectsError } =
			await ProjectTaskService.getLastUsedProjectFromTimeEntries(forceTasks);
		if (projectsError) {
			sendResponse(
				projectsError.message ? projectsError.message : projectsError.status
			);
		}
		sendResponse({
			status: 201,
			data,
		});
	}

	static async getTaskOfProject({ projectId, taskName }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline');
			return;
		}

		const { data, error: projectsError } =
			await ProjectTaskService.getTaskOfProject(projectId, taskName);
		if (projectsError) {
			sendResponse(
				projectsError.message ? projectsError.message : projectsError.status
			);
		}
		sendResponse({
			status: 201,
			data,
		});
	}

	static async getProjectTasks({ projectId, filter, page }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline');
			return;
		}

		// const { entry, error } = await TimeEntry.getEntryInProgress();
		// if (error) {
		// 	sendResponse({
		// 		projectDB: null,
		// 		taskDB: null,
		// 		msg: error.message ? error.message : error.status,
		// 	});
		// 	return;
		// }

		const { data, status } = await ProjectTaskService.getProjectTasksWithFilter(
			projectId,
			filter,
			page
		);
		sendResponse({
			status,
			data,
		});
	}

	static async submitDescription({ id, description }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline');
			return;
		}

		// const { entry, error } = await TimeEntry.getEntryInProgress();
		// if (error) {
		// 	sendResponse(error.message ? error.message : error.status);
		// 	return;
		// }

		// if (entry) {
		const {
			data: timeEntry,
			error,
			status,
		} = await TimeEntry.setDescription(id, description.trim());
		if (error) {
			sendResponse(error.message ? error.message : error.status);
			return;
		}
		sendResponse({ data: timeEntry, status });
		// } else {
		// 	sendResponse('There is no TimeEntry in progress');
		// }
	}

	static async createProject({ project }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline');
			return;
		}

		const { data, error, status } = await ProjectTaskService.createProject(
			project
		);
		if (error) {
			sendResponse(error.message ? error.message : error.status);
			return;
		}
		sendResponse({ status, data });
	}

	static async editProject({ id, project }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline');
			return;
		}

		// const { entry, error } = await TimeEntry.getEntryInProgress();
		// if (error) {
		// 	sendResponse(error.message ? error.message : error.status);
		// 	return;
		// }

		if (!project) {
			const { data, error, status } = await TimeEntry.removeProject(id);
			if (error) {
				sendResponse(error.message ? error.message : error.status);
				return;
			}
			sendResponse({ status, data });
		} else {
			const { data, error, status } = await TimeEntry.updateProject(
				id,
				project
			);
			if (error) {
				sendResponse(error.message ? error.message : error.status);
				return;
			}
			sendResponse({ status, data });
		}
	}

	static async createTask({ task }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline');
			return;
		}

		const { data, error, status } = await ProjectTaskService.createTask(task);
		if (error) {
			sendResponse(error.message ? error.message : error.status);
			return;
		}
		sendResponse({ status, data });
	}

	static async editTask({ id, project, task }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline');
			return;
		}

		// const { entry, error } = await TimeEntry.getEntryInProgress();
		// if (error) {
		// 	sendResponse(error.message ? error.message : error.status);
		// 	return;
		// }

		// if (entry) {
		if (!task) {
			const { data, error, status } = await TimeEntry.removeTask(id);
			if (error) {
				sendResponse(error.message ? error.message : error.status);
				return;
			}
			sendResponse({ status, data });
		} else {
			const { data, error, status } = await TimeEntry.updateTask(
				task,
				project,
				id
			);
			if (error) {
				sendResponse(error.message ? error.message : error.status);
				return;
			}
			sendResponse({ status, data });
		}
		// } else {
		// 	sendResponse('There is no TimeEntry in progress');
		// }
	}

	static async getTags({ filter, page, pageSize }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline');
			return;
		}

		// const { entry, error } = await TimeEntry.getEntryInProgress();
		// if (error) {
		// 	sendResponse(error.message ? error.message : error.status);
		// 	return;
		// }

		const {
			data,
			error: tagsError,
			status,
		} = await TagService.getAllTagsWithFilter(page, pageSize, filter);
		if (tagsError) {
			sendResponse(tagsError.message ? tagsError.message : tagsError.status);
			return;
		}
		sendResponse({ status, data });
	}

	static async createTag({ tag }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline');
			return;
		}

		// const { entry, error } = await TimeEntry.getEntryInProgress();
		// if (error) {
		// 	sendResponse(error.message ? error.message : error.status);
		// 	return;
		// }

		const { data, error: tagsError, status } = await TagService.createTag(tag);
		if (tagsError) {
			sendResponse(tagsError.message ? tagsError.message : tagsError.status);
			return;
		}
		sendResponse({ status, data });
	}

	static async editTags({ id, tagIds }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline');
			return;
		}

		// const { entry, error } = await TimeEntry.getEntryInProgress();
		// if (error) {
		// 	sendResponse(error.message ? error.message : error.status);
		// 	return;
		// }

		// if (entry) {
		const { data, error, status } = await TimeEntry.updateTags(tagIds, id);
		if (error) {
			sendResponse(error.message ? error.message : error.status);
			return;
		}
		sendResponse({ status, data });
		// } else {
		// 	sendResponse('There is no TimeEntry in progress');
		// }
	}

	static async fetchEntryInProgress(sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline');
			return;
		}

		const hydrated = true;
		const { entry, error } = await TimeEntry.getEntryInProgress(hydrated);
		if (error) {
			sendResponse(error.message ? error.message : error.status);
			return;
		}

		sendResponse({ entry });
	}

	static async removeProjectAsFavorite({ projectId }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline');
			return;
		}

		const { error, status } = await ProjectTaskService.removeProjectAsFavorite(
			projectId
		);
		if (error) {
			sendResponse(error.message ? error.message : error.status);
			return;
		}
		sendResponse({ status });
	}

	static async makeProjectFavorite({ projectId }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline');
			return;
		}

		const { error, status } = await ProjectTaskService.makeProjectFavorite(
			projectId
		);
		if (error) {
			sendResponse(error.message ? error.message : error.status);
			return;
		}
		sendResponse({ status });
	}

	static async editBillable({ id, billable }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline');
			return;
		}

		// const { entry, error } = await TimeEntry.getEntryInProgress();
		// if (error) {
		// 	sendResponse(error.message ? error.message : error.status);
		// 	return;
		// }

		// if (entry) {
		const { entry, error, status } = await TimeEntry.updateBillable(
			id,
			billable
		);
		if (error) {
			sendResponse(error.message ? error.message : error.status);
			return;
		}
		sendResponse({ entry, status });
		// } else {
		// 	sendResponse('There is no TimeEntry in progress');
		// }
	}

	static async submitTime({ totalMins, timeEntryOptions }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline');
			return;
		}

		const { entry, error } = await TimeEntry.getEntryInProgress();
		if (error) {
			sendResponse({ status: error.status });
			return;
		}

		if (entry) {
			const { error } = await TimeEntry.endInProgress();
			if (error) {
				sendResponse({ status: error.status, endInProgressStatus: true });
				return;
			}
		}

		const end = new Date();
		timeEntryOptions.start = new Date(end.getTime() - totalMins * 60000);
		timeEntryOptions.end = end;
		timeEntryOptions.isSubmitTime = true;

		const {
			entry: ent,
			error: err,
			status,
		} = await TimeEntry.integrationStartTimerWithDescription(
			timeEntryOptions.description,
			timeEntryOptions
		);
		if (err) {
			if (err.status && err.status === 400) {
				sendResponse({ entry: ent, status: 400 });
			} else {
				sendResponse(err.message ? err.message : err.status);
			}
			return;
		}
		sendResponse({ entry: ent, status });
	}

	static async getWSCustomField({ name }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline', 0);
			return;
		}

		// const { entry, error } = await TimeEntry.getEntryInProgress();
		// if (error) {
		//     sendResponse(error.message, error.status)
		//     return;
		// }

		//if (entry) {
		// const {data: timeEntry, error, status} = await TimeEntry.setDescription(id, description.trim())
		const response = await CustomFieldService.getWSCustomField(name);
		if (response) {
			const { data, error, status } = response;
			// if (status === 201) {
			//     //tags.push(tag);
			// }
			// else {
			//     message += `\nCouldn't create tag: ${tagName}`;
			// }

			if (error) {
				sendResponse(error.message, error.status);
				return;
			}
			sendResponse({ data, status });
		} else {
			sendResponse('Connection is offline', 0);
		}
		//}
		//else {
		//    sendResponse('There is no TimeEntry in progress', 0)
		//}
	}

	static async getUserRoles(sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline', 0);
			return;
		}
		// const {data: timeEntry, error, status} = await TimeEntry.setDescription(id, description.trim())
		const { data, error, status } = await UserService.getUserRoles();
		// if (status === 201) {
		//     //tags.push(tag);
		// }
		// else {
		//     message += `\nCouldn't create tag: ${tagName}`;
		// }

		if (error) {
			sendResponse(error.message, error.status);
			return;
		}
		sendResponse({ data, status });
	}

	static async getUser(sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline', 0);
			return;
		}

		const { data, error, status } = await UserService.getUser();

		if (error) {
			sendResponse(error.message, error.status);
			return;
		}
		sendResponse({ data, status });
	}

	static async getMemberProfile({ userId, workspaceId }, sendResponse) {
		if( await isNavigatorOffline()) {
			sendResponse('Connection is offline', 0);
			return;
		}
		const { data, error, status } = await UserService.getMemberProfile(workspaceId, userId);
		if (error) {
			sendResponse(error.message, error.status);
			return;
		}
		sendResponse({ data, status });
	}

	static async getBoot(sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline', 0);
			return;
		}

		const { data, error, status } = await UserService.getBoot();

		if (error) {
			sendResponse(error.message, error.status);
			return;
		}
		sendResponse({ data, status });
	}

	static async setDefaultWorkspace({ workspaceId }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline', 0);
			return;
		}

		const { data, error, status } = await UserService.setDefaultWorkspace(
			workspaceId
		);
		
		if (error) {
			sendResponse(error.message, error.status);
			return;
		}
		sendResponse({ data, status });
	}

	static async getPermissionsForUser(sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline', 0);
			return;
		}

		const { data, error, status } =
			await UserWorkspaceStorage.getPermissionsForUser();

		if (error) {
			sendResponse(error.message, error.status);
			return;
		}
		sendResponse({ data, status });
	}

	static async getWorkspaceSettings(sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline', 0);
			return;
		}

		const { data, error, status } =
			await UserWorkspaceStorage.getSetWorkspaceSettings();

		if (error) {
			sendResponse(error.message, error.status);
			return;
		}
		sendResponse({ data, status });
	}

	static async getWorkspacesOfUser(sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline', 0);
			return;
		}

		const { data, error, status } =
			await UserWorkspaceStorage.getWorkspacesOfUser();

		if (error) {
			sendResponse(error.message, error.status);
			return;
		}
		sendResponse({ data, status });
	}

	static async getWasRegionalEverAllowed(sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline', 0);
			return;
		}

		const { data, error, status } =
			await UserWorkspaceStorage.getWasRegionalEverAllowed();

		if (error) {
			sendResponse(error.message, error.status);
			return;
		}
		sendResponse({ data, status });
	}

	static async signup({ email, password, timeZone }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline', 0);
			return;
		}

		const { data, error, status } = await AuthService.signup(
			email,
			password,
			timeZone
		);

		if (error) {
			sendResponse(error.message, error.status);
			return;
		}
		sendResponse({ data, status });
	}

	static async getClientsWithFilter({ page, pageSize, filter }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline', 0);
			return;
		}

		const { data, error, status } = await ClientService.getClientsWithFilter(
			page,
			pageSize,
			filter
		);

		if (error) {
			sendResponse(error.message, error.status);
			return;
		}
		sendResponse({ data, status });
	}

	static async createClient({ client }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline', 0);
			return;
		}

		const { data, error, status } = await ClientService.createClient(client);

		if (error) {
			sendResponse(error.message, error.status);
			return;
		}
		sendResponse({ data, status });
	}

	static async submitCustomField(
		{ timeEntryId, customFieldId, value },
		sendResponse
	) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline', 0);
			return;
		}

		const { data, error, status } = await CustomFieldService.updateCustomField(
			timeEntryId,
			customFieldId,
			value
		);
		if (error) {
			sendResponse(error.message, error.status);
			return;
		}
		sendResponse({ data, status });
	}

	static async getTimeEntries({ page }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline', 0);
			return;
		}

		const { data, error, status } = await TimeEntry.getTimeEntries(page);
		if (error) {
			sendResponse(error.message, error.status);
			return;
		}
		sendResponse({ data, status });
	}

	static async changeStart({ start, timeEntryId }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline', 0);
			return;
		}

		const { data, error, status } = await TimeEntry.changeStart(
			start,
			timeEntryId
		);
		if (error) {
			sendResponse(error.message, error.status);
			return;
		}
		sendResponse({ data, status });
	}

	static async editTimeInterval({ entryId, timeInterval }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline', 0);
			return;
		}

		const { data, error, status } = await TimeEntry.editTimeInterval(
			entryId,
			timeInterval
		);
		if (error) {
			sendResponse(error.message, error.status);
			return;
		}
		sendResponse({ data, status });
	}

	static async getEntryInProgress(sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline', 0);
			return;
		}

		const { entry, error, status } = await TimeEntry.getEntryInProgress();
		if (error) {
			sendResponse(error.message, error.status);
			return;
		}
		sendResponse({ data: entry, status });
	}
	static async setDescription({ entryId, description }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline', 0);
			return;
		}

		const { data, error, status } = await TimeEntry.setDescription(
			entryId,
			description
		);
		if (error) {
			sendResponse(error.message, error.status);
			return;
		}
		sendResponse({ data, status });
	}
	static async removeProject({ entryId }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline', 0);
			return;
		}

		const { data, error, status } = await TimeEntry.removeProject(entryId);
		if (error) {
			sendResponse(error.message, error.status);
			return;
		}
		sendResponse({ data, status });
	}
	static async removeTask({ entryId }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline', 0);
			return;
		}

		const { data, error, status } = await TimeEntry.removeTask(entryId);
		if (error) {
			sendResponse(error.message, error.status);
			return;
		}
		sendResponse({ data, status });
	}
	static async deleteTimeEntry({ entryId }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline', 0);
			return;
		}

		const { data, error, status } = await TimeEntry.deleteTimeEntry(entryId);
		if (error) {
			sendResponse(error.message, error.status);
			return;
		}
		sendResponse({ data, status });
	}
	static async deleteTimeEntries({ entryIds }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline', 0);
			return;
		}

		const { data, error, status } = await TimeEntry.deleteTimeEntries(entryIds);
		if (error) {
			sendResponse(error.message, error.status);
			return;
		}
		sendResponse({ data, status });
	}
	static async duplicateTimeEntry({ entryId }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline', 0);
			return;
		}

		const { data, error, status } = await TimeEntry.duplicateTimeEntry(entryId);
		if (error) {
			sendResponse(error.message, error.status);
			return;
		}
		sendResponse({ data, status });
	}

	static async searchEntries({ searchValue }, sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline', 0);
			return;
		}

		const { data, error, status } = await TimeEntry.searchEntries(searchValue);
		if (error) {
			sendResponse(error.message, error.status);
			return;
		}
		sendResponse({ data, status });
	}

	static async getRecentTimeEntries(sendResponse) {
		if (await isNavigatorOffline()) {
			sendResponse('Connection is offline', 0);
			return;
		}

		const { data, error, status } = await TimeEntry.getRecentTimeEntries();
		if (error) {
			sendResponse(error.message, error.status);
			return;
		}
		sendResponse({ data, status });
	}
}

class ClockifyIntegration extends ClockifyIntegrationBase {
	static callFunction(functionName, request, sendResponse) {
		if (isChrome()) {
			if (request && request.options) {
				super[functionName](request.options, sendResponse);
			} else {
				super[functionName](sendResponse);
			}

			return true;
		} else {
			return new Promise((resolve) => {
				if (request && request.options) {
					super[functionName](request.options, resolve);
				} else {
					super[functionName](resolve);
				}
			});
		}
	}
}
