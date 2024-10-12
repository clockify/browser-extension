import * as React from 'react';
import moment from 'moment';
import { parseInput } from './time-input-converter';
import locales from '../helpers/locales';

class MyTimePicker extends React.Component {
	constructor(props) {
		super(props);
		const { size, use12Hours } = props;
		this.state = {
			formatIs24Hour: !use12Hours,
			totalTime: '',
			totalTimeBackup: '',
			momentTimeDate: null,
			disableEdit: false,
		};

		this.inputRef = React.createRef();

		this.setFocus = this.setFocus.bind(this);
		this.onChange = this.onChange.bind(this);
		this.setTime = this.setTime.bind(this);
		this.formatTo24Hour = this.formatTo24Hour.bind(this);

		this.handleKeyUp = this.handleKeyUp.bind(this);
		this.doTheJob = this.doTheJob.bind(this);
	}

	doTheJob() {
		const value = this.props.isDisabled ? moment() : this.props.value;
		if (value) {
			let momentTimeDate = value.clone();
			let totalTime = moment(momentTimeDate).format(this.props.format).toString(); //'h:mmA').toString();
			if (this.state.formatIs24Hour) {
				totalTime = this.formatTo24Hour(totalTime);
			}
			const totalTimeBackup = totalTime;
			this.setState(
				{
					momentTimeDate,
					totalTime,
					totalTimeBackup,
				},
				() => {}
			);
		}
	}

	componentDidMount() {
		this.doTheJob();
	}

	componentDidUpdate(prevProps, prevState) {
		if (
			!this.props.isDisabled &&
			this.props.value &&
			!prevProps?.value?.isSame(this.props.value)
		) {
			this.doTheJob();
		}
	}

	onChange(e) {
		this.setState({ totalTime: e.target.value });
	}

	setFocus() {
		if (this.state.disableEdit) return;
		if (this.props.editDisabled) return;
		setTimeout(() => this.inputRef.current.select(), 0);
		this.setState({ totalTime: this.state.totalTime.split(':').join('') });
	}

	handleKeyUp(e) {
		if (e.key === 'Enter') {
			this.inputRef.current.blur();
		}
	}

	setTime() {
		if (this.props.editDisabled) return;

		let newInput = parseInput(this.state.totalTime.trim().replace(/ /g, ''));
		if (!newInput || !this.state.totalTime.trim()) {
			// user enter invalid date
			this.setState({ totalTime: this.state.totalTimeBackup }, () => {});
			return;
		}

		if (newInput.indexOf(':') < 0) {
			newInput = newInput.substring(0, 2).concat(':').concat(newInput.substring(2, 4));
		}

		const newDate = this.state.momentTimeDate.clone();
		if (newDate.isValid()) {
			let momentTimeDate = this.state.momentTimeDate;
			// date is valid
			const newHours = Number(newInput.split(':')[0]);
			const newMinutes = Number(newInput.split(':')[1]);
			const date = momentTimeDate.date();

			newDate.hours(newHours);
			newDate.minutes(newMinutes);
			newDate.date(date);

			const oldMinutes = momentTimeDate.minutes();
			const oldHours = momentTimeDate.hours();

			if (oldMinutes !== newMinutes || oldHours !== newHours) {
				newDate.set({ second: 0, millisecond: 0 });
			}

			momentTimeDate = newDate.clone();
			let newTime = momentTimeDate.format(this.props.format).toString(); // 'h:mmA'
			if (this.state.formatIs24Hour) {
				newTime = this.formatTo24Hour(newTime);
			}
			if (newTime !== this.state.totalTimeBackup) {
				this.setState({ totalTimeBackup: newTime });
			}
			this.setState({ totalTime: newTime, momentTimeDate }, () =>
				this.props.onChange(newDate)
			);
		} else {
			// user enter invalid date
			this.setState({ totalTime: totalTimeBackup });
		}
	}

	formatTo24Hour(totalTime) {
		return moment(totalTime, ['h:mmA']).format('HH:mm').toString();
	}

	render() {
		const className = `${this.props.className}${
			this.props.editDisabled ? ' disable-manual' : ''
		}`;
		return (
			<input
				id={this.props.id}
				ref={this.inputRef}
				className={className}
				style={this.props.style}
				autoComplete="off"
				type="text"
				placeholder={locales.SELECT}
				tabIndex={'0'}
				spellCheck="false"
				disabled={false}
				readOnly={this.props.editDisabled}
				value={this.state.totalTime}
				onChange={this.onChange}
				onBlur={this.setTime}
				onKeyUp={this.handleKeyUp}
				onFocus={this.setFocus}
				title={this.props.title}
			/>
		);
	}
}

export default MyTimePicker;
