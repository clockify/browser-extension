import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import EditForm from './edit-form.component';
import locales from '../helpers/locales';
import moment, { duration } from 'moment';
import 'moment-duration-format';
import TimeEntryDropdown from './time-entry-dropdown.component';
import Toaster from './toaster-component';
import { getBrowser } from '~/helpers/browser-helper';
import { getRequiredAndMissingCustomFieldNames, getRequiredAndMissingFieldNames } from '~/helpers/utils';
import { TimeEntryTypeEnum } from '~/enums/timeEntry-type.enum';
import { numberFormatTransform } from '~/helpers/duration-formater';
import { parseTime } from './time-input-parser';
import { DeleteEntryConfirmation } from '~/components/DeleteEntryConfirmation.tsx';
import { offlineStorage } from '~/helpers/offlineStorage';

const TimeEntry = props => {
	const [state, setState] = useState({
		title: '',
		tagTitle: '',
		showGroup: false,
		entryDropdownShown: false,
		askToDeleteEntry: false,
		hideBillable: true
	});

	const toasterRef = useRef(null);

	const {
		timeEntry,
		project,
		task,
		groupedEntries,
		workspaceSettings,
		isUserOwnerOrAdmin,
		collapsedEntry,
		timeEntryIndex,
		timeFormat,
		userSettings,
		playTimeEntry
	} = props;

	const durationFormat = () => {
		const { trackTimeDownToSecond, decimalFormat } = workspaceSettings;

		if (decimalFormat) {
			return 'h.hh'; /* decimal */
		} else if (trackTimeDownToSecond) {
			return 'HH:mm:ss'; /* full */
		} else {
			return 'H:mm'; /* compact */
		}
	};

	const durationFormatValue = durationFormat();
	const { numberFormat } = workspaceSettings;
	let entryDuration;
	const isEntryGrouped = Boolean(groupedEntries?.length > 0);

	// setDateAndDurationForSameEntries
	if (isEntryGrouped) {
		const sumOfDurations = duration(0);

		groupedEntries.forEach(entry => {
			if (durationFormatValue === 'h.hh') {
				const childDurationInHours = moment.duration(entry.timeInterval.duration).asHours();
				const rounded = Number(Math.round(Number(childDurationInHours + 'e2')) + 'e-2');
				const oneHourInMilliseconds = 3_600_000;
				sumOfDurations.add(rounded * oneHourInMilliseconds);
			} else {
				sumOfDurations.add(entry.timeInterval.duration);
			}
		});

		entryDuration = numberFormatTransform(
			parseTime(sumOfDurations, durationFormatValue),
			numberFormat,
			durationFormatValue
		);
	} else {
		entryDuration = numberFormatTransform(
			parseTime(timeEntry.timeInterval.duration, durationFormatValue),
			numberFormat,
			durationFormatValue
		);
	}

	const entryClassNames = [];
	if ((timeEntry.isLocked && !isUserOwnerOrAdmin) || timeEntry.approvalRequestId) {
		entryClassNames.push('time-entry time-entry-locked');
	} else {
		entryClassNames.push('time-entry');
	}
	if (collapsedEntry) {
		entryClassNames.push('time-entry--collapsed');
	}
	if (state.entryDropdownShown) {
		entryClassNames.push('time-entry--focused');
	}

	const canChangeBillable = async () => {
		const hideBillable = await offlineStorage.getHideBillable();
		if (state.hideBillable !== hideBillable) {
			setState(prevState => ({ ...prevState, hideBillable }));
		}
	};

	useEffect(() => {
		createTitle();
		canChangeBillable();
	}, []);

	const goToEdit = async () => {
		if (
			!groupedEntries?.length &&
			(!timeEntry.isLocked || isUserOwnerOrAdmin) &&
			timeEntry.approvalRequestId == null
		) {
			window.reactRoot.render(
				<EditForm
					changeMode={changeMode.bind(this)}
					timeEntry={timeEntry}
					workspaceSettings={workspaceSettings}
					timeFormat={timeFormat}
					userSettings={userSettings}
				/>
			);
		}
	};

	const continueTimeEntry = e => {
		e.stopPropagation();
		playTimeEntry(timeEntry);
	};

	const toggleEntryDropdownMenu = e => {
		e && e.stopPropagation();
		if (timeEntry.approvalRequestId == null && (!timeEntry.isLocked || isUserOwnerOrAdmin)) {
			setState(state => ({
				...state,
				entryDropdownShown: !state.entryDropdownShown
			}));
		}
	};

	const createTitle = () => {
		let title = '';
		let tagTitle = '';

		if (timeEntry.description) {
			title = locales.DESCRIPTION_LABEL + ': ' + timeEntry.description;
		}

		if (project) {
			if (project.name) {
				title = title + (title ? '\n' : '') + `${locales.PROJECT}: ` + project.name;
			}

			if (task && task.name) {
				title = title + `\n${locales.TASK}: ` + task.name;
			}

			if (project.clientName) {
				title = title + `\n${locales.CLIENT}: ` + project.clientName;
			}
		}

		const { tags } = timeEntry;
		if (tags && tags.length > 0) {
			tagTitle =
				(tags.length > 1 ? `${locales.TAGS}:\n` : `${locales.TAG}: `) +
				tags
					.map(tag => tag.name)
					.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
					.join('\n');
		}

		setState(prevState => ({
			...prevState,
			title,
			tagTitle
		}));
	};

	const changeMode = mode => {
		props.changeMode(mode);
	};

	const handleGroupClick = e => {
		e.stopPropagation();
		setState(state => ({
			...state,
			showGroup: !state.showGroup
		}));
	};

	const toggleDeleteConfirmationModal = e => {
		e && e.stopPropagation();
		setState(state => ({
			...state,
			askToDeleteEntry: !state.askToDeleteEntry,
			entryDropdownShown: false
		}));
	};

	const onClickDuplicateEntry = async e => {
		e.stopPropagation();

		const { project } = timeEntry;
		const requiredAndMissingCustomFieldNames = await getRequiredAndMissingCustomFieldNames(
			project,
			timeEntry
		);
		const requiredAndMissingFieldNames = getRequiredAndMissingFieldNames(
			timeEntry,
			workspaceSettings
		);
		const missingFields = requiredAndMissingFieldNames.concat(
			requiredAndMissingCustomFieldNames
		);

		// Admin and Owners can duplicate a Holiday/TimeOff TimeEntry even if they have missing fields.
		const canDuplicate =
			workspaceSettings.timeOff.active &&
			isUserOwnerOrAdmin &&
			(timeEntry.type === TimeEntryTypeEnum.TIME_OFF ||
				timeEntry.type === TimeEntryTypeEnum.HOLIDAY);

		if (missingFields.length > 0 && !canDuplicate) {
			const errorMessage = `${locales.CANT_SAVE_WITHOUT_REQUIRED_FIELDS.replace(
				'.',
				''
			)}: ${missingFields.join(', ')}`;
			toasterRef.current.toast('error', errorMessage, 3);
			return;
		}
		toggleEntryDropdownMenu();

		getBrowser()
			.runtime.sendMessage({
			eventName: 'duplicateTimeEntry',
			options: {
				entryId: timeEntry.id
			}
		})
			.then(() => {
				props.handleRefresh();
				toasterRef.current.toast('success', locales.GLOBAL__DUPLICATE_SUCCESS_MSG, 2);
			})
			.catch(error => {
				toasterRef.current.toast(
					'error',
					locales.replaceLabels(error.response.data.message),
					2
				);
			});
	};

	const onClickDeleteEntries = () => {
		if (groupedEntries?.length > 0) {
			deleteMultipleEntries(groupedEntries.map(entry => entry.id));
		} else {
			deleteEntry(timeEntry.id);
		}
	};

	const deleteEntry = async entryId => {
		getBrowser()
			.runtime.sendMessage({
			eventName: 'deleteTimeEntry',
			options: {
				entryId
			}
		})
			.then(() => {
				setState(state => ({ ...state, askToDeleteEntry: false }));
				props.handleRefresh();
			})
			.catch(() => {
			});
	};

	const deleteMultipleEntries = async entryIds => {
		getBrowser()
			.runtime.sendMessage({
			eventName: 'deleteTimeEntries',
			options: {
				entryIds
			}
		})
			.then(() => {
				setState(state => ({ ...state, askToDeleteEntry: false }));
				props.handleRefresh();
			})
			.catch(() => {
			});
	};

	const byTimeDate = (firstEntry, secondEntry) => {
		return new Date(secondEntry.timeInterval.start) - new Date(firstEntry.timeInterval.start);
	};

	return (
		<React.Fragment>
			<Toaster ref={toasterRef} />
			<div>
				<div
					data-pw={`time-entry-${timeEntryIndex}`}
					className={entryClassNames.join(' ')}
					title={state.title}
					key={timeEntry.id}
					onClick={goToEdit}>
					{!!groupedEntries?.length && (
						<div className="time-entry-group-number" onClick={handleGroupClick}>
							{groupedEntries.length}
						</div>
					)}
					<div
						className="time-entry-description"
						data-pw={`time-entry-description-${timeEntryIndex}`}>
						<div className={timeEntry.description ? 'description' : 'no-description'}>
							{timeEntry.description ? timeEntry.description : locales.NO_DESCRIPTION}
						</div>
						<div
							style={project ? { color: project.color } : {}}
							className={project ? 'time-entry-project' : 'disabled'}>
							<div className="time-entry__project-wrapper">
								<div
									style={project ? { background: project.color } : {}}
									className="dot"></div>
								<span className="time-entry__project-name">
									{project ? project.name : ''}
									{task ? ': ' + task.name : ''}
								</span>
							</div>
							<span className="time-entry__client-name">
								{project && project.clientName ? ' - ' + project.clientName : ''}
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
									title={state.tagTitle}
									alt="Tags"
								/>
							)}

							{timeEntry.billable && !state.hideBillable && (
								<img
									src="./assets/images/billable.png"
									title="Billable"
									alt="Billable"
								/>
							)}

							{timeEntry.type === TimeEntryTypeEnum.BREAK && (
								<img src="./assets/images/break.png" title="Break" alt="Break" />
							)}
						</div>
						<div className="time-entry__right-side__lock_and_play">
							<span className="time-entry__right-side--duration">
								{entryDuration}
							</span>
							<span
								className="time-entry-arrow"
								onClick={continueTimeEntry}
								title={locales.TRACKER__TIME_TRACKER__ENTRY__CONTINUE}
							/>
							<span className="time-entry-menu">
								<img
									onClick={toggleEntryDropdownMenu}
									className="time-entry-menu__icon"
									src="./assets/images/menu-dots-vertical.svg"
									alt="Menu"
								/>
								{state.entryDropdownShown && (
									<TimeEntryDropdown
										entry={timeEntry}
										group={groupedEntries}
										onDelete={e => toggleDeleteConfirmationModal(e)}
										onDuplicate={e => onClickDuplicateEntry(e)}
										toggleDropdown={toggleEntryDropdownMenu}
										manualModeDisabled={props.manualModeDisabled}
									/>
								)}
							</span>
						</div>
					</div>
				</div>
				{state.showGroup &&
					groupedEntries
						?.sort(byTimeDate)
						?.map((entry, index) => (
							<TimeEntry
								timeEntryIndex={index}
								key={entry.id}
								timeEntry={entry}
								project={entry.project ? entry.project : null}
								task={entry.task ? entry.task : null}
								playTimeEntry={props.playTimeEntry}
								changeMode={props.changeMode}
								timeFormat={props.timeFormat}
								workspaceSettings={workspaceSettings}
								features={props.features}
								isUserOwnerOrAdmin={isUserOwnerOrAdmin}
								userSettings={props.userSettings}
								collapsedEntry={true}
								handleRefresh={props.handleRefresh}
								manualModeDisabled={props.manualModeDisabled}
							/>
						))}
			</div>
			<DeleteEntryConfirmation
				askToDeleteEntry={state.askToDeleteEntry}
				canceled={toggleDeleteConfirmationModal}
				confirmed={onClickDeleteEntries}
				multiple={props.groupedEntries}
			/>
		</React.Fragment>
	);
};
export default TimeEntry;
