import * as React from 'react';
import moment from 'moment';
import {parseTimeEntryDuration} from './duration-input-converter';
import DatePicker from 'react-datepicker';
import MyDatePicker from "./my-date-picker";
import {parseInput} from "./time-input-converter"
import {getAppTypes} from "../enums/applications-types.enum";
import {add24hIfEndBeforeStart} from "../helpers/time.helpers";

class Duration extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            changeStart: false,
            changeEnd: false,
            changeDuration: false,
            datePickerOpen: false
        }
    }

    componentDidMount(){
    }

    getStartTime(event) {
        document.getElementById('start_time_edit').value = event.target.value;
        this.setState({
            changeStart: true
        })
    }

    changeStart(event) {
        const startFromInput = parseInput(event.target.value);
        this.props.timeEntry.timeInterval.start =
            moment(this.props.timeEntry.timeInterval.start)
                .hour(parseInt(startFromInput.substring(0, 2)))
                .minutes(parseInt(startFromInput.substring(2, 4)));
        this.props.timeEntry.timeInterval.end = add24hIfEndBeforeStart(
            this.props.timeEntry.timeInterval.start,
            this.props.timeEntry.timeInterval.end
        );

        this.props.changeInterval(this.props.timeEntry.timeInterval);
        this.setState({
            changeStart: false
        })

    }

    getEndTime(event) {
        document.getElementById('end_time_edit').value = event.target.value;
        this.setState({
            changeEnd: true
        });
    }

    changeEnd(event) {
        const endFromInput = parseInput(event.target.value);
        const endTime = moment(this.props.timeEntry.timeInterval.end)
                            .hour(parseInt(endFromInput.substring(0, 2)))
                            .minutes(parseInt(endFromInput.substring(2, 4)));

        this.props.timeEntry.timeInterval.end = add24hIfEndBeforeStart(
            this.props.timeEntry.timeInterval.start,
            endTime
        );

        this.props.changeInterval(this.props.timeEntry.timeInterval);
        this.setState({
            changeEnd: false
        })
    }

    getCurrentDuration(event) {
        document.getElementById('duration_edit').value = event.target.value;
        this.setState({
            changeDuration: true
        })
    }

    changeDuration(event) {
        let duration = parseTimeEntryDuration(event.target.value);
        this.props.changeDuration(duration);
        this.setState({
            changeDuration: false
        })
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

    render(){

        return (
            <div className="duration">
                <div className="duration-time">
                    <label className={!this.props.end ? "duration-label" : "disabled"}>Start:</label>
                    <input
                        className={!this.state.changeStart ? "duration-start" : "disabled"}
                        value={this.props.timeFormat === 'HOUR12' ?
                            moment(this.props.start).format('h:mm A') :
                            moment(this.props.start).format('HH:mm')}
                        title={"Change start time."}
                        id="start_time"
                        autoComplete="off"
                        onFocus={this.getStartTime.bind(this)}
                    />
                    <input
                        className={this.state.changeStart ? "duration-start" : "disabled"}
                        title={"Change start time."}
                        id={"start_time_edit"}
                        onBlur={this.changeStart.bind(this)}
                    />
                    <label className={this.props.end ? "duration-label" : "disabled"}>-</label>
                    <input
                        className={!this.state.changeEnd && this.props.end ? "duration-end" : "disabled"}
                        value={this.props.timeFormat === 'HOUR12' ?
                            moment(this.props.end).format('h:mm A') :
                            moment(this.props.end).format('HH:mm')}
                        title={"Change end time."}
                        id="end_time"
                        onFocus={this.getEndTime.bind(this)}
                    />
                    <input
                        className={this.state.changeEnd && this.props.end ? "duration-end" : "disabled"}
                        title={"Change end time."}
                        id={"end_time_edit"}
                        onBlur={this.changeEnd.bind(this)}
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
                                />:
                                <DatePicker
                                    selected={moment(this.props.start)}
                                    onChange={this.selectDate.bind(this)}
                                    customInput={<img src="./assets/images/calendar.png"/>}
                                    withPortal
                                    maxDate={!this.props.end ? moment(this.props.start) : moment().add(10, 'years')}
                                />
                        }

                    </span>

                    <input
                        className={!this.state.changeDuration ? "duration-duration" : "disabled"}
                        title={"Please write duration in the 'hh:mm:ss' format."}
                        value={this.props.time}
                        id="duration"
                        onFocus={this.getCurrentDuration.bind(this)}
                    />
                    <input
                        className={this.state.changeDuration ? "duration-duration" : "disabled"}
                        title={"Please write duration in the 'hh:mm:ss' format."}
                        id="duration_edit"
                        onBlur={this.changeDuration.bind(this)}
                    />
                </div>
            </div>
        )
    }
}

export default Duration;