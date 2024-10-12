import React from 'react';
import Header from './header.component.jsx';
import Duration from './duration.component';
import moment from 'moment';
import { duration } from 'moment/moment';
import debounce from 'lodash.debounce';
import ProjectList from './project-list.component';
import TagsList from './tags-list.component';
import HomePage from './home-page.component';
import { isOffline } from './check-connection';
import Toaster from './toaster-component';
import { DefaultProject } from '../helpers/storageUserWorkspace';
import { CustomFieldsContainer } from './customFields/customFields-Container';
import { getWSCustomFields, offlineStorage } from '../helpers/offlineStorage';
import locales from '../helpers/locales';
import { Autocomplete } from '~/components/Autocomplete.tsx';
import { getBrowser } from '../helpers/browser-helper';
import { DeleteEntryConfirmation } from '~/components/DeleteEntryConfirmation.tsx';

class EditFormManual extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			timeEntry: this.props.timeEntry,
			description: this.props.timeEntry.description || '',
			ready: false,
			descRequired: false,
			projectRequired: false,
			taskRequired: false,
			tagsRequired: false,
			cfRequired: false,
			forceTasks: false,
			askToDeleteEntry: false,
			tags: this.props.timeEntry.tags ? this.props.timeEntry.tags : [],
			inProgress: null,
			workspaceSettings: null,
			autocompleteItems: [],
			copyAsEntry: this.props.copyAsEntry,
		};

		this.notify = this.notify.bind(this);
		this.editProject = this.editProject.bind(this);
		this.editTask = this.editTask.bind(this);
		this.updateCustomFields = this.updateCustomFields.bind(this);
		this.setAsyncStateItems = this.setAsyncStateItems.bind(this);
		this.handleInputChange = debounce(this.handleInputChange.bind(this), 200);
		this.checkIfTaskBillable = this.checkIfTaskBillable.bind(this);
		this.areCustomFieldsValid = this.areCustomFieldsValid.bind(this);
		this.cfContainsWrongChars = this.cfContainsWrongChars.bind(this);
		this.checkRequiredFields = this.checkRequiredFields.bind(this);
		this.checkProjectError = this.checkProjectError.bind(this);
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

	async checkProjectError() {
		const createProjectError = await localStorage.getItem('createProjectError');
		const createProjectErrorParsed = JSON.parse(createProjectError);
		if (createProjectErrorParsed) {
			this.notify(locales.CAN_NOT_CREATE_PROJECT_MISSING_PERMISSIONS, 'error', 5);
			await localStorage.removeItem('createProjectError');
		}
	}

	async componentDidMount() {
		this.setAsyncStateItems();
		getBrowser()
			.runtime.sendMessage({
				eventName: 'getRecentTimeEntries',
			})
			.then(res => {
				this.setState({
					autocompleteItemsRecent: res.data?.map(
						entry =>
							({
								project: {
									clientName: entry.clientName,
									color: entry.projectColor,
									name: entry.projectName,
									id: entry.projectId,
								},
								task: {
									name: entry.taskName,
									id: entry.taskId,
								},
								billable: entry.projectBillable,
								...entry,
							} || [])
					),
				});
			})
			.catch(err => console.log(err));
		const { timeEntry } = this.state;

		if (!this.props.integrationMode) {
			timeEntry.timeInterval.duration = moment.duration(
				moment(timeEntry.timeInterval.end).diff(moment(timeEntry.timeInterval.start))
			);
		}
		if (this.props.workspaceSettings.features?.customFields) {
			if (!(await isOffline())) {
				const { data, msg } = await getWSCustomFields();
				if (data) offlineStorage.wsCustomFields = data;
			}

			if (!timeEntry.customFieldValues || this.props.afterCreateProject)
				timeEntry.customFieldValues = offlineStorage.customFieldValues; // generate from wsCustomFields
		} else {
			offlineStorage.wsCustomFields = [];
		}

		// if (await isOffline()) {
		//     if (offlineStorage.timeEntryInOffline) {
		//
		//     }
		// offlineStorage.timeEntryInOffline = timeEntry;
		// }

		const { forceProjects, forceTasks } = this.props.workspaceSettings;
		const { projectId, task } = timeEntry;
		const taskId = task ? task.id : null;
		// if (forceProjects && (!projectId || forceTasks && !taskId)) {
		if (!projectId || (forceTasks && !taskId)) {
			const { projectDB, taskDB } = await this.checkDefaultProjectTask(forceTasks);
			const getBillableStatus = () => {
				if (taskDB) {
					return this.props.workspaceSettings.taskBillableEnabled
						? taskDB.billable
						: projectDB.billable;
				}
				return projectDB?.billable;
			};
			if (projectDB) {
				const entry = Object.assign(timeEntry, {
					projectId: projectDB.id,
					project: projectDB,
					task: taskDB,
					taskId: taskDB ? taskDB.id : null,
					billable: getBillableStatus(),
				});
				// if (isOffline()) {
				//     offlineStorage.timeEntryInOffline = entry;
				// }
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
			this.setState(
				{
					timeEntry,
				},
				() => {
					this.checkRequiredFields();
				}
			);
		}
	}

	handleInputChange(inputValue) {
		if (!inputValue) return;
		getBrowser()
			.runtime.sendMessage({
				eventName: 'searchEntries',
				options: {
					searchValue: inputValue,
				},
			})
			.then(res => {
				this.setState({
					autocompleteItems: res.data.map(entry => ({
						project: {
							clientName: entry.clientName,
							color: entry.projectColor,
							name: entry.projectName,
							id: entry.projectId,
						},
						task: {
							name: entry.taskName,
							id: entry.taskId,
						},
						billable: entry.projectBillable,
						...entry,
					})),
				});
			})
			.catch(err => console.log(err));
	}

	async updateCustomFields(customFields) {
		if (await isOffline()) {
			//let timeEntry = offlineStorage.timeEntryInOffline;
			let { timeEntry } = this.state;
			if (timeEntry.customFieldValues) {
				offlineStorage.updateCustomFieldValues(timeEntry, customFields);
			} else {
				// timeEntryInOffline w/o customFieldValues?
			}
			this.setState(
				{
					timeEntry,
				},
				() => this.checkRequiredFields()
			);
		} else {
			const { timeEntry } = this.state;
			if (timeEntry) {
				offlineStorage.updateCustomFieldValues(timeEntry, customFields);
				this.setState(
					{
						timeEntry,
					},
					() => this.checkRequiredFields()
				);
			}
		}
	}

	async checkDefaultProjectTask(forceTasks) {
		const { defaultProject } = await DefaultProject.getStorage();
		if (defaultProject && defaultProject.enabled) {
			let lastEntry;
			const isLastUsedProject = defaultProject.project.id === 'lastUsedProject';
			const isLastUsedProjectWithoutTask =
				defaultProject.project.id === 'lastUsedProject' &&
				!defaultProject.project.name.includes('task');

			if (!isLastUsedProject) {
				if (!isLastUsedProject) {
					const { projectDB, taskDB, msg } = await defaultProject.getProjectTaskFromDB(
						forceTasks
					);
					if (msg) {
						setTimeout(() => {
							this.toaster.toast('info', msg, 5);
						}, 2000);
					}
					return { projectDB, taskDB };
				} else {
					if (!lastEntry) {
						setTimeout(() => {
							this.toaster.toast(
								'info',
								`${locales.DEFAULT_PROJECT_NOT_AVAILABLE} ${locales.YOU_CAN_SET_A_NEW_ONE_IN_SETTINGS}`,
								5
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
			try {
				const response = await getBrowser().runtime.sendMessage({
					eventName: 'getLastUsedProjectFromTimeEntries',
					options: {
						forceTasks: !isLastUsedProjectWithoutTask,
					},
				});
				if (!response.data) throw new Error(response);
				if (!response.data) throw new Error(response);
				lastEntry = {
					project: !isLastUsedProjectWithoutTask ? response.data.project : response.data,
					task: !isLastUsedProjectWithoutTask ? response.data.task : null,
				};
				let { project, task } = lastEntry;

				if (isLastUsedProjectWithoutTask) {
					task = null;
				}
				return { projectDB: project, taskDB: task };
			} catch (e) {
				console.error('project not found', e);
				setTimeout(() => {
					this.toaster.toast(
						'info',
						`${locales.DEFAULT_PROJECT_NOT_AVAILABLE} ${locales.YOU_CAN_SET_A_NEW_ONE_IN_SETTINGS}`,
						4
					);
					this.toaster.toast(
						'info',
						`${locales.DEFAULT_PROJECT_NOT_AVAILABLE} ${locales.YOU_CAN_SET_A_NEW_ONE_IN_SETTINGS}`,
						4
					);
				}, 1000);
				return { projectDB: null, taskDB: null };
			}
		}
		return { projectDB: null, taskDB: null };
	}

	changeInterval(timeInterval) {
		let timeEntry = this.state.timeEntry;
		timeEntry.timeInterval = timeInterval;

		this.setState(
			{
				timeEntry: timeEntry,
			},
			() => {}
		);
	}

	changeDuration(newDuration) {
		if (!newDuration || !this.state.timeEntry.timeInterval.end) {
			return;
		}

		let timeEntry = this.state.timeEntry;

		let end = moment(this.state.timeEntry.timeInterval.start)
			.add(parseInt(newDuration.split(':')[0]), 'hours')
			.add(parseInt(newDuration.split(':')[1]), 'minutes')
			.add(parseInt(newDuration.split(':')[2]), 'seconds');

		timeEntry.timeInterval.end = end;
		timeEntry.timeInterval.duration = duration(
			moment(this.state.timeEntry.timeInterval.end).diff(timeEntry.timeInterval.start)
		);

		this.setState(
			{
				timeEntry: timeEntry,
			},
			() => {}
		);
	}

	setDescription(description) {
		if (description.length > 3000) {
			this.setState({ description: description.slice(0, 3000) });
			this.toaster.toast('error', locales.DESCRIPTION_LIMIT_ERROR_MSG(3000), 2);
		}

		this.setState(
			state => ({
				timeEntry: {
					...state.timeEntry,
					description,
				},
			}),
			() => this.checkRequiredFields()
		);
	}

	async editProject(project) {
		const projectId = project && project.id && project.id !== 'no-project' ? project.id : null;

		if (await isOffline()) {
			let timeEntry = offlineStorage.timeEntryInOffline;
			if (timeEntry && timeEntry.id === this.state.timeEntry.id) {
				timeEntry.projectId = projectId;
				timeEntry.project = project;
				timeEntry.billable = project && project.billable ? project.billable : null;
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
				timeEntries.map(timeEntry => {
					if (timeEntry.id === this.state.timeEntry.id) {
						timeEntry.projectId = projectId;
						timeEntry.project = project;
						timeEntry.billable = project && project.billable ? project.billable : null;
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
			this.setState(
				state => ({
					timeEntry: {
						...state.timeEntry,
						projectId,
						billable: project && project.billable ? project.billable : null,
						project,
						task: null,
					},
				}),
				() => {
					this.checkRequiredFields();
				}
			);
		}
	}

	editTask(task, project) {
		this.setState(
			state => ({
				timeEntry: {
					...state.timeEntry,
					projectId: project.id,
					billable: this.props.workspaceSettings?.taskBillableEnabled
						? task.billable
						: project.billable,
					project,
					taskId: task.id,
					task,
				},
			}),
			() => {
				this.checkRequiredFields();
			}
		);
	}

	editTags(tag) {
		let tagIds = this.state.tags ? this.state.tags.map(it => it.id) : [];
		let tagList = this.state.tags;
		let timeEntry = { ...this.state.timeEntry };

		if (tagIds.includes(tag.id)) {
			tagIds.splice(tagIds.indexOf(tag.id), 1);
			tagList = tagList.filter(t => t.id !== tag.id);
		} else {
			tagIds.push(tag.id);
			tagList.push(tag);
		}

		timeEntry.tagIds = tagIds;
		this.setState(
			{
				timeEntry: timeEntry,
				tags: tagList,
			},
			() => this.checkRequiredFields()
		);
	}

	editBillable() {
		let timeEntry = this.state.timeEntry;
		timeEntry.billable = !this.state.timeEntry.billable;

		this.setState({
			timeEntry: timeEntry,
		});
	}

	deleteEntry() {
		this.goBack();
		let timeEntries = offlineStorage.timeEntriesOffline;
		if (
			timeEntries.findIndex(entryOffline => entryOffline.id === this.state.timeEntry.id) > -1
		) {
			timeEntries.splice(
				timeEntries.findIndex(entry => entry.id === this.state.timeEntry.id),
				1
			);
		}
		offlineStorage.timeEntriesOffline = timeEntries;
	}

	async checkRequiredFields() {
		let descRequired = false;
		let projectRequired = false;
		let taskRequired = false;
		let tagsRequired = false;
		let forceTasks = false;
		let workspaceSettings;

		const isOnline = !(await isOffline());

		if (typeof this.props?.workspaceSettings?.forceDescription !== 'undefined') {
			workspaceSettings = this.props.workspaceSettings;
		} else {
			let wss = await localStorage.getItem('workspaceSettings');
			workspaceSettings = wss ? JSON.parse(wss) : null;
		}

		if (workspaceSettings) {
			if (
				workspaceSettings.forceDescription &&
				(!this.state.timeEntry.description || this.state.timeEntry.description === '')
			) {
				descRequired = true;
			}

			if (workspaceSettings.forceProjects && !this.state.timeEntry.projectId && isOnline) {
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
				(!this.state.timeEntry.tagIds || !this.state.timeEntry.tagIds.length > 0) &&
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

	async checkIfTaskBillable(selected) {
		if (this.state.timeEntry.taskId) {
			const tasksBillable = this.props.workspaceSettings.taskBillableEnabled || false;
			if (tasksBillable) {
				let projectTask = await getBrowser().runtime.sendMessage({
					eventName: 'getTaskOfProject',
					options: {
						projectId: this.state.timeEntry.project.id,
						taskName: this.state.timeEntry.task.name,
					},
				});
				const { data } = projectTask;
				const selectedTask = data.find(
					task => task.name === this.state.timeEntry.task.name
				);
				projectTask.data &&
					this.setState({
						timeEntry: {
							...this.state.timeEntry,
							billable: selectedTask.billable,
						},
					});
				return;
			}
			this.setState({
				timeEntry: {
					...this.state.timeEntry,
					billable: selected.billable,
				},
			});
		} else {
			this.setState({
				timeEntry: {
					...this.state.timeEntry,
					billable: selected.projectBillable,
				},
			});
		}
	}

	areCustomFieldsValid(val) {
		this.setState({ cfRequired: !val });
	}

	cfContainsWrongChars({ id, isCustomFieldContainsWrongChars }) {
		const { customFieldsContainWrongChars } = this.state;
		this.setState({
			customFieldsContainWrongChars: {
				...customFieldsContainWrongChars,
				[id]: isCustomFieldContainsWrongChars,
			},
		});
	}

	async done() {
		const { description } = this.state.description;
		const pattern = /<[^>]+>/;
		const descriptionContainsWrongChars = pattern.test(description);

		if (descriptionContainsWrongChars) {
			return this.toaster.toast('error', locales.FORBIDDEN_CHARACTERS, 2);
		}

		if (
			this.state.descRequired ||
			this.state.projectRequired ||
			this.state.taskRequired ||
			this.state.tagsRequired ||
			this.state.cfRequired
		) {
			return;
		}

		if ((await isOffline()) && !this.props.integrationMode) {
			const {
				workspaceId,
				description,
				timeInterval,
				projectId,
				task,
				tagIds,
				billable,
				customFieldValues,
			} = this.state.timeEntry;
			let timeEntry = {
				workspaceId,
				id: offlineStorage.timeEntryIdTemp,
				description,
				billable,
				projectId,
				timeInterval: {
					start: timeInterval.start,
					end: timeInterval.end,
					duration: duration(moment(timeInterval.end).diff(moment(timeInterval.start))),
				},
				customFieldValues: customFieldValues ? customFieldValues : null,
			};
			let timeEntries = offlineStorage.timeEntriesOffline;
			timeEntries.push(timeEntry);
			offlineStorage.timeEntriesOffline = timeEntries;
			this.goBack();
		} else {
			if (
				this.state.descRequired ||
				this.state.projectRequired ||
				this.state.taskRequired ||
				this.state.tagsRequired
			) {
				return;
			} else {
				const { timeEntry } = this.state;
				let {
					description,
					timeInterval,
					projectId,
					task,
					tagIds,
					billable,
					customFieldValues,
				} = timeEntry;
				const cfs =
					customFieldValues && customFieldValues.length > 0
						? customFieldValues
								//.filter((cf) => cf.customFieldDto.status === 'VISIBLE')
								.map(({ type, customFieldId, value }) => ({
									customFieldId,
									sourceType: 'TIMEENTRY',
									value: type === 'NUMBER' ? parseFloat(value) : value,
								}))
						: [];

				// if component is executed via "copy as time entry" feature
				// timeEntry.timeInterval already has start and end properties
				if (!this.state.copyAsEntry) {
					if (this.props.integrationMode) {
						const start = new Date();
						timeInterval = {
							start,
							end: new Date(start.getTime() + this.props.timeEntry.totalMins * 60000),
						};
					} else if (timeInterval.start.toDate) {
						timeInterval = {
							start: timeInterval.start.toDate(),
							end: timeInterval.end.toDate(),
						};
					}
				} else {
					if ('toDate' in timeInterval.start) {
						timeInterval.start = timeInterval.start.toDate();
					}

					if ('toDate' in timeInterval.end) {
						timeInterval.end = timeInterval.end.toDate();
					}
				}
				getBrowser()
					.runtime.sendMessage({
						eventName: 'startWithDescription',
						options: {
							projectId,
							description,
							billable,
							start: timeInterval.start,
							end: timeInterval.end,
							taskId: task ? task.id : null,
							tagIds: tagIds ? tagIds : [],
							customFields: cfs,
							manualMode: true,
							integrationName: this.props.integrationName,
							isStartedFromIntegration: Boolean(this.props.integrationName),
						},
					})
					.then(response => {
						let timeEntries = offlineStorage.timeEntriesOffline;
						if (
							timeEntries.findIndex(
								entryOffline => entryOffline.id === this.state.timeEntry.id
							) > -1
						) {
							timeEntries.splice(
								timeEntries.findIndex(
									entry => entry.id === this.state.timeEntry.id
								),
								1
							);
						}

						offlineStorage.timeEntriesOffline = timeEntries;
						if (this.props.integrationMode) {
							const message = this.state.copyAsEntry
								? 'Successfully updated'
								: 'Time submitted!';
							this.notify(message, 'success', 10);
							setTimeout(() => {
								this.goBack();
							}, 1000);
						} else {
							this.goBack();
						}
					})
					.catch(error => {
						if (error.request.status === 403) {
							const response = JSON.parse(error.request.response);
							if (response.code === 4030) {
								this.notify(response.message, 'info', 10);
							}
						}
						if (error.request.status === 400) {
							const response = JSON.parse(error.request.response);
							if (response.code === 501) {
								this.notify(response.message, 'error', 3);
							}
						}
					});
			}
		}
	}

	changeDate(date) {
		const choosenDate = new Date(date);

		const choosenYear = choosenDate.getFullYear();
		const choosenMonth = choosenDate.getMonth();
		const choosenDay = choosenDate.getDate();

		const start = moment(this.state.timeEntry.timeInterval.start)
			.year(choosenYear)
			.month(choosenMonth)
			.date(choosenDay);
		const end = moment(this.state.timeEntry.timeInterval.end)
			.year(choosenYear)
			.month(choosenMonth)
			.date(choosenDay);
		const duration = end.diff(start);

		const timeEntry = this.state.timeEntry;

		timeEntry.timeInterval = { start, end, duration };

		this.setState({ timeEntry });
	}

	changeMode(mode) {
		this.props.changeMode(mode);
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
		if (this.props.integrationMode) {
			this.props.closeIntegrationPopup();
			return;
		}
		window.reactRoot.render(<HomePage />);
	}

	notify(message, type = 'error', n = 2) {
		this.toaster.toast(type, message, n);
	}

	isBillableShowable() {
		const { activeBillableHours, onlyAdminsCanChangeBillableStatus } =
			this.props.workspaceSettings;
		const { isUserOwnerOrAdmin } = this.state;

		const canUserSeeBillable =
			!onlyAdminsCanChangeBillableStatus ||
			(onlyAdminsCanChangeBillableStatus && isUserOwnerOrAdmin);

		return activeBillableHours && canUserSeeBillable;
	}

	onSetDescription(description) {
		this.setState(
			{
				description: description.target.value,
			},
			() => this.setDescription(this.state.description.trim())
		);
	}

	render() {
		if (!this.state.ready) {
			return null;
		} else {
			this.checkProjectError();
			const { timeEntry } = this.state;
			//const hideBillable = offlineStorage.onlyAdminsCanChangeBillableStatus && !offlineStorage.isUserOwnerOrAdmin;

			return (
				<div>
					{!this.props.integrationMode && (
						<>
							<Header
								backButton={true}
								disableManual={this.state.inProgress}
								disableAutomatic={false}
								changeMode={this.changeMode.bind(this)}
								workspaceSettings={JSON.parse(this.state.workspaceSettings)}
								goBackTo={this.goBack.bind(this)}
							/>
							<Duration
								ref={instance => {
									this.duration = instance;
								}}
								timeEntry={timeEntry}
								changeInterval={this.changeInterval.bind(this)}
								changeDuration={this.changeDuration.bind(this)}
								changeDate={this.changeDate.bind(this)}
								timeFormat={this.props.timeFormat}
								isUserOwnerOrAdmin={this.state.isUserOwnerOrAdmin}
								workspaceSettings={this.props.workspaceSettings}
								userSettings={this.props.userSettings}
								isFormManual={true}
								copyAsEntry={this.state.copyAsEntry}
							/>
						</>
					)}
					<Toaster
						ref={instance => {
							this.toaster = instance;
						}}
					/>
					<div className="edit-form">
						{this.state.copyAsEntry && (
							<Duration
								ref={instance => {
									this.duration = instance;
								}}
								timeEntry={timeEntry}
								changeInterval={this.changeInterval.bind(this)}
								changeDuration={this.changeDuration.bind(this)}
								changeDate={this.changeDate.bind(this)}
								timeFormat={this.props.timeFormat}
								isUserOwnerOrAdmin={this.state.isUserOwnerOrAdmin}
								workspaceSettings={this.props.workspaceSettings}
								userSettings={this.props.userSettings}
								isFormManual={true}
								copyAsEntry={this.state.copyAsEntry}
							/>
						)}

						<div
							className={
								this.state.descRequired
									? 'description-textarea-required'
									: 'description-textarea'
							}>
							<Autocomplete
								items={
									this.state.timeEntry.description?.length >= 2
										? this.state.autocompleteItems
										: this.state.autocompleteItemsRecent
								}
								value={this.state.description}
								onChange={e => {
									const { value } = e.target;
									this.setDescription(value);
									if (value.length >= 2) {
										this.handleInputChange(value);
									} else {
										this.handleInputChange(null);
									}
								}}
								onSelect={item => {
									const selected =
										this.state.description?.length >= 2
											? this.state.autocompleteItems.find(
													entry => entry.id === item.id
											  )
											: this.state.autocompleteItemsRecent.find(
													entry => entry.id === item.id
											  );

									if (selected) {
										this.setState(
											state => ({
												description: selected.description,
												timeEntry: {
													...state.timeEntry,
													...selected,
													billable: this.state.timeEntry.billable,
													timeInterval: {
														...state.timeEntry.timeInterval,
													},
													tagIds: selected.tags.map(el => el.id),
												},
												tags: selected.tags,
											}),
											() => {
												this.checkIfTaskBillable(selected);
												this.checkRequiredFields();
											}
										);
									}
								}}
								renderInput={props => (
									<textarea
										placeholder={
											this.state.descRequired
												? `${locales.DESCRIPTION_LABEL} ${locales.REQUIRED_LABEL}`
												: locales.DESCRIPTION_LABEL
										}
										className={'edit-form-description'}
										type="text"
										onInput={this.onSetDescription.bind(this)}
										{...props}
										onBlur={event => {
											const description = event.target.value;
											const pattern = /<[^>]+>/;
											const descriptionContainsWrongChars =
												pattern.test(description);

											if (descriptionContainsWrongChars) {
												return this.toaster.toast(
													'error',
													locales.FORBIDDEN_CHARACTERS,
													2
												);
											}
										}}
									/>
								)}
							/>
						</div>
						<div className="edit-form__project_list">
							<ProjectList
								selectProject={this.editProject}
								selectTask={this.editTask}
								noTasks={false}
								workspaceSettings={this.props.workspaceSettings}
								isUserOwnerOrAdmin={this.state.isUserOwnerOrAdmin}
								projectRequired={this.state.projectRequired}
								taskRequired={this.state.taskRequired}
								forceTasks={this.state.forceTasks}
								timeEntry={timeEntry}
								editForm={false}
								userSettings={this.props.userSettings}
								integrationMode={this.props.integrationMode}
								checkRequiredFields={this.checkRequiredFields}
							/>
						</div>
						<TagsList
							ref={instance => {
								this.tagList = instance;
							}}
							tags={this.state.tags ? this.state.tags : []}
							tagIds={timeEntry.tagIds ? this.state.tags.map(it => it.id) : []}
							editTag={this.editTags.bind(this)}
							tagsRequired={this.state.tagsRequired}
							isUserOwnerOrAdmin={this.state.isUserOwnerOrAdmin}
							workspaceSettings={this.props.workspaceSettings}
							editForm={false}
							errorMessage={this.notify}
							integrationMode={this.props.integrationMode}
						/>
						<div className="edit-form-buttons">
							{this.isBillableShowable() && (
								<div>
									<span
										className={
											timeEntry.billable
												? 'edit-form-checkbox checked'
												: 'edit-form-checkbox'
										}
										onClick={this.editBillable.bind(this)}
										tabIndex={'0'}
										onKeyDown={e => {
											if (e.key === 'Enter') this.editBillable();
										}}>
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
										onClick={this.editBillable.bind(this)}
										className="edit-form-billable">
										{locales.BILLABLE_LABEL}
									</label>
								</div>
							)}
							{this.props.workspaceSettings.features.customFields && (
								<CustomFieldsContainer
									cfContainsWrongChars={this.cfContainsWrongChars}
									key="customFieldsContainer"
									timeEntry={timeEntry}
									isUserOwnerOrAdmin={this.state.isUserOwnerOrAdmin}
									manualMode={true}
									updateCustomFields={this.updateCustomFields}
									areCustomFieldsValid={this.areCustomFieldsValid}
									isInProgress={this.props.inProgress}
									workspaceSettings={this.props.workspaceSettings}
								/>
							)}
							<div className="edit-form-right-buttons">
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
									}>
									{locales.ADD}
								</button>
								{!this.props.integrationMode && (
									<>
										<div className="edit-form-right-buttons__back_and_delete">
											<span
												onClick={this.askToDeleteEntry.bind(this)}
												className="edit-form-delete">
												{locales.DELETE}
											</span>
										</div>
										<DeleteEntryConfirmation
											askToDeleteEntry={this.state.askToDeleteEntry}
											canceled={this.cancelDeletingEntry.bind(this)}
											confirmed={this.deleteEntry.bind(this)}
										/>
									</>
								)}
							</div>
						</div>
					</div>
				</div>
			);
		}
	}
}

export default EditFormManual;
