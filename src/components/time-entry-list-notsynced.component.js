import React from "react";
import * as ReactDOM from 'react-dom';
import moment, {duration} from 'moment';
import EditFormManual from "./edit-form-manual.component";

class TimeEntryListNotsyncedComponent extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            timeEntries: []
        }
    }

    componentDidMount() {
        this.formatDurationOnUnsyncedEntries();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.timeEntries.length !== this.props.timeEntries.length) {
            this.formatDurationOnUnsyncedEntries();
        }
    }

    handleRefresh() {
        this.props.handleRefresh();
    }

    syncEntry(event){
        let timeEntry = JSON.parse(event.target.getAttribute('value'));
        ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
        ReactDOM.render(
            <EditFormManual 
                timeEntry={timeEntry}
                workspaceSettings={this.props.workspaceSettings}
                timeFormat={this.props.timeFormat}
                userSettings={this.props.userSettings}
            />,
        document.getElementById('mount')
        );
    }
    formatDurationOnUnsyncedEntries() {
        if (!this.props.timeEntries) {
            return;
        }
        const timeEntries = [];

        this.props.timeEntries.forEach(timeEntry => {
            if (!this.props.workspaceSettings.trackTimeDownToSecond) {
                const diffInSeconds = moment(timeEntry.timeInterval.end)
                    .diff(timeEntry.timeInterval.start) / 1000;
                if (diffInSeconds%60 > 0) {
                    timeEntry.timeInterval.end =
                        moment(timeEntry.timeInterval.end).add(60 - diffInSeconds%60, 'seconds');
                }
            }

            timeEntry.timeInterval.duration =
                duration(moment(timeEntry.timeInterval.end)
                    .diff(timeEntry.timeInterval.start))
                    .format(this.props.workspaceSettings.trackTimeDownToSecond ? 'HH:mm:ss' : 'h:mm', {trim: false});

            timeEntries.push(timeEntry);
        });
        this.setState({
            timeEntries: timeEntries
        })
    }

    render() {
        return(
            <div className="time-entries-list-not-synced">
                <div className="time-entries-list-time">
                    <span className="time-entries-list-day">Not synced - missing info</span>
                </div>
                    {
                        this.state.timeEntries && this.state.timeEntries.map(entry => {
                        return (
                            <div className="time-entry-not-synced"
                                key={entry.id}
                                value={JSON.stringify(entry)}
                                onClick={this.syncEntry.bind(this)}
                                title="Can't sync while the required field is empty.">
                                <span value={JSON.stringify(entry)}
                                        className={!!entry.description ?
                                            "time-entry-not-synced-description" :
                                            "time-entry-not-synced-placeholder"}>
                                    {!!entry.description ? entry.description : "What's up"}
                                </span>
                                <span value={JSON.stringify(entry)}
                                        className="time-entry-not-synced-time">
                                    {entry.timeInterval.duration}
                                </span>
                                <span value={JSON.stringify(entry)}
                                        className="time-entry-not-synced-sync">
                                </span>
                            </div>
                            )
                        })
                    }
            </div>
        )
    }
}

export default TimeEntryListNotsyncedComponent;