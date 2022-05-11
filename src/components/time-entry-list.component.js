import moment from 'moment';
import * as React from 'react';
import TimeEntry from './time-entry.component';
import locales from "../helpers/locales";
import { isEqual } from 'lodash';

class TimeEntryList extends React.Component {

    constructor(props) {
        super(props);
    }

    playTimeEntry(timeEntry) {
        this.props.selectTimeEntry(timeEntry);
    }

    handleRefresh() {
        this.props.handleRefresh();
    }

    changeMode(mode) {
        this.props.changeMode(mode);
    }

    isSimilarEntry(entry1, entry2) {
        const { billable, isLocked, start, description, tags, projectId, taskId, customFieldValues } = entry1;
        const { billable: billable2, isLocked: isLocked2, start: start2,
                description: description2, tags: tags2, projectId: projectId2, taskId: taskId2, customFieldValues: customFieldValues2 } = entry2;
                
        if(billable === billable2 && isLocked === isLocked2 && 
            start === start2 && description === description2 && projectId === projectId2 &&
            taskId === taskId2 && tags.length === tags2.length && isEqual(tags, tags2) &&
            customFieldValues.every(cf => {
                const cf2 = customFieldValues2.find(cf2 => cf.customFieldId === cf2.customFieldId);
                return cf && cf2 && isEqual(cf.value, cf2.value)
            })
            ){
                return true
        }
        return false;
    }

    render() {
        const { isOffline } = this.props;
        if(this.props.isLoading && !this.props.timeEntries.length) {
            return <div><p className="loading-entries">{locales.TRACKER__ENTRY_MESSAGES__LOADING}</p></div>;
        }
        else if(this.props.timeEntries.length === 0 && !isOffline) {
            return (
                <div className="no-entries">
                    <div className="no-entries-img"></div>
                    <span>{locales.NO_RECENT_ENTRIES_TO_SHOW}</span>
                    <label>{locales.YOU_HAVE_NOT_TRACKED}.</label>
                </div>
            )
        } else if(this.props.timeEntries.length === 0 && isOffline) {
            return(
                    <div className="no-entries">
                        <div className="no-entries-img"></div>
                        <span>{locales.GET_ONLINE}.</span>
                        <label>{locales.YOU_CAN_STILL_TRACK_TIME}.</label>
                    </div>
            )
        } else {
            return(
                <div>
                    {
                        this.props.dates.map((day) => {
                            const groupedIndexes = [];
                            const parts = day.split("-");
                            const lastPart = parts.pop();
                            const firstPart = parts.join('-');
                            return (
                                <div className="time-entries-list" key={day}>
                                    <div className="time-entries-list-time">
                                        <span className="time-entries-list-day">{firstPart}</span>
                                        <div className="time-entries-total-and-time">
                                            <span className="time-entries-list-total">{locales.TOTAL}</span>
                                            <span className="time-entries-list-total-time">{lastPart}</span>
                                        </div>
                                    </div>
                                    {this.props.timeEntries.filter(timeEntry => timeEntry.start === firstPart)
                                    .sort((a, b) => {
                                        const aMoment = moment(a.timeInterval.end);
                                        const bMoment = moment(b.timeInterval.end);
                                        const aSeconds = aMoment.hours() * 3600 + aMoment.minutes() * 60 + aMoment.seconds();
                                        const bSeconds = bMoment.hours() * 3600 + bMoment.minutes() * 60 + bMoment.seconds();

                                        return aSeconds - bSeconds;
                                    })
                                    .map((timeEntry, index, array) => {
                                        let group = [];
                                        if(!this.props.userSettings?.groupSimilarEntriesDisabled){
                                            if(groupedIndexes.includes(index)){
                                                return null;
                                            }
                                            groupedIndexes.push(index);
                                            group = array.reduce((prev, curr, currIndex) => {
                                                if(currIndex !== index && this.isSimilarEntry(timeEntry, curr)){
                                                    groupedIndexes.push(currIndex);
                                                    prev.push(curr);
                                                }
                                                return prev
                                            }, []);
                                            if(group.length){
                                                group.unshift(timeEntry);
                                            }
                                        }
                                        return (
                                            <TimeEntry
                                                key={timeEntry.id}
                                                timeEntry={timeEntry}
                                                project={timeEntry.project ? timeEntry.project : null}
                                                task={timeEntry.task ? timeEntry.task : null}
                                                playTimeEntry={this.playTimeEntry.bind(this)}
                                                changeMode={this.changeMode.bind(this)}
                                                timeFormat={this.props.timeFormat}
                                                workspaceSettings={this.props.workspaceSettings}
                                                features={this.props.features}
                                                isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
                                                userSettings={this.props.userSettings}
                                                groupedEntries={group}
                                            />
                                        )
                                    }).reverse()}
                                </div>
                            )
                        })
                    }
                </div>
            )
        }
    }
}

export default TimeEntryList;