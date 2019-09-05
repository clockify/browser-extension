import * as React from 'react';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import MyDatePicker from "./my-date-picker";
import {getAppTypes} from "../enums/applications-types.enum";
import {add24hIfEndBeforeStart} from "../helpers/time.helper";
import TimePicker from 'antd/lib/time-picker';
import {HtmlStyleHelper} from "../helpers/html-style-helper";
import {isAppTypeMobile} from "../helpers/app-types-helper";

const htmlStyleHelpers = new HtmlStyleHelper();
const dayInSeconds = 86400;
const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

class Duration extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            editDuration: false,
            datePickerOpen: false,
            timeFormat: this.props.timeFormat === 'HOUR12' ? 'h:mm A' : 'HH:mm',
            startTime: moment(this.props.timeEntry.timeInterval.start),
            endTime: moment(this.props.timeEntry.timeInterval.end),
            selectedDuration: null,
            dayAfterLockedEntries: 'January 1, 1970, 00:00:00 UTC',
            endTimeChanged: false,
            startTimeChanged: false
        }
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
            });
        }
    }

    selectEndTime(time) {
        if (time && !time.isSame(this.state.endTime)) {
            this.setState({
                endTime:time,
                endTimeChanged: true
            });
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
            });
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

    openStartTimePicker(event) {
        this.fadeBackgroundAroundTimePicker(event);
        if (!event) {
            if (this.state.startTime) {
                this.changeStart(this.state.startTime);
            }
        }
    }

    openEndTimePicker(event) {
        this.fadeBackgroundAroundTimePicker(event);
        if (!event) {
            if (this.state.endTime) {
                this.changeEnd(this.state.endTime);
            }
        }
    }

    render(){
        return (
            <div className="duration">
                <div className="duration-time">
                    <label className={!this.props.end ? "duration-label" : "disabled"}>Start:</label>
                    <TimePicker id="startTimePicker"
                                value={this.state.startTime}
                                className="duration-start"
                                format={this.state.timeFormat}
                                size="small"
                                use12Hours={this.props.timeFormat === 'HOUR12'}
                                inputReadOnly={isAppTypeMobile()}
                                onChange={this.selectStartTime.bind(this)}
                                onOpenChange={this.openStartTimePicker.bind(this)}
                    />
                    <label className={this.props.end ? "duration-dash" : "disabled"}>-</label>
                    <TimePicker id="endTimePicker"
                                className={this.props.end ? "duration-end" : "disabled"}
                                value={this.state.endTime}
                                size="small"
                                use12Hours={this.props.timeFormat === 'HOUR12'}
                                inputReadOnly={isAppTypeMobile()}
                                format={this.state.timeFormat}
                                onChange={this.selectEndTime.bind(this)}
                                onOpenChange={this.openEndTimePicker.bind(this)}
                    />
                    <span>
                        {
                            localStorage.getItem('appType') === getAppTypes().MOBILE ?
                                <MyDatePicker
                                    start={this.props.start}
                                    end={this.props.end}
                                    datePickerOpen={this.state.datePickerOpen}
                                    openDatePicker={this.openDatePicker.bind(this)}
                                    selectDate={this.selectDate.bind(this)}
                                    cancelDate={this.cancelDate.bind(this)}
                                    min={this.state.dayAfterLockedEntries}
                                />:
                                <DatePicker
                                    selected={moment(this.props.start)}
                                    onChange={this.selectDate.bind(this)}
                                    customInput={<img src="./assets/images/calendar.png"/>}
                                    withPortal
                                    maxDate={!this.props.end ?
                                        moment(this.props.start) : moment().add(10, 'years')}
                                    minDate={moment(new Date(this.state.dayAfterLockedEntries))}
                                />
                        }

                    </span>
                    <span className="duration-divider"></span>
                    <input
                        className={!this.state.editDuration ? "duration-duration" : "disabled"}
                        title={"Please write duration in the 'hh:mm:ss' format."}
                        value={this.props.time}
                        id="duration"
                        onClick={this.openPicker.bind(this)}
                    />
                    <TimePicker id="durationTimePicker"
                                className={this.state.editDuration ? "duration-duration" : "disabled"}
                                defaultOpenValue={moment(this.props.time, 'HH:mm:ss')}
                                placeholder={this.props.workspaceSettings.trackTimeDownToSecond ?
                                    "Duration (HH:mm:ss)" : "Duration (h:mm)"}
                                size="small"
                                format={this.props.workspaceSettings.trackTimeDownToSecond ? "HH:mm:ss" : "H:mm"}
                                inputReadOnly={isAppTypeMobile()}
                                onChange={this.selectDuration.bind(this)}
                                onOpenChange={this.openDurationPickerChange.bind(this)}
                    />
                </div>
            </div>
        )
    }
}

export default Duration;