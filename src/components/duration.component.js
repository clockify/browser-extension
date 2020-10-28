import * as React from 'react';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import {getAppTypes} from "../enums/applications-types.enum";
import {add24hIfEndBeforeStart} from "../helpers/time.helper";
import MyTimePicker from './my-time-picker.component'
import MyDurationPicker from './my-duration-picker.component'
import {HtmlStyleHelper} from "../helpers/html-style-helper";

const htmlStyleHelpers = new HtmlStyleHelper();
const dayInSeconds = 86400;
const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

class Duration extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            editDuration: true,
            datePickerOpen: false,
            timeFormat: this.props.timeFormat === 'HOUR12' ? 'h:mm A' : 'HH:mm',
            startTime: moment(this.props.timeEntry.timeInterval.start),
            endTime: moment(this.props.timeEntry.timeInterval.end),
            selectedDuration: null,
            dayAfterLockedEntries: 'January 1, 1970, 00:00:00 UTC',
            endTimeChanged: false,
            startTimeChanged: false
        }

        this.selectStartTime = this.selectStartTime.bind(this);
        this.selectEndTime = this.selectEndTime.bind(this);
        this.selectDuration = this.selectDuration.bind(this);
        this.openDurationPickerChange = this.openDurationPickerChange.bind(this);
        this.changeDuration = this.changeDuration.bind(this);
    }

    componentDidMount(){
        this.setDayAfterLockedEntries();
        this.setStartDayInDatePicker(this.props.userSettings.weekStart);
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

    selectStartTime(time) {
        if (time && !time.isSame(this.state.startTime)) {
            this.setState({
                startTime: time,
                startTimeChanged: true
            }, () => this.changeStart(this.state.startTime) );
        }
    }

    selectEndTime(time) {
        if (time && !time.isSame(this.state.endTime)) {
            this.setState({
                endTime:time,
                endTimeChanged: true
            }, () => this.changeEnd(this.state.endTime));
        }
    }

    changeStart(time) {
        if (!this.state.startTimeChanged) {
            return;
        }

        time = moment(time).set('second', 0);
        this.setState({
            startTime: time
        });

        if (moment().diff(time) < 0) {
            time = time.subtract(1, 'days');
        } else if (moment().diff(time) > dayInSeconds * 1000) {
            time = time.add(1, 'days');
        }

        this.props.timeEntry.timeInterval.start = time;
        this.props.timeEntry.timeInterval.end = add24hIfEndBeforeStart(
            this.props.timeEntry.timeInterval.start,
            this.props.timeEntry.timeInterval.end
        );
        this.props.changeInterval(this.props.timeEntry.timeInterval);
    }

    changeEnd(time) {
        if (!this.state.endTimeChanged) {
            return;
        }

        time = moment(time).set('second', 0);
        this.setState({
            endTime: time
        });

        this.props.timeEntry.timeInterval.end = time;
        this.props.timeEntry.timeInterval.end = add24hIfEndBeforeStart(
            this.props.timeEntry.timeInterval.start,
            this.props.timeEntry.timeInterval.end
        );

        this.props.changeInterval(this.props.timeEntry.timeInterval);
    }

    openPicker() {
        this.setState({
            editDuration: this.props.end ? true : false
        }, () => {
            if (this.props.end) {
                document.getElementById('durationTimePicker').click();
            }
        })
    }

    selectDuration(time, timeString) {
        if (!!timeString) {
            this.setState({
                selectedDuration: timeString
            }, () => {
                if (this.state.selectedDuration) {
                    this.changeDuration(this.state.selectedDuration);
    
                    this.setState({
                        selectedDuration: null
                    });
                }
                setTimeout(() => {
                    this.setState({
                        editDuration: false
                    });
                }, 100);
            })
        }
    }

    changeDuration(selectedDuration) {
        this.props.changeDuration(selectedDuration);
    }

    selectDate(date) {
        this.props.changeDate(date);
        this.setState({
            datePickerOpen: false
        })
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

    openDurationPickerChange(event) {
        this.fadeBackgroundAroundTimePicker(event);
        if (!event) {
            if (this.state.selectedDuration) {
                this.changeDuration(this.state.selectedDuration);

                this.setState({
                    selectedDuration: null
                });
            }
            setTimeout(() => {
                this.setState({
                    editDuration: false
                });
            }, 100);
        }
    }

    render(){
        return (
            <div className="duration">
                <div className="duration-time">
                    <label className={!this.props.end ? "duration-label" : "disabled"}>Start:</label>
                    <span className="ant-time-picker duration-start ant-time-picker-small">
                        <MyTimePicker 
                            id="startTimePicker"
                            value={this.state.startTime}
                            className="ant-time-picker-input"
                            format={this.state.timeFormat}
                            size="small"
                            use12Hours={this.props.timeFormat === 'HOUR12'}
                            onChange={this.selectStartTime}
                        />
                    </span>
                    <label className={this.props.end ? "duration-dash" : "disabled"}>-</label>
                    <span className="ant-time-picker duration-end ant-time-picker-small">
                        <MyTimePicker 
                            id="endTimePicker"
                            value={this.state.endTime}
                            className={this.props.end ? "ant-time-picker-input" : "disabled"}
                            isDisabled={!this.props.end}
                            format={this.state.timeFormat}
                            size="small"
                            use12Hours={this.props.timeFormat === 'HOUR12'}
                            onChange={this.selectEndTime}
                        />
                    </span>
                    <span>
                    <DatePicker
                        selected={moment(this.props.start)}
                        onChange={this.selectDate.bind(this)}
                        customInput={<img src="./assets/images/calendar.png"/>}
                        withPortal
                        maxDate={!this.props.end ?
                            moment(this.props.start) : moment().add(10, 'years')}
                        minDate={moment(new Date(this.state.dayAfterLockedEntries))}/>
                    </span>
                    <span className="duration-divider"></span>
                    <span className="ant-time-picker-small">
                        <MyDurationPicker id="durationTimePicker"
                            className={"duration-duration"}
                            isDisabled={!this.props.end}
                            defaultOpenValue={moment(this.props.time, 'HH:mm:ss')}
                            placeholder={this.props.workspaceSettings.trackTimeDownToSecond ?
                                "Duration (HH:mm:ss)" : "Duration (h:mm)"}
                            size="small"
                            format={this.props.workspaceSettings.trackTimeDownToSecond ? "HH:mm:ss" : "H:mm"}
                            onChange={this.selectDuration}
                        />
                    </span>
                </div>
            </div>
        )
    }
}

export default Duration;