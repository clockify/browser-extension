import * as React from 'react';
import moment, {duration} from 'moment';
import DatePicker from 'react-datepicker';
import {getAppTypes} from "../enums/applications-types.enum";
import {add24hIfEndBeforeStart} from "../helpers/time.helper";
import MyTimePicker from './my-time-picker.component'
import MyDurationPicker from './my-duration-picker.component'
import {HtmlStyleHelper} from "../helpers/html-style-helper";

const htmlStyleHelpers = new HtmlStyleHelper();
const dayInSeconds = 86400;
const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

let _currentPeriod; 
let _interval;

class Duration extends React.Component {

    constructor(props) {
        super(props);

        const { start, end } = this.props.timeEntry.timeInterval;
        this.state = {
            datePickerOpen: false,
            timeFormat: this.props.timeFormat === 'HOUR12' ? 'h:mm A' : 'HH:mm',
            start,
            end,
            startTime: moment(start),
            endTime: moment(end),
            dayAfterLockedEntries: 'January 1, 1970, 00:00:00 UTC',
            manualModeDisabled: JSON.parse(localStorage.getItem('manualModeDisabled')),
            time: duration(end 
                    ? moment(end).diff(start)
                    : moment().diff(moment(start))
                  )
        }

        this.selectStartTime = this.selectStartTime.bind(this);
        this.selectEndTime = this.selectEndTime.bind(this);
        this.selectDuration = this.selectDuration.bind(this);
        this.changeDuration = this.changeDuration.bind(this);
    }

    componentDidMount(){
        this.setDayAfterLockedEntries();
        this.setStartDayInDatePicker(this.props.userSettings.weekStart);
        this.setTime();
    }
  

    componentDidUpdate(prevProps, prevState) {
        const { start, end } = this.props.timeEntry.timeInterval;
        if (start !== prevState.start) {
            if (end !== prevState.end) {
                this.setState({
                    start,
                    startTime: moment(start),
                    end,
                    endTime: moment(end),
                    time: duration(moment(end).diff(start)),
                    datePickerOpen: false
                })    
            }
            else {
                this.setState({
                    start,
                    startTime: moment(start),
                    time: duration(end 
                        ? moment(end).diff(start)
                        : moment().diff(moment(start))
                      ),
                    datePickerOpen: false
                })    
            }
            _currentPeriod = moment().diff(moment(start));
        }
        else if (end !== prevState.end) {
            this.setState({
                end,
                endTime: moment(end),
                time: duration(moment(end).diff(start))
            })
        }
    }

    componentWillUnmount() {
        if (_interval)
            clearInterval(_interval);  
    }

    setStartDayInDatePicker(weekStart) {
        moment.updateLocale('en', {
            week: {
                dow: daysOfWeek.indexOf(weekStart),
                doy: 7 + daysOfWeek.indexOf(weekStart) - 1
            }
        });
    }

    setDayAfterLockedEntries() {
        if (!this.props.isUserOwnerOrAdmin && !!this.props.workspaceSettings.lockTimeEntries) {
            this.setState({
                dayAfterLockedEntries: this.props.workspaceSettings.lockTimeEntries
            });
        }
    }

    setTime() {
        const { timeInterval } = this.props.timeEntry;
        if (!timeInterval.end) {
            _currentPeriod = moment().diff(moment(timeInterval.start));
            _interval = setInterval(() => {
                _currentPeriod += 1000;
                this.setState({
                    time: duration(_currentPeriod) //.format('HH:mm:ss', {trim: false})
                })
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
            this.changeEnd(endTime)
        }
    }

    changeStart(startTime) {
        const timeInterval = Object.assign(this.props.timeEntry.timeInterval, {});
        startTime = moment(startTime).set('second', 0);
        // if (moment().diff(startTime) < 0) {
        //     startTime = timeInterval.end
        //         ? timeInterval.end
        //         : moment();
        // }

        if (timeInterval.end) {
            while (moment(timeInterval.end).diff(startTime) < 0) {
                startTime = moment(startTime).subtract(1, 'day');
            }
        };

        timeInterval.start = startTime;
        this.props.changeInterval(timeInterval);
    }

    changeEnd(endTime) {       
        const timeInterval = Object.assign(this.props.timeEntry.timeInterval, {});

        endTime = moment(endTime).set('second', 0);

        //if (endTime.diff(moment(timeInterval.start)) < 0) {
        //    endTime = moment(timeInterval.start);
        //};

        timeInterval.end = endTime;

        while (moment(endTime).diff(timeInterval.startTime) < 0) {
            endTime = moment(endTime).add(1, 'day');
        }

        this.props.changeInterval(timeInterval);
    }

    selectDuration(time, timeString) {
        if (!!timeString) {
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
            datePickerOpen: false
        })
    }

    openDatePicker() {
        this.setState({
            datePickerOpen: true
        })
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
    
    render(){
        return (
            <div className="duration">
                <div className="duration-time">
                    <label className={!this.state.end ? "duration-label" : "disabled"}>Start:</label>
                    <span className="ant-time-picker duration-start ant-time-picker-small">
                        <MyTimePicker 
                            id="startTimePicker"
                            value={this.state.startTime}
                            className="ant-time-picker-input"
                            format={this.state.timeFormat}
                            size="small"
                            use12Hours={this.props.timeFormat === 'HOUR12'}
                            onChange={this.selectStartTime}
                            editDisabled={this.state.manualModeDisabled}
                            title={this.state.manualModeDisabled?"Manual tacking mode is disabled":""}
                        />
                    </span>
                    <label className={this.state.end ? "duration-dash" : "disabled"}>-</label>
                    <span className="ant-time-picker duration-end ant-time-picker-small">
                        <MyTimePicker 
                            id="endTimePicker"
                            value={this.state.endTime}
                            className={this.state.end ? "ant-time-picker-input" : "disabled"}
                            isDisabled={!this.state.end}
                            format={this.state.timeFormat}
                            size="small"
                            use12Hours={this.props.timeFormat === 'HOUR12'}
                            onChange={this.selectEndTime}
                            editDisabled={this.state.manualModeDisabled}
                            title={this.state.manualModeDisabled?"Manual tacking mode is disabled":""}
                        />
                    </span>
                    <span style={{paddingRight: this.state.end?'':'3px'}}>
                    {!this.state.end 
                        ? 'Today'
                        : <DatePicker
                            selected={moment(this.state.start)}
                            onChange={this.selectDate.bind(this)}
                            customInput={<img src="./assets/images/calendar.png"/>}
                            withPortal
                            min={moment(new Date(this.state.dayAfterLockedEntries))}
                            max={!this.props.end ?
                                moment(/*this.props.start*/) : moment().add(10, 'years')}
                            disabled={this.state.manualModeDisabled}
                            title={this.state.manualModeDisabled?"Manual tacking mode is disabled":""}
                            className={this.state.manualModeDisabled?"disable-manual":""}
                        />
                    }
                    </span>
                    <span className="duration-divider"></span>
                    <span className="ant-time-picker duration-end ant-time-picker-small">
                        <MyDurationPicker id="durationTimePicker"
                            className={"ant-time-picker-input"}
                            isDisabled={!this.state.end}
                            defaultOpenValue={this.state.time}
                            placeholder={this.props.workspaceSettings.trackTimeDownToSecond ?
                                "Duration (HH:mm:ss)" : "Duration (h:mm)"}
                            size="small"
                            format={this.props.workspaceSettings.trackTimeDownToSecond ? "HH:mm:ss" : "H:mm"}
                            onChange={this.selectDuration}
                            editDisabled={this.state.manualModeDisabled}
                            title={this.state.manualModeDisabled?"Manual tacking mode is disabled":""}
                        />
                    </span>
                </div>
            </div>
        )
    }
}

export default Duration;