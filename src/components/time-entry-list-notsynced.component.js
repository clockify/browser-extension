import React from "react";
import * as ReactDOM from 'react-dom';
import {duration} from 'moment';
import EditFormManual from "./edit-form-manual.component";
import Pullable from 'react-pullable'

class TimeEntryListNotsyncedComponent extends React.Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {

    }

    handleRefresh() {
        this.props.handleRefresh();
    }

    syncEntry(event){
        let timeEntry = JSON.parse(event.target.getAttribute('value'));
        ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
        ReactDOM.render(<EditFormManual timeEntry={timeEntry}
                                        workspaceSettings={this.props.workspaceSettings}
                                        timeFormat={this.props.timeFormat}
                                        isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}/>, document.getElementById('mount'));
    }

    render() {
        return(
            <Pullable
                disabled={this.props.pullToRefresh}
                onRefresh={this.handleRefresh.bind(this)}>

                <div className="time-entries-list-not-synced">
                    <div className="time-entries-list-time">
                        <span className="time-entries-list-day">Not synced - missing info</span>
                    </div>
                        {
                            this.props.timeEntries && this.props.timeEntries.map(entry => {
                            return (
                               <div className="time-entry-not-synced"
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
                                       {duration(entry.timeInterval.duration).format('HH:mm:ss', {trim: false})}
                                   </span>
                                   <span value={JSON.stringify(entry)}
                                         className="time-entry-not-synced-sync">
                                   </span>
                               </div>
                               )
                            })

                        }
                </div>

            </Pullable>
        )
    }
}

export default TimeEntryListNotsyncedComponent;