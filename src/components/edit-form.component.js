import * as React from 'react';
import Header from './header.component.jsx';
import Duration from './duration.component';
import moment, { duration } from 'moment';
import ProjectList from './project-list.component';
import TagsList from './tags-list.component';
import HomePage from './home-page.component';
import { isOffline } from './check-connection';
import { TimeEntryHelper } from '../helpers/timeEntry-helper';
import { getBrowser } from '../helpers/browser-helper';
import Toaster from './toaster-component';
import EditDescription from './edit-description.component';
import { CustomFieldsContainer } from './customFields/customFields-Container';
import { getWSCustomFields, offlineStorage } from '../helpers/offlineStorage';
import locales from '../helpers/locales';
import CustomFieldsContext from './customFields/CustomFieldsContext';
import { DeleteEntryConfirmation } from '~/components/DeleteEntryConfirmation.tsx';

const timeEntryHelper = new TimeEntryHelper();


class EditForm extends React.Component {
	constructor(props) {
		super(props);

		if (
			this.props.forwardedRef &&
			typeof this.props.forwardedRef === 'object'
		) {
			this.props.forwardedRef.current = this;
		}

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
			workspaceSettings: null,
			customFieldsToSendToBackend: [],
			selectedProjectId:
				this.props.timeEntry.projectId ||
				this.props.timeEntry.project?.id ||
				''
		};

		this.setDescription = this.setDescription.bind(this);
		this.onSetDescription = this.onSetDescription.bind(this);
		this.editBillable = this.editBillable.bind(this);
		this.checkRequiredFields = this.checkRequiredFields.bind(this);
		this.notifyAboutError = this.notifyAboutError.bind(this);
		this.editProject = this.editProject.bind(this);
		this.editTask = this.editTask.bind(this);
		this.updateCustomFields = this.updateCustomFields.bind(this);
		this.setAsyncStateItems = this.setAsyncStateItems.bind(this);
		this.checkProjectError = this.checkProjectError.bind(this);
		this.areCustomFieldsValid = this.areCustomFieldsValid.bind(this);
		this.cfContainsWrongChars = this.cfContainsWrongChars.bind(this);
		this.addCustomFieldValuesToState =
			this.addCustomFieldValuesToState.bind(this);
		this.saveDescriptionOffline = this.saveDescriptionOffline.bind(this);
		this.onTagListClose = this.onTagListClose.bind(this);
		this.sendAllFieldValuesToBackend =
			this.sendAllFieldValuesToBackend.bind(this);
		this.getAllFieldData = this.getAllFieldData.bind(this);
	}

	async setAsyncStateItems() {
		const hideBillable = await offlineStorage.getHideBillable();
		const isUserOwnerOrAdmin = await offlineStorage.getIsUserOwnerOrAdmin();
		const inProgress = await localStorage.getItem('inProgress');
		const workspaceSettings = await localStorage.getItem('workspaceSettings');
		let offline = false;
		if (await isOffline()) {
			offline = true;
		}

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
				isOffline: offline
			});
		}
	}

	async checkProjectError() {
		const createProjectError = await localStorage.getItem('createProjectError');
		const createProjectErrorParsed = JSON.parse(createProjectError);
		if (createProjectErrorParsed) {
			this.notifyAboutError(locales.CAN_NOT_CREATE_PROJECT_MISSING_PERMISSIONS, 'error', 5);
			await localStorage.removeItem('createProjectError');
		}
	}

	componentDidUpdate() {
		this.setAsyncStateItems();
	}

	async setUserWorkspaceSettings() {
		getBrowser()
			.runtime.sendMessage({
			eventName: 'getWorkspaceSettings'
		})
			.then(async (response) => {
				if (!response.data) {
					throw new Error(response);
				}
				let { workspaceSettings } = response.data;
				if (!workspaceSettings.hasOwnProperty('timeTrackingMode')) {
					workspaceSettings.timeTrackingMode =
						getManualTrackingModeEnums().DEFAULT;
				}

				localStorage.setItem('mode', this.state.mode); // for usage in edit-forms
				localStorage.setItem(
					'manualModeDisabled',
					JSON.stringify(this.state.manualModeDisabled),
				); // for usage in header
				localStorage.setItem(
					'workspaceSettings',
					JSON.stringify(workspaceSettings),
				);
				offlineStorage.userHasCustomFieldsFeature =
					workspaceSettings.features.customFields;
				offlineStorage.activeBillableHours =
					workspaceSettings.activeBillableHours;
				offlineStorage.onlyAdminsCanChangeBillableStatus =
					workspaceSettings.onlyAdminsCanChangeBillableStatus;
				return Promise.resolve(true);
			})
			.catch((error) => {
				return Promise.reject(true);
			});
	}

	async componentDidMount() {
		const { forceTasks } = this.props.workspaceSettings;
		const { timeEntry } = this.state;
		const { projectId, task } = timeEntry;
		const taskId = task ? task.id : null;

		if (!(await isOffline()) && offlineStorage.userHasCustomFieldsFeature) {
			const { data, msg } = await getWSCustomFields();
			if (data) offlineStorage.wsCustomFields = data;
		}
		if (!offlineStorage.userHasCustomFieldsFeature) {
			offlineStorage.wsCustomFields = [];
		}

		if (this.props.afterCreateProject) {
			this.setState((state) => ({
				timeEntry: {
					...state.timeEntry,
					customFieldValues: offlineStorage.customFieldValues
				}
			}));
		} else {
			if (offlineStorage.wsCustomFields?.length) {
				const additinalFields = offlineStorage.wsCustomFields
					.filter(
						(field) =>
							field.status === 'VISIBLE' &&
							(!field.projectDefaultValues.find(
								(el) => el.projectId === projectId,
							) ||
								field.projectDefaultValues.find(
									(el) => el.projectId === projectId,
								)?.status === 'VISIBLE') &&
							!timeEntry?.customFieldValues?.find(
								(cf) => cf.customFieldId === field.id,
							),
					)
					.map((el) => ({ ...el, customFieldId: el.id }));
				this.setState((state) => ({
					timeEntry: {
						...state.timeEntry,
						customFieldValues: [
							...state.timeEntry.customFieldValues,
							...additinalFields
						]
					}
				}));
			}
			await this.setUserWorkspaceSettings();
		}

		if (!projectId || (forceTasks && !taskId)) {
			const projectDB = null;
			const taskDB = null;

			if (projectDB) {
				const entry = await timeEntryHelper.updateProjectTask(
					timeEntry,
					projectDB,
					taskDB,
				);
				this.setState(
					{
						timeEntry: entry
					},
					() => {
						this.checkRequiredFields();
					},
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
							(item) => item.customFieldId === customFieldId,
						);
						if (cf) cf.value = value;
					});
				} else {
					// timeEntryInOffline w/o customFieldValues?
				}
				offlineStorage.timeEntryInOffline = timeEntry;
				this.setState(
					{
						timeEntry
					},
					() => this.checkRequiredFields(),
				);
			} else {
				let timeEntries = offlineStorage.timeEntriesOffline;
				timeEntries.map((timeEntry) => {
					if (timeEntry.id === this.state.timeEntry.id) {
						if (timeEntry.customFieldValues) {
							customFields.forEach(({ value, customFieldId }) => {
								const cf = timeEntry.customFieldValues.find(
									(item) => item.customFieldId === customFieldId,
								);
								if (cf) cf.value = value;
							});
						}
						this.setState(
							{
								timeEntry
							},
							() => this.checkRequiredFields(),
						);
					}
					return timeEntry;
				});
				offlineStorage.timeEntriesOffline = timeEntries;
			}
		}
	}

	async changeInterval(timeInterval) {
		if (await isOffline()) {
			let timeEntry = offlineStorage.timeEntryInOffline;
			if (timeEntry && timeEntry.id === this.state.timeEntry.id) {
				timeEntry.timeInterval = timeInterval;
				offlineStorage.timeEntryInOffline = timeEntry;
				this.setState(
					{
						timeEntry
					},
					() => {},
				);
			} else {
				let timeEntries = offlineStorage.timeEntriesOffline;
				timeEntries.map((entry) => {
					if (entry.id === this.state.timeEntry.id) {
						entry.timeInterval = timeInterval;
						this.setState(
							{
								timeEntry: entry
							},
							() => {},
						);
					}
					return entry;
				});
				offlineStorage.timeEntriesOffline = timeEntries;
			}
		} else {
			if (timeInterval.start && timeInterval.end) {
				const newInterval = {};
				newInterval.start = moment(timeInterval.start).toISOString();
				newInterval.end = moment(timeInterval.end).toISOString();
				newInterval.duration = moment
					.duration(moment(timeInterval.end).diff(moment(timeInterval.start)))
					.toISOString();
				this.setState((state) => ({
					timeEntry: {
						...state.timeEntry,
						timeInterval: newInterval,
						start: newInterval.start
					}
				}));
			} else if (timeInterval.start && !timeInterval.end) {
				const newInterval = {
					...this.state.timeEntry.timeInterval,
					start: timeInterval.start.toISOString()
				};
				this.setState(
					(state) => ({
						timeEntry: {
							...state.timeEntry,
							timeInterval: newInterval,
							start: newInterval.start
						}
					}),
					() => {
						getBrowser().runtime.sendMessage({ eventName: 'pomodoroTimer' });
					},
				);
			}
		}
	}

	async changeDuration(newDuration) {
		if (!newDuration || !this.state.timeEntry.timeInterval.end) return;

		let timeEntry;

		if (await isOffline()) {
			timeEntry = offlineStorage.timeEntryInOffline;
			let end = moment(this.state.timeEntry.timeInterval.start)
				.add(parseInt(newDuration.split(':')[0]), 'hours')
				.add(parseInt(newDuration.split(':')[1]), 'minutes')
				.add(
					newDuration.split(':')[2] ? parseInt(newDuration.split(':')[2]) : 0,
					'seconds',
				);

			if (timeEntry && timeEntry.id === this.state.timeEntry.id) {
				timeEntry.timeInterval.end = end;
				timeEntry.timeInterval.duration = duration(
					moment(timeEntry.timeInterval.end).diff(timeEntry.timeInterval.start),
				);
				offlineStorage.timeEntryInOffline = timeEntry;
				this.setState({ timeEntry });
			} else {
				let timeEntries = offlineStorage.timeEntriesOffline;
				timeEntries.map((entry) => {
					if (entry.id === this.state.timeEntry.id) {
						entry.timeInterval.end = end;
						entry.timeInterval.duration = duration(
							moment(entry.timeInterval.end).diff(entry.timeInterval.start),
						);
						this.setState({ timeEntry: entry });
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
					'seconds',
				)
				.toDate();

			timeEntry.timeInterval.start = moment(
				timeEntry.timeInterval.start,
			).toDate();
			timeEntry.timeInterval.end = end;
			timeEntry.timeInterval.duration = duration(
				moment(timeEntry.timeInterval.end).diff(timeEntry.timeInterval.start)
			);
			timeEntry.duration = newDuration;

			this.setState({ timeEntry });
		}
	}

	onSetDescription(description) {
		this.setState({ description: description.trim() }, () => this.setDescription());
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
							description: timeEntry.description
						},
						description: timeEntry.description
					}),
					() => this.checkRequiredFields(),
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
									description: entry.description
								}
							}),
							() => this.checkRequiredFields(),
						);
					}
					return entry;
				});
				offlineStorage.timeEntriesOffline = timeEntries;
			}
		} else {
			this.setState(
				(state) => ({
					timeEntry: {
						...state.timeEntry,
						description: description
					},
					description: description
				}),
				() => this.checkRequiredFields(),
			);
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

	async editProject(project) {
		if (!project.id || project.id === 'no-project') {
			if (await isOffline()) {
				let timeEntry = offlineStorage.timeEntryInOffline;

				if (timeEntry && timeEntry.id === this.state.timeEntry.id) {
					timeEntry.projectId = 'no-project';
					timeEntry.project = project;
					offlineStorage.timeEntryInOffline = timeEntry;

					this.setState({ timeEntry }, () => this.checkRequiredFields());
				} else {
					let timeEntries = offlineStorage.timeEntriesOffline;

					timeEntries.map((timeEntry) => {
						if (timeEntry.id === this.state.timeEntry.id) {
							timeEntry.projectId = 'no-project';
							timeEntry.project = project;

							this.setState({ timeEntry }, () => this.checkRequiredFields());
						}

						return timeEntry;
					});

					offlineStorage.timeEntriesOffline = timeEntries;
				}
			} else {
				this.setState(
					(state) => ({
						timeEntry: {
							...state.timeEntry,
							project: project,
							projectId: null,
							task: null,
							taskId: null
						}
					}),
					() => this.checkRequiredFields(),
				);
			}
		} else {
			if (await isOffline()) {
				let timeEntry = offlineStorage.timeEntryInOffline;

				if (timeEntry && timeEntry.id === this.state.timeEntry.id) {
					timeEntry.project = project;
					timeEntry.projectId = project.id;
					offlineStorage.timeEntryInOffline = timeEntry;
					this.setState({ timeEntry }, () => this.checkRequiredFields());
				} else {
					let timeEntries = offlineStorage.timeEntriesOffline;
					timeEntries.map((timeEntry) => {
						if (timeEntry.id === this.state.timeEntry.id) {
							timeEntry.project = project;
							timeEntry.projectId = project.id;
							this.setState({ timeEntry }, () => this.checkRequiredFields());
						}
						return timeEntry;
					});

					offlineStorage.timeEntriesOffline = timeEntries;
				}
			} else {
				this.setState(
					(state) => ({
						timeEntry: {
							...state.timeEntry,
							project: project,
							projectId: project.id,
							billable: project.billable,
							task: null,
							taskId: null
						}
					}),
					() => this.checkRequiredFields(),
				);
			}
		}
	}

	editTask(task, project) {
		if (!task) {
			this.setState(
				(state) => ({
					timeEntry: {
						...state.timeEntry,
						task: null,
						taskId: null
					}
				}),
				() => this.checkRequiredFields(),
			);
		} else {
			this.setState(
				(state) => ({
					timeEntry: {
						...state.timeEntry,
						task: task,
						taskId: task.id,
						project: project,
						projectId: task.projectId,
						billable: this.props.workspaceSettings?.taskBillableEnabled ? task.billable : project.billable
					}
				}),
				() => this.checkRequiredFields(),
			);
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
						timeEntry
					},
					() => {
						this.checkRequiredFields();
					},
				);
			} else {
				let timeEntries = offlineStorage.timeEntriesOffline;
				timeEntries.map((timeEntry) => {
					if (timeEntry.id === this.state.timeEntry.id) {
						timeEntry.tags = tagList;
						this.setState(
							{
								timeEntry
							},
							() => {
								this.checkRequiredFields();
							},
						);
					}
					return timeEntry;
				});
				offlineStorage.timeEntriesOffline = timeEntries;
			}
		} else {
			this.setState(
				(state) => ({
					tags: tagList,
					timeEntry: {
						...state.timeEntry,
						tags: tagList
					}
				}),
				() => {
					this.checkRequiredFields();
					if (saveAfterEdit) {
						this.onTagListClose();
					} else {
						this.checkRequiredFields();
					}
				},
			);
		}
	}

	onTagListClose() {
		const tagIds = this.state.tags ? this.state.tags.map((it) => it.id) : [];
		this.setState(
			(state) => ({
				timeEntry: {
					...state.timeEntry,
					tagIds
				}
			}),
			() => this.checkRequiredFields(),
		);
	}

	async editBillable() {
		if (await isOffline()) {
			let timeEntry = offlineStorage.timeEntryInOffline;
			if (timeEntry && timeEntry.id === this.state.timeEntry.id) {
				timeEntry.billable = !this.state.timeEntry.billable;
				offlineStorage.timeEntryInOffline = timeEntry;
				this.setState({
					timeEntry
				});
			} else {
				let timeEntries = offlineStorage.timeEntriesOffline;
				timeEntries.map((entry) => {
					if (entry.id === this.state.timeEntry.id) {
						entry.billable = !this.state.timeEntry.billable;
						this.setState({
							timeEntry: entry
						});
					}
					return entry;
				});
				offlineStorage.timeEntriesOffline = timeEntries;
			}
		} else {
			this.setState({
				billableShouldBeSaved: true
			});
			this.setState((state) => ({
				timeEntry: { ...state.timeEntry, billable: !state.timeEntry.billable }
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
						(entry) => entry.id === this.state.timeEntry.id,
					) > -1
				) {
					timeEntries.splice(
						timeEntries.findIndex(
							(entry) => entry.id === this.state.timeEntry.id,
						),
						1,
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
					entryId: this.state.timeEntry.id
				}
			})
				.then((response) => {
					getBrowser().runtime.sendMessage({
						eventName: 'restartPomodoro'
					});
					localStorage.setItem('timeEntryInProgress', null);

					this.goBack();
				})
				.catch(() => {
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
				[id]: isCustomFieldContainsWrongChars
			}
		});
	}

	addCustomFieldValuesToState(customField) {
		this.setState((prevState) => {
			const existingIndex = prevState.customFieldsToSendToBackend.findIndex(
				(item) => item.customFieldId === customField.customFieldId,
			);
			if (existingIndex !== -1) {
				const updatedFields = [...prevState.customFieldsToSendToBackend];
				updatedFields[existingIndex] = customField;
				return { customFieldsToSendToBackend: updatedFields };
			}
			return {
				customFieldsToSendToBackend: [
					...prevState.customFieldsToSendToBackend,
					customField
				]
			};
		});
	}

	saveDescriptionOffline(description) {
		let timeEntry = offlineStorage.timeEntryInOffline;
		if (timeEntry && timeEntry.id === this.state.timeEntry.id) {
			timeEntry.description = description?.trim() || '';
			offlineStorage.timeEntryInOffline = timeEntry;
			this.setState(
				(state) => ({
					timeEntry: {
						...state.timeEntry,
						description: timeEntry.description
					},
					description: timeEntry.description
				}),
				() => this.checkRequiredFields(),
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
								description: entry.description
							}
						}),
						() => this.checkRequiredFields(),
					);
				}
				return entry;
			});
			offlineStorage.timeEntriesOffline = timeEntries;
		}
	}

	getAllFieldData() {
		const {
			description,
			projectId,
			taskId,
			billable,
			customFieldValues,
			timeInterval
		} = this.state.timeEntry;
		let { tagIds } = this.state.timeEntry;
		if (!tagIds)
			tagIds = this.state.tags ? this.state.tags.map((it) => it.id) : [];
		const { start, end } = timeInterval;

		const updatedFields = {
			description,
			projectId,
			taskId,
			tagIds,
			billable,
			start,
			end
		};

		if (this.state.customFieldsToSendToBackend.length) {
			const customFieldsToBeUpdated = [];
			this.state.customFieldsToSendToBackend.forEach((customField) => {
				customFieldsToBeUpdated.push({
					customFieldId: customField.customFieldId,
					value: customField.value,
					sourceType: 'TIMEENTRY'
				});
			});
			updatedFields.customFields = customFieldsToBeUpdated;
		} else if (customFieldValues.length) {
			const customFieldsToBeUpdated = [];
			customFieldValues.forEach((customField) => {
				customFieldsToBeUpdated.push({
					customFieldId: customField.customFieldId,
					value: customField.value,
					sourceType: 'TIMEENTRY'
				});
			});
			updatedFields.customFields = customFieldsToBeUpdated;
		}

		const entryId = this.state.timeEntry.id;

		const dataForIntegrations = {
			entryId,
			updatedFields
		};

		return dataForIntegrations;
	}

	async sendAllFieldValuesToBackend() {
		const { entryId, updatedFields } = this.getAllFieldData();
		getBrowser()
			.runtime.sendMessage({
			eventName: 'updateTimeEntryValues',
			options: {
				entryId,
				body: updatedFields
			}
		})
			.then((response) => {
				if (response && response.status === 200) {
					this.closeEditForm();
				} else {
					if (response.includes('Manual time tracking disabled')) {
						this.toaster.toast('error', locales.DISABLED_MANUAL_MODE, 2);
						return;
					}
					this.toaster.toast('error', locales.GLOBAL__FAILED_MESSAGE, 2);
				}
			})
			.catch((error) => {
				this.toaster.toast('error', locales.GLOBAL__FAILED_MESSAGE, 2);
			});
	}

	closeEditForm() {
		if (this.props.integrationMode) {
			this.props.closeIntegrationPopup();
		} else {
			this.goBack();
		}
	}

	async done() {
		const description = this.state.description;
		const pattern = /<[^>]+>/;
		const descriptionContainsWrongChars = pattern.test(description);
		const customFieldContainsWrongChars =
			Object.values(this.state.customFieldsContainWrongChars ?? {}).filter(
				Boolean,
			).length > 0;

		if (descriptionContainsWrongChars || customFieldContainsWrongChars) {
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
		this.sendAllFieldValuesToBackend().catch((error) => {
			this.toaster.toast('error', locales.GLOBAL__FAILED_MESSAGE, 2);
		});
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
						duration(this.state.timeEntry.timeInterval.duration),
					);
					this.setState({ timeEntry: entry });
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
			const newStart = start.toISOString();
			const newEnd = moment(start)
				.add(duration(this.state.timeEntry.timeInterval.duration))
				.toISOString();
			const newInterval = {
				...this.state.timeEntry.timeInterval,
				start: newStart,
				end: newEnd
			};

			this.setState((state) => ({
				timeEntry: {
					...state.timeEntry,
					timeInterval: newInterval,
					start: newInterval.start
				}
			}));
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
				timeEntry
			});
		} else {
			const getDate = new Date(date);
			const timeEntryStart = moment(this.state.timeEntry.timeInterval.start);

			const start = moment(getDate)
				.hour(timeEntryStart.hour())
				.minutes(timeEntryStart.minutes())
				.seconds(timeEntryStart.seconds());

			this.setState((state) => ({
				timeEntry: {
					...state.timeEntry,
					start
				}
			}));
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
				!this.state.timeEntry.project?.id &&
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
			ready: true
		});
	}

	askToDeleteEntry() {
		this.setState({
			askToDeleteEntry: true
		});
	}

	cancelDeletingEntry() {
		this.setState({
			askToDeleteEntry: false
		});
	}

	goBack() {
		window.reactRoot.render(<HomePage />);
	}

	notifyAboutError(message, type = 'error', n = 2) {
		this.toaster.toast(type, message, n);
	}

	render() {
		if (!this.state.ready) return null;

		const { timeEntry } = this.state;

		this.checkProjectError();
		return (
				<CustomFieldsContext.Provider
					value={{
						addCustomFieldValuesToState: this.addCustomFieldValuesToState,
					}}
				>
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
													'/assets/images/break.png',
												)})`,
											}}
										/>
										<span>{locales.BREAK}</span>
									</div>
								)}
								<Duration
								ref={(instance) => (this.duration = instance)}
								timeEntry={this.state.timeEntry}
								timeFormat={this.props.timeFormat}
								changeInterval={this.changeInterval.bind(this)}
								changeDuration={this.changeDuration.bind(this)}
								changeDate={
									this.state.timeEntry.timeInterval.end
										? this.changeDate.bind(this)
										: this.changeStartDate.bind(this)
								}
								workspaceSettings={this.props.workspaceSettings}
								isUserOwnerOrAdmin={this.state.isUserOwnerOrAdmin}
								userSettings={this.props.userSettings}
							/>
						</>
					)}
					<Toaster ref={(instance) => (this.toaster = instance)} />
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
								setShouldAddNewTask={this.setShouldAddNewTask}
								timeEntry={this.state.timeEntry}
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
								integrationMode={this.props.integrationMode}
								onClose={this.onTagListClose.bind(this)}
							/>
							<div className="edit-form-buttons">
								<div
									className={`edit-form-buttons__billable ${
										this.state.hideBillable ? 'disabled' : ''
									}`}
								>
									<span
										className={
										this.state.timeEntry.billable
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
												'assets/images/checked.png',
											)}
											className={
											this.state.timeEntry.billable
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
								{offlineStorage.userHasCustomFieldsFeature &&
									!this.state.isOffline && (
										<CustomFieldsContainer
											selectedProjectId={this.state.selectedProjectId}
											cfContainsWrongChars={this.cfContainsWrongChars}
											key="customFieldsContainer"
											timeEntry={this.state.timeEntry}
											isUserOwnerOrAdmin={this.state.isUserOwnerOrAdmin}
											manualMode={false}
											updateCustomFields={this.updateCustomFields}
											isInProgress={this.state.isInProgress}
											areCustomFieldsValid={this.areCustomFieldsValid}
											areCustomFieldsCntainWrongChars={
												this.areCustomFieldsCntainWrongChars
											}
											workspaceSettings={this.props.workspaceSettings}
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
									<DeleteEntryConfirmation
									askToDeleteEntry={this.state.askToDeleteEntry}
									canceled={this.cancelDeletingEntry.bind(this)}
									confirmed={this.deleteEntry.bind(this)}
								/>
							</div>
						</div>
					</div>
				</div>
			</CustomFieldsContext.Provider>
		);
	}
}

export default React.forwardRef((props, ref) => {
	return <EditForm {...props} forwardedRef={ref} />;
});
