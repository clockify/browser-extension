import React, { Component } from 'react';
import moment, { duration } from 'moment';
import { parseTimeEntryDuration } from './duration-input-converter';
import EditForm from './edit-form.component';
import { Autocomplete } from '~/components/Autocomplete.tsx';
import EditFormManual from './edit-form-manual.component';
import { isOffline } from './check-connection';
import { getIconStatus } from '../enums/browser-icon-status-enum';
import { Application } from '../application';
import { TimeEntryHelper } from '../helpers/timeEntry-helper';
import { getKeyCodes } from '../enums/key-codes.enum';
import { getBrowser } from '../helpers/browser-helper';
import { getRequiredMissingCustomFields } from '../helpers/utils';
import { offlineStorage } from '../helpers/offlineStorage';
import locales from '../helpers/locales';
import debounce from 'lodash.debounce';
import Toaster from './toaster-component';

const timeEntryHelper = new TimeEntryHelper();
let interval;

class StartTimer extends Component {
	constructor(props) {
		super(props);

		this.state = {
			timeEntry: {},
			time: moment().hour(0).minute(0).second(0).format('HH:mm:ss'),
			interval: '',
			mode: this.props.mode,
			stopDisabled: false,
			autocompleteItems: [],
			autocompleteItemsRecent: [],
		};
		this.application = new Application();
		this.startNewEntry = this.startNewEntry.bind(this);
		this.startNewEntryWithoutGoingToEdit = this.startNewEntryWithoutGoingToEdit.bind(this);
		this.setAsyncStateItems = this.setAsyncStateItems.bind(this);
		this.setDescription = this.setDescription.bind(this);
		this.handleInputChange = debounce(this.handleInputChange.bind(this), 200);
		this.getRecentEntries = this.getRecentEntries.bind(this);
		this.showManualInputPlaceholder = this.showManualInputPlaceholder.bind(this);
		this.showTimerPlaceHolder = this.showTimerPlaceHolder.bind(this);
		this.goToEdit = this.goToEdit.bind(this);
	}

	async setAsyncStateItems() {
		const timeEntry = (await localStorage.getItem('timeEntryInProgress')) || {};
		const workspaceSettings = await localStorage.getItem('workspaceSettings');
		let currentPeriod = moment().diff(moment(timeEntry?.timeInterval?.start));
		this.setState({
			timeEntry,
			time: timeEntry?.timeInterval?.start
				? duration(currentPeriod).format('HH:mm:ss', { trim: false })
				: moment().hour(0).minute(0).second(0).format('HH:mm:ss'),
		});
		if (workspaceSettings) {
			this.getTimeEntryInProgress();
		}
	}

	componentDidMount() {
		this.setAsyncStateItems();
		this.getRecentEntries();
	}

	componentDidUpdate(prevProps, prevState) {
		if (
			this.props.activeWorkspaceId !== prevProps.activeWorkspaceId ||
			this.props.timeEntries !== prevProps.timeEntries
		) {
			this.getRecentEntries();
		}

		if (this.state.time !== prevState.time) {
			this.props.startTimeChanged(this.state.time);
		}
	}

	componentWillUnmount() {
		if (interval) {
			clearInterval(interval);
		}
	}

	getRecentEntries() {
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

	async getTimeEntryInProgress() {
		if (await isOffline()) {
			this.setState(
				{
					timeEntry: offlineStorage.timeEntryInOffline
						? offlineStorage.timeEntryInOffline
						: {},
				},
				() => {
					if (this.state.timeEntry.timeInterval) {
						let currentPeriod = moment().diff(
							moment(this.state.timeEntry.timeInterval.start)
						);
						interval = setInterval(() => {
							currentPeriod = currentPeriod + 1000;
							this.setState({
								time: duration(currentPeriod).format('HH:mm:ss', {
									trim: false,
								}),
							});
						}, 1000);

						this.props.changeMode('timer');
						this.props.setTimeEntryInProgress(this.state.timeEntry);
					}
				}
			);
		} else {
			getBrowser()
				.runtime.sendMessage({
					eventName: 'getEntryInProgress',
				})
				.then(response => {
					let timeEntry = response.data;
					this.setTimeEntryInProgress(timeEntry);
				})
				.catch(error => {
					this.application.setIcon(getIconStatus().timeEntryEnded);
				});
		}
	}

	async setTimeEntryInProgress(timeEntry) {
		let inProgress = false;
		if (interval) {
			clearInterval(interval);
		}
		if (timeEntry) {
			this.setState(
				{
					timeEntry,
				},
				() => {
					let currentPeriod = moment().diff(moment(timeEntry.timeInterval.start));
					this.setState({
						time: duration(currentPeriod).format('HH:mm:ss', { trim: false }),
					});
					interval = setInterval(() => {
						currentPeriod = currentPeriod + 1000;
						this.setState({
							time: duration(currentPeriod).format('HH:mm:ss', { trim: false }),
						});
					}, 1000);
					this.props.changeMode('timer');
					this.props.setTimeEntryInProgress(timeEntry);
				}
			);
			inProgress = true;
			this.application.setIcon(
				inProgress ? getIconStatus().timeEntryStarted : getIconStatus().timeEntryEnded
			);
			const { forceProjects, forceTasks } = this.props.workspaceSettings;
			const taskId = timeEntry.task ? timeEntry.task.id : timeEntry.taskId;

			// if (forceProjects && (!timeEntry.projectId || forceTasks && !taskId)) {
			if (!timeEntry.projectId || (forceTasks && !taskId)) {
				const { projectDB, taskDB } = await this.checkDefaultProjectTask(forceTasks);
				if (projectDB) {
					const entry = await timeEntryHelper.updateProjectTask(
						timeEntry,
						projectDB,
						taskDB
					);
					this.setState({
						timeEntry: entry,
					});
				}
			}
		} else {
			this.setState({
				timeEntry: {},
				time: moment().hour(0).minute(0).second(0).format('HH:mm:ss'),
			});
			this.props.setTimeEntryInProgress(timeEntry);
			this.application.setIcon(
				inProgress ? getIconStatus().timeEntryStarted : getIconStatus().timeEntryEnded
			);
			getBrowser().runtime.sendMessage({
				eventName: 'restartPomodoro',
			});
		}
	}

	async checkDefaultProjectTask(forceTasks) {
		// const { defaultProject } = DefaultProject.getStorage();
		// const lastEntry = this.props.timeEntries && this.props.timeEntries[0];
		// const isLastUsedProject = defaultProject.project.id === 'lastUsedProject';
		// const isLastUsedProjectWithoutTask = defaultProject.project.id === 'lastUsedProject' && !defaultProject.project.name.includes('task');

		// if(defaultProject && defaultProject.enabled){
		//     if (!isLastUsedProject) {
		//         const { projectDB, taskDB, msg } = await defaultProject.getProjectTaskFromDB(forceTasks);
		//         if (msg) {
		//             this.props.toaster.toast('info', msg, 5);
		//         }
		//         return {projectDB, taskDB};
		//     } else {
		//         if (!lastEntry) {
		//             this.props.toaster.toast('info', 'Your default project is no longer available. You can set a new one in Settings', 5);
		//             return {projectDB: null, taskDB: null};
		//         }
		//         let { project, task } = lastEntry;

		//         if(isLastUsedProjectWithoutTask){
		//             task = null;
		//         }

		//         return {projectDB: project, taskDB: task};
		//     }
		// }
		return { projectDB: null, taskDB: null };
	}

	setDescription(description) {
		if (description.length > 3000) {
			description = description.slice(0, 3000);
			this.props.toaster.toast('error', locales.DESCRIPTION_LIMIT_ERROR_MSG(3000), 2);
		}

		this.setState(state => ({
			timeEntry: {
				...state.timeEntry,
				description,
			},
		}));
	}

	setDuration(event) {
		this.setState({ manualInputValue: event.target.value });
		let duration = parseTimeEntryDuration(event.target.value);

		if (!duration) {
			return;
		}
		let end = moment()
			.add(parseInt(duration.split(':')[0]), 'hours')
			.add(parseInt(duration.split(':')[1]), 'minutes')
			.add(parseInt(duration.split(':')[2]), 'seconds');
		let timeEntry = {
			timeInterval: {
				start: moment(),
				end: end,
			},
		};

		this.setState({
			timeEntry: timeEntry,
		});
	}

	async startNewEntry() {
		if (interval) {
			clearInterval(interval);
		}
		if (await isOffline()) {
			this.setState(
				{
					timeEntry: {
						workspaceId: await localStorage.getItem('activeWorkspaceId'),
						id: offlineStorage.timeEntryIdTemp,
						description: this.state.timeEntry.description,
						projectId: this.state.timeEntry.projectId,
						timeInterval: {
							start: moment(),
						},
						customFieldValues: offlineStorage.customFieldValues, // generated from wsCustomFields
					},
				},
				() => {
					offlineStorage.timeEntryInOffline = this.state.timeEntry;
					this.props.changeMode('timer');
					this.props.setTimeEntryInProgress(this.state.timeEntry);
					this.goToEdit({ inProgress: true });
				}
			);
		} else {
			let { projectId, billable, task, description, customFieldValues, tags } =
				this.state.timeEntry;

			if (/<[^>]+>/.test(description)) {
				return this.props.toaster.toast('error', locales.FORBIDDEN_CHARACTERS, 2);
			}
			let taskId = task ? task.id : null;
			const tagIds = tags ? tags.map(tag => tag.id) : [];

			const { forceProjects, forceTasks } = this.props.workspaceSettings;
			//if (forceProjects && (!projectId || forceTasks && !taskId)) {
			if (!projectId || (forceTasks && !taskId)) {
				const { projectDB, taskDB } = await this.checkDefaultProjectTask(forceTasks);
				if (projectDB) {
					projectId = projectDB.id;
					if (taskDB) {
						taskId = taskDB.id;
					}
					billable = projectDB.billable;
				}
			}
			const cfs =
				customFieldValues && customFieldValues.length > 0
					? customFieldValues.map(({ type, customFieldId, value }) => ({
							customFieldId,
							sourceType: 'TIMEENTRY',
							value: type === 'NUMBER' ? parseFloat(value) : value,
					  }))
					: [];
			getBrowser()
				.runtime.sendMessage({
					eventName: 'startWithDescription',
					options: {
						projectId,
						description,
						billable: null,
						start: null,
						end: null,
						taskId,
						tagIds,
						customFields: cfs,
					},
				})
				.then(response => {
					let data = response.data;
					this.setState(
						{
							timeEntry: data,
						},
						() => {
							this.props.changeMode('timer');
							this.props.setTimeEntryInProgress(data);
							this.application.setIcon(getIconStatus().timeEntryStarted);

							getBrowser().runtime.sendMessage({
								eventName: 'addIdleListenerIfIdleIsEnabled',
							});
							getBrowser().runtime.sendMessage({
								eventName: 'removeReminderTimer',
							});
							localStorage.setItem({
								timeEntryInProgress: data,
							});

							this.goToEdit({ inProgress: true });
						}
					);
				})
				.catch(() => {});
		}
	}

	async startNewEntryWithoutGoingToEdit() {
		if (interval) {
			clearInterval(interval);
		}
		if (await isOffline()) {
			this.setState(
				{
					timeEntry: {
						workspaceId: await localStorage.getItem('activeWorkspaceId'),
						id: offlineStorage.timeEntryIdTemp,
						description: this.state.timeEntry.description,
						projectId: this.state.timeEntry.projectId,
						timeInterval: {
							start: moment(),
						},
						customFieldValues: offlineStorage.customFieldValues, // generated from wsCustomFields
					},
				},
				() => {
					offlineStorage.timeEntryInOffline = this.state.timeEntry;
					this.props.changeMode('timer');
					this.props.setTimeEntryInProgress(this.state.timeEntry);
				}
			);
		} else {
			let { projectId, billable, task, description, customFieldValues, tags } =
				this.state.timeEntry;

			if (/<[^>]+>/.test(description)) {
				return this.props.toaster.toast('error', locales.FORBIDDEN_CHARACTERS, 2);
			}
			let taskId = task ? task.id : null;
			const tagIds = tags ? tags.map(tag => tag.id) : [];

			const { forceProjects, forceTasks } = this.props.workspaceSettings;
			//if (forceProjects && (!projectId || forceTasks && !taskId)) {
			if (!projectId || (forceTasks && !taskId)) {
				const { projectDB, taskDB } = await this.checkDefaultProjectTask(forceTasks);
				if (projectDB) {
					projectId = projectDB.id;
					if (taskDB) {
						taskId = taskDB.id;
					}
					billable = projectDB.billable;
				}
			}
			const cfs =
				customFieldValues && customFieldValues.length > 0
					? customFieldValues.map(({ type, customFieldId, value }) => ({
							customFieldId,
							sourceType: 'TIMEENTRY',
							value: type === 'NUMBER' ? parseFloat(value) : value,
					  }))
					: [];
			getBrowser()
				.runtime.sendMessage({
					eventName: 'startWithDescription',
					options: {
						projectId,
						description: description?.trim(),
						billable: null,
						start: null,
						end: null,
						taskId,
						tagIds,
						customFields: cfs,
					},
				})
				.then(response => {
					let data = response.data;
					this.setState(
						{
							timeEntry: data,
						},
						() => {
							this.props.changeMode('timer');
							this.props.setTimeEntryInProgress(data);
							this.application.setIcon(getIconStatus().timeEntryStarted);

							getBrowser().runtime.sendMessage({
								eventName: 'addIdleListenerIfIdleIsEnabled',
							});
							getBrowser().runtime.sendMessage({
								eventName: 'removeReminderTimer',
							});
							localStorage.setItem({
								timeEntryInProgress: data,
							});
						}
					);
				})
				.catch(() => {});
		}
	}

	async checkRequiredFields() {
		const isOff = await isOffline();
		if (this.state.stopDisabled) return;

		if (isOff) {
			let timeEntryOffline = offlineStorage.timeEntryInOffline;
			if (!timeEntryOffline) {
				// user tries to Stop TimeEntry which has been started onLine
				const inProgress = await localStorage.getItem('inProgress');
				if (inProgress && JSON.parse(inProgress)) {
					this.setTimeEntryInProgress(null);
				}
				this.props.endStarted();
				return;
			}
		}
		this.setState({
			stopDisabled: true,
		});
		const { forceDescription, forceProjects, forceTasks, forceTags } =
			this.props.workspaceSettings;
		const { description, project, task, tags } = this.state.timeEntry;

		const requiredAndMissingCustomFields = await getRequiredMissingCustomFields(
			project,
			this.state.timeEntry
		);

		if (isOff) {
			this.stopEntryInProgress();
		} else if (forceDescription && (description === '' || !description)) {
			this.goToEdit({ inProgress: true });
		} else if (forceProjects && !project) {
			this.goToEdit({ inProgress: true });
		} else if (forceTasks && !task) {
			this.goToEdit({ inProgress: true });
		} else if (forceTags && (!tags || !tags.length > 0)) {
			this.goToEdit({ inProgress: true });
		} else if (requiredAndMissingCustomFields.length) {
			this.goToEdit({ inProgress: true });
		} else {
			this.stopEntryInProgress();
		}
	}

	async stopEntryInProgress() {
		getBrowser().runtime.sendMessage({
			eventName: 'resetBadge',
		});
		if (await isOffline()) {
			let timeEntryOffline = offlineStorage.timeEntryInOffline;
			if (!timeEntryOffline) return;
			timeEntryOffline.timeInterval.end = moment();
			timeEntryOffline.timeInterval.duration = duration(
				moment().diff(timeEntryOffline.timeInterval.start)
			);
			const timeEntriesOffline = offlineStorage.timeEntriesOffline;
			timeEntriesOffline.push(timeEntryOffline);
			offlineStorage.timeEntriesOffline = timeEntriesOffline;
			offlineStorage.timeEntryInOffline = null;

			clearInterval(interval);
			interval = null;
			this.setState({
				timeEntry: {},
				time: moment().hour(0).minute(0).second(0).format('HH:mm:ss'),
				interval: '',
				stopDisabled: false,
			});
			this.props.setTimeEntryInProgress(null);
		} else {
			getBrowser()
				.runtime.sendMessage({
					eventName: 'endInProgress',
					options: {
						endedFromIntegration: false,
					},
				})
				.then(data => {
					if (data.status === 403) {
						this.setState({ stopDisabled: false });
						return this.toaster.toast('error', data.message, 2);
					}

					if (data.status === 400) {
						this.goToEdit({ inProgress: true });
						return;
					}
					localStorage.setItem('timeEntryInProgress', null);
					getBrowser().runtime.sendMessage({
						eventName: 'restartPomodoro',
					});
					this.props.endStarted();
					clearInterval(interval);
					interval = null;
					this.setState({
						timeEntry: {},
						time: moment().hour(0).minute(0).second(0).format('HH:mm:ss'),
						stopDisabled: false,
					});
					this.props.setTimeEntryInProgress(null);

					getBrowser().runtime.sendMessage({
						eventName: 'removeIdleListenerIfIdleIsEnabled',
					});

					getBrowser().runtime.sendMessage({
						eventName: 'reminder',
					});

					this.application.setIcon(getIconStatus().timeEntryEnded);
				})
				.catch(error => {
					this.props.log('timeEntryService.stopEntryInProgress error');
					// if error message says that some fields are required, open the edit page
					if (res.response?.data?.message?.includes('required')) {
						this.goToEdit({ inProgress: true });
					}
				});
		}
	}

	changeMode(mode) {
		this.props.changeMode(mode);
	}

	goToEdit(params) {
		if (!this.state.timeEntry) {
			return null;
		}
		window.reactRoot.render(
			<EditForm
				changeMode={this.changeMode.bind(this)}
				timeEntry={this.state.timeEntry}
				timeEntries={this.props.timeEntries}
				workspaceSettings={this.props.workspaceSettings}
				timeFormat={this.props.timeFormat}
				userSettings={this.props.userSettings}
				inProgress={params.inProgress}
			/>
		);
	}

	async goToEditManual() {
		const activeWorkspaceId = await localStorage.getItem('activeWorkspaceId');
		if (!this.state.timeEntry.timeInterval) {
			this.setState(
				{
					timeEntry: {
						workspaceId: activeWorkspaceId,
						timeInterval: {
							start: moment(),
							end: moment(),
						},
					},
				},
				() => {
					window.reactRoot.render(
						<EditFormManual
							changeMode={this.changeMode.bind(this)}
							workspaceSettings={this.props.workspaceSettings}
							timeEntry={this.state.timeEntry}
							timeEntries={this.props.timeEntries}
							timeFormat={this.props.timeFormat}
							userSettings={this.props.userSettings}
							inProgress={true}
						/>
					);
				}
			);
		} else {
			const { timeEntry } = this.state;
			if (!timeEntry.workspaceId) timeEntry.workspaceId = activeWorkspaceId;

			window.reactRoot.render(
				<EditFormManual
					changeMode={this.changeMode.bind(this)}
					workspaceSettings={this.props.workspaceSettings}
					timeEntry={timeEntry}
					timeEntries={this.props.timeEntries}
					timeFormat={this.props.timeFormat}
					userSettings={this.props.userSettings}
					inProgress={true}
				/>
			);
		}
	}

	onKey(event) {
		const { enter } = getKeyCodes();
		if (enter.includes(event.keyCode)) {
			if (event.target.id === 'description') {
				this.startNewEntry();
			} else if (event.target.id === 'duration') {
				this.goToEditManual();
			}
		}
	}

	showTimerPlaceHolder() {
		return (
			this.props.mode === 'timer' &&
			(!this.state.timeEntry.description ||
				this.state.timeEntry?.description?.length === 0) &&
			!this.state.timeEntry.id
		);
	}

	showManualInputPlaceholder() {
		return (
			this.props.mode === 'manual' &&
			(!this.state.manualInputValue || this.state.manualInputValue?.length === 0)
		);
	}

	render() {
		if (!this.state.timeEntry) {
			return null;
		}
		const { id, description, task, project } = this.state.timeEntry;

		return (
			<div id="start-timer">
				<Toaster ref={instance => (this.toaster = instance)} />
				<div className="start-timer">
					{/* <span>Offline <input type='checkbox' checked={this.isChecked} onChange={this.handleChangeOffline} />  </span> */}
					<span
						className={
							this.props.mode === 'timer' ? 'start-timer-description' : 'disabled'
						}>
						<div
							onClick={() => this.goToEdit({ inProgress: true })}
							className={id ? 'start-timer_description' : 'disabled'}>
							<span>{description || locales.NO_DESCRIPTION}</span>
							<div
								style={project ? { color: project.color } : {}}
								className={project ? 'time-entry-project' : 'disabled'}>
								<div className="time-entry__project-wrapper">
									<div
										style={project ? { background: project.color } : {}}
										className="dot"></div>
									<span className="time-entry__project-name">
										{project?.name || ''}
										{task?.name ? ': ' + task.name : ''}
									</span>
								</div>
								<span className="time-entry__client-name">
									{project && project.clientName
										? ' - ' + project.clientName
										: ''}
								</span>
							</div>
						</div>
						{!id && (
							<Autocomplete
								items={
									this.state.timeEntry.description?.length >= 2
										? this.state.autocompleteItems
										: this.state.autocompleteItemsRecent
								}
								value={this.state.timeEntry.description}
								onChange={e => {
									this.setDescription(e.target.value);
									if (e.target.value.length >= 2) {
										this.handleInputChange(e.target.value);
									} else {
										this.handleInputChange(null);
									}
								}}
								onSelect={item => {
									const selected =
										this.state.timeEntry.description?.length >= 2
											? this.state.autocompleteItems.find(
													entry => entry.id === item.id
											  )
											: this.state.autocompleteItemsRecent.find(
													entry => entry.id === item.id
											  );
									if (selected) {
										this.setState(
											{
												timeEntry: selected,
											},
											() => {
												this.startNewEntry();
											}
										);
									}
								}}
								renderInput={props => (
									<>
										<input
											className={
												!id ? 'start-timer_description-input' : 'disabled'
											}
											id="description"
											type="text"
											{...props}
											onKeyDown={this.onKey.bind(this)}></input>
										{this.showTimerPlaceHolder() && (
											<span className="start-timer_placeholder">
												{locales.WHAT_ARE_YOU_WORKING_ON}
											</span>
										)}
									</>
								)}
							/>
						)}
					</span>
					<span
						className={
							this.props.mode === 'manual' ? 'start-timer-description' : 'disabled'
						}>
						<input
							className={'start-timer_description-input'}
							id="duration"
							autoComplete="off"
							onChange={this.setDuration.bind(this)}
							onKeyDown={this.onKey.bind(this)}
						/>
						{this.showManualInputPlaceholder() && (
							<span className="start-timer_placeholder">{locales.ENTER_TIME}</span>
						)}
					</span>
					<button
						className={
							!id && this.props.mode === 'timer'
								? 'start-timer_button-start'
								: 'disabled'
						}
						onClick={this.startNewEntryWithoutGoingToEdit}>
						<span>{locales.START}</span>
					</button>
					<button
						className={
							id && this.props.mode === 'timer'
								? 'start-timer_button-red'
								: 'disabled'
						}
						onClick={this.checkRequiredFields.bind(this)}>
						<span className="button_timer">{this.state.time}</span>
						<span className="button_stop">{locales.STOP}</span>
					</button>
					<button
						className={
							this.props.mode === 'manual' ? 'start-timer_button-start' : 'disabled'
						}
						onClick={this.goToEditManual.bind(this)}>
						<span>{locales.ADD_TIME}</span>
					</button>
				</div>
			</div>
		);
	}
}

export default StartTimer;
