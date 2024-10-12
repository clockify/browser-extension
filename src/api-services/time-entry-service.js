class TimeEntry extends ClockifyService {
	static get doAlert() {
		return this._doAlert;
	}
	static set doAlert(b) {
		this._doAlert = b;
	}

	static get timeEntryIdTemp() {
		return (
			Math.random().toString(36).substring(2, 15) +
			Math.random().toString(36).substring(2, 15)
		);
	}

	static async getUrlTimeEntries() {
		const apiEndpoint = await this.apiEndpoint;
		const workspaceId = await this.workspaceId;
		return `${apiEndpoint}/workspaces/${workspaceId}/timeEntries`;
	}

	get timeEntryIdTemp() {
		return (
			Math.random().toString(36).substring(2, 15) +
			Math.random().toString(36).substring(2, 15)
		);
	}

	static async getEntryInProgress(hydrated = true) {
		//const endPoint = `${this.urlTimeEntries}/inProgress`;
		const apiEndpoint = await this.apiEndpoint;
		const userId = await this.userId;
		const workspaceId = await this.workspaceId;
		const endPoint = `${apiEndpoint}/v1/workspaces/${workspaceId}/user/${userId}/time-entries?in-progress=true${
			hydrated ? '&hydrated=true' : ''
		}`;
		const { data, error, status } = await this.apiCall(endPoint);
		if (error) {
			// entry instanceof Error) {
		}
		return { entry: data && data.length > 0 ? data[0] : null, error };
	}

	static async takeTimeEntryInProgress() {
		const isLoggedIn = await TokenService.isLoggedIn();
		if (isLoggedIn) {
			const { entry, error } = await this.getEntryInProgress();
			if (entry === null || error) {
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
		}
	}

	static async getLastPomodoroEntry() {
		try {
			const [apiEndpoint, userId, workspaceId] = await Promise.all([
				this.apiEndpoint,
				this.userId,
				this.workspaceId,
			]);
			const endPoint = `${apiEndpoint}/v1/workspaces/${workspaceId}/user/${userId}/time-entries?page-size=10`;
			const { data: timeEntries, error } = await this.apiCall(endPoint);

			if (error) {
				console.error('oh no, failed', error);
				return { error };
			}

			const timeEntriesOffline =
				JSON.parse(await localStorage.getItem('timeEntriesOffline')) || [];

			const findFirstNonBreakEntry = (entries) =>
				entries.find(
					(entry) =>
						entry.description !== 'Pomodoro break' &&
						entry.description !== 'Pomodoro long break'
				);

			const onlineEntry = findFirstNonBreakEntry(timeEntries);
			const offlineEntry = findFirstNonBreakEntry(timeEntriesOffline);

			let latestEntry;

			if (onlineEntry && offlineEntry) {
				const onlineStartTime = new Date(onlineEntry.timeInterval?.start);
				const offlineStartTime = new Date(offlineEntry.timeInterval?.start);

				latestEntry =
					offlineStartTime > onlineStartTime ? offlineEntry : onlineEntry;
			} else {
				latestEntry = onlineEntry || offlineEntry;
			}

			return { entry: latestEntry };
		} catch (err) {
			console.error('An error occurred:', err);
			return { error: err };
		}
	}

	static async getTimeEntries(page, limit = 50) {
		const baseUrl = await this.getUrlTimeEntries();
		const userId = await this.userId;

		const endPoint = `${baseUrl}/user/${userId}/full?page=${page}&limit=${limit}`;

		const { data, error } = await this.apiCall(endPoint);
		if (error) {
			console.error('oh no, failed', error);
		}
		return { data, error };
	}

	static async deleteTimeEntry(entryId) {
		const baseUrl = await this.getUrlTimeEntries();

		const endPoint = `${baseUrl}/${entryId}`;

		const { data, error } = await this.apiCall(endPoint, 'DELETE');
		if (error) {
			console.error('oh no, failed', error);
		}
		return { data, error };
	}

	static async deleteTimeEntries(timeEntries) {
		const apiEndpoint = await this.apiEndpoint;
		const workspaceId = await this.workspaceId;
		const userId = await this.userId;

		const endPoint = `${apiEndpoint}/v1/workspaces/${workspaceId}/user/${userId}/time-entries?time-entry-ids=${timeEntries.join(
			','
		)}`;

		const { data, error } = await this.apiCall(endPoint, 'DELETE');
		if (error) {
			console.error('oh no, failed', error);
		}
		return { data, error };
	}

	static async continueEntry(timeEntryId) {
		const apiEndpoint = await this.apiEndpoint;
		const wsId = await this.workspaceId;
		const endPoint = `${apiEndpoint}/workspaces/${wsId}/time-entries/${timeEntryId}/continue`;

		const { data, error } = await this.apiCall(endPoint, 'POST', {});
		if (error) {
			console.error('oh no, failed', error);
		}
		return { data, error };
	}

	static async updateTimeEntryValues(entryId, body) {
		const apiEndpoint = await this.apiEndpoint;
		const workspaceId = await this.workspaceId;
		const endPoint = `${apiEndpoint}/workspaces/${workspaceId}/timeEntries/${entryId}`;

		return await this.apiCall(endPoint, 'PUT', body);
	}

	static async duplicateTimeEntry(entryId) {
		const apiEndpoint = await this.apiEndpoint;
		const workspaceId = await this.workspaceId;
		const userId = await this.userId;

		const endPoint = `${apiEndpoint}/v1/workspaces/${workspaceId}/user/${userId}/time-entries/${entryId}/duplicate`;

		const { data, error } = await this.apiCall(endPoint, 'POST');
		if (error) {
			console.error('failed', error);
		}
		return { data, error };
	}

	static async searchEntries(searchValue) {
		const baseUrl = await this.getUrlTimeEntries();
		const endPoint = `${baseUrl}?searchValue=${searchValue}`;
		const { data, error } = await this.apiCall(endPoint);
		if (error) {
			console.error('oh no, failed', error);
		}
		return { data, error };
	}

	static async getRecentTimeEntries() {
		const baseUrl = await this.getUrlTimeEntries();
		const endPoint = `${baseUrl}/recent?limit=8`;
		const { data, error } = await this.apiCall(endPoint);
		if (error) {
			console.error('oh no, failed', error);
		}
		return { data, error };
	}

	static async endInProgress({
		timeEntry = null,
		end = moment(),
		endedFromIntegration = null,
		integrationName,
	} = {}) {
		const inProgress = await this.getEntryInProgress();
		let timeEntryInProgress = inProgress.entry;

		if (inProgress.error) {
			return {
				error: { status: 404, message: 'no entry in progress' },
			};
		}
		if (timeEntry) {
			const { projectId, taskId } = timeEntry;
			const { forceProjects, forceTasks } = await this.getForces();
			if ((forceProjects && !projectId) || (forceTasks && !taskId)) {
				const { projectDB, taskDB, msg, msgId } =
					await DefaultProject.getProjectTaskFromDB();
				if (projectDB) {
					timeEntryInProgress = await this.updateProjectTask(
						timeEntry,
						projectDB,
						taskDB
					);
				}
			}
		}
		if (!timeEntryInProgress) {
			return { error: { status: 404, message: 'no entry in progress' } };
		}
		const {
			id,
			projectId,
			task,
			billable,
			description,
			timeInterval,
			customFieldValues,
			tags,
		} = timeEntryInProgress;
		const { start } = timeInterval;

		const body = {
			projectId,
			taskId: task ? task.id : undefined,
			tagIds: tags && tags.length ? tags.map(({ id }) => id) : undefined,
			description,
			start,
			end,
			billable,
			customFields: customFieldValues,
		};

		const endPoint = `${await this.getUrlTimeEntries()}/${id}/full`;

		const data = await this.apiCall(endPoint, 'PUT', body);
		if (data.error) {
			if (data.error.status === 400) {
				return data;
			}
		} else {
			aBrowser.action.setIcon({ path: iconPathEnded });
			setTimeEntryInProgress(null);
			aBrowser.runtime.sendMessage({ eventName: 'TIME_ENTRY_STOPPED' });

			// Analytics
			let analyticsEventName, eventParameters;

			if (endedFromIntegration || integrationName) {
				analyticsEventName = 'entry_mode_integration';
				eventParameters = {
					integrationName: integrationName,
					timer_end: true,
					browser: 'chrome',
				};
			} else {
				analyticsEventName = 'entry_mode';
				eventParameters = {
					timer_end: true,
					browser: 'chrome',
				};
			}

			const options = { analyticsEventName, eventParameters };
			await AnalyticsService.sendAnalyticsEvent(options);
		}
		return data;
	}

	static async endInProgressAndStartNew(entry, description) {
		const { error } = await this.endInProgress({ timeEntry: entry });
		if (error) {
		} else {
			this.startTimer(description);
		}
	}

	static async startTimerWithDescription(info) {
		const decription = info && info.selectionText ? info.selectionText : '';
		const { entry, error } = await this.getEntryInProgress();
		if (entry) {
			const { error } = await this.endInProgress({ timeEntry: entry });
			if (error) {
				if (error.status === 400)
					localStorage.setItem(
						'integrationAlert',
						error.message + 'startTimerWithDescription'
					);
				// alert(error.message + 'startTimerWithDescription')
			} else {
				this.startTimer(decription);
			}
		} else {
			// if (error)  what about error ?
			this.startTimer(decription);
		}
	}

	static async startTimer(
		description,
		options = {
			projectId: null,
			task: null,
			billable: null,
			tags: [],
			start: null,
			end: null,
			isSubmitTime: false,
			customFields: [],
		},
		isPomodoro = false
	) {
		const { forceTasks } = await this.getForces();
		let {
			projectId,
			task,
			billable,
			tags,
			start,
			end,
			isSubmitTime,
			customFields,
		} = options;
		if (!isPomodoro) {
			if (!projectId || (forceTasks && !task)) {
				const workspaceSettingsInStorage = await localStorage.getItem('workspaceSettings');
				const workspaceSettings = JSON.parse(workspaceSettingsInStorage)
				const { projectDB, taskDB, msg, msgId } =
					await DefaultProject.getProjectTaskFromDB();
				if (projectDB) {
					projectId = projectDB.id;
					if (billable === null) billable = workspaceSettings?.taskBillableEnabled? taskDB?.billable : projectDB.billable;
					if (taskDB) {
						task = taskDB;
					}
				} else {
					projectId = null;
					task = null;
				}
			}
		}
		const endPoint = `${await this.getUrlTimeEntries()}/full`;
		const body = {
			start: start ?? new Date(),
			end: end ?? null,
			description,
			billable,
			projectId,
			tagIds: tags ? tags.map((tag) => tag.id) : [],
			taskId: task ? task.id : null,
			customFields,
		};
		const { data, error, status } = await this.apiCall(endPoint, 'POST', body);
		if (error) {
			console.error('oh no, failed', error);
		} else if (data && !data.message && !end) {
			// window.inProgress = true;
			if (!end) {
				aBrowser.action.setIcon({
					path: iconPathStarted,
				});
				setTimeEntryInProgress(data);

				aBrowser.runtime.sendMessage({ eventName: 'TIME_ENTRY_STARTED' });

				afterStartTimer(); // idle, pomodoro ...
			}
		}

		return { data, error, status };
	}

	static async startTimerOnStartingBrowser() {
		const userId = await this.userId;
		const str = await localStorage.getItem('permanent_autoStartOnBrowserStart');
		const autoStartForCurrentUserEnabled = str
			? JSON.parse(str).find(
					(autoStart) => autoStart.userId === userId && autoStart.enabled
			  )
			: false;

		if (autoStartForCurrentUserEnabled) {
			const { entry, error } = await this.getEntryInProgress();
			if (!entry && !error) {
				this.startTimer('');
			}
		}
	}

	static async endInProgressOnClosingBrowser() {
		const userId = await this.userId;
		const str = await localStorage.getItem('permanent_autoStopOnBrowserClose');
		const list = str ? JSON.parse(str) : [];
		const autoStopForCurrentUserEnabled = list.find(
			(autoStop) => autoStop.userId === userId && autoStop.enabled
		);

		if (autoStopForCurrentUserEnabled) {
			const { entry, error, status } = await this.getEntryInProgress();
			if (error) {
			} else if (entry) {
				this.endTimeEntryInProgress(entry);
			}
		}
	}

	static async endTimeEntryInProgress(timeEntry) {
		const { error } = await this.endInProgress({ timeEntry });
		if (error && error.status === 400) {
			const endTime = new Date();
			this.saveEntryOfflineAndStopItByDeletingIt(timeEntry, endTime);
		}
	}

	static async updateProjectTask(timeEntry, projectDB, taskDB) {
		if (await isNavigatorOffline()) return null;

		if (taskDB) {
			const endPoint = `${await this.getUrlTimeEntries()}/${
				timeEntry.id
			}/projectAndTask`;
			const body = {
				projectId: projectDB.id,
				taskId: taskDB.id,
			};
			const { data: entry, error } = await this.apiCall(endPoint, 'PUT', body);
			if (error) {
				console.error('oh no, failed', error);
				return null;
			}
			this.updateBillable(entry.id, projectDB.billable); // no need for await
			return Object.assign(entry, {
				billable: projectDB.billable,
				project: entry.project ? entry.project : projectDB,
				task: entry.task ? entry.task : taskDB,
			});
		} else {
			const endPoint = `${await this.getUrlTimeEntries()}/${
				timeEntry.id
			}/project`;
			const body = {
				projectId: projectDB.id,
			};
			const { data: entry, error } = await this.apiCall(endPoint, 'PUT', body);
			if (error) {
				console.error('oh no, failed', error);
				return null;
			}
			this.updateBillable(entry.id, projectDB.billable); // no need for await
			return Object.assign(entry, {
				project: entry.project ? entry.project : projectDB,
				billable: projectDB.billable,
			});
		}
	}

	static async updateBillable(id, billable) {
		const endPoint = `${await this.getUrlTimeEntries()}/${id}/billable`;
		const body = {
			billable,
		};
		const {
			data: entry,
			error,
			status,
		} = await this.apiCall(endPoint, 'PUT', body);
		if (error) {
			console.error('oh no, failed', error);
		}
		return { entry, error, status };
	}

	static async deleteEntry(entryId, isWebSocketHeader) {
		const endPoint = `${await this.getUrlTimeEntries()}/${entryId}`;
		const { data: entry, error } = await this.apiCall(endPoint, 'DELETE');
		if (!error) setTimeEntryInProgress(null);
		return { entry, error };
	}

	static async saveEntryOfflineAndStopItByDeletingIt(
		entry,
		end,
		isWebSocketHeader
	) {
		const timeEntry = {
			workspaceId: entry.workspaceId,
			id: this.timeEntryIdTemp,
			description: entry.description,
			projectId: entry.projectId,
			taskId: entry.task ? entry.task.id : null,
			billabe: entry.billable,
			timeInterval: {
				start: entry.timeInterval.start,
				end: new Date(end),
			},
		};

		const timeEntriesOffline = (await localStorage.getItem(
			'timeEntriesOffline'
		))
			? JSON.parse(await localStorage.getItem('timeEntriesOffline'))
			: [];
		timeEntriesOffline.push(timeEntry);
		localStorage.setItem(
			'timeEntriesOffline',
			JSON.stringify(timeEntriesOffline)
		);
		aBrowser.runtime.sendMessage({
			eventName: 'offlineEntryAdded',
		});
		const { error } = await this.deleteEntry(entry.id, isWebSocketHeader);
		return { timeEntry };
	}

	static async(request) {
		getEntryInProgress()
			.then((response) => {
				if (response && response.id) {
					return this.stopTimerAndStartNewEntry(request, sendResponse);
				} else {
					return this.startTimer(request, sendResponse);
				}
			})
			.catch((error) => {
				sendResponse(error);
			});
	}

	static async setDescription(entryId, description) {
		const endPoint = `${await this.getUrlTimeEntries()}/${entryId}/description`;
		const body = {
			description,
		};
		return await this.apiCall(endPoint, 'PUT', body);
	}

	static async updateProject(entryId, projectId) {
		const endPoint = `${await this.getUrlTimeEntries()}/${entryId}/project`;
		const body = {
			projectId,
		};
		return await this.apiCall(endPoint, 'PUT', body);
	}

	static async removeProject(entryId) {
		const endPoint = `${await this.getUrlTimeEntries()}/${entryId}/project/remove`;
		return await this.apiCall(endPoint, 'DELETE');
	}

	static async updateTask(taskId, projectId, entryId) {
		const endPoint = `${await this.getUrlTimeEntries()}/${entryId}/projectAndTask`;
		const body = {
			projectId,
			taskId,
		};
		return await this.apiCall(endPoint, 'PUT', body);
	}

	static async removeTask(entryId) {
		const endPoint = `${await this.getUrlTimeEntries()}/${entryId}/task/remove`;
		return await this.apiCall(endPoint, 'DELETE');
	}

	static async updateTags(tagList, entryId) {
		const endPoint = `${await this.getUrlTimeEntries()}/${entryId}/tags`;
		const body = {
			tagIds: tagList,
		};
		return await this.apiCall(endPoint, 'PUT', body);
	}

	static async integrationStartTimerWithDescription(
		description,
		timeEntryOptions
	) {
		let {
			projectName,
			projectId = null,
			taskName,
			taskId,
			tagNames,
			tagIds = null,
			billable,
			start = null,
			end = null,
			isSubmitTime = false,
			customFields = [],
		} = timeEntryOptions;
		let project = { id: projectId, name: projectName };
		let task = { id: taskId ?? null, name: taskName ?? null };
		const { forceDescription, forceProjects, forceTasks, forceTags } =
			await this.getForces();

		if (!!project.name) {
			const createObjects = await this.getCreateObjects();
			let { projectDB, taskDB, message } =
				await ProjectTaskService.getOrCreateProjectAndTask(project.name, task);
			if (projectDB) {
				project = projectDB;
			} else {
				if ((forceProjects || (forceTasks && !taskDB)) && !createObjects) {
					message += "\n Integrations can't create projects/tasks. ";
				}
			}
			task = taskDB;

			if (!billable) {
				billable = projectDB ? projectDB.billable : false;
			}

			if (task) {
				billable = task.billable;
			}
		}
		let tags = null;
		if (tagNames && tagNames.length > 0) {
			const { tagovi, message: msg } = await TagService.getOrCreateTags(
				tagNames.map((tagName) => tagName.trim())
			);
			if (tagovi) tags = tagovi;
		} else if (forceTags) {
		}
		return await this.startTimer(description, {
			projectId: project.id,
			task,
			billable,
			tags: tagIds ? tagIds.map((id) => ({ id })) : tags,
			start,
			end,
			isSubmitTime,
			customFields,
		});
	}

	static async changeStart(start, timeEntryId) {
		const baseUrl = await this.getUrlTimeEntries();
		const endPoint = `${baseUrl}/${timeEntryId}/start`;

		const body = {
			start,
		};

		return super.apiCall(endPoint, 'PUT', body);
	}

	static async editTimeInterval(entryId, timeInterval) {
		if (!entryId) {
			return;
		}
		const baseUrl = await this.getUrlTimeEntries();
		const endPoint = `${baseUrl}/${entryId}/timeInterval`;

		let { start, end } = timeInterval;
		if (moment(start).date() !== moment(end).date()) {
			start = moment(start).add(1, 'day');
			end = moment(end).add(1, 'day');
		}

		const body = {
			start,
			end,
		};

		return super.apiCall(endPoint, 'PUT', body);
	}
}

TimeEntry._doAlert = true;
