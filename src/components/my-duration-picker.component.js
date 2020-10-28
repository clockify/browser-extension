import * as React from 'react';
import moment, {utc} from 'moment';
import {parseTimeEntryDuration} from './time-input-parser'

class MyDurationPicker extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            timeEntryDurationInput: '',
            timeEntryDurationInputBackup: '',
            momentTimeDate: null,
            disableEdit: false
        }

        this.inputRef = React.createRef();

        this.setFocus = this.setFocus.bind(this)
        this.onChange = this.onChange.bind(this)
        this.setDuration = this.setDuration.bind(this);

        this.handleKeyUp = this.handleKeyUp.bind(this); 
        this.doTheJob = this.doTheJob.bind(this)
    }

    doTheJob() {
      const {defaultOpenValue, format} = this.props;

      let timeEntryDurationInput;
      if(!defaultOpenValue || defaultOpenValue === '00:00:00' || defaultOpenValue === '0:00') {
        timeEntryDurationInput = props.defaultOpenValue;
      } else {
        timeEntryDurationInput = parseTimeEntryDuration(defaultOpenValue.format(format), format);
      }

      this.setState({
        timeEntryDurationInput, 
        timeEntryDurationInputBackup: timeEntryDurationInput || ''
      })
    }

    componentDidMount(){
      this.doTheJob();
    }

    componentDidUpdate(prevProps, prevState) {
      if (prevProps.defaultOpenValue !== this.props.defaultOpenValue) {
        this.doTheJob();
      }
    }

    onChange(e) {
      this.setState({ timeEntryDurationInput : e.target.value })
    }

    setFocus(e) {
        if (this.state.disableEdit)
          return;
        this.inputRef.current.select()
    }

    handleKeyUp(e) {
      if (e.key === 'Enter') {
          this.inputRef.current.blur(); 
      }
    }
    
    setDuration() {
      let timeEntryDurationInput = this.state.timeEntryDurationInput.trim();
      const newDuration = parseTimeEntryDuration(timeEntryDurationInput, this.props.format);
      const isValidDuration = !!newDuration;
      if (!isValidDuration && this.timeEntryDurationInput) {
        this.setState({timeEntryDurationInput: this.state.timeEntryDurationBackup})
          return;
      }
      const isEmpty = newDuration === '00:00:00' || newDuration === '00:00' || !newDuration;
      timeEntryDurationInput = isEmpty ? '' : newDuration;
      if (timeEntryDurationInput !== this.state.timeEntryDurationBackup) {
        this.setState({timeEntryDurationInput}, () => this.props.onChange(null, timeEntryDurationInput));
      }
      this.setState({timeEntryDurationBackup: timeEntryDurationInput});
    }
    
    render(){
        return (
            <input
                id={this.props.id}
                ref={this.inputRef}
                className={this.props.className}
                autoComplete="off"
                type="text"
                placeholder="Select time"
                tabIndex={"0"}
                spellCheck = "false"
                disabled={this.props.isDisabled}
                readOnly={false}
                value={this.state.timeEntryDurationInput}
                onChange={this.onChange}
                onBlur={this.setDuration}
                onKeyUp={this.handleKeyUp}
                onFocus={this.setFocus}
                placement="left"
                title={`Please write duration in the '${this.props.format}' format.`}
            />
        )
    }
} 

export default MyDurationPicker;