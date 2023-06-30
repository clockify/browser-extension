import * as React from 'react';
import Header from './header.component';
import Duration from './duration.component';
import moment, { duration } from 'moment';
import ProjectList from './project-list.component';
import TagsList from './tags-list.component';
import HomePage from './home-page.component';
import { isOffline } from './check-connection';
import { TimeEntryHelper } from '../helpers/timeEntry-helper';
import { getBrowser } from '../helpers/browser-helper';
import DeleteEntryConfirmationComponent from './delete-entry-confirmation.component';
import Toaster from './toaster-component';
import EditDescription from './edit-description.component';
import { DefaultProject } from '../helpers/storageUserWorkspace';
import { CustomFieldsContainer } from './customFields/customFields-Container';
import { offlineStorage, getWSCustomFields } from '../helpers/offlineStorage';
import locales from '../helpers/locales';

const timeEntryHelper = new TimeEntryHelper();

class EditForm extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			timeEntry: this.props.timeEntry,
			changeDescription: false,
			description: this.props.timeEntry.description,
			ready: false,
			descRequired: false,
			projectRequired: false,
			taskRequired: false,
			tagsRequired: false,
			forceTasks: false,
			cfRequired: false,
			askToDeleteEntry: false,
			isInProgress: this.props.inProgress,
			tags: this.props.timeEntry.tags ? this.props.timeEntry.tags : [],
			// redrawCustomFields: 0,
			workspaceSettings: null,
		};

		this.setDescription = this.setDescription.bind(this);
		this.onSetDescription = this.onSetDescription.bind(this);
		this.editBillable = this.editBillable.bind(this);
		this.checkRequiredFields = this.checkRequiredFields.bind(this);
		this.notifyAboutError = this.notifyAboutError.bind(this);
		this.editProject = this.editProject.bind(this);
		this.editTask = this.editTask.bind(this);
		// this.onChangeProjectRedrawCustomFields = this.onChangeProjectRedrawCustomFields.bind(this);
		this.updateCustomFields = this.updateCustomFields.bind(this);
		this.setAsyncStateItems = this.setAsyncStateItems.bind(this);
		this.areCustomFieldsValid = this.areCustomFieldsValid.bind(this);
	}

	async setAsyncStateItems() {
		const hideBillable = await offlineStorage.getHideBillable();
		const isUserOwnerOrAdmin = await offlineStorage.getIsUserOwnerOrAdmin();
		const inProgress = await localStorage.getItem('inProgress');
		const workspaceSettings = await localStorage.getItem('workspaceSettings');

		if (
			this.state.isUserOwnerOrAdmin !== isUserOwnerOrAdmin ||
			this.state.hideBillable !== hideBillable ||
			this.state.inProgress !== inProgress ||
			this.state.workspaceSettings !== workspaceSettings
		) {
			this.setState({
				hideBillable,
				isUserOwnerOrAdmin,
				inProgress,
				workspaceSettings,
			});
		}
	}

	componentDidUpdate() {
		this.setAsyncStateItems();
	}

	async componentDidMount() {
		const { forceTasks } = this.props.workspaceSettings;
		const { timeEntry } = this.state;
		const { projectId, task } = timeEntry;
		const taskId = task ? task.id : null;

		if (!(await isOffline()) && offlineStorage.userHasCustomFieldsFeature) {
			const { data, msg } = await getWSCustomFields();
			if (data) offlineStorage.wsCustomFields = data;
			else alert(msg);
		}

		if (this.props.afterCreateProject) {
			this.setState((state) => ({
				timeEntry: {
					...state.timeEntry,
					customFieldValues: offlineStorage.customFieldValues,
				},
			}));
		} else {
			if (offlineStorage.wsCustomFields?.length) {
				const additinalFields = offlineStorage.wsCustomFields
					.filter(
						(field) =>
							field.status === 'VISIBLE' &&
							(!field.projectDefaultValues.find(
								(el) => el.projectId === projectId
							) ||
								field.projectDefaultValues.find(
									(el) => el.projectId === projectId
								)?.status === 'VISIBLE') &&
							!timeEntry?.customFieldValues?.find(
								(cf) => cf.customFieldId === field.id
							)
					)
					.map((el) => ({ ...el, customFieldId: el.id }));
				this.setState((state) => ({
					timeEntry: {
						...state.timeEntry,
						customFieldValues: [
							...state.timeEntry.customFieldValues,
							...additinalFields,
						],
					},
				}));
			}
		}

		if (!projectId || (forceTasks && !taskId)) {
			const { projectDB, taskDB } = await this.checkDefaultProjectTask(
				forceTasks
			);
			 
			if (projectDB) {
				 
				const entry = await timeEntryHelper.updateProjectTask(
					timeEntry,
					projectDB,
					taskDB
				);
				this.setState(
					{
						timeEntry: entry,
					},
					() => {
						this.checkRequiredFields();
					}
				);
			} else {
				this.checkRequiredFields();
			}
		} else {
			this.checkRequiredFields();
		}
	}

	async updateCustomFields(customFields) {
		if (await isOffline()) {
			let timeEntry = offlineStorage.timeEntryInOffline;
			if (timeEntry && timeEntry.id === this.state.timeEntry.id) {
				if (timeEntry.customFieldValues) {
					customFields.forEach(({ value, customFieldId }) => {
						const cf = timeEntry.customFieldValues.find(
							(item) => item.customFieldId === customFieldId
						);
						if (cf) cf.value = value;
					});
				} else {
					// Da li
					alert('Da li je moguce da timeEntryInOffline nema customFieldValues');
				}
				offlineStorage.timeEntryInOffline = timeEntry;
				this.setState(
					{
						timeEntry,
					},
					() => this.checkRequiredFields()
				);
			} else {
				let timeEntries = offlineStorage.timeEntriesOffline;
				timeEntries.map((timeEntry) => {
					if (timeEntry.id === this.state.timeEntry.id) {
						if (timeEntry.customFieldValues) {
							customFields.forEach(({ value, customFieldId }) => {
								const cf = timeEntry.customFieldValues.find(
									(item) => item.customFieldId === customFieldId
								);
								if (cf) cf.value = value;
							});
						} else {
							// Da li
							alert(
								'Da li je moguce da timeEntry in timeEntries nema customFieldValues'
							);
						}

						this.setState(
							{
								timeEntry,
							},
							() => this.checkRequiredFields()
						);
					}
					return timeEntry;
				});
				offlineStorage.timeEntriesOffline = timeEntries;
			}
		}
	}

	async checkDefaultProjectTask(forceTasks) {
		const { defaultProject } = await DefaultProject.getStorage();
		 
		if (defaultProject && defaultProject.enabled) {
			const isLastUsedProject = defaultProject.project.id === 'lastUsedProject';
			const isLastUsedProjectWithoutTask =
				defaultProject.project.id === 'lastUsedProject' &&
				!defaultProject.project.name.includes('task');
			let lastEntry;
			try {
				 
				const response = await getBrowser().runtime.sendMessage({
					eventName: 'getLastUsedProjectFromTimeEntries',
					options: {
						forceTasks: !isLastUsedProjectWithoutTask,
					},
				});
				if(!response.data) throw new Error(response);
				lastEntry = {
					project: !isLastUsedProjectWithoutTask ? response.data.project : response.data,
					task: !isLastUsedProjectWithoutTask ? response.data.task : null,
				};
			} catch (e) {
				console.error('project not found');
				setTimeout(() => {
					this.toaster.toast(
						'info',
						`${locales.DEFAULT_PROJECT_NOT_AVAILABLE} ${locales.YOU_CAN_SET_A_NEW_ONE_IN_SETTINGS}`,
						4
					);	
				}, 2000);
				return { projectDB: null, taskDB: null };
			}
			 	
			if (!isLastUsedProject) {
				const { projectDB, taskDB, msg } =
					await defaultProject.getProjectTaskFromDB(forceTasks);
				if (msg) {
					setTimeout(() => {
						this.toaster.toast('info', msg, 4);
					}, 2000);
				}
				return { projectDB, taskDB };
			} else {
				 
				if (!lastEntry) {
					setTimeout(() => {
						this.toaster.toast(
							'info',
							`${locales.DEFAULT_PROJECT_NOT_AVAILABLE} ${locales.YOU_CAN_SET_A_NEW_ONE_IN_SETTINGS}`,
							4
						);
					}, 2000);
					return { projectDB: null, taskDB: null };
				}
				let { project, task } = lastEntry;

				if (isLastUsedProjectWithoutTask) {
					task = null;
				}
				 
				return { projectDB: project, taskDB: task };
			}
		}
		return { projectDB: null, taskDB: null };
	}

	async changeInterval(timeInterval) {
		if (await isOffline()) {
			let timeEntry = offlineStorage.timeEntryInOffline;
			if (timeEntry && timeEntry.id === this.state.timeEntry.id) {
				timeEntry.timeInterval = timeInterval;
				offlineStorage.timeEntryInOffline = timeEntry;
				this.setState(
					{
						timeEntry,
					},
					() => {}
				);
			} else {
				let timeEntries = offlineStorage.timeEntriesOffline;
				timeEntries.map((entry) => {
					if (entry.id === this.state.timeEntry.id) {
						entry.timeInterval = timeInterval;
						this.setState(
							{
								timeEntry: entry,
							},
							() => {}
						);
					}
					return entry;
				});
				offlineStorage.timeEntriesOffline = timeEntries;
			}
		} else {
			if (timeInterval.start && timeInterval.end) {
				timeInterval.start = moment(timeInterval.start).toDate();
				timeInterval.end = moment(timeInterval.end).toDate();
				getBrowser()
					.runtime.sendMessage({
						eventName: 'editTimeInterval',
						options: {
							timeInterval,
							entryId: this.props.timeEntry.id,
						},
					})
					.then((response) => {
						let data = response.data;
						this.setState(
							{
								timeEntry: data,
							},
							() => {}
						);
					})
					.catch((error) => {
						this.notifyError(error);
					});
			} else if (timeInterval.start && !timeInterval.end) {
				getBrowser()
					.runtime.sendMessage({
						eventName: 'changeStart',
						options: {
							start: timeInterval.start,
							timeEntryId: this.props.timeEntry.id,
						},
					})
					.then((response) => {
						let data = response.data;
						this.setState(
							{
								timeEntry: data,
							},
							() => {
								// getBrowser().runtime.sendMessage({
								//     eventName: 'pomodoroTimer'
								// });
							}
						);
					})
					.catch((error) => {});
			}
		}
	}

	async changeDuration(newDuration) {
		if (!newDuration || !this.state.timeEntry.timeInterval.end) {
			return;
		}
		let timeEntry;

		if (await isOffline()) {
			timeEntry = offlineStorage.timeEntryInOffline;
			let end = moment(this.state.timeEntry.timeInterval.start)
				.add(parseInt(newDuration.split(':')[0]), 'hours')
				.add(parseInt(newDuration.split(':')[1]), 'minutes')
				.add(
					newDuration.split(':')[2] ? parseInt(newDuration.split(':')[2]) : 0,
					'seconds'
				);

			if (timeEntry && timeEntry.id === this.state.timeEntry.id) {
				timeEntry.timeInterval.end = end;
				timeEntry.timeInterval.duration = duration(
					moment(timeEntry.timeInterval.end).diff(timeEntry.timeInterval.start)
				);
				offlineStorage.timeEntryInOffline = timeEntry;
				this.setState(
					{
						timeEntry,
					},
					() => {}
				);
			} else {
				let timeEntries = offlineStorage.timeEntriesOffline;
				timeEntries.map((entry) => {
					if (entry.id === this.state.timeEntry.id) {
						entry.timeInterval.end = end;
						entry.timeInterval.duration = duration(
							moment(entry.timeInterval.end).diff(entry.timeInterval.start)
						);
						this.setState(
							{
								timeEntry: entry,
							},
							() => {}
						);
					}
					return entry;
				});
				offlineStorage.timeEntriesOffline = timeEntries;
			}
		} else {
			timeEntry = this.state.timeEntry;
			let end = moment(this.state.timeEntry.timeInterval.start)
				.add(parseInt(newDuration.split(':')[0]), 'hours')
				.add(parseInt(newDuration.split(':')[1]), 'minutes')
				.add(
					newDuration.split(':')[2] ? parseInt(newDuration.split(':')[2]) : 0,
					'seconds'
				)
				.toDate();
			timeEntry.timeInterval.start = moment(
				timeEntry.timeInterval.start
			).toDate();
			timeEntry.timeInterval.end = end;
			getBrowser()
				.runtime.sendMessage({
					eventName: 'editTimeInterval',
					options: {
						entryId: this.props.timeEntry.id,
						timeInterval: timeEntry.timeInterval,
					},
				})
				.then((response) => {
					let data = response.data;
					this.setState(
						{
							timeEntry: data,
						},
						() => {}
					);
				})
				.catch((error) => {
					this.notifyError(error);
				});
		}
	}

	onSetDescription(description) {
		this.setState({ description }, () => this.setDescription());
	}

	async setDescription() {
		const { description } = this.state;
		if (await isOffline()) {
			let timeEntry = offlineStorage.timeEntryInOffline;
			if (timeEntry && timeEntry.id === this.state.timeEntry.id) {
				timeEntry.description = description.trim();
				offlineStorage.timeEntryInOffline = timeEntry;
				this.setState(
					(state) => ({
						timeEntry: {
							...state.timeEntry,
							description: timeEntry.description,
						},
						description: timeEntry.description,
					}),
					() => this.checkRequiredFields()
				);
			} else {
				let timeEntries = offlineStorage.timeEntriesOffline;
				timeEntries.map((entry) => {
					if (entry.id === this.state.timeEntry.id) {
						entry.description = description.trim();
						this.setState(
							(state) => ({
								timeEntry: {
									...state.timeEntry,
									description: entry.description,
								},
								description: entry.description,
							}),
							() => this.checkRequiredFields()
						);
					}
					return entry;
				});
				offlineStorage.timeEntriesOffline = timeEntries;
			}
		} else {
			getBrowser()
				.runtime.sendMessage({
					eventName: 'setDescription',
					options: {
						entryId: this.state.timeEntry.id,
						description: description.trim(),
					},
				})
				.then((response) => {
					let data = response.data;
					setTimeout(() => {
						this.setState(
							(state) => ({
								timeEntry: {
									...state.timeEntry,
									description: data.description,
								},
								description: data.description,
							}),
							() => this.checkRequiredFields()
						);
					}, 100);
				})
				.catch(() => {});
		}
	}

	notifyError(error) {
		if (error.request?.status === 403) {
			const response = JSON.parse(error.request.response);
			if (response.code === 4030) {
				this.notifyAboutError(response.message, 'info', 10);
			}
		}
	}

	async editProject(project, callbackDefaultTask) {
		if (!project.id || project.id === 'no-project') {
			if (await isOffline()) {
				let timeEntry = offlineStorage.timeEntryInOffline;
				if (timeEntry && timeEntry.id === this.state.timeEntry.id) {
					timeEntry.projectId = 'no-project';
					timeEntry.project = project;
					offlineStorage.timeEntryInOffline = timeEntry;
					this.setState(
						{
							timeEntry,
						},
						() => {
							// this.projectList.mapSelectedProject()
							this.checkRequiredFields();
						}
					);
				} else {
					let timeEntries = offlineStorage.timeEntriesOffline;
					timeEntries.map((timeEntry) => {
						if (timeEntry.id === this.state.timeEntry.id) {
							timeEntry.projectId = 'no-project';
							timeEntry.project = project;
							this.setState(
								{
									timeEntry,
								},
								() => {
									// this.projectList.mapSelectedProject()
									this.checkRequiredFields();
								}
							);
						}
						return timeEntry;
					});
					offlineStorage.timeEntriesOffline = timeEntries;
				}
			} else {
				getBrowser()
					.runtime.sendMessage({
						eventName: 'removeProject',
						options: { entryId: this.state.timeEntry.id },
					})
					.then((response) => {
						let entry = this.state.timeEntry;
						entry.projectId = 'no-project';
						this.setState(
							{
								timeEntry: Object.assign(response.data, {
									project,
									projectId: project.id,
								}),
							},
							() => {
								this.checkRequiredFields();
								// this.projectList.mapSelectedProject();
							}
						);
					})
					.catch((error) => {});
			}
		} else {
			if (await isOffline()) {
				let timeEntry = offlineStorage.timeEntryInOffline;
				if (timeEntry && timeEntry.id === this.state.timeEntry.id) {
					timeEntry.project = project;
					timeEntry.projectId = project.id;
					offlineStorage.timeEntryInOffline = timeEntry;
					this.setState(
						{
							timeEntry,
						},
						() => {
							// this.projectList.mapSelectedProject();
							this.checkRequiredFields();
						}
					);
				} else {
					let timeEntries = offlineStorage.timeEntriesOffline;
					timeEntries.map((timeEntry) => {
						if (timeEntry.id === this.state.timeEntry.id) {
							timeEntry.project = project;
							timeEntry.projectId = project.id;
							this.setState(
								{
									timeEntry,
								},
								() => {
									// this.projectList.mapSelectedProject();
									this.checkRequiredFields();
								}
							);
						}
						return timeEntry;
					});
					offlineStorage.timeEntriesOffline = timeEntries;
				}
				//if (callbackDefaultTask)
				//    callbackDefaultTask();
			} else {
				getBrowser()
					.runtime.sendMessage({
						eventName: 'editProject',
						options: {
							id: this.state.timeEntry.id,
							project: project.id,
						},
					})
					.then((response) => {
						this.setState(
							{
								timeEntry: Object.assign(response.data, {
									project,
									projectId: project.id,
								}),
							},
							() => {
								this.checkRequiredFields();
								// this.projectList.mapSelectedProject();
								if (callbackDefaultTask) callbackDefaultTask();
							}
						);
					})
					.catch((error) => {
						this.notifyError(error);
					});
			}
		}
	}

	editTask(task, project) {
		if (!task) {
			getBrowser()
				.runtime.sendMessage({
					eventName: 'removeTask',
					options: {
						entryId: this.state.timeEntry.id,
					},
				})
				.then(() => this.checkRequiredFields())
				.catch(() => {});
		} else {
			getBrowser()
				.runtime.sendMessage({
					eventName: 'editTask',
					options: {
						task: task.id,
						project: project.id,
						id: this.state.timeEntry.id,
					},
				})
				.then((response) => {
					this.setState(
						{
							timeEntry: Object.assign(response.data, { project, task }),
						},
						() => {
							this.checkRequiredFields();
							// this.projectList.mapSelectedTask(task.name)
						}
					);
				})
				.catch(() => {});
		}
	}

	async editTags(tag, saveAfterEdit) {
		let tagIds = this.state.tags ? this.state.tags.map((it) => it.id) : [];
		let tagList = this.state.tags;

		if (tagIds.includes(tag.id)) {
			tagIds.splice(tagIds.indexOf(tag.id), 1);
			tagList = tagList.filter((t) => t.id !== tag.id);
		} else {
			tagIds.push(tag.id);
			tagList.push(tag);
		}

		if (await isOffline()) {
			let timeEntry = offlineStorage.timeEntryInOffline;
			if (timeEntry && timeEntry.id === this.state.timeEntry.id) {
				timeEntry.tags = tagList;
				offlineStorage.timeEntryInOffline = timeEntry;
				this.setState(
					{
						timeEntry,
					},
					() => {
						this.checkRequiredFields();
					}
				);
			} else {
				let timeEntries = offlineStorage.timeEntriesOffline;
				timeEntries.map((timeEntry) => {
					if (timeEntry.id === this.state.timeEntry.id) {
						timeEntry.tags = tagList;
						this.setState(
							{
								timeEntry,
							},
							() => {
								this.checkRequiredFields();
							}
						);
					}
					return timeEntry;
				});
				offlineStorage.timeEntriesOffline = timeEntries;
			}
		} else {
			this.setState(
				{
					tags: tagList,
				},
				() => {
					if (saveAfterEdit) {
						this.onTagListClose();
					} else {
						this.checkRequiredFields();
					}
				}
			);
		}
	}

	onTagListClose() {
		const tagIds = this.state.tags ? this.state.tags.map((it) => it.id) : [];
		getBrowser()
			.runtime.sendMessage({
				eventName: 'editTags',
				options: {
					tagIds,
					id: this.state.timeEntry.id,
				},
			})
			.then((response) => {
				let data = response.data;
				this.setState(
					(state) => ({
						timeEntry: {
							...state.timeEntry,
							...data,
						},
					}),
					() => this.checkRequiredFields()
				);
			})
			.catch((err) => {});
	}

	async editBillable() {
		if (await isOffline()) {
			let timeEntry = offlineStorage.timeEntryInOffline;
			if (timeEntry && timeEntry.id === this.state.timeEntry.id) {
				timeEntry.billable = !this.state.timeEntry.billable;
				offlineStorage.timeEntryInOffline = timeEntry;
				this.setState({
					timeEntry,
				});
			} else {
				let timeEntries = offlineStorage.timeEntriesOffline;
				timeEntries.map((entry) => {
					if (entry.id === this.state.timeEntry.id) {
						entry.billable = !this.state.timeEntry.billable;
						this.setState({
							timeEntry: entry,
						});
					}
					return entry;
				});
				offlineStorage.timeEntriesOffline = timeEntries;
			}
		} else {
			getBrowser()
				.runtime.sendMessage({
					eventName: 'editBillable',
					options: {
						id: this.state.timeEntry.id,
						billable: !this.state.timeEntry.billable,
					},
				})
				.catch((err) => {
					console.log(err);
				});

			this.setState((state) => ({
				timeEntry: { ...state.timeEntry, billable: !state.timeEntry.billable },
			}));
		}
	}

	async deleteEntry() {
		if (await isOffline()) {
			let timeEntry = offlineStorage.timeEntryInOffline;
			if (timeEntry && timeEntry.id === this.state.timeEntry.id) {
				offlineStorage.timeEntryInOffline = null;
				this.goBack();
			} else {
				let timeEntries = offlineStorage.timeEntriesOffline;
				if (
					timeEntries.findIndex(
						(entry) => entry.id === this.state.timeEntry.id
					) > -1
				) {
					timeEntries.splice(
						timeEntries.findIndex(
							(entry) => entry.id === this.state.timeEntry.id
						),
						1
					);
				}
				offlineStorage.timeEntriesOffline = timeEntries;
				this.goBack();
			}
		} else {
			getBrowser()
				.runtime.sendMessage({
					eventName: 'deleteTimeEntry',
					options: {
						entryId: this.state.timeEntry.id,
					},
				})
				.then((response) => {
					getBrowser().runtime.sendMessage({
						eventName: 'restartPomodoro',
					});
					localStorage.setItem('timeEntryInProgress', null);

					this.goBack();
				})
				.catch(() => {});
		}
	}

	// shakeHeader(el) {
	// 	if (el) {
	// 		el.classList.add('shake-heartache');
	// 		el.addEventListener('animationend', function (e) {
	// 			setTimeout(() => {
	// 				el.classList.remove('shake-heartache');
	// 			}, 300);
	// 		});
	// 	}
	// }
	areCustomFieldsValid(val) {
		this.setState({ cfRequired: !val });
	}

	done() {
		// if (this.state.projectRequired && !this.state.timeEntry.project) {
		// 	this.shakeHeader(document.querySelector('.projects-list'));
		// }
		// if (this.state.tagsRequired && !this.state.timeEntry.tags) {
		// 	this.shakeHeader(document.querySelector('.tag-list'));
		// }
		if (
			this.state.descRequired ||
			this.state.projectRequired ||
			this.state.taskRequired ||
			this.state.tagsRequired ||
			this.state.cfRequired
		) {
			return;
		}
		if (this.props.integrationMode) {
			this.props.closeIntegrationPopup();
		} else {
			this.goBack();
		}
	}

	async changeDate(date) {
		if (await isOffline()) {
			let getDate = new Date(date);
			let timeEntryStart = moment(this.state.timeEntry.timeInterval.start);
			let start = moment(getDate)
				.hour(timeEntryStart.hour())
				.minutes(timeEntryStart.minutes())
				.seconds(timeEntryStart.seconds());
			let timeEntries = offlineStorage.timeEntriesOffline;
			timeEntries.map((entry) => {
				if (entry.id === this.state.timeEntry.id) {
					entry.timeInterval.start = start;
					entry.timeInterval.end = moment(start).add(
						duration(this.state.timeEntry.timeInterval.duration)
					);
					this.setState({
						timeEntry: entry,
					});
				}
				return entry;
			});

			offlineStorage.timeEntriesOffline = timeEntries;
		} else {
			let getDate = new Date(date);
			let timeEntryStart = moment(this.state.timeEntry.timeInterval.start);
			let start = moment(getDate)
				.hour(timeEntryStart.hour())
				.minutes(timeEntryStart.minutes())
				.seconds(timeEntryStart.seconds());
			let body = {
				start: start.toDate(),
				end: moment(start)
					.add(duration(this.state.timeEntry.timeInterval.duration))
					.toDate(),
			};
			getBrowser()
				.runtime.sendMessage({
					eventName: 'editTimeInterval',
					options: {
						entryId: this.state.timeEntry.id,
						timeInterval: body,
					},
				})
				.then((response) => {
					this.setState({
						timeEntry: response.data,
					});
				});
		}
	}

	async changeStartDate(date) {
		if (await isOffline()) {
			let getDate = new Date(date);
			let timeEntryStart = moment(this.state.timeEntry.timeInterval.start);
			let timeEntry = offlineStorage.timeEntryInOffline;
			timeEntry.timeInterval.start = moment(getDate)
				.hour(timeEntryStart.hour())
				.minutes(timeEntryStart.minutes())
				.seconds(timeEntryStart.seconds());
			offlineStorage.timeEntryInOffline = timeEntry;
			this.setState({
				timeEntry,
			});
		} else {
			const getDate = new Date(date);
			const timeEntryStart = moment(this.state.timeEntry.timeInterval.start);

			const start = moment(getDate)
				.hour(timeEntryStart.hour())
				.minutes(timeEntryStart.minutes())
				.seconds(timeEntryStart.seconds());

			getBrowser()
				.runtime.sendMessage({
					eventName: 'changeStart',
					options: {
						start,
						timeEntryId: this.state.timeEntry.id,
					},
				})
				.then((response) => {
					this.setState(
						{
							timeEntry: response.data,
						},
						() => {}
					);
				});
		}
	}

	changeMode(mode) {
		this.props.changeMode(mode);
	}

	async checkRequiredFields() {
		let descRequired = false;
		let projectRequired = false;
		let taskRequired = false;
		let tagsRequired = false;
		let forceTasks = false;
		let workspaceSettings;

		if (typeof this.props.workspaceSettings.forceDescription !== 'undefined') {
			workspaceSettings = this.props.workspaceSettings;
		} else {
			workspaceSettings = this.state.workspaceSettings
				? JSON.parse(this.state.workspaceSettings)
				: null;
		}

		const isOnline = !(await isOffline());

		if (workspaceSettings) {
			if (
				workspaceSettings.forceDescription &&
				(!this.state.timeEntry.description ||
					this.state.timeEntry.description === '')
			) {
				descRequired = true;
			}

			if (
				workspaceSettings.forceProjects &&
				!this.state.timeEntry.projectId &&
				isOnline
			) {
				projectRequired = true;
			}

			forceTasks = workspaceSettings.forceTasks;
			if (
				workspaceSettings.forceTasks &&
				!this.state.timeEntry.task &&
				!this.state.timeEntry.taskId &&
				isOnline
			) {
				taskRequired = true;
			}

			if (
				workspaceSettings.forceTags &&
				(!this.state.timeEntry.tags || !this.state.timeEntry.tags.length > 0) &&
				(!this.state.timeEntry.tagIds ||
					!this.state.timeEntry.tagIds.length > 0) &&
				isOnline
			) {
				tagsRequired = true;
			}
		}

		this.setState({
			descRequired,
			projectRequired,
			taskRequired,
			tagsRequired,
			forceTasks,
			ready: true,
		});
	}

	askToDeleteEntry() {
		this.setState({
			askToDeleteEntry: true,
		});
	}

	cancelDeletingEntry() {
		this.setState({
			askToDeleteEntry: false,
		});
	}

	goBack() {
		window.reactRoot.render(<HomePage />);
	}

	notifyAboutError(message, type = 'error', n = 2) {
		this.toaster.toast(type, message, n);
	}

	render() {
		if (!this.state.ready) {
			return null;
		} else {
			const { timeEntry } = this.state;
			return (
				<div>
					{!this.props.integrationMode && (
						<>
							<Header
								backButton={true}
								disableManual={this.state.inProgress}
								changeMode={this.changeMode.bind(this)}
								workspaceSettings={JSON.parse(this.state.workspaceSettings)}
								goBackTo={this.goBack.bind(this)}
							/>
							{timeEntry.type === 'BREAK' && (
								<div className="edit-form__break-label">
									<span
										className="break-icon"
										style={{
											background: `url(${getBrowser().runtime.getURL(
												'/assets/images/break.png'
											)})`,
										}}
									/>
									<span>{locales.BREAK}</span>
								</div>
							)}
							<Duration
								ref={(instance) => {
									this.duration = instance;
								}}
								timeEntry={timeEntry}
								timeFormat={this.props.timeFormat}
								changeInterval={this.changeInterval.bind(this)}
								changeDuration={this.changeDuration.bind(this)}
								changeDate={
									timeEntry.timeInterval.end
										? this.changeDate.bind(this)
										: this.changeStartDate.bind(this)
								}
								workspaceSettings={this.props.workspaceSettings}
								isUserOwnerOrAdmin={this.state.isUserOwnerOrAdmin}
								userSettings={this.props.userSettings}
							/>
						</>
					)}
					<Toaster
						ref={(instance) => {
							this.toaster = instance;
						}}
					/>
					<div className="edit-form">
						<div
							className={
								this.state.descRequired
									? 'description-textarea-required'
									: 'description-textarea'
							}
						>
							<EditDescription
								description={this.state.description}
								descRequired={this.descRequired}
								onSetDescription={this.onSetDescription}
								toaster={this.toaster}
							/>
						</div>
						<div className="edit-form__project_list">
							<ProjectList
								// ref={instance => {
								//     this.projectList = instance;
								// }}
								timeEntry={timeEntry}
								// selectedProject={timeEntry.project}
								// selectedTask={timeEntry.task}
								selectProject={this.editProject}
								selectTask={this.editTask}
								noTask={false}
								workspaceSettings={this.props.workspaceSettings}
								isUserOwnerOrAdmin={this.state.isUserOwnerOrAdmin}
								createProject={true}
								projectRequired={this.state.projectRequired}
								taskRequired={this.state.taskRequired}
								forceTasks={this.state.forceTasks}
								editForm={true}
								timeFormat={this.props.timeFormat}
								userSettings={this.props.userSettings}
								checkRequiredFields={this.checkRequiredFields}
								// onChangeProjectRedrawCustomFields={this.onChangeProjectRedrawCustomFields}
								integrationMode={this.props.integrationMode}
							/>
						</div>
						<TagsList
							ref={(instance) => {
								this.tagList = instance;
							}}
							tags={this.state.tags}
							tagIds={this.state.tags.map((it) => it.id)}
							editTag={this.editTags.bind(this)}
							tagsRequired={this.state.tagsRequired}
							isUserOwnerOrAdmin={this.state.isUserOwnerOrAdmin}
							workspaceSettings={this.props.workspaceSettings}
							editForm={true}
							errorMessage={this.notifyAboutError}
							onClose={this.onTagListClose.bind(this)}
							integrationMode={this.props.integrationMode}
						/>
						<div className="edit-form-buttons">
							<div
								className={`edit-form-buttons__billable ${
									this.state.hideBillable ? 'disabled' : ''
								}`}
							>
								<span
									className={
										timeEntry.billable
											? 'edit-form-checkbox checked'
											: 'edit-form-checkbox'
									}
									onClick={this.editBillable}
									tabIndex={'0'}
									onKeyDown={(e) => {
										if (e.key === 'Enter') this.editBillable();
									}}
								>
									<img
										src={getBrowser().runtime.getURL(
											'assets/images/checked.png'
										)}
										className={
											timeEntry.billable
												? 'edit-form-billable-img'
												: 'edit-form-billable-img-hidden'
										}
									/>
								</span>
								<label
									onClick={this.editBillable}
									className="edit-form-billable"
								>
									{locales.BILLABLE_LABEL}
								</label>
							</div>
							{offlineStorage.userHasCustomFieldsFeature && (
								<CustomFieldsContainer
									key="customFieldsContainer"
									timeEntry={timeEntry}
									isUserOwnerOrAdmin={this.state.isUserOwnerOrAdmin}
									manualMode={false}
									updateCustomFields={this.updateCustomFields}
									isInProgress={this.state.isInProgress}
									areCustomFieldsValid={this.areCustomFieldsValid}
								/>
							)}
							<div id="" className="edit-form-right-buttons">
								<button
									onClick={this.done.bind(this)}
									className={
										this.state.descRequired ||
										this.state.projectRequired ||
										this.state.taskRequired ||
										this.state.tagsRequired ||
										this.state.cfRequired
											? 'edit-form-done-disabled'
											: 'edit-form-done'
									}
								>
									{locales.DONE_LABEL}
								</button>
								{!this.props.integrationMode && (
									<div className="edit-form-right-buttons__back_and_delete">
										<span
											onClick={this.askToDeleteEntry.bind(this)}
											className="edit-form-delete"
										>
											{locales.DELETE}
										</span>
									</div>
								)}
								<DeleteEntryConfirmationComponent
									askToDeleteEntry={this.state.askToDeleteEntry}
									canceled={this.cancelDeletingEntry.bind(this)}
									confirmed={this.deleteEntry.bind(this)}
								/>
							</div>
						</div>
					</div>
				</div>
			);
		}
	}
}

export default EditForm;
