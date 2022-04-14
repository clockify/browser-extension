import * as React from 'react';
import DatePicker, { registerLocale } from "react-datepicker";

class MyDatePicker extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            lang: 'en'
        };
    }

    componentDidMount() {
        const lang = await localStorage.getItem('lang');
        this.setState({
            lang
        });
    }

    shouldComponentUpdate(nextProps, nextState) {
        if(nextProps.datePickerOpen !== this.props.datePickerOpen) {
            return true;
        }

        if(nextProps.start !== this.props.start) {
            return true;
        }

        if(nextProps.end !== this.props.end) {
            return true;
        }

        return false;
    }

    openDatePicker() {
        this.props.openDatePicker();
    }

    selectDate(date) {
        this.props.selectDate(date);
    }

    cancelDate() {
        this.props.cancelDate();
    }

    render() {

        return (
            <div className="date-picker">
                <div onClick={this.openDatePicker.bind(this)}>
                    <img src="./assets/images/calendar.png" className="date-picker-img"/>
                </div>
                <DatePicker
                    value={new Date(this.props.start)}
                    isOpen={this.props.datePickerOpen}
                    onSelect={this.selectDate.bind(this)}
                    onCancel={this.cancelDate.bind(this)}
                    confirmText={"Confirm"}
                    cancelText={"Cancel"}
                    max={this.props.end ? new Date(2050, 0, 1) : new Date()}
                    min={this.props.min}
                    locale={this.state.lang}
                />
            </div>
        )
    }
}

export default MyDatePicker;