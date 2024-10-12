import moment, { duration } from 'moment';
import React from 'react';
import TimeEntry from './time-entry.component';
import locales from '../helpers/locales';
import { isEqual } from 'lodash';
import { Application } from '../application';
import { toDecimalFormat } from '../helpers/time.helper';
import { areArraysSimilar } from '../helpers/utils';

class TimeEntryList extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			timeEntry: {},
			time: moment().hour(0).minute(0).second(0).format('HH:mm:ss'),
			wsSettings: {},
		};
		this.application = new Application();
		this.handleRefresh = this.handleRefresh.bind(this);
	}

	componentDidMount() {
		this.getTimeFormat();
	}

	async getTimeFormat() {
		const wsSettings = JSON.parse(await localStorage.getItem('workspaceSettings'));
		this.setState({
			wsSettings,
		});
	}

	getTotalWeekTimeFormatted(total) {
		if (this.state.wsSettings?.decimalFormat) {
			if (!isNaN(Number(total))) {
				const result = Number(total) + Number(toDecimalFormat(duration(this.state.time)));
				return result.toFixed(2);
			}
			return total;
		}

		return duration(total.replace(',', ''))
			.add(this.state.time)
			.format(this.state.wsSettings?.trackTimeDownToSecond ? 'HH:mm:ss' : 'h:mm', {
				trim: false,
			});
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
		if (prevProps.timeChange !== this.props.timeChange) {
			if (this.props.timeChange === '00:00:00') {
				setTimeout(() => {
					this.setState({
						time: this.props.timeChange,
					});
				}, 315);
			} else {
				this.setState({
					time: this.props.timeChange,
				});
			}
		}

		if (prevProps.groups !== this.props.groups) {
			this.getTimeFormat();
		}
	}

	playTimeEntry(timeEntry) {
		this.props.selectTimeEntry(timeEntry);
	}

	handleRefresh() {
		this.props.handleRefresh();
	}

	changeMode(mode) {
		this.props.changeMode(mode);
	}

	isSimilarEntry(entry1, entry2) {
		const {
			billable,
			isLocked,
			start,
			description,
			tags,
			projectId,
			taskId,
			customFieldValues,
			type: type1,
		} = entry1;

		const {
			billable: billable2,
			isLocked: isLocked2,
			start: start2,
			description: description2,
			tags: tags2,
			projectId: projectId2,
			taskId: taskId2,
			customFieldValues: customFieldValues2,
			type: type2,
		} = entry2;

		const isEmptyOrFalsey = value => {
			return !value || (Array.isArray(value) && value.length === 0);
		};

		const checkCustomFields = (cfs1, cfs2) => {
			if (cfs1.length === 0 && cfs2.every(cv => isEmptyOrFalsey(cv.value))) return true;
			if (cfs2.length === 0 && cfs1.every(cv => isEmptyOrFalsey(cv.value))) return true;
			if (cfs1.length !== cfs2.length) return false;

			return cfs1.every(cf1 => {
				const cf2 = cfs2.find(cf2 => cf1.customFieldId === cf2.customFieldId);
				return cf2 && isEqual(cf1.value, cf2.value);
			});
		};

		return (
			billable === billable2 &&
			isLocked === isLocked2 &&
			start === start2 &&
			description === description2 &&
			projectId === projectId2 &&
			taskId === taskId2 &&
			type1 === type2 &&
			areArraysSimilar(tags, tags2) &&
			checkCustomFields(customFieldValues, customFieldValues2)
		);
	}

	render() {
		const { isOffline } = this.props;
		if (this.props.isLoading && !this.props.timeEntries.length) {
			return (
				<div>
					<p className="loading-entries">{locales.TRACKER__ENTRY_MESSAGES__LOADING}</p>
				</div>
			);
		} else if (this.props.timeEntries.length === 0 && !isOffline) {
			return (
				<div className="no-entries">
					<div className="no-entries-img"></div>
					<span>{locales.NO_RECENT_ENTRIES_TO_SHOW}</span>
					<label>{locales.YOU_HAVE_NOT_TRACKED}.</label>
				</div>
			);
		} else if (this.props.timeEntries.length === 0 && isOffline) {
			return (
				<div className="no-entries">
					<div className="no-entries-img"></div>
					<span>{locales.GET_ONLINE}.</span>
					<label>{locales.YOU_CAN_STILL_TRACK_TIME}.</label>
				</div>
			);
		} else {
			return (
				<div>
					{this.props.groups.map((group, index) => {
						return (
							<React.Fragment key={group.title}>
								<div className="week-header" data-pw={`week-${index}`}>
									<span className="week-header-dates">{group.title}</span>
									<span className="week-header-total">
										<span className="week-header-total-label">
											{group.totalTitle}{' '}
										</span>
										<span className="week-header-total-time">
											{group.title === locales.THIS_WEEK
												? this.getTotalWeekTimeFormatted(group.total)
												: group.total}
										</span>
									</span>
								</div>
								{this.props.dates
									.filter(date => group.dates.some(d => date.includes(d)))
									.map((day, index) => {
										const groupedIndexes = [];
										const parts = day.split('-');
										const lastPart = parts.pop();
										const firstPart = parts.join('-');
										return (
											<div
												className="time-entries-list"
												key={day}
												data-pw={`time-entries-list-${index}`}>
												<div className="time-entries-list-time">
													<span className="time-entries-list-day">
														{firstPart}
													</span>
													<div className="time-entries-total-and-time">
														<span className="time-entries-list-total">
															{locales.TOTAL}
														</span>
														<span className="time-entries-list-total-time">
															{lastPart}
														</span>
													</div>
												</div>
												{this.props.timeEntries
													.filter(
														timeEntry => timeEntry.start === firstPart
													)
													.sort((a, b) => {
														const aSeconds = moment(
															a.timeInterval.start
														).unix();
														const bSeconds = moment(
															b.timeInterval.start
														).unix();

														if (aSeconds === bSeconds) {
															return isChrome() ? -1 : 1;
														}

														return aSeconds - bSeconds;
													})
													.map((timeEntry, index, array) => {
														let group = [];
														if (
															!this.props.userSettings
																?.groupSimilarEntriesDisabled
														) {
															if (groupedIndexes.includes(index)) {
																return null;
															}
															groupedIndexes.push(index);
															group = array.reduce(
																(prev, curr, currIndex) => {
																	if (
																		currIndex !== index &&
																		this.isSimilarEntry(
																			timeEntry,
																			curr
																		)
																	) {
																		groupedIndexes.push(
																			currIndex
																		);
																		prev.push(curr);
																	}
																	return prev;
																},
																[]
															);
															if (group.length) {
																group.unshift(timeEntry);
															}
														}
														return (
															<TimeEntry
																timeEntryIndex={index}
																key={timeEntry.id}
																timeEntry={timeEntry}
																project={
																	timeEntry.project
																		? timeEntry.project
																		: null
																}
																task={
																	timeEntry.task
																		? timeEntry.task
																		: null
																}
																playTimeEntry={this.playTimeEntry.bind(
																	this
																)}
																changeMode={this.changeMode.bind(
																	this
																)}
																timeFormat={this.props.timeFormat}
																workspaceSettings={
																	this.props.workspaceSettings
																}
																features={this.props.features}
																isUserOwnerOrAdmin={
																	this.props.isUserOwnerOrAdmin
																}
																userSettings={
																	this.props.userSettings
																}
																groupedEntries={group}
																handleRefresh={this.handleRefresh}
																manualModeDisabled={
																	this.props.manualModeDisabled
																}
															/>
														);
													})
													.reverse()}
											</div>
										);
									})}
							</React.Fragment>
						);
					})}
				</div>
			);
		}
	}
}

export default TimeEntryList;
