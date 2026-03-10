import * as React from 'react';
import moment, { duration } from 'moment';
import * as momentTimezone from 'moment-timezone';
import { getBrowser } from '../helpers/browser-helper';

import DatePicker from 'react-datepicker';
import MyTimePicker from './my-time-picker.component';
import { MyDurationPicker } from '~/components/MyDurationPicker.tsx';
import { HtmlStyleHelper } from '../helpers/html-style-helper';
import locales from '../helpers/locales';
import { dateFnsLocale } from '~/components/DateFnsLocale';

import './duration.css';

const htmlStyleHelpers = new HtmlStyleHelper();
const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

let _currentPeriod;
let _interval;

class Duration extends React.Component {
	isDaySubtractedFromStart = false;

	constructor(props) {
		super(props);

		const { start, end } = this.props.timeEntry.timeInterval;
		let startTime = moment(start).set('second', 0);
		let endTime = null;
		if (end) {
			endTime = moment(end);
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
			time: duration(end ? moment(end).diff(start) : moment().diff(moment(start))),
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
		}
		if (start !== prevState.start) {
			if (end !== prevState.end) {
				this.setState({
					start,
					startTime,
					end,
					endTime,
					time: duration(
						moment(endTime.set('second', 0).set('milliseconds', 0)).diff(
							startTime.set('second', 0).set('milliseconds', 0)
						)
					),
					datePickerOpen: false,
				});
			} else {
				this.setState({
					start,
					startTime,
					time: duration(end ? moment(end).diff(start) : moment().diff(moment(start))),
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
		if (!this.props.isUserOwnerOrAdmin && !!this.props.workspaceSettings.lockTimeEntries) {
			this.setState({
				dayAfterLockedEntries: this.props.workspaceSettings.lockTimeEntries,
			});
		}
	}

	setTime() {
		const { timeInterval } = this.props.timeEntry;
		/* this.changeStart(timeInterval.start); */

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
		if (startTime && !startTime?.isSame(this.state.startTime)) {
			this.changeStart(startTime);
		}
	}

	selectEndTime(endTime) {
		if (endTime && !endTime?.isSame(this.state.endTime)) {
			this.changeEnd(endTime);
		}
	}

	changeStart(startTime) {
		let start = moment(startTime).set('second', 0);
		const end =
			this.state.endTime !== null ? this.calculateEndTime(this.state.endTime, start) : null;

		if (
			!this.isDaySubtractedFromStart &&
			!this.state.end &&
			moment(this.props.timeEntry.startTime).diff(start) < 0
		) {
			start = moment(start).subtract(1, 'day');
			this.isDaySubtractedFromStart = true;
		}

		this.props.changeInterval({ ...this.props.timeEntry.timeInterval, start, end });
	}

	calculateEndTime(endTime, startTime) {
		let newEndTime = endTime;

		if (moment(newEndTime).diff(startTime) < 0) {
			newEndTime = moment(newEndTime).add(1, 'day');
		} else if (
			moment(newEndTime).date() !== moment(startTime).date() &&
			moment(newEndTime).date(1).diff(moment(startTime).date(1), 'month') > 0
		) {
			newEndTime = moment(newEndTime).subtract(1, 'day');
		}

		if (moment(newEndTime).diff(moment(startTime), 'hours') >= 24) {
			newEndTime = moment(newEndTime).subtract(1, 'day');
		}

		return newEndTime;
	}

	changeEnd(endTime) {
		const start = this.state.startTime;
		const end = this.calculateEndTime(moment(endTime).set('second', 0), start);

		this.props.changeInterval({ ...this.props.timeEntry.timeInterval, start, end });
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

	get durationFormat() {
		const { trackTimeDownToSecond, decimalFormat } = this.props.workspaceSettings;

		if (this.props.forceFullDurationFormat) {
			return 'HH:mm:ss';
		}

		if (decimalFormat) {
			return 'h.hh'; /* decimal */
		} else if (trackTimeDownToSecond) {
			return 'HH:mm:ss'; /* full */
		}

		return 'H:mm'; /* compact */
	}

	get calendarIcon() {
		const iconPath = 'assets/images/calendar.png';
		const iconUrl = getBrowser().runtime.getURL(iconPath);

		return <img src={iconUrl} />;
	}

	get selectedDate() {
		const { start, dayAfterLockedEntries } = this.state;

		const startInMilliseconds = moment(start).valueOf();
		const dayAfterInMilliseconds = new Date(dayAfterLockedEntries).getTime();

		if (this.props.isUserOwnerOrAdmin || dayAfterInMilliseconds <= startInMilliseconds) {
			return new Date(start);
		}

		return new Date(dayAfterLockedEntries);
	}

	get firstUnlockedDate() {
		const { isUserOwnerOrAdmin } = this.props;
		const { dayAfterLockedEntries } = this.state;

		return isUserOwnerOrAdmin ? null : new Date(dayAfterLockedEntries);
	}

	get dateLabel() {
		const startDay = moment(this.state.start);

		if (startDay.isSame(moment(), 'day')) {
			return locales.TODAY_LABEL;
		}

		return startDay.format('DD/MM/YYYY');
	}

	render() {
		const renderDayContents = (day, date) => {
			const isDayDisabled =
				!this.props.isUserOwnerOrAdmin && new Date(this.state.dayAfterLockedEntries) > date;
			const tooltipText = isDayDisabled ? `Can't add time to locked period.` : '';
			return (
				<div
					title={tooltipText}
					style={{ textDecoration: isDayDisabled ? 'line-through' : 'none' }}>
					{day}
				</div>
			);
		};

		return this.props.copyAsEntry ? (
			<div className="duration copy-as-entry">
				<MyDurationPicker
					id="durationTimePicker"
					time={this.state.time}
					workspaceSettings={this.props.workspaceSettings}
					timeInterval={this.props.timeEntry.timeInterval}
					durationFormat={this.durationFormat}
					className={'ant-time-picker-input'}
					isDisabled={!this.state.end}
					defaultOpenValue={this.state.time}
					placeholder={`Duration (${this.durationFormat})`}
					size="small"
					format={this.durationFormat}
					onChange={this.selectDuration}
					editDisabled={this.state.manualModeDisabled}
					title={this.state.manualModeDisabled ? locales.DISABLED_MANUAL_MODE : ''}
				/>
				<MyTimePicker
					id="startTimePicker"
					value={momentTimezone(this.state.startTime).tz(this.state.timeZone)}
					className="ant-time-picker-input"
					format={this.state.timeFormat}
					size="small"
					use12Hours={this.props.timeFormat === 'HOUR12'}
					onChange={this.selectStartTime}
					editDisabled={this.state.manualModeDisabled}
					title={this.state.manualModeDisabled ? locales.DISABLED_MANUAL_MODE : ''}
				/>
				<label>-</label>
				<MyTimePicker
					id="endTimePicker"
					value={momentTimezone(this.state.endTime).tz(this.state.timeZone)}
					className={this.state.end ? 'ant-time-picker-input' : 'disabled'}
					isDisabled={!this.state.end}
					format={this.state.timeFormat}
					size="small"
					use12Hours={this.props.timeFormat === 'HOUR12'}
					onChange={this.selectEndTime}
					editDisabled={this.state.manualModeDisabled}
					title={this.state.manualModeDisabled ? locales.DISABLED_MANUAL_MODE : ''}
				/>
				<DatePicker
					dateFormat="ddd"
					selected={this.selectedDate}
					onChange={this.selectDate.bind(this)}
					customInput={this.calendarIcon}
					withPortal
					minDate={this.firstUnlockedDate}
					title={this.state.manualModeDisabled ? locales.DISABLED_MANUAL_MODE : ''}
					className={this.state.manualModeDisabled ? 'disable-manual' : ''}
					locale={this.state.lang}
					renderDayContents={renderDayContents}
					useWeekdaysShort={true}
				/>
			</div>
		) : (
			<div className="duration">
				<div className="duration-time">
					<label className={!this.state.end ? 'duration-label' : 'disabled'}>
						{locales.START}:
					</label>
					<span className="ant-time-picker duration-start ant-time-picker-small">
						{this.state.timeZone && (
							<MyTimePicker
								id="startTimePicker"
								value={momentTimezone(this.state.startTime).tz(this.state.timeZone)}
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
					<label className={this.state.end ? 'duration-dash' : 'disabled'}>-</label>
					<span className="ant-time-picker duration-end ant-time-picker-small">
						{this.state.timeZone && (
							<MyTimePicker
								id="endTimePicker"
								value={momentTimezone(this.state.endTime).tz(this.state.timeZone)}
								className={this.state.end ? 'ant-time-picker-input' : 'disabled'}
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
						}}>
						{!this.state.end ? (
							<span
								style={{
									position: 'absolute',
									right: '5px',
									bottom: '-12px',
									wordBreak: 'keep-all',
								}}>
								{this.dateLabel}
							</span>
						) : (
							<DatePicker
								dateFormat="ddd"
								selected={this.selectedDate} //moment(this.state.start)}
								onChange={this.selectDate.bind(this)}
								customInput={<img src="./assets/images/calendar.png" />}
								withPortal
								minDate={this.firstUnlockedDate}
								disabled={this.state.manualModeDisabled}
								renderDayContents={renderDayContents}
								title={
									this.state.manualModeDisabled
										? locales.DISABLED_MANUAL_MODE
										: ''
								}
								className={this.state.manualModeDisabled ? 'disable-manual' : ''}
								locale={this.state.lang}
								useWeekdaysShort={true}
							/>
						)}
					</span>
					<span className="duration-divider"></span>
					<span
						className={`ant-time-picker  ant-time-picker-small ${this.state.end && 'duration-total-time'}`}>
						<MyDurationPicker
							id="durationTimePicker"
							time={this.state.time}
							workspaceSettings={this.props.workspaceSettings}
							timeInterval={this.props.timeEntry.timeInterval}
							durationFormat={this.durationFormat}
							className={'ant-time-picker-input'}
							isDisabled={!this.state.end}
							defaultOpenValue={this.state.time}
							placeholder={`Duration (${this.durationFormat})`}
							size="small"
							format={this.durationFormat}
							onChange={this.selectDuration}
							editDisabled={this.state.manualModeDisabled}
							title={
								this.state.manualModeDisabled ? locales.DISABLED_MANUAL_MODE : ''
							}
						/>
					</span>
				</div>
			</div>
		);
	}
}

export default Duration;
