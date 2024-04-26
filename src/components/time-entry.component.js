import * as React from 'react';
import EditForm from './edit-form.component';
import { isOffline } from './check-connection';
import Login from './login.component';
import { offlineStorage } from '../helpers/offlineStorage';
import locales from '../helpers/locales';
import { duration } from 'moment';
import 'moment-duration-format';
import { toDecimalFormat } from '../helpers/time.helper';
import TimeEntryDropdown from './time-entry-dropdown.component';
import DeleteEntryConfirmationComponent from './delete-entry-confirmation.component';
import HomePage from './home-page.component';
import Toaster from './toaster-component';
import { getBrowser } from '../helpers/browser-helper';
import {
	getRequiredAndMissingCustomFieldNames,
	getRequiredAndMissingFieldNames,
} from '../helpers/utils';
import { TimeEntryTypeEnum } from '../enums/timeEntry-type.enum';

class TimeEntry extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			title: '',
			tagTitle: '',
			showGroup: false,
			entryDropdownShown: false,
			askToDeleteEntry: false,
		};
		this.createTitle = this.createTitle.bind(this);
		this.setAsyncStateItems = this.setAsyncStateItems.bind(this);
		this.handleGroupClick = this.handleGroupClick.bind(this);
		this.toggleEntryDropdownMenu = this.toggleEntryDropdownMenu.bind(this);
		this.toggleDeleteConfirmationModal =
			this.toggleDeleteConfirmationModal.bind(this);
		this.deleteEntry = this.deleteEntry.bind(this);
		this.offlineDeleteEntry = this.offlineDeleteEntry.bind(this);
		this.onClickDeleteEntries = this.onClickDeleteEntries.bind(this);
		this.onClickDuplicateEntry = this.onClickDuplicateEntry.bind(this);
	}

	async setAsyncStateItems() {
		const hideBillable = await offlineStorage.getHideBillable();
		if (hideBillable !== this.state.hideBillable) {
			this.setState({
				hideBillable,
			});
		}
	}

	componentDidUpdate() {
		this.setAsyncStateItems();
	}

	componentDidMount() {
		this.createTitle();
	}

	async goToEdit() {
		if (
			!this.props.groupedEntries?.length &&
			(!this.props.timeEntry.isLocked || this.props.isUserOwnerOrAdmin) &&
			this.props.timeEntry.approvalRequestId == null
		) {
			if (await isOffline()) {
				window.reactRoot.render(<Login />);
			}
			window.reactRoot.render(
				<EditForm
					changeMode={this.changeMode.bind(this)}
					timeEntry={this.props.timeEntry}
					workspaceSettings={this.props.workspaceSettings}
					timeFormat={this.props.timeFormat}
					userSettings={this.props.userSettings}
				/>
			);
		}
	}

	continueTimeEntry(e) {
		e.stopPropagation();
		this.props.playTimeEntry(this.props.timeEntry);
	}

	toggleEntryDropdownMenu(e) {
		e && e.stopPropagation();
		if (
			this.props.timeEntry.approvalRequestId == null &&
			(!this.props.timeEntry.isLocked || this.props.isUserOwnerOrAdmin)
		) {
			this.setState((state) => ({
				entryDropdownShown: !state.entryDropdownShown,
			}));
		}
	}

	createTitle() {
		let title = '';
		let tagTitle = '';

		if (this.props.timeEntry.description) {
			title =
				locales.DESCRIPTION_LABEL + ': ' + this.props.timeEntry.description;
		}

		if (this.props.project) {
			if (this.props.project.name) {
				title =
					title +
					(title ? '\n' : '' + `${locales.PROJECT}: `) +
					this.props.project.name;
			}

			if (this.props.task && this.props.task.name) {
				title = title + `\n${locales.TASK}: ` + this.props.task.name;
			}

			if (this.props.project.clientName) {
				title = title + `\n${locales.CLIENT}: ` + this.props.project.clientName;
			}
		}

		const { tags } = this.props.timeEntry;
		if (tags && tags.length > 0) {
			tagTitle =
				(tags.length > 1 ? `${locales.TAGS}:\n` : `${locales.TAG}: `) +
				tags.map((tag) => tag.name).join('\n');
		}

		this.setState({
			title: title,
			tagTitle: tagTitle,
		});
	}

	changeMode(mode) {
		this.props.changeMode(mode);
	}

	handleGroupClick(e) {
		e.stopPropagation();
		this.setState((state) => ({
			showGroup: !state.showGroup,
		}));
	}

	toggleDeleteConfirmationModal(e) {
		e && e.stopPropagation();
		this.setState({
			askToDeleteEntry: !this.state.askToDeleteEntry,
			entryDropdownShown: false,
		});
	}

	async onClickDuplicateEntry(e) {
		e.stopPropagation();
		const workspaceSettings = this.props.workspaceSettings;

		const { project } = this.props.timeEntry;
		const requiredAndMissingCustomFieldNames =
			await getRequiredAndMissingCustomFieldNames(
				project,
				this.props.timeEntry
			);
		const requiredAndMissingFieldNames = getRequiredAndMissingFieldNames(
			this.props.timeEntry,
			workspaceSettings
		);
		const missingFields = requiredAndMissingFieldNames.concat(
			requiredAndMissingCustomFieldNames
		);

		// Admin and Owners can duplicate a Holiday/TimeOff TimeEntry even if they have missing fields.
		const canDuplicate =
			workspaceSettings.timeOff.active &&
			this.props.isUserOwnerOrAdmin &&
			(this.props.timeEntry.type === TimeEntryTypeEnum.TIME_OFF ||
				this.props.timeEntry.type === TimeEntryTypeEnum.HOLIDAY);

		if (missingFields.length > 0 && !canDuplicate) {
			const errorMessage = `${locales.CANT_SAVE_WITHOUT_REQUIRED_FIELDS.replace(
				'.',
				''
			)}: ${missingFields.join(', ')}`;
			this.toaster.toast('error', errorMessage, 3);
			return;
		}
		this.toggleEntryDropdownMenu();
		getBrowser()
			.runtime.sendMessage({
				eventName: 'duplicateTimeEntry',
				options: {
					entryId: this.props.timeEntry.id,
				},
			})
			.then(() => {
				this.props.handleRefresh();
				this.toaster.toast('success', locales.GLOBAL__DUPLICATE_SUCCESS_MSG, 2);
			})
			.catch((error) => {
				this.toaster.toast(
					'error',
					locales.replaceLabels(error.response.data.message),
					2
				);
			});
	}

	onClickDeleteEntries() {
		this.toggleEntryDropdownMenu();
		if (this.props.groupedEntries?.length > 0) {
			this.deleteMultipleEntries(
				this.props.groupedEntries.map((entry) => entry.id)
			);
		} else {
			this.deleteEntry(this.props.timeEntry.id);
		}
	}

	async deleteEntry(entryId) {
		if (await isOffline()) {
			this.offlineDeleteEntry(entryId);
		} else {
			getBrowser()
				.runtime.sendMessage({
					eventName: 'deleteTimeEntry',
					options: {
						entryId,
					},
				})
				.then(() => {
					this.toggleDeleteConfirmationModal();
					this.props.handleRefresh();
				})
				.catch(() => {});
		}
	}

	async deleteMultipleEntries(entryIds) {
		if (await isOffline()) {
			entryIds.forEach((entry) => this.offlineDeleteEntry(entry));
		} else {
			getBrowser()
				.runtime.sendMessage({
					eventName: 'deleteTimeEntries',
					options: {
						entryIds,
					},
				})
				.then(() => {
					this.toggleDeleteConfirmationModal();
					this.props.handleRefresh();
				})
				.catch(() => {});
		}
	}

	offlineDeleteEntry(entryId) {
		let timeEntries = offlineStorage.timeEntriesOffline;
		if (timeEntries.findIndex((entry) => entry.id === entryId) > -1) {
			timeEntries.splice(
				timeEntries.findIndex((entry) => entry.id === entryId),
				1
			);
		}
		offlineStorage.timeEntriesOffline = timeEntries;
		this.toggleDeleteConfirmationModal();
		this.props.handleRefresh();
	}

	async goBack() {
		window.reactRoot.render(<HomePage />);
	}

	byTimeDate(firstEntry, secondEntry) {
		return (
			new Date(secondEntry.timeInterval.start) -
			new Date(firstEntry.timeInterval.start)
		);
	}

	render() {
		const {
			timeEntry,
			project,
			task,
			groupedEntries,
			workspaceSettings,
			isUserOwnerOrAdmin,
			collapsedEntry,
			timeEntryIndex,
		} = this.props;

		let entryDuration = timeEntry.duration;
		const decimalFormat = workspaceSettings?.decimalFormat;
		if (!!groupedEntries?.length) {
			entryDuration = groupedEntries.reduce(
				(prev, curr) => duration(prev + duration(curr.timeInterval.duration)),
				duration(0)
			);
			entryDuration = decimalFormat
				? toDecimalFormat(entryDuration)
				: entryDuration.format(
						workspaceSettings?.trackTimeDownToSecond ? 'HH:mm:ss' : 'h:mm',
						{ trim: false }
				  );
		}
		const entryClassNames = [];
		if (
			(timeEntry.isLocked && !isUserOwnerOrAdmin) ||
			timeEntry.approvalRequestId
		) {
			entryClassNames.push('time-entry time-entry-locked');
		} else {
			entryClassNames.push('time-entry');
		}
		if (collapsedEntry) {
			entryClassNames.push('time-entry--collapsed');
		}
		if (this.state.entryDropdownShown) {
			entryClassNames.push('time-entry--focused');
		}

		return (
			<React.Fragment>
				<Toaster
					ref={(instance) => {
						this.toaster = instance;
					}}
				/>
				<div>
					<div
						data-pw={`time-entry-${timeEntryIndex}`}
						className={entryClassNames.join(' ')}
						title={this.state.title}
						key={timeEntry.id}
						onClick={this.goToEdit.bind(this)}
					>
						{!!groupedEntries?.length && (
							<div
								className="time-entry-group-number"
								onClick={this.handleGroupClick}
							>
								{groupedEntries.length}
							</div>
						)}
						<div
							className="time-entry-description"
							data-pw={`time-entry-description-${timeEntryIndex}`}
						>
							<div
								className={
									timeEntry.description ? 'description' : 'no-description'
								}
							>
								{timeEntry.description
									? timeEntry.description
									: locales.NO_DESCRIPTION}
							</div>
							<div
								style={project ? { color: project.color } : {}}
								className={project ? 'time-entry-project' : 'disabled'}
							>
								<div className="time-entry__project-wrapper">
									<div
										style={project ? { background: project.color } : {}}
										className="dot"
									></div>
									<span className="time-entry__project-name">
										{project ? project.name : ''}
										{task ? ': ' + task.name : ''}
									</span>
								</div>
								<span className="time-entry__client-name">
									{project && project.clientName
										? ' - ' + project.clientName
										: ''}
								</span>
							</div>
						</div>
						<div className="time-entry__right-side">
							<div className="time-entry__right-side__icons">
								{timeEntry.type === TimeEntryTypeEnum.HOLIDAY && (
									<img
										src="./assets/images/time-off.png"
										title="Holiday"
										alt="Holiday"
									/>
								)}

								{timeEntry.type === TimeEntryTypeEnum.TIME_OFF && (
									<img
										src="./assets/images/time-off.png"
										title="Time off"
										alt="Time Off"
									/>
								)}

								{timeEntry.approvalRequestId && (
									<img
										src="./assets/images/approved.png"
										title="Approved"
										alt="Approved"
									/>
								)}

								{timeEntry.isLocked &&
									!isUserOwnerOrAdmin &&
									!timeEntry.approvalRequestId && (
										<img
											src="./assets/images/lock-indicator.png"
											title="Locked"
											alt="Locked"
										/>
									)}

								{timeEntry.tags && timeEntry.tags.length > 0 && (
									<img
										src="./assets/images/tag.png"
										title={this.state.tagTitle}
										alt="Tags"
									/>
								)}

								{timeEntry.billable && !this.state.hideBillable && (
									<img
										src="./assets/images/billable.png"
										title="Billable"
										alt="Billable"
									/>
								)}

								{timeEntry.type === TimeEntryTypeEnum.BREAK && (
									<img
										src="./assets/images/break.png"
										title="Break"
										alt="Break"
									/>
								)}
							</div>
							<div className="time-entry__right-side__lock_and_play">
								<span className="time-entry__right-side--duration">
									{entryDuration}
								</span>
								<span
									className="time-entry-arrow"
									onClick={this.continueTimeEntry.bind(this)}
									title="Continue timer for this activity"
								/>
								<span className="time-entry-menu">
									<img
										onClick={(e) => this.toggleEntryDropdownMenu(e)}
										className="time-entry-menu__icon"
										src="./assets/images/menu-dots-vertical.svg"
										alt="Menu"
									/>
									{this.state.entryDropdownShown && (
										<TimeEntryDropdown
											entry={timeEntry}
											group={groupedEntries}
											onDelete={(e) => this.toggleDeleteConfirmationModal(e)}
											onDuplicate={(e) => this.onClickDuplicateEntry(e)}
											toggleDropdown={this.toggleEntryDropdownMenu}
											manualModeDisabled={this.props.manualModeDisabled}
										/>
									)}
								</span>
							</div>
						</div>
					</div>
					{this.state.showGroup &&
						groupedEntries
							?.sort(this.byTimeDate)
							?.map((entry, index) => (
								<TimeEntry
									timeEntryIndex={index}
									key={entry.id}
									timeEntry={entry}
									project={entry.project ? entry.project : null}
									task={entry.task ? entry.task : null}
									playTimeEntry={this.props.playTimeEntry}
									changeMode={this.props.changeMode}
									timeFormat={this.props.timeFormat}
									workspaceSettings={workspaceSettings}
									features={this.props.features}
									isUserOwnerOrAdmin={isUserOwnerOrAdmin}
									userSettings={this.props.userSettings}
									collapsedEntry={true}
									handleRefresh={this.props.handleRefresh}
									manualModeDisabled={this.props.manualModeDisabled}
								/>
							))}
				</div>
				<DeleteEntryConfirmationComponent
					askToDeleteEntry={this.state.askToDeleteEntry}
					canceled={this.toggleDeleteConfirmationModal}
					confirmed={this.onClickDeleteEntries}
					multiple={this.props.groupedEntries}
				/>
			</React.Fragment>
		);
	}
}
export default TimeEntry;
