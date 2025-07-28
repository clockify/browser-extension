import React, { MouseEventHandler, useEffect, useState } from 'react';
import EditFormManual from '~/components/edit-form-manual.component';
import { WorkspaceSettingsDto } from '~/DTOs/WorkspaceSettingsDto';
import { UserSettingsDto } from '~/DTOs/UserSettingsDto';
import moment, { duration } from 'moment/moment';

interface PropsInterface {
	timeEntries: any[];
	workspaceSettings: WorkspaceSettingsDto;
	timeFormat: string;
	userSettings: UserSettingsDto;
	triggerOfflineEntrySync: MouseEventHandler;
	inProgress: boolean;
}

export const TimeEntryListNotSynced = (props: PropsInterface): React.JSX.Element => {
	const [timeEntries, setTimeEntries] = useState([]);

	useEffect((): void => {
		formatDurationOnUnSyncedEntries();
	}, [props.timeEntries.length]);

	const syncEntry = (event: any): void => {
		let timeEntry = JSON.parse(event.target.getAttribute('value'));

		window.reactRoot.render(
			<EditFormManual
				timeEntry={timeEntry}
				workspaceSettings={props.workspaceSettings}
				timeFormat={props.timeFormat}
				userSettings={props.userSettings}
			/>,
		);
	};

	const formatDurationOnUnSyncedEntries = (): void => {
		if (!props.timeEntries) return;

		const timeEntries: any[] = [];

		props.timeEntries.forEach((timeEntry) => {
			if (!props.workspaceSettings.trackTimeDownToSecond) {
				const diffInSeconds =
					moment(timeEntry.timeInterval.end).diff(
						timeEntry.timeInterval.start,
					) / 1000;
				if (diffInSeconds % 60 > 0) {
					timeEntry.timeInterval.end = moment(timeEntry.timeInterval.end).add(
						60 - (diffInSeconds % 60),
						'seconds',
					);
				}
			}

			timeEntry.timeInterval.duration = duration(
				moment(timeEntry.timeInterval.end).diff(timeEntry.timeInterval.start),
			).format(
				props.workspaceSettings.trackTimeDownToSecond
					? 'HH:mm:ss'
					: 'h:mm',
				{ trim: false },
			);

			timeEntries.push(timeEntry);
		});

		setTimeEntries(timeEntries);
	};

	return (
		<div className="time-entries-list-not-synced">
			<div className="time-entries-list-time">
					<span className="time-entries-list-day">
						Entries not synced - missing info
					</span>
				<div
					onClick={props.triggerOfflineEntrySync}
					title={'Sync entries'}
					className={'header-sync'}
					style={{ position: 'absolute', right: '0px', top: '10px' }}
				></div>
			</div>
			{timeEntries &&
				!props.inProgress &&
				timeEntries.map((entry: any) => {
					return (
						<div
							className="time-entry-not-synced"
							key={entry.id}
							value={JSON.stringify(entry)}
							onClick={syncEntry}
							title="Can't sync while the required field is empty."
						>
								<span
									value={JSON.stringify(entry)}
									className={
										!!entry.description
											? 'time-entry-not-synced-description'
											: 'time-entry-not-synced-placeholder'
									}
								>
									{!!entry.description ? entry.description : 'No description'}
								</span>
							<span
								value={JSON.stringify(entry)}
								className="time-entry-not-synced-time"
							>
									{entry.timeInterval.duration}
								</span>
							<span
								value={JSON.stringify(entry)}
								className="time-entry-not-synced-sync"
							></span>
						</div>
					);
				})}
		</div>
	);
};