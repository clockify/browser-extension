import * as React from 'react';
import moment, { duration } from 'moment';
import * as momentTimezone from 'moment-timezone';

import DatePicker from 'react-datepicker';
import MyTimePicker from './my-time-picker.component';
import MyDurationPicker from './my-duration-picker.component';
import { HtmlStyleHelper } from '../helpers/html-style-helper';
import locales from '../helpers/locales';
import dateFnsLocale from './date-fns-locale';

const htmlStyleHelpers = new HtmlStyleHelper();
const daysOfWeek = [
	'SUNDAY',
	'MONDAY',
	'TUESDAY',
	'WEDNESDAY',
	'THURSDAY',
	'FRIDAY',
	'SATURDAY',
];

let _currentPeriod;
let _interval;

class Duration extends React.Component {
	constructor(props) {
		super(props);

		const {
			start,
			end,
			duration: intervalDuration,
		} = this.props.timeEntry.timeInterval;
		let startTime = moment(start);
		let endTime = null;
		if (end) {
			endTime = moment(end);
			if (moment(start).date() !== moment(end).date()) {
				startTime = moment(start).subtract(1, 'day');
				endTime = moment(end).subtract(1, 'day');
			}
		}
		this.state = {
			datePickerOpen: false,
			timeFormat: this.props.timeFormat === 'HOUR12' ? 'h:mm A' : 'HH:mm',
			start,
			end,
			startTime,
			endTime,
			timeZone: '',
			dayAfterLockedEntries: 'January 1, 1970, 00:00:00 UTC',
			manualModeDisabled: null,
			time: duration(
				intervalDuration ? intervalDuration : moment().diff(moment(start))
			),
			lang: 'en',
		};

		this.selectStartTime = this.selectStartTime.bind(this);
		this.selectEndTime = this.selectEndTime.bind(this);
		this.selectDuration = this.selectDuration.bind(this);
		this.changeDuration = this.changeDuration.bind(this);
		this.setAsyncStateItems = this.setAsyncStateItems.bind(this);

		dateFnsLocale.regLocale();
	}

	componentDidMount() {
		this.setDayAfterLockedEntries();
		this.setStartDayInDatePicker(this.props.userSettings.weekStart);
		this.setTime();
		this.setAsyncStateItems();
	}

	async setAsyncStateItems() {
		const manualModeDisabled = await localStorage.getItem('manualModeDisabled');
		const lang = await localStorage.getItem('lang');
		const { timeZone } = JSON.parse(await localStorage.getItem('userSettings'));
		this.setState({
			manualModeDisabled: JSON.parse(manualModeDisabled),
			lang,
			timeZone: timeZone,
		});
	}

	componentDidUpdate(prevProps, prevState) {
		const { start, end } = this.props.timeEntry.timeInterval;
		let startTime = moment(start);
		let endTime = null;
		if (end) {
			endTime = moment(end);
			if (
				!this.props.isFormManual &&
				moment(start).date() !== moment(end).date()
			) {
				startTime = moment(start).subtract(1, 'day');
				endTime = moment(end).subtract(1, 'day');
			}
		}
		if (start !== prevState.start) {
			if (end !== prevState.end) {
				this.setState({
					start,
					startTime,
					end,
					endTime,
					time: duration(moment(end).diff(start)),
					datePickerOpen: false,
				});
			} else {
				this.setState({
					start,
					startTime,
					time: duration(
						end ? moment(end).diff(start) : moment().diff(moment(start))
					),
					datePickerOpen: false,
				});
			}
			_currentPeriod = moment().diff(moment(start));
		} else if (end !== prevState.end) {
			this.setState({
				end,
				endTime,
				time: duration(moment(end).diff(start)),
			});
		}
	}

	componentWillUnmount() {
		if (_interval) clearInterval(_interval);
	}

	setStartDayInDatePicker(weekStart) {
		moment.updateLocale('en', {
			week: {
				dow: daysOfWeek.indexOf(weekStart),
				doy: 7 + daysOfWeek.indexOf(weekStart) - 1,
			},
		});
	}

	setDayAfterLockedEntries() {
		if (
			!this.props.isUserOwnerOrAdmin &&
			!!this.props.workspaceSettings.lockTimeEntries
		) {
			this.setState({
				dayAfterLockedEntries: this.props.workspaceSettings.lockTimeEntries,
			});
		}
	}

	setTime() {
		const { timeInterval } = this.props.timeEntry;
		if (!timeInterval.end) {
			_currentPeriod = moment().diff(moment(timeInterval.start));
			clearInterval(_interval);
			_interval = setInterval(() => {
				_currentPeriod += 1000;
				this.setState({
					time: duration(_currentPeriod), //.format('HH:mm:ss', {trim: false})
				});
			}, 1000);
		}
	}

	selectStartTime(startTime) {
		if (startTime && !startTime.isSame(this.state.startTime)) {
			this.changeStart(startTime);
		}
	}

	selectEndTime(endTime) {
		if (endTime && !endTime.isSame(this.state.endTime)) {
			this.changeEnd(endTime);
		}
	}

	changeStart(startTime) {
		const timeInterval = Object.assign(this.props.timeEntry.timeInterval, {});
		startTime = moment(startTime).set('second', 0);

		const endTime = this.state.endTime || moment();

		if (moment(endTime).diff(startTime) < 0) {
			startTime = moment(startTime).subtract(1, 'day');
		} else if (
			moment(endTime).date() !== moment(startTime).date() &&
			moment(endTime).date(1).diff(moment(startTime).date(1)) > 0
		) {
			startTime = moment(startTime).add(1, 'day');
		}

		timeInterval.start = startTime;
		timeInterval.end = this.state.endTime;
		this.props.changeInterval(timeInterval);
	}

	changeEnd(endTime) {
		const timeInterval = Object.assign(this.props.timeEntry.timeInterval, {});

		let startTime = this.state.startTime;
		endTime = moment(endTime).set('second', 0);

		if (moment(endTime).diff(startTime) < 0) {
			startTime = moment(startTime).subtract(1, 'day');
		} else if (
			moment(endTime).date() !== moment(startTime).date() &&
			moment(endTime).date(1).diff(moment(startTime).date(1)) > 0
		) {
			startTime = moment(startTime).add(1, 'day');
		}

		timeInterval.start = startTime;
		timeInterval.end = endTime;
		this.props.changeInterval(timeInterval);
	}

	selectDuration(time, timeString) {
		if (timeString) {
			this.changeDuration(timeString);
		}
	}

	changeDuration(selectedDuration) {
		this.props.changeDuration(selectedDuration);
	}

	selectDate(date) {
		this.props.changeDate(date);
	}

	cancelDate() {
		this.setState({
			datePickerOpen: false,
		});
	}

	openDatePicker() {
		this.setState({
			datePickerOpen: true,
		});
	}

	fadeBackgroundAroundTimePicker(event) {
		if (event) {
			htmlStyleHelpers.fadeBackground();
		} else {
			setTimeout(() => {
				htmlStyleHelpers.unfadeBackground();
			}, 100);
		}
	}

	render() {
		const renderDayContents = (day, date) => {
			const isDayDisabled = new Date(this.state.dayAfterLockedEntries) > date;
			const tooltipText = isDayDisabled
				? `Can't add time to locked period.`
				: '';
			return (
				<div
					title={tooltipText}
					style={{ textDecoration: isDayDisabled ? 'line-through' : 'none' }}
				>
					{day}
				</div>
			);
		};

		return (
			<div className="duration">
				<div className="duration-time">
					<label className={!this.state.end ? 'duration-label' : 'disabled'}>
						{locales.START}:
					</label>
					<span className="ant-time-picker duration-start ant-time-picker-small">
						{this.state.timeZone && (
							<MyTimePicker
								id="startTimePicker"
								value={momentTimezone(this.state.startTime).tz(
									this.state.timeZone
								)}
								className="ant-time-picker-input"
								format={this.state.timeFormat}
								size="small"
								use12Hours={this.props.timeFormat === 'HOUR12'}
								onChange={this.selectStartTime}
								editDisabled={this.state.manualModeDisabled}
								title={
									this.state.manualModeDisabled
										? locales.DISABLED_MANUAL_MODE
										: ''
								}
							/>
						)}
					</span>
					<label className={this.state.end ? 'duration-dash' : 'disabled'}>
						-
					</label>
					<span className="ant-time-picker duration-end ant-time-picker-small">
						{this.state.timeZone && (
							<MyTimePicker
								id="endTimePicker"
								value={momentTimezone(this.state.endTime).tz(
									this.state.timeZone
								)}
								className={
									this.state.end ? 'ant-time-picker-input' : 'disabled'
								}
								isDisabled={!this.state.end}
								format={this.state.timeFormat}
								size="small"
								use12Hours={this.props.timeFormat === 'HOUR12'}
								onChange={this.selectEndTime}
								editDisabled={this.state.manualModeDisabled}
								title={
									this.state.manualModeDisabled
										? locales.DISABLED_MANUAL_MODE
										: ''
								}
							/>
						)}
					</span>
					<span
						style={{
							paddingRight: this.state.end ? '' : '3px',
							position: 'relative',
						}}
					>
						{!this.state.end ? (
							<span
								style={{
									position: 'absolute',
									right: '5px',
									bottom: '-12px',
									wordBreak: 'keep-all',
								}}
							>
								{locales.TODAY_LABEL}
							</span>
						) : (
							<DatePicker
								selected={new Date(this.state.start)} //moment(this.state.start)}
								onChange={this.selectDate.bind(this)}
								customInput={<img src="./assets/images/calendar.png" />}
								withPortal
								minDate={new Date(this.state.dayAfterLockedEntries)}
								disabled={this.state.manualModeDisabled}
								renderDayContents={renderDayContents}
								title={
									this.state.manualModeDisabled
										? locales.DISABLED_MANUAL_MODE
										: ''
								}
								className={
									this.state.manualModeDisabled ? 'disable-manual' : ''
								}
								locale={this.state.lang}
							/>
						)}
					</span>
					<span className="duration-divider"></span>
					<span className="ant-time-picker duration-end ant-time-picker-small">
						<MyDurationPicker
							id="durationTimePicker"
							className={'ant-time-picker-input'}
							isDisabled={!this.state.end}
							defaultOpenValue={this.state.time}
							placeholder={
								this.props.workspaceSettings.trackTimeDownToSecond
									? 'Duration (HH:mm:ss)'
									: 'Duration (h:mm)'
							}
							size="small"
							format={
								this.props.workspaceSettings.trackTimeDownToSecond
									? 'HH:mm:ss'
									: 'H:mm'
							}
							onChange={this.selectDuration}
							editDisabled={this.state.manualModeDisabled}
							title={
								this.state.manualModeDisabled
									? locales.DISABLED_MANUAL_MODE
									: ''
							}
						/>
					</span>
				</div>
			</div>
		);
	}
}

export default Duration;
