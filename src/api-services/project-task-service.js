class ProjectTaskService extends ClockifyService {
	static async wsSettings() {
		const wsSettings = await localStorage.getItem('workspaceSettings');
		return wsSettings ? JSON.parse(wsSettings) : null;
	}

	static async getProjectFavorites() {
		const wsSettings = await this.wsSettings();
		return wsSettings ? wsSettings.projectFavorites : true;
	}

	static async getUrlProjects(useV1 = false) {
		const apiEndpoint = await this.apiEndpoint;
		const workspaceId = await this.workspaceId;
		return `${apiEndpoint}/${
			useV1 ? 'v1/' : ''
		}workspaces/${workspaceId}/projects`;
	}

	static async getOrCreateProjectAndTask(projectName, task) {
		const { forceTasks } = await this.getForces();
		let {
			projectDB,
			taskDB,
			msg,
			found,
			created,
			onlyAdminsCanCreateProjects,
			projectArchived,
		} = await this.getOrCreateProject(projectName);

		let message = msg ? msg : '';
		if (projectArchived) {
			message += projectName + ' is archived.';
		}
		if (onlyAdminsCanCreateProjects) {
			message += 'Only Admins can create projects.';
		}

		if (projectDB) {
			if (found || created) {
				if (task && task.name) {
					const taskName = task.name.trim().replace(/\s+/g, ' ');
					const { task: t, error } = await ProjectTaskService.getOrCreateTask(
						projectDB,
						taskName
					);
					if (error) message += error.message;
					taskDB = t;
				}
				if (forceTasks && !taskDB) {
					const {
						projectDB: p,
						taskDB: t,
						msg,
						msgId,
					} = await DefaultProject.getProjectTaskFromDB();
					if (msg) {
						message += ' ' + msg;
					}
					if (p) projectDB = p;
					taskDB = t;
				}
			}
		}
		return { projectDB, taskDB, message };
	}

	static async getOrCreateProject(projectName) {
		const page = 0;
		const pageSize = 50;
		let projectFilter;
		const { projectPickerSpecialFilter } = await this.getForces();

		let project;
		projectName = projectName.trim().replace(/\s+/g, ' ');
		if (projectPickerSpecialFilter) {
			projectFilter = '@' + projectName;
		} else {
			projectFilter = projectName;
		}
		const { projects, error } = await this.getProjectWithFilter(
			projectFilter,
			page,
			pageSize
		);
		if (error) {
			return { projectDB: null, error };
		} else {
			if (projects && projects.length > 0) {
				project = projects.find((p) => p.name === projectName);
			}
		}

		let onlyAdminsCanCreateProjects = false;
		let projectArchived = false;
		const createObjects = await this.getCreateObjects();
		const canCreateProject = await this.getCanCreateProjects();
		if (project) {
			if (!project.archived) return { projectDB: project, found: true };
			projectArchived = true;
		} else if (createObjects) {
			let wsSettings = await this.wsSettings();
			const requestBody = { name: projectName };
			if (
				wsSettings?.defaultBillableProjects !== undefined &&
				wsSettings?.defaultBillableProjects !== null
			) {
				requestBody.billable = wsSettings.defaultBillableProjects;
			}

			const {
				data: project,
				error,
				status,
			} = await this.createProject(requestBody);
			if (status === 201) {
				return { projectDB: project, created: true };
			}
			const { errorData } = error;
			if (errorData && errorData.code === 501) {
				await localStorage.setItem('createProjectError', 'true');
			}
			if (error && error.status === 403) {
				onlyAdminsCanCreateProjects = true;
			}
		}
		const { projectDB, taskDB, msg, msgId } =
			await DefaultProject.getProjectTaskFromDB();
		if (msg) {
		}

		return {
			projectDB,
			taskDB,
			msg,
			msgId,
			projectArchived,
			onlyAdminsCanCreateProjects,
		};
	}

	static async getOrCreateTask(project, taskName) {
		// try to find the appropriate task for this
		// if project.tasks is not present, this most certainly means that this
		// project was freshly created in which case there simply are no tasks

		let error = null;
		let task = (project.tasks || []).find((t) => t.name === taskName);
		if (!task) {
			let { data, error: err } = await this.getTaskOfProject({
				projectId: project.id,
				taskName: encodeURIComponent(taskName),
			});

			// backend returns a list of tasks, but we only want the one with the exact name
			data = data?.filter((t) => t.name === taskName);

			task = data && data.length > 0 ? data[0] : null;
			error = err;
		}
		const createObjects = await this.getCreateObjects();
		const canCreateTasks = await this.getCanCreateTasks();
		if (!task && createObjects && canCreateTasks) {
			const {
				data,
				error: err,
				status,
			} = await this.createTask({ projectId: project.id, name: taskName });
			task = data;
			if (status === 201) {
				// created: true
			}
			if (err) {
				if (err.status === 403) {
					// onlyAdminsCanCreateProjects = true;
				}
				error = err;
			}
		}
		return { task, error };
	}

	static async getProjectWithFilter(filter, page, pageSize) {
		const { projectPickerSpecialFilter } = JSON.parse(await localStorage.getItem('userSettings'));
		const filterTrimmedEncoded = encodeURIComponent(filter.trim());
		const apiEndpoint = await this.apiEndpoint;
		const workspaceId = await this.workspaceId;
		const searchKeyWord = projectPickerSpecialFilter? 'search=@' : 'search=';
		const endPoint = `${apiEndpoint}/workspaces/${workspaceId}/project-picker/projects?page=${page}&${searchKeyWord}${filterTrimmedEncoded}`; // &favorites
		const { data: projects, error } = await this.apiCall(endPoint);
		return { projects, error };
	}

	static async createProject(bodyProject) {
		const endPoint = await this.getUrlProjects(true);
		return await this.apiCall(endPoint, 'POST', bodyProject);
	}

	static async createTask({ projectId, name }) {
		const urlProjects = await this.getUrlProjects(true);
		const endPoint = `${urlProjects}/${projectId}/tasks`;
		const body = {
			name,
			projectId,
		};
		return await this.apiCall(endPoint, 'POST', body);
	}

	static async getLastUsedProjectFromTimeEntries(forceTasks) {
		const urlProjects = await this.getUrlProjects();
		let data, error, status;

		if (forceTasks) {
			({ data, error, status } =
				await this.getLastUsedProjectAndTaskFromTimeEntries());
		}

		// if both project and task are found, return them
		// otherwise, return only the project
		if (data) {
			return { data, error, status };
		} else {
			const endPoint = `${urlProjects}/lastUsed?type=PROJECT`;
			({ data, error, status } = await this.apiCall(endPoint));
		}

		return { data, error, status };
	}

	static async getLastUsedProjectAndTaskFromTimeEntries() {
		const urlProjects = await this.getUrlProjects();
		let endPoint = `${urlProjects}/lastUsed?type=PROJECT_AND_TASK`;
		let { data, error, status } = await this.apiCall(endPoint);
		return { data, error, status };
	}

	static getProjects(page, pageSize, favorites) {
		const filter = '';
		return this.getProjectsWithFilter(filter, page, pageSize, favorites);
	}

	static async getProjectsByIds(projectIds, taskIds) {
		const urlProjects = await this.getUrlProjects();
		const endPoint = `${urlProjects}/ids`;
		const body = { ids: projectIds };
		const {
			data: projects,
			error,
			status,
		} = await this.apiCall(endPoint, 'POST', body);
		if (error) {
			return { error };
		}
		if (status === 200 && projects.length > 0) {
			const projectDB = projects[0];
			if (taskIds) {
				const {
					tasks,
					error: err,
					status: st,
				} = await this.getAllTasks(taskIds);
				if (err) {
				} else {
					projectDB.tasks = [tasks[0]];
				}
			}
			return { projectDB, error, status };
		} else {
			return { projectDB: null, error, status };
		}
	}

	static async getTask(taskId) {
		const urlProjects = await this.getUrlProjects();
		const endPoint = `${urlProjects}/taskIds`;
		const body = { ids: [taskId] };
		const {
			data: tasks,
			error,
			status,
		} = await this.apiCall(endPoint, 'POST', body);
		if (status === 200 && tasks.length > 0) {
			return tasks[0];
		}
		return null;
	}

	/* 	static async getTaskOfProject({ projectId, taskName }) {
		const urlProjects = await this.getUrlProjects();
		const endPoint = `${urlProjects}/${projectId}/tasks?name=${taskName}&strict-name-search=true`;
		const { data, error, status } = await this.apiCall(endPoint, 'GET');
		return { data, error, status };
	} */

	static async getTaskOfProject({ projectId, taskName }) {
		const apiEndpoint = await this.apiEndpoint;
		const workspaceId = await this.workspaceId;
		const endPoint = `${apiEndpoint}/v1/workspaces/${workspaceId}/projects/${projectId}/tasks?name=${taskName}&strict-name-search=true`;
		return await this.apiCall(endPoint);
	}

	static async getAllTasks(taskIds) {
		const urlProjects = await this.getUrlProjects();
		const endPoint = `${urlProjects}/taskIds`;
		const body = {
			ids: taskIds,
		};
		const {
			data: tasks,
			error,
			status,
		} = await this.apiCall(endPoint, 'POST', body);
		return { tasks, error, status };
	}

	static async getProjectsWithFilter(
		filter,
		page,
		pageSize,
		forceTasks = false,
		alreadyIds = []
	) {
		const filterTrimmedEncoded = encodeURIComponent(filter.trim());
		const apiEndpoint = await this.apiEndpoint;
		const workspaceId = await this.workspaceId;
		const projectUrlFavs = `${apiEndpoint}/workspaces/${workspaceId}/project-picker/projects?search=${filterTrimmedEncoded}`;
		const projectUrlNonFavs = `${apiEndpoint}/workspaces/${workspaceId}/project-picker/projects?favorites=false&clientId=&excludedTasks=&search=${filterTrimmedEncoded}&userId=`;
		const projectFavorites = await this.getProjectFavorites();
		if (projectFavorites) {
			const { data, error } = await this.addFavs(
				alreadyIds,
				projectUrlFavs,
				[],
				1,
				pageSize,
				forceTasks
			);
			if (error) {
				return { data, error };
			}

			if (data.length >= pageSize) {
				return { data };
			}
			return await this.addNonFavs(
				alreadyIds,
				projectUrlNonFavs,
				data,
				page,
				pageSize,
				forceTasks
			);
		} else {
			return await this.addPage(
				alreadyIds,
				projectUrlNonFavs,
				[],
				page,
				pageSize,
				forceTasks
			);
		}
	}

	static async addFavs(
		alreadyIds,
		projectUrl,
		data,
		page,
		pageSize,
		forceTasks
	) {
		let endPoint = `${projectUrl}&page=${page}&pageSize=${pageSize}&favorites=true`;
		const { data: projects, error } = await this.apiCall(endPoint);
		if (error) return { data: projects, error };

		projects.forEach((project) => {
			if (
				!alreadyIds.includes(project.id) &&
				data.length < pageSize &&
				(!forceTasks || project.taskCount > 0)
			)
				data.push(project);
		});
		return { data, error };
	}

	static async addNonFavs(
		alreadyIds,
		projectUrl,
		data,
		page,
		pageSize,
		forceTasks
	) {
		let endPoint = `${projectUrl}&pageSize=${pageSize}&page=${page}`;
		const { data: projects, error } = await this.apiCall(endPoint);
		if (error) return { data: projects, error };
		projects.forEach((project) => {
			if (
				!project.favorite &&
				!alreadyIds.includes(project.id) &&
				data.length < pageSize &&
				(!forceTasks || project.taskCount > 0)
			)
				data.push(project);
		});
		if (projects.length < pageSize || data.length >= pageSize) {
			return { data, error };
		}
		return await this.addNonFavs(
			alreadyIds,
			projectUrl,
			data,
			page + 1,
			pageSize,
			forceTasks
		);
	}

	static async addPage(
		alreadyIds,
		projectUrl,
		data,
		page,
		pageSize,
		forceTasks
	) {
		let endPoint = `${projectUrl}&page=${page}`;
		const { data: projects, error } = await this.apiCall(endPoint);
		if (error) return { data: projects, error };
		projects.forEach((project) => {
			if (
				!alreadyIds.includes(project.id) &&
				data.length < pageSize &&
				(!forceTasks || project.taskCount > 0)
			)
				data.push(project);
		});
		if (projects.length < pageSize || data.length >= pageSize) {
			return { data, error };
		}
		return await this.addPage(
			alreadyIds,
			projectUrl,
			data,
			page + 1,
			pageSize,
			forceTasks
		);
	}

	static async getProjectTasksWithFilter(projectId, filter, page) {
		const filterTrimmedEncoded = encodeURIComponent(filter.trim());
		const apiEndpoint = await this.apiEndpoint;
		const workspaceId = await this.workspaceId;
		const endPoint = `${apiEndpoint}/workspaces/${workspaceId}/project-picker/projects/${projectId}/tasks?page=${page}&search=${filterTrimmedEncoded}`;
		return await this.apiCall(endPoint);
	}

	static async makeProjectFavorite(projectId) {
		const apiEndpoint = await this.apiEndpoint;
		const userId = await this.userId;
		const workspaceId = await this.workspaceId;
		const endPoint = `${apiEndpoint}/workspaces/${workspaceId}/users/${userId}/projects/favorites/${projectId}`;
		const body = {};
		return await this.apiCall(endPoint, 'POST', body);
	}

	static async removeProjectAsFavorite(projectId) {
		const apiEndpoint = await this.apiEndpoint;
		const userId = await this.userId;
		const workspaceId = await this.workspaceId;
		const endPoint = `${apiEndpoint}/workspaces/${workspaceId}/users/${userId}/projects/favorites/projects/${projectId}`;
		return await this.apiCall(endPoint, 'DELETE');
	}
}
